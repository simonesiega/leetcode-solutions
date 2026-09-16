# Longest Consecutive Sequence - 128

from typing import List


class Solution:
    def longestConsecutive(self, nums: List[int]) -> int:
        # use a set for unique values and expected O(1) membership checks.
        numbers = set(nums)
        longest = 0

        for number in numbers:
            # only count from values that begin a consecutive sequence.
            if number - 1 not in numbers:
                current = number + 1
                counter = 1

                while (current in numbers):
                    current += 1
                    counter += 1

                longest = max(longest, counter)

        return longest
