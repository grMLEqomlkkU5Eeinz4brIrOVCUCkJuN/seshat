#include "RadixNode.h"

#include <cassert>
#include <cstddef>
#include <mutex>
#include <new>
#include <vector>

// Class-scoped pool allocator for RadixNode.
//
// A radix trie holds millions of nodes, and the previous one-malloc-per-node
// scheme paid a per-allocation allocator header plus alignment rounding on
// every single one (tens of megabytes of resident memory that get_memory_stats
// never sees, since it only counts bytes the program itself asked for). Handing
// nodes out of large pre-allocated blocks removes that surcharge and speeds up
// bulk loads, because the hot path is a pointer bump instead of a trip through
// the general allocator.
//
// Thread-safety: insertFromFileAsync runs a bulk load on a libuv worker thread,
// and a process may build several independent tries at once, so allocation can
// happen from more than one thread. The design keeps the per-node path
// lock-free by giving each thread its own free list and bump pointer; the only
// shared state is the registry of blocks, which is touched once every
// kSlotsPerBlock allocations.

namespace {

// One slot is either a live node's storage or, once freed, a link in a free
// list. Sized and aligned for RadixNode.
union Slot {
	Slot *next;
	alignas(RadixNode) unsigned char storage[sizeof(RadixNode)];
};

constexpr std::size_t kSlotsPerBlock = 8192;

std::mutex &block_mutex() {
	static std::mutex m;
	return m;
}

// Blocks are owned for the whole process lifetime and never returned to the OS.
// That permanence is what makes cross-thread frees safe: a node allocated on
// one thread and destroyed on another lands on the destroying thread's free
// list, still pointing at memory that stays mapped. Intentionally leaked (never
// destructed) to sidestep static-destruction-order hazards with nodes that may
// be torn down as other globals unwind at exit.
std::vector<Slot *> &global_blocks() {
	static auto *blocks = new std::vector<Slot *>();
	return *blocks;
}

Slot *acquire_block() {
	Slot *block = new Slot[kSlotsPerBlock];
	std::lock_guard<std::mutex> lock(block_mutex());
	global_blocks().push_back(block);
	return block;
}

// Per-thread allocator state. Both live entirely on the hot path with no
// synchronization; only acquire_block() ever locks.
thread_local Slot *tl_free = nullptr;
thread_local Slot *tl_block = nullptr;
thread_local std::size_t tl_remaining = 0;

} // namespace

void *RadixNode::operator new(std::size_t size) {
	// RadixNode is a leaf type (never subclassed), so the requested size is
	// always exactly one slot. The pool cannot serve any other size.
	assert(size == sizeof(RadixNode));
	(void)size;

	if (tl_free) {
		Slot *s = tl_free;
		tl_free = s->next;
		return s;
	}

	if (tl_remaining == 0) {
		tl_block = acquire_block();
		tl_remaining = kSlotsPerBlock;
	}

	Slot *s = tl_block++;
	--tl_remaining;
	return s;
}

void RadixNode::operator delete(void *ptr) noexcept {
	if (!ptr) {
		return;
	}
	Slot *s = static_cast<Slot *>(ptr);
	s->next = tl_free;
	tl_free = s;
}
