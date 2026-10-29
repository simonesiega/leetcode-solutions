# Majority Element - 169

class Solution:
    def majorityElement(self, nums: list[int]) -> int:
        freq = {}
        res = max_freq = 0

        for num in nums:
            freq[num] = 1 + freq.get(num, 0)

            if freq[num] > max_freq:
                res = num
                max_freq = freq[num]

        return res
