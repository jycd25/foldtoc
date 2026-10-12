**Table of Contents**

- <details><summary><a href="#hashmap">Hashmap</a></summary>

  - [Create a hashmap](#create-a-hashmap)
  - <details><summary><a href="#ways-to-count-frequencies-using-a-hashmap">Ways to count frequencies using a hashmap</a></summary>

    - [1. Using a for loop](#1-using-a-for-loop)
    - [2. Using a counter](#2-using-a-counter)
    </details>

  - [Sort elements by frequency](#sort-elements-by-frequency)
  - [Return keys or values in a hashmap only](#return-keys-or-values-in-a-hashmap-only)
  </details>

- <details><summary><a href="#hashset">Hashset</a></summary>

  - [Creating Hashset](#creating-hashset)
  - [Convert an array to a set](#convert-an-array-to-a-set)
  </details>

- <details><summary><a href="#array-basics">Array Basics</a></summary>

  - <details><summary><a href="#strings">Strings</a></summary>

    - [Use Array to count frequencies of each letter](#use-array-to-count-frequencies-of-each-letter)
    </details>

  </details>

- <details><summary><a href="#advanced-array">Advanced Array</a></summary>

  - <details><summary><a href="#kadanes">Kadane's</a></summary>

    - [Practice](#practice)
    </details>

  - <details><summary><a href="#sliding-window-fixed-window">Sliding Window (Fixed window)</a></summary>

    - [Practice](#practice-1)
    </details>

  - <details><summary><a href="#sliding-windowvariable-window">Sliding Window(Variable window)</a></summary>

    - [Practice](#practice-2)
    </details>

  - <details><summary><a href="#two-pointers">Two Pointers</a></summary>

    - [Practice](#practice-3)
    </details>

  - <details><summary><a href="#prefix-sum">Prefix sum</a></summary>

    - [Practice](#practice-4)
    </details>

  </details>

- <details><summary><a href="#linked-lists">Linked Lists</a></summary>

  - <details><summary><a href="#fast-and-slow-pointers">Fast and Slow Pointers</a></summary>

    - [Practice](#practice-5)
    </details>

  </details>

- <details><summary><a href="#tries">Tries</a></summary>

  - <details><summary><a href="#trie-prefix-tree">Trie (Prefix tree)</a></summary>

    - [Practice](#practice-6)
    </details>

  - <details><summary><a href="#union-find-disjoint-sets">Union Find (Disjoint Sets)</a></summary>

    - [Implement disjoint set with path compression](#implement-disjoint-set-with-path-compression)
    - [Practice](#practice-7)
    </details>

  - <details><summary><a href="#segment-tree">Segment Tree</a></summary>

    - [Bitwise (Iterative)](#bitwise-iterative)
    - [Normal (Recursive)](#normal-recursive)
    - [Usage](#usage)
    - [Practice](#practice-8)
    </details>

  </details>

- <details><summary><a href="#binary-indexed-tree">Binary Indexed Tree</a></summary>

  - [`nums` Array (1-based index)](#nums-array-1-based-index)
  - [Binary Indexed Tree (BIT)](#binary-indexed-tree-bit)
  - [Tree Structure](#tree-structure)
  </details>

- <details><summary><a href="#heap--priority-queue">Heap / Priority Queue</a></summary>

  - [Overview](#overview)
  - <details><summary><a href="#push-and-pop">Push and Pop</a></summary>

    - [Practice](#practice-9)
    </details>

  - [Implement a MinHeap](#implement-a-minheap)
  - <details><summary><a href="#heapify">Heapify</a></summary>

    - [Practice](#practice-10)
    </details>

  - <details><summary><a href="#two-heaps">Two Heaps</a></summary>

    - [Practice](#practice-11)
    </details>

  - [Heap in python](#heap-in-python)
  </details>

- <details><summary><a href="#backtracking">Backtracking</a></summary>

  - [Subsets](#subsets)
  - [Practice](#practice-12)
  - <details><summary><a href="#combinations">Combinations</a></summary>

    - [Optimization: Loop based, faster](#optimization-loop-based-faster)
    - [Practice](#practice-13)
    </details>

  - <details><summary><a href="#permutations">Permutations</a></summary>

    - [Practice](#practice-14)
    </details>

  </details>

- <details><summary><a href="#graph">Graph</a></summary>

  - <details><summary><a href="#dijkstras-algorithm-shortest-path">Dijkstra's Algorithm (Shortest Path)</a></summary>

    - [Practice](#practice-15)
    </details>

  - <details><summary><a href="#prims-mst">Prim's (MST)</a></summary>

    - [Practice](#practice-16)
    </details>

  - <details><summary><a href="#kruskals">Kruskal's</a></summary>

    - [Practice](#practice-17)
    </details>

  - <details><summary><a href="#topological-sort">Topological Sort</a></summary>

    - [DFS Implementation](#dfs-implementation)
    - [Kahn's implementation](#kahns-implementation)
    - [Practice](#practice-18)
    </details>

  - <details><summary><a href="#bellman-ford-algorithm">Bellman-Ford Algorithm</a></summary>

    - [Key Theorems](#key-theorems)
    - <details><summary><a href="#dynamic-programming-approach">Dynamic Programming Approach</a></summary>

      - [Standard Bellman-Ford Implementation](#standard-bellman-ford-implementation)
      - [Space-Optimized Bellman-Ford (2 Arrays)](#space-optimized-bellman-ford-2-arrays)
      - [With Path Reconstruction](#with-path-reconstruction)
      - [With K Edges Constraint](#with-k-edges-constraint)
      </details>

    - <details><summary><a href="#spfa-shortest-path-faster-algorithm">SPFA (Shortest Path Faster Algorithm)</a></summary>

      - [SPFA Implementation](#spfa-implementation)
      - [SPFA with Path Reconstruction](#spfa-with-path-reconstruction)
      </details>

    - [Algorithm Limitations and Constraints](#algorithm-limitations-and-constraints)
    - [Complexity Comparison](#complexity-comparison)
    </details>

  - [A* Algorithm (maze optimal search)](#a-algorithm-maze-optimal-search)
  - [Bron–Kerbosch algorithm](#bronkerbosch-algorithm)
  </details>

- <details><summary><a href="#dynamic-programming">Dynamic Programming</a></summary>

  - <details><summary><a href="#1-d">1-D</a></summary>

    - [Top-down](#top-down)
    - [Bottom-up](#bottom-up)
    - [Practice](#practice-19)
    </details>

  - <details><summary><a href="#2-d">2-D</a></summary>

    - [Top-down](#top-down-1)
    - [Bottom-up](#bottom-up-1)
    - [Practice](#practice-20)
    </details>

  - <details><summary><a href="#01-knapsack-problem">0/1 Knapsack problem</a></summary>

    - [Practice](#practice-21)
    </details>

  - <details><summary><a href="#unbounded-knapsack-problem">Unbounded Knapsack problem</a></summary>

    - [Practice](#practice-22)
    </details>

  - <details><summary><a href="#palindrome">Palindrome</a></summary>

    - [Practice](#practice-23)
    </details>

  </details>

- <details><summary><a href="#intervals">Intervals</a></summary>

  - [Check overlapping intervals](#check-overlapping-intervals)
  - [Merge intervals](#merge-intervals)
  </details>

- <details><summary><a href="#sorting">Sorting</a></summary>

  - [Quick Select](#quick-select)
  - [Counting Sort](#counting-sort)
  </details>

- <details><summary><a href="#bit-manipulation">Bit manipulation</a></summary>

  - [Bit manipilation tricks](#bit-manipilation-tricks)
  </details>

- <details><summary><a href="#other">Other</a></summary>

  - [Boyer-Moore Voting Algorithm](#boyer-moore-voting-algorithm)
  - [Dutch national flag algorithm](#dutch-national-flag-algorithm)
  </details>

- <details><summary><a href="#b-tree-family">B-Tree Family</a></summary>

  - [Overview](#overview-1)
  - <details><summary><a href="#1-binary-search-tree--doubly-linked-list">1. Binary Search Tree + Doubly Linked List</a></summary>

    - [Concept](#concept)
    - [Visualization](#visualization)
    - [When to Use](#when-to-use)
    - [Time Complexity](#time-complexity)
    - [Code Implementation](#code-implementation)
    </details>

  - <details><summary><a href="#2-b-tree">2. B-Tree</a></summary>

    - [Concept](#concept-1)
    - [Properties (Order M)](#properties-order-m)
    - [Visualization](#visualization-1)
    - [When to Use](#when-to-use-1)
    - [Time Complexity](#time-complexity-1)
    - [Code Implementation](#code-implementation-1)
    </details>

  - <details><summary><a href="#3-b-tree">3. B+ Tree</a></summary>

    - [Concept](#concept-2)
    - [Visualization](#visualization-2)
    - [Why B+ Tree > B-Tree for Databases](#why-b-tree--b-tree-for-databases)
    - [When to Use](#when-to-use-2)
    - [Time Complexity](#time-complexity-2)
    - [Code Implementation](#code-implementation-2)
    </details>

  - [Comparison Summary](#comparison-summary)
  - [Key Takeaways](#key-takeaways)
  </details>
