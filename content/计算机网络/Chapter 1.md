---
title: Chapter 1
aliases:
  - 计算机网络/notes/Chapter 1
---
## Introduction
- 1.1 Uses of Computer Networks
- 1.2 Types of Computer Networks
- 1.3 Network Technology, from Local to Global
- 1.4 Example Networks
- 1.5 Network Protocols
- 1.6 Reference Models
- 1.7 Standardization
- 1.8 Policy, Legal, and Social Issues
- 1.9 Metric Units
## Uses of Computer Networks(NETWORK USAGE)
- 过去，计算机系统高度 **centralized（集中式）**。
- 如今，大量 autonomous（自治）计算机被 interconnected（互联）以协同完成任务 → Computer network（计算机网络） →Distributed systems（分布式系统）。
- **Computer network**​ vs **Distributed systems**​ 的区别：
	- **==Computer network==**：一组 **interconnected**、**autonomous**​ 的计算设备的集合。
	- **==Distributed systems==**：一组 **autonomous**​ 计算机在用户看来表现为一个单一的 coherent（内聚/一致）系统。核心关注 coherence（一致性）、model（模型）、implementation（实现，如 middleware 中间件）**。
	- 例子：**The Internet**​ 不是一个单一网络，而是 **a network of networks（网络的网络）**。**The Web**​ 是一个运行在 **The Internet**​ 之上的 **distributed system**。
- Access to Information
	Access to information comes in many forms, e.g. Web browser.![[Pasted image 20260923101815.webp]]![[Pasted image 20260923101837.webp]]
- Person-to-Person Communication
	![[Pasted image 20260923102026.webp]]
- Electronic Commerce
	![[Pasted image 20260923102018.webp]]
- Entertainment
	![[Pasted image 20260923101959.webp]]
- The Internet of Things
## Types of Computer Networks
- **Broadband Access Network**
	- In many parts of the world, broadband access is delivered to homes through copper (e.g., telephone lines), coaxial cable (e.g., cable), or optical fiber.
- **Mobile and Wireless Access Network**
	- Important for drivers
	- Important to military
	- Wireless and mobile are often related but not identical![[Pasted image 20260923102209.webp]]
- **Content Provider Networks(内容服务网络)**
	**CDN**(Content Delivery Network)​ 通过在全球范围 **geographically distributed**​ 部署大量 **servers**，将内容缓存到离用户更近的边缘节点，从而加速内容交付。大型内容提供商（如 **Google**、**Netflix**）通常自建 **CDN**，而第三方 **CDN**​ 服务商（如 **Akamai**、**Cloudflare**）则为中小网站提供 **hosting services**。
- **Transit Networks (转接网络/传输网络)**
	- 当内容提供商与你的 **ISP (Internet Service Provider)**​ 没有直接连接时，它们通常依赖一个 **transit network**​ 来承载彼此之间的流量。
	- **Transit networks**​ 传统上被称为 **backbone networks**，因为它们一直承担着在两个端点之间传输流量的角色。
- **Enterprise Networks(企业网络)**
	- 大多数组织（例如公司、大学）拥有许多计算机。通常情况下，这些机器连接在一个共同的网络上，这使得员工能够彼此共享数据、信息和计算资源。
- **Network Technology, from Local to Global**![[Pasted image 20260923102748.webp|595]]
	- **PAN (Personal Area Network)**：最小范围，覆盖个人设备（如蓝牙、USB 连接）。
		允许设备在个人物理范围内互联。典型应用包括通过 **Bluetooth**​ 连接外设（鼠标、键盘、打印机、耳机）以及通过 **RFID**​ 技术实现与物品的短距离通信。**PANs**​ 是一种极小规模的网络，专注于个人设备间的便捷、低功耗数据交换。
	- **LAN (Local Area Network)**：局部区域网络，如家庭、办公室或校园内的网络。
		它是私有网络，覆盖范围限于单个建筑或校园（通常几公里内），常见技术包括 **WiFi**​ 和 **Ethernet**。其特性主要有两点：一是规模受限使得最坏传输时间有界且可预知，从而简化网络设计和管理的某些设计；二是采用高速传输技术，速率可达 **10Gbps**。![[Pasted image 20260923103236.webp]]
		从MAC层的视角，阐述了广播型局域网（包括有线和无线）的信道资源分配方式，分为静态分配和动态分配两类。静态分配典型方法是TDMA思想，将时间划分为固定时隙，采用轮询调度，每个节点只在属于自己的时隙内发送。动态分配针对共享信道的冲突问题，分为集中式（由中心节点统一调度）和分布式（通过分布式算法自主协调，避免混乱）。核心专业名词：broadcast LANs, MAC, static allocation, dynamic allocation, time slots, round-robin algorithm, centralized, decentralized。
	- **MAN (Metropolitan Area Network)**：城域网，覆盖一个城市范围的网络。
		它是 **LAN**​ 的扩展版本，覆盖范围为一个城市，通常采用与 **LAN**​ 相似的技术。举例包括基于 **cable TV**、**IEEE 802.16 (WiMAX)**​ 和 **NB-IoT**。**MAN**​ 的关键特征是存在一个 **broadcast medium**，所有计算机都连接在这个介质上。核心专业名词：**MAN**、**LAN**、**cable TV**、**IEEE 802.16**、**WiMAX**、**NB-IoT**、**broadcast medium**。![[Pasted image 20260923103515.webp|553]]
	- **WAN (Wide Area Network)**：广域网，跨越国家或全球的大型网络。
		**WAN (Wide Area Network)**​ 的整体结构确划分为运行用户程序的 **hosts**（端系统）和负责纯通信的 **subnet**​ 两部分。子网进一步由两个核心组件构成：一是 **transmission lines**（传输线路，负责在机器间搬运比特），二是 **switching elements**​ 如 **routers**（交换元素/路由器，负责在多条线路间为数据选择转发路径）。核心专业名词：**WAN**、**hosts**、**end systems**、**subnet**、**transmission lines**、**circuits**、**channels**、**trunks**、**switching elements**、**routers**。![[Pasted image 20260923103641.webp|539]]
	- **Inter-networks**：互联网络，指多个网络相互连接而成的网络。需区分小写 **internet**（泛指任何由网络互联而成的网络）和大写 **Internet**（特指全球性的、基于 TCP/IP 的公共互联网）。
		它是由多个互连网络组成的集合，并特别区分了小写 **internet**​ 与大写 **Internet**​ 的差异。文章描述了互联网的一种常见形态：通过 **WAN**​ 将多个 **LAN**​ 连接起来。接着系统梳理了几个核心概念的逻辑关系：**WAN**​ 由 **subnet**​ 和 **hosts**​ 组成；**subnet**​ 由 **lines**​ 和 **routers**​ 构成；单一网络如 **LAN**；多个互连网络则形成 **internetworks**。最后点明互联网络的特征在于涉及不同的所有者和不同的技术。核心专业名词：**internetwork**、**internet**、**Internet**、**WAN**、**subnets**、**networks**、**internetworks**、**hosts**、**lines**、**routers**、**owners**、**technologies**。
	不同规模的网络采用不同的 **networking technologies**​ 实现，以适应各自的传输距离、带宽和延迟需求。
## Example Networks
- The Internet (see previous slide)
- Mobile Networks![[Pasted image 20260923112117.webp]]
	移动电话网络的蜂窝设计（**Cellular design of mobile phone networks**）——覆盖区域被划分为小区（**cells**）。在一个小区内，用户被分配的信道（**channels**）彼此不干扰，并且与其他相邻小区（**adjacent cells**）也不干扰。
- Wireless Networks (WiFi)
	![[Pasted image 20260923112243.webp]]![[Pasted image 20260923112257.webp]]![[Pasted image 20260923112303.webp]]
## Network Protocols
- Design goals
	- 可靠性（**Reliability**）：错误检测（**error detection**）、错误纠正（**error correction**）。
	- 资源分配（**Resource allocation**）：流量控制（**flow control**）/拥塞控制（**congestion control**）、服务质量（**QoS**）。
	- 可演化性（**Evolvability**）：协议分层（**protocol layering**）。
	- 安全性（**Security**）：机密性（**confidentiality**）、认证（**authentication**）、完整性（**integrity**）。
- Protocol layering
	- 大多数网络被组织为一组层或级别（**layers**​ 或 **levels**）的堆栈。
	- 下层通过接口（**interfaces**）为上层提供服务。
	- 当一台机器上的第 n 层与另一台机器上的第 n 层进行通信时，其规则和约定被称为第 n 层协议（**layer n protocol**）。
	- **five-layer network**
		![[Pasted image 20260923112610.webp|434]]
	- **Protocol hierarchies**
		- 协议（**protocol**）是通信双方关于如何进行通信所达成的约定。
		- 对等实体（**peers**）是构成不同机器上对应层的实体。这些对等实体可以是操作系统内核（**OS kernel**）、进程（**processes**）、硬件设备（**hardware devices**），甚至是人类（**human beings**）。正是对等实体通过使用协议进行通信。
		- 通信分为实际的（**actual**）和虚拟的（**virtual**）。
		- 服务接口（**Service interfaces**）：
			- 接口定义了下层向上层提供哪些基本操作（**primitive operations**）和服务。
			- 不同的主机使用不同的实现（**implementations**）是很常见的。
		- 一组层和协议被称为网络体系结构（**network architecture**）。
			- 体系结构的规范必须包含足够的信息以供实现（**implementation**）。
			- 实现细节（**impl details**）和接口规范（**specification of interfaces**）都不是体系结构的一部分。
		- 某个系统使用的一组协议，每层一个协议，被称为协议栈（**protocol stack**）。
		- 网络体系结构、协议栈以及协议本身是计算机网络的主要主题。![[Pasted image 20260923113034.webp]]![[Pasted image 20260923113052.webp]]
- Connections and Reliability
	- 两种主要类型：
		- 面向连接的服务（**Connection-oriented service**）：模仿电话系统（**telephone system**）
		- 无连接的服务（**Connectionless service**）：模仿邮政系统（**postal system**）
	• 每种服务还可以根据其可靠性（**reliability**）进一步分类
		- 可靠的（有确认的，**Reliable (acked)**）面向连接服务 -> 消息序列（**message sequences**）和字节流（**byte streams**）
- Service Primitives
![[Pasted image 20260923113303.webp]]
![[Pasted image 20260923113327.webp]]![[Pasted image 20260923113339.webp]]
- **Services vs. protocols**
	![[Pasted image 20260923113406.webp]]
	服务（**==service==**）是一组原语（**primitives**，即操作），由一层提供给它的上一层。
	协议（**==protocol==**）是一组规则，管理着对等实体（**peer entities**）在层内交换的数据包（**packets**）或消息（**messages**）的格式和含义。参考：协议是通信双方关于如何进行通信所达成的约定。
- The Relationship of Services to Protocols
- 参考模型（**REFERENCE MODELS**）
	- **OSI (Open Systems Interconnection) Reference Model**；
	- **The TCP/IP Reference Model**；
	- **A Comparison of OSI and TCP/IP**——包括对 OSI 模型和协议的批评（**A Critique of the OSI Model and Protocols**）和对 TCP/IP 参考模型的批评（**A Critique of the TCP/IP Reference Model**）。
	- **OSI (Open Systems Interconnection) Reference Model**
		- 设计原则
		1. 需要在不同的抽象层次时，应创建相应的层。
		2. 每一层都应执行一个定义明确的功能。
		3. 选择每一层的功能时，应考虑定义国际标准化的协议。
		4. 层边界的选择应使跨越接口的信息流最小化。
		5. 层的数量应：  
		    – 足够多，使得不同的功能不必因为需要而被勉强放在同一层中；  
		    – 又足够少，使得体系结构不会变得笨拙。
		![[Pasted image 20260923115136.webp]]
		- 物理层（**Physical layer**）：关注如何在通信信道上传输原始比特（**raw bits**）。设计问题涉及机械、电气和时序接口，以及物理传输介质（**physical transmission medium**）。一些典型问题包括：
			- 应该用多少伏电压表示1，多少伏表示0，一个比特持续多少微秒；
			- 传输是否可以同时在两个方向上进行；
			- 初始连接如何建立，以及当双方通信结束时如何拆除连接；
			- 网络连接器有多少个引脚，每个引脚的用途是什么。
		- 数据链路层（**Data link layer**）：该层的作用是将原始传输设施转变为一条对网络层而言看起来没有未检测到的传输错误的线路。设计问题包括：
			- **成帧（Framing）**：如何创建和识别帧边界；
			- **错误检测与恢复（Error detection, recovery）**：如何解决由损坏、丢失和重复的帧引起的问题；
			- **流量控制（Flow control）**：如何防止快速发送方淹没慢速接收方；
			- **介质访问控制（MAC）**：如何控制对共享信道的访问（针对广播网络）。
		- 网络层（**Network layer**）：该层关注控制子网（**subnet**）的运行。设计问题包括：
			- 如何将数据包（**packets**）从源路由到目的；
			- 如何控制拥塞（**congestion**）；
			- 如何连接异构网络（**heterogeneous networks**）（不同的寻址方式、不同的最大数据包大小、不同的协议）。
		- 传输层（**Transport layer**）：接受来自会话层（**session layer**）的数据，如果需要，将其分割成更小的单元，传递给网络层（**network layer**），并确保这些片段都正确到达另一端。设计问题：
			- 如何确定向会话层提供什么类型的服务，
			- 如何区分哪些消息属于哪个连接，
			- 如何调节信息流（**flow of information**）。
		- 会话层（**Session layer**）：允许不同机器上的用户之间建立会话（**sessions**）。设计问题包括：
			- 如何管理对话控制（**dialog control**，跟踪轮到谁发送）；
			- 如何管理令牌（**token**，防止双方同时发送）；
			- 如何同步不同的会话（**synchronization**，检查长传输，以便在崩溃时可以从断点处继续）。
		- 表示层（**Presentation layer**）：表示层关注所传输信息的语法（**syntax**）和语义（**semantics**）。设计问题包括：
			- 如何以标准约定的方式编码（**encode**）数据；
			- 如何高效地将计算机内部使用的表示形式（**representation**）转换为网络标准表示形式，以及反向转换；
			- 大端序（**Big endian**，最高有效位先出现/最小地址）与小端序（**little endian**，例如 Intel x86）的对比。
		- 应用层（**Application layer**）：该层包含各种常用的协议。一些应用层协议包括：
			- **HTTP**（**WWW**，万维网）
			- **Telnet**（网络虚拟终端，**network virtual terminal**）
			- **FTP**（文件传输协议，**file transfer protocol**）
			- **DNS**（域名系统）
			- **DHCP**（动态主机配置协议）
			- **SMTP**（简单邮件传输协议）
			- **POP**（邮局协议）
			- ……
	- **The TCP/IP reference model**
		![[Pasted image 20260923115919.webp|467]]![[Pasted image 20260923115929.webp|429]]
	- 链路层（**Link layer**）：
		- 描述了串行线路（**serial lines**）和经典以太网（**classic Ethernet**）等链路必须满足无连接互联网层（**connectionless internet layer**）需求的功能。
		- 从术语的常规意义上讲，它实际上根本不是一个层，而是主机（**hosts**）与传输链路（**transmission links**）之间的接口（**interface**）。
		- **TCP/IP**​ 模型的早期资料忽略了它。
	- 互联网层（**Internet layer**）：
		- 它的工作是允许主机（**hosts**）将数据包（**packets**）注入到任何网络中，并使它们独立地传输到目的地（可能位于不同的网络上）。
		- 互联网层定义了官方的包格式（**packet format**）和称为 **IP (Internet Protocol)**​ 的协议。
		- 一些设计议题：
			- 数据包路由（**Packet routing**）
			- 避免拥塞（**Avoiding congestion**）
			- 服务质量（**QoS**）
	- 传输层（**Transport Layer**）：
		- 其设计目的是允许源主机和目的主机上的对等实体（**peer entities**）进行对话（**conversation**）。
		- 两种端到端的传输协议（**end-end transport protocols**）：
			- **TCP**：可靠的、面向连接的协议（**reliable connection-oriented protocol**）
			- **UDP**：不可靠的、无连接的协议（**unreliable, connectionless protocol**）
	- 应用层（**Application layer**）：
		- 它包含所有的高层协议（**higher-level protocols**）。
		- 一些例子：
			– **HTTP**
			– **FTP**
			– **TFTP**
			– **SMTP**
			– **POP**
			– **DNS**
			– **NNTP**
			– **DHCP**
	- **Comparison**
		- OSI和TCP/IP参考模型的相似点（**Similarities for the OSI and TCP/IP reference models**）：
			- 基于协议栈（**protocol stack**）的概念
			- 层功能大致相似（**Layer functionality roughly similar**）
			- 端到端服务提供者（传输层，**transport**）与端到端服务使用者（应用层，**app**）（**End-end service provider (transport) vs. end-end service user (app)**）
		- OSI和TCP/IP参考模型的差异（**Differences for the OSI and TCP/IP reference models**）：
			- 服务/接口/协议（**Services/interfaces/protocols**）
			- OSI明确区分它们（**The OSI makes the distinction explicit**）
			- TCP/IP模型最初没有明确区分它们（**The TCP/IP model did not originally clearly distinguish them**）
			- 哪个先出现？（模型/协议）（**Which comes first? (Models/protocols)**）：
				- OSI先有模型，而TCP先有协议（**OSI model first while TCP protocol first**）。
			- 7层 / 4层；TCP/IP缺少三层（**7 layer / 4 layers; TCP/IP lacks three layers**）。
			- 面向连接与无连接通信（**Connection-oriented vs connectionless comm.**）：
				- OSI：在网络层支持面向连接和无连接通信（**Connection-oriented and connectionless communication in network layer**），在传输层仅支持面向连接（**connection-oriented in transport layer**）。
				- TCP：在网络层是无连接通信（**connectionless communication in network layer**），在传输层支持面向连接和无连接通信（**connection-oriented and connectionless communication in transport layer**），（给用户/应用提供选择）（**giving users/app a choice**）。
		- **==Why OSI did not take over the world ？==**
			- Bad timing
				- The time at which a standard is established is absolutely critical to its success.
				- The first elephant represents a burst of research activity.
				- The second elephant represents the billion-dollar wave of investment hits.
				![[Pasted image 20260923120857.webp]]
			- Bad technology
				- Both the model and the protocols are flawed, extraordinarily complex, difficult to implement and inefficient in operation.
			- Bad implementations
				- The initial implementations were huge, unwieldy, and slow.
			- Bad politics
				- The OSI model was thought to be the creature of government  bureaucrats.
## Standardization
- 为什么需要标准化（**standardization**）？
	- 存在许多网络供应商（**network vendors**）和提供商（**suppliers**），每个都有自己关于事情应该如何做的想法。如果没有协调（**coordination**），就会出现完全的混乱（**chaos**），用户将一事无成。唯一的出路是就一些网络标准（**network standards**）达成一致。
	- 标准增加了遵守标准的产品的市场（**market**）。
- 标准分为两类：
	- 事实上的（**De facto**，拉丁语“from the fact”）：
		- 小型办公室和家庭中的 PC / 计算机科学（**CS**）中的 Unix
	- 法律上的（**De jure**，拉丁语“by law”）
- **ITU**
	- International Telecommunications Union
	- Main sectors
		- Radiocommunications (ITU-R)
		- Telecommunications Standardization (ITU-T)
		- Development (ITU-D)
- **ISO & IEEE**
	- ISO (International Standards Organization, International Organization of Standardization)
	- Members
		- national standards organizations of the 157 member countries. e.g. ANSI (美国)
	- IEEE, Institute of Electrical and Electronic Engineers
	![[Pasted image 20260923121455.webp|439]]
- **Internet**
	- 1983年，IAB（Internet Activities Board，互联网活动委员会）
	- 后来，IAB 更名为 Internet Architecture Board（互联网架构委员会）
	- 1989年，IAB 拆分为 IRTF + IETF
		- IRTF（Internet Research Task Force，互联网研究任务组）
		- IETF（Internet Engineering Task Force，互联网工程任务组）
			- 最初由 DARPA 为 TCP/IP 协议开发而创立
			- Request for Comments（RFC，请求评论）：技术报告
## Policy, Legal, and Social Issues
- 在线言论（**Online speech**）
	- 社交网络（**social networks**）、内容分享网站（**content sharing sites**）上的内容
		- 政治（**Politics**）、宗教（**religion**）、性（**sex**）
- 网络中立性（**Net Neutrality**）
- 安全（**Security**）
	- 分布式拒绝服务攻击（**DDoS**）
	- 垃圾邮件（**Spam Email**）
- 隐私（**Privacy**）
	- 网站对用户进行画像和追踪（**Profiling and tracking users by Websites**）
	- 位置隐私（**Location privacy**）
- 虚假信息（**Disinformation**）
	- 假新闻（**Fake news**）
![[Pasted image 20260923121907.png|531]]
