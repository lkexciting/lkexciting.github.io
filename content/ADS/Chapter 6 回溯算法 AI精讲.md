---
title: Chapter 6 回溯算法 · AI 精讲
aliases:
  - ADS/notes/Chapter 6 回溯算法 AI精讲
---
# Chapter 6 回溯算法（Backtracking）

> **课件来源**：`ADS06Backtracking_Stu.ppt`（19 页）
> **本章主线**：暴力枚举「列出所有候选答案并逐个检验」在候选太多时不可行 → **回溯（backtracking）** 用「**部分解（partial solution）+ 剪枝（pruning）**」系统性地跳过大量候选，且**只要运行到终止就保证找到答案** → 用**博弈树（game tree）+ DFS** 实现 → 最后推广到**极小极大（Minimax）**与 **$\alpha$-$\beta$ 剪枝（alpha-beta pruning）**，这正是 AlphaGo 一类博弈程序的基础。

---

## 0. 本章速览

| 要素 | 说明 |
|---|---|
| 解空间（solution space） | 所有候选解的集合，通常是一棵**隐式树**（game tree / state space tree） |
| 部分解 | $(x_1, \dots, x_i)$，$x_k \in S_k$ |
| 剪枝（pruning） | 用**约束函数（constraint / bounding function）**判断部分解是否值得扩展 |
| 搜索方式 | **深度优先搜索（DFS）**，即后序遍历博弈树 |
| 典型问题 | 八皇后、四皇后、Turnpike 重构、井字棋（Tic-tac-toe） |
| 复杂度 | **无法用 $N$ 简单刻画**（取决于剪枝掉的结点数），这是回溯分析的最大困难 |

**术语对照**

| 中文 | English | 中文 | English |
|---|---|---|---|
| 回溯 | backtracking | 剪枝 | pruning |
| 部分解 | partial solution | 解空间 | solution space |
| 博弈树 / 状态空间树 | game tree / state space tree | 约束 | constraint |
| 深度优先搜索 | depth-first search (DFS) | 撤销 | undo / restore |
| 估值函数 | evaluation function | 极小极大 | minimax |
| $\alpha$-$\beta$ 剪枝 | alpha-beta pruning | 井字棋 | tic-tac-toe |

---

## 1. 基本思想

### 1.1 为什么需要回溯

> 一个「万无一失（sure-fire）」的找答案方法是：**列出所有候选答案（all candidate answers），逐个检查（examine each），在检查完所有或部分候选之后宣布答案**。

前提条件（课件强调的三点）：
1. 候选集合**有限**；
2. 检查后**能够判定**答案；
3. **候选不能太多**（not too many candidates）。

**回溯的作用**：在**仍然保证找到答案**的前提下，**避免显式检查大量候选子集**（eliminate the explicit examination of a large subset of the candidates）。

### 1.2 核心机制

假设已有部分解 $(x_1, \dots, x_i)$，其中 $x_k \in S_k$（$1 \le k \le i < n$）：

1. 加入下一个候选 $x_{i+1} \in S_{i+1}$；
2. **检查** $(x_1, \dots, x_i, x_{i+1})$ 是否满足约束（constraints）；
3. 若「是」→ 继续加入下一个 $x$；
4. 若「否」→ **删除 $x_{i+1}$，回溯（backtrack）到前一个部分解** $(x_1,\dots,x_i)$，换下一个候选。

**关键点**：剪枝发生在**部分解**层面 —— 不必等到「解完整」才发现它不合法。这就是「**剪掉整棵子树**」的来源。

---

## 2. 八皇后问题（Eight Queens）

**问题**：在 $8\times 8$ 棋盘上放 8 个皇后，使任意两个都不互相攻击。
**攻击（attack）的定义**：两个皇后在**同一行、同一列、同一对角线或反对角线（antidiagonal）**上。

**建模**：
- $Q_i$ := 第 $i$ 行的皇后；$x_i$ := 该皇后所在的列号；
- 解 = $(x_1, x_2, \dots, x_8)$，例如课件给的 $(4,6,8,2,7,1,3,5)$。

**约束（逐步收紧解空间）**：

| 约束 | 含义 | 候选数 |
|---|---|---|
| $S_i = \{1,2,\dots,8\}$ | 每行皇后可在任意列 | $8^8$ 个候选 |
| $x_i \ne x_j$（$i\ne j$） | 不同列 | 解必是 $1..8$ 的**排列** → $8!$ |
| $\dfrac{x_i - x_j}{i - j} \ne \pm 1$ | 不在同一对角线（**斜率不为 ±1**） | 进一步剪枝 |

对 $n$ 皇后问题，解空间候选数为 $n!$（仅考虑列约束后）。$8! = 40320$，但**真正搜索的结点数远小于此** —— 因为对角线约束在部分解阶段就能剪枝。

![图 6-1 八皇后建模：xi 为第 i 行皇后的列号；约束 xi≠xj 与 (xi−xj)/(i−j)≠±1](ADS/pictures/Chapter%206%20%E5%9B%9E%E6%BA%AF%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig01_slide04.webp)

---

## 3. 四皇后：博弈树 + DFS 的完整演示

课件用**四皇后**（$4\times4$，$4!=24$ 个候选）做演示：

**Step 1：构造博弈树（construct a game tree）**
- 根：空；
- 第 1 层：$x_1 \in \{1,2,3,4\}$；
- 第 2 层：$x_2 \in \{1,2,3,4\}\setminus\{x_1\}$；
- …
- 每条**从根到叶的路径**定义一个候选解（an element of the solution space）。

![图 6-2 四皇后的完整博弈树：每个叶子是一个候选解（共 24 条路径）](ADS/pictures/Chapter%206%20%E5%9B%9E%E6%BA%AF%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig02_slide05.webp)

**Step 2：用 DFS（后序遍历）检查路径，边下边剪枝**

- $x_1=1$ → $x_2=2$（同对角线，**剪枝**）→ $x_2=3$（剪枝）→ $x_2=4$（剪枝）→ **回溯**；
- $x_1=2$ → $x_2=4$ → $x_3=1$ → $x_4=3$ ✓ **找到解 $(2,4,1,3)$**；
- （$x_1=3$、$x_1=4$ 的分支亦对称，四皇后共 2 个本质解、$2\times4=8$ 个解含旋转反射。）

**注意（重要）**：**博弈树实际上并不构造出来**（No tree is actually constructed. The game tree is just an abstract concept）—— 它是**概念模型**，程序只沿着当前路径递归，回溯时撤销（undo）。这是回溯能「省空间」的原因：空间 $O(\text{深度})$，而非 $O(\text{结点数})$。

![图 6-3 DFS + 剪枝找到解 (2,4,1,3)，大量子树被剪掉（灰色）](ADS/pictures/Chapter%206%20%E5%9B%9E%E6%BA%AF%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig03_slide06.webp)

**另一种等价建模**：用一维数组 `col[row]` + 三个布尔数组 `col[], diag1[row+col], diag2[row-col+n-1]` 做 $O(1)$ 冲突检测，是八皇后最经典的实现（LeetCode 51/52 的标准解法）。

---

## 4. Turnpike 重构问题（Turnpike Reconstruction Problem）

**问题**：数轴上有 $N$ 个点 $x_1 < x_2 < \dots < x_N$，设 $x_1 = 0$。任意两点间共 $\dfrac{N(N-1)}{2}$ 个距离。**给定这组距离，重构点集**。

**【例】** $D = \{1,2,2,2,3,3,3,4,5,5,5,6,7,8,10\}$

**Step 1**：$N(N-1)/2 = 15 \Rightarrow N(N-1)=30 \Rightarrow N = 6$。

**Step 2**：最大距离 $D_{\max}=10$ 必是 $x_6 - x_1$；取 $x_1=0$，则 $x_6=10$。

**Step 3**：**每次取当前最大距离 $D_{\max}$，它只能来自两种可能**：
- **方案 1**：$x_{\text{right}} = D_{\max}$（放在右端）；
- **方案 2**：$x_{\text{left}} = x_N - D_{\max}$（放在左端）。

对每种方案，**检验可行性（pruning）**：新点到所有已确定点的距离必须都**在 $D$ 中**；然后把用掉的距离从 $D$ 中删除，递归；失败则**恢复（undo）**删除过的距离。

课件示例的搜索过程：
- $D_{\max}=10$ → 试 $x_6=10$（必然成立）；
- 下一个 $D_{\max}=8$ → 试 $x_2=8$（×，因为 $8$ 与已确定的距离冲突）→ 试 $x_5=8-0=2$？实际过程为：$x_4=6$、$x_3=4$、$x_2=2$ 等分支依次尝试；
- 最终解：$\boxed{(0,3,5,6,8,10)}$（对应距离多重集恰为 $D$）。

![图 6-4 Turnpike 重构：每次取最大距离，只有「放最右」或「放最左」两种选择](ADS/pictures/Chapter%206%20%E5%9B%9E%E6%BA%AF%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig04_slide07.webp)

### 4.1 参考实现（课件代码骨架）

```c
bool Reconstruct( DistType X[ ], DistSet D, int N, int left, int right )
{   /* X[1]...X[left-1] 和 X[right+1]...X[N] 已确定 */
    bool Found = false;
    if ( Is_Empty( D ) )  return true;              /* 已解出 */
    D_max = Find_Max( D );

    /* 方案 1：X[right] = D_max */
    OK = Check( D_max, N, left, right );            /* 剪枝：检验与已确定点的距离是否都在 D 中 */
    if ( OK ) {
        X[right] = D_max;
        for ( i=1; i<left; i++ )   Delete( |X[right]-X[i]|, D );
        for ( i=right+1; i<=N; i++ ) Delete( |X[right]-X[i]|, D );
        Found = Reconstruct( X, D, N, left, right-1 );
        if ( !Found ) {                             /* 失败则撤销 */
            for ( i=1; i<left; i++ )   Insert( |X[right]-X[i]|, D );
            for ( i=right+1; i<=N; i++ ) Insert( |X[right]-X[i]|, D );
        }
    }

    if ( !Found ) {                                 /* 方案 2：X[left] = X[N] - D_max */
        OK = Check( X[N]-D_max, N, left, right );
        if ( OK ) {
            X[left] = X[N] - D_max;
            /* …… 同样的 Delete / Reconstruct / Insert 撤销 …… */
            Found = Reconstruct( X, D, N, left+1, right );
        }
    }
    return Found;
}
```

> **这就是回溯的「三段式」**：`Check`（剪枝）→ 修改状态并递归 → 失败则 `Undo`（恢复状态）。**状态恢复的正确性是回溯最容易出 bug 的地方。**

---

## 5. 通用模板与效率

### 5.1 模板

```c
bool Backtracking( int i )
{
    Found = false;
    if ( i > N )
        return true;                        /* 已得到 (x1, …, xN) */
    for ( each xi ∈ Si ) {
        OK = Check( (x1, …, xi), R );        /* 剪枝：约束检测 */
        if ( OK ) {
            Count xi in;                    /* 记录 xi */
            Found = Backtracking( i+1 );    /* 递归 */
            if ( !Found )
                Undo( i );                  /* 恢复为 (x1, …, xi-1) */
        }
        if ( Found )  break;                /* 找到一个解即返回（求全部解则去掉） */
    }
    return Found;
}
```

**结构对照**：`DFS + 剪枝 + 状态恢复` ≡ 在**隐式图上的深度优先搜索**。

### 5.2 效率取决于什么

课件 Note（本章最关键的一句）：

> 回溯的效率跟 **$S$ 的规模**、**约束函数的复杂性**、**满足约束条件的结点数** 相关。约束函数决定了剪枝的效率，但是如果函数本身太复杂也未必合算。满足约束条件的结点数最难估计，使得**复杂度分析很难完成**。

三点解读：
1. **$|S_i|$ 越小**，分支因子越小；
2. **约束函数越强**，剪掉越多，但**每次检测的开销**也越大 —— 存在 trade-off；
3. 「满足约束的结点数」决定了实际搜索规模，而它**依赖具体输入**，所以回溯算法通常**只能给出最坏界（如 $O(n!)$）**，平均行为难以刻画。

### 5.3 一个重要的启发式：**先试小的 $S_i$**

> **When different $S_i$'s have different sizes → Smaller $S_i$ first.**

**理由**：分支因子小的变量先定，能更快触发剪枝、减少下层搜索树的宽度（这是 CSP 中 **MRV, minimum remaining values** 启发式的雏形）。例如数独 / 图着色中，先处理「可选值最少」的格子/顶点。

---

## 6. 博弈：从井字棋到 AlphaGo

### 6.1 井字棋（Tic-tac-toe）

规则：三子连成横、竖、对角线者胜（又称 noughts and crosses / Xs and Os）。

**规模**：
- 棋盘布局（board layouts）共 $3^9 = 19{,}683$ 种（每格 X / O / 空）；
- 不同的**对局序列（games）**共 $9! = 362{,}880$ 种。

对计算机来说状态空间很小，**可以完全搜索（exhaustive search）**，因此井字棋是**已解游戏（solved game）**：双方最优策略下必为平局。

![图 6-5 井字棋：3^9 = 19683 种布局，9! = 362880 种对局序列](ADS/pictures/Chapter%206%20%E5%9B%9E%E6%BA%AF%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig05_slide13.webp)

### 6.2 极小极大策略（Minimax Strategy）

- **人（human）** 想让局面值 $P$ **最小化**，**计算机** 想让 $P$ **最大化**；
- 用**估值函数（evaluation function）** 量化局面的「好坏」，例如

$$e(P) = \text{(计算机的潜在获胜线数)} - \text{(人的潜在获胜线数)}$$

**对于完全可搜索的游戏（如井字棋）**：叶子直接标 $+1$（计算机胜）/ $-1$（人胜）/ $0$（平局），然后自底向上：
- **MAX 层**取孩子最大值；
- **MIN 层**取孩子最小值。

![图 6-6 Minimax：把叶子赋 ±1/0，MAX 层取 max、MIN 层取 min，根值 = 1](ADS/pictures/Chapter%206%20%E5%9B%9E%E6%BA%AF%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig06_slide15.webp)

**复杂度**：$O(b^d)$（$b$ 分支因子，$d$ 深度）—— 井字棋 $b\le 9, d\le 9$ 可承受；国际象棋 $b\approx 35, d\approx 80$ 完全不可行，必须剪枝。

### 6.3 $\alpha$-$\beta$ 剪枝（alpha-beta pruning）

**记号**：
- $\alpha$ = MAX 结点当前的**最好下界**（已经找到的最大值）；
- $\beta$ = MIN 结点当前的**最好上界**（已经找到的最小值）。

**剪枝规则**：
- 在 MAX 结点，若某孩子的值 $\ge \beta$（父结点已能取得更小值）→ **剪掉（$\beta$ cutoff）**；
- 在 MIN 结点，若某孩子的值 $\le \alpha$（父结点已能取得更大值）→ **剪掉（$\alpha$ cutoff）**。

**课件示例**：
- **$\alpha$ 剪枝**：MAX 结点已得 44，第二个孩子的 MIN 子树中出现了 40，则 40 < 44 说明该 MIN 结点最多是 40，对 MAX 无意义 → 该 MIN 结点的**剩余分支全部剪掉**。
- **$\beta$ 剪枝**：MIN 结点已得 44，第二个孩子的 MAX 子树中出现了 68，则 68 > 44，该 MAX 结点至少 68，对 MIN 无意义 → 剪掉。

![图 6-7 α 剪枝：MAX 已得 44，MIN 子树出现 40 → 剩余分支剪掉](ADS/pictures/Chapter%206%20%E5%9B%9E%E6%BA%AF%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig07_slide16.webp)

![图 6-8 β 剪枝：MIN 已得 44，MAX 子树出现 68 → 剩余分支剪掉](ADS/pictures/Chapter%206%20%E5%9B%9E%E6%BA%AF%E7%AE%97%E6%B3%95%20AI%E7%B2%BE%E8%AE%B2/fig08_slide17.webp)

**效果**：$\alpha$-$\beta$ 剪枝**不改变根结点的值**（结果与完全 Minimax 相同），但**实践上把搜索量限制到约**

$$O\left(b^{d/2}\right) = O\left(\sqrt{N}\right),\qquad N = b^d \text{ 为完整博弈树的结点数}$$

即**同样时间可搜索两倍深度**（Thus allow us to go deeper）—— 这是所有棋类程序（深蓝、AlphaGo 的 MCTS 之前的传统引擎）的基础技术。

> **与 AlphaGo 的关系（课件标题「Games – how did AlphaGo win」）**：AlphaGo 用**蒙特卡洛树搜索（MCTS）** 取代完全 Minimax，用**策略网络（policy network）** 缩减分支因子 $b$、用**价值网络（value network）** 替代深搜替代估值，本质仍是「**在博弈树上做有选择的、带剪枝的搜索**」。回溯/DFS 是这棵树的骨架。

---

## 7. 易错点与考点清单

1. **回溯 = DFS + 剪枝 + 状态恢复**；三者的顺序与 `Undo` 的完整性是代码正确性的关键。
2. **博弈树是概念模型**，程序中并不显式构造 → **空间 $O(\text{递归深度})$**，不是 $O(\text{解空间大小})$。
3. 八皇后的三个约束：**不同列**（$x_i \ne x_j$）、**不同对角线**（$|x_i-x_j| \ne |i-j|$）；只考虑列约束时解空间为 $n!$。
4. **剪枝必须在部分解阶段进行**，否则等于暴力枚举；同时约束函数本身不能太贵（trade-off）。
5. **Turnpike** 的关键洞察：最大距离只能来自「最右点」或「最左点」→ 每层只有 2 个分支（$O(2^N)$ 而非 $N!$）。
6. **变量顺序影响巨大**：$|S_i|$ 小的先试（MRV 启发式）。
7. **回溯的复杂度通常无法精确分析**：取决于「满足约束的结点数」，只能给最坏界。
8. **Minimax 的根值不会因 $\alpha$-$\beta$ 剪枝而改变**，剪枝只省时间；最优排序下复杂度 $O(b^{d/2}) = O(\sqrt N)$。
9. $\alpha$ 在 **MAX** 层更新、$\beta$ 在 **MIN** 层更新；剪枝条件是「**MAX 遇 $\ge\beta$**」「**MIN 遇 $\le\alpha$**」，别记反。

---

## 8. 参考

- Weiss, *Data Structure and Algorithm Analysis in C* (2nd ed.)：**Ch.10**，p.403–414（Backtracking Algorithms）；M.A.Weiss 著、陈越改编，人民邮电出版社，2005。
- 课程 Project 2：*Safe Fruit*（把「不能同食的水果」建成冲突图，求最大独立集 —— 回溯 + 剪枝的经典应用），详见 `https://pintia.cn/`。
