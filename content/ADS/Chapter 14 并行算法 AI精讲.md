---
title: Chapter 14 并行算法 · AI 精讲
aliases:
  - ADS/notes/Chapter 14 并行算法 AI精讲
---
# Chapter 14 并行算法（Parallel Algorithms）

> **课件来源**：`ADS14Parallel_Stu.ppt`（22 页）
> **本章主线**：并行算法的「成本模型」比算法本身更重要 → **PRAM（并行随机存取机）** 模型与三种读写冲突约定（EREW/CREW/CRCW）→ **WD（Work-Depth）表示法**：只写「每一步同时做哪些操作」，不绑定处理器数 → 用 **work $W(n)$** 与 **time $T(n)$** 衡量，任何 $p$ 个处理器的机器都能在 $O(W/p+T)$ 内实现 → 四个案例：**求和（summation）**、**前缀和（prefix-sums）**、**归并（merging / ranking）**、**最大值（maximum finding）**。

---

## 0. 本章速览

| 问题 | 技术 | 时间 $T(n)$ | 工作量 $W(n)$ | 备注 |
|---|---|---|---|---|
| 求和 | 平衡二叉树（balanced binary tree） | $\log n+2$ | $2n$ | 最基础的并行原语 |
| 前缀和 | 平衡二叉树**两趟**（上求和 + 下传） | $O(\log n)$ | $O(n)$ | 并行算法的「万金油」 |
| 归并 | **划分（partitioning）+ 排序（ranking）** | $O(\log n)$ | $O(n)$ | 基准情形 |
| 最大值（朴素） | 两两比较（compare all pairs） | $O(1)$ | $O(n^2)$ | 用 CRCW 的 common 规则 |
| 最大值（随机采样） | random sampling | $O(1)$（高概率） | $O(n)$（高概率） | 任意 CRCW PRAM |

**两个度量（必记）**：

$$W(n)\ =\ \text{总操作数（work load）},\qquad T(n)\ =\ \text{最坏运行时间（并行深度）}$$

**术语对照**

| 中文 | English | 中文 | English |
|---|---|---|---|
| 并行随机存取机 | Parallel Random Access Machine (PRAM) | 工作量 | work |
| 工作深度表示 | Work-Depth (WD) presentation | 独占/并发读写 | exclusive / concurrent read-write |
| 前缀和 | prefix-sums | 平衡二叉树 | balanced binary tree |
| 归并 / 排序（名次） | merging / ranking | 划分范式 | partitioning paradigm |
| 超长指令字 | Very-Long Instruction Word (VLIW) | 流水线 | pipelining |
| 高概率 | with very high probability | 随机采样 | random sampling |

---

## 1. 并行性的两个层次

| 层次 | 内容 |
|---|---|
| **机器并行（machine parallelism）** | 处理器并行（processor parallelism）、流水线（pipelining）、超长指令字（VLIW, Very-Long Instruction Word）—— **硬件层面** |
| **并行算法（parallel algorithms）** | 描述算法本身的并行结构 —— **软件/算法层面** |

**描述并行算法的两种模型**：
1. **PRAM（Parallel Random Access Machine）**：显式指定每个处理器做什么；
2. **WD（Work-Depth）**：只描述「每一时刻同时做哪些操作」，**不绑定处理器数量**。

---

## 2. PRAM 模型

**结构**：$P_1, P_2, \dots, P_n$ 个处理器 + **共享内存（shared memory）**；每次读写/计算都是**单位时间（unit time access）**。

**并行循环记号**：
```
for Pi, 1 ≤ i ≤ n  pardo        /* pardo = parallel do */
    A(i) := B(i)
```
表示 $n$ 个处理器**同时**执行各自的赋值。

**问题：访问冲突（access conflicts）** —— 多个处理器同时读写同一单元怎么办？三种约定：

| 模型 | 读（Read） | 写（Write） | 强度 |
|---|---|---|---|
| **EREW**（Exclusive-Read Exclusive-Write） | 独占 | 独占 | 最弱（最现实） |
| **CREW**（Concurrent-Read Exclusive-Write） | **并发** | 独占 | 中 |
| **CRCW**（Concurrent-Read Concurrent-Write） | 并发 | **并发** | 最强（最理想化） |

**CRCW 下「同时写」的三条仲裁规则**：
1. **Arbitrary rule（任意规则）**：任选一个写入成功（不保证是哪个）；
2. **Priority rule（优先级规则）**：**编号最小的处理器** $P$ 获胜；
3. **Common rule（公共规则）**：**若所有处理器写的是同一个值**，则写入成功（否则未定义）。

> **考试要点**：EREW ⊂ CREW ⊂ CRCW（能力递增，实现难度递减）。算法在越弱的模型上成立，价值越高。

![图 14-1 PRAM 模型：n 个处理器 + 共享内存，pardo 表示并行执行](ADS/pictures/Chapter%2014%20%E5%B9%B6%E8%A1%8C%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig01_slide03.webp)

---

## 3. 案例一：求和（Summation）

**输入**：$A(1), A(2), \dots, A(n)$；**输出**：$\sum A(i)$。

### 3.1 平衡二叉树（balanced binary tree）法

**思想**：把 $n$ 个数两两相加，得到 $n/2$ 个和；再两两相加……共 $\log n$ 轮，最后得到总和。

$$B(h, i) = B(h-1, 2i-1) + B(h-1, 2i)$$

- 第 0 层：$B(0,i)=A(i)$；
- 第 $h$ 层：$B(h,i)$ 是第 $h-1$ 层相邻两项之和（表示区间 $[2^{h}(i-1)+1,\ 2^h i]$ 的和）；
- 共 $\log n$ 层，最终 $B(\log n, 1)$ 就是总和。

**PRAM 版本**（显式分配处理器）：

```
for Pi, 1 ≤ i ≤ n  pardo
    B(0, i) := A(i)
for h = 1 to log n
    if i ≤ n/2^h
        B(h, i) := B(h-1, 2i-1) + B(h-1, 2i)
    else stay idle
for i = 1: output B(log n, 1); for i > 1: stay idle
```

![图 14-2 求和：n=8 时自底向上 3 轮两两相加（B(h,i) = B(h−1,2i−1)+B(h−1,2i)）](ADS/pictures/Chapter%2014%20%E5%B9%B6%E8%A1%8C%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig02_slide05.webp)

**性能**：

$$T(n) = \log n + 2,\qquad W(n) = 2n\quad(\text{其中 } 2^k=n)$$

- 时间：$\log n$ 轮 + 2 次首尾（读入、输出）；
- 工作量：第 0 层 $n$ 次赋值 + 各轮共 $n-1$ 次加法 $\approx 2n$。

> **注意**：$W(n)=2n$ **与串行求和同阶**（$\Theta(n)$）—— 说明并行求和**没有增加总工作量**，只是把时间从 $n$ 压到 $\log n$。这是**最优（work-optimal）** 并行算法的典范。

### 3.2 PRAM 表示的缺点

课件指出 PRAM 版本的两个问题：
1. **不能反映算法在不同处理器数的 PRAM 上如何运行**（代码把 $n$ 个处理器写死了）；
2. **完全指定「指令到处理器」的分配需要过多细节**（unnecessary detail），掩盖了算法本身的结构。

---

## 4. WD 表示法（Work-Depth Presentation）

**改进**：**只写「每一步有哪些操作并行发生」**，用 `for Pi, 1 ≤ i ≤ n/2^h pardo` 这种**随层数变化**的并行循环：

```
for Pi, 1 ≤ i ≤ n  pardo
    B(0, i) := A(i)
for h = 1 to log n
    for Pi, 1 ≤ i ≤ n/2^h  pardo
        B(h, i) := B(h-1, 2i-1) + B(h-1, 2i)
for i = 1 pardo
    output B(log n, 1)
```

**两种表示的差别（课件图）**：
- **General（PRAM）**：柱状图显示「每时刻的操作数」固定为 $p$（处理器数）；
- **WD 模式**：柱状图显示「每时刻的操作数」**逐层减半**（$n, n/2, n/4, \dots$）—— 更真实地反映并行度。

![图 14-3 PRAM vs WD：WD 只描述每步的并行操作集合，操作数逐层减半](ADS/pictures/Chapter%2014%20%E5%B9%B6%E8%A1%8C%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig03_slide06.webp)

### 4.1 性能度量（Measuring the Performance）

| 记号 | 含义 |
|---|---|
| $W(n)$ | **总操作数（work load）** |
| $T(n)$ | **最坏运行时间**（并行深度 / critical path） |

**等价换算（四种说法渐近等价）**：

| 说法 | 含义 |
|---|---|
| $W(n)$ 次操作、$T(n)$ 时间 | WD 表示 |
| $P(n)=W(n)/T(n)$ 个处理器、$T(n)$ 时间 | 恰好「刚好装满」 |
| 任意 $p \le W(n)/T(n)$ 个处理器、$W(n)/p$ 时间 | 处理器较少时不浪费 |
| **任意 $p$ 个处理器、$W(n)/p + T(n)$ 时间** | **通用公式** |

**【WD 充分性定理（WD-presentation Sufficiency Theorem）】**
> WD 模式描述的算法，可以在**任意 $P(n)$ 个处理器**上用
> $O\left(\frac{W(n)}{P(n)}+T(n)\right)$
> 的时间实现，且使用与 WD 表示相同的**并发写约定（concurrent-write convention）**。

**含义**：
- 若 $P(n)=W(n)/T(n)$（处理器足够）→ 时间 $O(T(n))$；
- 若 $P(n)$ 很小 → 时间 $O(W(n)/P(n))$（退化为「串行摊」）；
- **两者取大**，这就是著名的「**Brent 定理 / work-time 框架**」的直观形式。

> **这就是 WD 表示法的价值**：**一份代码，适配任意处理器数**，不必重写。

---

## 5. 案例二：前缀和（Prefix-Sums）

**输入**：$A(1),\dots,A(n)$；**输出**：$C(k)=\sum_{i=1}^{k}A(i)$（所有前缀和）。

**技术：平衡二叉树，两趟（up-sweep + down-sweep）**。

### 5.1 第一趟：自底向上求和（构造 $B$）

与求和问题完全相同：

$$B(0,i)=A(i),\qquad B(h,i)=B(h-1,2i-1)+B(h-1,2i)$$

$B(h,i)$ 表示区间 $[(i-1)2^h+1,\ i2^h]$ 的和。

### 5.2 第二趟：自顶向下传播（构造 $C$）

$C(h,i)$ = **从最左叶到结点 $(h,i)$ 的「最右后代叶子」的所有元素之和**（即该结点右端点的前缀和）。

**三条规则**：

$$C(h,i)=\begin{cases}
B(h,i) & i=1\ \text{（最左结点：其前缀和就是自身区间的和）}\\[4pt]
C(h+1,\ i/2) & i\ \text{为偶数（左孩子）：继承父结点的前缀和}\\[4pt]
C(h+1,\ (i-1)/2) + B(h,i) & i\ \text{为奇数且 } i\ne1\ \text{（右孩子）：父前缀和 + 自己的区间和}
\end{cases}$$

**计算顺序**：$h$ 从 $\log n$ **递减到 0**（自顶向下）—— 因为 $C(h,i)$ 依赖 $C(h+1,\cdot)$。

```text
for h = log n down to 0
    for i even,  1 ≤ i ≤ n/2^h  pardo:  C(h,i) := C(h+1, i/2)
    for i = 1                   pardo:  C(h,1) := B(h,1)
    for i odd,   3 ≤ i ≤ n/2^h  pardo:  C(h,i) := C(h+1, (i-1)/2) + B(h,i)
```

**性能**：

$$T(n)=O(\log n),\qquad W(n)=O(n)$$

> **为什么 $W=O(n)$**：所有操作都被「记在平衡二叉树的结点上」，每个结点常数次操作，树有 $O(n)$ 个结点（满二叉树 $2n-1$）。

![图 14-4 前缀和的两趟：先自底向上求 B（区间和），再自顶向下求 C（前缀和）](ADS/pictures/Chapter%2014%20%E5%B9%B6%E8%A1%8C%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig04_slide10.webp)

**用途**：前缀和是并行算法的**核心原语** —— 用于**压缩（compaction）、分配位置、基数排序、直方图、流压缩**等几乎所有「需要知道我在第几个」的场景。

---

## 6. 案例三：归并（Merging）

**问题**：把两个非降序数组 $A(1..n)$、$B(1..m)$ 归并成非降序的 $C(1..n+m)$。

**简化假设**：$A,B$ 元素**两两互异**、$n=m$、$\log n$ 与 $n/\log n$ 都是整数。

### 6.1 划分范式（Partitioning Paradigm）

> **划分（partitioning）**：把输入划分成**大量（如 $p$ 个）独立的小任务**，使最大任务规模约为 $n/p$；
> **实际工作（actual work）**：**并发**地处理这些小任务，每个用一个（可能是串行的）算法解决。

这是并行算法最通用的设计套路（**分而治之的并行版**）。

### 6.2 归并 ⟸ 排名（Ranking）

**【定义】排名**：$\mathrm{RANK}(j, A)=i$ 表示 $B(j)$ 在 $A$ 中的位置 —— 即

$$\mathrm{RANK}(j,A)=i \iff A(i) < B(j) < A(i+1)$$

边界：$\mathrm{RANK}(j,A)=0$（$B(j)<A(1)$），$\mathrm{RANK}(j,A)=n$（$B(j)>A(n)$）。

**【Claim】** 有了排名，归并只需 $O(1)$ 时间、$O(n+m)$ 工作量：

```
for Pi, 1 ≤ i ≤ n  pardo:   C(i + RANK(i, B)) := A(i)
for Pi, 1 ≤ i ≤ n  pardo:   C(i + RANK(i, A)) := B(i)
```

**为什么对**：$A(i)$ 在合并结果中的位置 = $i$ + 「$B$ 中有多少元素比它小」= $i+\mathrm{RANK}(i,B)$。由于元素互异，**每个位置恰好被写一次**，无冲突。

### 6.3 计算排名的三种方法

| 方法 | 时间 | 工作量 | 说明 |
|---|---|---|---|
| **二分查找（binary search）** | $O(\log n)$ | $O(n\log n)$ | 每个 $A(i)$ 在 $B$ 中二分；简单但**不是 work-optimal** |
| **串行排名** | $O(n)$ | $O(n)$ | 双指针扫描（`i=j=0; while...`）；**work 最优但时间差** |
| **并行排名（parallel ranking）** | $O(\log n)$ | $O(n)$ | **划分 + 二分**：两者兼得 |

**串行排名代码**（注意 $A(n+1)$、$B(m+1)$ 是大于所有元素的哨兵）：
```c
i = j = 0;
while ( i ≤ n || j ≤ m ) {
    if ( A(i+1) < B(j+1) )  RANK(++i, B) = j;
    else                    RANK(++j, A) = i;
}
```
> **对比**：串行排名**减少了 $W$**（$O(n)$），但**增大了 $T$**（$O(n)$）；并行排名两者都优。

### 6.4 并行排名（Parallel Ranking）：划分 + 二分

**Stage 1：划分（Partitioning）**
- 每隔 $\log n$ 个元素取一个「代表（selected element）」：

$$A\_\text{Select}(i)=A(1+(i-1)\log n),\qquad B\_\text{Select}(i)=B(1+(i-1)\log n),\quad 1\le i\le p=\frac{n}{\log n}$$

- 对这 $2p$ 个代表元素，用**二分查找**计算各自在对方数组中的排名 —— 用 $p$ 个处理器，时间 $O(\log n)$，工作量 $O(p\log n)=O(n)$。

**Stage 2：实际排名（Actual Ranking）**
- 每两个相邻代表把一个数组切成**规模 $O(\log n)$ 的小段**；
- 每个小段与对方对应的区间合并（**串行**，规模 $O(\log n)$）；
- 共有 $O(p)=O(n/\log n)$ 个小问题，每个 $O(\log n)$ → 总工作量 $O(n)$，时间 $O(\log n)$（用「至多 $2p$ 个 $O(\log n)$ 规模的问题」并行处理）。

$$\boxed{T(n)=O(\log n),\qquad W(n)=O(n)}$$

![图 14-5 并行排名：每 log n 个元素取代表先二分定位，再在小区间内串行排名](ADS/pictures/Chapter%2014%20%E5%B9%B6%E8%A1%8C%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig05_slide15.webp)

---

## 7. 案例四：最大值（Maximum Finding）

### 7.1 方法 1：求和算法的「+」换成「max」

直接把求和算法中的加法替换为 `max` —— 立即得到 $T=O(\log n)$、$W=O(n)$ 的最大值算法。**这是最实用的答案。**

### 7.2 方法 2：两两比较（compare all pairs）—— $O(1)$ 时间

**思想**：对每一对 $(i,j)$ 并行比较，**输的一方打标记**；最后没有标记的就是最大值。

```
for Pi, 1 ≤ i ≤ n  pardo
    B(i) := 0
for i and j, 1 ≤ i, j ≤ n  pardo
    if ( (A(i) < A(j)) || ((A(i) == A(j)) && (i < j)) )
        B(i) = 1
    else B(j) = 1
for Pi, 1 ≤ i ≤ n  pardo
    if B(i) == 0
        A(i) is a maximum in A
```

**性能**：

$$T(n)=O(1),\qquad W(n)=O(n^2)$$

**冲突问题（Discussion 21）**：在内层循环中，**多个处理器可能同时写同一个 $B(i)$（都写 1）** → 需要 **CRCW**；由于写的都是**同一个值 1**，可用 **common rule** 合法化。

> **注意并列的处理**：条件里用 `(A(i)==A(j)) && (i<j)` 保证**相等时只有编号大的被打标记** —— 这样并列最大值中**只有下标最小的那个**胜出，避免全部被标记。

### 7.3 方法 3：双对数范式（Doubly-logarithmic Paradigm）

**目标**：在 $O(\log\log n)$ 时间内完成（比 $O(\log n)$ 更快）。

**做法**：设 $h=\log\log n$ 为整数，按 $h$ 分组 —— 先把问题分成 $n/h$ 组、每组 $h$ 个元素，组内用「比较所有对」在 $O(\log h)$ 时间内求最大值；再对 $n/h$ 个组最大值递归。递归深度为 $O(\log\log n)$。

**代价**：工作量 $W=O(n\log\log n)$ —— **用更多工作换更少时间**。

### 7.4 方法 4：随机采样（Random Sampling）—— $O(1)$ 时间 + $O(n)$ 工作量

**目标**：在**任意 CRCW PRAM** 上，以**极大概率（with very high probability）** 用 **$O(1)$ 时间、$O(n)$ 工作量**求最大值。

**思想（迭代放大）**：
1. 从 $n$ 个元素中**随机抽取** $n^{7/8}$ 个组成 $B$，求 $B$ 的最大值 $M$；
2. 把 $A$ 中所有 $>M$ 的元素（期望 $n^{1/8}$ 个）**随机撒入**一个新的 $n^{7/8}$ 大小的数组；
3. 重复：每次候选集规模从 $n$ 降到 $n^{1/8}$ → $n^{1/8\cdot7/8}$ → …，几轮之后候选集极小（甚至只剩几个），再用「比较所有对」$O(1)$ 时间求最大值。

```
while ( there is an element larger than M ) {
    for ( each element larger than M )
        throw it into a random place in a new B(n^{7/8});
    compute a new M;
}
```

**【定理】** 该算法求出 $n$ 个元素的最大值；**以极大概率**在 $O(1)$ 时间、$O(n)$ 工作量内完成；未在此时间内完成的概率为 $O(1/n^c)$（某正常数 $c$）。

![图 14-6 随机采样的主循环：把大于 M 的元素重新撒入新的 $B(n^{7/8})$，迭代逼近最大值](ADS/pictures/Chapter%2014%20%E5%B9%B6%E8%A1%8C%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig07_slide20.webp)

![图 14-7 随机采样：每次把候选集缩小到 $n^{7/8}$ 规模，几轮后 $O(1)$ 时间求出最大值](ADS/pictures/Chapter%2014%20%E5%B9%B6%E8%A1%8C%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig06_slide19.webp)

> **思想总结**：**用随机采样把「最坏情况」变成「极大概率的好情况」** —— 与第 13 章随机化算法一脉相承。

---

## 8. 并行算法设计的四种套路（总结）

| 套路 | 代表 | 特点 |
|---|---|---|
| **平衡二叉树（balanced binary tree）** | 求和、前缀和 | 把串行的「链式累加」改成「树形归约」，$T=O(\log n)$、$W=O(n)$ |
| **划分范式（partitioning）** | 并行归并、并行排名 | 先粗粒度定位（代表 + 二分），再小规模并行处理 |
| **倍增 / 指针跳跃** | 前缀和、列表排名 | 每轮把「已知区间」扩大一倍 |
| **随机采样（random sampling）** | 最大值 | 用概率把规模迅速缩小，换取 $O(1)$ 时间 |

**并行算法的三大目标（互相制衡）**：
1. **时间 $T(n)$ 尽量小**（并行深度小）；
2. **工作量 $W(n)$ 尽量小**（最好与串行同阶 = **work-optimal**）；
3. **模型尽量弱**（EREW > CREW > CRCW 的可移植性）。

> **不可能三角**：$T$、$W$、模型强度**不能同时最优** —— 例如「比较所有对」求最大值 $T=O(1)$ 但 $W=O(n^2)$；随机采样想两者兼得，代价是**只在高概率下成立**。

---

## 9. 易错点与考点清单

1. **$W$ 与 $T$ 是两个独立指标**：$W$ 是「总操作数」（相当于串行时间），$T$ 是「并行深度」；$P=W/T$ 是「刚好装满」的处理器数。
2. **WD 充分性定理**：任意 $p$ 个处理器 → $O(W/p+T)$ 时间。别写成 $W/p$ 或 $T$。
3. **EREW/CREW/CRCW** 三者的区别在「读/写是否允许并发」；CRCW 的三条仲裁规则（arbitrary / priority / common）。
4. 求和的 **$T=\log n+2$、$W=2n$**（$n=2^k$）；**$W$ 与串行同阶**，是 work-optimal。
5. **前缀和**：两趟（上求和 $B$ + 下传 $C$）；$C$ 的三条规则（$i=1$ 取 $B$；偶数继承父；奇数 = 父 + 自己的 $B$）；遍历顺序 **$h$ 递减**。
6. **归并 ⟸ 排名**；排名给好后 $O(1)$ 时间完成写入（$C(i+\mathrm{RANK}(i,B)):=A(i)$）。
7. 二分排名 $W=O(n\log n)$ **不是** work-optimal；串行排名 $T=O(n)$ 太慢；**并行排名**两者兼得。
8. **并行排名**的分块大小是 $\log n$，代表个数 $p=n/\log n$；Stage 2 每个小问题规模 $O(\log n)$。
9. **比较所有对**求最大值：$T=O(1)$、$W=O(n^2)$，需要 **CRCW + common rule**（大家写同一个 1）。
10. 并列最大值的处理：`(A(i)==A(j)) && (i<j)` —— 保证只有下标最小的胜出。
11. **随机采样**求最大值：$O(1)$ 时间 + $O(n)$ 工作量，但只是**高概率**（失败概率 $O(1/n^c)$）。

---

## 10. 参考

- Uzi Vishkin, *Thinking in Parallel: Some Basic Data-Parallel Algorithms and Techniques*, Class notes, 2010。
- 课程 Project 7：*MapReduce*（Map/Reduce 编程模型 + 词频统计），详见 `https://pintia.cn/`。
