# Longest Repeating Character Replacement - 424

class Solution:
    def characterReplacement(self, s: str, k: int) -> int:
        count = {}

        left = 0

        # keep the largest character frequency seen while expanding the window.
        # it may stay stale after shrinking without affecting the best length.
        max_frequency = 0

        max_length = 0

        for right, c in enumerate(s):
            count[c] = 1 + count.get(c, 0)

            max_frequency = max(max_frequency, count[c])

            while (right - left + 1) - max_frequency > k:

                count[s[left]] -= 1

                left += 1

            max_length = max(max_length, right - left + 1)

        return max_length
