# Two Sum II - Input Array Is Sorted - 167

from typing import List


class Solution:
    def twoSum(self, numbers: List[int], target: int) -> List[int]:
        if (len(numbers) == 2):
            return [1, 2]

        left = 0
        right = len(numbers) - 1

        while (left < right):
            total = numbers[left] + numbers[right]

            if(total == target):
                return [left + 1, right + 1]

            elif (total > target):
                right -= 1
            else:
                left += 1
