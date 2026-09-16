# Valid Anagram - 242

class Solution:
    def isAnagram(self, s: str, t: str) -> bool:
        # strings of different lengths cannot be anagrams.
        if (len(s) != len(t)):
            return False

        count_t = {}
        count_s = {}

        for index in range(len(s)):
            char_s = s[index]
            char_t = t[index]

            count_t[char_t] = count_t.get(char_t, 0) + 1
            count_s[char_s] = count_s.get(char_s, 0) + 1

        return count_t == count_s
