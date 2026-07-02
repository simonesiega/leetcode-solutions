# Given an array of strings strs, group the anagrams together.

class Solution:
    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:
        # If the length of strs is less than 2, return a list containing strs as the only group of anagrams
        if (len(strs) < 2):
            return [strs]

        anagram_groups = defaultdict(list)
        
        # Loop through each word in strs and create an array of size 26 to count the occurrences of each character in the word
        for word in strs:
            char_count = [0] * 26

            # Loop through each character in the word and increment the corresponding index in the array based on the character's ASCII value
            for char in word:
                # Calculate the position of the character in the alphabet (0 for 'a', 1 for 'b', ..., 25 for 'z')
                char_index = ord(char) - ord('a')
                char_count[char_index] += 1

            # Convert the array to a tuple so that it can be used as a key in the dictionary, and append the word to the list of anagrams corresponding to that key
            signature = tuple(char_count)

            anagram_groups[signature].append(word)
        
        return list(anagram_groups.values())