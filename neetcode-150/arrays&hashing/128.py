class Solution:
    def longestConsecutive(self, nums: List[int]) -> int:
        # Create a set from the input list to allow for O(1) lookups and eliminate duplicates.
        numbers = set(nums)
        longest = 0

        for number in numbers:

            # Only consider the number if it is the start of a sequence (i.e., number - 1 is not in the set).
            if number - 1 not in numbers:

                current = number + 1
                counter = 1

                while (current in numbers):
                    current += 1
                    counter += 1
                
                # Update the longest sequence length if the current sequence is longer than the previously recorded longest.
                longest = max(longest, counter)

        return longest