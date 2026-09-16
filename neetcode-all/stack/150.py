# Evaluate Reverse Polish Notation - 150

from typing import List


class Solution:
    def evalRPN(self, tokens: List[str]) -> int:
        stack = []

        for token in tokens:
            if token not in "+-*/":
                stack.append(int(token))
                continue

            right = stack.pop()
            left = stack.pop()

            match token:
                case "+":
                    stack.append(left + right)

                case "-":
                    stack.append(left - right)

                case "*":
                    stack.append(left * right)

                case "/":
                    # int(...) truncates toward zero as required.
                    stack.append(int(left / right))

        return stack[-1]
