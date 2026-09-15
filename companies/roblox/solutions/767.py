# Reorganize String - 767

class Solution:
    def reorganizeString(self, s: str) -> str:
        freq_map = {}

        # Count the frequency of each character
        for char in s:
            freq_map[char] = freq_map.get(char, 0) + 1

        # Sort the characters by frequency in descending order
        sorted_chars = sorted(freq_map.keys(), key=lambda x: freq_map[x], reverse=True)

        # Check if the most frequent character can be separated
        if freq_map[sorted_chars[0]] > (len(s) + 1) // 2:
            return ""

        # Create the result array
        res = [None] * len(s)

        i = 0

        # Place the most frequent characters first
        for char in sorted_chars:
            for _ in range(freq_map[char]):

                # Move to odd positions after filling all even positions
                if i >= len(s):
                    i = 1

                # Place the current character
                res[i] = char

                # Move to the next available position
                i += 2

        # Convert the result array into a string
        return "".join(res)
