---
title: Chapter 5 二项队列 · AI 精讲
aliases:
  - ADS/notes/Chapter 5 二项队列 AI精讲
---
# Chapter 5 二项队列（Binomial Queue）

> **课件来源**：`ADS05BinomialQ_Stu.ppt`（15 页）
> **本章主线**：左式堆 / 斜堆把 merge 做到 $O(\log N)$，但 **`Insert` 仍是 $O(\log N)$** —— 而二叉堆的**平均**插入其实是 $O(1)$（$N$ 次插入建堆总代价 $O(N)$，Weiss Theorem 5.1, p.156）。既然「最坏 $O(\log N)$ 却平均 $O(1)$」不够好，就要一个**最坏也更快**的结构 → **二项队列（binomial queue）**：用「**森林（forest）** + **二进制表示**」把 merge 变成「二进制加法」，插入 **$O(1)$ 摊还**。

---

## 0. 本章速览

| 操作 | 二叉堆 | 左式堆/斜堆 | **二项队列** |
|---|---|---|---|
| `FindMin` | $O(1)$ | $O(1)$ | $O(\log N)$，加缓存可 $O(1)$ |
| **`Insert`** | $O(\log N)$ 最坏 / $O(1)$ 平均 | $O(\log N)$ | **$O(1)$ 摊还**，最坏 $O(\log N)$ |
| `DeleteMin` | $O(\log N)$ | $O(\log N)$ | $O(\log N)$ |
| **`Merge`** | $O(N)$ | $O(\log N)$ | **$O(\log N)$** |
| 结构 | 完全二叉树（数组） | 单棵左偏二叉树 | **一组二项树（森林）**，树的个数 = $N$ 的二进制中 1 的个数 |

**核心思想**：$N$ 的二进制表示是**唯一**的 → 用「$N$ 的二进制位」决定「哪几棵二项树存在」→ 合并两个二项队列 = **两数相加（含进位 carry）**。

**术语对照**

| 中文 | English | 中文 | English |
|---|---|---|---|
| 二项队列 | binomial queue | 二项树 | binomial tree |
| 森林 | forest | 二项系数 | binomial coefficient |
| 进位 | carry | 合并等大树 | combine trees |
| 左孩子/右兄弟 | LeftChild / NextSibling | 摊还 | amortized |

---

## 1. 动机：为什么 $O(\log N)$ 的插入「不够好」

课件开场三连问：

- 左式堆、斜堆插入的（平均）时间是多少？→ $O(\log N)$。
- 「$O(\log N)$ 有什么问题？」
- 往空二叉堆里插入 $N$ 个 key 的总时间是多少？→ 由 Weiss Theorem 5.1，**总时间 $O(N)$**（即**平均每次 $O(1)$**）。

**所以**：如果我们只在**平均意义**上追求，$O(\log N)$ 的插入是**浪费的**。二项队列的目标就是：**把 `Insert` 的最坏情形也压到「摊还 $O(1)$」**，同时保持 merge 为 $O(\log N)$。

---

## 2. 结构与定义

### 2.1 二项树（binomial tree）

**【定义】** 二项队列**不是一棵堆序树，而是一组（collection）堆序树**，称为**森林（forest）**；每棵堆序树是一棵**二项树（binomial tree）**。

- **高度为 0 的二项树 $B_0$** 是单结点树；
- **高度为 $k$ 的二项树 $B_k$**：把一棵 $B_{k-1}$ **接到另一棵 $B_{k-1}$ 的根上**（根小者作为新根）形成。

于是：

$$B_k = \text{根} + \text{子树 } B_0, B_1, \dots, B_{k-1}\ (\text{共 } k \text{ 棵})$$

**观察（重要性质）**：

| 性质 | 结论 |
|---|---|
| $B_k$ 的结点数 | $2^k$ |
| $B_k$ 的根的孩子 | $k$ 棵，分别是 $B_0, B_1, \dots, B_{k-1}$ |
| $B_k$ 中**深度 $d$ 的结点数** | $\dbinom{k}{d}$（二项系数 binomial coefficient）——「二项树」名字的由来 |
| $B_k$ 的高度 | $k$ |

![图 5-1 二项树 B0, B1, B2, B3 的构造：B_k 由两棵 B_{k-1} 连接而成](ADS/pictures/Chapter%205%20%E4%BA%8C%E9%A1%B9%E9%98%9F%E5%88%97%20AI%E7%B2%BE%E8%AE%B2/fig01_slide02.webp)

### 2.2 用二项树表示优先队列

**规则**：**$B_k$ 结构 + 堆序（heap order）+ 每种高度最多一棵二项树**。

因为任何整数 $N$ 有**唯一的二进制表示**，所以**任何规模的优先队列都能被一组二项树唯一表示**：

$$N = \sum_{i} b_i 2^i,\quad b_i \in \{0,1\} \ \Longrightarrow\ \text{若 } b_i=1 \text{ 则森林中含一棵 } B_i$$

**【例】规模 13 的优先队列**

$$13 = 2^0 + 2^2 + 2^3 = 1101_2$$

→ 森林 = $\{B_0,\ B_2,\ B_3\}$（没有 $B_1$）。

![图 5-2 13 = 1101₂ → 森林由 B0、B2、B3 组成，每棵树内部满足堆序](ADS/pictures/Chapter%205%20%E4%BA%8C%E9%A1%B9%E9%98%9F%E5%88%97%20AI%E7%B2%BE%E8%AE%B2/fig02_slide03.webp)

> **要点**：森林中树的**个数** = $N$ 的二进制中 1 的个数（popcount），最多 $\lfloor\log N\rfloor+1$ 棵。

---

## 3. 基本操作

### 3.1 FindMin

最小值一定在**某棵树的根**上（堆序性质）。根最多 $\lceil\log N\rceil$ 个，故 $T_p = O(\log N)$。

**优化**：额外记住当前最小值（并在 merge/deleteMin 时更新）→ $O(1)$。

### 3.2 Merge（核心：二进制加法）

**思想**：把两个二项队列看成两个二进制数，逐位相加，**进位（carry）**就是「把两棵等大的树合并成一棵更大的树」。

$$6 + 7 = 110_2 + 111_2 = 1101_2 = 13$$

**算法**：按高度从小到大扫描，维护进位 `Carry`：

```
for i = 0, 1, 2, ... :
    当前位有 3 个候选：T1 = H1 的 B_i、T2 = H2 的 B_i、Carry
    按「有几个 1」分 8 种情况（见下表）
```

**复杂度**：$T_p = O(\log N)$（逐位扫描，每位 $O(1)$）。
**前提**：**必须让森林中的树按高度有序存放**（课件原话：Must keep the trees in the binomial queue sorted by height），否则无法对应二进制位。

![图 5-3 两个二项队列合并 = 二进制加法 110₂ + 111₂ = 1101₂（带进位 carry）](ADS/pictures/Chapter%205%20%E4%BA%8C%E9%A1%B9%E9%98%9F%E5%88%97%20AI%E7%B2%BE%E8%AE%B2/fig03_slide04.webp)

**8 种情况表**（`switch( 4*!!Carry + 2*!!T2 + !!T1 )`，位权：Carry=4, T2=2, T1=1）：

| case | Carry | T2 | T1 | 处理 | 新 Carry |
|---|---|---|---|---|---|
| 000 (0) | 0 | 0 | 0 | 什么都不做 | 0 |
| 001 (1) | 0 | 0 | 1 | 保留 T1 | 0 |
| 010 (2) | 0 | 1 | 0 | 把 T2 搬到 H1 | 0 |
| 011 (3) | 0 | 1 | 1 | `Carry = Combine(T1,T2)`，本位清空 | 1 |
| 100 (4) | 1 | 0 | 0 | 把 Carry 放到本位 | 0 |
| 101 (5) | 1 | 0 | 1 | `Carry = Combine(T1,Carry)` | 1 |
| 110 (6) | 1 | 1 | 0 | `Carry = Combine(T2,Carry)` | 1 |
| 111 (7) | 1 | 1 | 1 | 本位放 Carry，`Carry = Combine(T1,T2)` | 1 |

> 记忆：**「三个里挑两个合并，剩下的留在本位」**——就是二进制加法的「三数相加，和本位、进位」。

**合并两棵等大树的 `CombineTrees`（$O(1)$）**：

```c
BinTree CombineTrees( BinTree T1, BinTree T2 )
{   /* merge equal-sized T1 and T2 */
    if ( T1->Element > T2->Element )
        return CombineTrees( T2, T1 );      /* 大根挂到小根下 */
    T2->NextSibling = T1->LeftChild;        /* 把 T2 插到 T1 孩子链的头部 */
    T1->LeftChild = T2;
    return T1;
}
```

![图 5-4 CombineTrees：把大根树挂到小根树的左孩子链首（O(1)）](ADS/pictures/Chapter%205%20%E4%BA%8C%E9%A1%B9%E9%98%9F%E5%88%97%20AI%E7%B2%BE%E8%AE%B2/fig05_slide09.webp)

### 3.3 Insert

**`Insert(X)` = `Merge(H, {X})`** —— 插入一个单结点队列（只有 $B_0$）。

**【例】依次插入 1..7**：森林的变化正好对应计数的二进制进位：

| 插入后 | $N$ | 二进制 | 森林 |
|---|---|---|---|
| 1 | 1 | 001 | $B_0$ |
| 2 | 2 | 010 | $B_1$ |
| 3 | 3 | 011 | $B_1, B_0$ |
| 4 | 4 | 100 | $B_2$ |
| 5 | 5 | 101 | $B_2, B_0$ |
| 6 | 6 | 110 | $B_2, B_1$ |
| 7 | 7 | 111 | $B_2, B_1, B_0$ |

**代价**：若「最小的不存在的二项树是 $B_i$」，则 $T_p = \text{Const}\cdot(i+1)$（从 $B_0$ 一路进位到 $B_i$）。

**结论**：对空队列做 $N$ 次插入，**最坏总时间 $O(N)$**，即**平均（摊还）$O(1)$**。

> 直观：这和「二进制计数器加 1」完全一样 —— 每次加 1 的**摊还**位翻转次数是 2（见 3.5 的证明）。

### 3.4 DeleteMin

**步骤（4 步）**：

1. **Step 1**：遍历所有根，找到最小值所在的树 $B_k$ —— $O(\log N)$；
2. **Step 2**：把 $B_k$ 从 $H$ 中摘除，得到 $H'$ —— $O(1)$；
3. **Step 3**：删掉 $B_k$ 的根，它的孩子 $B_0,\dots,B_{k-1}$ 恰好是 $k$ 棵**互不相同高度**的二项树 → 直接构成一个新队列 $H''$（规模 $2^k-1$）—— $O(\log N)$；
4. **Step 4**：`Merge(H', H'')` —— $O(\log N)$。

**总代价**：$O(\log N)$。

![图 5-5 DeleteMin 四步：找最小根 → 摘树 → 拆根的孩子成新队列 → 合并 H′ 与 H″](ADS/pictures/Chapter%205%20%E4%BA%8C%E9%A1%B9%E9%98%9F%E5%88%97%20AI%E7%B2%BE%E8%AE%B2/fig04_slide06.webp)

### 3.5 数据结构实现

```c
typedef struct BinNode *Position;
typedef struct Collection *BinQueue;
typedef struct BinNode *BinTree;

struct BinNode {
    ElementType Element;
    Position    LeftChild;      /* 第一个孩子 */
    Position    NextSibling;    /* 下一个兄弟 */
};

struct Collection {
    int      CurrentSize;              /* 总结点数 */
    BinTree  TheTrees[ MaxTrees ];     /* 按高度存：TheTrees[i] 是 B_i 或 NULL */
};
```

**两个关键设计（对应课件 Discussion 7、8）**：

| 问题 | 答案 |
|---|---|
| 如何快速访问所有子树？（DeleteMin 要拆根的孩子） | 用 **左孩子–右兄弟（left-child, next-sibling）** 表示：每个结点的孩子用**单链表**串起来，删根后顺着 `NextSibling` 就能 $O(1)$ 拿到每棵子树 |
| 子树必须按什么顺序链接？ | 孩子的**大小（高度）从大到小**挂在链首 —— 因为 `CombineTrees` 总是把新树插到 `LeftChild` 头部，所以 $B_k$ 的孩子链是 $B_{k-1}, B_{k-2},\dots,B_0$；DeleteMin 时**逆序**填入 `TheTrees[j]`（`for j = MinTree-1 downto 0`）正好恢复升序 |

---

## 4. 为什么 $N$ 次插入是 $O(N)$：两种证明

**【Claim】** 由 $N$ 次连续插入构建的二项队列，总时间 $O(N)$。（虽然单次最坏 $O(\log N)$。）

### 4.1 证明 1：聚合法（aggregate analysis）

观察 $N$ 次插入中「链接（link）」的总次数：
- $B_0$ 每 2 次插入出现 1 次链接 → 总共 $\lfloor N/2 \rfloor$ 次；
- $B_1$ 每 4 次插入出现 1 次 → $\lfloor N/4 \rfloor$ 次；
- $B_i$ 每 $2^{i+1}$ 次插入出现 1 次 → $\lfloor N/2^{i+1}\rfloor$ 次。

$$\text{Total links} = \sum_{i\ge 0}\left\lfloor \frac{N}{2^{i+1}}\right\rfloor < N$$

- **总步数（step）** $= N$（每次插入至少 1 步）；
- **总链接数** $< N$；
- 故总代价 $< 2N = O(N)$。∎

**直观**：「昂贵的插入会**消除**树，便宜的插入会**创造**树」——昂贵的操作不可能连续发生。

![图 5-6 聚合法：N 次插入总步数 N、总链接数 < N，故总代价 O(N)](ADS/pictures/Chapter%205%20%E4%BA%8C%E9%A1%B9%E9%98%9F%E5%88%97%20AI%E7%B2%BE%E8%AE%B2/fig06_slide12.webp)

### 4.2 证明 2：势能法（potential method）

- 令 $C_i$ := 第 $i$ 次插入的**实际代价**；
- 令 $\Phi_i$ := 第 $i$ 次插入后**森林中树的个数**（$\Phi_0 = 0$）。

**关键观察**：一次代价为 $c$ 的插入（链接了 $c-1$ 次），会使森林中树的个数**净增加 $2-c$**：

$$\Phi_i - \Phi_{i-1} = 2 - c$$

于是摊还代价

$$\hat C_i = C_i + \Phi_i - \Phi_{i-1} = c + (2-c) = 2$$

对所有 $i$ 求和：总代价 $= 2N - \Phi_N \le 2N$。

$$\boxed{T_{\text{worst}} = O(\log N)\ \text{（单次）},\qquad T_{\text{amortized}} = 2 = O(1)}$$

![图 5-7 势能法：Φ = 森林中树的个数，每次插入摊还代价恰为 2](ADS/pictures/Chapter%205%20%E4%BA%8C%E9%A1%B9%E9%98%9F%E5%88%97%20AI%E7%B2%BE%E8%AE%B2/fig07_slide13.webp)

> **为什么势函数取「树的个数」？** 因为它恰好等于 $N$ 的 popcount —— 每次「进位」减少树数、每次「不进位」增加一棵树，一增一减正好抵消，得到常数摊还代价。

---

## 5. 与其他可合并堆的比较

| | 二叉堆 | 左式堆 | 斜堆 | **二项队列** | （补充）斐波那契堆 |
|---|---|---|---|---|---|
| `Insert` | $O(\log N)$ / 平均 $O(1)$ | $O(\log N)$ | 摊还 $O(\log N)$ | **摊还 $O(1)$** | 摊还 $O(1)$ |
| `FindMin` | $O(1)$ | $O(1)$ | $O(1)$ | $O(\log N)$ / 缓存后 $O(1)$ | $O(1)$ |
| `DeleteMin` | $O(\log N)$ | $O(\log N)$ | 摊还 $O(\log N)$ | $O(\log N)$ | 摊还 $O(\log N)$ |
| `Merge` | $O(N)$ | $O(\log N)$ | 摊还 $O(\log N)$ | $O(\log N)$ | $O(1)$ |
| `DecreaseKey` | $O(\log N)$ | 不支持/需父指针 | 不支持 | 不支持（无父指针） | **摊还 $O(1)$** |
| 实现难度 | 低 | 中 | 低 | **较高（8 种 case）** | 高 |

> **延伸（课件 Research Project 1）**：Dijkstra 最短路 + 优先队列。用二叉堆是 $O((V+E)\log V)$，用**斐波那契堆（Fibonacci heap）**可降到 $O(E + V\log V)$ —— 因为 `DecreaseKey` 摊还 $O(1)$。这是「数据结构选择决定算法复杂度」的经典案例（详见 `https://pintia.cn/` 的项目要求）。

---

## 6. 易错点与考点清单

1. **二项队列是「森林」不是「一棵树」**；$N$ 的二进制 1 的位决定有哪几棵树，**表示唯一**。
2. $B_k$ 有 $2^k$ 个结点、$k$ 个孩子（$B_0..B_{k-1}$）、高度 $k$、**深度 $d$ 有 $\binom{k}{d}$ 个结点**。
3. **Merge 必须按高度有序扫描**，否则无法与二进制位对应。
4. **8 种 case** 的本质是二进制加法（含进位）；`switch` 的位权是 $4\times\text{Carry} + 2\times\text{T2} + 1\times\text{T1}$。
5. `Insert` = 与单结点队列 merge；**摊还 $O(1)$、最坏 $O(\log N)$** —— 两个结论不能混。
6. `DeleteMin` 中「被删根的孩子恰好构成一个合法队列」（高度 $0..k-1$ 各一棵），这是二项树结构的巧妙之处。
7. **孩子链是逆序（大到小）**，DeleteMin 时要**逆序**装回 `TheTrees[]`。
8. $N$ 次插入 $O(N)$ 的两种证明：**聚合法**（总链接数 $<N$）与**势能法**（$\Phi$ = 树的个数，摊还代价 = 2）。
9. 与斐波那契堆的区别：二项队列的 merge 是 $O(\log N)$，斐波那契堆是 $O(1)$；二项队列不支持 `DecreaseKey`（无父指针）。

---

## 7. 参考

- Weiss, *Data Structure and Algorithm Analysis in C* (2nd ed.)：**Ch.5**，p.170–180（二项队列）；**Ch.11**，p.430–435（摊还分析）；M.A.Weiss 著、陈越改编，人民邮电出版社，2005。
- Cormen et al., *Introduction to Algorithms* (3rd ed.)：**Ch.19**（Binomial Heaps）p.505–530，The MIT Press, 2009。
