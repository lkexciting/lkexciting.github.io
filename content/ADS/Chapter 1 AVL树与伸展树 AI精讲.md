---
title: Chapter 1 AVL树与伸展树 · AI 精讲
aliases:
  - ADS/notes/Chapter 1 AVL树与伸展树 AI精讲
---
# Chapter 1 AVL 树与伸展树（AVL Trees, Splay Trees & Amortized Analysis）

> **课件来源**：`ADS01AVL_Stu.ppt`（26 页）
> **本章主线**：二叉搜索树（Binary Search Tree, BST）的查找代价取决于树高 → 用「平衡」把树高压到 O(log N)（AVL 树）→ 用「摊还」把单次操作的最坏代价摊薄（Splay 树）→ 用三种摊还分析（Amortized Analysis）方法严格证明。

---

## 0. 本章速览

| 结构 | 单次查找最坏 | 摊还代价 | 插入旋转次数 | 删除旋转次数 | 是否需额外字段 |
|---|---|---|---|---|---|
| 普通 BST | O(N) | — | 0 | 0 | 否 |
| **AVL 树** | **O(log N)** | O(log N) | ≤ 2（至多一次单/双旋） | O(log N) | 平衡因子 BF 或高度 |
| **Splay 树** | O(N) | **O(log N)** | 1 次 splay | 1 次 splay | 否 |

**核心结论**：
1. AVL 树的高度满足 $h < 1.44\log(N+2)-0.328$，因此查找、插入、删除都是 $O(\log N)$。
2. Splay 树任何 $M$ 次连续操作总共 $O(M\log N)$，**单个操作仍可能是 $O(N)$**。
3. 摊还界（amortized bound）比最坏界（worst-case bound）弱、比平均界（average-case bound）强，且**不涉及概率假设**。

关键术语对照：

| 中文 | English | 中文 | English |
|---|---|---|---|
| 平衡因子 | balance factor (BF) | 单旋转 | single rotation |
| 高度平衡 | height balanced | 双旋转 | double rotation |
| 麻烦结点 | trouble maker | 麻烦发现者 | trouble finder |
| 伸展 | splay | 之字形 | zig-zag |
| 一字形 | zig-zig | 单转（把 X 提到根） | zig |
| 摊还分析 | amortized analysis | 聚合法 | aggregate analysis |
| 记账法 | accounting method | 势能法 | potential method |
| 信用/存款 | credit | 势函数 | potential function |
| 秩 | rank | 后代数 | number of descendants |

---

## 1. 为什么要平衡：BST 的痛点

**目标（Target）**：加速查找，同时支持插入与删除。
**工具（Tool）**：二叉搜索树（BST）——左小右大，查找时间 $T_p = O(h)$，$h$ 为树高。

**问题（Problem）**：$h$ 最坏可以到 $O(N)$。当关键字按有序顺序插入时，BST 退化成一条链（skew tree）。

课件给的经典例子：把 12 个月份按 Jan→Dec 的顺序插入，得到两棵树：

| 树的形态 | 平均查找长度（成功查找） |
|---|---|
| 平衡的那棵（Mar 为根） | **3.1** |
| 按输入顺序形成的普通 BST | 3.5 |
| 完全退化的斜树（skew tree） | **6.5** |

![图 1-1 同一组关键字、不同插入顺序得到的两棵 BST，平均查找时间差别显著](ADS/pictures/Chapter%201%20AVL%E6%A0%91%E4%B8%8E%E4%BC%B8%E5%B1%95%E6%A0%91%20AI%E7%B2%BE%E8%AE%B2/fig01_slide03.webp)

> **要点**：BST 的形状由插入顺序决定，而查找代价只由形状决定。所以要让形状「自动保持矮胖」——这就是平衡树（balanced tree）的出发点。

---

## 2. AVL 树的定义

由 Adelson-Velskii 与 Landis 于 1962 年提出，故称 **AVL 树**。

**【定义 1】高度平衡（height balanced）**
空二叉树是高度平衡的。若非空二叉树 $T$ 的左右子树为 $T_L, T_R$，则 $T$ 高度平衡当且仅当：
1. $T_L$ 与 $T_R$ 都高度平衡；
2. $|h_L - h_R| \le 1$，其中 $h_L, h_R$ 分别为左右子树的高度。

**【定义 2】平衡因子（balance factor, BF）**

$$\mathrm{BF}(\text{node}) = h_L - h_R$$

AVL 树中每个结点的 $\mathrm{BF} \in \{-1, 0, +1\}$。

**约定（易错）**：空树的高度定义为 $-1$，单结点树高度为 $0$。若按「空树高 0」的教材约定，则 BF 公式与斐波那契下界的形式会整体平移一位，做题时先确认约定。

![图 1-2 AVL 树定义与平衡因子标注（叶结点 BF=0，空树高 -1）](ADS/pictures/Chapter%201%20AVL%E6%A0%91%E4%B8%8E%E4%BC%B8%E5%B1%95%E6%A0%91%20AI%E7%B2%BE%E8%AE%B2/fig02_slide04.webp)

**性质**：AVL 树是「适度平衡」的 BST —— 它不要求完全平衡（complete/perfect），只要求任一结点的两子树高度差不超过 1，这样既保证 $O(\log N)$ 高度，又让维护代价很小。

---

## 3. 插入与四种旋转

### 3.1 插入流程

1. 按 BST 规则插入新结点（一定成为叶子）；
2. 沿插入路径**向上回溯**，更新各结点的 BF（或高度）；
3. 找到**第一个**（最深的）$|\mathrm{BF}| = 2$ 的结点 $A$ —— 称为「麻烦发现者」（trouble finder），新插入的结点称为「麻烦制造者」（trouble maker）；
4. 依据「麻烦制造者位于 $A$ 的哪一侧子树」选择旋转，把子树重新调平；
5. 旋转后该子树高度恢复到插入前的高度，**更上层的 BF 不再改变，可立即停止**。

因此 AVL 插入**最多一次旋转**（单旋或双旋），代价 $O(\log N)$（用于查找插入位置）。

### 3.2 四种不平衡形态

设 $A$ 为失衡结点，$B$ 为其较高的孩子：

| 形态 | 麻烦制造者的位置 | 修复方式 | 旋转次数 |
|---|---|---|---|
| **LL** | $A$ 的左孩子的左子树 | 右单旋（single rotation） | 1 |
| **RR** | $A$ 的右孩子的右子树 | 左单旋（single rotation） | 1 |
| **LR** | $A$ 的左孩子的右子树 | 先左旋后右旋（double rotation） | 2 |
| **RL** | $A$ 的右孩子的左子树 | 先右旋后左旋（double rotation） | 2 |

### 3.3 RR 型：单旋转（single rotation）

课件例子：依次插入 Mar, May, Nov。插入 Nov 后，Mar 的 BF 由 $-1$ 变 $-2$：

```
      Mar(-2)                May(0)
         \                  /     \
        May(-1)    →     Mar(0)   Nov(0)
            \
            Nov(0)
```

**判定口诀**：麻烦制造者 Nov 在麻烦发现者 Mar 的**右子树的右子树**里 → RR 旋转。

一般情形（$A$ 失衡，$B$ 是 $A$ 的右孩子，$B_R$ 长高）：

```
      A(-2)                     B(0)
     /   \                    /     \
   A_L    B(-1)     →      A(0)     B_R
         /   \            /   \
       B_L   B_R        A_L   B_L
```

旋转后 $A$ 与 $B$ 的 BF 都变 0，子树高度回到插入前。**注意 $A$ 不一定是整棵树的根**，旋转只影响以 $A$ 为根的子树，需把 $B$ 挂回 $A$ 原来的父结点。

![图 1-3 RR 型的单旋转：Mar-May-Nov 例子与一般情形](ADS/pictures/Chapter%201%20AVL%E6%A0%91%E4%B8%8E%E4%BC%B8%E5%B1%95%E6%A0%91%20AI%E7%B2%BE%E8%AE%B2/fig03_slide05.webp)

LL 型完全对称：$A$ 的左孩子 $B$ 的左子树长高，对 $A$ 做右单旋。

### 3.4 LR 型：双旋转（double rotation）

单旋转解决不了 LR/RL：因为把 $B$ 提上来后，另一侧仍然过高。此时麻烦制造者在「内侧」，必须旋转两次。

课件例子：在 Mar 为根、May 为左孩子的树上插入 Aug：

```
     Mar(2)                    Aug(0)
     /                        /     \
   May(1)        →         May(0)   Mar(0)
      \
      Aug(0)
```

更细的过程是先对 May 左旋、再对 Mar 右旋（"先转成 LL，再单旋"）。

一般情形：

```
        A(+2)                       C(0)
       /     \                     /     \
     B(-1)    A_R      →        B(0/1)   A(0/-1)
     /   \                       /   \    /   \
   B_L   C(±1)                 B_L  C_L  C_R  A_R
        /   \
      C_L   C_R
```

旋转后 $B$、$A$ 的新 BF 取决于 $C$ 原来的 BF（$C$ 的 BF 为 $0$ 时三者全为 0；为 $\pm1$ 时一个变 $\pm1$、另一个变 $0$）。**这是 AVL 最容易做错的地方：双旋转后必须按 $C$ 的原 BF 分情况赋值。**

![图 1-4 LR 型的双旋转：插入 Aug 后先左旋 May 再右旋 Mar](ADS/pictures/Chapter%201%20AVL%E6%A0%91%E4%B8%8E%E4%BC%B8%E5%B1%95%E6%A0%91%20AI%E7%B2%BE%E8%AE%B2/fig04_slide07.webp)

### 3.5 完整插入示例（12 个月份）

插入序列：Mar, May, Nov, Aug, Apr, Jan, Dec, July, Feb, June, Oct, Sept。课件逐页演示了每一次失衡与旋转（RR → LR → RL → …），最终得到一棵高度平衡的树。

**过程中要注意的两点（课件 Note）**：
1. 即使**不需要重建**（不旋转），路径上若干结点的 BF 也可能已经改变 —— 所以回溯更新不能省。
2. 除了存 BF，也可以直接为每个结点存一个**高度字段（height field）**，实现更简单但常数更大。

---

## 4. AVL 树的高度下界：为什么是 O(log N)

设 $n_h$ 为高度为 $h$ 的 AVL 树的**最少**结点数。为了让结点尽量少，根的两棵子树高度必须尽量不同又满足 AVL 条件 → 一棵高 $h-1$、一棵高 $h-2$：

$$n_h = n_{h-1} + n_{h-2} + 1,\qquad n_{-1}=0,\ n_0=1$$

这与斐波那契（Fibonacci）递推同形：

$$F_0 = 0,\quad F_1 = 1,\quad F_i = F_{i-1}+F_{i-2}\ (i>1)$$

$$\boxed{n_h = F_{h+2} - 1,\quad h \ge 0}$$

由斐波那契数理论 $F_h \approx \dfrac{\phi^{h}}{\sqrt{5}},\ \phi = \dfrac{1+\sqrt5}{2}\approx 1.618$，取对数得：

$$h = O(\log N),\qquad \text{更精确地}\quad h < 1.44\log(N+2)-0.328$$

即 AVL 树高最多比最优的完全二叉树高约 44%，仍是对数级。

![图 1-5 高度为 h 的 AVL 树最少结点数的构造：n_h = n_{h-1}+n_{h-2}+1](ADS/pictures/Chapter%201%20AVL%E6%A0%91%E4%B8%8E%E4%BC%B8%E5%B1%95%E6%A0%91%20AI%E7%B2%BE%E8%AE%B2/fig05_slide10.webp)

> **典型考题**：高度为 $h$ 的 AVL 树最少有多少结点？答 $F_{h+2}-1$（$h\ge0$，空树高 $-1$）。例如 $h=3$ 时 $n_3=F_5-1=5-1=4$ 个结点（形态：根 + 左子树高 2 的 2 结点链 + 右子树 1 结点）。

### 4.1 删除（Deletion）

删除比插入麻烦：
1. 按 BST 规则删除（用前驱/后继替换）；
2. 沿路径向上回溯，**每一层都可能失衡**，可能要做 $\Theta(\log N)$ 次旋转；
3. 但与插入不同，**一次删除后上层可能继续失衡**，不能提前停止。

复杂度仍是 $O(\log N)$，因为最多 $O(\log N)$ 层、每层 $O(1)$ 旋转。

---

## 5. 伸展树（Splay Tree）

### 5.1 出发点

**目标（Target）**：任意 $M$ 次**从空树开始**的连续操作，总时间 $O(M\log N)$ —— 即摊还时间 $O(\log N)$。

**这不是说每次操作都 $O(\log N)$**：单次操作仍可能 $O(N)$。但它的意义在于：
- 界虽然更弱，**效果却一样**：不存在「坏输入序列」；
- 如果你反复访问同一个深结点，第一次 $O(N)$ 之后它已经被移到根附近，后续访问都很快 —— **每次访问都会改变树形**，这正是它摊还便宜的原因。

**核心想法（Idea）**：一个结点被访问后，通过一系列类似 AVL 的旋转把它**推到根**（push to the root），这个操作叫 **splaying（伸展）**。

### 5.2 朴素做法为什么失败

如果只做「自底向上逐个单旋」，看似能把 $X$ 提到根，但课件给出反例：

```
        k5                     k5                    k4
       /  \                   /  \                  /  \
     k4    F      →        k1     F     →        k2    k5
     /  \                 /  \                  /  \     \
   k3    E               k2   k4               k1   k3     F
   /  \                 /    /  \                     \
 k2    D               k1   k3   E                     E ...
 /  \
k1   C
```
（沿路径一路单旋，深度并没有按预期下降，甚至把树弄得更糟。）

更糟的例子：按 $1,2,3,\dots,N$ 插入形成右斜链，再依次 Find 1, 2, …, N，总代价 $T(N)=O(N^2)$ —— 摊还退化成 $O(N)$。

**结论**：简单的「逐层单旋到根」不行，必须**成对（两层两层）地旋转**。

### 5.3 自底向上的三种情形（bottom-up splaying）

设非根结点 $X$，父结点 $P$，祖父结点 $G$：

| 情形 | 条件 | 操作 | 名称 |
|---|---|---|---|
| **Case 1** | $P$ 是根 | 旋转 $X$ 与 $P$（一次单旋） | **zig** |
| **Case 2** | $X$ 与 $P$ 是「异侧」（$X$ 是 $P$ 的右孩子而 $P$ 是 $G$ 的左孩子，或对称） | 先对 $P$ 旋、再对 $X$ 旋 → 等价于对 $G$ 做**双旋转** | **zig-zag** |
| **Case 3** | $X$ 与 $P$ 是「同侧」（都是左孩子或都是右孩子） | 先对 $G$ 旋（把 $P$ 提上来），再对 $P$ 旋（把 $X$ 提上来），**自顶向下**顺序 | **zig-zig** |

```
zig-zag（双旋转）:            zig-zig（两次单旋转，先 G 后 P）:
      G                              G                 X
     / \                            / \               / \
    P   D          X               P   D             P   G
   / \           /   \            / \        →      / \ / \
  A   X    →    P     G          X   C             A  B C  D
     / \       / \   / \        / \
    B   C     A   B C   D      A   B
```

**注意 zig-zig 的旋转顺序**：必须**先旋祖父 $G$、再旋父 $P$**（即从下往上「自顶向下」做两次单旋），不能先转 $X$ 到 $P$ 上面 —— 这正是与朴素做法（slowsplaying）的区别，也是摊还 $O(\log N)$ 的关键。

![图 1-6 三种情形：zig（P 为根）、zig-zag（双旋转）、zig-zig（单旋转）](ADS/pictures/Chapter%201%20AVL%E6%A0%91%E4%B8%8E%E4%BC%B8%E5%B1%95%E6%A0%91%20AI%E7%B2%BE%E8%AE%B2/fig06_slide14.webp)

**效果**：Splaying 不仅把被访问结点 $X$ 移到根，还会让路径上大多数结点的深度**大致减半**（roughly halves the depth）——这就是「自调整（self-adjusting）」的威力。

![图 1-7 一次 splay 之后，路径上多数结点的深度大约减半](ADS/pictures/Chapter%201%20AVL%E6%A0%91%E4%B8%8E%E4%BC%B8%E5%B1%95%E6%A0%91%20AI%E7%B2%BE%E8%AE%B2/fig07_slide15.webp)

### 5.4 插入与删除

**插入（Insert）**：按 BST 插入为新叶子，然后对新结点做一次 splay（等价于「访问它」）。
课件例子：Insert 1,2,3,4,5,6,7 后 Find 1，可看到树形被「拉平」成近似两条链的锯齿状，深度大幅下降。

**删除（Delete）**：
1. **Step 1**：先 Find $X$ —— 此时 $X$ 已被 splay 到根；
2. **Step 2**：删除根 $X$，剩下左右两棵子树 $T_L, T_R$；
3. **Step 3**：在 $T_L$ 中做 `FindMax(T_L)` —— 最大元素会被 splay 到 $T_L$ 的根，且它**没有右孩子**；
4. **Step 4**：令 $T_R$ 成为该根的右孩子。

这样合并两棵子树是 $O(\log N)$ 摊还的，无需额外的合并算法。

**Splay 树真的比 AVL 树好吗？**（课件结尾的思考题）
- 优点：不需要存储 BF/高度等额外空间；实现简单；对**局部性（locality）好**的访问序列（如反复访问热点数据、缓存、编译器符号表）摊还性能优于 AVL；插入删除的分摊成本低。
- 缺点：**单次最坏 $O(N)$**（不能用于实时性要求高的场景）；查找是**破坏性**的（会改树形），因此不能用于只读并发场景；对随机访问序列没有优势。

**自顶向下（top-down）splay**：实现时不必先找到结点再回溯，而是在查找路径上边下边旋（用两个辅助树 left/right 挂接），单次只需常数空间、常数因子更小，是工业实现（如 C++ 中部分 splay 实现）的首选。

---

## 6. 摊还分析（Amortized Analysis）

### 6.1 三种界的关系

```
worst-case bound  ≥  amortized bound  ≥  average-case bound
（任意序列最坏）      （不含概率假设）      （依赖输入分布假设）
```

**摊还分析的特点**：对**任意**操作序列给出总代价的上界，再摊到每次操作上，**完全不涉及概率**。因此它比平均分析更「可靠」，比最坏分析更「紧」。

三种方法：
1. **聚合法（aggregate analysis）**
2. **记账法（accounting method）**
3. **势能法（potential method）**

### 6.2 例：带 MultiPop 的栈

```
MultiPop( int k, Stack S )
{
    while ( !IsEmpty(S) && k > 0 ) {
        Pop(S);
        k--;
    }
}
```
单次 `MultiPop` 代价 $T = \min(|S|, k)$，最坏 $O(N)$。

对 $n$ 次 Push/Pop/MultiPop 组成的序列：
- 朴素估计：每次 MultiPop 都 $O(N)$ → 总 $O(N^2)$（**过松**）。
- 关键观察：**每个元素入栈后最多被弹出一次**，所以所有 MultiPop 的弹出总次数 $\le n$。
- 故总代价 $O(n)$，摊还 $T_{\text{amortized}} = O(n)/n = O(1)$。

**这就是聚合法**：先证「$n$ 次操作总时间 $T(n)$」，则每次摊还代价为 $T(n)/n$。

### 6.3 记账法（accounting method）

**思想**：给每个操作指定一个「摊还代价」。当摊还代价 > 实际代价时，把差额作为**信用（credit）**存到数据结构中的具体对象上；当摊还代价 < 实际代价时，用之前存的信用支付。

**约束**：对任意 $n$ 次操作的任意前缀，信用总额必须 $\ge 0$（不能透支），即

$$\sum_{i=1}^{n} \hat c_i \ \ge\ \sum_{i=1}^{n} c_i$$

同一例子（栈），两种等价的记账方案：

| 操作 | 实际代价 | 方案 A 摊还代价 | 方案 B 摊还代价 |
|---|---|---|---|
| Push | 1 | 1 | **2** |
| Pop | 1 | 1 | **0** |
| MultiPop | $\min(\|S\|,k)$ | $\min(\|S\|,k)$ | **0** |

方案 B 更漂亮：Push 时多付 1 元作为「该元素将来被弹出」的预付费（credit $=+1$），Pop/MultiPop 直接用元素身上的信用支付（credit $\to 0$）。因为栈中元素数 $\ge 0$，信用总额始终 $\ge 0$。于是 $T_{\text{amortized}} = O(n)/n = O(1)$。

> 记账法的要点：**摊还代价可以互不相同**（Push 2、Pop 0），只要总和正确、信用不透支。

### 6.4 势能法（potential method）

把「信用」抽象成整个数据结构的一个**势函数（potential function）** $\Phi(D_i)$，$D_i$ 为第 $i$ 次操作后的状态。定义摊还代价：

$$\hat c_i = c_i + \Phi(D_i) - \Phi(D_{i-1})$$

于是

$$\sum_{i=1}^{n}\hat c_i = \sum_{i=1}^{n} c_i + \Phi(D_n) - \Phi(D_0)$$

只要 $\Phi(D_n) \ge \Phi(D_0)$，总摊还代价就是总实际代价的上界。

**好的势函数**应在序列开始时取最小值（通常令 $\Phi(D_0)=0$ 且 $\Phi \ge 0$）。

栈的例子：取 $\Phi(D_i) = $ 第 $i$ 次操作后栈中的元素个数。

| 操作 | 实际代价 $c_i$ | $\Delta\Phi$ | 摊还代价 $\hat c_i$ |
|---|---|---|---|
| Push | 1 | $+1$ | 2 |
| Pop | 1 | $-1$ | 0 |
| MultiPop（弹出 $k'$ 个） | $k'$ | $-k'$ | 0 |

与记账法方案 B 完全一致。

### 6.5 用势能法证明 Splay 树的摊还界

**为什么不用树高作势函数？** 因为一次 splay 可能使树高增加，$\Delta\Phi$ 会很大，界不成立；而且高度变化与实际旋转数不成比例。

**正确选择：结点的「秩（rank）」= 子树规模的对数。**

对结点 $i$，令 $S(i)$ 为以 $i$ 为根的子树中的结点数（含 $i$），定义

$$R(i) = \log S(i),\qquad \Phi = \sum_{i \in T} R(i)$$

直观理解：$R(i) \approx$ 以 $i$ 为根的子树的「高度」，但用**后代结点数的对数**代替高度，好处是**旋转只影响 $X, P, G$ 三个结点的秩**，且秩的变化量恰好能「抵消」旋转次数（zig: 1 次旋转；zig-zig / zig-zag: 2 次旋转）。

**【定理】** 将以 $T$ 为根的树在结点 $X$ 处 splay 的摊还时间为

$$\hat c \le 3\bigl(R(T) - R(X)\bigr) + 1 = O(\log N)$$

由于每次操作后 $R(X)$ 变成 $R(T)$（$X$ 成为根），而 $R(T)$ 在整个序列中最多增加 $O(\log N)$，求和后望远镜式相消，得到任意 $M$ 次操作总代价 $O(M\log N)$。

> 证明技巧（考点）：分别对 zig、zig-zig、zig-zag 证明 $\hat c_i \le 3(R_i(X)-R_{i-1}(X))$，相加后中间项相消，只剩 $3(R_{\text{final}}(X)-R_{\text{initial}}(X))+1$。

![图 1-8 zig-zig 与 zig-zag 的秩变化：用于证明 3(R(T)−R(X))+1 的摊还界](ADS/pictures/Chapter%201%20AVL%E6%A0%91%E4%B8%8E%E4%BC%B8%E5%B1%95%E6%A0%91%20AI%E7%B2%BE%E8%AE%B2/fig08_slide25.webp)

---

## 7. 易错点与考点清单

1. **空树高度 = −1**（Weiss 约定），`BF = hL − hR`；AVL 中 `BF ∈ {−1,0,1}`。
2. **插入只需一次旋转**（单旋或双旋）；**删除可能需要 O(log N) 次旋转**，且不能提前终止。
3. **判定四型**：看「麻烦制造者在失衡结点的哪一侧的哪一侧」——外侧→单旋，内侧→双旋。
4. **双旋转后 BF 的赋值**要按中间结点 $C$ 的原 BF 分情况，不能一律置 0。
5. **旋转中心 $A$ 不一定是根**，必须把新子树根接回原父结点。
6. **Splay 的 zig-zig 必须从祖父开始旋**（先 G 后 P），顺序错了摊还界就崩。
7. **摊还 ≠ 平均**：摊还不假设输入分布；Splay 的单次最坏仍是 $O(N)$。
8. **AVL 最少结点数** $n_h = F_{h+2}-1$；反之给定 $N$ 求最大高度可用该式反解。
9. 记账法中**信用不能透支**（任意前缀 $\ge 0$），势函数应**在初始状态取最小**。

---

## 8. 参考

- Weiss, *Data Structure and Algorithm Analysis in C* (2nd ed.)：Ch.4, p.106–128（AVL）；Ch.11, p.447–451（摊还分析）；M.A.Weiss 著、陈越改编，人民邮电出版社，2005。
- Cormen et al., *Introduction to Algorithms* (3rd ed.)：Ch.17, p.451–478（Amortized Analysis），The MIT Press, 2009。
