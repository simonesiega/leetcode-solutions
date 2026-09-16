# Longest Substring Without Repeating Characters - 3

class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        left = 0
        max_length = 0

        seen = set()

        for right, c in enumerate(s):

            # shrink until the window contains unique characters again.
            while c in seen:
                seen.remove(s[left])
                left += 1

            seen.add(c)

            max_length = max(max_length, right - left + 1)

        return max_length
