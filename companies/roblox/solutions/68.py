# Text Justification - 68

from typing import List


class Solution:
    def fullJustify(self, words: List[str], maxWidth: int) -> List[str]:
        result = []
        current_line = []
        letters_count = 0

        for word in words:
            # Minimum required length if the current word is added:
            # letters already in the line + current word + one space between each pair of words.
            if letters_count + len(word) + len(current_line) > maxWidth:
                # Number of gaps where spaces can be distributed.
                # Use 1 for single-word lines to avoid modulo by zero.
                gaps = max(1, len(current_line) - 1)

                # Distribute all required spaces from left to right in round-robin order.
                # This automatically gives extra spaces to the leftmost gaps.
                spaces_needed = maxWidth - letters_count

                for i in range(spaces_needed):
                    gap_index = i % gaps
                    current_line[gap_index] += " "

                result.append("".join(current_line))

                current_line = []
                letters_count = 0

            current_line.append(word)
            letters_count += len(word)

        # The last line is left-justified with one space between words
        # and padded with spaces on the right.
        result.append(" ".join(current_line).ljust(maxWidth))

        return result
