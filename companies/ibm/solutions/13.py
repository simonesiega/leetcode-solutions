# Roman to Integer - 13

class Solution:
    def romanToInt(self, s: str) -> int:
        roman_to_int = {
            "I": 1,
            "V": 5,
            "X": 10,
            "L": 50,
            "C": 100,
            "D": 500,
            "M": 1000,
        }

        res = 0

        for i in range(len(s)):
            value = roman_to_int[s[i]]

            # Subtract when a smaller value comes before a larger one
            if i + 1 < len(s) and value < roman_to_int[s[i + 1]]:
                res -= value
            else:
                res += value

        return res
