# Top K Frequent Elements - 347

from typing import List


class Solution:
    def topKFrequent(self, nums: List[int], k: int) -> List[int]:
        frequency_count = {}

        for number in nums:
            frequency_count[number] = frequency_count.get(number, 0) + 1

        if k >= len(frequency_count):
            return list(frequency_count.keys())

        # bucket indices represent frequencies.
        frequency_buckets = [[] for _ in range(len(nums) + 1)]

        for number, frequency in frequency_count.items():
            frequency_buckets[frequency].append(number)

        result = []

        for frequency in reversed(range(len(frequency_buckets))):
            for number in frequency_buckets[frequency]:
                result.append(number)

                if len(result) == k:
                    return result

        return result
