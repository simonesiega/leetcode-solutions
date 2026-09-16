# Largest Rectangle in Histogram - 84

from typing import List


class Solution:
    def largestRectangleArea(self, heights: List[int]) -> int:
        if len(heights) == 1:
            return heights[0]

        n = len(heights)
        max_area = 0

        # keep indices in non-decreasing height order.
        stack = []

        for i in range(n):
            # a shorter bar fixes the right boundary for taller bars.
            while stack and heights[stack[-1]] > heights[i]:
                index = stack.pop()

                # after the pop, the new top gives the left boundary; use -1 when empty.
                left_boundary = stack[-1] if stack else -1

                width = i - left_boundary - 1
                area = heights[index] * width

                max_area = max(max_area, area)

            stack.append(i)

        # remaining bars can extend to the end of the histogram.
        while stack:
            index = stack.pop()

            left_boundary = stack[-1] if stack else -1

            width = n - left_boundary - 1
            area = heights[index] * width

            max_area = max(max_area, area)

        return max_area
