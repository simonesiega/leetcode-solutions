# You are given an array of strings tokens that represents an arithmetic expression in a Reverse Polish Notation.
# Evaluate the expression. Return an integer that represents the value of the expression.

class Solution:
    def evalRPN(self, tokens: List[str]) -> int:
        stack = []

        # Iterate through each token in the input list of tokens.
        for token in tokens:

            # If the token is not an operator, convert it to an integer and push it onto the stack.
            if token not in "+-*/":
                stack.append(int(token))
                continue

            # If the token is an operator, pop the top two elements from the stack.
            right = stack.pop()
            left = stack.pop()

            # Use a match-case statement to determine which operation to perform based on the operator token.
            match token:
                case "+":
                    stack.append(left + right)

                case "-":
                    stack.append(left - right)

                case "*":
                    stack.append(left * right)

                case "/":
                    stack.append(int(left / right))

        # After processing all tokens, the final result will be the only element left in the stack.
        return stack[-1]