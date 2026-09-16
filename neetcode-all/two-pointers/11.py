# Container With Most Water - 11

from typing import List


class Solution:
    def maxArea(self, height: List[int]) -> int:
        # two lines can form only one container.
        if(len(height) == 2):
            return min(height[0], height[1])

        left, right = 0, len(height) - 1
        max_area = 0

        while left < right:
            width = right - left

            current_height = min(height[left], height[right])

            max_area = max(max_area, width * current_height)

            # only moving the shorter line can improve the limiting height.
            if height[left] < height[right]:
                left += 1
            else:
                right -= 1

        return max_area
