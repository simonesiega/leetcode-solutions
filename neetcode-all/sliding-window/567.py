# Permutation in String - 567

class Solution:
    def checkInclusion(self, s1: str, s2: str) -> bool:
        if len(s1) > len(s2):
            return False

        need = {}

        for c in s1:
            need[c] = 1 + need.get(c, 0)

        window = {}
        left = 0

        for right, c in enumerate(s2):
            window[c] = 1 + window.get(c, 0)

            # keep the comparison window the same length as s1.
            if right - left + 1 > len(s1):
                window[s2[left]] -= 1

                if window[s2[left]] == 0:
                    del window[s2[left]]

                left += 1

            if window == need:
                return True

        return False
