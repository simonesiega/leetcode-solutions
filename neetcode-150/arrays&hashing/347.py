# Given an integer array nums and an integer k, return the k most frequent elements. You may return the answer in any order.

class Solution:
    def topKFrequent(self, nums: List[int], k: int) -> List[int]:
        frequency_count = {}

        # Loop through each number in nums and count its occurrences using a dictionary
        for number in nums:
            frequency_count[number] = frequency_count.get(number, 0) + 1

        # If k is greater than or equal to the number of unique elements in nums, return all unique elements
        if k >= len(frequency_count):
            return list(frequency_count.keys())

        # Create a list of empty lists (buckets) where the index represents the frequency of elements. 
        # The size of the list is len(nums) + 1 to account for frequencies from 0 to len(nums).
        frequency_buckets = [[] for _ in range(len(nums) + 1)]
        
        # Loop through the frequency_count dictionary and place each number into the corresponding bucket based on its frequency
        for number, frequency in frequency_count.items():
            frequency_buckets[frequency].append(number)
        
        result = []

        # Loop through the frequency_buckets in reverse order (from highest frequency to lowest) 
        for frequency in reversed(range(len(frequency_buckets))):
            
            # Loop through each number in the current frequency bucket and add it to the result list 
            for number in frequency_buckets[frequency]:
                result.append(number)
                
                # If the length of the result list is equal to k, return the result list
                if len(result) == k:
                    return result
        
        return result