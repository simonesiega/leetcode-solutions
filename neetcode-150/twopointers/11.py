# You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]).
# Find two lines that together with the x-axis form a container, such that the container contains the most water.

class Solution:
    def maxArea(self, height: List[int]) -> int:
        # If there are only two lines, the maximum area is simply the area formed by the smaller of the two heights multiplied by the distance between them (which is 1).
        if(len(height) == 2):
            return min(height[0], height[1])

        left, right = 0, len(height) - 1
        max_area = 0

        # Use a two-pointer approach to find the maximum area. Start with one pointer at the beginning (left) and one at the end (right) of the array.
        while left < right:

            # Calculate the width of the container formed by the lines at the left and right pointers.
            width = right - left

            # Calculate the height of the container formed by the lines at the left and right pointers.
            current_height = min(height[left], height[right])

            # Update the maximum area if the current area is larger.
            max_area = max(max_area, width * current_height)
    
            # Move the pointer pointing to the shorter line inward, as moving the taller line would not increase the area.
            if height[left] < height[right]:
                left += 1
            else:
                right -= 1

        return max_area