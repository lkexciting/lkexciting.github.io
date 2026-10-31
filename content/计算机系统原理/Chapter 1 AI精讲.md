---
title: Chapter 1 · AI 精讲
aliases:
  - 计算机系统原理/notes/Chapter 1 AI精讲
---
# Chapter 1 AI 精讲：计算机抽象与技术（Computer Abstractions and Technology）

> 教材：Computer Organization and Design — RISC-V Edition, Chapter 1
> 本讲目标：建立"软件—硬件"之间的整幅地图，掌握性能（performance）、功耗（power）、成本（cost）三大约束的定量分析方法，为后面第 2~6 章（指令集、运算、处理器、存储层次、I/O）打下公共语言。

---

## 0. 本章在课程中的位置

整门课的主干是"自底向上地看懂一台计算机如何执行程序"：

| 层次 | 典型课程 | 关注点 |
|---|---|---|
| 体系结构（architecture） | 编译原理 | 系统优化、流水线（pipeline）、存储器（memory） |
| 操作系统 + 接口 | 操作系统 | PC 系统概念、I/O 接口设计、系统调用（system call）、文件系统 |
| 计算机组成 | 本课程 | CPU 原理、指令集（ISA）、CPU 设计 |
| 逻辑与计算机设计 | 数字逻辑 | 组合逻辑（combinational logic）、状态机（FSM）、Verilog |

本章处在最上层做"鸟瞰"：先把零件（component）与抽象（abstraction）认全，再把**性能怎么算**这件事彻底量化。后面每一章都会回到本章的三个公式（CPU Time、功耗、CPI）上。

---

## §1.1 计算机的革命（The Computer Revolution）

### 1.1.1 从 ENIAC 说起

- **ENIAC**（1946）：第一台真正实用的电子计算机
	- 体积巨大、重约 30 吨，含 18 000 多个**真空管**（vacuum tube）
	- 速度：5000 次加法/秒，或 400 次乘法/秒
	- 采用**十进制**（decimal）表示与运算；存储器由 20 个**累加器**（accumulator）构成，每个累加器存 10 位十进制数，每一位用 10 个真空管表示
	- **手动编程**（manual programming）：靠拨动开关、插拔电缆（plugboard）来"写程序"——程序即硬件连线
- 对比今天：一颗手机 SoC 每秒可完成 10^(10) 量级的运算，存储容量以 GB 计。这就是本章后续"技术趋势"要解释的指数增长。

> 考点/常识：ENIAC 是**十进制、非存储程序**（non-stored-program）的代表；"存储程序"（stored-program）思想（程序与数据同存于存储器）由 EDVAC/冯·诺依曼结构确立，是后面第 4 章"指令从存储器取出来执行"的前提。

### 1.1.2 计算机的分类（Classes of Computers）

| 类别 | 特征 | 设计约束 |
|---|---|---|
| 个人计算机（PC, personal computer） | 通用（general purpose）、软件生态丰富 | 性价比（cost/performance）折中 |
| 服务器（server） | 基于网络、高容量、高性能、高可靠 | 吞吐率（throughput）、可靠性（reliability） |
| 超级计算机（supercomputer） | 服务器的高端形态，用于科学与工程计算 | 峰值算力，市场份额极小 |
| 嵌入式计算机（embedded computer） | 隐藏于系统内部（汽车、家电、机器人） | 功耗/性能/成本极其苛刻（stringent） |

一句话记忆：**同一套零件，不同的约束**。设计一台机器时先问"它被什么约束"（cost? power? throughput?），这决定了后面所有取舍。

### 1.1.3 PostPC 时代

- **PMD**（Personal Mobile Device，个人移动设备）：电池供电、永远联网、几百美元量级——智能手机、平板、电子眼镜
- **云计算**（cloud computing）：
	- **WSC**（Warehouse Scale Computer，仓库级计算机）：把成千上万台服务器当作一台机器来管理的数据中心
	- **SaaS**（Software as a Service）：软件即服务
	- 现代应用是"**一部分跑在 PMD 上、一部分跑在云上**"的混合体（如语音助手、地图导航）
- 结论：**每台计算机背后都是一台数据中心**——这解释了为什么"能效（performance per watt）"比"峰值性能"更重要（见 §1.7 功耗墙）。

### 1.1.4 本课程要回答的五个问题

1. 程序如何被翻译成机器语言（machine language），硬件又如何执行它们
2. 硬件/软件接口（hardware/software interface）到底是什么
3. 什么决定了程序的性能，性能又如何改进
4. 硬件设计者用什么手段提升性能
5. 什么是并行处理（parallel processing）

### 1.1.5 性能是由整条链路决定的

```
算法 algorithm          → 决定执行的运算个数（operation count）
编程语言/编译器/体系结构 → 决定每个运算对应的机器指令数（instruction count）
处理器与存储系统        → 决定指令执行得多快（CPI、clock rate）
I/O 系统（含操作系统）   → 决定 I/O 操作有多快
```

> **重要观念**：优化一处不等于整体变快。后面 Amdahl 定律（§1.10）会给出定量答案。

---

## §1.2 计算机体系结构的七大伟大思想（Seven Great Ideas）

| # | 思想 | 含义 | 本课程中的体现 |
|---|---|---|---|
| 1 | 用**抽象**（abstraction）简化设计 | 屏蔽低层细节，只暴露接口 | ISA、ABI、C 语言、虚拟机 |
| 2 | 让**常见情况变快**（make the common case fast） | 优化高频路径，而不是平均用力 | 立即数、分支预测、Cache |
| 3 | 通过**并行**（parallelism）提升性能 | 同时做多件事 | 多核、多发射、Cache 并行访问 |
| 4 | 通过**流水线**（pipelining）提升性能 | 把任务拆成阶段重叠执行 | 第 4 章五级流水线 |
| 5 | 通过**预测**（prediction）提升性能 | 猜对了就省时间，猜错再补救 | 分支预测、 speculated execution |
| 6 | **存储层次**（hierarchy of memories） | 小的快、大的慢，用层次兼得 | 寄存器→Cache→主存→磁盘（第 5 章） |
| 7 | 用**冗余**（redundancy）获得可靠性 | 备份换可靠 | ECC、RAID、冗余电源 |

> 这七条是全书的"设计哲学索引"。看到任何一个硬件结构，先问它服务哪一条：Cache→第 6 条；流水线→第 4 条；分支预测→第 5 条；多核→第 3 条。

---

## §1.3 程序之下（Below Your Program）

### 1.3.1 三层结构

- **应用软件**（application software）：用高级语言（high-level language, HLL）编写
- **系统软件**（system software）：
	- **编译器**（compiler）：把 HLL 代码翻译为机器码（machine code）
	- **操作系统**（operating system, OS）：提供"服务代码"
		- 处理输入/输出（I/O）
		- 管理存储器与存储（memory and storage）
		- 调度任务、共享资源（scheduling tasks & sharing resources）
- **硬件**（hardware）：处理器（processor）、存储器（memory）、I/O 控制器（I/O controller）

### 1.3.2 程序代码的三个层级

| 层级 | 形式 | 特点 |
|---|---|---|
| 高级语言 HLL | `swap(int v[], int k)` | 抽象层次接近问题域，**生产率**（productivity）与**可移植性**（portability）好 |
| 汇编语言（assembly language） | `slli t1, a1, 2` … | 指令的**文本表示**（textual representation），与机器指令一一对应 |
| 硬件表示（hardware representation） | `0000000 00101 00110 110 00111 0010011` | **二进制位**（bits）编码的指令与数据 |

![[Ch1-P19-程序代码的层级.webp]]

> 图中三段代码是同一段 swap 的三种形态。注意：C 代码里一句 `swap` 会变成**多条**汇编指令，而汇编与机器码是**严格一一对应**的（除了伪指令 pseudo-instruction）。

### 1.3.3 从源代码到可执行文件的完整链路

```
hello.c ──(预处理器 cpp)──> hello.i ──(编译器 cc1)──> hello.s ──(汇编器 as)──> hello.o ─┐
                                                                                     ├─(链接器 ld)──> a.out
库文件 libc.a / libc.so ─────────────────────────────────────────────────────────────┘
```

- **预处理**（preprocessing）：展开 `#include`、`#define`
- **编译**（compilation）：生成汇编
- **汇编**（assembly）：汇编 → 可重定位目标文件（relocatable object file）
- **链接**（linking）：合并多个 .o 与库，解析符号（symbol resolution）、重定位（relocation）

> 理解这条链路的用处：第 2 章讲指令时，你会看到"C 的 `while` 循环如何变成 `beq` 分支"；性能分析时，"编译器优化等级 -O2 改变了 IC 和 CPI"就是在这条链上发生的。

---

## §1.4 打开机器看内部（Under the Covers）

### 1.4.1 整幅图景（The BIG Picture）

![[Ch1-P20-计算机系统全貌.webp]]

一台计算机永远是这五类部件 + 一组总线（bus）：

| 部件 | 英文 | 职责 |
|---|---|---|
| 输入设备 | input | 键盘、鼠标、触摸屏、摄像头 |
| 输出设备 | output | 显示器、打印机 |
| 存储器 | memory | 存放正在执行的程序与数据（易失 volatile） |
| 处理器 | processor / CPU / datapath+control | 执行指令 |
| 外部存储 | secondary storage | 磁盘、Flash、光盘（非易失 non-volatile） |

网络适配器（network adapter）让计算机与外界通信，本质是另一类 I/O 设备。

![[Ch1-P23-PC主板.webp]]

主板（motherboard）上能直接看到：CPU 插座（socket）、内存条插槽（DIMM slot）、PCIe 总线插槽（bus slot）。**"总线"是把这些部件连起来的一组共享导线**，第 4 章讲单周期/流水线实现时会反复出现"取指要访问指令存储器"这类总线竞争问题。

### 1.4.2 触摸屏（Touchscreen）

- PostPC 设备的典型输入，取代键盘与鼠标
- 两类：**电阻式**（resistive）与**电容式**（capacitive）
- 平板与手机几乎都用**电容式**：手指改变局部电容 → 定位；支持**多点同时触摸**（multi-touch），这是手势（捏合缩放）的硬件基础

### 1.4.3 显示器与帧缓冲（Frame Buffer）

![[Ch1-P25-LCD与帧缓冲.webp]]

- **LCD**（Liquid Crystal Display）屏幕由**像素**（picture element, pixel）阵列构成
- 每个像素的颜色值存在一块专门的内存里，叫**帧缓冲**（frame buffer）
- 屏幕显示的图像就是"**帧缓冲内存内容的一面镜子**"：显卡/GPU 不断改写 frame buffer，显示器以固定刷新率（如 60 Hz）把它扫描输出
- 算术题原型：1920×1080 像素、每像素 3 字节（RGB），一帧 = 1920×1080×3 ≈ 6.2 MB；60 Hz 刷新即每秒要搬 6.2 MB×60≈373 MB —— 这是"存储带宽"最直观的例子

### 1.4.4 处理器内部（Inside the Processor）

- **数据通路**（datapath）：对数据执行运算（ALU、寄存器堆 register file）
- **控制器**（control）：给 datapath、存储器排序——"指挥"数据通路按时序工作
- **Cache（高速缓存）**：小而快的 **SRAM** 存储器，用于**立即访问**（immediate access）近期用到的数据
	- 为什么需要：处理器比主存快得多（第 5 章"存储墙" memory wall）

典型的芯片内部（如 Apple A12）包含多个 CPU 核、GPU、Cache、内存控制器、I/O 接口——**同一块硅片上集成整个系统**，称 SoC（System on Chip）。

### 1.4.5 抽象：ISA 与 ABI

| 抽象 | 定义 | 谁遵守 |
|---|---|---|
| **ISA**（Instruction Set Architecture，指令集体系结构） | **硬件/软件接口**：指令、寄存器、寻址方式、数据类型 | 编译器/OS ↔ 硬件 |
| **ABI**（Application Binary Interface） | ISA + 系统软件接口（系统调用约定、寄存器使用约定、目标文件格式） | 应用程序的二进制 ↔ 平台 |
| **实现**（implementation） | 接口之下的具体细节：流水线级数、Cache 大小、电路实现 | 硬件设计者 |

> 经典比喻：ISA 是"合同"，implementation 是"承包商怎么干活"。同一份 ISA 可以有完全不同的实现（Intel 的 x86 有十几代微架构；RISC-V 有无数实现）。**ISA 使得二进制兼容成为可能**——这是第 2 章之所以要花大力气讲指令格式的原因。

### 1.4.6 数据的安放：易失与非易失

- **易失性主存**（volatile main memory, DRAM）：断电即丢失指令与数据
- **非易失性二级存储**（non-volatile secondary memory）：
	- 磁盘（magnetic disk）
	- Flash memory（SSD、U 盘）
	- 光盘（optical disk: CD-ROM、DVD）
- 层次关系：寄存器 → Cache(SRAM) → 主存(DRAM) → Flash/磁盘 → 磁带/云（第 5 章展开）

### 1.4.7 网络（Networks）

| 类型 | 覆盖 | 代表 |
|---|---|---|
| LAN（Local Area Network） | 一栋楼/校园 | Ethernet（以太网）、WiFi |
| WAN（Wide Area Network） | 全球 | the Internet |
| Wireless | 短距 | WiFi、Bluetooth |

网络的作用：**通信、资源共享、远程访问**（nonlocal access）——这也是"计算机 = 通信设备"这一现代观点的来源。

---

## §1.5 制造处理器与存储器的技术（Technologies for Building Processors and Memory）

### 1.5.1 技术趋势与摩尔定律

| 年份 | 技术 | 相对性价比 |
|---|---|---|
| 1951 | 真空管（vacuum tube） | 1 |
| 1965 | 晶体管（transistor） | 35 |
| 1975 | 集成电路（IC） | 900 |
| 1995 | 超大规模集成电路（VLSI） | 2 400 000 |
| 2013 | 极大规模集成电路（ULSI） | 250 000 000 000 |

- 电子技术持续演进：**容量与性能提升、成本下降**
- **摩尔定律**（Moore's Law）：集成电路上晶体管数约每 18~24 个月翻一番（原始表述为每年翻番，后修正）
- 三条经验规律（教材给出）：
	- **DRAM 容量**每 2~3 年翻 4 倍（增长最快）
	- **处理器性能**（单核）每年提升约 1.5 倍（后被功耗墙打断，见 §1.7）
	- **磁盘密度**每年提升约 1.4 倍

![[Ch1-P33-DRAM容量增长.webp]]

### 1.5.2 半导体物理基础

- **硅**（silicon）是**半导体**（semiconductor）
- 掺入不同材料改变其电学性质：
	- **导体**（conductor）：电阻极小
	- **绝缘体**（insulator）：电阻极大
	- **开关**（switch）：由 MOS 晶体管实现——**用电压控制导通/截止**，这就是"1 和 0"的物理载体
- 现代 IC 的基石是 **CMOS**（Complementary MOS）：NMOS + PMOS 互补，静态几乎不耗电（这是 §1.7 功耗公式的前提）

### 1.5.3 集成电路的制造流程

![[Ch1-P35-集成电路制造流程.webp]]

```
硅锭 silicon ingot → 切片 slicer → 晶圆 wafer
   → 20~40 次 光刻/掺杂/刻蚀 循环（photolithography, doping, etching）
   → 晶圆测试 wafer test → 切割 dice → 封装 packaged die → 成品测试
```

- **晶圆**（wafer）：常见直径 300 mm（12 英寸）
- **晶粒**（die）：晶圆上每一个独立的芯片
- **良率**（yield）：每片晶圆上**可用晶粒**的比例 —— 这是成本公式的核心变量

![[Ch1-P36-晶圆与芯片.webp]]

（以 Intel Core 第 10 代为例：300 mm 晶圆、506 颗芯片、10 nm 工艺，每颗芯片 11.4 × 10.7 mm）

### 1.5.4 集成电路成本（要会算）

Cost per die=(Cost per wafer)/(Dies per wafer×Yield)

Dies per wafer≈(Wafer area)/(Die area)

Yield=1/((1+(Defects per area×Die area)/2)²)

**关键结论：成本与面积、缺陷率是"非线性"关系**（面积翻倍，成本涨得比两倍多）。三者的来源：

| 量 | 由谁决定 | 能否改变 |
|---|---|---|
| 晶圆成本（Cost per wafer） | 工艺、产能 | 固定（短期） |
| 面积（Die area） | 体系结构与电路设计 | 设计者可控 |
| 缺陷率（Defects per area） | 制造工艺成熟度 | 工艺决定 |

> 例题思路：面积增大 → dies/wafer 减小（一次近似）**且** yield 下降（二次方衰减）→ 双重惩罚。这就是为什么"大芯片"（如 GPU、服务器 CPU）特别贵，也是 chiplet（小芯片）思路的动因。

---

## §1.6 性能（Performance）

### 1.6.1 先问：什么叫"性能好"？

![[Ch1-P38-性能的定义.webp]]

同一组飞机，"载客量最大""航程最远""速度最快"给出的"最好"完全不同。计算机同理，必须先明确指标：

- **响应时间**（response time / execution time）：完成**一个任务**花多久 → 用户感受
- **吞吐率**（throughput / bandwidth）：单位时间完成**多少工作**（tasks/transactions per hour）→ 系统容量

两个经典提问：

1. 换更快的处理器 → 响应时间↓，吞吐率也↑（若任务间无依赖）
2. 增加处理器数量 → 吞吐率↑，但**单个任务的响应时间不一定变短**（除非任务本身能并行）

> 本课程若无特别说明，**默认研究响应时间**（execution time）。

### 1.6.2 相对性能（Relative Performance）

Performance=1/(Execution Time)

"X 比 Y 快 n 倍"：

Performance_X/Performance_Y=(Execution Time_Y)/(Execution Time_X)=n

**例**：程序在 A 上 10 s、B 上 15 s → 15/10=1.5 → A 比 B 快 1.5 倍。

> ⚠️ 易错点：比值是"**时间反比**"，且分子分母别写反。说"B 比 A 慢"时比值仍是 1.5，但表述要清楚：B 的执行时间是 A 的 1.5 倍。

### 1.6.3 两种执行时间

| 指标 | 定义 | 包含 | 用途 |
|---|---|---|---|
| **Elapsed time**（wall-clock / response time） | 整个程序从起到止的真实时间 | 计算、I/O、OS 开销、等待 | 决定**系统**性能 |
| **CPU time** | 处理器真正用于该作业的时间 | 用户 CPU 时间（user）+ 系统 CPU 时间（system） | 衡量**处理器**性能，排除 I/O 与其他作业干扰 |

CPU Time=User CPU Time+System CPU Time

> 区别的实际意义：程序 A 计算 1 s + I/O 9 s，程序 B 计算 5 s + I/O 1 s。若只看 elapsed time（10 s vs 6 s）会得出"B 更好"；但换更快的 CPU 只对 A 的计算部分有效。**分析时先分清瓶颈在 CPU 还是 I/O**。

### 1.6.4 时钟（CPU Clocking）

![[Ch1-P42-时钟周期与频率.webp]]

数字硬件的运行由一个**恒速时钟**（constant-rate clock）支配，每个时钟周期做两件事：

1. **数据传输与计算**（data transfer and computation）——组合逻辑的传播
2. **更新状态**（update state）——时钟边沿把结果写入触发器

- **时钟周期**（clock period, T_c）：一个周期的时长，如 250 ps = 0.25 ns = 250×10^(-12) s
- **时钟频率/时钟速率**（clock rate, f）：每秒的周期数，如 4.0 GHz = 4000 MHz = 4.0×10⁹ Hz
- 两者互为倒数：T_c=1/f

### 1.6.5 CPU 时间公式（本章核心）

CPU Time=CPU Clock Cycles×Clock Cycle Time=(CPU Clock Cycles)/(Clock Rate)

提升性能的两条路：

1. 减少**时钟周期总数**（clock cycles）
2. 提高**时钟频率**（clock rate）

> **权衡（trade-off）**：硬件设计者常常必须在"频率高但周期数多"与"频率低但周期数少"之间折中。例如加深流水线可提频，但会增加分支预测失败的惩罚周期（第 4 章）。

**例 1（教材例）**：A 机 2 GHz、CPU 时间 10 s。设计 B 机，目标 6 s；但更快的时钟会导致时钟周期数变为 1.2 倍。问 B 的时钟频率？

Clock Cycles_A=10 s×2 GHz=20×10⁹

Clock Rate_B=(1.2×20×10⁹)/(6 s)=4 GHz

### 1.6.6 指令数与 CPI

Clock Cycles=Instruction Count×CPI

CPU Time=Instruction Count×CPI×Clock Cycle Time=(Instruction Count×CPI)/(Clock Rate)

- **Instruction Count（IC，指令数）**：由**程序本身、ISA、编译器**决定
- **CPI**（Cycles Per Instruction，每条指令平均时钟周期数）：由 **CPU 硬件**决定
- 若各类指令 CPI 不同，则平均 CPI 受**指令混合比**（instruction mix）影响

**例 2**：A 机 T_c=250 ps、CPI = 2.0；B 机 T_c=500 ps、CPI = 1.2；同一 ISA。谁快？快多少？

CPU Time_A=I×2.0×250 ps=I×500 ps
CPU Time_B=I×1.2×500 ps=I×600 ps
⇒ (CPU Time_B)/(CPU Time_A)=1.2

→ **A 更快，快 1.2 倍**。注意：B 的频率只有 A 的一半，但 CPI 更低仍不足以反超。

### 1.6.7 加权平均 CPI

若不同指令类别（class）耗时不同：

Clock Cycles=Σ_(i=1)ⁿ (CPI_i×Instruction Count_i)

CPI=(Clock Cycles)/(Instruction Count)=Σ_(i=1)ⁿ (CPI_i×(Instruction Count_i)/(Instruction Count))

最后一项 IC_i/IC 就是该类指令的**相对频率**（relative frequency）——所以 **CPI 是"以指令频率为权的加权平均"**。

**例 3（教材例）**：

| 类别 | A | B | C |
|---|---|---|---|
| 各类 CPI | 1 | 2 | 3 |
| 序列 1 的 IC | 2 | 1 | 2 |
| 序列 2 的 IC | 4 | 1 | 1 |

- 序列 1：IC = 5，Cycles = 2×1+1×2+2×3=10，平均 CPI = 10/5=2.0
- 序列 2：IC = 6，Cycles = 4×1+1×2+1×3=9，平均 CPI = 9/6=1.5

> 结论：**序列 1 指令更少，但序列 2 更快**（CPI 更低）。这说明"指令数少"≠"程序快"，必须用 IC×CPI 合起来看。这正是 RISC 与 CISC 之争的核心，也是第 2 章"简单指令优先"的动机。

### 1.6.8 性能总结：三个因子

CPU Time=Instructions/Program×(Clock cycles)/Instruction×Seconds/(Clock cycle)

| 因素 | 影响 IC | 影响 CPI | 影响 T_c |
|---|---|---|---|
| 算法（algorithm） | ✔（运算个数） | ✔（如乘法用多次加法实现） | |
| 编程语言（programming language） | ✔ | ✔（如 Java 解释执行 vs C 编译） | |
| 编译器（compiler） | ✔ | ✔（优化改变指令选择） | |
| **ISA** | ✔ | ✔ | ✔ |

> 记忆口诀：**"算法定运算，语言/编译器定指令，硬件定快慢"**。

---

## §1.7 功耗墙（The Power Wall）

### 1.7.1 功耗趋势

![[Ch1-P50-功耗趋势.webp]]

CMOS 集成电路的**动态功耗**（dynamic power）：

P=Capacitive load×Voltage²×Frequency

历史变化（教材图）：电容负载约 ×30、电压 5 V → 1 V、频率约 ×1000 → 功耗暴涨。

### 1.7.2 降功耗的算例

某新 CPU：电容负载为旧的 85%，电压降 15%，频率降 15%：

P_new/P_old=(C_old×0.85×(V_old×0.85)²×F_old×0.85)/(C_old×V_old²×F_old)=0.85⁴≈0.52

→ 功耗降到约 **52%**，但性能（频率）只损失 15%。

> 注意电压的**平方**关系：降电压是降低功耗最有效的手段（0.85³ 中电压贡献 0.85²）。这也是为什么"低功耗"设计优先降电压而不是降频率。

### 1.7.3 什么是"功耗墙"

- **无法再降电压**：阈值电压（threshold voltage）与漏电流（leakage current）限制，电压再低则晶体管无法可靠开关、漏电占比飙升
- **无法再散热**：风冷能带走的热量有限（典型桌面 CPU 约 100 W 量级，数据中心单柜有上限）
- 结果：**频率无法继续提升** → 单核性能增长曲线在 2003 年前后"折弯"（见 §1.8 图）

于是问题变成：还能怎么提升性能？⇒并行（parallelism）

---

## §1.8 转向多处理器（The Sea Change: The Switch to Multiprocessors）

- **多核微处理器**（multicore microprocessor）：一颗芯片上集成多个处理器（core）
- 需要**显式并行编程**（explicitly parallel programming）——程序员必须自己把工作切开
- 与**指令级并行**（instruction level parallelism, ILP）对比：
	- ILP 由硬件在一次执行多条指令，**对程序员透明**（hidden from the programmer）
	- 多核并行**对程序员可见**，很难做好：
		- 为性能而编程（programming for performance）
		- **负载均衡**（load balancing）
		- 优化**通信与同步**（communication and synchronization）

![[Ch1-P54-单核性能增长停滞.webp]]

图中三条历史阶段很清楚：

1. 1986–2002：单核性能每年约 52% 增长（受限于 **ILP**）
2. 2003–2011：降到每年约 22%（受限于**功耗** power）
3. 之后：几乎停滞（受限于**存储延迟** memory latency）

> 这就是"**功耗墙 + 存储墙 + ILP 墙**"三重天花板，也是第 5 章（存储层次）与第 4 章（流水线/ILP）存在的根本理由。

---

## §1.9 性能评测：基准测试（Benchmarks）

### 1.9.1 SPEC CPU

- **基准测试程序**（benchmark）：用来测量性能、且**被认为代表真实负载**的程序集合
- **SPEC**（Standard Performance Evaluation Corporation）：制定 CPU、I/O、Web 等基准的标准化组织
- **SPEC CPU2006**：
	- 执行一组选定程序的 elapsed time
	- I/O 可忽略 → 聚焦 **CPU 性能**
	- 结果**相对于参考机**（reference machine）归一化
	- 汇总方式：各程序性能比的**几何平均**（geometric mean）

n√(Π_(i=1)ⁿ Execution time ratio_i)

分为 **CINT2006**（整数 integer）与 **CFP2006**（浮点 floating-point）。

> 为什么用几何平均而不是算术平均？因为性能比是**乘性**量：几何平均对"各程序等比例变快"保持一致性，算术平均会被特别快的个别程序"带偏"。

### 1.9.2 SPEC Power（能效基准）

测量服务器在**不同负载水平**下的功耗：

- 性能指标：**ssj_ops/sec**（每秒完成的 Java 事务数）
- 功耗：瓦特（W = J/s）

Overall ssj_ops per Watt=(Σ_(i=0)^(10)ssj_ops_i)/(Σ_(i=0)^(10)power_i)

即在 0%、10%、…、100% 十一个负载点上，**总吞吐 ÷ 总功耗**。

> 该指标的现实意义：数据中心里"性能/瓦"直接等于电费与散热成本，"能效"已是第一设计目标。

---

## §1.10 谬误与陷阱（Fallacies and Pitfalls）

### 1.10.1 陷阱：Amdahl 定律（Amdahl's Law）

**错误想法**：改进系统的某个部分，就期待整体性能按比例提升。

T_improved=T_affected/(improvement factor)+T_(unaffected)

**例**：某程序耗时 100 s，其中乘法占 80 s。想让整体快 5 倍（即 20 s），乘法要快多少倍？

20=80/n+20 ⇒ 80/n=0 ⇒ 不可能！

因为**不可改进的部分（20 s）已经成为下限**：整体最多快 100/20=5 倍，且需要乘法时间趋于 0。

**推论（corollary）**：**让常见情况变快**（make the common case fast）——优化占比大的部分才有意义。

> 用"加速比上限"表述更清楚：
> S_overall=1/((1-f)+f/s)
> 其中 f 为可改进部分占比，s 为该部分的加速比。s→∞ 时 S→1/(1-f)。上例 f=0.8，上限 5 倍——**恰好等于目标值，故不可能达到**。

### 1.10.2 谬误：低负载时功耗也低

- 回看 i7 功耗基准：

| 负载 | 功耗 | 占满载 |
|---|---|---|
| 100% | 258 W | 100% |
| 50% | 170 W | 66% |
| 10% | 121 W | 47% |

- Google 数据中心：多数时间运行在 **10%~50%** 负载，满载时间不足 1%
- 结论：**功耗并不与负载成比例**（静态功耗 leakage 占大头）
- 改进方向：设计"**功耗与负载成正比**"的处理器（如 DVFS、power gating、dark silicon 设计）

### 1.10.3 陷阱：用 MIPS 衡量性能

**MIPS**（Millions of Instructions Per Second）：

MIPS=(Instruction count)/(Execution time×10⁶)=(Clock rate)/(CPI×10⁶)

MIPS 的三个致命缺陷：

1. 不反映**不同 ISA 之间**的差异（RISC 指令简单、条数多，MIPS 虚高）
2. 不反映**指令复杂度**差异（一条指令干的活可差很多）
3. 同一 CPU 上不同程序的 **CPI 不同**，MIPS 随程序变化

> 正确做法：**执行时间（execution time）才是最好的性能度量**（教材结论）。

---

## §1.11 结论（Concluding Remarks）

- 性价比持续改善，源于底层技术的进步（摩尔定律）
- 硬件与软件中都存在**层次化的抽象**（hierarchical layers of abstraction）
- **ISA** 是硬件/软件接口
- **执行时间**是最好的性能度量
- **功耗**是限制因素 → 用**并行**继续提升性能

---

## §1.12 公式速查表

| 名称 | 公式 | 备注 |
|---|---|---|
| 性能 | Perf=1/ExecTime | |
| 相对性能 | Perf_X/Perf_Y=T_Y/T_X | 时间反比 |
| CPU 时间 | T_CPU=Cycles×T_c=Cycles/f | |
| 周期数 | Cycles=IC×CPI | |
| CPU 时间（展开） | T_CPU=(IC×CPI)/f | 三个因子 |
| 平均 CPI | CPI=Σ_i CPI_i×IC_i/IC | 加权平均 |
| 动态功耗 | P=C V² f | 电压平方 |
| 单 die 成本 | (Cost per wafer)/(Dies per wafer×Yield) | |
| 良率 | 1/((1+Defects/area×Area/2)²) | |
| Amdahl | T_new=T_aff/n+T_unaff | 上限 1/(1-f) |
| MIPS | f/(CPI×10⁶) | 不可靠指标 |

---

## §1.13 易错点与考点清单

1. **响应时间 vs 吞吐率**：多核提升吞吐率，未必改善单任务响应时间
2. **elapsed time vs CPU time**：前者含 I/O 与 OS 开销
3. **CPI 是加权平均**，不是各类 CPI 的算术平均；权重是**指令频率**
4. **指令数少 ≠ 快**（见例 3：IC = 5 的序列反而更慢）
5. **频率高 ≠ 快**（例 2：B 频率低但 CPI 更低时…本例仍是 A 快，但要看乘积）
6. **Amdahl 定律**：不可改进部分是硬下限；先算 1/(1-f)
7. **MIPS 不能跨 ISA 比较**
8. **功耗公式中电压是平方项**：降电压最划算
9. 成本公式中面积对成本是**双重非线性**影响（数量 + 良率）

## §1.14 作业

教材习题：**1.4、1.9.1、1.9.3**

---

### 本章与其他章节的接口

| 本章概念 | 后续展开 |
|---|---|
| ISA 是硬件/软件接口 | 第 2 章：RISC-V 指令格式与寻址方式 |
| 算术运算与溢出 | 第 3 章：整数/浮点表示与 ALU |
| datapath + control | 第 4 章：单周期 → 流水线 → 冒险处理 |
| Cache / 存储层次 | 第 5 章：局部性、Cache 映射、虚拟存储 |
| I/O 与中断 | 第 6 章：总线、中断、DMA |
| 功耗墙 → 并行 | 第 4 章 ILP、多核 |
