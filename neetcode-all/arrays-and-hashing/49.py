# Group Anagrams - 49

from typing import List
from collections import defaultdict


class Solution:
    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:
        if (len(strs) == 1):
            return [strs]

        anagram_groups = defaultdict(list)

        for word in strs:
            char_count = [0] * 26

            for char in word:
                char_index = ord(char) - ord('a')
                char_count[char_index] += 1

            # tuples make the count signature hashable.
            signature = tuple(char_count)

            anagram_groups[signature].append(word)

        return list(anagram_groups.values())
