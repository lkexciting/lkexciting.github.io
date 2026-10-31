---
title: Chapter 11 近似算法 · AI 精讲
aliases:
  - ADS/notes/Chapter 11 近似算法 AI精讲
---
# Chapter 11 近似算法（Approximation Algorithms）

> **课件来源**：`ADS11Approximation_Stu.ppt`（25 页）
> **本章主线**：NP 完全问题没法多项式求得最优解 → 三条出路：**规模小就用指数算法**、**特殊情形用多项式算法**、**在多项式时间内求接近最优的解（近似算法）** → 近似算法与普通启发式（heuristic）的区别在于**必须给出解的质量保证（approximation ratio）** → 四大案例：**装箱（bin packing）**、**背包（knapsack）**、**$k$-中心（k-center）**、以及**不可近似性（inapproximability）**。

---

## 0. 本章速览

| 问题 | 算法 | 近似比 | 备注 |
|---|---|---|---|
| 装箱 Bin Packing | **Next Fit** | $\le 2M-1$ | 在线，$O(N)$ |
| | **First Fit / Best Fit** | $\le \frac{17}{10}M$ | 在线，$O(N\log N)$ |
| | **First Fit Decreasing (FFD)** | $\le \frac{11}{9}M+\frac{6}{9}$ | 离线，需求排序 |
| | 任意在线算法 | **下界 $\ge \frac53$** | 在线不可能更优 |
| 分数背包（fractional） | 按 $p_i/w_i$ 贪心 | **最优**（精确） | 简单贪心即可 |
| 0-1 背包 | 按 $p_i/w_i$ 贪心 | **2-近似** | NP-hard |
| | DP（按利润） | 精确，$O(n^2p_{\max})$ | 伪多项式 |
| | 利润取整 + DP | **$(1+\varepsilon)$-近似（FPTAS）** | $O(n^3/\varepsilon)$ 级 |
| $k$-中心 k-center | Greedy-2r / Greedy-Kcenter | **2-近似** | 且**不可能更好**（$\rho<2$ ⟹ P=NP） |

**术语对照**

| 中文 | English | 中文 | English |
|---|---|---|---|
| 近似比 | approximation ratio | 近似算法 | approximation algorithm |
| 近似方案 | approximation scheme | 多项式时间近似方案 | PTAS |
| 完全多项式时间近似方案 | FPTAS | 在线/离线算法 | on-line / off-line |
| 装箱 | bin packing | 首次适应/下次适应 | first fit / next fit |
| 最佳适应 | best fit | 降序首次适应 | first fit decreasing |
| $k$-中心 | k-center | 覆盖半径 | covering radius |
| 三角不等式 | triangle inequality | 支配集 | dominating set |
| 不可近似性 | inapproximability | 精度参数 | precision parameter |

---

## 1. 为什么需要近似

**问题（What for?）**：**处理难问题（dealing with HARD problems）** —— 绕过 NP 完全性（getting around NP-completeness）。

三条出路（课件）：

1. **若 $N$ 很小，连 $O(2^N)$ 都可接受**（如精确的 TSP 动态规划 $O(n^2 2^n)$）；
2. **在多项式时间内求解某些重要的特殊情形**（如树上的问题、平面图问题）；
3. **在多项式时间内求「接近最优」的解** —— 这就是**近似算法（approximation algorithm）**。

> **关键区别（课件 Note）**：贪心等**启发式（heuristics）** 不管效果，只求「快」；**近似算法必须讨论解的质量（quality of the solution）**，即给出**可证明的误差界**。

---

## 2. 近似比与近似方案

**【定义】近似比（approximation ratio）**
若对**任意**规模为 $n$ 的输入，算法解的成本 $C$ 与最优解成本 $C^*$ 满足

$$\max\left(\frac{C}{C^*},\ \frac{C^*}{C}\right) \le \rho(n)$$

则称该算法有近似比 $\rho(n)$，并称之为 **$\rho(n)$-近似算法**（$\rho(n)$-approximation algorithm）。

> 用 $\max$ 是为了同时覆盖**最小化问题**（$C \ge C^*$，看 $C/C^*$）与**最大化问题**（$C \le C^*$，看 $C^*/C$）。
> 约定 $\rho \ge 1$；$\rho = 1$ 就是最优算法。

**【定义】近似方案（approximation scheme）**
输入除了问题实例，还接受一个**精度参数 $\varepsilon>0$**；对**每个固定的 $\varepsilon$**，它是一个 **$(1+\varepsilon)$-近似算法**。

- **PTAS（polynomial-time approximation scheme）**：对每个**固定**的 $\varepsilon>0$，运行时间是 $n$ 的**多项式**（但可以是 $n^{1/\varepsilon}$，$\varepsilon$ 在指数上）。
- **FPTAS（fully polynomial-time approximation scheme）**：运行时间对 $n$ **和** $1/\varepsilon$ **都是多项式**（这是「fully」的含义）。

$$ \text{FPTAS} \subsetneq \text{PTAS} \subsetneq \text{常数因子近似} \subsetneq \text{可解} $$

---

## 3. 案例一：装箱问题（Bin Packing）

### 3.1 问题

给定 $N$ 个物品，尺寸 $0 < S_i \le 1$，装入**单位容量**的箱子，用**最少的箱子数**。

- **判定版**：给定 $K$ 个箱子，能否装下 $N$ 个物品？→ **NP 完全（NPC）**；
- **优化版**：最少箱数 → **NP-hard**。

**【例】** $N=7$，$S_i = 0.2, 0.5, 0.4, 0.7, 0.1, 0.3, 0.8$，最优装法 3 个箱子：

$$B_1=\{0.8,0.2\},\quad B_2=\{0.7,0.3\},\quad B_3=\{0.1,0.5,0.4\}$$

![图 11-1 装箱问题的最优装法：7 个物品装入 3 个容量为 1 的箱子](ADS/pictures/Chapter%2011%20%E8%BF%91%E4%BC%BC%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig01_slide04.webp)

> 记 $M$ = 最优箱子数。

### 3.2 Next Fit（下次适应）

```c
void NextFit( )
{   read item1;
    while ( read item2 ) {
        if ( item2 can be packed in the same bin as item1 )
            place item2 in the bin;
        else
            create a new bin for item2;
        item1 = item2;
    }
}
```

即：**只尝试当前这一个箱子**，装不下就开新箱，**永不回头**。

**【定理】** Next Fit 使用的箱子数**从不超过 $2M-1$**，且**存在序列恰好用到 $2M-1$**（界是紧的）。

**证明思路**（课件）：若 Next Fit 用了 $2M$（或 $2M+1$）个箱子，则把箱子两两配对：

$$S(B_1)+S(B_2) > 1,\quad S(B_3)+S(B_4) > 1,\ \dots,\ S(B_{2M-1})+S(B_{2M}) > 1$$

（因为 Next Fit 只有在**当前箱装不下**时才开新箱，所以相邻两箱的物品总尺寸之和 $>1$。）

于是所有物品总尺寸 $> M$。而**最优解至少需要 $\lceil \text{总尺寸}/1\rceil > M$** 个箱子 —— 与最优解为 $M$ 矛盾。∎

![图 11-2 Next Fit 的 2M−1 界证明：相邻两箱的尺寸之和必大于 1](ADS/pictures/Chapter%2011%20%E8%BF%91%E4%BC%BC%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig02_slide06.webp)

### 3.3 First Fit / Best Fit（首次适应 / 最佳适应）

- **First Fit**：扫描**第一个**装得下的箱子；没有就开新箱。可用**平衡树**实现 $O(N\log N)$。
- **Best Fit**：放到**最紧（tightest）** 的箱子（剩余空间最小但仍装得下）中。$O(N\log N)$。

**【定理】** First Fit 使用的箱子数 $\le \dfrac{17M}{10}$，且存在序列达到 $\dfrac{17(M-1)}{10}$。
**Best Fit** 同样是 $T=O(N\log N)$、箱数 $\le 1.7M$。

> **为什么 1.7 而不是 2？** 因为 First Fit 会「回头」利用之前的空隙，比 Next Fit 强，但仍有构造能达到 1.7 倍。

### 3.4 在线算法（On-line Algorithms）的下界

**【定义】在线算法**：处理下一个物品**之前**就必须放下当前物品，且**不能改变已做的决定**。

**【例】** 序列 $0.4, 0.4, 0.6, 0.6$：
- 在线算法看到 $0.4,0.4$ 会放进同一箱（装得下）；再来 $0.6$ 只能开新箱 → 共 2 箱；而最优也是 2 箱……但只要把顺序换成 $0.4, 0.6, 0.4, 0.6$，在线就可能用 3 箱，而最优仍是 2 箱。
- 本质困难：**你永远不知道输入何时结束**（you never know when the input might end）。

**【定理】** 存在输入序列，使**任意在线装箱算法**使用的箱子数至少是**最优的 $\dfrac53$ 倍**。

$$ \text{任意在线算法} \ge \frac53 M \quad (\text{而 Next Fit} \le 2M-1,\ \text{First Fit} \le 1.7M) $$

![图 11-3 在线算法的困境：0.4,0.4 / 0.6,0.6 的顺序决定成败；下界 5/3](ADS/pictures/Chapter%2011%20%E8%BF%91%E4%BC%BC%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig03_slide09.webp)

### 3.5 离线算法：FFD（First Fit Decreasing）

**麻烦制造者（trouble-maker）**：**大物品**（the large items）—— 它们出现得太晚，导致前面浪费了大量小空隙。

**解决方案**：先把物品按尺寸**非递增（non-increasing）** 排序，再用 First Fit（或 Best Fit）：

$$\text{First Fit Decreasing (FFD)},\qquad \text{Best Fit Decreasing (BFD)}$$

**【例】** $0.2,0.5,0.4,0.7,0.1,0.3,0.8 \Rightarrow 0.8,0.7,0.5,0.4,0.3,0.2,0.1$，再 First Fit → 3 箱（达到最优）。

**【定理】** FFD 使用的箱子数 $\le \dfrac{11M}{9}+\dfrac{6}{9}$，且**存在序列达到该界**。

$$\frac{11}{9} \approx 1.222 \quad (\text{比 } 1.7 \text{ 好很多})$$

> **结论（课件原话）**：**简单的贪心启发式（simple greedy heuristics）就能给出很好的结果。** 排序这一个动作，把 1.7 降到 1.22。

![图 11-4 FFD：先按尺寸降序排序再 First Fit，7 个物品 3 箱达到最优](ADS/pictures/Chapter%2011%20%E8%BF%91%E4%BC%BC%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig04_slide10.webp)

### 3.6 三种算法的对比示例

课件给出的「杀手序列」：

$$6\times\left(\tfrac17+\varepsilon\right),\quad 6\times\left(\tfrac13+\varepsilon\right),\quad 6\times\left(\tfrac12+\varepsilon\right),\qquad \varepsilon=0.001$$

- **最优**：$6$ 箱（每箱配一个 $1/2$、一个 $1/3$、一个 $1/7$：$0.5+0.334+0.143=0.977\le1$）；
- **三种在线算法**（Next/First/Best Fit）都需要 **10 箱**：
  - $1/7$ 的 6 个挤在 1 箱（$6\times0.143=0.858$）；$1/3$ 的 6 个各占 1 箱（$2\times0.334=0.668$，放不下第 3 个）；$1/2$ 的 6 个各占 1 箱 → $1+6+... $ 合计 10 箱。

比例 $10/6 \approx 1.67$，接近在线算法的 $5/3$ 下界 —— **说明即使是最简单的构造，也能让在线算法退化到接近下界**。

---

## 4. 案例二：背包问题（The Knapsack Problem）

**设定**：背包容量 $M$，$N$ 个物品，第 $i$ 个物品**重量** $w_i$、**利润** $p_i$。

### 4.1 分数版本（fractional knapsack）—— 贪心即最优

$x_i$ 表示装入物品 $i$ 的**比例**（$0\le x_i\le 1$），目标是最大化

$$\sum_{i=1}^{N} p_i x_i \quad \text{s.t.}\quad \sum_{i=1}^{N} w_i x_i \le M,\ 0\le x_i\le 1$$

**贪心准则的选择**：每阶段「装一个物品」，按什么挑？
1. **最大利润 $p_i$** ✗ —— 忽略重量，可能选到很重的物品；
2. **最小重量 $w_i$** ✗ —— 忽略利润，可能装满一堆没价值的东西；
3. **最大利润密度 $p_i/w_i$** ✓ —— **单位重量收益最高**，这是正确准则。

**【例】** $n=3,\ M=20$，$p=(25,24,15)$，$w=(18,15,10)$：
- 密度：$25/18\approx1.39$、$24/15=1.6$、$15/10=1.5$；
- 按密度降序：物品 2（$1.6$）→ 物品 3（$1.5$）→ 物品 1（$1.39$）；
- 先装 2（$w=15$，剩 5），再装 3 的 $5/10=1/2$；
- 解 $x=(0,1,\tfrac12)$，利润 $P=24+7.5=\mathbf{31.5}$ ✓（与课件一致）

**结论**：分数背包用「按 $p_i/w_i$ 降序贪心」**可精确求得最优解**（因为可以「切开」物品，不存在整数约束造成的空隙）。

### 4.2 0-1 版本（0-1 knapsack）—— 贪心只有 2-近似

$x_i \in \{0,1\}$，**不能切开**。

**【例】** $n=5,\ M=11$，$p=(1,6,18,22,28)$，$w=(1,2,5,6,7)$：
- **最优**：$x=(0,0,1,1,0)$，重量 $5+6=11$，利润 $18+22=\mathbf{40}$；
- **按密度贪心**：密度 $1,3,3.6,3.67,4$ → 依次选 5,4,3，重量 $7+6+5=18>11$ → 只能选 $\{5\}$ 再选 $\{4\}$（$7+6=13>11$）→ 实际得到 $x=(1,1,0,0,1)$：重量 $1+2+7=10$，利润 $1+6+28=\mathbf{35}$。

**近似比是 2**（即贪心解至少是最优解的一半）。**证明**：

$$\begin{aligned}
p_{\max} &\le P_{\text{opt}} \le P_{\text{frac}} &&(\text{最优整数解} \le \text{分数最优解})\\
p_{\max} &\le P_{\text{greedy}} &&(\text{贪心至少装下了最值钱的那件})\\
P_{\text{opt}} &\le P_{\text{greedy}} + p_{\max} &&(\text{贪心解 + 第一件被拒物品} \ge \text{分数最优})\\
\frac{P_{\text{opt}}}{P_{\text{greedy}}} &\le 1 + \frac{p_{\max}}{P_{\text{greedy}}} \le 1+1 = 2
\end{aligned}$$

> **改进**：实际实现中取「贪心解」与「单独装最值钱物品」两者的较优者，可把界收紧到 $\frac{P_{\text{opt}}}{P_{\text{greedy}}}\le 2$ 且实践中常接近 1。

### 4.3 动态规划解法（伪多项式）

令 $W_{i,p}$ = 从 $\{1,\dots,i\}$ 中选物品、使**总利润恰好为 $p$** 时的**最小总重量**：

$$W_{i,p} = \min\begin{cases}
W_{i-1,p} + w_i & \text{（取物品 } i\text{）}\\[2pt]
W_{i-1,p} & \text{（不取 } i\text{）}
\end{cases}\qquad (\text{若 } p \text{ 无法达到则为 } \infty)$$

- 状态数：$i=1..n$，$p=1..n\,p_{\max}$；
- 复杂度 $O(n^2 p_{\max})$。

> **这是伪多项式（pseudo-polynomial）**：$p_{\max}$ 在**数值**上是多项式，但输入的**编码长度**只有 $\log p_{\max}$，所以 $p_{\max}=O(2^d)$ 时是指数级 —— 这就是 0-1 背包 NP-hard 的体现。

### 4.4 利润取整 → FPTAS

**问题**：$p_{\max}$ 很大时 DP 不可行（如利润高达 $2.8\times10^7$）。

**思路**：**把所有利润值向上取整（round up）到更小的范围**，再做 DP。

$$p'_i = \left\lceil \frac{p_i}{K}\right\rceil \quad \text{或}\quad p'_i = \left\lceil \frac{n p_i}{\varepsilon\, p_{\max}}\right\rceil$$

用取整后的利润 $p'$ 跑 DP，得到解 $x$。则对**任意可行解** $P$ 都有

$$(1+\varepsilon)\,P_{\text{alg}} \ge P \quad\Longrightarrow\quad \text{是 } (1+\varepsilon)\text{-近似}$$

**复杂度**：取整后 $p'_{\max}=O\!\left(\dfrac{n}{\varepsilon}\right)$，DP 代价 $O\!\left(\dfrac{n^3}{\varepsilon}\right)$ —— 对 $n$ 和 $1/\varepsilon$ **都是多项式** ⟹ **FPTAS**。

> **思想总结**：**「降低精度的 DP」= 近似算法**。误差来自取整，而取整误差可以精确控制到 $\varepsilon$ 倍 —— 这是 FPTAS 的标准构造手法（也用于子集和 subset-sum 的近似）。

---

## 5. 案例三：$k$-中心问题（The K-center Problem）

### 5.1 问题与度量

**输入**：$n$ 个站点（sites）$s_1,\dots,s_n$。
**中心选择（center selection）**：选 $K$ 个中心 $C$，使**任意站点到最近中心的距离的最大值**最小：

$$\text{dist}(s_i, C) = \min_{c\in C}\text{dist}(s_i,c),\qquad r(C)=\max_i \text{dist}(s_i,C)$$

$$\text{目标：}\ \min r(C)\quad \text{s.t.}\ |C|=K$$

**距离（distance）必须满足**：
1. $\text{dist}(x,x)=0$（**恒等 identity**）；
2. $\text{dist}(x,y)=\text{dist}(y,x)$（**对称 symmetry**）；
3. $\text{dist}(x,y)\le \text{dist}(x,z)+\text{dist}(z,y)$（**三角不等式 triangle inequality**）。

> **关键**：候选中心的位置可以是**任意点**（不限于是站点），所以候选中心数是**无穷**（number of candidate centers $=\infty$）—— 这使暴力枚举不可行。

![图 11-5 k-中心问题：K=4 时选择 4 个中心，最小化最大覆盖半径 r(C)](ADS/pictures/Chapter%2011%20%E8%BF%91%E4%BC%BC%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig05_slide16.webp)

### 5.2 失败的贪心（反面教材）

**朴素贪心**：第一个中心放在「单中心最优位置」，之后每次加一个中心，**尽可能多地缩小覆盖半径**。

**结果：任意差（arbitrarily bad）！**
反例：两个相距很远的站点、$K=2$。朴素贪心会把第一个中心放在两者中点（单中心最优），第二个中心无论放哪都只能覆盖一侧 → 半径仍是一半距离；而**最优解是直接把两个站点选为中心**（半径 0）。**近似比无界。**

![图 11-6 朴素贪心「每次最大程度缩小半径」可能任意差（K=2 时最优是选两个站点为中心）](ADS/pictures/Chapter%2011%20%E8%BF%91%E4%BC%BC%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig06_slide17.webp)

### 5.3 正确的思路：已知 $r$ 时用 $2r$ 覆盖

**关键提问**：如果**已知**最优半径 $r(C^*)\le r$，能否构造一个 $2r$-近似的解？
**答案**：可以 —— 任取一个未被覆盖的站点 $s$ 作为中心，则**以 $s$ 为心、半径 $2r$ 的球**一定覆盖了「某个最优中心 $c^*$ 的 $r$-球」里的**全部**站点（由三角不等式：$\text{dist}(s',s)\le \text{dist}(s',c^*)+\text{dist}(c^*,s)\le r+r=2r$）。

![图 11-7 用 2r 覆盖的论证：以站点 s 为心，必能覆盖任一最优中心 c* 的 r-球内所有站点](ADS/pictures/Chapter%2011%20%E8%BF%91%E4%BC%BC%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig07_slide18.webp)

### 5.4 算法 1：`Greedy-2r`（给定 $r$）

```c
Centers Greedy-2r( Sites S[], int n, int K, double r )
{   Sites S'[] = S[];            /* 剩余（未被覆盖的）站点 */
    Centers C[] = ∅;
    while ( S'[] != ∅ ) {
        Select any s from S' and add it to C;
        Delete all s' from S' that are at dist(s', s) ≤ 2r;
    }
    if ( |C| ≤ K )  return C;
    else ERROR("No set of K centers with covering radius at most r");
}
```

**【定理】** 若算法选了**多于 $K$** 个中心，则对任意 $|C^*|\le K$ 的最优集合，都有 $r(C^*) > r$。

> 也就是说：**$2r$ 覆盖只要不超过 $K$ 个中心，就说明 $r$ 是可行的**；超过就说明 $r$ 太小。

### 5.5 把 $r$ 找出来：二分搜索

**问题**：我们并不知道 $r(C^*)$。

**做法**：在 $(0, r_{\max}]$ 上**二分搜索** $r$（$r_{\max}$ 可取「任一点到任一点的最大距离」）：
- 取 $r=(0+r_{\max})/2$；
- 跑 `Greedy-2r`：若**能找到 $\le K$ 个中心** → $r$ 可行，缩小上界；否则 → $r$ 太小，扩大下界；
- 最终得到 $r_1$（最小的可行 $r$），**输出半径为 $2r_1$ 的解**。

$$\text{近似比} = \frac{2r_1}{r(C^*)} \le 2 \quad\Longrightarrow\quad \textbf{2-approximation}$$

**复杂度**：若 $r$ 取整数，二分只需 $O(\log r)$ 轮，每轮 $O(nK)$ 或 $O(n^2)$ → **多项式**。

### 5.6 算法 2：`Greedy-Kcenter`（不需要 $r$，更简单）

```c
Centers Greedy-Kcenter( Sites S[], int n, int K )
{   Centers C[] = ∅;
    Select any s from S and add it to C;
    while ( |C| < K ) {
        Select s from S with maximum dist(s, C);   /* 离现有中心最远的点 */
        Add s to C;
    }
    return C;
}
```

**思想**：**「离得越远越好（be far away）」** —— 每次把最「孤立」的站点变成中心，最大化地填补当前最差的覆盖空洞。

**【定理】** 返回的 $K$ 个中心满足

$$r(C) \le 2\,r(C^*)$$

即 **2-近似**。

**证明（反证）**：设结果 $r(C) > 2r^*$。则每一步添加的 $s$ 到已有中心的距离都 $>2r^*$，于是按 5.3 的论证，这些中心点需要至少 $K+1$ 个 $r^*$-球才能覆盖 —— 与「$K$ 个中心、半径 $r^*$ 可行」矛盾。∎

![图 11-8 Greedy-Kcenter：每次选离现有中心最远的站点作为新中心，得到 2-近似](ADS/pictures/Chapter%2011%20%E8%BF%91%E4%BC%BC%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig08_slide21.webp)

### 5.7 不可近似性：$\rho<2$ 不可能

**【定理】** **除非 P = NP，否则中心选择问题不存在 $\rho<2$ 的近似算法。**

**证明思路（反证）**：
- 若能多项式时间得到 $(2-\varepsilon)$-近似，则能多项式时间求解 **DOMINATING-SET（支配集，NP 完全）**；
- 支配集问题有大小 $K$ 的解 $\iff$ 存在 $K$ 个中心 $C^*$ 使 $r(C^*)=1$；
- 由于此时所有距离都是**整数**，一个 $(2-\varepsilon)$-近似的解（半径 $<2$）必然是半径 $\le 1$ 的**最优解** → 就能判定支配集。矛盾。∎

> **意义**：$k$-中心的 2-近似是**理论最优**的（best possible），再改进就等价于证明 P=NP。这类结果叫**不可近似性（inapproximability）**。

---

## 6. 三难困境（Three Aspects）

近似算法的设计必须在三者间取舍：

| 维度 | 含义 |
|---|---|
| **A：最优性（optimality）** | 解的质量（quality of a solution） |
| **B：效率（efficiency）** | 计算成本（cost of computations） |
| **C：所有实例（all instances）** | 是否对所有输入都成立 |

三种组合：

| 组合 | 含义 | 例子 |
|---|---|---|
| **A + C** | 对所有实例都求**精确解** | 指数级算法（$O(2^N)$）、伪多项式 DP |
| **A + B** | 精确且快，但**只对特殊情形** | 树上/平面图/单位圆盘上的多项式算法 |
| **B + C** | 对所有实例都快，但**不保证最优** | **近似算法** |

> **课件金句**：**「Even if P = NP, still we cannot guarantee A + B + C.」**
> 即使 P=NP（意味着所有 NP 问题多项式可解），我们也**不可能**同时对**所有**实例都做到**又快又精确** —— 因为还存在**更强的时间下界**（时间层级定理、不可判定性等）阻挡。

![图 11-9 三难困境：最优性 A、效率 B、所有实例 C，三者不可兼得](ADS/pictures/Chapter%2011%20%E8%BF%91%E4%BC%BC%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig09_slide23.webp)

---

## 7. 易错点与考点清单

1. **近似比的定义**用 $\max(C/C^*, C^*/C)$，同时覆盖最小化与最大化问题；$\rho\ge1$。
2. **PTAS vs FPTAS**：PTAS 的运行时间对 $n$ 多项式，但可以**指数依赖 $1/\varepsilon$**（如 $O(n^{1/\varepsilon})$）；FPTAS 对 $n$ **和** $1/\varepsilon$ **都**多项式。
3. **Next Fit ≤ 2M−1 且紧**；**First Fit/Best Fit ≤ 1.7M**；**FFD ≤ 11M/9 + 6/9 且紧**。
4. **在线算法下界 5/3**：任何在线算法都不可能比 $\frac53 M$ 更好 —— 所以「排序后离线」才有意义。
5. 装箱的**判定版**（$K$ 个箱子能否装下）是 NPC，**优化版**（最少箱数）是 NP-hard，注意区分。
6. 分数背包按 $p_i/w_i$ 贪心**最优**；0-1 背包同样贪心只有 **2-近似**（且界是紧的）。
7. 0-1 背包 DP 是**伪多项式** $O(n^2p_{\max})$；「伪」的关键是 $p_{\max}$ 的**数值**与**编码长度**之差。
8. **FPTAS 构造法**：把利润按 $\varepsilon p_{\max}/n$ 缩放取整 → DP → 误差可控。
9. $k$-中心要求距离满足**三角不等式**（否则 2-近似的论证失效）。
10. **朴素「最大化缩小半径」贪心可以任意差**；正确做法是「最远点优先」（Greedy-Kcenter）或「$2r$ 覆盖 + 二分」。
11. $k$-中心的 **2 是下界**：$\rho<2$ ⟹ P=NP（用 DOMINATING-SET 归约）。

---

## 8. 参考

- Cormen et al., *Introduction to Algorithms* (3rd ed.)：**Ch.35**（Approximation Algorithms）p.1106–1140，The MIT Press, 2009。
- Weiss, *Data Structure and Algorithm Analysis in C* (2nd ed.)：**Ch.10**，p.359–366；M.A.Weiss 著、陈越改编，人民邮电出版社，2005。
- 课程 Project 5：*Texture Packing*（矩形纹理打包，设计并分析多项式近似算法），详见 `https://pintia.cn/`。
