# Is Subsequence - 392

class Solution:
    def isSubsequence(self, s: str, t: str) -> bool:
        index_s = 0

        for char in t:
            if index_s < len(s) and s[index_s] == char:
                index_s += 1

        return index_s == len(s)
