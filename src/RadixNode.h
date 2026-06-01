#pragma once
#include <cstddef>
#include <memory>
#include <string>
#include <string_view>
#include <vector>

// the reason why i decided to make this into a class instead for now is because
// this better introduces an opportunity for parallelism, think of thread safety
// and mutexes.

class RadixNode {
  public:
	std::string key;
	bool is_end = false;
	// Children are stored as bare owning pointers, sorted by the first character
	// of each child's key. The first character used to be cached alongside the
	// pointer in a std::pair<char, unique_ptr>, but that char is always equal to
	// child->key.front() (the radix invariant), and the pair padded out to 16
	// bytes per edge. Dropping it halves the per-edge cost to 8 bytes.
	std::vector<std::unique_ptr<RadixNode>> children;

	RadixNode() = default;
	explicit RadixNode(std::string k) : key(std::move(k)) {}

	// Nodes are allocated by the millions, one malloc per node. A class-scoped
	// pool allocator (see RadixNode.cc) hands them out from large blocks, which
	// removes the per-allocation malloc header/rounding overhead from the
	// resident set and speeds up bulk loads. RadixNode must not be subclassed,
	// since the pool assumes every allocation is exactly sizeof(RadixNode).
	static void *operator new(std::size_t size);
	static void operator delete(void *ptr) noexcept;
};
