# Given two strings s and t of lengths m and n respectively, return the minimum window substring of s such that every character in t (including duplicates) is included in the window. If there is no such substring, return the empty string "".

class Solution:
    def minWindow(self, s: str, t: str) -> str:
        if not t or not s:
            return ""

        # Count how many times each character is required.
        need = {}
        
        for c in t:
            need[c] = 1 + need.get(c, 0)

        # Count characters inside the current window.
        window = {}

        # Number of requirements currently satisfied.
        have = 0

        # Number of different characters we need to satisfy.
        required = len(need)

        left = 0

        # Store the best window found.
        res = [-1, -1]
        res_len = float("inf")

        for right in range(len(s)):
            c = s[right]

            # Add the right character to the window.
            window[c] = 1 + window.get(c, 0)

            # If this character is required and we now have exactly the amount we need, one requirement is satisfied.
            if c in need and window[c] == need[c]:
                have += 1

            # If all requirements are satisfied, try to make the window smaller.
            while have == required:

                # Save the current window if it is the smallest.
                if right - left + 1 < res_len:
                    res = [left, right]
                    res_len = right - left + 1

                # Remove the left character from the window.
                left_char = s[left]
                window[left_char] -= 1

                # If we removed a required character and now don't have enough of it, the window becomes invalid.
                if left_char in need and window[left_char] < need[left_char]:
                    have -= 1

                left += 1

        left, right = res

        # If no valid window was found, return an empty string.
        if res_len == float("inf"):
            return ""

        return s[left:right + 1]