# Count Ways to Group Overlapping Ranges - 2580

from typing import List


class Solution:
    def countWays(self, ranges: List[List[int]]) -> int:
        MOD = 10**9 + 7

        ranges.sort()

        ways = 1
        current_end = -1

        for start, end in ranges:
            if start > current_end:
                # Create a new overlapping component.
                ways = (ways * 2) % MOD

            # Update the end of the current overlapping component.
            current_end = max(current_end, end)

        return ways
