# Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.
# You may assume that each input would have exactly one solution, and you may not use the same element twice.

class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        # Because the problem states that there is exactly one solution, 
        # if the length of nums is 2 the solution must be the two indices 0 and 1
        if len(nums) == 2:
            return [0, 1]

        dic = {}

        # Loop through the nums array and for each number, calculate the difference between the target and the current number.
        for i, n in enumerate(nums):
            diff = target - n
            
            # Check if the difference is already in the dictionary. 
            # If it is, return the current index and the index of the difference from the dictionary.
            if (diff in dic):
                return [i, dic[diff]]

            dic[n] = i

        return