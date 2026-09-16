# Product of Array Except Self - 238

from typing import List


class Solution:
    def productExceptSelf(self, nums: List[int]) -> List[int]:
        if (len(nums) == 2):
            return [nums[1], nums[0]]

        res = [1] * len(nums)

        prefix = 1
        # prefix represents the product of all elements to the left.
        for i in range(len(nums)):
            res[i] = prefix
            prefix *= nums[i]

        postfix = 1
        # postfix represents the product of all elements to the right.
        for i in range(len(nums) -1, -1, -1):
            res[i] *= postfix
            postfix *= nums[i]

        return res
