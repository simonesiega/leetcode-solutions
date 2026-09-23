# Best Time to Buy and Sell Stock - 121

class Solution:
    def maxProfit(self, prices):
        min_price = prices[0]
        max_profit = 0

        for i in range(1, len(prices)):
            price = prices[i]

            # Update the cheapest price seen so far
            min_price = min(min_price, price)

            # Check the profit if I sell today
            max_profit = max(max_profit, price - min_price)

        return max_profit
