# Concatenation of Array - 1929

from typing import List


class Solution:
    def getConcatenation(self, nums: List[int]) -> List[int]:
        len_nums = len(nums)

        res = [0] * (2 * len_nums)

        for i in range(len_nums):
            res[i] = res[i + len_nums] = nums[i]

        return res
