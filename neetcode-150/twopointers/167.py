# Given a 1-indexed array of integers numbers that is already sorted in non-decreasing order, find two numbers such that they add up to a specific target number. Let these two numbers be numbers[index1] and numbers[index2] where 1 <= index1 < index2 <= numbers.length.

class Solution:
    def twoSum(self, numbers: List[int], target: int) -> List[int]:
        # If the length of the numbers array is 2, return the indices [1, 2] as they are the only two numbers that can sum to the target.
        if (len(numbers) == 2):
            return [1, 2]
        
        left = 0
        right = len(numbers) - 1

        while (left < right):
            total = numbers[left] + numbers[right]

            if(total == target):
                return [left + 1, right + 1]

            # If the total is greater than the target, move the right pointer to the left to decrease the sum. 
            # If the total is less than the target, move the left pointer to the right to increase the sum.
            elif (total > target):
                right -= 1
            else:
                left += 1