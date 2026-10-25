# Ransom Note - 383

class Solution:
    def canConstruct(self, ransomNote: str, magazine: str) -> bool:
        if len(ransomNote) > len(magazine):
            return False

        counts = {}

        for char in magazine:
            counts[char] = counts.get(char, 0) + 1

        for char in ransomNote:
            if counts.get(char, 0) == 0:
                return False
            counts[char] -= 1

        return True

        # from collections import Counter
        # return Counter(ransomNote) <= Counter(magazine)
