# Sliding Window Maximum - 239

from typing import List
from collections import deque


class Solution:
    def maxSlidingWindow(self, nums: List[int], k: int) -> List[int]:
        res = []

        # store indices in decreasing value order.
        queue = deque()
        left = 0

        for right in range(len(nums)):

            # smaller values cannot outlast the newer candidate.
            while queue and nums[queue[-1]] < nums[right]:
                queue.pop()

            queue.append(right)

            if queue[0] < left:
                queue.popleft()

            if right - left + 1 == k:
                res.append(nums[queue[0]])

                left += 1

        return res
