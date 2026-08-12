# You are given an array of integers nums, there is a sliding window of size k which is moving from the very left of the array to the very right. You can only see the k numbers in the window. Each time the sliding window moves right by one position.

class Solution:
    def maxSlidingWindow(self, nums: List[int], k: int) -> List[int]:
        # Store the maximum value for each sliding window.
        res = []

        # Store indexes of useful elements in decreasing order of their values.
        # The first index always points to the maximum element of the current window.
        queue = deque()

        # Left boundary of the current sliding window.
        left = 0

        # Expand the window by moving the right pointer.
        for right in range(len(nums)):

            # Remove indexes whose values are smaller than the current value.
            # They can never become the maximum because nums[right] is larger
            # and will remain in the window longer than them.
            while queue and nums[queue[-1]] < nums[right]:
                queue.pop()

            # Add the current index to the deque.
            queue.append(right)

            # Remove the maximum candidate if it is no longer inside the window.
            if queue[0] < left:
                queue.popleft()

            # When the window reaches size k, save its maximum value.
            if right - left + 1 == k:
                res.append(nums[queue[0]])

                # Slide the window one position to the right.
                left += 1

        return res