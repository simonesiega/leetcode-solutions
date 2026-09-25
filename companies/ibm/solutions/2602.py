# Minimum Operations to Make All Array Elements Equal - 2602

from bisect import bisect_left
from typing import List


class Solution:
    def minOperations(self, nums: List[int], queries: List[int]) -> List[int]:
        nums.sort()

        prefix = [0]

        for num in nums:
            prefix.append(prefix[-1] + num)

        n = len(nums)
        res = []

        for q in queries:
            # Find the index of the first element in nums that is greater than or equal to q.
            i = bisect_left(nums, q)

            left = q * i - prefix[i]
            right = (prefix[n] - prefix[i]) - q * (n - i)

            res.append(left + right)

        return res
