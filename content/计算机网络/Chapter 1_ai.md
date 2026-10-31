---
title: Chapter 1 · AI 精讲
aliases:
  - 计算机网络/notes/Chapter 1_ai
---
# INTRODUCTION（计算机网络概述）

## 1. Uses of Computer Networks

### 1.1 Computer network 与 Distributed system

- **Computer network**：互联的、具有自主性的计算设备集合，重点是设备之间如何通信。
- **Distributed system**：多个自主计算机通过软件协作，对用户呈现一个一致的整体，重点是资源协调与统一抽象；常依赖 Middleware。
- **Internet** 是 network of networks；**Web** 是运行在 Internet 上的信息服务系统。
- **Internet ≠ Web**：Email、文件传输等也可运行在 Internet 上，Web 只是其中一种应用。

### 1.2 Access to Information

**Client-server model**：Client 发 Request，Server 提供服务并返回 Reply/Response。角色取决于一次交互中的职责，不取决于设备大小。

![Client-server 的 Request/Reply](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%201_ai/page-005.webp)

**Peer-to-peer（P2P）model**：没有固定、统一的 Client/Server 角色，同一 Peer 可以请求资源，也可以提供资源。P2P 不意味着实际系统完全没有中心节点；可能仍使用集中发现或协调服务。

![P 模型](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%201_ai/page-006.webp)

| 比较维度 | Client-server | P2P |
|---|---|---|
| 角色 | 服务方与请求方通常较明确 | Peer 可同时承担两类角色 |
| 管理 | 集中管理方便 | 协调、发现和一致性更复杂 |
| 资源来源 | 主要由 Server 提供 | 可由众多 Peer 共同提供 |
| 主要挑战 | Server 容量、可用性 | Peer 动态加入退出、信任与资源定位 |

### 1.3 Person-to-Person Communication

包括 Email、Instant messaging、Internet audio/video、Tele-learning，以及融合内容访问和人际交互的 Social networks、Wiki。

复习时区分“应用目的”和“底层技术”：文字、音视频、协作可以共享同一网络基础设施，但时延、吞吐、丢失容忍程度不同。

### 1.4 Electronic Commerce

用网络完成商品、服务和信息交易。常见关系包括 B2B、B2C、C2C 等。关键不仅是传输数据，还涉及 Authentication、交易完整性、支付和服务可用性。

### 1.5 Entertainment and the Internet of Things

- **IPTV**、网络游戏等强调内容分发或实时交互。
- **Ubiquitous computing**：计算融入日常环境。
- **IoT（Internet of Things）**：物体通过感知、标识和通信参与网络。
- **RFID** 通过无线方式识别标签，不等于每个标签都直接运行 IP。
- **Sensor network** 可采用 Multihop：数据经多个节点转发到 Sink。设计要考虑能耗、无线链路、拓扑和路径测量。
-  iPath 示例用于展示 Wireless Sensor Network 中的 Path inference：根据已有观测推断传输路径，属于应用研究示例。

![Sensor network 的 Multihop topology](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%201_ai/page-011.webp)

## 2. Types of Computer Networks

此处按网络承担的角色分类；与按地理规模分类的 PAN/LAN/MAN/WAN 是不同维度。

| 类型 | 作用与理解 |
|---|---|
| Broadband Access Network | 把用户连接到运营商网络，列 Copper、Coaxial cable、Optical fiber |
| Mobile and Wireless Access Network | 支持无线接入和移动用户；Wireless 与 Mobile 不等价 |
| Content Provider Network | 支持内容或服务交付，常使用 CDN |
| Transit Network | 在不同网络之间提供转接，承担骨干传输角色 |
| Enterprise Network | 在公司、学校等组织内部共享数据与计算资源 |

### 2.1 Wireless 与 Mobile

- Wireless 描述接入介质：是否使用无线传播。
- Mobile 描述使用状态：通信终端是否在移动、是否需要移动性支持。
- 固定位置 WiFi 设备可 Wireless 但不 Mobile；移动过程中使用有线连接的特殊设备，也不能仅因 Mobile 就归为 Wireless。

### 2.2 CDN 与 ISP

**CDN（Content Delivery Network）** 将内容放到分布式节点，尽量靠近请求用户，以改善访问时延、减轻源站和远距离链路压力。

**ISP（Internet Service Provider）** 提供网络接入或相关互联服务。内容提供方与用户 ISP 未直接互联时，可通过 Transit Network 传递流量。

## 3. Network Technology, from Local to Global

### 3.1 PAN、LAN、MAN、WAN、Internetwork

| 类别 | 典型范围/对象 | 示例 | 核心理解 |
|---|---|---|---|
| PAN（Personal Area Network） | 人周围的设备 | Bluetooth、RFID | 短距离个人设备连接 |
| LAN（Local Area Network） | 建筑、校园等局部范围 | Ethernet、WiFi | 范围较受限，便于局部管理 |
| MAN（Metropolitan Area Network） | 城市范围 | Cable TV-based network、WiMAX | 城域互联 |
| WAN（Wide Area Network） | 跨城市、地区、国家 | ISP backbone、Satellite、Cellular | 大范围传输与路由 |
| Internetwork | 多个网络互联 | LAN 经 WAN 互联 | 跨管理域或技术的网络集合 |

范围是帮助理解的典型值，不是严格的公里数分界。MAN 不必使用广播介质；示例的广播描述针对其举例架构。

### 3.2 LAN 与 Channel allocation

- Wired LAN：本节以 Switched Ethernet 为例。
- Wireless LAN：本节以 IEEE 802.11 为例。
- Home network 本质上通常是一个 LAN，可使用 WiFi、Ethernet 或 Power-line networking。
- **Static allocation**：预先分配时隙等资源，例如 Round-robin。
- **Dynamic allocation**：按当前需求安排，可由中央控制，也可分布式竞争。

![Wireless LAN 与 Switched Ethernet](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%201_ai/page-021.webp)

**易错：**经典共享 Ethernet 和现代 Switched Ethernet 的接入条件不同；不能把所有 LAN 都想成“所有设备共享一根线、必然碰撞”。

### 3.3 WAN 与 Communication subnet

传统模型：**WAN = Hosts + Communication subnet**；**Communication subnet = Transmission lines + Routers**。

- **Host / End system** 运行用户程序。
- **Transmission line** 传输 bits。
- **Router / Switching element** 根据目的和路由选择输出链路，转发 Packet。
- 路径上 Packet 可能经历多个 Router。

![WAN 连接分支机构](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%201_ai/page-027.webp)

**术语提醒：**这里的 Communication subnet 是通信基础设施，不是 IP addressing 中的 IP subnet。“Router 连接三条或更多线路”是典型示意，不是 Router 的必要定义。

WAN 中 End systems 和通信基础设施常由不同主体管理，也可连接整个 LAN。所有权差异是常见情况，不是 WAN 的严格定义条件。

### 3.4 VPN、SD-WAN 与 Internetwork

- **VPN（Virtual Private Network）**：在共享基础设施上建立逻辑私有连接；是否加密取决于 VPN 类型及实现，不能仅由名称判断。
- **SD-WAN**：通过软件控制和策略管理多个 WAN 连接，是这里列出的 WAN 形态之一。
- **internet**：泛指互联网络；**Internet**：通常专指全球 Internet。

![VPN 的逻辑连接](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%201_ai/page-032.webp)

## 4. Example Networks

### 4.1 Mobile Networks

基本结构：**Mobile device → Air interface → Radio Access Network（RAN）→ Core network → 外部网络**。

- **Cellular design** 将覆盖区域划分为 Cells，协调频谱资源，并通过空间隔离实现 Frequency reuse。
- **Handover / Handoff**：移动用户从一个服务 Cell 切换到另一个，尽量保持通信连续。
- **UMTS** 是讨论的 3G 系统，不能作为所有 Cellular networks 的统称。
- 3G 示例：Node B 与 RNC 组成接入侧，Core 支持 Circuit/Packet 业务。
- 4G LTE 示例：E-UTRAN 以 eNodeB 为接入节点，EPC 为 Packet-switched core；这里列出 S-GW、P-GW 等网关。

![3G 架构](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%201_ai/page-036.webp)

![4G LTE 架构](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%201_ai/page-037.webp)

![Handover 前后](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%201_ai/page-041.webp)

**易错：**不要将 3G 的 RNC 机械套到 LTE 中；无线接入、核心网、移动性管理是不同层次的职责。

### 4.2 Wireless Networks（WiFi）

- **Infrastructure mode**：通过 Access Point（AP）组织无线通信。
- **Ad hoc mode**：节点直接组成网络，不依赖同样的固定 AP 架构。
- **Multipath fading**：不同传播路径的信号叠加造成增强或衰落，影响解码。
- **CSMA（Carrier Sense Multiple Access）**：发送前监听信道；无线中“本地听不到发送者”不代表 Receiver 不会遭到干扰。
- **Hidden terminal**：两个发送节点互相听不到，却可能同时干扰同一个接收节点。因此仅靠 Carrier sensing 无法消除所有冲突。

![WiFi Infrastructure 与 Ad hoc](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%201_ai/page-043.webp)

![Hidden terminal](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%201_ai/page-045.webp)

## 5. Network Protocols

### 5.1 Design goals

| 目标 | 相关机制 | 通俗理解 |
|---|---|---|
| Reliability | Error detection、Error correction、必要的恢复 | 尽量正确交付 |
| Resource allocation | Flow control、Congestion control、QoS | 协调有限资源 |
| Evolvability | Protocol layering、明确边界 | 便于替换与扩展 |
| Security | Confidentiality、Authentication、Integrity | 保密、核验身份、防止未授权修改 |

**Flow control** 防止 Receiver 来不及处理；**Congestion control** 应对网络路径中的资源拥塞。**QoS（Quality of Service）** 涉及吞吐、时延、抖动、丢失等服务特性。

### 5.2 Protocol layering

- **Layer** 提供某类职责，使用下层服务，并向上层提供服务。
- **Peer entities** 是不同设备上的同层实体。
- **Protocol** 规定 Peers 之间交换消息的格式、含义和操作规则。
- **Interface** 规定本机相邻层之间如何请求与使用服务。
- **Network architecture** 描述层及其协议组织；实现细节不等同于架构。
- **Protocol stack** 是系统实际使用的协议组合。

优点：降低复杂度、模块化、便于独立演进和互操作。代价：额外 Header、处理开销，或不同层重复执行类似功能。

### 5.3 Encapsulation 与 Virtual communication

应用产生 Message，向下各层添加控制信息；Data Link Layer 可同时添加 Header 和 Trailer。接收端逐层解析与去封装。

**典型关系：Application data → Transport segment/datagram → IP Packet → Link Frame → bits**。

![Encapsulation 与 Peer 的逻辑通信](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%201_ai/page-053.webp)

- **Frame encapsulates Packet**，不是反过来。
- Peers 是逻辑上直接通信；实际数据通常必须经本机下层、介质与对方协议栈。
- 路径中的 Router 通常处理到 Network Layer，逐跳换用 Link Frame；Transport 通常提供端系统间服务。

### 5.4 Connections and Reliability

| 维度 | 类型 | 理解 |
|---|---|---|
| 连接组织 | Connection-oriented | 通信前建立相关状态，使用后释放 |
| 连接组织 | Connectionless | 无须事先建立同样的连接，独立处理消息 |
| 交付保证 | Reliable | 按所承诺的可靠性机制交付，必要时确认与恢复 |
| 交付保证 | Unreliable / Best-effort | 不承诺恢复所有损坏或丢失 |

**Connection 与 Reliability 不等价。** 无连接服务可以带 ACK；“有连接”也不能推出每个层次都承担可靠重传。

- **Message sequence** 保留 Message boundaries。
- **Byte stream** 交付有序字节流，不保留应用一次发送的边界。
- TCP：Reliable、Connection-oriented、Byte stream。
- UDP：Connectionless、Datagram；协议自身不保证交付、顺序或去重。“Unreliable”描述保证范围，不意味着每个 UDP datagram 都会出错。

### 5.5 Service Primitives

**Service primitive** 是上层调用下层服务的操作。简单 Connection-oriented 模型包括 LISTEN、CONNECT、ACCEPT、RECEIVE、SEND、DISCONNECT。

![Service primitives](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%201_ai/page-056.webp)

Berkeley Sockets 的示例流程：

- Server：`SOCKET → BIND → LISTEN → ACCEPT → RECEIVE/SEND → CLOSE`。
- Client：`SOCKET → CONNECT → SEND/RECEIVE → CLOSE`。
- BIND 将本地地址与 Socket 关联；ACCEPT 接受传入连接；CONNECT 主动发起连接。

![Socket primitives](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%201_ai/page-097.webp)

这些是接口层操作，不是“每次调用就恰好对应一个线上的 Packet”。

### 5.6 Services vs. Protocols

| 概念 | 描述对象 | 方向 |
|---|---|---|
| Service | 本层向上层提供什么能力 | 本机层间的纵向关系 |
| Interface | 上层如何使用这些能力 | 本机层间边界 |
| Protocol | Peers 如何交换消息以实现服务 | 跨设备同层的横向关系 |

![Service 与 Protocol 的区别](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%201_ai/page-058.webp)

类比：Service 像对象提供的操作，Protocol 像实现这些操作所需的交互规则。保持 Service 稳定时，下面的 Protocol implementation 可以改变。

## 6. Reference Models

### 6.1 OSI Reference Model

**OSI（Open Systems Interconnection）** 是七层 Reference model。设计原则：每层职责明确，在需要不同抽象处设层，接口跨层信息尽量少，层数适中。

| Layer | 核心职责 | 复习关键词 |
|---|---|---|
| 7 Application | 向应用提供通信相关功能 | HTTP、DNS、SMTP 等 |
| 6 Presentation | 数据表示、语法与语义转换 | Encoding、统一表示、Big/Little endian |
| 5 Session | 管理会话与对话 | Dialog control、Token、Synchronization |
| 4 Transport | End-to-end 传输服务 | 连接/复用、分段、Flow control，视协议提供可靠性 |
| 3 Network | 跨网络转发与路径选择 | Routing、Addressing、异构网络互联 |
| 2 Data Link | 一跳链路上的 Frame 传输 | Framing、Error detection、Flow control、MAC |
| 1 Physical | 把 bits 表示为物理信号并传送 | 电气、机械、时序、介质接口 |

![OSI 七层与中间 Router](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%201_ai/page-063.webp)

**注意：**职责表描述模型，不是所有协议都具备所有保证。Data Link Layer 不一定实现可靠重传，Transport Layer 也不一定保证可靠交付，UDP 就是例子。

### 6.2 TCP/IP Reference Model

本节使用四层：**Application → Transport → Internet → Link**。

- Application 合并 OSI 上三层的许多功能。
- Transport 典型为 TCP、UDP。
- Internet 典型为 IP，提供 Connectionless、Best-effort Packet 传输。
- Link 描述 IP 如何借助具体链路发送；原始模型没有清楚分开 Data Link 与 Physical。

![OSI 与 TCP/IP 层次对应](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%201_ai/page-072.webp)

![TCP/IP 与示例协议](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%201_ai/page-073.webp)

### 6.3 OSI 与 TCP/IP 比较

| 比较 | OSI | TCP/IP |
|---|---|---|
| 形成方式 | 先模型，再发展协议体系 | 先有实际协议，再总结模型 |
| 层数 | 7 | 本节模型为 4 |
| Service/Interface/Protocol | 明确区分 | 早期模型区分不如 OSI 明确 |
| 应用侧 | Session、Presentation、Application 分开 | 通常归到 Application |
| 底部 | Data Link 与 Physical 分开 | 归到 Link 范围 |
| 教学与实践 | 模型用于解释分层 | 协议体系广泛用于实际互联网 |

概括 OSI network service 可面向连接或无连接，TCP/IP 的 IP 为无连接；TCP/IP transport 可选 TCP 或 UDP。不要用“TCP”指代整个 TCP/IP model。

### 6.4 Critiques 与 Hybrid Model

- 对 OSI 推广的历史评价：Bad timing、Bad technology、Bad implementations、Bad politics。要区分 OSI model 的教学价值与当时 OSI protocol suite 的部署结果。
- TCP/IP model 的局限：对 Service/Interface/Protocol 区分不充分、Link 抽象较粗、不明确分离 Physical 与 Data Link，某些既有协议难以替换。
- 本课程 **Hybrid / Five-layer model**：**Application、Transport、Network、Data Link、Physical**。

![本课程 Five-layer model](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%201_ai/page-084.webp)

## 7. Standardization

### 7.1 为什么需要标准

让不同厂商设备互操作，减少技术碎片化，扩大兼容产品市场。代价是协调耗时，既有标准也可能限制快速变化。

- **De facto standard**：通过广泛采用形成的事实标准。
- **De jure standard**：经正式标准组织或规定程序确立；不应把每一项都理解为法律强制要求。

### 7.2 主要组织

| 组织 | 关注的职责 |
|---|---|
| ITU（International Telecommunication Union） | 电信协调；ITU-R、ITU-T、ITU-D 分别关注无线电、标准化、发展 |
| ISO（International Organization for Standardization） | 国际标准化组织，与 OSI 等标准有关 |
| IEEE（Institute of Electrical and Electronics Engineers） | 工程标准，重点为 IEEE 802 系列 |
| IETF（Internet Engineering Task Force） | Internet 工程与协议规范 |
| IRTF（Internet Research Task Force） | 较长期 Internet 研究 |
| IAB（Internet Architecture Board） | Internet 架构方面的指导与协调 |

**RFC（Request for Comments）** 是 Internet 技术文档系列；不是每份 RFC 都是 Internet Standard，还可能是 Informational、Experimental 等。

 IEEE 表重点记：**802.3 → Ethernet，802.11 → Wireless LAN**。该表包含历史项目，不应用作当前标准项目的完整清单。

## 8. Policy, Legal, and Social Issues

此处是网络技术的社会影响框架，不是具体法律意见。

- **Online speech**：表达、平台管理与内容责任。
- **Net neutrality**：不同类型或来源流量如何被对待。
- **Security**：DDoS、Spam 等影响网络和服务可用性。
- **Privacy**：用户 Profiling、Tracking、Location privacy。
- **Disinformation**：错误或虚假信息的传播与识别。

技术选择会影响谁能访问网络、谁承担成本以及数据如何被处理；不能只看吞吐量。

## 9. Metric Units and Typical Calculations

### 9.1 Units

- **b=bit，B=byte，1 B=8 b**。
- 网络速率常用十进制：1 kbps=10³ bps，1 Mbps=10⁶ bps，1 Gbps=10⁹ bps。
- 二进制容量严谨写法：1 KiB=2¹⁰ B，1 MiB=2²⁰ B；1 kB=1000 B。
- 这里把内存中的 kB 用作 1024 B，是历史习惯；计算时先确认题目约定。
- **1 MB/s=8 Mbps**，前提是 MB 使用十进制；1 MiB/s 则约 8.389 Mbps。

### 9.2 Transmission delay 与 Propagation delay

补充统一公式，帮助连接下一章：

- **Transmission delay**：`T_tx=L/R`，把 L bits 推上链路所需时间。
- **Propagation delay**：`T_prop=d/v`，信号传播 d 米所需时间。
- **Bit length**：`ℓ=v/R`，一个 bit 在介质上占据的空间长度。
- 高 bit rate 缩短 T_tx，不会自动提高信号传播速度 v。

### 9.3 计算例题

**Bit length：**R=10 Mbps，v=(2/3)c≈2×10⁸ m/s。

`ℓ=v/R=20 m`。

**图像传输：**1024×768 pixels，每 pixel 3 bytes，无压缩。

`L=1024×768×3×8=18,874,368 bits`。

| Link rate | L/R |
|---|---:|
| 56 kbps | 337.042 s |
| 1 Mbps | 18.874 s |
| 10 Mbps | 1.887 s |
| 100 Mbps | 0.189 s |

以上仅计算 Transmission delay，忽略 Headers、Propagation、Queueing 和 Processing。

**Header overhead：**题目明确七层各添加 20 bytes，应用数据 1000 bytes。

- Header 总计 140 B，线上总量 1140 B。
- Header fraction=140/1140≈**12.28%**；140/1000=14% 是相对 Payload 的比率，是另一种分母。
- 真实系统中 Physical Layer 不一定按该方式添加 20-byte Header；这里按题目的理想设定计算。

**Retransmission 次数：**每次 Frame 损坏概率 p，尝试独立、ACK 不丢、无限重试。

- 总发送次数的期望：**E[N]=1/(1−p)**，包含首次发送。
- 重传次数的期望：**E[N−1]=p/(1−p)**。

**Bernie 运磁带：**3×7 GB，以十进制 GB 计，共 168 Gbits；速度 18 km/h=5 m/s。与 150 Mbps 的无额外开销链路比较：

- 同等传输时间=168×10⁹/(150×10⁶)=1120 s。
- 同等距离=5×1120=**5600 m**；小于 5.6 km 时有效数据率更高，等于时持平。
- 速度翻倍或每盘容量翻倍，距离阈值翻倍至 11.2 km；链路速率翻倍，阈值减半至 2.8 km。
- 展示的是大批量运送的 Throughput 优势，不代表低 Latency 或实时通信优势。

## 10. Supplement: Socket and Web Server Experiments

后部介绍 Socket programming 与 Web server 实验，作为应用层与传输服务的连接示例。

- **Socket** 是程序使用网络服务的接口抽象。
- Web server 可由 Front end 接收请求，再交给 Worker/Processing modules，访问 Cache 或 Disk 后返回响应。
- **HTML** 表示文档结构；**HTTP** 规定请求与响应的交互，两者不是同一概念。
- 重点理解 GET 获取表示、HEAD 获取类似 GET 的响应头但不含响应内容、POST 提交处理、PUT 写入目标资源、DELETE 删除目标资源。
- 示例中的旧 HTML 标签和 HTTP 描述只作历史示例，例如 POST 不应被概括为仅“追加”，CONNECT 也不应被理解为只留作未来用途。

![多线程 Web server](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%201_ai/page-100.webp)

## 11. Review Checklist

- 能解释 Internet 与 Web、Computer network 与 Distributed system 的区别。
- 能区分按角色分类的网络与按规模分类的 PAN/LAN/MAN/WAN。
- 能解释 Communication subnet、IP subnet 与 Internetwork。
- 能解释 CDN、ISP、VPN、RAN、Core network 和 Handover 的角色。
- 能说明 Hidden terminal 为什么使 Carrier sensing 不足。
- 能区分 Service、Interface、Protocol，并解释 Encapsulation。
- 能区分 Connection 与 Reliability，说明 TCP 与 UDP 的服务特点。
- 能逐层说明 OSI，并对应 TCP/IP 四层与课程五层模型。
- 能解释 De facto/De jure 与 RFC 不必然等于标准。
- 会换算 bits/bytes、计算 L/R、d/v、v/R、Header fraction 和期望发送次数。
