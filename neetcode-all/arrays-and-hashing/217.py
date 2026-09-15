# Contains Duplicate - 217

from typing import List


class Solution:
    def containsDuplicate(self, nums: List[int]) -> bool:
        # If the length of the set of nums is not equal to the length of nums, then there is at least one duplicate
        # otherwise, all elements are distinct
        return len(set(nums)) != len(nums)
