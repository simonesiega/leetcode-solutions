# Integer to Roman - 12

class Solution:
    def intToRoman(self, num: int) -> str:
        conversion = {
            1: "I",
            4: "IV",
            5: "V",
            9: "IX",
            10: "X",
            40: "XL",
            50: "L",
            90: "XC",
            100: "C",
            400: "CD",
            500: "D",
            900: "CM",
            1000: "M",
        }

        res = ""

        for number in sorted(conversion.keys(), reverse=True):
            while number <= num:
                res += conversion[number]
                num -= number

        return res
