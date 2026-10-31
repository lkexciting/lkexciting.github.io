---
title: Chapter 4 左式堆与斜堆 · AI 精讲
aliases:
  - ADS/notes/Chapter 4 左式堆与斜堆 AI精讲
---
# Chapter 4 左式堆与斜堆（Leftist Heaps & Skew Heaps）

> **课件来源**：`ADS04LeftistSkewH_Stu.ppt`（13 页）
> **本章主线**：二叉堆（binary heap）虽然 `Insert`/`DeleteMin` 都是 $O(\log N)$，但**合并（merge）两个堆要 $O(N)$**（只能把一个堆的元素逐个插入另一个）→ 左式堆（leftist heap）用「**零路径长 $Npl$** + 左偏结构」把 merge 降到 $O(\log N)$ → 斜堆（skew heap）干脆去掉 $Npl$，靠「**无条件交换左右孩子**」实现同样的摊还 $O(\log N)$，且不需要任何额外空间。

---

## 0. 本章速览

| 操作 | 二叉堆（binary heap） | 左式堆（leftist heap） | 斜堆（skew heap） |
|---|---|---|---|
| `Insert` | $O(\log N)$ | $O(\log N)$（= merge 单结点） | 摊还 $O(\log N)$ |
| `DeleteMin` | $O(\log N)$ | $O(\log N)$（= merge 两子树） | 摊还 $O(\log N)$ |
| **`Merge`** | **$O(N)$** | **$O(\log N)$** | **摊还 $O(\log N)$** |
| 额外字段 | 无（数组下标隐含） | `Npl`（int） | **无** |
| 形状 | 完全二叉树（complete） | 不一定完全，但**向左倾斜** | 无约束（自调整） |

**一句话**：**「堆（heap）= 结构性质（structure property）+ 序性质（order property）」**。左式堆与斜堆保留**序性质**（父 ≤ 子），只把**结构性质**从「完全二叉树」换成「左偏 / 无所谓」，换来 $O(\log N)$ 的 merge。

**术语对照**

| 中文 | English | 中文 | English |
|---|---|---|---|
| 左式堆 | leftist heap | 斜堆 | skew heap |
| 零路径长 | null path length, $Npl$ | 右路径 | right path |
| 左偏性质 | leftist property | 合并 | merge |
| 序性质 | order property | 结构性质 | structure property |
| 重结点 | heavy node | 轻结点 | light node |

---

## 1. 动机：普通堆为什么合并慢

二叉堆用**数组**存储，父子关系由下标算出（$i$ 的孩子是 $2i, 2i+1$）。这种「隐式结构」非常紧凑，但**两棵完全二叉树的形状几乎不可能拼成一棵完全二叉树** —— 所以合并只能「把 $N_2$ 的元素逐个 `Insert` 到 $H_1$」，代价 $O(N\log N)$（若采用 Floyd 建堆则 $O(N)$，但仍不是 $O(\log N)$）。

**目标（Target）**：把 merge 加速到 $O(\log N)$，同时保持 `Insert`、`DeleteMin` 也是 $O(\log N)$。

**代价**：放弃「完全二叉树」的结构性质 → 用**指针（链式）**表示，并引入新的结构约束。

---

## 2. 左式堆（Leftist Heap）

### 2.1 零路径长（null path length, Npl）

**【定义】** 结点 $X$ 的零路径长 $Npl(X)$ = 从 $X$ 到**一个「没有两个孩子」的结点**（即叶结点或只有一个孩子的结点）的**最短路径长度**。

$$Npl(\text{NULL}) = -1,\qquad Npl(X) = \min\{\,Npl(C)+1 \mid C \text{ 是 } X \text{ 的孩子}\,\}$$

> **易错**：$Npl$ 不是高度（height，到最远叶子的距离），而是**到最近的「不双全」结点的距离**。叶结点 $Npl=0$，NULL 的 $Npl=-1$。

### 2.2 左偏性质（leftist property）

**【定义】** 左式堆满足：对堆中每个结点 $X$，

$$Npl(\text{left child}) \ \ge\ Npl(\text{right child})$$

即**左孩子的 $Npl$ 不小于右孩子**——这使树「**向左倾斜（biased to get deep toward the left）**」。

![图 4-1 零路径长的计算与左偏性质：每个结点满足 Npl(左) ≥ Npl(右)](ADS/pictures/Chapter%204%20%E5%B7%A6%E5%BC%8F%E5%A0%86%E4%B8%8E%E6%96%9C%E5%A0%86%20AI%E7%B2%BE%E8%AE%B2/fig01_slide03.webp)

**推论**：左式堆中，**右路径（right path，从根一路走右孩子到 NULL）是最短的那条路径**。于是

**【定理】** 有 $r$ 个结点在右路径上的左式树，至少有 $2^r - 1$ 个结点。

**证明思路（对 $r$ 归纳）**：右路径上每个结点 $X$ 都有 $Npl(X) \ge$ 它在右路径上的剩余长度；由左偏性质 $Npl(\text{左}) \ge Npl(\text{右})$，故每个右路径结点的**左子树**都是一棵高度至少为 $Npl$ 的满二叉树。$r$ 个结点各贡献一层，总计 $\ge 2^r - 1$。

**于是（Discussion 6 的答案）**：$N$ 个结点的左式堆，右路径长度 $r \le \log(N+1) = O(\log N)$ —— **这正是 merge 只要 $O(\log N)$ 的根本原因**，因为 merge 只在右路径上递归！

---

## 3. 左式堆的合并（Merge）

### 3.1 递归版本

**核心想法**：把两棵堆的**右路径**像拉链一样（zipper）合并 —— 因为两棵堆的右路径都只有 $O(\log N)$ 长。

```
PriorityQueue Merge( PriorityQueue H1, PriorityQueue H2 )
{
    if ( H1 == NULL )  return H2;
    if ( H2 == NULL )  return H1;
    if ( H1->Element < H2->Element )  return Merge1( H1, H2 );
    else                              return Merge1( H2, H1 );
}

static PriorityQueue Merge1( PriorityQueue H1, PriorityQueue H2 )
{
    if ( H1->Left == NULL )          /* 单结点（不可能有右孩子） */
        H1->Left = H2;               /* H1->Right 已是 NULL，H1->Npl 已是 0 */
    else {
        H1->Right = Merge( H1->Right, H2 );        /* Step 1 & 2：递归合并右路径 */
        if ( H1->Left->Npl < H1->Right->Npl )
            SwapChildren( H1 );                    /* Step 3：必要时交换左右孩子 */
        H1->Npl = H1->Right->Npl + 1;              /* 更新 Npl */
    }
    return H1;
}
```

**三步图示（课件示例，$H_1$ 与 $H_2$ 合并）**：

1. **Step 1**：比较两堆根，较小者（$H_1$ 的根）作为新根，递归 `Merge(H1->Right, H2)`；
2. **Step 2**：把递归结果 `Attach` 到 `H1->Right`；
3. **Step 3**：若 `H1->Left->Npl < H1->Right->Npl`，**交换左右孩子**，并令 `H1->Npl = H1->Right->Npl + 1`。

![图 4-2 递归版 Merge 的三步：递归右路径 → 挂接 → 必要时交换并更新 Npl](ADS/pictures/Chapter%204%20%E5%B7%A6%E5%BC%8F%E5%A0%86%E4%B8%8E%E6%96%9C%E5%A0%86%20AI%E7%B2%BE%E8%AE%B2/fig02_slide05.webp)

**时间复杂度**：每次递归沿某一棵堆的右路径下降，两条右路径长度之和为 $O(\log N_1 + \log N_2)$，每层 $O(1)$ → $T_p = O(\log N)$。

> 课件追问：「What if Npl is NOT updated?」—— 若不更新 $Npl$，左偏性质无法维持，树的右路径可能变成 $O(N)$，merge 退化为 $O(N)$。**$Npl$ 的正确维护是复杂度的保证。**

### 3.2 迭代版本

自底向上做，避免递归：

1. **Step 1：把两棵树的右路径「按 key 排序」合并成一条路径**（不改变各自的左孩子）；
2. **Step 2：沿这条新右路径自底向上，逐个检查并交换左右孩子**（若左孩子的 $Npl$ 小于右孩子则交换），同时更新 $Npl$。

![图 4-3 迭代版 Merge：先把两条右路径归并成一条，再自底向上交换左右孩子](ADS/pictures/Chapter%204%20%E5%B7%A6%E5%BC%8F%E5%A0%86%E4%B8%8E%E6%96%9C%E5%A0%86%20AI%E7%B2%BE%E8%AE%B2/fig03_slide07.webp)

### 3.3 Insert 与 DeleteMin 都是 Merge 的特例

- **`Insert(X)`** = `Merge(H, 单结点堆{X})` —— $O(\log N)$；
- **`DeleteMin()`** = 删除根，然后 `Merge(H->Left, H->Right)` —— $O(\log N)$；
- （补充）**`BuildHeap`** = 反复 `Insert`，$O(N\log N)$；左式堆没有 $O(N)$ 的 Floyd 建堆法（因为不是数组结构）。

> 这句话是本章的「题眼」：**插入只是合并的特例（Insertion is merely a special case of merging）**。

---

## 4. 斜堆（Skew Heap）

### 4.1 定义与思想

斜堆 = **左式堆的简化版（a simple version of the leftist heaps）**：
- **不存 $Npl$**，不需要任何额外空间；
- **不需要判断**是否要交换 —— **无条件交换**；
- merge 时**总交换左右孩子**，唯一的例外是「**右路径上最大的那个结点不交换它的孩子**」。

**【约定】斜堆 merge**：沿右路径合并（与左式堆一样按 key 拉链），然后**一律交换**路径上每个结点的左右孩子；只有**右路径上 key 最大（即在拉链中最后被挂上的）那个结点**不交换（它是递归的自然终止点，不是特例）。

> 课件提示：「Not really a special case, but a natural stop in the recursions.」—— 最后一个结点没有右孩子，交换无意义，递归在此自然结束。

**为什么敢无条件交换？** 因为「交换」这个动作本身就是**自调整（self-adjusting）**：它把刚刚走过的右路径的元素「摊平」到左边，下一次 merge 时右路径会变短。**用摊还（amortized）代价换空间与判断开销**。

![图 4-4 斜堆 merge：无条件交换左右孩子（最右路径末尾结点除外）](ADS/pictures/Chapter%204%20%E5%B7%A6%E5%BC%8F%E5%A0%86%E4%B8%8E%E6%96%9C%E5%A0%86%20AI%E7%B2%BE%E8%AE%B2/fig04_slide08.webp)

### 4.2 示例：Insert 15

在斜堆中插入 15 = 与单结点堆 `{15}` 做 merge：沿右路径拉链 → 一路交换 → 得到新树。注意结果形状与左式堆不同（斜堆**不保证左偏**），但**序性质始终成立**。

![图 4-5 斜堆 Insert 15 的过程（插入即 merge 单结点）](ADS/pictures/Chapter%204%20%E5%B7%A6%E5%BC%8F%E5%A0%86%E4%B8%8E%E6%96%9C%E5%A0%86%20AI%E7%B2%BE%E8%AE%B2/fig05_slide09.webp)

### 4.3 优缺点

- **优点**：不需要额外空间维护路径长度；不需要测试（test）来决定是否交换 —— 代码更短、常数更小。
- **缺点**：单次操作可能很慢（最坏 $O(N)$），只有**摊还** $O(\log N)$；树形完全由访问历史决定，**不可预测**。
- **开放问题（open problem）**：左式堆与斜堆的**期望右路径长度（expected right path length）**的精确值仍是未解问题 —— 说明这类自调整结构的平均行为很难分析。

---

## 5. 斜堆的摊还分析（Amortized Analysis）

**目标**：证明任意 $M$ 次连续操作总代价 $O(M\log N)$，即摊还 $O(\log N)$。

**关键定义（重/轻结点）**：

**【定义】** 结点 $p$ 是**重结点（heavy）**，若其**右子树的后代数**至少是 $p$ 的后代数的一半；否则是**轻结点（light）**。

> 后代数（number of descendants）**包含结点自身**。直观：右子树「太重」的结点是 heavy。

**势函数**：$\Phi(D_i) = $ 树中**重结点的个数**（number of heavy nodes）。

**分析要点（课件推导）**：

设一次 merge 中两条右路径上的轻、重结点数分别为 $l_1, h_1$（堆 1）与 $l_2, h_2$（堆 2），另设 $h$ 为合并后新右路径上新增的重结点数。

- **实际代价（最坏）**：$T_{\text{worst}} = l_1 + h_1 + l_2 + h_2$（遍历两条右路径）；
- **合并前势**：$\Phi_0 = h_1 + h_2 + h$（原有重结点 + 路径上的）；
- **合并后势**：$\Phi_N \le$ 变化后的重结点数；**只有原本在右路径上的结点**的 heavy/light 状态可能改变（其他结点的子树没动）；
- 关键结论：**轻结点交换后一定变成重结点、重结点交换后一定变成轻结点**，故势的增量为 $O(l_1+l_2)$ 量级，于是

$$T_{\text{amortized}} = T_{\text{worst}} + \Phi_N - \Phi_0 \le 2(l_1 + l_2)$$

- 而**轻结点在右路径上的个数是 $O(\log N)$**：因为每经过一个轻结点，子树规模至少减半（右子树 < 一半），所以右路径上轻结点 $\le \log N$；重结点虽可能很多，但**它们的代价被势函数「预付」了**。
- 因此 $l_1 + l_2 = O(\log N)$ ⟹

$$\boxed{T_{\text{amortized}} = O(\log N)}$$

![图 4-6 摊还分析：只有原右路径上的结点重/轻状态会改变，势增量为 O(l1+l2)](ADS/pictures/Chapter%204%20%E5%B7%A6%E5%BC%8F%E5%A0%86%E4%B8%8E%E6%96%9C%E5%A0%86%20AI%E7%B2%BE%E8%AE%B2/fig06_slide12.webp)

> **与第 1 章 splay 树的对照**：两者都用「势能法 + 访问路径上的结构变化有界」来证明摊还界；splay 用「秩 $R=\log S$」，斜堆用「重结点计数」。**这类证明的套路是一样的：找出「只能沿短路径变化的量」作为势函数。**

---

## 6. 三种可合并堆（mergeable heap）的对比

| | 二叉堆 | 左式堆 | 斜堆 | （补充）二项队列 |
|---|---|---|---|---|
| merge | $O(N)$ | $O(\log N)$ | 摊还 $O(\log N)$ | $O(\log N)$（最坏） |
| insert | $O(\log N)$ | $O(\log N)$ | 摊还 $O(\log N)$ | $O(1)$ 摊还 |
| deleteMin | $O(\log N)$ | $O(\log N)$ | 摊还 $O(\log N)$ | $O(\log N)$ |
| findMin | $O(1)$ | $O(1)$ | $O(1)$ | $O(\log N)$ |
| 实现难度 | 最低（数组） | 中（指针 + Npl） | **低**（指针，无 Npl） | 高（结点链表 + 二进制思想） |

---

## 7. 易错点与考点清单

1. **$Npl(\text{NULL})=-1$、叶结点 $Npl=0$**；$Npl(X)=\min\{Npl(C)\}+1$ ——是**最短**路径，不是高度。
2. 左偏性质是 **$Npl(\text{左}) \ge Npl(\text{右})$**，方向别写反；它导致「树向左深」。
3. 定理：右路径 $r$ 个结点 ⟹ 至少 $2^r-1$ 个结点 ⟹ 右路径长 $O(\log N)$。
4. Merge 只在**右路径**上递归，所以是 $O(\log N)$；**忘记更新 $Npl$** 会破坏左偏性质，复杂度退化。
5. `Insert` 与 `DeleteMin` 都是 `Merge` 的特例（要会写出一行式）。
6. 斜堆的例外是「**右路径上最大的结点不交换孩子**」，这**不是特例而是递归的终止条件**。
7. 斜堆**最坏**单次 $O(N)$，只有**摊还** $O(\log N)$；不保证左偏。
8. 斜堆摊还分析：**重结点 = 右子树后代数 ≥ 自身后代数的一半**；势 = **重结点个数**；轻结点在右路径上 $O(\log N)$ 是关键。
9. 左式堆的**迭代版 merge**：先归并右路径、再自底向上交换 —— 顺序不能颠倒。

---

## 8. 参考

- Weiss, *Data Structure and Algorithm Analysis in C* (2nd ed.)：**Ch.5**，p.161–169（左式堆、斜堆）；**Ch.11**，p.435–437（斜堆的摊还分析）；M.A.Weiss 著、陈越改编，人民邮电出版社，2005。
