# Longest Substring Without Repeating Characters - 3

class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        left = 0
        max_length = 0
        seen = set()

        for right, char in enumerate(s):
            # Shrink the window until it contains no duplicates
            while char in seen:
                seen.remove(s[left])
                left += 1

            seen.add(char)
            max_length = max(max_length, right - left + 1)

        return max_length
