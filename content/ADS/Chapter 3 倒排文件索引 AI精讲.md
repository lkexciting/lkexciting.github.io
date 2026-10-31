---
title: Chapter 3 倒排文件索引 · AI 精讲
aliases:
  - ADS/notes/Chapter 3 倒排文件索引 AI精讲
---
# Chapter 3 倒排文件索引（Inverted File Index）

> **课件来源**：`ADS03InvFileInd_Stu.ppt`（19 页）
> **本章主线**：从一个真实问题出发 ——「怎么找出所有包含 "Computer Science" 的网页？」→ 逐个扫描（scan）不可行 → 词–文档关联矩阵（incidence matrix）太占空间 → **倒排文件索引（inverted file index）** → 索引如何构建（index generator）、如何压缩（compression）、如何在分布式/动态场景下维护 → 最后用 **precision / recall** 评价检索质量。

> 这一章是「数据结构课里最像工程」的一章：几乎所有结论都是**空间 vs 时间 vs 实现复杂度**的权衡。

---

## 0. 本章速览

| 概念 | 关键点 |
|---|---|
| 索引（index） | 在文本中定位某个词（term）的机制 |
| 倒排文件（inverted file） | 对每个 term，列出**所有出现位置的指针** |
| 倒排（inverted）的含义 | 正常是「文档 → 词」，倒过来是「**词 → 文档**」 |
| 词表（term dictionary）+ 投递列表（posting list） | 倒排索引的两个组成部分 |
| 构建三阶段 | token analyzer → stop filter / word stemming → vocabulary insertor |
| 内存不足 | 分块（block）→ 写盘 → 归并（merge） |
| 分布式 | 词分区（term-partitioned）/ 文档分区（document-partitioned） |
| 动态索引 | 主索引（main index）+ 辅助索引（auxiliary index） |
| 效果评价 | Precision $P$ / Recall $R$ |

**术语对照**

| 中文 | English | 中文 | English |
|---|---|---|---|
| 倒排文件索引 | inverted file index | 词 | term |
| 词–文档关联矩阵 | term-document incidence matrix | 投递列表 | posting list |
| 词表 | term dictionary / vocabulary | 词干化 | word stemming |
| 停用词 | stop words | 分词器 | token analyzer |
| 阈值化 | thresholding | 精度/查准率 | precision |
| 召回率/查全率 | recall | 基准 | benchmark |

---

## 1. 问题与两种朴素解法

**问题**：给定检索串（如 "Computer Science"），如何找出**包含它的网页**？

### 解法 1：逐页扫描（scan）

对每个页面做字符串匹配。等价于「文本检索 = 顺序扫描（sequential scan）」。
**代价**：$O(\text{文档总字节数})$，对 Web 规模完全不可行 —— 课件吐槽「Wait till your next life!（等下辈子吧）」。

### 解法 2：词–文档关联矩阵（term-document incidence matrix）

行 = 词，列 = 文档，格子里 0/1 表示该词是否出现在该文档。查询 "silver AND truck" 变成**位向量按位与**：

$$\text{silver} \ \&\ \text{truck} = 1010\ \&\ 1011 = 1010$$

即文档 1 和文档 3 命中。

**课件例子（4 篇文档）**

| Doc | Text |
|---|---|
| 1 | Gold silver truck |
| 2 | Shipment of gold damaged in a fire |
| 3 | Delivery of silver arrived in a silver truck |
| 4 | Shipment of gold arrived in a truck |

| term | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| a | 0 | 1 | 1 | 1 |
| arrived | 0 | 0 | 1 | 1 |
| damaged | 0 | 1 | 0 | 0 |
| delivery | 0 | 0 | 1 | 0 |
| fire | 0 | 1 | 0 | 0 |
| gold | 1 | 1 | 0 | 1 |
| of | 0 | 1 | 1 | 1 |
| in | 0 | 1 | 1 | 1 |
| shipment | 0 | 1 | 0 | 1 |
| silver | 1 | 0 | 1 | 0 |
| truck | 1 | 0 | 1 | 1 |

![图 3-1 词–文档关联矩阵：查询变成位向量按位与（silver & truck = 1010 & 1011 = 1010）](ADS/pictures/Chapter%203%20%E5%80%92%E6%8E%92%E6%96%87%E4%BB%B6%E7%B4%A2%E5%BC%95%20AI%E7%B2%BE%E8%AE%B2/fig01_slide04.webp)

**缺点**：矩阵是 $|V| \times N$ 的，但**绝大多数格子是 0**（稀疏，sparse）。$|V|$ 可达 $10^6\sim10^7$，$N$ 可达 $10^{10}$ —— 空间完全爆炸。**只存非零项**就得到倒排索引。

---

## 2. 倒排文件索引（Inverted File Index）

**【定义 1】索引（index）** 是一种在文本中定位给定词（term）的机制。

**【定义 2】倒排文件（inverted file）** 包含一组指针（如页码、文档号），指向该词在文本中**所有出现的位置**。

**为什么叫「倒排（inverted）」**：正常视角是「文档 → 它包含哪些词」，倒排索引反过来「**词 → 它出现在哪些文档**」。

**紧凑版本（compact version）** —— 只记录每个词出现的次数与文档号：

| No. | Term | Times; Documents |
|---|---|---|
| 1 | a | <3; 2,3,4> |
| 2 | arrived | <2; 3,4> |
| 3 | damaged | <1; 2> |
| 4 | delivery | <1; 3> |
| 5 | fire | <1; 2> |
| 6 | gold | <3; 1,2,4> |
| 7 | of | <3; 2,3,4> |
| 8 | in | <3; 2,3,4> |
| 9 | shipment | <2; 2,4> |
| 10 | silver | <2; 1,3> |
| 11 | truck | <3; 1,3,4> |

![图 3-2 紧凑版本：从矩阵到「词 → (次数; 文档列表)」](ADS/pictures/Chapter%203%20%E5%80%92%E6%8E%92%E6%96%87%E4%BB%B6%E7%B4%A2%E5%BC%95%20AI%E7%B2%BE%E8%AE%B2/fig02_slide05.webp)

### 2.1 词表与投递列表

- **词表 / 词典（term dictionary, vocabulary）**：所有出现过的词的集合（通常按字典序组织，便于二分或前缀查找）。
- **投递列表（posting list）**：某个词对应的「出现记录」序列。

**如何打印并高亮包含某词的句子？** → 投递列表里必须记录**位置（position）**，而不只是文档号：

```
<3; (2;6), (3;6), (4;6)>            /* a 出现 3 次：文档2第6个词、文档3第6个词、文档4第6个词 */
<2; (1;2), (3;3,7)>                 /* silver 出现 2 次：文档1第2个词；文档3第3、第7个词 */
<3; (1;3), (3;8), (4;7)>            /* truck */
```

即投递列表的条目是 `(docID; position1, position2, ...)`。

![图 3-3 带位置信息的投递列表（Term Dictionary + Posting List 结构）](ADS/pictures/Chapter%203%20%E5%80%92%E6%8E%92%E6%96%87%E4%BB%B6%E7%B4%A2%E5%BC%95%20AI%E7%B2%BE%E8%AE%B2/fig03_slide06.webp)

**为什么要保留词频（times / frequency）？**
1. **排序（ranking）**：词频是 TF（term frequency）的基础，用于相关性打分（如 TF-IDF、BM25）；
2. **优化 AND 查询**：多个词的 AND 求交时，**从投递列表最短的（词频最低的）词开始**，先把结果集缩到最小，再与其他列表求交 —— 课件 Note：「AND 操作从最小频率的 term 开始求交，速度快」。这是一个典型的**查询优化（query optimization）**技巧，类似数据库选择率（selectivity）优化。

---

## 3. 索引的构建（Index Generator）

**核心循环**（课件伪代码）：

```
while ( read a document D ) {
    while ( read a term T in D ) {
        if ( Find( Dictionary, T ) == false )
            Insert( Dictionary, T );
        Get T's posting list;
        Insert a node to T's posting list;
    }
}
Write the inverted index to disk;
```

![图 3-4 索引生成器的主循环与四个处理阶段](ADS/pictures/Chapter%203%20%E5%80%92%E6%8E%92%E6%96%87%E4%BB%B6%E7%B4%A2%E5%BC%95%20AI%E7%B2%BE%E8%AE%B2/fig04_slide07.webp)

四个阶段（课件列出的模块）：

1. **分词（Token Analyzer）**：把字符流切成词（term），处理标点、大小写、数字、URL 等；
2. **停用词过滤（Stop Filter）**：「a」「the」「it」这类**几乎每篇文档都有**的词，索引它们没有区分度 → 称为**停用词（stop words）**，直接从原文档中剔除；
3. **词干化（Word Stemming）**：只保留词的**词干/词根（stem / root）**，把屈折变化归一：
   - `process, processing, processes, processed → process`
   - `says, said, saying → say`
   - 效果：缩小词表、提高召回率（recall）；
4. **词表扫描与插入（Vocabulary Scanner / Insertor）**：在词表中查找/插入，并挂接投递列表。

**词表用什么数据结构？**（课件 Discussion）
- **方案 1：搜索树（search trees）** —— B 树、B+ 树、Trie（字典树，前缀查询友好）。
- **方案 2：哈希（hashing）**。

| 对比项 | 哈希表 | 搜索树 / Trie |
|---|---|---|
| 单点查找 | $O(1)$ 期望，**常数最优** | $O(\log \vert V\vert)$ 或 $O(\text{词长})$ |
| 有序遍历 / 前缀查询（如 "comp*"） | **不支持**（需全表扫描） | 支持（Trie 尤其擅长） |
| 范围查询 | 不支持 | 支持 |
| 最坏情况 | 冲突退化（可被构造攻击） | 稳定 |
| 空间 | 需预留桶数组 | 按需增长 |

> 结论：**只做精确查找 → 哈希；需要前缀/范围/有序 → Trie 或 B+ 树**。搜索引擎的词表通常用「哈希 + 前缀结构」混合。

---

## 4. 内存不够怎么办：分块 + 归并（Blocked / Merge-based Indexing）

单机内存装不下整个索引时：

```
BlockCnt = 0;
while ( read a document D ) {
    while ( read a term T in D ) {
        if ( out of memory ) {
            Write BlockIndex[BlockCnt] to disk;     /* 写盘前先排序！ */
            BlockCnt ++;
            FreeMemory;
        }
        if ( Find( Dictionary, T ) == false )
            Insert( Dictionary, T );
        Get T's posting list;
        Insert a node to T's posting list;
    }
}
for ( i = 0; i < BlockCnt; i++ )
    Merge( InvertedIndex, BlockIndex[i] );
```

**关键点（课件 Note）**：**写磁盘之前先把块内索引按 term 排序**，这样第 $k$ 轮归并只需顺序扫描、代价 $O(\text{总条目数})$，而不是反复随机查找。这与第 15 章**外排序（external sorting）**的思想完全一致：内存里的块 = 归并段的「run」。

**复杂度**：设总投递条目数 $T$、内存可容纳 $B$ 条，则块数 $\approx T/B$，归并 $k$ 路的总 I/O 为 $O\!\left(\frac{T}{B}\log_{k}\frac{T}{B}\right)$ 量级 —— 这就是「分块 + 多路归并」的经典代价。

![图 3-5 内存不足时的分块构建与归并：先排序再落盘，最后多路归并](ADS/pictures/Chapter%203%20%E5%80%92%E6%8E%92%E6%96%87%E4%BB%B6%E7%B4%A2%E5%BC%95%20AI%E7%B2%BE%E8%AE%B2/fig05_slide10.webp)

---

## 5. 分布式索引（Distributed Indexing）

Web 规模下索引必须分布在多台机器上，每个结点只保存**整个集合的一个子集**的索引。两种划分策略：

### 5.1 词分区（term-partitioned index）

按**词的首字母**（或哈希值）划分：结点 1 负责 `A~C`，结点 2 负责 `D~F`，…，结点 n 负责 `X~Z`。

- **优点**：查询某个词只需问**一个**结点，通信量小；便于压缩（同区词的词形相近）。
- **缺点**：**负载不均（load imbalance）**—— 常用词（如 "the"、"computer"）所在的结点成为热点；增加结点时需**重新划分所有词**（难扩容）；一次多词查询要访问多个结点，结果需合并。

### 5.2 文档分区（document-partitioned index）

按**文档编号范围**划分：结点 1 负责文档 1~10000，结点 2 负责 10001~20000，…

- **优点**：负载天然均衡；**扩容容易**（新文档直接进新结点）；写入/更新只影响一个结点 —— 实际搜索引擎（如 Google）多采用此法。
- **缺点**：一个查询要**广播到所有结点**，各自返回局部结果，再由前端**归并排序（merge top-k）**；通信开销大、尾延迟（tail latency）问题突出。

![图 3-6 分布式索引的两种划分：词分区（A~C, D~F, …）与文档分区（1~10000, …）](ADS/pictures/Chapter%203%20%E5%80%92%E6%8E%92%E6%96%87%E4%BB%B6%E7%B4%A2%E5%BC%95%20AI%E7%B2%BE%E8%AE%B2/fig06_slide11.webp)

---

## 6. 动态索引（Dynamic Indexing）

现实中文档**不断到来、不断删除**：
- 新文档 → 需要更新已有词的投递列表、可能加入新词；
- 文档被删 → 投递列表要删除对应条目（通常用**删除标记 / 墓碑 tombstone** 惰性删除）。

**标准解法：主索引 + 辅助索引（main index + auxiliary index）**

- **主索引**：大的、**不可变（immutable）**的索引，存在磁盘上；
- **辅助索引**：小的、内存中的索引，存放**新到的文档**；
- 查询时**同时查两者并合并结果**；
- 当辅助索引足够大（或定期）→ **与主索引合并（re-index / merge）**，生成新的主索引。

**两个开放问题（课件）**：
1. **何时重建（when to re-index）？** —— 太频繁则合并开销大，太稀疏则辅助索引过大、查询变慢（经典 trade-off，可参照 **LSM-Tree** 的层级合并策略）。
2. **如何删除一个文档（how to delete a doc）？** —— 惰性删除：先标记，合并时物理清除；或维护 docID → 投递列表的反向映射（forward index）以便定位。

![图 3-7 动态索引：主索引 + 辅助索引，查询合并结果，定期重索引](ADS/pictures/Chapter%203%20%E5%80%92%E6%8E%92%E6%96%87%E4%BB%B6%E7%B4%A2%E5%BC%95%20AI%E7%B2%BE%E8%AE%B2/fig07_slide12.webp)

---

## 7. 压缩（Compression）

**动机**：投递列表极长（"the" 在 Web 上可达 $10^9$ 级），必须压缩才能放进内存/减少磁盘 I/O。

**存储词表本身**：把词按字典序排列后存成**前缀共享（front coding / prefix sharing）**的形式，只存与上一个词的公共前缀长度 + 后缀：

```
arrive / damaged / deliver / fire / gold / shipment / silver / truck
```

**压缩投递列表（docID 差值编码 / d-gap, delta encoding）**：
- 不存绝对 docID，而存**相邻差（gap）**：`2, 15, 47, …, 58879, 58890` → `2, 13, 32, …, 11`
- 差值分布**高度偏斜**（大量小值），可用 **变长字节编码（variable-byte / vbCode）** 或 **γ 编码（Elias gamma）**；
- 课件结论：**大多数 gap 用远少于 20 bit 就能编码**（20 bit 是直接存 docID 的上界），压缩率通常在 3~10 倍。

![图 3-8 投递列表的差值（gap）编码：相邻 docID 之差多为小值，可变长编码即可](ADS/pictures/Chapter%203%20%E5%80%92%E6%8E%92%E6%96%87%E4%BB%B6%E7%B4%A2%E5%BC%95%20AI%E7%B2%BE%E8%AE%B2/fig08_slide14.webp)

> 补充（常考）：压缩不仅省空间，还**省 I/O 带宽**——解码的 CPU 开销往往小于省下的磁盘/网络传输，因此是净收益（这也是 "compression is a win" 的经典结论）。

---

## 8. 阈值化（Thresholding）

为控制查询代价，只处理「一部分」结果：

- **文档端（document）**：只返回按权重（weight）排序的**前 $x$ 篇**文档（top-$x$ retrieval）；
- **查询端（query）**：把查询词按**词频升序**排序，只取其中**一定百分比**的词参与检索（如 20%、40%、80%）。

**代价**：
- **对布尔查询不适用（not feasible for Boolean queries）** —— 布尔语义要求「全有/全无」，截断会改变语义；
- **可能漏掉相关文档（can miss some relevant documents due to truncation）** —— 因为截断丢掉了部分查询词/结果。

![图 3-9 阈值化：按词频升序只取部分查询词（20%/40%/80%）](ADS/pictures/Chapter%203%20%E5%80%92%E6%8E%92%E6%96%87%E4%BB%B6%E7%B4%A2%E5%BC%95%20AI%E7%B2%BE%E8%AE%B2/fig09_slide17.webp)

---

## 9. 搜索引擎的评价指标

**四个维度（课件）**：

| 维度 | 具体指标 |
|---|---|
| 索引速度 | 每小时可索引的文档数（documents/hour） |
| 检索速度 | 延迟（latency）作为索引规模的函数 |
| 查询语言的表达力 | 能否表达复杂信息需求；复杂查询上的速度 |
| **用户满意度（user happiness）** | 最终目标，但难量化 |

**评价分两层**：
- **数据检索（data retrieval）性能**：正确性确立之后，看**响应时间（response time）**与**索引空间（index space）**；
- **信息检索（information retrieval）性能**：额外看「**答案集合的相关性（relevance）**」。

### 9.1 相关性评价需要三要素

1. 一个**基准文档集（benchmark document collection）**；
2. 一套**基准查询（benchmark suite of queries）**；
3. 对每个「查询–文档」对给出 **Relevant / Irrelevant 的二元判定**。

### 9.2 混淆矩阵与两个核心指标

|  | Relevant | Irrelevant |
|---|---|---|
| **Retrieved** | RR | IR |
| **Not Retrieved** | RN | IN |

$$\boxed{P\ (\text{precision, 查准率}) = \frac{RR}{RR+IR}} \qquad \boxed{R\ (\text{recall, 查全率}) = \frac{RR}{RR+RN}}$$

- **Precision**：检索出来的东西里，有多少是相关的 —— 「**准不准**」；
- **Recall**：所有相关文档里，有多少被检索出来 —— 「**全不全**」。

**两者的权衡**：
- 高召回、低精度 → 返回了大部分相关文档，但夹带大量垃圾（**"Returns relevant documents but misses many useful ones too"** 的反面：返回太多 junk）；
- 高精度、低召回 → 返回的都很相关，但漏掉很多有用文档；
- **理想点**在 $(R=1, P=1)$，实际系统只能沿 P–R 曲线（P-R curve）取舍，常用 **F1 = 2PR/(P+R)** 或 **MAP（mean average precision）** 作为单一数值。

> 课件还留了一个 Discussion：「How to improve the relevancy of search results?」——思路包括：更好的排序模型（TF-IDF / BM25 / 学习排序 learning to rank）、查询扩展（query expansion）、同义词与词干化、链接分析（PageRank）、用户行为反馈（click-through）。

---

## 10. 易错点与考点清单

1. **倒排（inverted）**的含义是「词 → 文档」，与正向索引（forward index，文档 → 词）相对。
2. **关联矩阵**的问题不是「不精确」而是**太稀疏、空间爆炸**；倒排索引 = 只存非零项。
3. **词频（times）**的两个用途：**排序打分** 与 **AND 求交时先取最短投递列表**。
4. 投递列表若要**高亮/短语查询**，必须存**位置（position）**，只存 docID 不够。
5. **停用词**去掉的是「无区分度」的词，**词干化**合并的是「同词根的屈折形式」——两者目的不同：前者省空间、后者提召回。
6. 内存不足时的关键优化是**写盘前先排序**，否则归并不会更快（与第 15 章外排序呼应）。
7. **词分区**负载不均、扩容难；**文档分区**负载均衡、扩容易，但要广播查询 + 归并 top-k。
8. **动态索引**用「主索引（不可变）+ 辅助索引（增量）」两级结构，查询时合并。
9. **gap / delta 编码**是投递列表压缩的核心；小 gap 用变长编码，远小于直接存 20 bit 的 docID。
10. **Precision 与 Recall 的分母**：$P$ 的分母是「检索到的」，$R$ 的分母是「所有相关的」——考试最常互换出错。

---

## 11. 参考

- 课件附带资料（`InvertedFileIndex.zip`）：*The Google File System*、*Building an Inverted Index*、*Inverted Index Construction*、*Compression*。
- Manning, Raghavan & Schütze, *Introduction to Information Retrieval*（第 1、2、4、5 章）：倒排索引、词典与容错检索、索引压缩。
