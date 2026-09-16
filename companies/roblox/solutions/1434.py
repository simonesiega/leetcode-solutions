# Number of Ways to Wear Different Hats to Each Other - 1434

from typing import List
from functools import lru_cache


class Solution:
    def numberWays(self, hats: List[List[int]]) -> int:
        MOD = 1_000_000_007
        num_people = len(hats)

        # assign by hat so each hat can be used at most once.
        hat_to_people = [[] for _ in range(41)]

        for person, preferred_hats in enumerate(hats):
            for hat in preferred_hats:
                hat_to_people[hat].append(person)

        # bit i represents person i, so all_assigned has all bits set for all people.
        all_assigned = (1 << num_people) - 1

        @lru_cache(maxsize=None)
        def dp(hat: int, mask: int) -> int:
            if mask == all_assigned:
                return 1

            if hat > 40:
                return 0

            # case 1: skip this hat.
            ways = dp(hat + 1, mask)

            # case 2: assign this hat to one eligible person.
            for person in hat_to_people[hat]:
                person_bit = 1 << person

                if mask & person_bit:
                    continue

                new_mask = mask | person_bit

                ways += dp(hat + 1, new_mask)

            # keep the result within the required modulus.
            return ways % MOD

        return dp(1, 0)
