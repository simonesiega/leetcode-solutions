# Subarray Sum Equals K - 560

from typing import List


class Solution:
    def subarraySum(self, nums: List[int], k: int) -> int:
        count = 0
        prefix_sum = 0
        prefix_hash = {0 : 1}

        for num in nums:
            prefix_sum += num

            if (prefix_sum - k) in prefix_hash:
                count += prefix_hash[prefix_sum - k]

            prefix_hash[prefix_sum] = prefix_hash.get(prefix_sum, 0) + 1

        return count
