# Daily Temperatures - 739

from typing import List


class Solution:
    def dailyTemperatures(self, temperatures: List[int]) -> List[int]:
        res = [0] * len(temperatures)

        # store unresolved indices in non-increasing temperature order.
        stack = []

        for i, temp in enumerate(temperatures):
            while stack and temperatures[stack[-1]] < temp:

                index = stack.pop()

                res[index] = i - index

            stack.append(i)

        return res
