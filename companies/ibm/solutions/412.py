# Fizz Buzz - 412

class Solution:
    def fizzBuzz(self, n: int) -> list[str]:
        answer = []

        for number in range(1, n + 1):
            if number % 15 == 0:
                answer.append("FizzBuzz")
            elif number % 3 == 0:
                answer.append("Fizz")
            elif number % 5 == 0:
                answer.append("Buzz")
            else:
                answer.append(str(number))

        return answer
