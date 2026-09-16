# Replace Elements with Greatest Element on Right Side - 1299

from typing import List


class Solution:
    def replaceElements(self, arr: List[int]) -> List[int]:
        last_index = len(arr) - 1
        current_max = arr[last_index]
        arr[last_index] = -1

        for i in range(last_index - 1, -1, -1):
            item = arr[i]
            arr[i] = current_max
            current_max = max(item, current_max)

        return arr