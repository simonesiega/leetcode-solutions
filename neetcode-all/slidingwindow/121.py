# Best Time to Buy and Sell Stock - 121

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