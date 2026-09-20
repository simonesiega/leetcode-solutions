# Merge Intervals - 56

class Solution:
    def merge(self, intervals: list[list[int]]) -> list[list[int]]:
        # Sort intervals by their starting point
        intervals.sort(key=lambda interval: interval[0])

        merged = [intervals[0]]

        for interval in intervals[1:]:
            last = merged[-1]

            # Merge overlapping intervals
            if interval[0] <= last[1]:
                last[1] = max(last[1], interval[1])
            else:
                merged.append(interval)

        return merged
