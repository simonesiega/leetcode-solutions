# Given two strings s and t, return true if t is an anagram of s, and false otherwise.

class Solution:
    def isAnagram(self, s: str, t: str) -> bool:
        # Check if the lengths of the two strings are different. 
        # If they are, they cannot be anagrams, so return False
        if (len(s) != len(t)):
            return False
        
        dic_t = {}
        dic_s = {}

        # Loop through the characters in both strings and count their occurrences
        # they have got the same length, so it can be done in a single loop
        for i in range(len(s)):
            char_s = s[i]
            char_t = t[i]

            dic_t[char_t] = dic_t.get(char_t, 0) + 1
            dic_s[char_s] = dic_s.get(char_s, 0) + 1
        
        return dic_t == dic_s
