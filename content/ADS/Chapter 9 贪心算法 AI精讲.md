---
title: Chapter 9 贪心算法 · AI 精讲
aliases:
  - ADS/notes/Chapter 9 贪心算法 AI精讲
---
# Chapter 9 贪心算法（Greedy Algorithms）

> **课件来源**：`ADS09Greedy_Stu.ppt` / `ADS09Greedy_Tch.ppt`（各 17 页，教师版含答案）
> **本章主线**：**每一步都做当前看起来最好的选择，且永不反悔** → 但「局部最优 = 全局最优」**只在特定条件下成立**（贪心选择性质 + 最优子结构）→ 用**活动选择（activity selection）**演示「四个贪心规则里只有第三个错、第四个对」→ 用**Huffman 编码**演示贪心的严格证明与 $O(C\log C)$ 实现。

---

## 0. 本章速览

| 问题 | 贪心准则 | 复杂度 | 结果 |
|---|---|---|---|
| 活动选择（activity selection） | 每次选**结束最早**的相容活动 | $O(N\log N)$（排序） | **最优** |
| Huffman 编码 | 每次合并**频率最小**的两棵树 | $O(C\log C)$（最小堆） | **最优前缀码** |

**贪心的三层认知**（课件原话的三层递进）：

1. **贪心只有在「局部最优 = 全局最优」时才有效**（local optimum equals global optimum）；
2. 贪心**不保证最优解**，但通常给出**非常接近最优的解（启发式 heuristics）**；
3. 当求最优解**太花时间**时，贪心在直觉上很有吸引力 —— 这就是为什么工程中大量使用贪心。

**术语对照**

| 中文 | English | 中文 | English |
|---|---|---|---|
| 优化问题 | optimization problem | 约束 | constraint |
| 可行解 | feasible solution | 最优解 | optimal solution |
| 贪心准则 | greedy criterion | 贪心选择性质 | greedy-choice property |
| 最优子结构 | optimal substructure | 前缀码 | prefix code |
| Huffman 编码 | Huffman codes | 满二叉树 | full binary tree |
| 启发式 | heuristic | 笨重的 | cumbersome |

---

## 1. 优化问题与贪心方法

**【定义】优化问题（optimization problem）**：给定**一组约束（constraints）** 与一个**优化函数（optimization function）**。
- 满足约束的解称为**可行解（feasible solution）**；
- 使优化函数取到最好值的可行解称为**最优解（optimal solution）**。

**【定义】贪心方法（the greedy method）**：在**每个阶段（stage）** 依据某个**贪心准则（greedy criterion）** 做出**当前最好**的决策；**一个阶段做出的决策在后续阶段不再改变**，因此每个决策都必须**保证可行性（assure feasibility）**。

> 关键词是「**不反悔**（not changed in a later stage）」—— 这正是贪心与 DP / 回溯的分水岭：DP 会保留所有选择的可能，回溯会撤销；贪心**一条路走到黑**，因此必须**事先证明安全**。

---

## 2. 案例一：活动选择问题（Activity Selection Problem）

### 2.1 问题定义

给定活动集合 $S=\{a_1,a_2,\dots,a_n\}$，都想使用**同一个资源**（例如一间教室）。每个活动 $a_i$ 占用时间区间 $[s_i, f_i)$。

**相容（compatible）**：$a_i$ 与 $a_j$ 相容 $\iff s_i \ge f_j$ 或 $s_j \ge f_i$（时间区间不重叠）。

**目标**：选出**最大规模**的**互相相容**的活动子集。

**假设**：活动已按结束时间排序 $f_1 \le f_2 \le \dots \le f_n$。

**课件数据（11 个活动）**：

| $i$ | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| $s_i$ | 1 | 3 | 0 | 5 | 3 | 5 | 6 | 8 | 8 | 2 | 12 |
| $f_i$ | 4 | 5 | 6 | 7 | 9 | 9 | 10 | 11 | 12 | 14 | 16 |

![图 9-1 活动选择：11 个活动的时间区间与相容性](ADS/pictures/Chapter%209%20%E8%B4%AA%E5%BF%83%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig01_slide04.webp)

### 2.2 先看 DP 解法

把问题看成「区间上的最优子问题」：$S_{ij}$ = 在 $a_i$ 结束后开始、在 $a_j$ 开始前结束的活动集合（**开区间，$i$ 与 $j$ 都不含在内**）。

$$c_{ij} = \max_{a_k \in S_{ij}}\left\{ c_{ik} + c_{kj} + 1 \right\}$$

这是**带权区间调度**的雏形，$O(N^3)$（朴素）或 $O(N^2)$。

![图 9-2 DP 解法的子问题 Sij（开区间：i、j 均不含）](ADS/pictures/Chapter%209%20%E8%B4%AA%E5%BF%83%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig02_slide05.webp)

### 2.3 四个贪心规则：哪个对？

| 规则 | 准则 | 是否正确 | 反例思路 |
|---|---|---|---|
| **Rule 1** | 选**开始最早**（start earliest）的 | ✗ | 一个很早开始、极长的活动会「锁死」整个时间轴 |
| **Rule 2** | 选**最短**（shortest）的 | ✗ | 两个短活动夹在一个长活动中间，短的可能与两者都冲突 |
| **Rule 3** | 选**与其他剩余活动冲突最少**（fewest conflicts）的 | ✗ | 冲突数少 ≠ 能被选进最优解（局部最「孤僻」的活动可能占用关键时段） |
| **Rule 4** | 选**结束最早**（ends first）的 | ✓ | —— |

**Rule 4 为什么对？** 因为**「资源尽早空闲下来」**（resource becomes free as soon as possible）—— 结束最早的活动留下的剩余时间最多，后续可选空间最大。这是「**尽早释放资源**」这一朴素直觉的严格化。

![图 9-3 四个贪心规则：只有「结束最早」（Rule 4）是正确的](ADS/pictures/Chapter%209%20%E8%B4%AA%E5%BF%83%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig03_slide06.webp)

**课件数据的最优解**：$a_1(f=4) \to a_4(s=5,f=7) \to a_8(s=8,f=11) \to a_{11}(s=12,f=16)$，共 **4** 个活动（$\{1,4,8,11\}$；另一组最优解为 $\{2,4,9,11\}$）。

> **Tch 版补充问题**：「如果改成选**开始最晚**（starts latest）的活动呢？」→ **答案：Yes，也对**（把时间轴左右翻转，与「结束最早」对称）。

### 2.4 正确性证明（贪心选择性质）

**① 算法给出的是相容活动集**（显然：每次只选与已选集合相容的活动）。

**② 结果是最优的** —— 依靠下面的定理：

**【定理】** 对任意非空子问题 $S_k$，设 $a_m$ 是 $S_k$ 中**结束最早**的活动，则 $a_m$ 一定属于 $S_k$ 的**某个最大相容活动子集**。

**证明（交换论证 exchange argument）**：
设 $A_k$ 是 $S_k$ 的一个最优解，$a_{ef}$ 是 $A_k$ 中**结束最早**的活动。
- 若 $a_m = a_{ef}$，证毕；
- 否则，用 $a_m$ **替换** $a_{ef}$ 得到 $A_k'$：因为 $f_m \le f_{ef}$，所以 $a_m$ 与 $A_k$ 中其余活动**仍然相容**（$a_m$ 结束得更早，不会与后面的活动冲突），且 $|A_k'| = |A_k|$。
- 故 $A_k'$ 也是一个最优解，且包含 $a_m$。∎

> **这就是「贪心选择性质（greedy-choice property）」的标准证法**：**假设存在最优解不含贪心选择 → 用交换把它替换成含贪心选择的最优解**。

**实现**：
1. 选第一个活动（结束最早的），**递归**求解剩余部分；
2. **消除尾递归（remove tail recursion）→ 改成迭代**。

$$T = O(N\log N)\quad(\text{排序开销；若已有序则 } O(N))$$

![图 9-4 正确性证明：用「结束更早的 am」替换「aef」，仍得最优解](ADS/pictures/Chapter%209%20%E8%B4%AA%E5%BF%83%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig04_slide07.webp)

### 2.5 加权重后贪心失效（重要！）

若每个活动有**权重（weight）**，要求**总权重最大**的子集（weighted interval scheduling）：

$$c_{1j} = \max\left\{\, c_{1,j-1},\ w_j + c_{1,k(j)} \right\}$$

其中 $c_{1,j}$ 是 $a_1..a_j$ 的最优解，$a_{k(j)}$ 是**与 $a_j$ 相容的、结束在 $a_j$ 之前最近的**活动。

| 问题 | DP 还对吗？ | 贪心还对吗？ |
|---|---|---|
| 无权（等权） | ✓ | ✓ |
| **带权** | **✓ 仍然正确** | **✗ 不再正确** |

**反例直觉**：一个权重巨大的长活动，可能独吞整个时间段仍优于「塞进很多短活动」。**无权时有「数量最大化」的结构，带权后「数量」不再是目标** → 贪心失效。

> 课件金句：**「Beneath every greedy algorithm, there is almost always a more cumbersome dynamic-programming solution.」**
> （每个贪心算法的背后，几乎总有一个更笨重的 DP 解法。）—— 贪心往往是 DP 在特殊结构下「被化简」的结果。

---

## 3. 贪心策略的三要素

1. **把优化问题转化为「做一次选择 + 只剩一个子问题」的形式**（cast as one choice + one subproblem）—— 这是与 DP 的关键区别：DP 通常剩下**多个**子问题，贪心只剩**一个**；
2. **证明总存在一个最优解包含该贪心选择**（greedy-choice property）→ 贪心选择是**安全的（safe）**；
3. **证明最优子结构**：做出贪心选择后，若把「子问题的最优解」与「贪心选择」组合，就得到原问题的最优解。

---

## 4. 案例二：Huffman 编码（Huffman Codes）

### 4.1 为什么需要变长编码

**【例】** 文本长 1000，只含 `a, u, x, z` 四个字符。

| 方案 | 编码 | 所需位数 |
|---|---|---|
| 定长 8 位（ASCII） | 每字符 1 字节 | $8000$ bits |
| 定长 2 位 | `a=00, u=01, x=10, z=11` | $2000$ bits + 码表 |
| **变长（Huffman）** | `a=0, u=110, x=10, z=111` | 更少 |

> 定长编码需要 $\lceil \log C\rceil$ 位（$C$ = 字符集大小）。变长编码按**频率（frequency）** 分配码长：**高频 → 短码，低频 → 长码**。

**【例】** `aaaxuaxz` 中：$f(a)=4,\ f(u)=1,\ f(x)=2,\ f(z)=1$。
- 定长：`0000001001001011`，代价 $= 2\cdot4+2\cdot1+2\cdot2+2\cdot1 = 16$；
- 变长：`00010110010111`，代价 $= 1\cdot4+3\cdot1+2\cdot2+3\cdot1 = 14$。

**注意**：若所有字符频率相同，则**变长编码不会带来任何节省**。

### 4.2 前缀码（prefix code）

**解码的充要条件**：**没有任何码字是另一个码字的前缀**（no code is a prefix of another）。

**为什么？** 因为定长/前缀码可以「**边读边确定**」：从左往右扫，一旦匹配到某个码字就输出，无需回溯。

**【Discussion 13】树必须长什么样？**（Tch 版答案）
> 只要**所有字符都放在叶子上**、且每个内部结点都有**两个孩子**（**满二叉树 full binary tree**），则任何比特序列都能被**无歧义**解码 —— 这种编码叫**前缀码（prefix code）**。
> 于是问题转化为：**在所有叶子包含这些字符的满二叉树中，找总代价最小的那棵**。

**代价定义**：若字符 $C_i$ 在深度 $d_i$、出现 $f_i$ 次，则

$$\text{Cost} = \sum_i d_i f_i$$

用 Trie（二叉树）表示编码：左分支 = 0，右分支 = 1；字符在叶子上。

![图 9-5 用二叉树（trie）表示编码：满二叉树 + 字符在叶子 ⟹ 前缀码，可无歧义解码](ADS/pictures/Chapter%209%20%E8%B4%AA%E5%BF%83%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig05_slide11.webp)

### 4.3 Huffman 算法（1952）

```
void Huffman( PriorityQueue heap[], int C )
{
    把 C 个字符看成 C 棵单结点二叉树，初始化到一个最小堆中;
    for ( i = 1; i < C; i++ ) {
        create a new node;
        /* be greedy here：每次取频率最小的两个 */
        delete root from min heap and attach it to left_child  of node;
        delete root from min heap and attach it to right_child of node;
        weight of node = sum of weights of its children;   /* 树的权重 = 叶子频率之和 */
        insert node into min heap;
    }
}
```

$$T = O(C\log C)$$

**贪心准则**：**每次合并频率最小的两棵树**（即「让低频字符下沉到更深处」，符合「高频短码」的目标）。

**【例】** $C=\{a,e,i,s,t,\text{sp},\text{nl}\}$，频率 $10,15,12,3,4,13,1$：

合并顺序（每次取两个最小）：

$$\text{nl}(1)+\text{s}(3)\to 4;\quad 4+\text{t}(4)\to 8;\quad 8+\text{a}(10)\to 18;\quad 12+13\to 25;\quad 15+18\to 33;\quad 25+33\to 58$$

最终编码与代价：

| 字符 | $f_i$ | 编码 | 深度 $d_i$ | $d_i f_i$ |
|---|---|---|---|---|
| a | 10 | 111 | 3 | 30 |
| e | 15 | 10 | 2 | 30 |
| i | 12 | 00 | 2 | 24 |
| s | 3 | 11011 | 5 | 15 |
| t | 4 | 1100 | 4 | 16 |
| sp | 13 | 01 | 2 | 26 |
| nl | 1 | 11010 | 5 | 5 |
| **合计** | 58 | | | **146** |

![图 9-6 Huffman 构造过程：每次合并频率最小的两棵子树，最终 Cost = 146](ADS/pictures/Chapter%209%20%E8%B4%AA%E5%BF%83%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig06_slide13.webp)

> **注意**：Huffman 编码**不唯一**（左右孩子可交换、相同频率的合并顺序可不同），但**最优代价唯一**。这正是课程 Project 4 的题意：判断学生给出的编码是否正确（只需验证「代价最小」）。

### 4.4 正确性证明（两条引理）

**① 贪心选择性质（greedy-choice property）**

**【引理 1】** 设 $x,y$ 是 $C$ 中**频率最低**的两个字符。则存在一个最优前缀码，其中 $x$ 与 $y$ 的码字**长度相同、仅最后一位不同**。

**证明（交换论证）**：取任一最优树 $T$，设 $a,b$ 是 $T$ 中**最深**的两个兄弟叶子，不妨 $f(a)\le f(b)$、$f(x)\le f(y)$。
- 因为 $x,y$ 是全局频率最小的，故 $f(x)\le f(a)$、$f(y)\le f(b)$；
- 交换 $x\leftrightarrow a$、$y\leftrightarrow b$ 得到 $T'$，则

$$\text{Cost}(T')-\text{Cost}(T) = d_a f(x)+d_b f(y)-d_a f(a)-d_b f(b)\le 0$$

- 故 $\text{Cost}(T')\le\text{Cost}(T)$，而 $T$ 已最优，所以 $T'$ 也最优且 $x,y$ 为最深兄弟（码长相同、仅末位不同）。∎

![图 9-7 引理 1 的交换论证：把最低频的 x、y 换到最深处的兄弟位置，代价不增](ADS/pictures/Chapter%209%20%E8%B4%AA%E5%BF%83%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig07_slide14.webp)

**② 最优子结构（optimal substructure）**

**【引理 2】** 设 $x,y$ 为最低频字符，令 $C' = C - \{x,y\} + \{z\}$，其中 $z.\text{freq} = x.\text{freq}+y.\text{freq}$。若 $T'$ 是 $C'$ 的任一最优前缀码树，则把 $T'$ 中 $z$ 的叶子替换为「以 $x,y$ 为孩子的内部结点」所得的树 $T$，是 $C$ 的最优前缀码树。

**证明（反证）**：若 $T$ 不是最优，则存在更优的 $T''$；由引理 1 可设 $T''$ 中 $x,y$ 为最深兄弟，把它们合并成 $z$ 得到 $C'$ 的树，其代价比 $T'$ 更小 —— 与 $T'$ 最优矛盾。∎

![图 9-8 引理 2（最优子结构）：C' 的最优树把 z 展开成 x、y 即为 C 的最优树](ADS/pictures/Chapter%209%20%E8%B4%AA%E5%BF%83%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig08_slide15.webp)

**结论**：两条引理合起来 ⟹ **每次合并最小频率两棵树是安全的** ⟹ Huffman 算法产出**最优前缀码**。

---

## 5. 贪心 vs DP vs 回溯：三者对照

| | 贪心（greedy） | 动态规划（DP） | 回溯（backtracking） |
|---|---|---|---|
| 决策方式 | 每步取局部最优，**不反悔** | 枚举所有选择，**保留最优** | 尝试所有可能，**可撤销** |
| 子问题数 | **只剩 1 个** | 多个（重叠） | 搜索树的分支 |
| 正确性条件 | 贪心选择性质 + 最优子结构 | 最优子结构 + 重叠子问题 | 只要剪枝正确即可 |
| 复杂度 | 通常最低（$O(N\log N)$） | 中（$O(N^2)/O(N^3)$） | 最坏指数级 |
| 典型问题 | 活动选择、Huffman、单源最短路（Dijkstra）、最小生成树 | 矩阵链、OBST、Floyd、装配线 | 八皇后、Turnpike、博弈 |

> **记忆法**：**贪心 = DP 的「一条路径版本」**。若 DP 的最优解在每一步都只依赖「当前唯一的最佳前缀」，贪心就成立；一旦带权重/带资源约束，就必须回到 DP。

---

## 6. 易错点与考点清单

1. **贪心只保证「可行解」，不保证「最优解」**；必须证明**贪心选择性质**（交换论证）。
2. 活动选择**唯一正确的准则是「结束最早」**（或等价的「开始最晚」）；「开始最早」「最短」「冲突最少」都不对。
3. 活动选择是**开区间** $S_{ij}$（$i,j$ 不含），因为 $s_i \ge f_j$ 判定相容（**端点相等算相容**）。
4. 活动选择加**权重**后：**DP 仍正确、贪心失效**（weighted interval scheduling）。
5. Huffman 的正确性靠**两条引理**：最低频字符可放在最深兄弟（交换论证）+ 合并后的子问题仍最优（反证）。
6. **前缀码**的关键：字符**只在叶子上** + 满二叉树（内部结点两个孩子）→ 可无歧义解码。
7. Huffman 的复杂度 $O(C\log C)$（每次取两个最小用**最小堆**）；**编码不唯一，但最优代价唯一**。
8. 若所有字符**等频**，变长编码**没有收益**（这就是定长编码在等概率时最优的直观解释）。
9. 「Beneath every greedy algorithm, there is a more cumbersome DP solution」——遇到新问题先想 DP，再看能否化简成贪心。

---

## 7. 参考

- Cormen et al., *Introduction to Algorithms* (3rd ed.)：**Ch.16**（Greedy Algorithms）p.415–437，The MIT Press, 2009。
- 课程 Project 4：*Huffman Codes*（判断给定编码是否为合法最优前缀码），详见 `https://pintia.cn/`。
- 原始论文：D. A. Huffman, *A Method for the Construction of Minimum-Redundancy Codes*, 1952。
