---
title: Chapter 7 分治算法 · AI 精讲
aliases:
  - ADS/notes/Chapter 7 分治算法 AI精讲
---
# Chapter 7 分治算法（Divide and Conquer）

> **课件来源**：`ADS07Divide Conquer_Stu.ppt`（17 页）
> **本章主线**：**分（divide）→ 治（conquer，递归求解）→ 合（combine）** 三步走，得到递推式 $T(N)=aT(N/b)+f(N)$ → 以**最近点对（closest points）**为例说明「难点全在 combine」→ 系统讲解求解递推式的三种方法：**代换法（substitution）、递归树法（recursion tree）、主方法（master method）**。

---

## 0. 本章速览

| 分治例子 | 递推式 | 复杂度 |
|---|---|---|
| 最大子段和（maximum subsequence sum） | $T(N)=2T(N/2)+O(N)$ | $O(N\log N)$ |
| 树遍历（tree traversal） | $T(N)=2T(N/2)+O(1)$ | $O(N)$ |
| 归并排序 / 快速排序 | $T(N)=2T(N/2)+O(N)$ | $O(N\log N)$ |
| **最近点对** | $T(N)=2T(N/2)+O(N)$ | **$O(N\log N)$** |
| Strassen 矩阵乘法 | $T(N)=7T(N/2)+O(N^2)$ | $O(N^{\log_2 7})=O(N^{2.81})$ |

**三种解递推式的方法**（本章重点）：

| 方法 | 思路 | 适用 |
|---|---|---|
| **代换法（substitution）** | 猜答案 → 用归纳法证明 | 需要「猜」的能力，最严格 |
| **递归树法（recursion tree）** | 画出每层代价 → 求和 | 直观，适合给猜测提供线索 |
| **主方法（master method）** | 套公式 $T(N)=aT(N/b)+f(N)$ | 最常用，但只适用于特定形式 |

**术语对照**

| 中文 | English | 中文 | English |
|---|---|---|---|
| 分治 | divide and conquer | 递推式 | recurrence |
| 最近点对 | closest pair of points | 条带 | strip |
| 代换法 | substitution method | 递归树法 | recursion-tree method |
| 主方法 / 主定理 | master method / master theorem | 正则条件 | regularity condition |
| 分支因子 | branching factor | 归并排序 | mergesort |

---

## 1. 分治的范式

**三步（recursive）**：

1. **Divide（分）**：把问题划分为若干**子问题（sub-problems）**；
2. **Conquer（治）**：**递归**求解子问题；
3. **Combine（合）**：把子问题的解**合并**为原问题的解。

**一般递推式（general recurrence）**：

$$T(N) = a\,T(N/b) + f(N)$$

其中 $a$ = 子问题个数，$b$ = 规模缩小倍数，$f(N)$ = 分解与合并的代价。

> 分治的「难度分布」是不均匀的：**分**和**治**通常都很机械，**难的是 combine** —— 最近点对问题就是最好的例子。

---

## 2. 案例：最近点对问题（Closest Points Problem）

**问题**：平面上给定 $N$ 个点，找距离最近的一对点（若两点重合，则该对距离为 0，即答案）。

### 2.1 朴素解法：穷举（exhaustive search）

检查 $\dbinom{N}{2}=\dfrac{N(N-1)}{2}$ 对点，$T = O(N^2)$。

### 2.2 分治解法

**思路**（与最大子段和问题同构）：

1. **按 $x$ 坐标排序**，用一条垂直线把点集分成左右两半（各 $N/2$）；
2. **递归**求左半的最近距离 $d_L$、右半的最近距离 $d_R$，令 $\delta = \min(d_L, d_R)$；
3. **合并（combine）**：最近点对可能**一个在左、一个在右**（跨越中线），必须在**条带（strip）** 内检查 —— 这就是难点所在。

![图 7-1 最近点对：按 x 排序分治，解来自「左半」、「右半」或「跨界（cross）」](ADS/pictures/Chapter%207%20%E5%88%86%E6%B2%BB%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig01_slide03.webp)

**朴素合并的代价**：条带内若有 $M$ 个点，两两检查需 $O(M^2)$；最坏 $M=N$（所有点都在条带上），于是

$$T(N)=2T(N/2)+O(N^2) \Rightarrow T(N)=O(N^2)$$

**分治白做了！** 课件追问：「Can you find the cross distance in linear time?」

### 2.3 关键洞察：条带内每个点只需比较至多 7 个点

**做法**：把条带内的点**按 $y$ 坐标排序**，对每个点 $p_i$ 只与**其后的点**比较，一旦 $y$ 方向距离 $> \delta$ 就**break**。

```c
/* points are all in the strip and sorted by y coordinates */
for ( i = 0; i < NumPointsInStrip; i++ )
    for ( j = i + 1; j < NumPointsInStrip; j++ )
        if ( Dist_y( P_i, P_j ) > δ )
            break;                      /* y 差超过 δ，后面的点更远，直接跳出 */
        else if ( Dist( P_i, P_j ) < δ )
            δ = Dist( P_i, P_j );
```

**为什么只比较 7 个？**（经典几何论证）
把宽 $2\delta$ 的条带按 $\delta/2 \times \delta/2$ 的小方格划分，每个小方格内**至多 1 个点**（否则该方格内两点距离 $< \delta$，与 $\delta$ 的定义矛盾）。对某个点 $p_i$，只需考虑 $y$ 差 $\le \delta$ 的区域，该区域最多覆盖 2 列 × 4 行 = **8 个方格**，去掉 $p_i$ 自己所在格 → **至多 7 个其他点**。

于是条带检查是**线性**的：$f(N)=O(N)$，递推式变成

$$T(N)=2T(N/2)+O(N) \Rightarrow T(N)=O(N\log N)$$

![图 7-2 条带（strip）与「每个点最多比较 7 个点」的几何论证](ADS/pictures/Chapter%207%20%E5%88%86%E6%B2%BB%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig02_slide06.webp)

> **考点**：这个 $O(N\log N)$ **不是显而易见的** —— 若合并仍用 $O(N^2)$，整体就退化为 $O(N^2)$。**分治的复杂度由 combine 决定。**

**工程细节**：
- 预排序（presorting）：先按 $x$ 排一次（$O(N\log N)$），递归时按中位线切分，避免每层重复排序；
- 递归返回时**按 $y$ 归并**（类似 mergesort 的 merge），使每层条带已按 $y$ 有序 → 总代价保持 $O(N\log N)$。

---

## 3. 递推式的展开（迭代法直觉）

$$T(N)=2T(N/2)+cN = 2\left[2T(N/2^2)+cN/2\right]+cN = 2^2T(N/2^2)+2cN = \dots = 2^kT(N/2^k)+kcN$$

取 $N=2^k$ 即 $k=\log N$，且 $T(1)=O(1)$：

$$T(N)=N\cdot O(1) + cN\log N = O(N\log N)$$

若 $f(N)=cN^2$：

$$T(N)=2^kT(N/2^k)+cN^2\left(1+\tfrac12+\dots+\tfrac1{2^{k-1}}\right)=O(N^2)$$

（几何级数收敛，主导项是根结点的 $cN^2$。）

**对比结论**：$f(N)$ 的「形状」决定谁占主导 —— 这正是主定理的分类依据。

---

## 4. 三种求解递推式的方法

### 4.1 代换法（substitution method）：猜 + 归纳证明

**【例】** $T(N)=2T(\lfloor N/2\rfloor)+N$
**猜**：$T(N)=O(N\log N)$，即存在 $c>0$ 使 $T(N)\le cN\log N$。

**证明**：设对所有 $m<N$ 成立，特别对 $m=\lfloor N/2\rfloor$：

$$T(\lfloor N/2\rfloor)\le c\lfloor N/2\rfloor\log\lfloor N/2\rfloor$$

代入：

$$T(N)=2T(\lfloor N/2\rfloor)+N \le 2c\lfloor N/2\rfloor\log\lfloor N/2\rfloor+N \le cN(\log N-\log 2)+N \le cN\log N \quad (\text{当 } c\ge 1)$$

**边界问题（课件吐槽）**：「How about $N=1$?」—— $T(1)=c\cdot1\cdot\log 1=0$，不成立。
**处理**：只要 $c$ **足够大**，使 $T(2),T(3)$ 等边界情形成立即可（Relax!）。严格做法是：证明 $T(N)\le cN\log N$ 对 $N\ge N_0$ 成立，并单独验证 $N<N_0$ 的常数项。

**错误的猜测也会被「证明」出来（重要警示）**：若猜 $T(N)=O(N)$：

$$T(N)=2T(\lfloor N/2\rfloor)+N \le 2c\lfloor N/2\rfloor + N \le cN+N = O(N)$$

**这个证明是无效的** —— 因为归纳假设要求**同一个常数 $c$** 满足 $T(N)\le cN$，而推导得到的是 $(c+1)N$，**常数变大了**。所以代换法必须证明**精确的形式（exact form）**，不能中途放宽常数。

> **如何做出好的猜测？** ① 用递归树估阶；② 用已知相似问题的结论；③ 先猜松的界，再逐步收紧。

### 4.2 递归树法（recursion tree method）

**【例】** $T(N)=3T(N/4)+\Theta(N^2)$

```
                cN²                     ← 第 0 层，代价 cN²
        /        |        \
   c(N/4)²  c(N/4)²  c(N/4)²           ← 第 1 层，代价 3·cN²/16 = (3/16)cN²
   / | \     ...      ...
                                        ← 第 i 层，代价 (3/16)^i · cN²
```

各层代价构成**几何级数**，公比 $3/16<1$：

$$T(N)=cN^2\sum_{i\ge0}\left(\frac{3}{16}\right)^i = cN^2\cdot\frac{1}{1-3/16}=O(N^2)$$

**结论**：$T(N)=\Theta(N^2)$（根结点主导）。
**注意**：递归树给出**猜测**，严格性仍需**代换法验证上界**（课件 Note：可以用 substitution 验证这个上界）。

![图 7-3 递归树：每层代价构成等比级数，公比 3/16 < 1 → 根主导，O(N²)](ADS/pictures/Chapter%207%20%E5%88%86%E6%B2%BB%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig03_slide10.webp)

**【例】不平衡划分**：$T(N)=T(N/3)+T(2N/3)+cN$

递归树**不是满的**（Not complete！）：最浅的路径走 $N/3$（深度 $\log_3 N$），最深的路径走 $2N/3$（深度 $\log_{3/2}N$）。每一层代价都是 $cN$，层数在 $\log_3 N$ 与 $\log_{3/2}N$ 之间，故

$$T(N)=\Theta(N\log N)$$

**猜** $T(N)\le cN\log N$ 后用代换法验证即可。

![图 7-4 不平衡划分 T(N)=T(N/3)+T(2N/3)+cN：递归树「不满」，仍是 Θ(N log N)](ADS/pictures/Chapter%207%20%E5%88%86%E6%B2%BB%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig04_slide11.webp)

### 4.3 主方法（master method）

**【主定理（Master Theorem）】** 设 $a\ge1$、$b>1$ 为常数，$f(N)$ 为函数，$T(N)$ 由 $T(N)=aT(N/b)+f(N)$ 定义（$N$ 为非负整数）。令 $N^{\log_b a}$ 为「**分水岭（watershed）**」，则：

| 情形 | 条件 | 结论 | 直觉 |
|---|---|---|---|
| **Case 1** | $f(N)=O\left(N^{\log_b a-\varepsilon}\right)$，某常数 $\varepsilon>0$ | $T(N)=\Theta\left(N^{\log_b a}\right)$ | 叶子（递归）主导 |
| **Case 2** | $f(N)=\Theta\left(N^{\log_b a}\right)$ | $T(N)=\Theta\left(N^{\log_b a}\log N\right)$ | 各层相当 |
| **Case 3** | $f(N)=\Omega\left(N^{\log_b a+\varepsilon}\right)$，且满足**正则条件（regularity condition）** $af(N/b)\le cf(N)$（某 $c<1$，$N$ 足够大） | $T(N)=\Theta\left(f(N)\right)$ | 根（合并）主导 |

**使用要点**：
1. **「谁大取谁」**：$f(N)$ 与 $N^{\log_b a}$ 中**较大者**决定 $T(N)$；
2. 必须是**多项式级别的大**（strictly larger by a polynomial factor）—— 差一个 $\log$ 因子**不算** Case 1/3，而落入 Case 2 的变体或需要扩展形式；
3. Case 3 的**正则条件**保证「根主导」能向整棵树传播（否则下层可能反超）。

**课件例题**：
- **归并排序**：$a=b=2$，$f(N)=N$，$N^{\log_2 2}=N$ → **Case 2**，$T=O(N\log N)$；
- $a=b=2$，$f(N)=N\log N$：$f$ 比 $N$ 只大一个 $\log$，**不满足** Case 1/3 的多项式差 → 不能用基本主定理（需用扩展形式，答案 $O(N\log^2N)$，见 4.4）。

![图 7-5 主定理三种情形：以 N^{log_b a} 为分水岭比较 f(N)](ADS/pictures/Chapter%207%20%E5%88%86%E6%B2%BB%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig05_slide12.webp)

**主定理的递归树证明（$n=b^k$）**：总代价

$$T(n)=\Theta(n^{\log_b a})+\sum_{j=0}^{\log_b n-1}a^j f(n/b^j)$$

- Case 1：级数由最后一项主导 → $T=\Theta(n^{\log_b a})$；
- Case 2：每项同阶，共 $\log_b n$ 项 → $\Theta(n^{\log_b a}\log n)$；
- Case 3：级数由第一项主导（正则条件保证等比衰减）→ $\Theta(f(n))$。

（课件 Discussion 9：请自行证明 Case 2；Case 1 的推导思路为 $a\cdot f(n/b)\le \ldots$。）

### 4.4 主方法的另一种形式（更实用）

**【主定理（另一形式）】** $T(N)=aT(N/b)+f(N)$ 可解为：

| 条件 | 结论 |
|---|---|
| $a\,f(N/b)=\kappa f(N)$，某常数 $\kappa<1$ | $T(N)=\Theta(f(N))$ |
| $a\,f(N/b)=K f(N)$，某常数 $K>1$ | $T(N)=\Theta\left(N^{\log_b a}\right)$ |
| $a\,f(N/b)=f(N)$ | $T(N)=\Theta\left(f(N)\log N\right)$ |

**直观**：比较「父结点代价」与「所有孩子代价之和」。
- 孩子总代价**更小**（$\kappa<1$，等比衰减）→ 根主导；
- 孩子总代价**更大**（$K>1$，等比增长）→ 叶子主导；
- **相等** → 每层代价相同 → 乘上层数 $\log N$。

**课件例题**：$a=4,\ b=2,\ f(N)=N\log N$：

$$a f(N/b)=4\cdot\frac{N}{2}\log\frac{N}{2}=2N(\log N-1)\approx 2f(N) \Rightarrow K=2>1$$

→ $T(N)=\Theta\left(N^{\log_2 4}\right)=\Theta(N^2)$。

### 4.5 Weiss 教材的经典形式（含 $\log^p N$）

**【定理】** 方程

$$T(N)=a\,T(N/b)+\Theta\left(N^k\log^p N\right)\qquad (a\ge1,\ b>1,\ p\ge0)$$

的解为：

| 情形 | 结论 |
|---|---|
| $a>b^k$ | $T(N)=O\left(N^{\log_b a}\right)$ |
| $a=b^k$ | $T(N)=O\left(N^k\log^{p+1}N\right)$ |
| $a<b^k$ | $T(N)=O\left(N^k\log^{p}N\right)$ |

**这个形式最实用**，因为它直接容纳了 $\log$ 因子。

**课件例题**：
1. **归并排序**：$a=b=2$，$k=1$，$p=0$ → $a=b^k=2$ → $T=O(N\log N)$；
2. **每次分 3 份、合并 $O(N)$**：$a=3,\ b=2,\ k=1,\ p=0$ → $a=3>b^k=2$ → $T=O(N^{\log_2 3})=O(N^{1.59})$；
3. 若合并变成 $O(N^2)$：$a=3,\ b=2,\ k=2$ → $a=3<b^k=4$ → $T=O(N^2)$；
4. $a=b=2,\ f(N)=N\log N$（$k=1,p=1$）→ $a=b^k$ → $T=O(N\log^2 N)$。

![图 7-6 Weiss 形式：T(N)=aT(N/b)+Θ(N^k log^p N) 的三分情形与例题](ADS/pictures/Chapter%207%20%E5%88%86%E6%B2%BB%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig06_slide16.webp)

> **重要提醒**：主定理**不是万能的**。以下情形它**失效**：
> - 子问题规模不等（如 $T(N)=T(N/3)+T(2N/3)+cN$）—— 用递归树/代换；
> - $f(N)$ 与 $N^{\log_b a}$ 只差一个 $\log$ 的幂（如 $f(N)=N/\log N$）；
> - $a$ 或 $b$ 不是常数（如 $T(N)=2T(\sqrt N)+ \log N$）。

---

## 5. 易错点与考点清单

1. **最近点对的关键不是「分」，而是「条带内的线性合并」**：每个点最多比较 7 个点，靠「每格至多 1 点」的几何论证；若合并 $O(N^2)$，整体退化为 $O(N^2)$。
2. 条带内必须**按 $y$ 排序**且**一旦 $y$ 差 $>\delta$ 就 break**，否则「7 个点」的界不成立。
3. **代换法必须证明精确形式**；归纳中常数不能变大（$cN+N$ 不是 $cN$）。边界 $N=1$ 不成立是正常的，取足够大的 $c$ 并处理小规模即可。
4. **递归树法只提供猜测**，严格结论需代换法验证。
5. **不平衡划分**（$T(N/3)+T(2N/3)$）仍是 $\Theta(N\log N)$：层数在 $\log_3 N$ 与 $\log_{3/2} N$ 之间，每层 $\Theta(N)$。
6. 主定理 Case 1/3 要求**多项式级差**（差 $\varepsilon$）；只差 $\log$ 因子时用扩展形式（Weiss 的 $k,p$ 形式）。
7. 主定理 Case 3 别忘了**正则条件** $af(N/b)\le cf(N)$。
8. **忆口诀**：$N^{\log_b a}$ 是分水岭 —— 叶子大取叶子、相当乘 $\log$、根大取根。
9. 常见闭式结论要背熟：$T(N)=2T(N/2)+N\Rightarrow O(N\log N)$；$T(N)=2T(N/2)+1\Rightarrow O(N)$；$T(N)=7T(N/2)+N^2\Rightarrow O(N^{2.81})$。

---

## 6. 参考

- Cormen et al., *Introduction to Algorithms* (3rd ed.)：**Ch.4**（Divide-and-Conquer / Recurrences）p.65–113，The MIT Press, 2009。
- Weiss, *Data Structure and Algorithm Analysis in C* (2nd ed.)：**Ch.10**，p.370–375；M.A.Weiss 著、陈越改编，人民邮电出版社，2005。
- Jeff Erickson, *Lecture Notes of CS 373: Combinatorial Algorithms — Notes on Solving Recurrence Relations*, p.10–13, UIUC, 2003。
