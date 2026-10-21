---
title: Chapter3
aliases:
  - 计算机网络/notes/Chapter3
---
# THE DATA LINK LAYER（数据链路层）

> 按所给模板整理，依据课件第 1–112 页。中文解释保留英文专业名词；图示取自原课件，页码为 PDF 页码。公式条件与易错提醒属于帮助理解的补充说明。

## 1. Data Link Layer Design Issues

### 1.1 基本职责与分层关系

**Data Link Layer** 负责相邻节点间的数据传输，向 **Network Layer** 提供明确的服务接口，处理传输差错，并协调发送和接收速度。

- **Packet** 是 Network Layer 交给链路层的数据；**Frame** 是链路层添加 Header、Trailer 后的传输单位。
- **Physical Layer** 传输原始 bit stream；Data Link Layer 从中识别 Frame。
- 发送：Packet → 加 Header/Trailer → Frame → bit stream；接收执行反过程。
- 两端同层之间是逻辑通信，实际数据沿协议栈下行、经过物理介质，再向上交付。
- 链路层可靠性针对一段链路，不等于整个端到端路径可靠。

### 1.2 Services provided to the network layer

| Service | 是否先建立连接 | 是否确认 | 特点与课件示例 |
|---|---|---|---|
| Unacknowledged connectionless service | 否 | 否 | 独立发送 Frame，链路层不恢复丢失；适合低差错链路或重视时效的业务，课件以 Ethernet 为例 |
| Acknowledged connectionless service | 否 | 是 | 每帧有确认机制，无须先建立连接；适合不可靠信道，课件以 WiFi 为例 |
| Acknowledged connection-oriented service | 是 | 是 | 在连接中编号、确认，目标是按序且不重复地交付 |

**理解：Connection 与 Acknowledgement 是两个维度。** 无连接也可以有确认；“有确认”本身不等于“面向连接”。这里描述的是服务模型，不能把所有实际协议行为简化为表中一句话。

### 1.3 Framing

**Framing** 把连续 bit stream 划分为离散 Frame，便于定位边界、校验、控制和错误后的重新同步。

#### Byte count

Header 中用长度字段给出 Frame 的大小。若长度字段损坏，接收方可能错误定位后续边界，产生 **Resynchronization** 问题。计算题必须确认长度是否包含长度字段本身。

#### Flag bytes with byte stuffing

- 用 **FLAG** byte 标记边界。
- 若数据中出现 FLAG 或 **ESC**，在前面插入 ESC；接收方恢复原数据。
- 目的：让数据中的特殊 byte 不被误判为控制标记，称为 **Data transparency**。
- 课件抽象规则：数据 `A B ESC FLAG` → `FLAG A B ESC ESC ESC FLAG FLAG`。
- 不同协议的具体 escape 编码可能不同，答题采用题目定义。

![Byte stuffing：边界 FLAG 与数据中的 FLAG/ESC，PDF 第 10 页](Chapter3-page-010.png)

#### Flag bits with bit stuffing

- 典型 FLAG：`01111110`。
- Sender：在 Frame 内每遇到连续五个 `1`，插入一个 `0`。
- Receiver：先识别边界，再在 Frame 内删除连续五个 `1` 后的填充 `0`。
- FLAG 本身不参与 stuffing；这是按 bit 处理，不需要 byte 对齐。
- 例：`0111101111101111110` → `011110111110011111010`，这里只列填充后的数据，不包括首尾 FLAG。

![Bit stuffing 与 destuffing，PDF 第 12 页](Chapter3-page-012.png)

#### Physical layer encoding violation

利用 Physical Layer 编码中不用于普通数据的符号标记 Frame 边界。例如课件中 high-low、low-high 表示数据，而 high-high、low-low 可作为特殊标记。前提是底层编码有可用的冗余符号。

实际系统也可组合使用长度、定界符与校验来提高可靠性。

### 1.4 Error control

**Error control** 解决 Frame 损坏、丢失、重复以及交付顺序问题。

- **ACK**：给出成功接收的反馈。
- **NAK**：报告差错，请求相应处理；并非每个协议都必须有 NAK。
- **Timeout / Timer**：长时间没有收到有效 ACK，触发 Retransmission。
- **Sequence number**：区分新帧和旧帧重传，避免重复交付。

只增加 Timer 不够：ACK 丢失时，Sender 会重发已到达的 Frame，Receiver 必须依靠编号识别重复。

### 1.5 Flow control

**Flow control** 防止 Sender 的速度超过 Receiver 的处理或缓存能力。

| 方法 | 核心思路 |
|---|---|
| Feedback-based flow control | Receiver 返回允许继续发送的信息，如 ACK、窗口信息 |
| Rate-based flow control | 协议直接限制发送速率，不依赖逐次接收反馈 |

**Error control 关注“传得对不对”；Flow control 关注“来得及接收吗”。** 同一个 ACK 可以在协议中同时承担两类作用。Flow control 与网络中整体资源不足引起的 Congestion control 也应区分。

## 2. Error Detection and Correction

### 2.1 基本思想

- **Isolated errors**：零散 bit 错误。
- **Burst errors**：错误集中在一段范围；Burst length 从第一个错误 bit 到最后一个错误 bit 计算，中间不必每个 bit 都出错。
- 添加 **Redundancy**：m 个 data bits 加 r 个 check bits，形成 n=m+r 位 **Codeword**。
- **Error detection**：判断是否检测到错误，通常配合重传。
- **Error correction / FEC**：依靠冗余直接恢复信息，无须等待重传。

### 2.2 Hamming distance

两个 Codewords 的 **Hamming distance** 是不同 bit 位置的数量。例如 `10001001` 与 `10110001` 的距离为 3。

整个 Code 的 **Minimum Hamming distance**，记为 d_min，是任意两个不同合法 Codewords 的最小距离。

| 能力 | 最小距离要求 |
|---|---|
| 保证检测最多 e 个 bit errors | d_min ≥ e+1 |
| 保证纠正最多 t 个 bit errors | d_min ≥ 2t+1 |

检测要求错误不能把一个合法 Codeword 变成另一个；纠正要求接收结果能唯一归属于原 Codeword。

- d_min=5：可保证检测最多 4 错，或纠正最多 2 错。
- Single parity code：d_min=2，能检测所有单错；也能检测任何奇数个 bit 翻转，但不能检测偶数个 bit 翻转。
- 超出能力不意味着必然失败，意味着**不再保证成功**。
- 检错模式与纠错模式有不同判决规则，不能把两种独立能力理解为同时安全具备。

### 2.3 Error-correcting codes

#### 常用概念

- **Block code**：一个 block 的 check bits 只由该 block 的 data bits 决定。
- **Systematic code**：Codeword 中保留原 data bits，附加 check bits。
- **Linear code**：编码遵循相应域上的线性关系；二进制线性码的运算使用 XOR。
- **Code rate**：R=m/n，表示 Codeword 中有效信息所占比例。

#### Hamming code

**单错纠正的冗余下界：**每个合法 Codeword 需要覆盖自身与 n 个单 bit 错误结果，因此

`2^m × (n+1) ≤ 2^n`，即 **`2^r ≥ m+r+1`**。

例如 m=1000：r=9 不够，r=10 满足 `1024 ≥ 1011`。

**Sender 编码步骤：**

1. 明确位编号方向。课件主例从左向右编号，Homework 中有从右向左编号，不能混用。
2. 编号 `1,2,4,8,…` 放 check bits，其余位置放 data bits。
3. 将位置 k 写成二进制；某一位为 1，就由对应 check bit 检查。
4. 按指定 even parity 或 odd parity 设置 check bits。

例如位置 11=`1011₂`=8+2+1，受 check bits 1、2、8 检查。

**Receiver 解码步骤：**重新检查各 parity group，把失败组对应的位置值相加，形成 **Syndrome**。在“至多一个 bit 错误”的条件下，非零 Syndrome 就是错误位置；翻转该 bit 即可恢复。

课件例：收到 `0xE4F = 1110 0100 1111`，从左编号并使用 even parity。只有 group 2 失败，因此翻转第 2 位：

- 修复后的完整 Codeword：`0xA4F`。
- 去掉位置 1、2、4、8 的 check bits，得到 data：`0xAF`。

**易错：**group 2 失败不等于任何情况下都是 check bit 2 坏了；只有单错假设成立时，Syndrome 才可靠定位。普通 d_min=3 Hamming code 可选择检测双错，但若执行单错纠正算法，双错可能被误纠正。需要同时实现 SECDED 时，通常扩展一个整体 parity bit，得到 d_min=4。

#### Convolutional code

输出依赖当前和过去的输入，Encoder 有 memory，常用 shift registers 实现。

- **Code rate** 为每次输入 bit 数与输出 bit 数之比。
- **Constraint length** 在课件实例中取 K=registers+1=7，包含当前输入与 6 个过去输入。
- 课件 rate=1/2 的编码器：输入 `111`，初始 state 为全零，输出依次为 `11、10、01`。
- 具体输出取决于 generator/tap 配置，不是所有 Convolutional codes 都产生这个序列。

![Convolutional code 编码器示例，PDF 第 32 页](Chapter3-page-032.png)

#### Reed-Solomon code

**RS(N,K,m)** 按 symbol 处理：每个 symbol 有 m bits，Codeword 有 N symbols，其中 K 个携带信息，N−K 个为冗余。完整长度常取 `N=2^m−1`，也可使用缩短码。

- 未知错误位置：最多纠正 `floor((N−K)/2)` 个 symbol errors。
- 已知错误位置，即 **Erasures**：最多恢复 N−K 个 symbols。
- 混合条件：`2e+s ≤ N−K`，e 为未知位置 errors，s 为 erasures。
- 适合 Burst errors；不要把 symbol 数直接当成 bit 数。

#### LDPC

**Low-Density Parity-Check code** 是由稀疏 parity-check matrix 定义的 Linear block code，使用迭代解码，适合较大 block，具有较强纠错能力。

课件用“每个输出只涉及少量输入”作直观描述；严谨的稀疏性定义落在 parity-check matrix 上，并不要求 generator matrix 同样稀疏。

#### Detection + Retransmission 与 Correction 对比

低差错率且能方便重传时，检错加重传可能更省冗余；高延迟、缺少反馈或不宜重传时，纠错更有价值。

课件估算：1000 个 block，每个 1000 data bits，bit error rate 为 10⁻⁶，期望约 1 个错误。

- 单错纠正：每 block 10 check bits，总计 10000 bits。
- 单错检测加一次重传：1000 parity bits 加一个 1001-bit block，约 2001 bits。

这是简化的期望开销比较，不是“必然恰好发生一错”的结论；真实协议还要考虑 ACK、Header 和 Timeout 开销。

### 2.4 Error-detecting codes

#### Parity 与 Interleaving

**Parity bit** 使整个组中 `1` 的数量保持 even 或 odd。

**Interleaving** 将相邻传输 bits 分散到不同校验组，使短 Burst 不至于集中破坏同一组。按课件矩阵安排，长度不超过列数的单个 Burst 至多在每列造成一个错误，因此可由逐列 parity 检出。此保证依赖具体排列与 Burst 模型。

![Parity interleaving，PDF 第 40 页](Chapter3-page-040.png)

#### Checksum

把数据划分为固定宽度 words，通过加和形成校验值。不同 Checksum 定义不同。

- 课件给出普通 modulo sum 的一般思路。
- **Internet checksum** 使用 16-bit one's-complement sum：最高位产生的 carry 回加到最低位，再对结果取反。
- Receiver 按同样规则求和，包括 checksum，合法结果通常为全 `1`。
- 某些有规律的变化可能保持校验值不变，因此不能检测所有差错。

#### CRC（Cyclic Redundancy Check）

把 bit string 看成 GF(2) 上的 polynomial。例如 `110001` 对应 `x^5+x^4+1`。加减都使用 **XOR**，没有 carry 或 borrow。

设 data 对应 M(x)，Generator polynomial 为 G(x)，其 degree 为 r。

**Sender：**

1. 给 data 尾部补 r 个 `0`，对应 `x^r M(x)`。
2. 用 G(x) 作 modulo-2 division，得到 r-bit remainder R(x)，不足 r bits 时补前导零。
3. 用 remainder 替换补入的零：`T(x)=x^r M(x)+R(x)`。

**Receiver：**用 G(x) 除完整接收 Frame。余数非零表示检测到差错；余数为零表示未检测到差错，不能证明绝对无错。

课件例：data=`1101011011`，G=`10011`，r=4，remainder=`1110`，发送 `11010110111110`。

![CRC modulo-2 division，PDF 第 46 页](Chapter3-page-046.png)

**检错能力：**接收结果为 T(x)+E(x)，由于 T(x) 可整除，是否漏检取决于 E(x) 是否被 G(x) 整除。

- 通常使用常数项为 1、且不止一个非零项的 G(x)，可检测所有单 bit errors。
- 检测所有 double-bit errors 需要在允许的 bit 间距范围内，G(x) 不整除 `x^k+1`。
- G(x) 含因子 x+1 时，可检测所有奇数个 bit errors。
- degree 为 r 且常数项为 1 的 G(x)，可检测所有长度 ≤r 的 Burst errors。
- 更长随机 Burst 的漏检概率通常约为 2⁻ʳ；这依赖随机错误模型，不是任意错误模式的保证。

## 3. Elementary Data Link Protocols

### 3.1 协议运行模型

课件把 Physical Layer、Data Link Layer、Network Layer 看作独立进程，以事件传递协作。Sender 取 Packet、封装 Frame、发送；Receiver 等待事件，校验和解析 Frame，再向上交付 Packet。课件假设机器本身不会崩溃。

### 3.2 Protocol 1: A Utopian Simplex Protocol

- 数据单向传输，即 **Simplex**。
- Channel 不损坏、不丢帧；两端永远 ready；处理时间忽略；缓存无限。
- Sender 不断发送，Receiver 不断向上交付。
- 无 Flow control，也无需错误恢复。它是逐步建立协议的理想基线。

### 3.3 Protocol 2: A Simplex Stop-and-Wait Protocol

仍为 error-free channel，但 Receiver 可能忙或缓存有限。

**Stop-and-Wait**：Sender 发一帧后停止，收到 Receiver 允许继续的 ACK 才发送下一帧。同时最多有一个 Outstanding frame。

- 新增 Flow control。
- 本协议没有应对丢帧的机制，因为仍假设信道无错。
- 数据单向不意味着没有反向控制信息。

![Stop-and-Wait 正常过程，PDF 第 63 页](Chapter3-page-063.png)

### 3.4 Protocol 3: A Simplex Protocol for a Noisy Channel

取消 error-free 假设，加入 **ARQ（Automatic Repeat reQuest）**，课件也称 **PAR（Positive Acknowledgement with Retransmission）**。

关键机制：ACK、Timer、Retransmission、Sequence number。

- Data 丢失：Timer 到期，重发当前 Frame。
- ACK 丢失：Sender 重发，Receiver 识别为重复 Frame，丢弃重复数据并重新 ACK。
- Sequence number 只需 1 bit，交替使用 0、1，即 **Alternating-bit protocol**。
- “只需 1 bit”的结论建立在标准 Stop-and-Wait 的顺序和旧副本寿命假设上，不能处理无限滞留的任意旧副本。

![ACK 丢失与重复帧处理，PDF 第 70 页](Chapter3-page-070.png)

### 3.5 Protocol 4: A One-bit Sliding Window Protocol

双方都可发送数据，即 **Duplex**。每个方向仍采用 Stop-and-Wait，Sender window 和 Receiver window 均为 1。

**Piggybacking**：把 ACK 放在准备向对方发送的 Data frame 中，减少独立 ACK 的开销。不能无限等待反向数据；实际协议通常设置 ACK delay timer，必要时单独发 ACK。

Frame 中 `seq` 描述本方向发送数据的编号，`ack` 描述对反方向数据的确认，它们是两个独立方向的状态。

课件用 `(seq, ack, packet)` 表示帧，`*` 表示 Packet 被交付 Network Layer。双方同时启动时，课件实现可能产生较多重复 Frame，但重复 Frame 不应重复向上交付。

### 3.6 Protocol 1–4 对比

| Protocol | 数据方向 | 信道假设 | 主要新增能力 |
|---|---|---|---|
| 1 | Simplex | Error-free | 理想化直接传输 |
| 2 | Simplex | Error-free | Stop-and-Wait Flow control |
| 3 | Simplex | Noisy | Timeout、Retransmission、编号与去重 |
| 4 | Duplex | Noisy | 双向 Stop-and-Wait、Piggybacking |

## 4. Sliding Window Protocols

### 4.1 为什么需要 Sliding Window

Stop-and-Wait 每发一帧就等待 ACK。若传播延迟很大，Channel 大部分时间空闲。

**Sliding Window** 允许在 ACK 返回前连续发送多个 Frame，即 **Pipelining**，提高链路利用率。

- **Outstanding frames**：已发送但尚未确认的 Frame。
- **Sender window**：约束允许使用的 Sequence numbers，以及最多未确认的 Frame 数量。
- **Receiver window**：约束当前可接受的 Sequence numbers。
- ACK 推动窗口向前移动，释放 Sender buffer；序号按 modulo 运算循环。

**课件术语提醒：**图中“window shrinks”描述可继续发送的位置减少。许多教材用固定最大窗口 W 表示“已发送未确认 + 尚可发送”的总范围。答题应区分最大窗口大小、Outstanding 数量与剩余发送名额。

![Sender window 的变化，PDF 第 86 页](Chapter3-page-086.png)

### 4.2 Cumulative acknowledgement

**Cumulative ACK** 一次确认连续收到的一段 Frame。必须先明确 ACK 编号约定：

- 若 ACK n 表示“n 已收到”，则同时确认连续到 n 为止的 Frame。
- 若 ACK n 表示“Next expected frame”，则确认连续到 n−1 为止的 Frame。

例如采用 Next expected 约定，收到 ACK 3 表示 Frame 0、1、2 已连续正确接收，下一帧期望 3。序号回绕时，要结合窗口判断，不能只作普通整数比较。

### 4.3 Utilization 与窗口计算

定义 L=Frame bits，B=bit rate，T_f=L/B，T_p=单程 propagation delay，T_a=ACK transmission time。

忽略处理时间、差错、其他等待，且 ACK 可立即返回：

- **Stop-and-Wait：**`U = T_f / (T_f+2T_p+T_a)`。
- ACK 很短时，取 `RTT=2T_p`：`U = T_f / (T_f+RTT)`。
- **Sliding Window：**`U ≈ min(1, W T_f/(T_f+RTT))`。
- **达到满利用率所需窗口：**`W_min = ceil(1+RTT/T_f)`。

若 RTT 已包含 Frame/ACK 的发送或处理时间，就不能重复加这些时间。Piggybacking 还可能引入等待反向数据的延迟，实际利用率可以低于上述理想上限。

**Bandwidth-delay product** B×T_p 表示单程传播中容纳的 bits；按 Frame 数表示为 B×T_p/L。满利用率窗口要覆盖整个反馈周期，因此通常涉及 B×RTT，而不只是单程 delay。

### 4.4 Protocol 5: Go-Back-N ARQ（GBN）

- Sender window 为 W，可连续发送多帧；Receiver window=1。
- Receiver 只接收下一帧期望的 Frame，丢弃 Out-of-order frames。
- 使用 Cumulative ACK。
- 某帧超时，重传从最早未确认 Frame 起的所有已发送未确认 Frame。
- Sender 保存未确认 Frame；典型实现针对最早未确认 Frame 维护 Timer。

例：0、1、2、3、4 中 Frame 2 丢失。Receiver 可交付 0、1，但丢弃提前到达的 3、4。Sender 随后重发 2、3、4。

![Go-Back-N ARQ，PDF 第 92 页](Chapter3-page-092.png)

**k-bit Sequence number：**序号空间 M=2^k，最大 `W_s ≤ 2^k−1`。不能把整个序号空间都用作 Sender window，否则 ACK 全丢失后的旧帧可能与下一轮新帧混淆。

### 4.5 Protocol 6: Selective Repeat ARQ（SR）

- Receiver 可以接收并缓存窗口内的 Out-of-order frames。
- 对缺失或超时的 Frame 选择性重传，而非重传所有后续 Frame。
- 补齐缺口后，将连续的数据按序交付 Network Layer。
- 需要更多 Receiver buffer、状态以及通常按帧维护的计时信息。

例：Frame 2 丢失，3、4 可暂存。只重传 2；2 到达后再按序交付 2、3、4。

![Selective Repeat ARQ，PDF 第 94 页](Chapter3-page-094.png)

**课件使用对称窗口：**`W_s=W_r=W ≤ 2^(k−1)`，即窗口不能超过序号空间的一半，防止旧 Frame 落入新接收窗口后被当作新数据。

在采用不同发送/接收窗口的通用模型中，通常要求 `W_s+W_r ≤ 2^k`。计算题按具体协议模型使用。

### 4.6 三种 ARQ 对比

| 特性 | Stop-and-Wait | GBN | SR |
|---|---|---|---|
| Sender window | 1 | ≤2^k−1 | 对称时 ≤2^(k−1) |
| Receiver window | 1 | 1 | 对称时等于 Sender window |
| Out-of-order frames | 不缓存 | 丢弃 | 窗口内缓存 |
| 重传范围 | 当前 Frame | 缺口起所有未确认 Frame | 对应丢失/超时 Frame |
| 实现复杂度 | 低 | 中 | 高 |
| 适用理解 | 简单、长延迟效率低 | 流水发送，差错可能带来重复传输 | 节省重传，增加缓存和管理成本 |

## 5. Example Data Link Protocols

### 5.1 PPP（Point-to-Point Protocol）

课件以 **Packet over SONET** 和 **ADSL** 为例说明 PPP 在不同物理承载上的使用。

PPP 的三项核心功能：

1. **Framing 与 Error detection**：识别 Frame 边界并通过 FCS 检错。
2. **LCP（Link Control Protocol）**：建立、配置、测试和终止链路。
3. **NCP（Network Control Protocol）**：协商特定 Network Layer protocol 的参数，不同网络层协议使用不同 NCP。

### 5.2 PPP Frame format

课件给出的未编号基本格式为：

`Flag | Address | Control | Protocol | Payload | FCS | Flag`

| 字段 | 含义 |
|---|---|
| Flag | `01111110`，标记边界 |
| Address | 基本格式为 `11111111`，点对点链路通常不需要复杂寻址 |
| Control | 基本格式为 `00000011`，未编号信息帧 |
| Protocol | 指明 Payload 的协议类型，如 IP、LCP、NCP |
| Payload | 可变长度，受协商参数约束 |
| FCS | CRC 检错值 |

![PPP Frame format，PDF 第 100 页](Chapter3-page-100.png)

**复习重点：**课件的基本 PPP 未编号模式提供检错，但不提供 GBN/SR 式可靠重传、编号去重或滑动窗口 Flow control。检测到损坏通常丢弃，由上层承担必要的恢复。

### 5.3 PPP 链路生命周期

简化顺序：**Physical connection → LCP negotiation → 必要时 Authentication → NCP configuration → Data transfer**。

释放通常按相反层次处理：关闭网络层配置，再终止链路，最后释放物理连接。课件状态图用于说明阶段转换，并非每次都需要认证。

![PPP 状态转换，PDF 第 101 页](Chapter3-page-101.png)

**课件修正提醒：**NCP 不是 DHCP 或 NAT。IPCP 是 IPv4 对应的 NCP，可协商包括 IP address 在内的相关配置；DHCP、NAT 是不同机制。课件第 102 页括号中的 DHCP、NAT 不能当作 NCP 定义。

### 5.4 Packet over SONET

**SONET（Synchronous Optical Network）** 是同步光传输体系。课件通过协议栈与 Frame 关系说明：IP Packet 经 PPP 封装，再由 SONET 承载；不同层的 Frame/Packet 是逐层封装关系。

![Packet over SONET 协议栈与封装关系，PDF 第 98 页](Chapter3-page-098.png)

课件拨号建立连接的故事用于解释 PPP 阶段，不能理解为 SONET 光链路本身需要拨号 Modem。

### 5.5 ADSL

**ADSL（Asymmetric Digital Subscriber Line）** 使用用户铜线接入，上下行速率不对称。课件标题中的 Loop 描述其所用 local loop，常用标准名称是 Line。

课件示例协议栈：`IP → PPP → AAL5 → ATM → ADSL`。

- **ATM（Asynchronous Transfer Mode）** 使用固定 53-byte cell：5-byte Header 加 48-byte Payload。
- **AAL5（ATM Adaptation Layer 5）** 把较长上层数据组织为含 Padding 和 Trailer 的 PDU，再划分到多个 ATM cell Payload 中；接收端重组。
- 不要理解为“一个 PPP Frame 必须恰好对应一个 ATM cell”。
- 这是课件展示的 ATM-based ADSL 架构，不能推断所有 DSL 接入均使用同一协议栈。

![ADSL 协议栈，PDF 第 104 页](Chapter3-page-104.png)

![AAL5 承载 PPP 数据，PDF 第 105 页](Chapter3-page-105.png)

## 6. Typical Calculations and Review Checklist

### 6.1 Utilization 例题

**课件第 82 页：**

1. 1-km link，T_p=5 μs，L=4000 bits，B=10 Mbps。
   - T_f=400 μs。
   - 忽略 ACK 长度：U=400/(400+10)≈**97.56%**。
   - ACK=100 bits：T_a=10 μs，U=400/(400+10+10)≈**95.24%**。
2. Satellite link，T_p=270 ms，L=4000 bits，B=56 kbps。
   - T_f≈71.43 ms。
   - 忽略 ACK 发送时间：U=71.43/(71.43+540)≈**11.68%**。

**课件第 106–108 页 GBN 练习：**采用 ACK=Next expected 的约定，3-bit 序号，最大 W=7。

![GBN 双向传输练习，PDF 第 107 页](Chapter3-page-107.png)

- 图(a)：ACK 达到 3，因此确认收到的是 `S0,0、S1,0、S2,0`，共 3 帧。
- t₁ 时还有序号 3、4 两帧未确认，因此还能发送 5 个新 Frame。收到的 R0、R1 连续有效，R3 因缺少 R2 被丢弃，下一帧期望为 2。新发送 Frame 从 **S5,2** 到 **S1,2**，序号依次 5、6、7、0、1。
- 图(b)：ACK 2 确认到序号 1。S2,0 超时后需重传序号 2、3、4，共 3 帧。此时 R0、R1、R2 均已按序收到，重传帧携带最新 ACK=3，第一帧为 **S2,3**。重传 Payload 保留，Piggyback ACK 可更新。
- L=1000 bytes=8000 bits，B=100 Mbps，T_f=0.08 ms，RTT=0.96 ms。
- 理想最大 U=7×0.08/(0.96+0.08)≈**53.85%**；题中若有额外 Piggyback 等待，应另计。

### 6.2 CRC 练习

课件 Homework：data=`110111011011`，G(x)=x⁴+x+1，即 G=`10011`。

- r=4，先补 4 个 `0`。
- Modulo-2 division 的 remainder=`0101`。
- 最终发送 Frame：**`1101110110110101`**。

### 6.3 从链路参数求 Sequence number bits

步骤：先算 RTT 和 T_f，再算 W_min，最后用 GBN/SR 的序号限制求 k。

课件第 111 页：3000 km，传播时间 6 μs/km，B=1.536 Mbps，L=64 bytes。

- 单程 T_p=18 ms，RTT=36 ms。
- T_f=512/1536000 s≈0.3333 ms。
- W_min=ceil(1+36/0.3333)=109。
- GBN：2^k−1≥109，最少 **7 bits**。
- SR 对称窗口：2^(k−1)≥109，最少 **8 bits**。

此处按题目忽略 ACK 与处理时间，目标为无差错条件下维持满利用率。

### 6.4 考前检查

- 能区分 Packet、Frame、bit stream，以及相邻链路可靠与端到端可靠。
- 能解释三类 Service 中 Connection 与 ACK 的区别。
- 能对 FLAG、ESC 做 Byte stuffing，并对跨 byte 的 bit stream 做 Bit stuffing。
- 能用 d_min 判断检测/纠正的保证范围。
- 能用 2^r≥m+r+1 求 Hamming check bits，并按题目方向计算 Syndrome。
- 能区分 bit error、symbol error 与 erasure。
- 会做 CRC XOR division，并知道零余数不等于绝对无错。
- 能解释 ACK 丢失时为何需要 Sequence number，以及为何重复 Frame 仍需 ACK。
- 能先确认 ACK number 的语义，再追踪窗口与 Outstanding frames。
- 熟记 GBN：W_r=1、W_s≤2^k−1；SR 对称时：W≤2^(k−1)。
- Utilization 先统一 bits/bytes、ms/s，RTT 与单程 delay 不混用。
- 能说明 PPP 的 Framing、LCP、NCP 三项功能，并识别 NCP 与 DHCP/NAT 的区别。

