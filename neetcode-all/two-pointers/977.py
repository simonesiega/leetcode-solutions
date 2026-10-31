# Squares of a Sorted Array - 977

class Solution:
    def sortedSquares(self, nums: list[int]) -> list[int]:
        squares = [0] * len(nums)
        left = 0
        right = len(nums) - 1

        for i in range(len(squares) - 1, -1, -1):
            if abs(nums[left]) > abs(nums[right]):
                squares[i] = nums[left] ** 2
                left += 1

            else:
                squares[i] = nums[right] ** 2
                right -= 1

        return squares
