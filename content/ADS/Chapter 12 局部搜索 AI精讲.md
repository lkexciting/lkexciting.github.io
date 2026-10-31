---
title: Chapter 12 局部搜索 · AI 精讲
aliases:
  - ADS/notes/Chapter 12 局部搜索 AI精讲
---
# Chapter 12 局部搜索（Local Search）

> **课件来源**：`ADS12LocalSearch_TS.ppt`（20 页）
> **本章主线**：不追求全局最优，只求**局部最优（local optimum）** —— 从一个可行解出发，在**邻域（neighborhood）** 里不断找更好的解，直到**无法改进**为止 → 核心问题是「**会不会卡在坏局部最优**」与「**能不能在有限步内终止**」→ 三个案例：**点覆盖**（梯度下降失败）、**Hopfield 神经网络**（状态翻转必然终止）、**最大割**（2-近似 + K-L 启发式）。

---

## 0. 本章速览

| 案例 | 邻域定义 | 目标函数 | 结论 |
|---|---|---|---|
| 点覆盖（vertex cover） | 增删一个结点 | $\|S\|$ 最小 | **梯度下降会卡在局部最优** |
| Hopfield 网络 / 最大割（max cut） | 翻转一个结点的状态 | $\Phi=\sum_{\text{good}}\vert w_e\vert$ 最大 | 状态翻转**必然终止**，且**局部最优 = 稳定配置** |
| 最大割的质量 | 单点翻转 | 割权重 | 局部最优 $\ge \frac12$ 全局最优 → **2-近似** |
| big-improvement-flip | 只接受「提升足够大」的翻转 | 同上 | $(2+\varepsilon)$-近似，$O\!\left(\frac{n}{\varepsilon}\log W\right)$ 步 |
| Kernighan-Lin（K-L） | $k$-flip（连续翻转 $k$ 个） | 同上 | 更强但**无理论保证**（分析仍是开放问题） |

**术语对照**

| 中文 | English | 中文 | English |
|---|---|---|---|
| 局部搜索 | local search | 邻域 | neighborhood |
| 局部最优 | local optimum | 全局最优 | global optimum |
| 梯度下降 | gradient descent | 邻居关系 | neighbor relation |
| 模拟退火 | simulated annealing | 冷却进度表 | cooling schedule |
| Hopfield 神经网络 | Hopfield neural network | 状态翻转 | state flipping |
| 稳定配置 | stable configuration | 最大割 | maximum cut |
| 单点翻转 | single-flip | $k$-flip | k-flip neighborhood |

---

## 1. 局部搜索的框架

**目标**：**近似地求解问题（solve problems approximately）** —— 瞄准**局部最优（local optimum）**。

**两个组成部分（Local + Search）**：

| 要素 | 内容 |
|---|---|
| **Local（局部）** | 在可行解集合（feasible set）中定义**邻域（neighborhoods）**；**局部最优 = 在一个邻域中最好的解** |
| **Search（搜索）** | 从一个可行解出发，在邻域中搜索**更好**的解；**一旦无法改进，就达到了局部最优** |

**三个必须回答的问题**：
1. 邻域怎么定义？（决定能跳多远）
2. **算法能在有限步内终止吗**（can the algorithm terminate in a finite number of steps）？
3. 得到的局部最优**离全局最优有多远**？

![图 12-1 局部搜索：从猜测出发，在邻域中下滑到局部最优（可能不是全局最低点）](ADS/pictures/Chapter%2012%20%E5%B1%80%E9%83%A8%E6%90%9C%E7%B4%A2%20AI%E7%B2%BE%E8%AE%B2/fig01_slide02.webp)

### 1.1 邻居关系与邻域

- **邻居关系（neighbor relation）**：$S \sim S'$ 表示 $S'$ 是 $S$ 的邻居 —— **$S'$ 可由 $S$ 做「小的修改（small modification）」得到**；
- **邻域（neighborhood）**：$N(S) = \{S' : S \sim S'\}$。

### 1.2 梯度下降框架（Gradient Descent）

```c
SolutionType Gradient_descent()
{   Start from a feasible solution S ∈ FS;
    MinCost = cost(S);
    while (1) {
        S' = Search( N(S) );            /* 在邻域中找最好的 S' */
        CurrentCost = cost(S');
        if ( CurrentCost < MinCost ) {
            MinCost = CurrentCost;  S = S';
        }
        else  break;                    /* 无法改进 → 局部最优 */
    }
    return S;
}
```

> **为什么叫「梯度下降」**：每次沿「让目标函数下降最快」的方向走一小步，就像沿**梯度（gradient）** 方向下山 —— 于是会停在最近的「碗底」，而非全局最低点。

---

## 2. 案例一：点覆盖（Vertex Cover）—— 梯度下降会失败

**问题（优化版）**：给定无向图 $G=(V,E)$，找**最小**子集 $S\subseteq V$，使每条边 $(u,v)\in E$ 至少有一个端点在 $S$ 中。

**局部搜索的三要素**：

| 要素 | 定义 |
|---|---|
| 可行解集 FS | **所有**点覆盖（$V$ 本身一定是点覆盖） |
| 代价函数 | $\text{cost}(S) = \|S\|$ |
| 邻居 | $S'$ 由 $S$ **增删一个结点**得到（每个 $S$ 至多 $\|V\|$ 个邻居） |

**搜索策略**：从 $S=V$ 开始，**每次删掉一个结点**，检查剩下的集合是否仍是点覆盖且代价更小。

**失败情形**（课件给出 Case 0 / Case 1 / Case 2）：

- **Case 0**：$S=\varnothing$？—— 不是可行解（除非无边），所以不能从空集开始；
- **Case 1**：梯度下降删到一个**局部最优**（任何一个结点都不能删，否则有边失去覆盖），但**它比全局最优大** —— 这才是不行的关键；
- **Case 2**：更复杂的陷入情形。

**为什么失败**：邻域只允许「删一个结点」，某些改进需要**先增后删**（先加入一个结点，才能安全删掉两个）—— 单步邻域看不到这种改进。

![图 12-2 点覆盖的局部搜索：Case 0/1/2 说明梯度下降会卡在非全局最优的局部最优](ADS/pictures/Chapter%2012%20%E5%B1%80%E9%83%A8%E6%90%9C%E7%B4%A2%20AI%E7%B2%BE%E8%AE%B2/fig02_slide06.webp)

---

## 3. 逃离局部最优：Metropolis 与模拟退火

### 3.1 Metropolis 算法

```c
SolutionType Metropolis()
{   Define constants k and T;
    Start from a feasible solution S ∈ FS;
    MinCost = cost(S);
    while (1) {
        S' = Randomly chosen from N(S);          /* 随机选一个邻居 */
        CurrentCost = cost(S');
        if ( CurrentCost < MinCost ) {
            MinCost = CurrentCost;  S = S';
        }
        else {
            With a probability exp(-Δ/(kT)),  let S = S';   /* 允许「上坡」 */
            else  break;
        }
    }
    return S;
}
```

**核心变化**：以**概率**接受一个**更差**的解（**允许「上坡」**），从而有机会**跳出**局部最优。

- $\Delta = \text{CurrentCost} - \text{MinCost} > 0$，概率 $\exp\!\left(-\dfrac{\Delta}{kT}\right)$；
- **$T$ 很高时**：上坡概率接近 1 → 在底部**剧烈震荡**（几乎随机游走）；
- **$T$ 接近 0 时**：上坡概率接近 0 → **退化为普通梯度下降**。

### 3.2 模拟退火（Simulated Annealing）

**物理类比**：把材料**从高温缓慢降温（cooled very gradually）**，让它在**一系列中间温度**下都有足够时间达到**平衡（equilibrium）**，最终形成低能量的晶体结构（而不是缺陷很多的玻璃态）。

**冷却进度表（cooling schedule）**：$T = \{T_1, T_2, \dots\}$，$T_1 > T_2 > \cdots \to 0$。

**要点**：
- 降温**太快** → 卡在坏局部最优（淬火）；
- 降温**太慢** → 收敛极慢；
- 实践中常用几何降温 $T_{k+1} = \alpha T_k$（$\alpha \approx 0.9\sim0.99$）。

> ⚠️ **注意（课件 Note）**：对某些情形（如 Case 0），Metropolis **可能在「加 1」与「减 1」之间无限震荡** —— **无法保证有限步终止**。「能否终止」正是本章反复强调的问题。

---

## 4. 案例二：Hopfield 神经网络（Hopfield Neural Networks）

### 4.1 模型

- 图 $G=(V,E)$，边权 $w_e$ 为**整数**（可正可负）；
- 输出：一个**配置（configuration）** $S$，即给每个结点 $u$ 赋状态 $s_u \in \{\pm1\}$；
- **语义**：
  - $w_e < 0$（$e=(u,v)$）→ $u,v$ **希望同状态**；
  - $w_e > 0$ → $u,v$ **希望不同状态**；
  - $|w_e|$ 表示该要求的**强度**。

**问题**：**可能不存在**满足所有边要求的配置 → 于是退而求其次：**找一个「足够好」的配置**。

![图 12-3 Hopfield 网络：结点状态 ±1，边权正负表示「希望不同/相同」，绝对值表示强度](ADS/pictures/Chapter%2012%20%E5%B1%80%E9%83%A8%E6%90%9C%E7%B4%A2%20AI%E7%B2%BE%E8%AE%B2/fig03_slide09.webp)

### 4.2 三个关键定义

| 定义 | 内容 |
|---|---|
| **好边（good edge）** | 在配置 $S$ 中，$w_e s_u s_v < 0$。等价地：$w_e<0$ 时 $s_u=s_v$，$w_e>0$ 时 $s_u\ne s_v$（**要求被满足**） |
| **满足的结点（satisfied node）** | 结点 $u$ 关联的**好边权重之和 $\ge$ 坏边权重之和** |
| **稳定配置（stable configuration）** | **所有结点都被满足** |

**判据**：设 $u$ 关联的好边权和为 $W^+$、坏边权和为 $W^-$，则 $u$ 满足 $\iff W^+ \ge W^-$。

在配置 $S$ 中，结点 $u$ 的「好边权重和 / 坏边权重和」直接决定它是否满足，课件用两张图对比了「满足」与「不满足」两种情形：

![图 12-4 Hopfield 的定义：好边/坏边、满足结点（好边权和 ≥ 坏边权和）、稳定配置](ADS/pictures/Chapter%2012%20%E5%B1%80%E9%83%A8%E6%90%9C%E7%B4%A2%20AI%E7%B2%BE%E8%AE%B2/fig04_slide10.webp)

**目标函数（potential）**：

$$\Phi(S) = \sum_{e\ \text{is good}} |w_e|$$

### 4.3 状态翻转算法（State-flipping）

```c
ConfigType State_flipping()
{
    Start from an arbitrary configuration S;
    while ( ! IsStable(S) ) {
        u = GetUnsatisfied(S);      /* 找一个不满足的结点 */
        s_u = - s_u;                /* 翻转它的状态 */
    }
    return S;
}
```

**直觉**：不满足的结点「翻一下」通常会让更多边变好（因为它关联的坏边权重大于好边）。

**【问题】它会终止吗？**

![图 12-5 状态翻转：不断翻转不满足结点的状态，直到稳定](ADS/pictures/Chapter%2012%20%E5%B1%80%E9%83%A8%E6%90%9C%E7%B4%A2%20AI%E7%B2%BE%E8%AE%B2/fig05_slide11.webp)

### 4.4 终止性证明（势函数法）

**【Claim】** 状态翻转算法**至多 $W = \sum_e |w_e|$ 次翻转**后终止于一个稳定配置。

**证明**：取势函数 $\Phi(S) = \sum_{e\ \text{good}} |w_e|$。
当结点 $u$ 翻转（$S\to S'$）时：
- 所有与 $u$ 关联的**好边变坏**；
- 所有与 $u$ 关联的**坏边变好**；
- **其余边不变**。

因为 $u$ 是**不满足**的（坏边权和 $>$ 好边权和），故

$$\Phi(S') - \Phi(S) = W^- - W^+ > 0$$

即**每次翻转 $\Phi$ 严格增加至少 1**（权重为整数）。而

$$0 \le \Phi(S) \le W = \sum_e |w_e|$$

所以最多 $W$ 次翻转必终止 —— 且终止时**不存在不满足的结点**，即达到稳定配置。∎

> **注意**：$W$ 是**权重之和的数值**，可能指数大于输入编码长度（$\log W$）→ 所以这个算法是**伪多项式**的！

### 4.5 与局部搜索的关系（重要视角）

> **状态翻转算法 = 在「最大化 $\Phi$」问题上的局部搜索！**

| 局部搜索要素 | 对应 |
|---|---|
| 目标 | **最大化** $\Phi(S)$ |
| 可行解集 FS | 所有配置 |
| 邻居 | 翻转**一个**结点的状态 |
| 局部最优 | **稳定配置**（任何单点翻转都不能再改进 $\Phi$） |

**推论**：**任意局部最大值都是稳定配置**（反之亦然）。

### 4.6 开放问题（open question）

> **是否存在关于 $n$ 和 $\log W$ 多项式**（而不是 $n$ 和 $W$ 多项式）的算法来构造稳定配置？或者**原始算术操作次数只与 $n$ 相关、与 $W$ 无关**？

这个问题的本质是：**状态翻转是否一定需要「伪多项式」步数**？至今未解决 —— 这也说明**局部搜索的收敛速度分析**可以非常困难。

---

## 5. 案例三：最大割（Maximum Cut）

### 5.1 问题

给定无向图 $G=(V,E)$、正权 $w_e>0$，求结点划分 $(A,B)$ 使**跨越割的边权和最大**。

**应用（toy application）**：$n$ 个活动、$m$ 个人，每人想参加**两个**活动；把每个活动安排在上午或下午，使**能同时参加两个活动的人数最多**（同一人偏好的两个活动被分到不同半天）。

**真实应用**：**电路布图（circuit layout）**、**统计物理（statistical physics）**（自旋玻璃）。

![图 12-6 最大割：划分为 (A,B)，使跨割边权和最大；可用于「上午/下午活动安排」](ADS/pictures/Chapter%2012%20%E5%B1%80%E9%83%A8%E6%90%9C%E7%B4%A2%20AI%E7%B2%BE%E8%AE%B2/fig06_slide14.webp)

### 5.2 用局部搜索求解

| 要素 | 定义 |
|---|---|
| 目标 | **最大化** $w(A,B)$ |
| 可行解集 | 任意划分 $(A,B)$ |
| 邻居（**单点翻转 single-flip**） | 把**一个**结点从 $A$ 移到 $B$（或反之） |

**关键洞察**：**最大割是 Hopfield 网络的特例 —— 所有 $w_e$ 都为正！**
（$w_e > 0$ 表示「希望不同侧」—— 正是割的定义。）因此直接用 `State_flipping` 即可，$\Phi(S)=w(A,B)$。

> **注意（课件提醒）**：状态翻转**可能不在多项式时间内完成**（可能需 $O(W)$ 步，$W$ 是权重数值和）。

### 5.3 这个局部最优有多好？（2-近似）

**【Claim】** 设 $(A,B)$ 是**局部最优**划分，$(A^*,B^*)$ 是**全局最优**，则

$$w(A,B) \ge \frac12\,w(A^*,B^*)$$

**证明**：因为 $(A,B)$ 是局部最优，对任意 $u\in A$，把 $u$ 移到 $B$ **不会增大**割值：

$$\sum_{v\in A} w(u,v) \ \le\ \sum_{v\in B} w(u,v)$$

对**所有** $u\in A$ 求和：

$$\sum_{u\in A}\sum_{v\in A} w(u,v) \ \le\ \sum_{u\in A}\sum_{v\in B} w(u,v) = w(A,B)$$

（左边对每条 $A$ 内部边算了**两次**，即 $2\,w(A,A)$）

$$2\,w(A,A) \le w(A,B)$$

同理对 $B$ 有 $2\,w(B,B)\le w(A,B)$。而全局最优

$$w(A^*,B^*) \le w(A,A)+w(B,B)+w(A,B) \le \frac{w(A,B)}{2}+\frac{w(A,B)}{2}+w(A,B) = 2\,w(A,B)$$

故 $w(A,B)\ge \frac12 w(A^*,B^*)$。∎

**因此单点翻转的局部最优是 2-近似。**

### 5.4 最大割的近似算法谱系（课件列出的三个里程碑）

| 结果 | 近似比 | 出处 |
|---|---|---|
| 存在 2-近似算法 | $2$ | Sahni-Gonzales, 1976 |
| 存在 $1.1382$-近似算法（**SDP + 随机超平面舍入**） | $1.1382$ | Goemans-Williamson, 1995 |
| 除非 P=NP，**不存在 $\frac{17}{16}=1.0625$ 的近似** | $\ge 1.0625$ | Håstad, 1997 |

> 这三个结果夹出了最大割的**可近似性区间**：$[1.0625,\ 1.1382]$。Goemans-Williamson 的 1.1382 **至今未被改进**，而 1.0625 是**不可突破的下界** —— 这是**近似算法理论最著名的开放问题之一**。

### 5.5 让步：big-improvement-flip（只接受「大改进」）

**问题**：单点翻转可能要走 $O(W)$ 步（伪多项式）。

**解决**：**只接受提升足够大的翻转** —— 当没有「足够大的改进」时就停止。

**【Claim 1】** 终止时返回的割 $(A,B)$ 满足

$$(2+\varepsilon)\,w(A,B) \ge w(A^*,B^*)$$

**【Claim 2】** 算法至多 $O\!\left(\dfrac{n}{\varepsilon}\log W\right)$ 次翻转。

**证明思路（课件 Note）**：
1. 每次 flip 至少把当前割值**乘以** $(1+\frac{2\varepsilon}{n})$ 量级（相对增长）；
2. 连续 $\frac{n}{\varepsilon}$ 次 flip，总增长至少 **2 倍**（利用 $(1+1/x)^x \ge 2$ 对 $x\ge1$）；
3. 割值总量不超过 $W$，所以要「翻倍」的次数不能超过 $\log W$ 次；
4. 于是总翻转次数 $\le \frac{n}{\varepsilon}\cdot\log W = O\!\left(\frac{n}{\varepsilon}\log W\right)$。∎

> **意义**：牺牲一点点质量（从 2 变成 $2+\varepsilon$），换来**真正多项式**的运行时间 —— 这是「**精度换速度**」的又一例（与第 11 章 FPTAS 同理）。

### 5.6 更好的邻域：$k$-flip 与 Kernighan-Lin

**邻域大小的两难（核心 trade-off）**：

> 邻域**要足够丰富**，才不容易卡在坏的局部最优；但邻域**不能太大**，否则每次搜索邻居集合都很慢。

- **single-flip**：邻域大小 $O(n)$，每次搜索便宜，但容易卡住；
- **$k$-flip**：邻域大小 $O(n^k)$，搜索代价 $O(n^k)$，质量更好但更慢。

**【Kernighan-Lin 启发式，1970】**：用「**连续 $k$ 次翻转**」构造一条**动态邻域链**，但每步只花 $O(n)$：

| 步骤 | 做法 | 代价 |
|---|---|---|
| Step 1 | 做「最好的」1-flip，得到 $(A_1,B_1)$ 与被翻结点 $v_1$（**标记**，之后不再翻） | $O(n)$ |
| Step $k$ | 翻一个**未标记**结点中最好的，得到 $(A_k,B_k)$、$v_1..v_k$ | $O(n-k+1)$ |
| Step $n$ | $(A_n,B_n)=(B,A)$（全部翻完 = 交换两边） | — |

**邻域定义**：$(A,B)$ 的邻域 = $\{(A_1,B_1),\dots,(A_{n-1},B_{n-1})\}$ —— 即「**任意前缀翻转序列**」的结果，然后在其中取**最好的**作为下一步。

$$T = O(n^2)\ \text{per move}$$

**注意**：K-L **允许中间步骤变差**（这正是它能跳出局部最优的原因），但**整体分析仍是开放问题**（no theoretical guarantee）。

![图 12-7 K-L 启发式：连续做最好的 1-flip（结点打标记不重复），邻域取所有前缀结果](ADS/pictures/Chapter%2012%20%E5%B1%80%E9%83%A8%E6%90%9C%E7%B4%A2%20AI%E7%B2%BE%E8%AE%B2/fig07_slide19.webp)

---

## 6. 三种「逃离局部最优」的思路总结

| 思路 | 代表 | 代价 |
|---|---|---|
| **允许上坡**（随机接受差解） | Metropolis / 模拟退火 | 可能不终止（震荡）；需要冷却表 |
| **扩大邻域**（多步一起改） | $k$-flip / K-L 启发式 | 每步搜索代价 $O(n^k)$ 或 $O(n^2)$；理论保证弱 |
| **降低精度要求**（只接受大改进） | big-improvement-flip | 质量从 2 降到 $2+\varepsilon$，但多项式时间 |

---

## 7. 易错点与考点清单

1. **局部搜索只保证局部最优**；能否终止、离全局最优多远，是分析的两个核心问题。
2. 邻域的定义决定一切：**点覆盖「增删一个点」的邻域会让梯度下降卡住**（需要「先增后删」才能改进）。
3. **Metropolis 以概率 $\exp(-\Delta/kT)$ 接受差解**；$T\to\infty$ 时趋近随机游走，$T\to0$ 时退化为梯度下降；**不保证终止**。
4. Hopfield：**好边** = 要求被满足；**满足结点** = 好边权和 $\ge$ 坏边权和；**稳定配置** = 全部满足。
5. 势函数 $\Phi=\sum_{\text{good}}|w_e|$，每次翻转让 $\Phi$ **严格增加**，$0\le\Phi\le W$ ⟹ **至多 $W$ 步终止**（但 $W$ 是**数值**，所以是**伪多项式**）。
6. **最大割 = 所有边权为正的 Hopfield 网络**；`State_flipping` 直接可用。
7. 最大割的**局部最优是 2-近似**：证明靠「单点移过去不变好」⟹ $2w(A,A)\le w(A,B)$ 且 $2w(B,B)\le w(A,B)$。
8. 最大割的近似界：**2（1976）→ 1.1382（1995）**，不可低于 **17/16 = 1.0625**（1997）。
9. `big-improvement-flip` 给 $(2+\varepsilon)$-近似、$O(\frac{n}{\varepsilon}\log W)$ 步 —— **牺牲精度换多项式时间**。
10. **K-L 允许中间变差**（这是关键），代价 $O(n^2)$/步，但**无理论保证**。
11. 邻域的两个约束：**足够丰富**（避免坏局部最优）**但不能太大**（保证搜索效率）。

---

## 8. 参考

- Jon Kleinberg, Éva Tardos, *Algorithm Design*：**Ch.12**（Local Search）p.661–706, Addison Wesley, 2005。
- 经典文献：Sahni & Gonzales (1976, MAX-CUT 2-approx)；Goemans & Williamson (1995, 1.1382-approx)；Håstad (1997, 17/16 不可近似)；Kernighan & Lin (1970, K-L heuristic)。
