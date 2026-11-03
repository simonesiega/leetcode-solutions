# Reorder List - 143

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


class Solution:
    def reorderList(self, head: ListNode | None) -> None:
        """
        Do not return anything, modify head in-place instead.
        """
        if head is None:
            return

        mid = end = head

        while end.next and end.next.next:
            mid = mid.next
            end = end.next.next

        prev, curr = None, mid.next
        mid.next = None

        while curr:
            tmp = curr.next
            curr.next = prev
            prev, curr = curr, tmp

        left, right = head, prev

        while right and left:
            node1 = left.next
            node2 = right.next

            left.next = right
            right.next = node1

            left, right = node1, node2
