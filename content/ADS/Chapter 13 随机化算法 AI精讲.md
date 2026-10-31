---
title: Chapter 13 随机化算法 · AI 精讲
aliases:
  - ADS/notes/Chapter 13 随机化算法 AI精讲
---
# Chapter 13 随机化算法（Randomized Algorithms）

> **课件来源**：`ADS13RandomizedAlgorithms_Stu.ppt`（16 页）
> **本章主线**：**把随机性放进算法内部**（而不是假设输入随机）→ 这样**对最坏输入也有好的期望性能**，且**不需要对输入分布做假设** → 两个经典案例：**雇佣问题（hiring problem）**（期望雇佣次数 $H_N=\ln N+O(1)$）与 **在线雇佣（online hiring / secretary problem）**（最优概率 $1/e\approx36.8\%$）→ **随机化快排**的「中央分割点（central splitter）」分析 → 补充：**随机排列（permute by sorting）** 的正确性。

---

## 0. 本章速览

| 问题 | 随机化的作用 | 结果 |
|---|---|---|
| 雇佣问题 | 随机打乱候选人顺序 | 期望雇佣次数 $E[X]=H_N=\ln N+O(1)$，总代价 $O(C_iN+C_h\ln N)$ |
| 在线雇佣（只能雇一次） | 随机到达顺序 | 最优成功概率 $\approx \frac1e\approx36.8\%$，取 $k=N/e$ |
| 快速排序 | 随机选 pivot | 期望 $O(N\log N)$，**与输入无关** |
| 随机排列 | 给元素随机优先级后排序 | 得到**均匀随机排列** |

**术语对照**

| 中文 | English | 中文 | English |
|---|---|---|---|
| 随机化算法 | randomized algorithm | 平均情况分析 | average-case analysis |
| 指示随机变量 | indicator random variable | 期望 | expectation |
| 随机排列 | random permutation | 均匀随机排列 | uniform random permutation |
| 在线雇佣 | online hiring | 秘书问题 | secretary problem |
| 中央分割点 | central splitter | 主元 | pivot |
| 对称性破除 | symmetry-breaking | 高概率 | with high probability |

---

## 1. 随机化什么？（What to Randomize?）

**两种截然不同的随机性来源**：

| 做法 | 随机性在哪里 | 评价 |
|---|---|---|
| **世界是随机的** | 假设**输入随机**（randomly generated input），用传统确定性算法求解 | 即**平均情况分析（average-case analysis）** |
| **算法是随机的** | 算法处理**最坏输入**时**自己做随机决策** | 即**随机化算法（randomized algorithm）** |

> **关键差别**：平均分析依赖「输入服从某分布」这个**无法验证的假设**；随机化算法把随机性**掌握在自己手里**，对**任意**（包括精心构造的恶意）输入都能给出好的**期望**性能。

## 2. 为什么要随机化？（Why Randomize?）

**包含关系（课件原话）**：

$$\text{高效且总是正确的确定性算法} \subset \text{高效的随机化算法}$$

而高效的随机化算法有两类：
1. **只在「高概率（with high probability）」下给出正确答案**（Monte Carlo 型）；
2. **总是正确，但只在「期望意义」下高效**（Las Vegas 型）。

**两类随机化算法**

| 类型 | 正确性 | 运行时间 | 例子 |
|---|---|---|---|
| **Las Vegas** | **总是正确** | **期望**高效（最坏可能很慢） | 随机化快排、随机化选择 |
| **Monte Carlo** | **高概率**正确（可能错） | **确定性**有界 | 素性测试（Miller-Rabin）、随机化最小割 |

**其他好处**：
- **更简单（simpler）** —— 省去复杂的确定性构造；
- **破除对称性（symmetry-breaking）** —— 分布式系统中多个进程用随机数打破对称，避免活锁（如以太网 CSMA/CD 的随机退避）。

---

## 3. 概率论速查

| 记号 | 含义 |
|---|---|
| $\Pr[A]$ | 事件 $A$ 发生的概率 |
| $\overline{A}$ | $A$ 的补事件（$A$ 不发生），$\Pr[\overline A]=1-\Pr[A]$ |
| $\mathrm{E}[X]$ | 随机变量 $X$ 的**期望**（"average value"） |
| **指示随机变量（indicator random variable）** | $X_i = \begin{cases}1 & \text{事件 } A_i \text{ 发生}\\0 & \text{否则}\end{cases}$，且 $\mathrm{E}[X_i]=\Pr[A_i]$ |
| **期望的线性性** | $\mathrm{E}\left[\sum_i X_i\right]=\sum_i \mathrm{E}[X_i]$（**不需要独立性**！） |

> **本章所有分析几乎都靠「指示随机变量 + 期望线性性」** —— 这是随机化算法分析的第一工具。

---

## 4. 案例一：雇佣问题（The Hiring Problem）

### 4.1 问题设定

- 通过猎头（headhunter）招一名助理；
- 连续 $N$ 天，每天面试一个应聘者；
- **面试成本 $C_i \ll$ 雇佣成本 $C_h$**（$C_i$ 小，$C_h$ 大）；
- 分析目标是**面试与雇佣的总成本**，而不是运行时间。

**策略**：维护「目前最好的人」，若今天的人更好就**解雇旧人、雇佣新人**。

```c
int Hiring( EventType C[], int N )
{   /* candidate 0 is a least-qualified dummy candidate */
    int Best = 0;
    int BestQ = the quality of candidate 0;
    for ( i = 1; i <= N; i++ ) {
        Qi = interview( i );            /* 成本 C_i */
        if ( Qi > BestQ ) {
            BestQ = Qi;
            Best = i;
            hire( i );                  /* 成本 C_h */
        }
    }
    return Best;
}
```

**设最终雇佣了 $M$ 人**，则总成本为

$$\boxed{\text{Total Cost} = C_i N + C_h M}$$

**最坏情况（worst case）**：候选人按**质量递增**顺序到来 → **每天都雇佣** → $M=N$，总成本 $C_iN+C_hN=O(N(C_i+C_h))$ —— **最坏就是每次都换人**。

![图 13-1 两种随机性来源：输入随机（平均分析）vs 算法随机（随机化算法）](ADS/pictures/Chapter%2013%20%E9%9A%8F%E6%9C%BA%E5%8C%96%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig01_slide02.webp)

### 4.2 随机到达顺序下的期望（指示随机变量法）

**假设**：候选人**以随机顺序到来**（candidates arrive in random order）。
**随机性假设**：前 $i$ 个候选人中，**任何一个是「目前为止最好的」概率相等**，即

$$\Pr[\text{第 } i \text{ 个被雇佣}] = \frac{1}{i}$$

**证明**：前 $i$ 个人中排名最高的那个位置在 $1..i$ 上均匀分布，故落在位置 $i$ 的概率为 $1/i$。

**设 $X$ = 雇佣次数**，令指示随机变量

$$X_i = \begin{cases}1 & \text{第 } i \text{ 个候选人被雇佣}\\ 0 & \text{否则}\end{cases},\qquad \mathrm{E}[X_i]=\Pr[X_i=1]=\frac1i$$

于是

$$X=\sum_{i=1}^{N}X_i \ \Longrightarrow\ \mathrm{E}[X]=\sum_{i=1}^{N}\mathrm{E}[X_i]=\sum_{i=1}^{N}\frac1i = H_N$$

其中 $H_N$ 是**调和数（harmonic number）**：

$$H_N = \ln N + O(1) \approx \ln N + \gamma,\qquad \gamma\approx0.5772$$

$$\boxed{\text{期望总成本} = O\left(C_i N + C_h \ln N\right)}$$

> **对比**：最坏 $O(C_h N)$，期望只有 $O(C_h\ln N)$ —— **相差 $N/\ln N$ 倍**。但注意：这个结论**依赖于「随机到达」这个假设**（我们无法控制猎头的推荐顺序）。

![图 13-2 指示随机变量：Pr[第 i 个被雇佣] = 1/i，期望雇佣次数 = H_N](ADS/pictures/Chapter%2013%20%E9%9A%8F%E6%9C%BA%E5%8C%96%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig02_slide07.png)

### 4.3 随机化雇佣算法（Randomized Hiring）

**做法**：**在面试之前，先把候选人列表随机打乱**。

```c
int RandomizedHiring( EventType C[], int N )
{   int Best = 0;
    int BestQ = the quality of candidate 0;
    randomly permute the list of candidates;      /* 关键：自己制造随机性 */
    for ( i = 1; i <= N; i++ ) {
        Qi = interview( i );
        if ( Qi > BestQ ) { BestQ = Qi; Best = i; hire( i ); }
    }
    return Best;
}
```

**效果**：
- ✅ **不再需要假设「候选人以随机顺序到来」** —— 随机性由算法保证；
- ❌ **需要额外时间**（$O(N)$ 的随机排列，或 $O(N\log N)$ 的排序版本）。

> **这就是随机化算法的精髓**：把「**输入随机**」这个不可控的假设，转化为「**算法内部随机**」这个可控的动作。

### 4.4 随机排列的实现：PermuteBySorting

**目标**：把数组 $A[\ ]$ 随机排列。

**做法**：给每个元素 $A[i]$ 分配一个**随机优先级 $P[i]$**，然后**按 $P$ 排序**。

```c
void PermuteBySorting( ElemType A[], int N )
{
    for ( i = 1; i <= N; i++ )
        A[i].P = 1 + rand() % (N*N*N);   /* 用 N³ 让优先级几乎必然互不相同 */
    Sort A, using P as the sort keys;
}
```

**【Claim】** 在所有优先级**互不相同**的前提下，`PermuteBySorting` 产生输入的一个**均匀随机排列（uniform random permutation）**。

**证明思路**：$N$ 个互异优先级共有 $N!$ 种相对大小顺序，每种等概率 $1/N!$；排序后数组的排列与「优先级的相对顺序」一一对应，因此每种排列等概率 —— 即均匀随机。

![图 13-3 随机排列（PermuteBySorting）：给每个元素随机优先级后排序，得到均匀随机排列](ADS/pictures/Chapter%2013%20%E9%9A%8F%E6%9C%BA%E5%8C%96%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig03_slide09.webp)

**为什么取 $N^3$ 而不是 $N$？** 若优先级在 $[1,N]$ 中取，由**生日悖论**，冲突概率约 $1-e^{-N/2}$（很高）；取 $[1,N^3]$ 后冲突概率降到 $O(1/N)$ 量级 —— **让「优先级互不相同」以高概率成立**。

**其他方法**：Fisher-Yates 洗牌（$O(N)$，原地，无冲突问题）—— 工业实现的更优选择：
```
for ( i = N; i >= 2; i-- )  swap( A[i], A[random(1..i)] );
```

---

## 5. 案例二：在线雇佣（Online Hiring / Secretary Problem）

### 5.1 问题

**限制**：**只能雇佣一次**（hire only once）—— 一旦决定雇佣某人，就必须停止面试（现实中猎头费很贵、错过就不能反悔）。

**策略（`OnlineHiring`）**：

```c
int OnlineHiring( EventType C[], int N, int k )
{   int Best = N;
    int BestQ = -∞;
    for ( i = 1; i <= k; i++ ) {          /* 阶段 1：面试前 k 人，只看不雇 */
        Qi = interview( i );
        if ( Qi > BestQ )  BestQ = Qi;
    }
    for ( i = k+1; i <= N; i++ ) {        /* 阶段 2：遇到比前 k 人都好的就雇 */
        Qi = interview( i );
        if ( Qi > BestQ ) { Best = i; break; }
    }
    return Best;
}
```

**两个问题**：
1. 给定 $k$，**雇到最优候选人的概率**是多少？
2. **$k$ 取多少**能使这个概率最大？

### 5.2 概率推导

设 $S_i$ := 「第 $i$ 个候选人是最优的，且我们雇佣了他」。

$S_i$ 为真需要**两件事同时发生**：

$$S_i = \underbrace{\{A:\ \text{最优者在位置 } i\}}_{\Pr=1/N}\ \cap\ \underbrace{\{B:\ k+1 \sim i-1 \text{ 位置无人被雇佣}\}}_{\Pr=\frac{k}{i-1}\ (\text{独立})}$$

- $\Pr[A]=1/N$（最优者等可能地在任意位置）；
- $\Pr[B]=\dfrac{k}{i-1}$：在位置 $k+1..i-1$ 中，**没有任何人比前 $k$ 人的最大值更好**（否则我们会提前雇佣）—— 等价于「前 $i-1$ 人中的最优者在 $1..k$ 中」，概率 $\frac{k}{i-1}$。

两事件独立，于是

$$\Pr[S_i]=\frac{1}{N}\cdot\frac{k}{i-1}$$

**总成功概率**：

$$P(k)=\sum_{i=k+1}^{N}\Pr[S_i]=\frac{k}{N}\sum_{i=k+1}^{N}\frac{1}{i-1}=\frac{k}{N}\sum_{j=k}^{N-1}\frac{1}{j}$$

用积分近似（$\sum_{j=k}^{N-1}\frac1j \approx \ln\frac{N}{k}$）：

$$P(k)\approx \frac{k}{N}\ln\frac{N}{k}$$

### 5.3 最优的 $k$

令 $x=\dfrac{k}{N}$，则 $P\approx x\ln\dfrac1x = -x\ln x$。求导：

$$\frac{d}{dx}(-x\ln x) = -\ln x - 1 = 0 \ \Longrightarrow\ \ln x = -1 \ \Longrightarrow\ x=\frac1e$$

$$\boxed{k^* = \frac{N}{e}\approx 0.368N,\qquad P(k^*)=\frac1e\approx 36.8\%}$$

> **惊人的结论**：无论 $N$ 多大，只要**先观察 37% 的候选人**（建立基准），然后**录用第一个超过基准的人**，成功概率就**恒为约 36.8%**。这个 $1/e$ 是**最优**的（对所有 $k$ 取最大）。

![图 13-4 在线雇佣：S_i 需要「最优者在 i」与「k+1..i-1 无人被雇」同时成立](ADS/pictures/Chapter%2013%20%E9%9A%8F%E6%9C%BA%E5%8C%96%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig04_slide11.webp)

![图 13-5 最优 k：P(k) ≈ (k/N)ln(N/k) 在 k=N/e 处取得最大值 1/e](ADS/pictures/Chapter%2013%20%E9%9A%8F%E6%9C%BA%E5%8C%96%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig05_slide12.webp)

**现实意义**：这是**最优停止理论（optimal stopping）** 的经典结果，应用于**招聘、租房、卖房、择偶**等「看一批选一个、不能回头」的决策场景。

---

## 6. 案例三：随机化快速排序（Randomized Quicksort）

### 6.1 确定性快排的问题

| | 复杂度 |
|---|---|
| 最坏情况 | $\Theta(N^2)$（每次 pivot 都取到最值，如已排序输入 + 取首元素） |
| 平均情况 | $\Theta(N\log N)$（**假设每种输入排列等概率**） |

![图 13-6 确定性快排的两种情形：最坏 Θ(N²)（已排序输入）与平均 Θ(N log N)](ADS/pictures/Chapter%2013%20%E9%9A%8F%E6%9C%BA%E5%8C%96%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig06_slide13.webp)

**随机化**：**均匀随机地选 pivot**（或先随机打乱再取首元素）。

### 6.2 中央分割点（central splitter）

**【定义】中央分割点（central splitter）**：把集合划分后，**每一边至少含 $n/4$ 个元素**的 pivot。

**为什么用 $n/4$ 而不是 $n/2$？** 因为要留出「安全余量」：只要每边不小于 $n/4$，子问题规模就**至少缩小到 $3n/4$**，递归深度就是 $O(\log_{4/3}N)=O(\log N)$。

**概率**：随机选一个 pivot，它落在「第 $n/4$ 小到第 $3n/4$ 小」之间的概率为

$$\Pr[\text{central splitter}] = \frac{n/2}{n} = \frac12$$

### 6.3 期望迭代次数

**【Claim】** 找到一个中央分割点所需的**期望迭代次数至多 2**。

**证明**：每轮独立地以 $\frac12$ 的概率成功 → 成功所需轮数服从**几何分布（geometric distribution）**，期望为 $\frac{1}{1/2}=2$。∎

> **代价**：每次尝试是一次 partition，$O(n)$；期望 $\le 2$ 次 → 仍是 $O(n)$（常数因子 2）。

### 6.4 总复杂度：按「子问题类型」分类计数

**【定义】类型 $j$（type $j$）**：子问题 $S$ 属于类型 $j$，若其规模满足

$$\left(\frac34\right)^{j} n < |S| \le \left(\frac34\right)^{j-1} n$$

（即**递归深度为 $j$** 的那一层）

**【Claim】** 类型 $j$ 的子问题**至多**有 $\left(\frac{4}{3}\right)^{j}$ 个。

**理由**：每个子问题规模 $\le \left(\frac34\right)^{j-1}n$，而它们的元素总数不超过 $n$，故个数 $\le \dfrac{n}{(3/4)^j n}=\left(\frac43\right)^{j}$。

**每层代价**：类型 $j$ 的所有子问题总规模 $\le n$，处理代价 $O(n)$（每层 partition 是线性的）。

**类型总数**（递归深度）：

$$j_{\max} = \log_{4/3}N = O(\log N)$$

于是总期望时间：

$$T(N) = \sum_{j=0}^{j_{\max}} O(n) = O(N\log N)$$

$$\boxed{\text{随机化快排的期望时间} = O(N\log N)\ \text{（对任意输入）}}$$

> **关键区别**：确定性快排的 $O(N\log N)$ 是**平均**（依赖输入分布假设），随机化快排的 $O(N\log N)$ 是**期望**（对**任意**输入，包括最坏输入）—— 这就是随机化的价值。

![图 13-7 中央分割点：pivot 落在中间一半区间（n/4 ~ 3n/4）的概率为 1/2](ADS/pictures/Chapter%2013%20%E9%9A%8F%E6%9C%BA%E5%8C%96%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig07_slide14.webp)

---

## 7. 随机化 vs 平均分析 vs 摊还分析

| | 平均情况（average-case） | 摊还（amortized） | 随机化（randomized） |
|---|---|---|---|
| 随机性来源 | **输入的分布假设** | **无**（确定性！） | **算法内部的随机数** |
| 保证的形式 | 期望（对输入分布） | 任意序列的总代价上界 | 期望（对任意输入） |
| 依赖假设 | 是（可能不成立） | 否 | 否 |
| 例子 | 快排平均 $O(N\log N)$ | splay 树、二项队列 | 随机化快排、随机化雇佣 |

> **一句话总结**：**摊还是「确定性的平均」，随机化是「把平均变成自己的武器」。**

---

## 8. 易错点与考点清单

1. **随机化的两种类型**：Las Vegas（总正确、期望高效）vs Monte Carlo（高效、高概率正确）。
2. 雇佣问题：$\Pr[\text{第 } i \text{ 人被雇佣}]=\frac1i$，$\mathrm{E}[X]=H_N=\ln N+O(1)$（**不是** $\log N$，是**自然对数**）。
3. 期望的**线性性**不要求独立性 —— 这是指示随机变量法成立的关键。
4. **最坏情况**（质量递增）下 $M=N$，成本 $O(NC_h)$；随机化后**期望** $O(C_h\ln N)$。
5. `PermuteBySorting` 用 $[1,N^3]$ 的随机优先级是**为了让优先级高概率互异**（生日悖论）；Fisher-Yates 更优。
6. **在线雇佣**：$P(k)\approx\frac kN\ln\frac Nk$，最优 $k=N/e$，成功率 $1/e\approx36.8\%$。
7. 在线雇佣 $S_i$ 成立的**两个条件**要都写：最优者在 $i$（概率 $1/N$）+ 前 $i-1$ 的最优者在 $1..k$（概率 $\frac{k}{i-1}$）。
8. **中央分割点**定义是「每边至少 $n/4$」，概率 $\frac12$，期望迭代 $2$ 次（几何分布）。
9. 子问题规模每层至少缩到 $\frac34$ → 深度 $O(\log_{4/3}N)$ → 总 $O(N\log N)$。
10. 随机化快排的界是**对任意输入**的期望；确定性快排的 $O(N\log N)$ 依赖输入均匀假设。

---

## 9. 参考

- Cormen et al., *Introduction to Algorithms* (3rd ed.)：**Ch.5**（Probabilistic Analysis and Randomized Algorithms）p.114–145，The MIT Press, 2009。
- Weiss, *Data Structure and Algorithm Analysis in C* (2nd ed.)：**Ch.10**，p.399–401；M.A.Weiss 著、陈越改编，人民邮电出版社，2005。
- 课程 Project 6：*Skip Lists*（跳表：期望 $O(\log N)$ 的查找与插入），详见 `https://pintia.cn/`。
