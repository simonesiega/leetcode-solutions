# Candy Crush - 723

from typing import List


class Solution:
    def candyCrush(self, board: List[List[int]]) -> List[List[int]]:
        rows, cols = len(board), len(board[0])

        while True:
            crush = False

            # mark horizontal groups without removing them yet.
            for r in range(rows):
                for c in range(cols - 2):

                    if abs(board[r][c]) == abs(board[r][c + 1]) == abs(board[r][c + 2]) != 0:
                        board[r][c] = board[r][c + 1] = board[r][c + 2] = -abs(board[r][c])
                        crush = True

            # include values already marked by horizontal groups.
            for r in range(rows - 2):
                for c in range(cols):

                    if abs(board[r][c]) == abs(board[r + 1][c]) == abs(board[r + 2][c]) != 0:
                        board[r][c] = board[r + 1][c] = board[r + 2][c] = -abs(board[r][c])
                        crush = True

            # stop when the board is stable.
            if not crush:
                return board

            # apply gravity one column at a time.
            for c in range(cols):
                write = rows - 1

                for r in range(rows - 1, -1, -1):
                    if board[r][c] > 0:
                        board[write][c] = board[r][c]
                        write -= 1

                while write >= 0:
                    board[write][c] = 0
                    write -= 1
