#pragma once
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
	std::vector<std::pair<char, std::unique_ptr<RadixNode>>> children;

	RadixNode() = default;
	explicit RadixNode(std::string k) : key(std::move(k)) {}
};
