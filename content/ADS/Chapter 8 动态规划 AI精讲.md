---
title: Chapter 8 动态规划 · AI 精讲
aliases:
  - ADS/notes/Chapter 8 动态规划 AI精讲
---
# Chapter 8 动态规划（Dynamic Programming）

> **课件来源**：`ADS08DynamicProgramming_Stu.ppt`（19 页）
> **本章主线**：**用表代替递归（use a table instead of recursion）** —— 递归之所以慢，是因为**重叠子问题（overlapping sub-problems）被反复计算（redundant calculation）**；把这些答案存进表里，每个子问题只算一次 → 五个经典问题：Fibonacci、**矩阵链乘序（ordering matrix multiplications）**、**最优二叉搜索树（OBST）**、**全源最短路（all-pairs shortest path）**、**流水线装配（product assembly）** → 总结 DP 的设计四步与两大要素。

---

## 0. 本章速览

| 问题 | 状态定义 | 递推式 | 复杂度 |
|---|---|---|---|
| Fibonacci | $F(N)$ | $F(N)=F(N-1)+F(N-2)$ | 递归 $O(F(N))$ 指数 → 递推 $O(N)$ |
| 矩阵链乘序 | $m_{ij}$：$M_i\cdots M_j$ 的最优代价 | $m_{ij}=\min_{i\le k<j}\{m_{i,k}+m_{k+1,j}+r_{i-1}r_k r_j\}$ | $O(N^3)$，空间 $O(N^2)$ |
| 最优二叉搜索树（OBST） | $c_{ij}$：$w_i..w_j$ 的最优期望代价 | $c_{ij}=w_{ij}+\min_{k}\{c_{i,k-1}+c_{k+1,j}\}$ | $O(N^3)$（可优化到 $O(N^2)$） |
| 全源最短路（Floyd） | $D^k[i][j]$：只经 $\{0..k\}$ 的最短路径 | $D^k[i][j]=\min\{D^{k-1}[i][j],\ D^{k-1}[i][k]+D^{k-1}[k][j]\}$ | $O(N^3)$ |
| 流水线装配 | $f[\text{line}][\text{stage}]$ | 见 §6 | $O(N)$ 时间 / 空间 |

**DP 的两大要素**：**最优子结构（optimal substructure）** + **重叠子问题（overlapping sub-problems）**。

**术语对照**

| 中文 | English | 中文 | English |
|---|---|---|---|
| 动态规划 | dynamic programming, DP | 重叠子问题 | overlapping sub-problems |
| 最优子结构 | optimal substructure | 备忘录/记忆化 | memoization |
| 矩阵链乘序 | ordering matrix multiplications | 卡特兰数 | Catalan number |
| 最优二叉搜索树 | optimal binary search tree, OBST | 全源最短路 | all-pairs shortest path |
| 流水线装配 | assembly-line scheduling | 状态转移方程 | state transition equation |

---

## 1. 从 Fibonacci 说起：为什么「用表代替递归」

```c
int Fib( int N )                 /* 朴素递归：指数级 */
{   if ( N <= 1 )  return 1;
    else return Fib( N - 1 ) + Fib( N - 2 );
}
```

$$T(N) = T(N-1)+T(N-2) \ \Rightarrow\ T(N) \ge F(N) \ \Rightarrow\ T(N) = \Theta(\phi^N),\ \phi\approx1.618$$

即**计算一个斐波那契数本身就是指数级**的。

**麻烦制造者（trouble-maker）**：**冗余计算的爆炸式增长（the growth of redundant calculations is explosive）**。
以 $F(6)$ 为例，$F(2)$ 被算了 5 次、$F(3)$ 被算了 3 次……

![图 8-1 递归计算 F(6) 的调用树：同一子问题被反复求解（F(2) 出现 5 次）](ADS/pictures/Chapter%208%20%E5%8A%A8%E6%80%81%E8%A7%84%E5%88%92%20AI%E7%B2%BE%E8%AE%B2/fig01_slide03.webp)

**解决方案 1（记忆化 / memoization）**：把算过的答案记表，递归时先查表。
**解决方案 2（自底向上递推）**：只保留**最近两个值**：

```c
int Fibonacci( int N )
{   int i, Last, NextToLast, Answer;
    if ( N <= 1 )  return 1;
    Last = NextToLast = 1;              /* F(0) = F(1) = 1 */
    for ( i = 2; i <= N; i++ ) {
        Answer = Last + NextToLast;     /* F(i) = F(i-1) + F(i-2) */
        NextToLast = Last;  Last = Answer;
    }
    return Answer;
}
```

$$T(N) = O(N)\ (\text{时间}),\quad O(1)\ (\text{空间})$$

> **这一小节就是 DP 的全部精髓**：「**求解每个子问题只一次，并把答案存在表中**（solve sub-problems just once and save answers in a table）」。

---

## 2. 矩阵链乘序（Ordering Matrix Multiplications）

### 2.1 问题

矩阵乘法满足**结合律**，不同的加括号顺序计算量差异巨大。求**计算量最小**的加括号方案。

**【例】** $M_1[10\times20]\cdot M_2[20\times50]\cdot M_3[50\times1]\cdot M_4[1\times100]$

| 顺序 | 计算量 |
|---|---|
| $M_1\cdot(M_2\cdot(M_3\cdot M_4))$ | $50\cdot1\cdot100 + 20\cdot50\cdot100 + 10\cdot20\cdot100 = \mathbf{125{,}000}$ |
| $(M_1\cdot(M_2\cdot M_3))\cdot M_4$ | $20\cdot50\cdot1 + 10\cdot20\cdot1 + 10\cdot1\cdot100 = \mathbf{2{,}200}$ |

**最优仅是最差的 1.8%** —— 顺序必须优化。

### 2.2 为什么不能暴力枚举

设 $b_n$ = $n$ 个矩阵相乘的不同加括号方式数：$b_2=1,\ b_3=2,\ b_4=5,\ \dots$，则

$$b_n = \sum_{i=1}^{n-1} b_i\, b_{n-i} = \frac{1}{n}\binom{2n-2}{n-1} = \Omega\!\left(\frac{4^n}{n^{1.5}}\right)$$

这是 **Catalan 数（Catalan number）**，**指数级**，不能枚举。

### 2.3 DP 建模

**关键观察**：任何最优方案的最后一步一定是某个「切分点」$k$，把链切成 $M_i\cdots M_k$ 与 $M_{k+1}\cdots M_j$ 两部分：

$$M_{ij} = M_{i,k}\cdot M_{k+1,j}$$

**状态**：$m_{ij}$ = 计算 $M_i\cdots M_j$ 的**最少乘法次数**（$M_i$ 是 $r_{i-1}\times r_i$ 矩阵）。

**状态转移方程**：

$$m_{ij} = \min_{i \le k < j}\left\{\, m_{i,k} + m_{k+1,j} + r_{i-1}\,r_k\,r_j \right\},\qquad m_{ii}=0$$

**计算顺序**：按**区间长度 $k=j-i$ 从小到大** —— 因为 $m_{ij}$ 只依赖长度更小的区间（$y-x<k$）。这正是「**按某种顺序计算（compute the values in some order）**」。

**子问题个数**：只有 $O(N^2)$ 个 $M_{ij}$，每个 $O(N)$ 种切分 → 总 $O(N^3)$。

![图 8-2 矩阵链乘：只有 O(N²) 个子问题 M_ij，按区间长度递增填表](ADS/pictures/Chapter%208%20%E5%8A%A8%E6%80%81%E8%A7%84%E5%88%92%20AI%E7%B2%BE%E8%AE%B2/fig02_slide05.webp)

### 2.4 代码

```c
/* r contains number of columns for each of the N matrices; r[0] is #rows of matrix 1 */
/* Minimum number of multiplications is left in M[1][N] */
void OptMatrix( const long r[ ], int N, TwoDimArray M )
{   int  i, j, k, L;
    long ThisM;
    for ( i = 1; i <= N; i++ )   M[i][i] = 0;
    for ( k = 1; k < N; k++ )                    /* k = j - i：区间长度 */
        for ( i = 1; i <= N - k; i++ ) {         /* 起点 */
            j = i + k;   M[i][j] = Infinity;
            for ( L = i; L < j; L++ ) {          /* 枚举切分点 */
                ThisM = M[i][L] + M[L+1][j] + r[i-1] * r[L] * r[j];
                if ( ThisM < M[i][j] )  M[i][j] = ThisM;    /* 取最小 */
            }
        }
}
```

$T(N)=O(N^3)$，空间 $O(N^2)$。要**输出方案**，需另开一个 $O(N^2)$ 的 `lastChange[i][j]` 记录最优 $k$，再递归/迭代打印括号（Weiss 图 10.46, p.388）。

---

## 3. 最优二叉搜索树（Optimal Binary Search Tree, OBST）

**适用场景**：**静态查找**（static searching，无插入删除）—— 一旦建好就不再改，因此值得花时间构造最优形状。

**问题**：给定 $N$ 个有序词 $w_1 < w_2 < \dots < w_N$，查找 $w_i$ 的概率为 $p_i$。构造一棵 BST，使**期望总访问时间（expected total access time）** 最小。

**注意**：这就是「带权最优二叉树 / 哈夫曼」的**有序版本** —— 哈夫曼树不要求中序有序，而 OBST 必须保持 BST 的中序次序，所以**贪心（Huffman）不能直接用**，必须 DP。

### 3.1 状态定义

| 记号 | 含义 |
|---|---|
| $T_{ij}$ | 由 $w_i,\dots,w_j$ 构成的 OBST（$i\le j$） |
| $c_{ij}$ | $T_{ij}$ 的**期望查找代价**（$c_{ii}=p_i$；空树 $c_{i,i-1}=0$） |
| $r_{ij}$ | $T_{ij}$ 的**根**（用于重建树） |
| $w_{ij}$ | $T_{ij}$ 的**权重** = $\sum_{k=i}^{j} p_k$（$w_{ii}=p_i$） |

### 3.2 递推（关键一步）

若 $T_{ij}$ 的**根是 $w_k$**，则：
- 查找 $w_k$ 代价 $p_k$；
- 左子树 $T_{i,k-1}$ 中每个词的深度都 **+1** → 代价增加 $w_{i,k-1}$；
- 右子树 $T_{k+1,j}$ 同理增加 $w_{k+1,j}$。

于是

$$c_{ij} = p_k + c_{i,k-1} + c_{k+1,j} + w_{i,k-1} + w_{k+1,j} = \boxed{w_{ij} + c_{i,k-1} + c_{k+1,j}}$$

**最优性原理**：$T_{ij}$ 最优 $\Rightarrow$ 其左右子树也必须最优 $\Rightarrow$

$$c_{ij} = w_{ij} + \min_{i\le k\le j}\left\{\,c_{i,k-1} + c_{k+1,j}\,\right\},\qquad r_{ij} = \arg\min_k$$

复杂度 $O(N^3)$（$O(N^2)$ 个状态 × $O(N)$ 个根），可用**Knuth 优化**（根的单调性 $r_{i,j-1}\le r_{ij}\le r_{i+1,j}$）降到 $O(N^2)$（Weiss §10.33, p.419）。

### 3.3 完整算例

词（按字典序）与概率：

| word | break | case | char | do | return | switch | void |
|---|---|---|---|---|---|---|---|
| $p$ | 0.22 | 0.18 | 0.20 | 0.05 | 0.25 | 0.02 | 0.08 |

**按区间长度逐步填表**（每格格式：$c_{ij}$ / 根 $r_{ij}$）：

| 长度 | 各区间的最优代价与根 |
|---|---|
| $L=1$ | break 0.22 / break｜case 0.18 / case｜char 0.20 / char｜do 0.05 / do｜return 0.25 / return｜switch 0.02 / switch｜void 0.08 / void |
| $L=2$ | break..case 0.58 / break｜case..char 0.56 / char｜char..do 0.30 / char｜do..return 0.35 / return｜return..switch 0.29 / return｜switch..void 0.12 / void |
| $L=3$ | break..char 1.02 / case｜case..do 0.66 / char｜char..return 0.80 / return｜do..switch 0.39 / return｜return..void 0.47 / return |
| $L=4$ | break..do 1.17 / case｜case..return 1.21 / char｜char..switch 0.84 / return｜do..void 0.57 / return |
| $L=5$ | break..return 1.83 / char｜case..switch 1.27 / char｜char..void 1.02 / return |
| $L=6$ | break..switch 1.89 / char｜case..void 1.53 / char |
| $L=7$ | **break..void 2.15 / char** |

**最优树**（根 `char`，期望代价 **2.15**）：

```
            char(.20)
           /          \
      break(.22)     return(.25)
        \            /         \
      case(.18)   do(.05)    void(.08)
                              /
                          switch(.02)
```

**验证**：$0.20 + 2(0.22+0.25) + 3(0.18+0.05+0.08) + 4(0.02) = 0.20+0.94+0.93+0.08 = 2.15$ ✓

![图 8-3 OBST 的填表过程（按长度递增），最终 c(1,7)=2.15，根为 char](ADS/pictures/Chapter%208%20%E5%8A%A8%E6%80%81%E8%A7%84%E5%88%92%20AI%E7%B2%BE%E8%AE%B2/fig03_slide09.webp)

> **课件 Discussion 10**：如果改用「贪心法」或「AVL 旋转」来建树，期望访问时间是多少？—— 贪心（每次取最大概率为根）**不保证全局最优**，AVL 只保证高度平衡而**完全不看概率**，二者都劣于 OBST。这说明**「平衡」不等于「最优」**：查找代价的最优性取决于**访问概率分布**。

---

## 4. 全源最短路径（All-Pairs Shortest Path）

**问题**：对任意 $v_i, v_j$（$i\ne j$），求最短路径长度。

**两种方法**：

| 方法 | 做法 | 复杂度 | 适用 |
|---|---|---|---|
| 方法 1 | 对每个源点跑一次单源最短路（Dijkstra/Bellman-Ford） | $O(\vert V\vert^3)$（或 $O(\vert V\vert^2\log V+\vert V\vert\vert E\vert)$） | **稀疏图**更快 |
| **方法 2（DP，Floyd）** | 递推加入中间顶点 | $O(\vert V\vert^3)$ | **稠密图**更快，实现极简 |

**DP 建模**：

$$D^k[i][j] = \min\{\ \text{从 } i \text{ 到 } j,\ \text{中间只允许经过 } \{0,1,\dots,k\} \text{ 的路径长度}\ \}$$

且 $D^{-1}[i][j] = \text{Cost}[i][j]$（邻接矩阵）。最终答案 $D^{N-1}[i][j]$。

**递推（两种情形）**：已知 $D^{k-1}$ 时，
1. 顶点 $k$ **不在**最短路径上 → $D^k[i][j] = D^{k-1}[i][j]$；
2. 顶点 $k$ **在**最短路径上 → 路径可拆成「$i\to k$」+「$k\to j$」，且两段都只用前 $k-1$ 个顶点：

$$D^k[i][j] = D^{k-1}[i][k] + D^{k-1}[k][j]$$

合起来：

$$\boxed{D^k[i][j] = \min\left\{D^{k-1}[i][j],\ D^{k-1}[i][k]+D^{k-1}[k][j]\right\}}$$

**实现**（就地更新，$D$ 的维度可省掉 $k$）：

```c
/* A[] adjacency matrix with A[i][i] = 0; D[] holds shortest path values */
void AllPairs( TwoDimArray A, TwoDimArray D, int N )
{   int  i, j, k;
    for ( i = 0; i < N; i++ )          /* Initialize D */
        for ( j = 0; j < N; j++ )
            D[i][j] = A[i][j];
    for ( k = 0; k < N; k++ )          /* add one vertex k into the path */
        for ( i = 0; i < N; i++ )
            for ( j = 0; j < N; j++ )
                if ( D[i][k] + D[k][j] < D[i][j] )
                    D[i][j] = D[i][k] + D[k][j];   /* Update shortest path */
}
```

**要点**：
- $T(N)=O(N^3)$，但**常数极小**（三重循环 + 一次比较），在**稠密图**上比「$|V|$ 次 Dijkstra」更快；
- **允许负权边**，但**不能有负权环**（negative-cost cycle）；
- 判负环：**若存在 $i$ 使 $D[i][i]<0$，则存在负权环**（注释里写明）；
- 记录路径需另一个 $O(N^2)$ 的 `Path[i][j]` 表（Weiss 图 10.53, p.393）。

> **易错**：$k$ 必须在**最外层**！若把 $k$ 放最内层，就变成「只允许一条中间边」的松弛，结果错误。

---

## 5. DP 的设计四步（课件版）

1. **刻画最优解的结构（characterize an optimal solution）** —— 最优解包含子问题的最优解（最优子结构）；
2. **递归地定义最优值（recursively define the optimal values）** —— 写出状态转移方程；
3. **按某种顺序计算这些值（compute the values in some order）** —— 保证依赖的子问题已算好（自底向上填表）；
4. **重建求解策略（reconstruct the solving strategy）** —— 用额外的「决策表」回溯出具体方案。

---

## 6. 案例：流水线装配（Product Assembly / Assembly-Line Scheduling）

**问题**：同一种汽车有**两条装配线**，每个工位（stage）的加工时间不同；可以在工位之间**换线**（有换线时间）。求**总装配时间最小**的方案。

- $t_{0,j}, t_{1,j}$：第 $j$ 个工位在 0/1 线上的加工时间；
- $t_{0\to1,j}, t_{1\to0,j}$：在第 $j$ 个工位后换线的时间；
- **穷举**：$O(2^N)$ 时间 + $O(N)$ 空间 —— 不可接受。

### 6.1 最优子结构

> **An optimal solution contains an optimal solution of a sub-problem!**

若到达第 $j$ 个工位的最优路径经过第 $j-1$ 工位的某条线，则「到达 $j-1$ 的那一段」也必须是**到 $j-1$ 的最优路径**（否则替换成更优的一段就能改进整体）。

![图 8-4 装配线问题的最优子结构：到 stage 的最优路径基于到 stage−1 的最优路径](ADS/pictures/Chapter%208%20%E5%8A%A8%E6%80%81%E8%A7%84%E5%88%92%20AI%E7%B2%BE%E8%AE%B2/fig04_slide14.webp)

### 6.2 状态与转移

$$f[\text{line}][\text{stage}] = \min\begin{cases} f[\text{line}][\text{stage}-1] + t_{\text{process}}[\text{line}][\text{stage}-1] & \text{（不换线）}\\[4pt] f[1-\text{line}][\text{stage}-1] + t_{\text{transit}}[1-\text{line}][\text{stage}-1] & \text{（换线）}\end{cases}$$

**计算顺序**：`stage` 从 1 到 $n$，`line` 从 0 到 1（**按阶段推进**，因为只依赖上一阶段）。

$$T = O(N)\ \text{时间} + O(N)\ \text{空间}$$

![图 8-5 状态转移：两条线、每个 stage 取「留下」或「换线」的较小者](ADS/pictures/Chapter%208%20%E5%8A%A8%E6%80%81%E8%A7%84%E5%88%92%20AI%E7%B2%BE%E8%AE%B2/fig05_slide15.webp)

### 6.3 重建方案

再开一个表 $L[\text{line}][\text{stage}]$ 记录**每个状态是从哪条线来的**，最后从终点倒推：

```c
f[0][0]=0; L[0][0]=0;
f[1][0]=0; L[1][0]=0;
for (stage=1; stage<=n; stage++)
    for (line=0; line<=1; line++) {
        f_stay = f[line][stage-1] + t_process[line][stage-1];
        f_move = f[1-line][stage-1] + t_transit[1-line][stage-1];
        if (f_stay < f_move) { f[line][stage] = f_stay; L[line][stage] = line; }
        else                 { f[line][stage] = f_move; L[line][stage] = 1-line; }
    }

line = (f[0][n] < f[1][n]) ? 0 : 1;
for (stage=n; stage>0; stage--) {      /* 倒推 */
    plan[stage] = line;
    line = L[line][stage];
}
```

![图 8-6 重建方案：用 L[line][stage] 记录来源，从终点倒推得到每个工位选哪条线](ADS/pictures/Chapter%208%20%E5%8A%A8%E6%80%81%E8%A7%84%E5%88%92%20AI%E7%B2%BE%E8%AE%B2/fig06_slide16.webp)

---

## 7. 什么时候不能用动态规划？（Discussion 11）

**【要素 1】最优子结构（optimal substructure）**
问题的最优解**必须**由子问题的最优解构成。**反例**：
- **最长简单路径（longest simple path）**：子问题的最优解拼接后可能形成环/重复顶点，不满足最优子结构（而**最短路**满足，因为子路径可独立替换）；
- **无后效性被破坏**：若决策会改变后续可选集合（如带「资源约束」的路径问题），需要把约束加入状态。

**【要素 2】重叠子问题（overlapping sub-problems）**
子问题必须**被重复用到**。**反例**：
- **归并排序 / 二分查找**：子问题互不重叠（每次规模减半且只出现一次），用**分治**即可，DP 反而浪费空间；
- 若子问题数量巨大（如状态空间 $2^N$），DP 退化为「记住所有状态」，等价于暴力。

**归纳为一句话**：
> **有最优子结构 + 子问题重叠 → 用 DP；只有最优子结构、子问题不重叠 → 用分治/贪心；连最优子结构都没有 → 用回溯/搜索（可能 NP-hard）。**

---

## 8. 易错点与考点清单

1. **DP 的本质是「每个子问题只算一次」**；递归 + 记忆化（memoization）与自底向上递推等价，前者更适合状态稀疏的情形。
2. **矩阵链乘**：$m_{ij}$ 按**区间长度递增**填表；代价项是 $r_{i-1}r_k r_j$（三个维度相乘），不是 $r_ir_j$。
3. 加括号方案数是 **Catalan 数** $\frac{1}{n}\binom{2n-2}{n-1}=\Omega(4^n/n^{1.5})$，不能枚举。
4. **OBST 的递推**：$c_{ij}=w_{ij}+c_{i,k-1}+c_{k+1,j}$ —— 别漏掉 $w_{ij}$（它代表「子树深度整体 +1」的代价）。
5. OBST 的**基例**：$c_{ii}=p_i$，空树 $c_{i,i-1}=0$（写成 $c_{ii}=0$ 会算错，如本例会得到 1.90 而非 2.15）。
6. **OBST ≠ Huffman**：Huffman 不要求有序（中序），OBST 必须满足 BST 次序；因此 OBST 不能用贪心。
7. **Floyd 的 $k$ 必须在最外层**；就地更新 $D$ 是安全的（因为第 $k$ 轮中 $D[i][k]$、$D[k][j]$ 不会被改坏）。
8. **Floyd 允许负权边、不允许负权环**；负环检测：$\exists i,\ D[i][i]<0$。
9. **稀疏图**用「$|V|$ 次单源最短路」，**稠密图**用 Floyd（常数更小）。
10. DP 失效的典型原因：**无最优子结构**（最长简单路径）或**无重叠子问题**（归并排序）。

---

## 9. 参考

- Cormen et al., *Introduction to Algorithms* (3rd ed.)：**Ch.15**（Dynamic Programming）p.359–413，The MIT Press, 2009。
- Weiss, *Data Structure and Algorithm Analysis in C* (2nd ed.)：Ch.10（矩阵链乘序 Fig 10.46；OBST §10.33；Floyd Fig 10.53）；M.A.Weiss 著、陈越改编，人民邮电出版社，2005。
- 课程 Project 3：*Beautiful Subsequence*（统计含「相邻差 ≤ m」的子序列个数），DP + 计数技巧，详见 `https://pintia.cn/`。
