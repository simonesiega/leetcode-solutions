# Given an array of integers temperatures represents the daily temperatures, return an array answer such that answer[i] is the number of days you have to wait after the ith day to get a warmer temperature. 
# If there is no future day for which this is possible, keep answer[i] == 0 instead.

class Solution:
    def dailyTemperatures(self, temperatures: List[int]) -> List[int]:
        # Initialize the result array with zeros, which will hold the number of days to wait for a warmer temperature for each day.
        res = [0] * len(temperatures)

        # Initialize an empty stack that will be used to keep track of the indices of the temperatures.
        stack = []

        # Iterate through the temperatures using their indices and values.
        for i, temp in enumerate(temperatures):
            
            # While the stack is not empty and the current temperature is greater than the temperature at the index stored at the top of the stack, it means we have found a warmer day for the day represented by that index.
            while stack and temperatures[stack[-1]] < temp:
                
                # Pop the index from the stack, which represents a day for which we have found a warmer temperature.
                index = stack.pop()

                # Calculate the number of days to wait for a warmer temperature by subtracting the index of the day from the current index and store it in the result array.
                res[index] = i - index
            
            # Push the current index onto the stack to keep track of it for future comparisons.
            stack.append(i)
        
        return res