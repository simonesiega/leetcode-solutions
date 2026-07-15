# Determine if a 9 x 9 Sudoku board is valid. Only the filled cells need to be validated according to the following rules:
# Each row must contain the digits 1-9 without repetition.
# Each column must contain the digits 1-9 without repetition.
# Each of the nine 3 x 3 sub-boxes of the grid must contain the digits 1-9 without repetition.

class Solution:
    def isValidSudoku(self, board: List[List[str]]) -> bool:
        rows = [set() for _ in range(9)]
        cols = [set() for _ in range(9)]
        boxes = [set() for _ in range(9)]

        # Loop through each cell in the 9x9 board
        for i in range(9):
            for j in range(9):
                num = board[i][j]

                # If the cell is not empty (represented by '.'), check if the number has already been seen in the current row, column, or 3x3 box.
                if num != '.':
                    box_index = (i // 3) * 3 + (j // 3)

                    # If the number is already present in the current row, column, or box, return False as it violates Sudoku rules.
                    if (num in rows[i]) or (num in cols[j]) or (num in boxes[box_index]):
                        return False

                    # If the number is not present, add it to the corresponding row, column, and box sets for future reference.
                    rows[i].add(num)
                    cols[j].add(num)
                    boxes[box_index].add(num)

        return True 