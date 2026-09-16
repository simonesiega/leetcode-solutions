# Min Stack - 155

class MinStack:

    def __init__(self):
        # store the minimum at each depth for O(1) access.
        self.stack = []

    def push(self, val: int) -> None:
        min_val = self.getMin()

        if min_val is None or min_val > val:
            min_val = val

        self.stack.append([val, min_val])

    def pop(self) -> None:
        self.stack.pop()

    def top(self) -> int:
        return self.stack[-1][0] if self.stack else None

    def getMin(self) -> int:
        return self.stack[-1][1] if self.stack else None
