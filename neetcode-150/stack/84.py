# Given an array of integers heights representing the histogram's bar height where the width of each bar is 1, return the area of the largest rectangle in the histogram.

class Solution:
    def largestRectangleArea(self, heights: List[int]) -> int:
        # A single bar forms a rectangle whose area is equal to its height.
        if len(heights) == 1:
            return heights[0]

        n = len(heights)
        max_area = 0

        # Store the indices of bars in non-decreasing height order. Each bar remains in the stack until a shorter bar is found.
        stack = []

        for i in range(n):
            # The current bar is shorter than the bar at the top of the stack. Therefore, index i is the first smaller bar to its right.
            while stack and heights[stack[-1]] > heights[i]:
                index = stack.pop()

                # After the pop, the new top of the stack is the first smaller bar to the left. If the stack is empty, there is no smaller bar to the left, so use -1 as a virtual boundary.
                left_boundary = stack[-1] if stack else -1

                # The rectangle extends from left_boundary + 1 to i - 1.
                width = i - left_boundary - 1
                area = heights[index] * width

                max_area = max(max_area, area)

            # This bar has not found a smaller bar to its right yet.
            stack.append(i)

        # Bars still in the stack have no smaller bar to their right, so their rectangles can extend to the end of the histogram.
        while stack:
            index = stack.pop()

            # The new top is the first smaller bar to the left.
            left_boundary = stack[-1] if stack else -1

            # The rectangle extends from left_boundary + 1 to n - 1.
            width = n - left_boundary - 1
            area = heights[index] * width

            max_area = max(max_area, area)

        return max_area