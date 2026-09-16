# 3Sum - 15

class Solution:
    def threeSum(self, nums: list[int]) -> list[list[int]]:
        res = []

        # sorting enables pointer movement and duplicate detection.
        nums.sort()

        for i, first in enumerate(nums):
            # every later value is positive, so no triplet can sum to zero.
            if first > 0:
                return res

            if i > 0 and first == nums[i - 1]:
                continue

            left, right = i + 1, len(nums) - 1

            while left < right:
                total = first + nums[left] + nums[right]

                if total < 0:
                    left += 1

                elif total > 0:
                    right -= 1

                else:
                    res.append([first, nums[left], nums[right]])

                    left += 1
                    right -= 1

                    # adjacent equal values would reproduce the same triplet.
                    while left < right and nums[left] == nums[left - 1]:
                        left += 1
                    while left < right and nums[right] == nums[right + 1]:
                        right -= 1

        return res
