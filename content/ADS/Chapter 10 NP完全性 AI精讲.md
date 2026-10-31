---
title: Chapter 10 NP完全性 · AI 精讲
aliases:
  - ADS/notes/Chapter 10 NP完全性 AI精讲
---
# Chapter 10 NP 完全性（NP-Completeness）

> **课件来源**：`ADS10NP_TS.ppt`（19 页）
> **本章主线**：有些问题**至今没有多项式算法**（Hamilton 回路、TSP、团、点覆盖）→ 为什么？这是**计算复杂性理论**的问题 → 从**图灵机（Turing machine）** 与**可判定性（decidability）** 出发 → 定义 **P / NP / co-NP** → **多项式归约（polynomial-time reduction）** → **NP 完全（NP-complete）** 的形式化定义与两个经典归约证明（Hamilton → TSP、CLIQUE → VERTEX-COVER）。

---

## 0. 本章速览

| 概念 | 定义要点 |
|---|---|
| **P** | 存在**多项式时间算法**能**判定**的语言类 |
| **NP** | 存在**多项式时间验证算法**（带**证书 certificate**）的语言类；等价于「**非确定图灵机**多项式时间可解」 |
| **co-NP** | $\{L : \bar L \in \text{NP}\}$，即「**否定**答案能被多项式验证」的问题 |
| **NP-hard** | 所有 NP 问题都能多项式归约到它（不要求自身属于 NP） |
| **NP-complete** | ① 属于 NP；② 所有 NP 问题可多项式归约到它 |

**两个最经典的「易/难」对照**（课件开场）：

| 问题 | 难度 |
|---|---|
| **欧拉回路（Euler circuit）**：经过每条边恰好一次 | **易**（$O(E)$，判断连通 + 所有点度为偶） |
| **哈密顿回路（Hamilton cycle）**：经过每个顶点恰好一次 | **难**（NP-complete） |
| 单源**无权最短路**（unweighted shortest path） | **易**（BFS，$O(V+E)$） |
| 单源**无权最长路**（unweighted longest path） | **难**（NP-hard） |

> 「只差一个词」的两个问题，复杂度却是天壤之别 —— 这就是 NP 完全性理论要解释的现象。

**术语对照**

| 中文 | English | 中文 | English |
|---|---|---|---|
| 可判定性 | decidability | 停机问题 | halting problem |
| 图灵机 | Turing machine | 确定/非确定 | deterministic / nondeterministic |
| 多项式归约 | polynomial-time reduction | 归约函数 | reduction function |
| 证书 | certificate | 验证算法 | verification algorithm |
| 可满足性 | satisfiability (SAT) | 团 / 点覆盖 | clique / vertex cover |
| 旅行商问题 | traveling salesman problem (TSP) | 哈密顿回路 | Hamiltonian cycle |

---

## 1. 易与难：从可判定性说起

- **最简单的问题**：$O(N)$ —— 因为至少要读一遍输入。
- **最困难的问题**：**不可判定问题（undecidable problems）**。

**历史背景**：
- **Hilbert（1900，国际数学家大会）** 提出 23 个问题，其中一个是 **Decidability（可判定性）**：是否**原则上**存在某种确定的方法/过程，能判定**所有**数学问题？
- **Gödel（1931）** 证明：**并非所有从公理系统推出的真命题都能被证明** —— 我们永远无法知道一切、证明一切。
- **Turing（1936）** 用图灵机给出「可计算」的精确模型，并证明停机问题不可判定。

![图 10-1 易与难：从 O(N) 到不可判定问题；Hilbert 的可判定性问题与 Gödel 不完备定理](ADS/pictures/Chapter%2010%20NP%E5%AE%8C%E5%85%A8%E6%80%A7%20AI%E7%B2%BE%E8%AE%B2/fig01_slide03.webp)

### 1.1 停机问题（Halting Problem）

**问题**：能否写出一个程序，检测**所有**死循环？（你的 C 编译器能做到吗？）
**答案**：**不能**。

**证明（对角线法 / 自指）**：假设存在这样的检测程序，则可写出：

```c
Loop( P )
{
/* 1 */ if ( P(P) loops )  print("YES");
/* 2 */ else                infinite_loop();
}
```

**把 `Loop` 作用于自身 `Loop(Loop)`**：
- 若 `Loop(Loop)` **终止** → 说明第 2 行执行了 → 说明 `Loop(Loop)` **死循环**，矛盾；
- 若 `Loop(Loop)` **死循环** → 说明第 1 行为真 → 打印 YES 后**终止**，矛盾。

$$\boxed{\text{无解（impossible to tell）}}$$

![图 10-2 停机问题的自指证明：Loop(Loop) 无论终止还是死循环都导致矛盾](ADS/pictures/Chapter%2010%20NP%E5%AE%8C%E5%85%A8%E6%80%A7%20AI%E7%B2%BE%E8%AE%B2/fig02_slide04.webp)

---

## 2. 图灵机（Turing Machine）

**Alan Turing（1912–1954）**，计算机科学之父。图灵机的目标是：**模拟数学家按某种算术方法所能做的一切计算**（假设他有无限的时间、精力、纸笔，并完全投入）。

**组成部件**：
1. **无限的一维纸带（infinite 1-dimensional tape）**，划分成单元 —— **数据存储（DATA storage）**；
2. **有限状态控制器（finite state controller）** —— **指令存储（INSTRUCTION storage）**，根据当前状态与读到的符号控制读写头动作；
3. **读写头（head / scanner）**：每个时刻只能指向**一个**单元，且每次最多左/右移动**一格**。

**三种操作**：
1. **改变有限控制状态**（change the finite control state）；
2. **擦除**当前指向单元的符号并**写入新符号**；
3. 读写头**左移（L）/ 右移（R）/ 不动（S）**。

![图 10-3 图灵机的组成：无限纸带 + 读写头 + 有限状态控制器](ADS/pictures/Chapter%2010%20NP%E5%AE%8C%E5%85%A8%E6%80%A7%20AI%E7%B2%BE%E8%AE%B2/fig03_slide06.webp)

**两种图灵机**：

| | 确定型图灵机（DTM） | 非确定型图灵机（NTM） |
|---|---|---|
| 每一步 | 执行**一条**指令，转移到**唯一**的下一条指令 | 从**有限集合**中**自由选择**下一步 |
| 接受条件 | 走到接受状态 | **只要有一条选择路径通向解，就认为它总能选对** |

> **NTM 是「理论上的猜测机器」**：它不是随机，而是**完全幸运（angelic nondeterminism）**。NP 的「N」就来自 **Nondeterministic**。

**注意**：不可判定问题**在 NTM 下仍然不可判定**（NTM 不能解决停机问题）。

**NP 的直观定义**：
> **一个问题属于 NP，当且仅当「任意一个给定解」都能在多项式时间内被验证为真。**

**【例】Hamilton 回路问题**：给定图与一条回路，**验证**它是否经过所有顶点且为简单回路 —— $O(V)$，多项式。所以 Hamilton ∈ NP。

**注意（易错）**：**不是所有可判定问题都在 NP 里**。例如「判断一个图**不存在** Hamilton 回路」—— 这个问题的「是」答案需要一个**不存在性证明**，无法用「给一条回路然后验证」的方式在多项式时间内确认。它属于 **co-NP**（若 P ≠ NP，则不属于 NP）。

---

## 3. NP 完全问题（NP-Complete Problems）—— 最硬的一类

**【性质】** 一个问题 $L$ 是 NP 完全的，是指：**NP 中的任何问题都可以多项式归约到它**。

**【推论】** 如果能**多项式时间**解决**任意一个** NP 完全问题，那么就能**多项式时间解决 NP 中的全部问题** —— 即 **P = NP**。

### 3.1 多项式归约（polynomial-time reduction）

给定问题 $A$ 的任意实例 $\alpha$，若存在程序 $R(\alpha)\to\beta$（属于问题 $B$），满足：
- $T_R(N)=O(N^{k_1})$（**多项式时间可计算**）；
- 存在程序 $D(\beta)$ 在 $O(N^{k_2})$ 内给出答案；
- 且 **$\beta$ 的答案与 $\alpha$ 的答案相同**；

则 $A$ 可多项式归约到 $B$，记作 $A \le_P B$，总时间 $O(N^{k})$。这就是「**$A$ 不比 $B$ 难（no harder than）**」。

$$A \le_P B,\ B \in P \ \Longrightarrow\ A \in P$$

（逆否：$A$ 难 ⟹ $B$ 难 —— 这正是**证明某问题 NP 完全**的标准套路：**把已知的 NP 完全问题归约到它**。）

![图 10-4 多项式归约：α --R--> β --D--> 答案，且 β 的答案必须与 α 相同](ADS/pictures/Chapter%2010%20NP%E5%AE%8C%E5%85%A8%E6%80%A7%20AI%E7%B2%BE%E8%AE%B2/fig07_slide08.webp)

**为什么讨论「判定问题（decision problem）」？**
> 判定问题**更容易** —— 只需回答 yes / no。而**优化问题可以关联到某个判定问题**。

**【例】** SHORTEST-PATH（优化：求最短路径）↔ PATH（判定：给定 $k$，是否存在**至多 $k$ 条边**的路径？）。若能判定 PATH，用二分/倍增即可求最短路径长度。

### 3.2 第一个 NP 完全问题：SAT / Circuit-SAT

- **可满足性（Satisfiability, SAT）**：输入一个布尔表达式，问是否存在变量赋值使表达式为 1。
- **Cook（1971）** 证明：**NP 中的所有问题都能多项式变换到 SAT**。证明方法是：**在非确定型图灵机上用多项式时间求解该问题**，并把「NTM 的计算过程」编码成一个布尔公式。

> 所以 SAT（以及 Circuit-SAT）是**第一个**被证明 NP 完全的问题，它是整个 NP 完全性大厦的**基石**。后续所有 NP 完全性证明都从它（或它的某个后代）出发。

### 3.3 例 1：由 Hamilton 回路证明 TSP 是 NP 完全

- **TSP（判定版）**：给定**完全图** $G=(V,E)$、边代价与整数 $K$，是否存在一条**经过所有顶点**的简单回路，总代价 $\le K$？
- **Hamilton 回路**：给定图 $G=(V,E)$，是否存在经过所有顶点的简单回路？

**证明**：

**① TSP ∈ NP**：给定一条回路，可在多项式时间内验证「是否经过所有顶点」且「总代价 $\le K$」。

**② Hamilton $\le_P$ TSP**：
- 对原图 $G$ 构造**完全图** $G'$：若 $(u,v)\in E$，令 $w(u,v)=1$；否则 $w(u,v)=2$；
- 取 $K=|V|$。

**正确性**：

$$G \text{ 有 Hamilton 回路} \iff G' \text{ 有总权重为 } |V| \text{ 的 TSP 巡回}$$

- (⟹) Hamilton 回路在 $G'$ 中全由权重 1 的边组成 → 总权重 $=|V|$；
- (⟸) 总权重 $=|V|$ 的巡回必须走 $|V|$ 条边、每条权重都是 1 → 每条边都在 $G$ 中 → 就是 $G$ 的 Hamilton 回路。

**③ 因此 TSP 是 NP 完全的。** ∎

> **注意归约方向**：是 **Hamilton ≤P TSP**（把已知难的归约到待证的），不是反过来。写反是最常见的失分点。

![图 10-5 Hamilton → TSP 归约：原边重 1、非边重 2，取 K=|V|](ADS/pictures/Chapter%2010%20NP%E5%AE%8C%E5%85%A8%E6%80%A7%20AI%E7%B2%BE%E8%AE%B2/fig04_slide09.webp)

---

## 4. 形式语言框架（Formal-Language Framework）

### 4.1 抽象问题（abstract problem）

**【定义】** 抽象问题 $Q$ 是**实例集 $I$** 与**解集 $S$** 上的一个**二元关系**。

**【例】** SHORTEST-PATH：

$$I = \{\langle G,u,v\rangle : G=(V,E) \text{ 是无向图};\ u,v\in V\}$$

$$S = \{\langle u,w_1,w_2,\dots,w_k,v\rangle : \langle u,w_1\rangle,\dots,\langle w_k,v\rangle \in E\}$$

对每个 $i\in I$，$\text{SHORTEST-PATH}(i)=s\in S$。

**判定问题 PATH**：

$$I = \{\langle G,u,v,k\rangle : \dots,\ k\ge 0 \text{ 为整数}\},\qquad S=\{0,1\}$$

### 4.2 编码（encodings）

把 $I$ **映射为二进制串** $\{0,1\}^*$，$Q$ 就成为**具体问题（concrete problem）**。

> **关键点**：复杂度是**关于编码长度**的函数。同一个问题用**十进制**还是**二进制**编码，输入的「规模」相差常数倍 —— 多项式意义下不变，但对「伪多项式（pseudo-polynomial）」算法有影响（如背包）。

### 4.3 形式语言理论

| 概念 | 定义 |
|---|---|
| 字母表 $\Sigma$ | 有限符号集 |
| 语言 $L$ | $\Sigma$ 上字符串的任意集合 |
| 空串 $\varepsilon$ | 长度为 0 的串 |
| 空语言 $\varnothing$ | 不含任何串 |
| $\Sigma^*$ | $\Sigma$ 上所有串的集合 |
| 补语言 | $\Sigma^* - L$ |
| 连接（concatenation） | $L=\{x_1x_2 : x_1\in L_1,\ x_2\in L_2\}$ |
| Kleene 星闭包 | $L^*=\{\varepsilon\}\cup L\cup L^2\cup L^3\cup\cdots$ |

**判定问题 ⟹ 语言**（取 $\Sigma=\{0,1\}$）：

$$L=\{x\in\Sigma^* : Q(x)=1\}$$

### 4.4 接受、拒绝与判定

- 算法 $A$ **接受（accepts）** $x$ ⟺ $A(x)=1$；
- 算法 $A$ **拒绝（rejects）** $x$ ⟺ $A(x)=0$；
- 语言 $L$ 被 $A$ **判定（decided）** ⟺ $L$ 中每个串都被接受、**且** $\{0,1\}^*\setminus L$ 中每个串都被拒绝。

> **接受 vs 判定的区别**：要「接受」一个语言，只需管 $L$ 里的串（可以不终止）；要「**判定**」一个语言，必须对**所有**串都正确接受或拒绝（必须终止）。

$$\boxed{P=\{\,L\subseteq\{0,1\}^* : \text{存在多项式时间算法 } A \text{ 判定 } L\,\}}$$

### 4.5 NP 的「验证」定义

**【定义】** **验证算法（verification algorithm）** 是**双参数**算法 $A(x,y)$：$x$ 是普通输入串，$y$ 是二进制串，称为**证书（certificate）**。
- $A$ **验证** $x$ ⟺ 存在证书 $y$ 使 $A(x,y)=1$；
- $A$ 验证的语言：$L=\{x\in\{0,1\}^* : \exists y\in\{0,1\}^*,\ A(x,y)=1\}$。

**【例】SAT 的证书**：一组变量赋值（长度 $O(|x|)$，多项式），验证只需代入求值 → 多项式。

**【形式化定义】**

$$L\in NP \iff \exists \text{ 多项式时间双参数算法 } A,\ \exists \text{ 常数 } c,\ L=\{\,x : \exists y,\ |y|=O(|x|^c),\ A(x,y)=1\,\}$$

即 **「证书长度多项式 + 验证多项式」**。

### 4.6 co-NP 与四种可能的世界

$$\text{co-NP} = \{\,L : \bar L \in NP\,\}$$

即「**否定答案**能被多项式验证」的问题（例：判断图**不存在** Hamilton 回路 —— 证书会是什么？这正是 co-NP 的困难所在）。

**四种可能的关系**（课件图）：

1. **P = NP = co-NP**（最「乐观」：一切都在 P 中）
2. **NP = co-NP**，但 P ≠ NP
3. **P = NP ∩ co-NP**，且 NP ≠ co-NP（**目前最主流的猜测**：与 1、2 并列的经典图示）
4. 其他（NP 与 co-NP 的关系更复杂）

**已知事实**：$P \subseteq NP$ 且 $P \subseteq \text{co-NP}$；若存在**某个** NP 完全问题属于 co-NP，则 **NP = co-NP**（这被普遍认为不成立，因为那将导致多项式层级坍塌）。

![图 10-6 P、NP、co-NP 的四种可能关系](ADS/pictures/Chapter%2010%20NP%E5%AE%8C%E5%85%A8%E6%80%A7%20AI%E7%B2%BE%E8%AE%B2/fig05_slide15.webp)

### 4.7 NP 完全的形式化定义

**【定义】** 语言 $L_1$ **多项式时间可归约**到 $L_2$（记 $L_1\le_P L_2$），若存在**多项式时间可计算函数** $f:\{0,1\}^*\to\{0,1\}^*$，使得对**所有** $x\in\{0,1\}^*$：

$$x\in L_1 \iff f(x)\in L_2$$

称 $f$ 为**归约函数（reduction function）**，计算 $f$ 的多项式算法 $F$ 为**归约算法（reduction algorithm）**。

**【定义】** 语言 $L\subseteq\{0,1\}^*$ 是 **NP 完全（NP-complete）** 的，若：
1. $L\in NP$；**且**
2. 对**每个** $L'\in NP$，都有 $L'\le_P L$。

> **两条缺一不可**：只满足 ② 而不知是否属于 NP 的，称为 **NP-hard**（如 TSP 的优化版、停机问题）。

---

## 5. 例 2：由 CLIQUE 证明 VERTEX-COVER 是 NP 完全

- **点覆盖（vertex cover）**：给定无向图 $G=(V,E)$ 与整数 $K$，是否存在 $V'\subseteq V$，$|V'|\le K$，使**每条边至少有一个端点在 $V'$ 中**？
- **团（clique）**：给定 $G=(V,E)$ 与 $K$，是否存在**至少 $K$ 个顶点**的**完全子图**？

$$\text{CLIQUE}=\{\langle G,K\rangle : G \text{ 有大小为 } K \text{ 的团}\}$$

$$\text{VERTEX-COVER}=\{\langle G,K\rangle : G \text{ 有大小为 } K \text{ 的点覆盖}\}$$

**证明：**

**① VERTEX-COVER ∈ NP**
给定 $x=\langle G,K\rangle$，取 $V'\subseteq V$ 作为**证书** $y$。验证算法：
- 检查 $|V'|=K$；
- 检查对每条边 $(u,v)\in E$，是否 $u\in V'$ 或 $v\in V'$。
时间 $O(N^3)$（朴素）→ 多项式。（课件标 $O(N^3)$；用邻接表可做到 $O(V+E)$。）

**② CLIQUE $\le_P$ VERTEX-COVER**

**关键观察**：设 $\bar G$ 为 $G$ 的**补图**（$G$ 中没有的边在 $\bar G$ 中都有，反之亦然）。则

$$\boxed{G \text{ 有大小为 } K \text{ 的团} \iff \bar G \text{ 有大小为 } |V|-K \text{ 的点覆盖}}$$

**证明（⟹）**：设 $V'$ 是 $G$ 中大小为 $K$ 的团。对 $\bar G$ 的任意边 $(u,v)$（即 $G$ 中 $u,v$ **不相邻**），$u,v$ 不可能同时属于团 $V'$ → 至少一个属于 $V-V'$ → $V-V'$ 覆盖了 $\bar G$ 的所有边，且 $|V-V'|=|V|-K$。

**证明（⟸）**：设 $V'$ 是 $\bar G$ 中大小为 $|V|-K$ 的点覆盖。则对任意 $u,v\in V$：

$$\text{若 } u\notin V' \text{ 且 } v\notin V' \Rightarrow (u,v)\notin E(\bar G) \Rightarrow (u,v)\in E(G)$$

即 $V-V'$ 中任意两点在 $G$ 中相邻 → $V-V'$ 是 $G$ 的**大小为 $K$ 的团**。

**③ 归约代价**：构造补图 $O(N^2)$（$N=|V|$），是多项式。因此 VERTEX-COVER 是 NP 完全的。∎

![图 10-7 CLIQUE → VERTEX-COVER：G 中 K-团 ⟺ 补图中 |V|−K 点覆盖](ADS/pictures/Chapter%2010%20NP%E5%AE%8C%E5%85%A8%E6%80%A7%20AI%E7%B2%BE%E8%AE%B2/fig06_slide18.webp)

> **归约链（经典）**：`SAT → 3-SAT → CLIQUE → VERTEX-COVER → SET-COVER`，`3-SAT → HAMILTON → TSP`。要证明某个新问题 NP 完全，只需接在这条链上（**传递性**：$\le_P$ 是传递关系）。

---

## 6. 证明 NP 完全的「三步法」（考试模板）

1. **证 $L\in NP$**：给出**证书**（通常就是「解本身」），并说明验证算法是多项式的；
2. **选一个已知的 NP 完全问题 $L'$**（SAT / 3-SAT / CLIQUE / HAMILTON / TSP / VERTEX-COVER…）；
3. **构造归约 $L'\le_P L$**：
   - 描述从 $L'$ 实例到 $L$ 实例的**构造方法**；
   - 证明它是**多项式时间**可计算的；
   - **双向证明正确性**（$x\in L'\iff f(x)\in L$）——两个方向都要写！

---

## 7. 易错点与考点清单

1. **Euler 回路易、Hamilton 回路难**；**无权最短路易、无权最长路难** —— 「差一个词」的经典对照。
2. **停机问题不可判定**（自指/对角线证明）；**NTM 也不能解决不可判定问题**。
3. **NP 的定义是「验证」而非「求解」**：$L\in NP$ ⟺ 存在多项式验证算法 + 多项式长度证书。
4. **「不存在 Hamilton 回路」不在 NP**（在 co-NP）——「NP 包含所有可判定问题」是**错的**。
5. **归约方向**：要证 $B$ 是 NP 完全，必须把已知 NP 完好的问题 $A$ **归约到 $B$**（$A\le_P B$），写成 $B\le_P A$ 就全错。
6. **NP-complete 需两个条件**：属于 NP + NP-hard；只说「最难」不够。
7. **决策问题 vs 优化问题**：NP 完全性通常对**判定版**陈述；优化版往往是 NP-hard（如 TSP 求最小代价）。
8. **$K$ 的取法**：Hamilton→TSP 取 $K=|V|$（全 1 边）；CLIQUE→VERTEX-COVER 取 $|V|-K$ 且要用**补图**。
9. **验证复杂度**：$O(N^3)$ 仍是多项式（$N$ 为输入规模），不必追求线性。
10. **P vs NP 仍是开放问题**（千禧年大奖难题之一）；目前所有证据倾向于 P ≠ NP。

---

## 8. 参考

- Cormen et al., *Introduction to Algorithms* (3rd ed.)：**Ch.34**（NP-Completeness）p.1048–1105，The MIT Press, 2009。
- S. A. Cook, *The Complexity of Theorem-Proving Procedures*, STOC 1971（SAT 的 NP 完全性）。
- 图灵机与图灵生平：`http://www.turing.org.uk`。
