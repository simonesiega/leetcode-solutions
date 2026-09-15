# Number of Ways to Wear Different Hats to Each Other - 1434

from typing import List
from functools import lru_cache

class Solution:
    def numberWays(self, hats: List[List[int]]) -> int:
        MOD = 1_000_000_007
        num_people = len(hats)

        # for each hat, store the people who are willing to wear it.
        hat_to_people = [[] for _ in range(41)]

        for person, preferred_hats in enumerate(hats):
            for hat in preferred_hats:
                hat_to_people[hat].append(person)

        # Target bitmask where every person is assigned a hat.
        # Each bit represents one person, and a set bit means that
        # the corresponding person has already received a hat.
        all_assigned = (1 << num_people) - 1

        # lru_cache is used to memoize the results of the recursive function dp.
        @lru_cache(maxsize=None)
        def dp(hat: int, mask: int) -> int:
            # A complete assignment has been found.
            if mask == all_assigned:
                return 1

            # No more hats are available before assigning everyone.
            if hat > 40:
                return 0

            # Option 1: skip the current hat.
            ways = dp(hat + 1, mask)

            # Option 2: assign the current hat to one eligible person.
            for person in hat_to_people[hat]:
                person_bit = 1 << person

                # Skip people who already have a hat.
                if mask & person_bit:
                    continue

                # Mark this person as assigned.
                new_mask = mask | person_bit

                # Recursively assign the next hat with the updated mask.
                ways += dp(hat + 1, new_mask)

            # Avoid integer overflow by taking modulo at each step.
            return ways % MOD

        # Start from hat 1 with no person assigned.
        return dp(1, 0)
