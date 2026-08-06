# There are n cars at given miles away from the starting mile 0, traveling to reach the mile target.
# You are given two integer arrays position and speed, both of length n, where position[i] is the starting mile of the ith car and speed[i] is the speed of the ith car in miles per hour.
# Return the number of car fleets that will arrive at the destination.

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