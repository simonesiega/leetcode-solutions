# A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.

class Solution:
    def isPalindrome(self, s: str) -> bool:
        if(len(s) == 1):
            return True
        
        # Initialize two pointers, left and right, to the start and end of the string respectively.
        left = 0
        right = len(s)-1
        
        # Use a while loop to compare characters from both ends of the string until the pointers meet.
        while left < right:

            # Skip non-alphanumeric characters by moving the left pointer to the right until it points to an alphanumeric character or crosses the right pointer.
            while left<right and not s[left].isalnum():
                left = left + 1

            # Skip non-alphanumeric characters by moving the right pointer to the left until it points to an alphanumeric character or crosses the left pointer.
            while left<right and not s[right].isalnum():
                right = right - 1

            # Compare the characters at the left and right pointers (case-insensitive). If they are not equal, return False as the string is not a palindrome.
            if s[left].lower() != s[right].lower():
                return False

            left+=1
            right-=1

        return True