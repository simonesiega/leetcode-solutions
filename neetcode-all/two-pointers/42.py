# Trapping Rain Water - 42

class Solution:
    def trap(self, height):

        left, right = 0, len(height) - 1

        leftMax = 0
        rightMax = 0
        res = 0

        while left < right:

            leftMax = max(leftMax, height[left])
            rightMax = max(rightMax, height[right])

            # the lower maximum determines the water on that side.
            if leftMax < rightMax:
                res += leftMax - height[left]
                left += 1

            else:
                res += rightMax - height[right]
                right -= 1

        return res
