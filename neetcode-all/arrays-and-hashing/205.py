# Isomorphic Strings - 205

class Solution:
    def isIsomorphic(self, s: str, t: str) -> bool:
        if len(s) != len(t):
            return False

        pairs = {}
        used = set()

        for sc, tc in zip(s, t):
            if sc in pairs:
                if pairs[sc] != tc:
                    return False
            else:
                if tc in used:
                    return False

                pairs[sc] = tc
                used.add(tc)

        return True

        # return len(set(s)) == len(set(t)) == len(set(zip(s,t)))
