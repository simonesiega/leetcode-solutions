# Design an algorithm to encode a list of strings to a string. The encoded string is then sent over the network and is decoded back to the original list of strings.

class Solution:

    def encode(self, strs: List[str]) -> str:
        # If the input list of strings is empty, return an empty string
        if (strs == []):
            return ""

        encoded = ""

        # Loop through each word in the input list of strings and encode it by appending its length, a delimiter "#", and the word itself to the encoded string
        for word in strs:
            encoded += str(len(word)) + "#" + word
        
        return encoded

    def decode(self, s: str) -> List[str]:
        # If the input string is empty, return an empty list
        if (s == ""):
            return []
        
        decoded, index = [], 0

        # Loop through the encoded string and decode it by extracting the length of each word, the delimiter "#", and the word itself
        while index < len(s):
            current_index = index

            # Loop through the encoded string until the delimiter "#" is found to determine the length of the next word
            while s[current_index] != "#":
                current_index += 1

            # Extract the length of the next word from the substring of the encoded string before the delimiter "#" and convert it to an integer
            length = int(s[index : current_index])

            # Extract the next word from the substring of the encoded string after the delimiter "#" and append it to the decoded list
            decoded.append(s[current_index + 1 : current_index + 1 + length])

            index = current_index + 1 + length

        return decoded