# Find Pivot Index - 724

class Solution:
    def pivotIndex(self, nums: list[int]) -> int:
        left, total = 0, sum(nums)

        for i in range(len(nums)):
            right = total - left - nums[i]

            if(left == right):
                return i

            left += nums[i]

        return -1
