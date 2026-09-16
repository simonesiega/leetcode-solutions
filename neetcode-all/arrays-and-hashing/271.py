# Encode and Decode Strings - 271

from typing import List


class Solution:

    def encode(self, strs: List[str]) -> str:
        if (strs == []):
            return ""

        encoded = ""

        # length prefixes make embedded delimiters unambiguous.
        for word in strs:
            encoded += str(len(word)) + "#" + word

        return encoded

    def decode(self, s: str) -> List[str]:
        if (s == ""):
            return []

        decoded, index = [], 0

        # read each length prefix, then consume the word.
        while index < len(s):
            current_index = index

            while s[current_index] != "#":
                current_index += 1

            length = int(s[index : current_index])

            decoded.append(s[current_index + 1 : current_index + 1 + length])

            index = current_index + 1 + length

        return decoded
