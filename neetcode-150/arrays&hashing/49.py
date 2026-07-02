# Given an array of strings strs, group the anagrams together.

class Solution:
    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:
        # If the length of strs is less than 2, return a list containing strs as the only group of anagrams
        if (len(strs) < 2):
            return [strs]

        dic = defaultdict(list)
        
        # Loop through each word in strs and create an array of size 26 to count the occurrences of each character in the word
        for word in strs:
            arr = [0] * 26

            # Loop through each character in the word and increment the corresponding index in the array based on the character's ASCII value
            for c in word:
                # Calculate the position of the character in the alphabet (0 for 'a', 1 for 'b', ..., 25 for 'z')
                pos = ord(c) - ord('a')
                arr[pos] += 1

            # Convert the array to a tuple so that it can be used as a key in the dictionary, and append the word to the list of anagrams corresponding to that key
            tup = tuple(arr)

            dic[tup].append(word)
        
        return list(dic.values())