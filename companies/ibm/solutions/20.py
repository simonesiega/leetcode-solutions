# Valid Parentheses - 20

class Solution:
    def isValid(self, s: str) -> bool:
        if len(s) % 2:
            return False

        opening = {"(": ")", "[": "]", "{": "}"}
        stack = []

        for bracket in s:
            if bracket in opening:
                stack.append(bracket)
            elif not stack or opening[stack.pop()] != bracket:
                return False

        return not stack
