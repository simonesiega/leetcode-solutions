# Two Sum - 1

from typing import List


class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        # with exactly one valid pair, a two-item input must use both indices.
        if len(nums) == 2:
            return [0, 1]

        seen = {}

        for index, num in enumerate(nums):
            complement = target - num

            # check before storing so one element cannot match itself.
            if complement in seen:
                return [index, seen[complement]]

            seen[num] = index

        return []
