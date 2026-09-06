# Design a stack that supports push, pop, top, and retrieving the minimum element in constant time.

class MinStack:

    def __init__(self):
        # Initialize the stack as an empty list. 
        # Each element in the stack will be a list containing two elements: the value and the minimum value at that point in the stack.
        self.stack = []

    def push(self, val: int) -> None:
        # Get the current minimum value from the stack. If the stack is empty, min_val will be None.
        min_val = self.getMin()

        # If the current minimum value is None (meaning the stack is empty) or the new value is less than the current minimum, update min_val to be the new value.
        if min_val == None or min_val > val:
            min_val = val

        self.stack.append([val, min_val])

    def pop(self) -> None:
        # Remove the top element from the stack. 
        self.stack.pop()

    def top(self) -> int:
        # Return the value of the top element in the stack. If the stack is empty, return None.
        return self.stack[-1][0] if self.stack else None

    def getMin(self) -> int:
        # Return the minimum value in the stack. If the stack is empty, return None.
        return self.stack[-1][1] if self.stack else None


# Your MinStack object will be instantiated and called as such:
# obj = MinStack()
# obj.push(value)
# obj.pop()
# param_3 = obj.top()
# param_4 = obj.getMin()