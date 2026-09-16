# Car Fleet - 853

from typing import List


class Solution:
    def carFleet(self, target: int, position: List[int], speed: List[int]) -> int:
        if len(position) == 1:
            return 1

        # ascending positions process cars from farthest to closest.
        cars = sorted(zip(position, speed))

        # each stacked arrival time represents one fleet.
        stack = []

        for pos, spd in cars:
            time = (target - pos) / spd

            # a trailing fleet merges when it would arrive no later.
            while stack and stack[-1] <= time:
                stack.pop()

            stack.append(time)

        return len(stack)
