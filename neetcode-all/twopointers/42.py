# Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.

class Solution:
    def trap(self, height):

        left, right = 0, len(height) - 1

        leftMax = 0
        rightMax = 0
        res = 0

        while left < right:

            # Update the maximum heights encountered from the left and right sides as we move the pointers inward.
            leftMax = max(leftMax, height[left])
            rightMax = max(rightMax, height[right])

            # If the maximum height on the left is less than the maximum height on the right, it means that the amount of water that can be trapped at the current left position is determined by the leftMax. 
            if leftMax < rightMax:
                # The amount of water that can be trapped at the current left position is the difference between leftMax and the height at the left pointer. 
                res += leftMax - height[left]
                left += 1
            
            # Otherwise, the amount of water that can be trapped at the current right position is determined by the rightMax.
            else:
                # The amount of water that can be trapped at the current right position is the difference between rightMax and the height at the right pointer.
                res += rightMax - height[right]
                right -= 1

        return res