# Given an unsorted integer array nums, return the length of its longest
# consecutive sequence. The algorithm must run in O(n) time.

from typing import List

class Solution:
    def longestConsecutive(self, nums: List[int]) -> int:
        # A set removes duplicates and provides expected O(1) membership checks.
        numbers = set(nums)
        longest = 0

        for number in numbers:

            # Only count from values that begin a consecutive sequence.
            if number - 1 not in numbers:

                current = number + 1
                counter = 1

                while (current in numbers):
                    current += 1
                    counter += 1
                
                # Update the longest sequence length if the current sequence is longer than the previously recorded longest.
                longest = max(longest, counter)

        return longest