# Given each car's position and speed on the way to target, return how many
# fleets reach the target. Cars cannot pass; a car that catches another joins
# its fleet and continues at the slower speed.

from typing import List

class Solution:
    def carFleet(self, target: int, position: List[int], speed: List[int]) -> int:
        # A single car always forms one fleet.
        if len(position) == 1:
            return 1

        # Sort cars by starting position in ascending order, processing them from farthest to closest to the target.
        cars = sorted(zip(position, speed))

        # Each value represents the arrival time of a distinct fleet.
        stack = []

        for pos, spd in cars:
            # Calculate how long the current car would take to reach the target without being blocked.
            time = (target - pos) / spd

            # Fleets already in the stack started farther behind. If one would arrive earlier than or at the same time as the current car, it must catch up and merge with it.
            while stack and stack[-1] <= time:
                stack.pop()

            # Store the arrival time of the new merged fleet. Cars that catch this fleet must arrive at this same time.
            stack.append(time)

        # Every remaining arrival time represents one distinct fleet.
        return len(stack)