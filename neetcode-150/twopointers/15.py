# Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.

class Solution:
    def threeSum(self, nums: list[int]) -> list[list[int]]:
        res = []

        # Sort the input array to facilitate the two-pointer approach and to easily skip duplicates.
        nums.sort()

        # Iterate through the sorted array, treating each element as a potential first element of a triplet.
        for i, first in enumerate(nums):

            # If the first element is positive, no more triplets can sum to zero.
            if first > 0:
                return res

            # Skip duplicate elements to avoid duplicate triplets in the result.
            if i > 0 and first == nums[i - 1]:
                continue
            
            left, right = i + 1, len(nums) - 1
            
            # Two Sum approach: Use two pointers to find pairs that, along with the first element, sum to zero.
            while left < right:
                total = first + nums[left] + nums[right]

                if total < 0:
                    left += 1
                
                elif total > 0:
                    right -= 1

                else:
                    # If the sum is zero, we found a valid triplet.
                    res.append([first, nums[left], nums[right]])

                    left += 1
                    right -= 1

                    # Skip duplicate elements to avoid duplicate triplets in the result.
                    while left < right and nums[left] == nums[left - 1]:
                        left += 1
                    while left < right and nums[right] == nums[right + 1]:
                        right -= 1

        return res