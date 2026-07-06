# Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].

class Solution:
    def productExceptSelf(self, nums: List[int]) -> List[int]:
        # If the length of nums is 2, return the reversed list since each element's product except itself is the other element
        if (len(nums) == 2):
            return [nums[1], nums[0]]
        
        res = [1] * len(nums)

        prefix = 1
        # The prefix rapresents the product of all the elements to the left of the current index
        for i in range(len(nums)):
            res[i] = prefix
            prefix *= nums[i]
        
        postfix = 1
        # The postfix represents the product of all the elements to the right of the current index
        for i in range(len(nums) -1, -1, -1):
            res[i] *= postfix
            postfix *= nums[i]

        return res