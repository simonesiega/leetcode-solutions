# You are given a string s and an integer k. You can choose any character of the string and change it to any other uppercase English character. You can perform this operation at most k times.
# Return the length of the longest substring containing the same letter you can get after performing the above operations.

class Solution:
    def characterReplacement(self, s: str, k: int) -> int:
        # Initialize a dictionary to count the frequency of characters in the current window
        count = {}

        left = 0

        # Initialize variables to keep track of the maximum frequency of a single character in the current window.
        max_frequency = 0

        # Initialize a variable to keep track of the maximum length of the substring found so far.
        max_length = 0

        # Iterate through the string with a right pointer
        for right, c in enumerate(s):

            # Update the frequency count of the current character in the dictionary
            count[c] = 1 + count.get(c, 0)

            # Update the maximum frequency of a single character in the current window
            max_frequency = max(max_frequency, count[c])

            # If the length of the current window minus the maximum frequency is greater than k
            while (right - left + 1) - max_frequency > k:

                # Decrease the frequency count of the character at the left pointer in the dictionary 
                count[s[left]] -= 1

                # Move the left pointer to the right to shrink the window
                left += 1

            # Update the maximum length of the substring found so far
            max_length = max(max_length, right - left + 1)

        return max_length