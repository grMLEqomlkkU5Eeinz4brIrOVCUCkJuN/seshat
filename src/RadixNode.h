#pragma once
#include <cstddef>
#include <cstdint>
#include <cstring>
#include <memory>
#include <string>
#include <string_view>
#include <vector>

// the reason why i decided to make this into a class instead for now is because
// this better introduces an opportunity for parallelism, think of thread safety
// and mutexes.

// A 16-byte small-buffer string for radix edge labels. std::string costs 32
// bytes on libstdc++ regardless of content, and trie keys average ~4 chars, so
// most of that was inline buffer we never filled. CompactKey inlines up to 15
// bytes and spills to the heap only for longer keys.
//
// Layout: byte 15 is the discriminator. When its high bit is clear it doubles
// as the inline length (0..15); when set, the key lives on the heap and the
// first 12 bytes hold {char* ptr, uint32 len}. The discriminator sits at the
// same fixed offset in both arms, so the type is endianness-independent. Radix
// keys never need a capacity field (a key is assigned once and then only ever
// replaced wholesale or shortened to a substring of itself), so the heap arm
// stores just the pointer and length.
class CompactKey {
	static constexpr std::uint8_t kHeapFlag = 0x80;
	static constexpr std::size_t kInlineCap = 15;

	union {
		struct {
			char buf[15];
			std::uint8_t disc;
		} inl;
		struct {
			char *ptr;
			std::uint32_t len;
			std::uint8_t pad[3];
			std::uint8_t disc;
		} hp;
	};

	// The discriminator byte is always read through inl.disc: both arms place it
	// at the same offset, and this mirrors how production SSO strings type-pun
	// their length/flag byte.
	bool heap() const noexcept { return (inl.disc & kHeapFlag) != 0; }
	void destroy() noexcept {
		if (heap())
			delete[] hp.ptr;
	}
	// Initialises from raw bytes assuming no prior heap buffer is owned.
	void init(const char *s, std::size_t n) {
		if (n <= kInlineCap) {
			std::memcpy(inl.buf, s, n);
			inl.disc = static_cast<std::uint8_t>(n);
		} else {
			char *p = new char[n];
			std::memcpy(p, s, n);
			hp.ptr = p;
			hp.len = static_cast<std::uint32_t>(n);
			hp.disc = kHeapFlag;
		}
	}

  public:
	CompactKey() noexcept { inl.disc = 0; }
	CompactKey(std::string_view sv) { init(sv.data(), sv.size()); }
	~CompactKey() { destroy(); }

	CompactKey(CompactKey &&o) noexcept {
		// Steal the raw 16 bytes (the heap pointer included); the bytes are
		// POD, the void* cast just tells the compiler we mean a byte copy.
		std::memcpy(static_cast<void *>(this), static_cast<const void *>(&o),
					sizeof(CompactKey));
		o.inl.disc = 0; // source becomes empty inline
	}
	CompactKey &operator=(CompactKey &&o) noexcept {
		if (this != &o) {
			destroy();
			std::memcpy(static_cast<void *>(this), static_cast<const void *>(&o),
						sizeof(CompactKey));
			o.inl.disc = 0;
		}
		return *this;
	}
	CompactKey(const CompactKey &o) { init(o.data(), o.size()); }
	CompactKey &operator=(const CompactKey &o) {
		if (this != &o)
			assign(o.data(), o.size());
		return *this;
	}

	const char *data() const noexcept { return heap() ? hp.ptr : inl.buf; }
	std::size_t size() const noexcept { return heap() ? hp.len : inl.disc; }
	std::size_t length() const noexcept { return size(); }
	bool empty() const noexcept { return size() == 0; }
	char front() const noexcept { return data()[0]; }
	bool is_inlined() const noexcept { return !heap(); }
	// Bytes this key requested from the heap (0 when inlined).
	std::size_t heap_bytes() const noexcept { return heap() ? hp.len : 0; }

	operator std::string_view() const noexcept { return {data(), size()}; }

	// Replaces the key. `s` may point into this key's own storage (split_node
	// shortens a key to a suffix of itself), so the bytes are copied out before
	// any existing heap buffer is released.
	void assign(const char *s, std::size_t n) {
		if (n <= kInlineCap) {
			char tmp[kInlineCap];
			std::memcpy(tmp, s, n);
			destroy();
			std::memcpy(inl.buf, tmp, n);
			inl.disc = static_cast<std::uint8_t>(n);
		} else {
			char *p = new char[n];
			std::memcpy(p, s, n);
			destroy();
			hp.ptr = p;
			hp.len = static_cast<std::uint32_t>(n);
			hp.disc = kHeapFlag;
		}
	}
};

static_assert(sizeof(CompactKey) == 16, "CompactKey must stay 16 bytes");

class RadixNode {
  public:
	CompactKey key;
	bool is_end = false;
	// Children are stored as bare owning pointers, sorted by the first character
	// of each child's key. The first character used to be cached alongside the
	// pointer in a std::pair<char, unique_ptr>, but that char is always equal to
	// child->key.front() (the radix invariant), and the pair padded out to 16
	// bytes per edge. Dropping it halves the per-edge cost to 8 bytes.
	std::vector<std::unique_ptr<RadixNode>> children;

	RadixNode() = default;
	explicit RadixNode(std::string_view k) : key(k) {}

	// Nodes are allocated by the millions, one malloc per node. A class-scoped
	// pool allocator (see RadixNode.cc) hands them out from large blocks, which
	// removes the per-allocation malloc header/rounding overhead from the
	// resident set and speeds up bulk loads. RadixNode must not be subclassed,
	// since the pool assumes every allocation is exactly sizeof(RadixNode).
	static void *operator new(std::size_t size);
	static void operator delete(void *ptr) noexcept;
};
