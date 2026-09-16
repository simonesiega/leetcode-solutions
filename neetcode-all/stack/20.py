# Valid Parentheses - 20

class Solution:
    def isValid(self, s: str) -> bool:
        # valid pairs always contribute an even number of brackets.
        if(len(s) & 1):
            return False

        stack = []

        for bracket in s:
            if bracket in ['(', '{', '[']:
                stack.append(bracket)

            else:
                if not stack:
                    return False

                if bracket == ')' and stack.pop() != '(':
                    return False

                elif bracket == ']' and stack.pop() != '[':
                    return False

                elif bracket == '}' and stack.pop() != '{':
                    return False

        return not stack
