# First Unique Character in a String - 387

class Solution:
    def firstUniqChar(self, s: str) -> int:
        counts = [0] * 26

        for char in s:
            counts[ord(char) - ord('a')] += 1

        for i, char in enumerate(s):
            if counts[ord(char) - ord('a')] == 1:
                return i

        return -1
