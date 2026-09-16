# Minimum Window Substring - 76

class Solution:
    def minWindow(self, s: str, t: str) -> str:
        if not t or not s:
            return ""

        need = {}

        for c in t:
            need[c] = 1 + need.get(c, 0)

        window = {}
        have = 0
        required = len(need)
        left = 0

        res = [-1, -1]
        res_len = float("inf")

        for right in range(len(s)):
            c = s[right]

            window[c] = 1 + window.get(c, 0)

            # count a requirement when its frequency is satisfied.
            if c in need and window[c] == need[c]:
                have += 1

            # once valid, shrink the window from the left.
            while have == required:
                if right - left + 1 < res_len:
                    res = [left, right]
                    res_len = right - left + 1

                left_char = s[left]
                window[left_char] -= 1

                if left_char in need and window[left_char] < need[left_char]:
                    have -= 1

                left += 1

        left, right = res

        if res_len == float("inf"):
            return ""

        return s[left:right + 1]
