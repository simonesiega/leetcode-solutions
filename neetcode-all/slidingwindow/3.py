# Given a string s, find the length of the longest substring without duplicate characters.

class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        left = 0
        max_length = 0

        # Use a set to keep track of the characters in the current window
        seen = set()

        # Iterate through the string with a right pointer
        for right, c in enumerate(s):

            # If the character is already in the set, move the left pointer to the right until the character is removed from the set
            while c in seen:
                # Remove the character at the left pointer from the set and move the left pointer to the right
                seen.remove(s[left])
                left += 1
            
            # Add the current character to the set
            seen.add(c)

            # Update the maximum length of the substring without duplicate characters
            max_length = max(max_length, right - left + 1)

        return max_length