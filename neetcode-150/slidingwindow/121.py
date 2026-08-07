# You are given an array prices where prices[i] is the price of a given stock on the ith day.
# You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.
# Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.

class Solution:
    def maxProfit(self, prices):
        # Initialize the minimum price to the first day's price and profit to 0
        buy = prices[0]
        profit = 0

        # Iterate through the prices starting from the second day
        for i in range(1, len(prices)):

            # Update the minimum price if the current price is lower than the previously recorded minimum
            if prices[i] < buy:
                buy = prices[i]
                
            # Update the profit if the current price minus the minimum price is greater than the previously recorded profit
            elif prices[i] - buy > profit:
                profit = prices[i] - buy
    
        return profit