# Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

class Solution:
    def isValid(self, s: str) -> bool:
        # If the length of the string is odd, it cannot be valid since every opening bracket must have a corresponding closing bracket.
        if(len(s) & 1):
            return False
        
        stack = []

        # Iterate through each character in the string and use a stack to keep track of opening brackets. 
        for bracket in s:
            # If the character is an opening bracket, push it onto the stack. 
            if bracket in ['(', '{', '[']:
                stack.append(bracket)

            # If the character is a closing bracket, check if it matches the most recent opening bracket on the stack. 
            # If it does not match or if the stack is empty, the string is not valid.
            else:
                if not stack:
                    return False

                if bracket == ')' and stack.pop() != '(':
                    return False
                
                elif bracket == ']' and stack.pop() != '[':
                    return False
                
                elif bracket == '}' and stack.pop() != '{':
                    return False
        
        # If the stack is empty at the end, it means all opening brackets had matching closing brackets, and the string is valid.
        return not stack