# Candy Crush - 723

from typing import List


class Solution:
    def candyCrush(self, board: List[List[int]]) -> List[List[int]]:
        rows, cols = len(board), len(board[0])

        while True:
            crush = False

            # Mark horizontal groups
            for r in range(rows):
                for c in range(cols - 2):

                    # Check if the current cell and the next two cells in the row are the same
                    if abs(board[r][c]) == abs(board[r][c + 1]) == abs(board[r][c + 2]) != 0:
                        board[r][c] = board[r][c + 1] = board[r][c + 2] = -abs(board[r][c])
                        crush = True

            # Mark vertical groups
            for r in range(rows - 2):
                for c in range(cols):

                    # Check if the current cell and the next two cells in the column are the same
                    if abs(board[r][c]) == abs(board[r + 1][c]) == abs(board[r + 2][c]) != 0:
                        board[r][c] = board[r + 1][c] = board[r + 2][c] = -abs(board[r][c])
                        crush = True

            # If nothing was marked, the board is stable
            if not crush:
                return board

            # Apply gravity to each column
            for c in range(cols):
                write = rows - 1

                # Move surviving candies down
                for r in range(rows - 1, -1, -1):
                    if board[r][c] > 0:
                        board[write][c] = board[r][c]
                        write -= 1

                # Fill the remaining cells with zeros
                while write >= 0:
                    board[write][c] = 0
                    write -= 1
