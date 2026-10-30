# Append Characters to String to Make Subsequence - 2486

class Solution:
    def appendCharacters(self, s: str, t: str) -> int:
        matched = 0
        target_len = len(t)

        for char in s:
            if char == t[matched]:
                matched += 1

                if matched == target_len:
                    return 0

        return target_len - matched
