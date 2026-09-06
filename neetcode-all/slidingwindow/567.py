# Given two strings s1 and s2, return true if s2 contains a permutation of s1, or false otherwise.

class Solution:
    def checkInclusion(self, s1: str, s2: str) -> bool:
        # If the length of s1 is greater than the length of s2, return False since s2 cannot contain a permutation of s1
        if len(s1) > len(s2):
            return False
        
        # Initialize a dictionary to count the frequency of characters in s1
        need = {}

        # Iterate through the characters in s1 and populate the need dictionary with their frequencies
        for c in s1:
            need[c] = 1 + need.get(c, 0)

        # Initialize a dictionary to count the frequency of characters in the current window of s2
        window = {}
        left = 0

        # Iterate through the characters in s2 with a right pointer
        for right, c in enumerate(s2):

            # Update the frequency count of the current character in the window dictionary
            window[c] = 1 + window.get(c, 0)

            # If the length of the current window exceeds the length of s1, shrink the window from the left
            if right - left + 1 > len(s1):

                # Decrease the frequency count of the character at the left pointer in the window dictionary
                window[s2[left]] -= 1

                # If the frequency count of the character at the left pointer becomes 0, remove it from the window dictionary
                if window[s2[left]] == 0:
                    # Remove the character from the window dictionary to keep it clean
                    del window[s2[left]]

                # Move the left pointer to the right to shrink the window
                left += 1

            # If the current window matches the need dictionary, return True since a permutation of s1 is found in s2
            if window == need:
                return True

        # If no permutation of s1 is found in s2 after checking all possible windows, return False
        return False