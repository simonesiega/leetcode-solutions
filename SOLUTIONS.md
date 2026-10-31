# NeetCode All solutions

[← Project README](README.md) · [Company preparation](companies/README.md) · [Contributing](CONTRIBUTING.md)

Here are the NeetCode All problems I have finished so far, along with each completion date, solution, official and personal difficulty, and a quick time and space complexity breakdown.

Company-specific attempts live separately in the [company preparation dashboard](companies/README.md), keeping this list focused on progress through the main NeetCode All roadmap.

The [complexity notes](docs/DATA_MODEL.md#complexity-conventions) explain how I count time and space for these solutions.

<!-- Generated from data/roadmap.json by the roadmap automation. Do not edit directly. -->

**Topics:** [Arrays &amp; Hashing](#arrays-and-hashing) · [Two Pointers](#two-pointers) · [Sliding Window](#sliding-window) · [Stack](#stack) · [Binary Search](#binary-search) · [Linked List](#linked-list) · [Trees](#trees) · [Heap / Priority Queue](#heap-priority-queue) · [Backtracking](#backtracking) · [Tries](#tries) · [Graphs](#graphs) · [Advanced Graphs](#advanced-graphs) · [1-D Dynamic Programming](#1d-dynamic-programming) · [2-D Dynamic Programming](#2d-dynamic-programming) · [Greedy](#greedy) · [Intervals](#intervals) · [Math &amp; Geometry](#math-and-geometry) · [Bit Manipulation](#bit-manipulation)

<a id="arrays-and-hashing"></a>

## Arrays &amp; Hashing

| Problem | Title | Solved | File | Time Complexity | Space Complexity | Difficulty | Personal Difficulty |
|---:|---|:---:|---|---|---|:---:|:---:|
| 1 | [Two Sum](https://leetcode.com/problems/two-sum/) | 2026-07-01 | [1.py](neetcode-all/arrays-and-hashing/1.py) | `O(n)`, where `n` is the number of values in `nums`; the array is scanned once. | `O(n)` for at most `n` entries in `seen`. | ![Easy](https://img.shields.io/badge/Easy-1f883d?style=flat-square) | 1 |
| 14 | [Longest Common Prefix](https://leetcode.com/problems/longest-common-prefix/) | 2026-10-25 | [14.py](neetcode-all/arrays-and-hashing/14.py) | `O(n * (m + 1))`, where `n` is the number of strings and `m` is the shortest string length; the extra column accounts for detecting a string end, including when `m = 0`. | `O(1)` auxiliary space, excluding the returned prefix, which uses `O(p)` space for prefix length `p`. | ![Easy](https://img.shields.io/badge/Easy-1f883d?style=flat-square) | 2 |
| 36 | [Valid Sudoku](https://leetcode.com/problems/valid-sudoku/) | 2026-07-15 | [36.py](neetcode-all/arrays-and-hashing/36.py) | `O(9 × 9) = O(1)` because the implementation inspects at most the board's fixed 81 cells. | `O(27 × 9) = O(1)` because the 27 row, column, and box sets each hold at most 9 digits. | ![Medium](https://img.shields.io/badge/Medium-d29922?style=flat-square) | 4 |
| 49 | [Group Anagrams](https://leetcode.com/problems/group-anagrams/) | 2026-07-02 | [49.py](neetcode-all/arrays-and-hashing/49.py) | `O(C + 26w) = O(C + w)`, where `w` is the number of words and `C` is their total character count; each word also creates a fixed 26-count signature. | `O(w)` for signatures, dictionary entries, and grouped string references; the input strings themselves are not copied. | ![Medium](https://img.shields.io/badge/Medium-d29922?style=flat-square) | 3 |
| 58 | [Length of Last Word](https://leetcode.com/problems/length-of-last-word/) | 2026-10-25 | [58.py](neetcode-all/arrays-and-hashing/58.py) | `O(n)`, where `n = len(s)`; splitting the string takes linear time. | `O(n)` auxiliary space for the split substrings and word list. | ![Easy](https://img.shields.io/badge/Easy-1f883d?style=flat-square) | 1 |
| 128 | [Longest Consecutive Sequence](https://leetcode.com/problems/longest-consecutive-sequence/) | 2026-07-15 | [128.py](neetcode-all/arrays-and-hashing/128.py) | Expected `O(n)`, where `n` is the number of values; each unique value participates in at most one sequence scan. | `O(n)` for the set of input values. | ![Medium](https://img.shields.io/badge/Medium-d29922?style=flat-square) | 3 |
| 169 | [Majority Element](https://leetcode.com/problems/majority-element/) | 2026-10-29 | [169.py](neetcode-all/arrays-and-hashing/169.py) | Expected `O(n)`, where `n = len(nums)`; each value is counted once using dictionary lookups while tracking the most frequent value. | `O(k)` auxiliary space for the frequency dictionary, where `k` is the number of distinct values in `nums`; `k <= n`, where `n = len(nums)`. | ![Easy](https://img.shields.io/badge/Easy-1f883d?style=flat-square) | 2 |
| 205 | [Isomorphic Strings](https://leetcode.com/problems/isomorphic-strings/) | 2026-10-25 | [205.py](neetcode-all/arrays-and-hashing/205.py) | Expected `O(n)`, where `n = len(s) = len(t)` under the equal-length input constraint; sets of characters and zipped character pairs are constructed. | `O(min(n, a²))` auxiliary space in the worst case, where `a` is the number of distinct characters across both strings; non-isomorphic inputs can create quadratically many distinct pairs in `a`. Under the fixed ASCII alphabet constraint, this is `O(1)`. | ![Easy](https://img.shields.io/badge/Easy-1f883d?style=flat-square) | 2 |
| 217 | [Contains Duplicate](https://leetcode.com/problems/contains-duplicate/) | 2026-06-30 | [217.py](neetcode-all/arrays-and-hashing/217.py) | Expected `O(n)`, where `n` is the number of values, to construct the set. | `O(n)` for the set in the all-distinct case. | ![Easy](https://img.shields.io/badge/Easy-1f883d?style=flat-square) | 1 |
| 238 | [Product of Array Except Self](https://leetcode.com/problems/product-of-array-except-self/) | 2026-07-06 | [238.py](neetcode-all/arrays-and-hashing/238.py) | `O(n)`, where `n` is the number of values; one prefix pass and one postfix pass are performed. | `O(1)` auxiliary space when the required `O(n)` result array is excluded. | ![Medium](https://img.shields.io/badge/Medium-d29922?style=flat-square) | 5 |
| 242 | [Valid Anagram](https://leetcode.com/problems/valid-anagram/) | 2026-07-01 | [242.py](neetcode-all/arrays-and-hashing/242.py) | `O(m + n)`, where `m = len(s)` and `n = len(t)`; when the lengths match, both strings are counted in one lockstep pass. | `O(a)`, where `a` is the number of distinct characters across `s` and `t`. | ![Easy](https://img.shields.io/badge/Easy-1f883d?style=flat-square) | 1 |
| 271 | [Encode and Decode Strings](https://leetcode.com/problems/encode-and-decode-strings/) | 2026-07-03 | [271.py](neetcode-all/arrays-and-hashing/271.py) | Encode: `O(p²)` worst case because repeated `+=` may copy the growing immutable string. Decode: `O(p)`. Here `p` is the encoded string length, including characters, length-prefix digits, and delimiters. | Encode: `O(p)` peak space for the encoded string. Decode: `O(C + w)` for the returned list and copied strings, where `C` is the decoded character count and `w` is the number of strings. | ![Medium](https://img.shields.io/badge/Medium-d29922?style=flat-square) | 4 |
| 290 | [Word Pattern](https://leetcode.com/problems/word-pattern/) | 2026-10-25 | [290.py](neetcode-all/arrays-and-hashing/290.py) | Expected `O(n + m)`, where `n = len(pattern)` and `m = len(s)`; splitting, hashing words, and constructing the sets take linear time in the total input size. | `O(n + m)` auxiliary space for the split word list, copied words, and sets, where `n = len(pattern)` and `m = len(s)`. | ![Easy](https://img.shields.io/badge/Easy-1f883d?style=flat-square) | 2 |
| 347 | [Top K Frequent Elements](https://leetcode.com/problems/top-k-frequent-elements/) | 2026-07-02 | [347.py](neetcode-all/arrays-and-hashing/347.py) | `O(n)`, where `n` is the number of values; counting, bucket creation, and bucket traversal are each linear. | `O(n)` for the frequency map and `n + 1` buckets. | ![Medium](https://img.shields.io/badge/Medium-d29922?style=flat-square) | 4 |
| 383 | [Ransom Note](https://leetcode.com/problems/ransom-note/) | 2026-10-25 | [383.py](neetcode-all/arrays-and-hashing/383.py) | `O(m + n)`, where `m = len(magazine)` and `n = len(ransomNote)`; magazine characters are counted and ransom-note characters are checked once. | `O(a)` auxiliary space for character counts, where `a` is the number of distinct characters in `magazine`; since inputs contain only lowercase English letters, `a <= 26`, so constrained space is `O(1)`. | ![Easy](https://img.shields.io/badge/Easy-1f883d?style=flat-square) | 2 |
| 387 | [First Unique Character in a String](https://leetcode.com/problems/first-unique-character-in-a-string/) | 2026-10-25 | [387.py](neetcode-all/arrays-and-hashing/387.py) | `O(n)`, where `n = len(s)`; one pass counts characters and a second pass finds the first unique character. | `O(1)` auxiliary space for a fixed array of 26 lowercase-English character counts. | ![Easy](https://img.shields.io/badge/Easy-1f883d?style=flat-square) | 2 |
| 392 | [Is Subsequence](https://leetcode.com/problems/is-subsequence/) | 2026-09-16 | [392.py](neetcode-all/arrays-and-hashing/392.py) | `O(n)`, where `n = len(t)`; the implementation scans `t` once. | `O(1)`; only the current index in `s` is stored. | ![Easy](https://img.shields.io/badge/Easy-1f883d?style=flat-square) | 2 |
| 560 | [Subarray Sum Equals K](https://leetcode.com/problems/subarray-sum-equals-k/) | 2026-10-30 | [560.py](neetcode-all/arrays-and-hashing/560.py) | Expected `O(n)`, where `n = len(nums)`; each value updates the prefix sum and performs a constant number of dictionary operations. | `O(n)` auxiliary space for frequencies of at most `n + 1` distinct prefix sums, where `n = len(nums)`. | ![Medium](https://img.shields.io/badge/Medium-d29922?style=flat-square) | 4 |
| 724 | [Find Pivot Index](https://leetcode.com/problems/find-pivot-index/) | 2026-10-27 | [724.py](neetcode-all/arrays-and-hashing/724.py) | `O(n)`, where `n = len(nums)`; computing the total and scanning for the leftmost pivot each take linear time. | `O(1)` auxiliary space; only the index and running sums are stored. | ![Easy](https://img.shields.io/badge/Easy-1f883d?style=flat-square) | 2 |
| 1299 | [Replace Elements with Greatest Element on Right Side](https://leetcode.com/problems/replace-elements-with-greatest-element-on-right-side/) | 2026-09-16 | [1299.py](neetcode-all/arrays-and-hashing/1299.py) | `O(n)`, where `n` is the number of values in `arr`; the array is scanned once from right to left. | `O(1)` auxiliary space because the input array is updated in place and returned. | ![Easy](https://img.shields.io/badge/Easy-1f883d?style=flat-square) | 2 |
| 1929 | [Concatenation of Array](https://leetcode.com/problems/concatenation-of-array/) | 2026-09-16 | [1929.py](neetcode-all/arrays-and-hashing/1929.py) | `O(n)`, where `n` is the number of values in `nums`; each value is copied twice. | `O(1)` auxiliary space beyond the required `O(n)` returned array. | ![Easy](https://img.shields.io/badge/Easy-1f883d?style=flat-square) | 1 |
| 2486 | [Append Characters to String to Make Subsequence](https://leetcode.com/problems/append-characters-to-string-to-make-subsequence/) | 2026-10-30 | [2486.py](neetcode-all/arrays-and-hashing/2486.py) | `O(n)`, where `n = len(s)`; the string is scanned at most once while matching characters of `t` in order. | `O(1)` auxiliary space; only the matched-character count and target length are stored. | ![Medium](https://img.shields.io/badge/Medium-d29922?style=flat-square) | 1 |
| 3110 | [Score of a String](https://leetcode.com/problems/score-of-a-string/) | 2026-10-25 | [3110.py](neetcode-all/arrays-and-hashing/3110.py) | `O(n)`, where `n = len(s)`; each adjacent character pair is processed once. | `O(1)` auxiliary space; the generator yields one difference at a time. | ![Easy](https://img.shields.io/badge/Easy-1f883d?style=flat-square) | 1 |

<a id="two-pointers"></a>

## Two Pointers

| Problem | Title | Solved | File | Time Complexity | Space Complexity | Difficulty | Personal Difficulty |
|---:|---|:---:|---|---|---|:---:|:---:|
| 11 | [Container With Most Water](https://leetcode.com/problems/container-with-most-water/) | 2026-08-05 | [11.py](neetcode-all/two-pointers/11.py) | `O(n)`, where `n` is the number of heights; one pointer moves on every iteration. | `O(1)`; only two pointers and scalar values are stored. | ![Medium](https://img.shields.io/badge/Medium-d29922?style=flat-square) | 3 |
| 15 | [3Sum](https://leetcode.com/problems/3sum/) | 2026-08-04 | [15.py](neetcode-all/two-pointers/15.py) | `O(n²)`, where `n` is the number of values: sorting costs `O(n log n)` and the two-pointer searches cost `O(n²)`. | `O(n)` worst-case auxiliary space for Python's Timsort. The returned output uses `O(r)`, where `r` is the number of triplets. | ![Medium](https://img.shields.io/badge/Medium-d29922?style=flat-square) | 4 |
| 42 | [Trapping Rain Water](https://leetcode.com/problems/trapping-rain-water/) | 2026-08-05 | [42.py](neetcode-all/two-pointers/42.py) | `O(n)`, where `n` is the number of heights; the two pointers traverse the array once. | `O(1)`; only pointers, maxima, and the accumulated result are stored. | ![Hard](https://img.shields.io/badge/Hard-d1242f?style=flat-square) | 6 |
| 125 | [Valid Palindrome](https://leetcode.com/problems/valid-palindrome/) | 2026-07-15 | [125.py](neetcode-all/two-pointers/125.py) | `O(n)`, where `n` is the length of `s`; each pointer moves inward at most `n` times. | `O(1)`; the implementation compares characters in place instead of building a normalized string. | ![Easy](https://img.shields.io/badge/Easy-1f883d?style=flat-square) | 2 |
| 167 | [Two Sum II - Input Array Is Sorted](https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/) | 2026-07-15 | [167.py](neetcode-all/two-pointers/167.py) | `O(n)`, where `n` is the number of values; one of the two pointers moves each iteration. | `O(1)`; only two pointers and the current sum are stored. | ![Medium](https://img.shields.io/badge/Medium-d29922?style=flat-square) | 2 |
| 283 | [Move Zeroes](https://leetcode.com/problems/move-zeroes/) | 2026-10-31 | [283.py](neetcode-all/two-pointers/283.py) | `O(n)`, where `n = len(nums)`; each value is inspected once and each nonzero value is swapped at most once. | `O(1)` auxiliary space; values are rearranged in place using two indices. | ![Easy](https://img.shields.io/badge/Easy-1f883d?style=flat-square) | 1 |
| 344 | [Reverse String](https://leetcode.com/problems/reverse-string/) | 2026-10-30 | [344.py](neetcode-all/two-pointers/344.py) | `O(n)`, where `n = len(s)`; the two pointers swap each opposing character pair once. | `O(1)` auxiliary space; characters are swapped in place using only two pointers. | ![Easy](https://img.shields.io/badge/Easy-1f883d?style=flat-square) | 1 |

<a id="sliding-window"></a>

## Sliding Window

| Problem | Title | Solved | File | Time Complexity | Space Complexity | Difficulty | Personal Difficulty |
|---:|---|:---:|---|---|---|:---:|:---:|
| 3 | [Longest Substring Without Repeating Characters](https://leetcode.com/problems/longest-substring-without-repeating-characters/) | 2026-08-07 | [3.py](neetcode-all/sliding-window/3.py) | `O(n)`, where `n` is the length of `s`; each character enters and leaves the sliding window at most once. | `O(min(n, a))`, where `a` is the number of distinct characters possible in the input alphabet. | ![Medium](https://img.shields.io/badge/Medium-d29922?style=flat-square) | 3 |
| 76 | [Minimum Window Substring](https://leetcode.com/problems/minimum-window-substring/) | 2026-08-12 | [76.py](neetcode-all/sliding-window/76.py) | `O(m + n)`, where `m = len(s)` and `n = len(t)`; each pointer crosses `s` at most once after `t` is counted. | `O(a)` for the two count dictionaries, where `a` is the number of distinct characters across `s` and `t`. The returned substring uses `O(ℓ)` for its length `ℓ`. | ![Hard](https://img.shields.io/badge/Hard-d1242f?style=flat-square) | 5 |
| 121 | [Best Time to Buy and Sell Stock](https://leetcode.com/problems/best-time-to-buy-and-sell-stock/) | 2026-08-07 | [121.py](neetcode-all/sliding-window/121.py) | `O(n)`, where `n` is the number of prices; prices are scanned once. | `O(1)`; only the minimum buy price and maximum profit are stored. | ![Easy](https://img.shields.io/badge/Easy-1f883d?style=flat-square) | 2 |
| 239 | [Sliding Window Maximum](https://leetcode.com/problems/sliding-window-maximum/) | 2026-08-12 | [239.py](neetcode-all/sliding-window/239.py) | `O(n)`, where `n` is the number of values in `nums`; every index is added to the monotonic deque once and removed at most once. | `O(k)` auxiliary space for the deque, where `k` is the window size. The returned array uses `O(n - k + 1)` space. | ![Hard](https://img.shields.io/badge/Hard-d1242f?style=flat-square) | 6 |
| 424 | [Longest Repeating Character Replacement](https://leetcode.com/problems/longest-repeating-character-replacement/) | 2026-08-07 | [424.py](neetcode-all/sliding-window/424.py) | `O(n)`, where `n` is the length of `s`; each character enters once and leaves the window at most once. | `O(a)` for character counts, where `a ≤ 26` for the uppercase-English input constraint, so constrained space is `O(1)`. | ![Medium](https://img.shields.io/badge/Medium-d29922?style=flat-square) | 5 |
| 567 | [Permutation in String](https://leetcode.com/problems/permutation-in-string/) | 2026-08-07 | [567.py](neetcode-all/sliding-window/567.py) | `O(m + n × a)`, where `m = len(s1)`, `n = len(s2)`, and `a` is the number of dictionary keys compared per window. Since `a ≤ 26` for lowercase English letters, this reduces to `O(m + n)`. | `O(a)` for the `need` and `window` dictionaries; `a ≤ 26`, so constrained space is `O(1)`. | ![Medium](https://img.shields.io/badge/Medium-d29922?style=flat-square) | 4 |

<a id="stack"></a>

## Stack

| Problem | Title | Solved | File | Time Complexity | Space Complexity | Difficulty | Personal Difficulty |
|---:|---|:---:|---|---|---|:---:|:---:|
| 20 | [Valid Parentheses](https://leetcode.com/problems/valid-parentheses/) | 2026-08-05 | [20.py](neetcode-all/stack/20.py) | `O(n)`, where `n` is the number of brackets in `s`; each bracket is processed once. | `O(n)` in the worst case when every bracket is an opening bracket. | ![Easy](https://img.shields.io/badge/Easy-1f883d?style=flat-square) | 2 |
| 84 | [Largest Rectangle in Histogram](https://leetcode.com/problems/largest-rectangle-in-histogram/) | 2026-08-06 | [84.py](neetcode-all/stack/84.py) | `O(n)`, where `n` is the number of bars; every index is pushed and popped at most once. | `O(n)` for the monotonic stack in the worst case. | ![Hard](https://img.shields.io/badge/Hard-d1242f?style=flat-square) | 7 |
| 150 | [Evaluate Reverse Polish Notation](https://leetcode.com/problems/evaluate-reverse-polish-notation/) | 2026-08-06 | [150.py](neetcode-all/stack/150.py) | `O(n)`, where `n` is the number of tokens; every token is processed once. | `O(n)` for the operand stack in the worst case. | ![Medium](https://img.shields.io/badge/Medium-d29922?style=flat-square) | 3 |
| 155 | [Min Stack](https://leetcode.com/problems/min-stack/) | 2026-08-06 | [155.py](neetcode-all/stack/155.py) | Amortized `O(1)` per `push` or `pop` (Python list resizing); worst-case `O(1)` per `top` or `getMin`. | `O(n)` for `n` stored entries; each stores its value and the minimum at that depth. | ![Medium](https://img.shields.io/badge/Medium-d29922?style=flat-square) | 3 |
| 739 | [Daily Temperatures](https://leetcode.com/problems/daily-temperatures/) | 2026-08-06 | [739.py](neetcode-all/stack/739.py) | `O(n)`, where `n` is the number of temperatures; every index is pushed and popped at most once. | `O(n)` auxiliary space for the monotonic stack; the returned array also uses `O(n)`. | ![Medium](https://img.shields.io/badge/Medium-d29922?style=flat-square) | 4 |
| 853 | [Car Fleet](https://leetcode.com/problems/car-fleet/) | 2026-08-06 | [853.py](neetcode-all/stack/853.py) | `O(n log n)`, where `n` is the number of cars, due to sorting; the subsequent stack pass is `O(n)`. | `O(n)` for the sorted `(position, speed)` pairs and fleet-time stack. | ![Medium](https://img.shields.io/badge/Medium-d29922?style=flat-square) | 5 |

<a id="binary-search"></a>

## Binary Search

_No solved problems in this topic yet._

<a id="linked-list"></a>

## Linked List

_No solved problems in this topic yet._

<a id="trees"></a>

## Trees

_No solved problems in this topic yet._

<a id="heap-priority-queue"></a>

## Heap / Priority Queue

_No solved problems in this topic yet._

<a id="backtracking"></a>

## Backtracking

_No solved problems in this topic yet._

<a id="tries"></a>

## Tries

_No solved problems in this topic yet._

<a id="graphs"></a>

## Graphs

_No solved problems in this topic yet._

<a id="advanced-graphs"></a>

## Advanced Graphs

_No solved problems in this topic yet._

<a id="1d-dynamic-programming"></a>

## 1-D Dynamic Programming

_No solved problems in this topic yet._

<a id="2d-dynamic-programming"></a>

## 2-D Dynamic Programming

_No solved problems in this topic yet._

<a id="greedy"></a>

## Greedy

_No solved problems in this topic yet._

<a id="intervals"></a>

## Intervals

_No solved problems in this topic yet._

<a id="math-and-geometry"></a>

## Math &amp; Geometry

_No solved problems in this topic yet._

<a id="bit-manipulation"></a>

## Bit Manipulation

_No solved problems in this topic yet._
