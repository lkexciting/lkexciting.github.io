---
title: Chapter 1
aliases:
  - OS/notes/Chapter 1
---
- ==kernel：内核==
- What is the ==outline== of the chapter?
	![[Pasted image 20260915172553.webp|471]]
- What is Operating?==“运赢”==
	- 运营/管理：有限的资源调度、分配、管控、协调
- What is an ==Operating System==?
	- A program that acts as an intermediary between a user of a computer and the computer hardware.
	- Operating system goals:
		- Execute user programs and make solving user problems easier.
		- Make the computer system convenient to use.
	- Use the computer hardware in an efficient manner.
- Four Components of a Computer System
	![[Pasted image 20260915173537.webp|454]]
- Computer System Structure
	- Computer system can be divided into four components
		- Hardware – provides basic computing resources
			——CPU, memory, I/O devices
		- Operating system
			——Controls and coordinates use of hardware among various applications and users
		- System & application programs – define the ways in which the system resources are used to solve the computing problems of the users
			——Word processors, compilers, web browsers, database systems, video games
		- Users
			——People, machines, other computers
- Why To Learn OS ?
	![[Pasted image 20260915173851.webp|404]]
- OS Definition
	- A resource allocator
		- Manages all resources
		- Decides between conflicting requests for efficient and fair resource use
	- A control program
		- Controls execution of programs to prevent errors and improper use of the computer
	- No universally accepted definition
	- “Everything a vendor ships when you order an operating system” is good approximation
		- But varies wildly
	- “The one program running at all times on the computer” is the kernel.  Everything else is either a system program (ships with the operating system) or an application program
- Computer Startup
	- ==bootstrap== program is loaded at power-up or reboot==（相当于是开机或者重装的时候的启动点）==
		![[Pasted image 20260917135121.webp|427]]
		- Typically stored in ROM or EPROM, generally known as firmware
		- ==Initializes== all aspects of system
		- ==Loads== operating system kernel and ==starts== execution
- Computer System Organization（计算机的组成）
	![[Pasted image 20260917135341.webp|487]]
		相比于cpu而言，USB controller 连接的都是慢速设备：***mouse keyboard printer***
	- One or more CPUs, device controllers connect through common bus providing access to shared ==memory=="==以内存为中心=="
	- ==Concurrent execution== of CPUs and devices competing for ==memory== cycles
- Computer-System Operation（计算机是怎么运行的？）
	- I/O devices and the CPU can execute **concurrently *并发：从宏观角度认为同时发生***（parallel是并行，也就是同时在执行）.
	- Each device controller is in charge of a **particular** device type.
	- Each device controller has a ==local buffer (解决适配问题)==.
	- CPU **moves data** from/to main memory to/from **local buffers**
	- I/O is from the device to local buffer of controller.
	- Device controller informs CPU that it has finished its operation by causing an interrupt ==(via system bus)==.
- 8259：Programmable Interrupt Controller(**可编程中断控制器**)
	![[Pasted image 20260917141456.webp|483]]
- Common Functions of Interrupts
	- Interrupt transfers control to the interrupt service routine (ISR) generally, through the ==interrupt vector==, which contains the addresses of all the service routines.`中断通常通过中断向量将控制权转移给中断服务例程（ISR），中断向量包含将所有服务例程的地址。`
	- Interrupt architecture must save the address of the interrupted instruction.`中断架构必须保存被中断指令的地址。`
	- Incoming interrupts are disabled while another interrupt is being processed to prevent a lost interrupt.`在处理另一个中断时，进入的中断会被禁用，以防止中断丢失。`
	- A ==trap== is a software-generated interrupt caused either by an ==error== (基本被动触发) or a ==user request== (主动触发) (the latter is often referred to as a ==★★system call★★==). Note: names may vary across different architectures.`陷阱（trap）是由软件生成的中断，由错误或用户请求（后者通常被称为系统调用 system call）引起。注意：不同架构中的名称可能有所不同。`
	- An operating system is ==interrupt== driven.`操作系统是中断（interrupt）驱动的。`
	- 在RISC-5中：
		![[Pasted image 20260917143736.webp]]
		interrupt：硬件中断
- ==权限，管理等等一定需要kernel台进行管控！==
- Interrupt Handling
	- The operating system preserves the state of the CPU by storing ==registers(寄存器)== and the ==program counter(程序计数器PC)==.
	- Determines which type of interrupt has occurred: 决定中断的类型
		- ==polling== by a generic routine 由通用例程进行**轮询（polling）**
		- ==vectored== interrupt system **向量(vectored)中断系统**
	- Separate segments of code determine what action should be taken for each type of interrupt 独立的代码段决定针对每种类型的中断应采取什么行动
- Interrupt Timeline
	![[Pasted image 20260917144500.webp|494]]
	这张时序图展示了操作系统里经典的**中断驱动 I/O（Interrupt-driven I/O）** 工作流程。横轴代表时间，纵轴代表 CPU 和 I/O 设备的状态变化。我们按时间顺序把整个过程拆解为以下几个阶段：
	![[Pasted image 20260917145117.webp]]
	与之前知识点的关联
	- **操作系统是中断驱动的**：图中清晰体现了这一点。==CPU 大部分时间在跑用户程序==，只有当 I/O 设备发出中断信号（interrupt signalled）时，CPU 才被“唤醒”去处理 I/O。
	- **保存 CPU 状态**：在“interrupt handled”阶段开始时，操作系统必须保存**寄存器**和**程序计数器（PC）**，以便中断处理完能无缝回到用户程序。
	- **中断识别**：CPU 在收到中断信号后，会通过**向量中断系统**快速确定这是 I/O 设备发来的请求，从而跳转到对应的独立代码段（ISR）执行。
	![[Pasted image 20260917144839.webp|490]]
	![[Pasted image 20260917145311.webp]]
- I/O Structure – Two I/O Methods
	![[Pasted image 20260917145531.webp|488]]
	- After I/O starts, control returns to user program ==only upon I/O completion==.
		- Wait instruction idles the CPU until the next interrupt
		- Wait loop (contention for memory access).
		- At most one I/O request is outstanding at a time, ==no simultaneous== I/O processing.
	- After I/O starts, control returns to user program ==without waiting== for I/O completion.
		- System call – request to the operating system to a==llow user to wait for== I/O completion.
		- Device-status table contains entry for each I/O device indicating its type, address, and state.
		- Operating system indexes into I/O device table to determine device status and to ==modify table entry to include interrupt==.
- Direct Memory Access Structure(DMA)
	- Used for high-speed I/O devices able to transmit information at close to memory speeds.
	- Device controller transfers blocks of data from buffer storage directly to main memory ==without== CPU intervention.
	- Only one interrupt is generated ==per block==, rather than the one interrupt per byte.
- Storage Structure
	- Main memory – only large storage media that the CPU can access directly.
	- Secondary storage – extension of main memory that provides large nonvolatile storage capacity.
	- Magnetic disks – rigid metal or glass platters covered with magnetic recording material 
		- Disk surface is logically divided into tracks, which are subdivided into sectors.
		- The disk controller determines the logical interaction between the device and the computer. 
- Storage-Device Hierarchy
	![[Pasted image 20260917151707.webp|439]]
	虚线以下：非意识性存储，关机不会丢失
	虚线以上：意识性存储，关机丢失
	越往上速度越快
- Storage Hierarchy
	- Storage systems organized in hierarchy.
		- Speed
		- Cost
		- Volatility
	- Caching – copying information into faster storage system; main memory can be viewed as a last cache for secondary storage.
- Caching
	- Important principle, performed at many levels in a computer (in hardware, operating system, software)
	- Information in use copied from slower to faster storage temporarily – Speed mismatch
	- Faster storage (cache) checked first to determine if information is there
		- If it is, information used directly from the cache (fast)
		- If not, data copied to cache and used there
	- Cache smaller than storage being cached
		- Cache management important design problem
		- Cache size and replacement policy
	-  数据迁移与一致性（Migration of Integer A from Disk to Register）
	- ![[Pasted image 20260917153946.webp|484]]
		**核心内容**：当数据从磁盘（低速存储）向寄存器（最快存储）迁移时，多任务和多处理器环境必须确保数据的**最新值**被正确访问。
		- **多任务环境（Multitasking）**：
		    - **原理**：系统中有多个进程交替执行，一个进程修改了数据后，切换到另一个进程时，必须能读到修改后的最新值，无论该数据当前位于存储层次的哪一级（寄存器、缓存、内存或磁盘）。
		    - **示例**：进程 A 将变量 `x` 从 0 改为 1，并写回内存。随后进程 B 被调度执行，它读取 `x` 时必须得到 `1` 而不是旧的 `0`，否则程序逻辑会出错。
		- **多处理器环境（Multiprocessor）**：
		    - **原理**：多个 CPU 核心各自拥有独立的缓存，当其中一个核心修改了缓存中的数据，其他核心的缓存必须同步更新，这需要硬件提供**缓存一致性协议**（如 MESI 协议）。
		    - **示例**：CPU1 修改了缓存中的变量 `flag`，CPU2 随后读取 `flag`。如果没有缓存一致性，CPU2 可能从自己的缓存中读到旧的 `flag` 值，导致程序无法感知 CPU1 的修改。
	- 多处理器系统（Multiprocessor Systems – SMP 架构）
	- ![[Pasted image 20260917154003.webp]]
		**核心内容**：对称多处理（SMP）架构中，多个 CPU 处理器通过系统总线共享物理内存，但每个 CPU 拥有自己独立的寄存器组。
		- **原理**：所有 CPU 地位平等，都能访问全部内存，操作系统可以调度进程到任意一个 CPU 上运行。
		- **示例**：一台 4 核电脑，每个核心都有自己的程序计数器（PC）和通用寄存器，但它们共享同一根 16GB 内存条。当运行浏览器时，不同标签页的进程可能同时在不同核心上执行，通过共享内存交换数据。
	- 多核系统（Multicore Systems）
	- ![[Pasted image 20260917154051.webp|404]]
		**核心内容**：多核处理器将多个计算核心集成在单一芯片（die）上，相比多芯片系统，片上通信速度更快、功耗更低。
		- **原理**：核心之间的数据交换通过芯片内部总线完成，延迟远低于芯片间通过主板总线的通信；同时集成设计减少了信号传输的能耗。
		- **示例**：智能手机的 SoC（如苹果 A17、高通骁龙）采用多核设计，大核处理复杂任务，小核处理后台轻量任务，既保证性能又延长电池续航，非常适合移动设备。
	- NUMA 架构（The NUMA Architecture）
	- ![[Pasted image 20260917154104.webp|383]]
		**核心内容**：非统一内存访问（NUMA）架构中，CPU 通过共享互连连接，内存分布在不同的节点上。访问本地节点内存快，访问远程节点内存慢。
		- **原理**：随着 CPU 数量增加，SMP 的总线会成为瓶颈，NUMA 将内存划分给各个 CPU 节点，扩展性好。但远程内存访问延迟高，操作系统需要智能调度。
		- **示例**：一台 4 插槽服务器，每个插槽插一个 16 核 CPU 并附带 64GB 本地内存。若 CPU0 上的进程频繁访问 CPU1 节点的内存，性能会大幅下降。因此操作系统会尽量将进程调度到其内存所在的节点（CPU），并尽量分配本地内存。
- Operating System Structure (Taxonomy 分类法)
	- Multiprogramming needed for efficiency ==(CPU utilization)==
		- Single user cannot keep CPU and I/O devices busy at all times
		- Multiprogramming organizes jobs (code and data) so CPU always has one to execute
		- A subset of total jobs in system is kept in memory
		- One job **selected** and run via **job scheduling**
		- When it has to wait (for I/O for example), OS switches to another job
	- Timesharing 分时 **(multitasking 多任务)** is logical extension in which CPU switches ==jobs(process)== so frequently that users can interact with each job while it is running, creating interactive computing ==(interactivity)==
		- Response time should be < 1 second
		- Each user has ==at least one== program executing in memory → process
		- If several jobs ready to run ==at the same time== → CPU scheduling
		- If processes don’t fit in memory, swapping(交换) moves them in and out to run
		- Virtual memory allows execution of processes not completely in memory  虚拟内存允许执行未完全载入内存的进程
![[Pasted image 20260917154732.webp|467]]
- Operating-System Operations
	- Interrupt driven by hardware
	- Software error or request creates ==exception== or ==trap==
		- Division by zero, request for operating system service
	- Other process problems include ==infinite loop 死循环==, processes modifying each other or the operating system
	**Thus we need protection:**
	- Dual-mode operation allows OS to protect itself and other system components
		- **User mode 用户模式 and kernel mode 内核模式**
		- Mode bit provided by hardware
			——Provides ability to distinguish when system is running user code or kernel code
			——Some instructions designated **as privileged** **特权指令**, **only executable in kernel mode**
			——System call changes mode to kernel, return from call resets it to user
	![[Pasted image 20260917155029.webp|421]]
	==特权指令统一移交kernel进行接管==，状态改写
	执行模式隔离，用户行为灵活，进程隔离，用户代码与系统代码的隔离
## Timer & Interrupt
- Timer to prevent infinite loop / process hogging resources
	- Set interrupt after specific period
	- Operating system decrements counter
	- When counter zero generate an interrupt
	- Set up before scheduling process to regain control or terminate program that exceeds allotted time
## Process Management（进程管理）
- A process is a program in execution. It is a unit of work within the system. Program is a ==passive entity==, process is an ==active entity==.  
	进程是正在执行的程序。它是系统内的一个工作单元。程序是被动实体，进程是主动实体。
- Process needs resources to accomplish its task  
	进程需要资源来完成其任务
	- CPU, memory, I/O, files  
		CPU、内存、I/O、文件
	- Initialization data  
		初始化数据
- Process termination requires reclaim of any reusable resources  
	进程终止需要回收所有可复用的资源
- Single-threaded process has one ==program counter== specifying location of next instruction to execute  
	单线程进程有一个程序计数器，用于指定下一条要执行的指令的位置
	- Process executes instructions sequentially, one at a time, until completion  
		进程按顺序执行指令，一次执行一条，直到完成
- Multi-threaded process has one ==program counter per thread==  
	多线程进程为每个线程配备一个程序计数器
- Typically system has many processes, some user, some operating system running concurrently on ==one or more CPUs==  
	通常系统有许多进程，一些是用户进程，一些是操作系统进程，在一个或多个CPU上并发运行
	- Concurrency by ==multiplexing the CPUs== among the processes / threads  
		通过在处理进程/线程之间复用CPU来实现并发
## Process Management Activities（进程管理活动）
- The operating system is responsible for the following activities in connection with process management:  
	操作系统负责与进程管理相关的下列活动：
- ==Creating== and ==deleting== both user and system processes  
	创建和删除用户及系统进程
- ==Suspending== and ==resuming== processes  
	挂起和恢复进程
- Providing mechanisms for process ==synchronization==  
	提供进程同步机制
- Providing mechanisms for process ==communication==  
	提供进程通信机制
- Providing mechanisms for ==deadlock== handling  
	提供死锁处理机制
	
- Synchronization is about timing; communication is about data movement.  
	同步关乎时序；通信关乎数据移动。
## Memory Management（内存管理）
- All ==data== must be in memory before and after processing  
	所有数据在处理前后必须位于内存中
- All ==instructions== must be in memory in order to execute  
	所有指令为了执行必须位于内存中
- Memory management determines what is in memory when  
	内存管理决定何时将什么保留在内存中
	- Optimizing CPU utilization and computer response to users  
		优化CPU利用率以及计算机对用户的响应
- Memory management activities  
	内存管理活动
	- Keeping track of which parts of memory are currently being used and by whom  
		跟踪内存的哪些部分当前正在被使用以及被谁使用
	- Deciding which processes (or parts thereof) and data to move into and out of memory  
		决定哪些进程（或其部分）和数据移入或移出内存
	- Allocating and deallocating memory space as needed  
		根据需要分配和回收内存空间
## Storage Management（存储管理）
- OS provides uniform, logical view of information storage  
	操作系统提供统一、逻辑的信息存储视图
	- Abstracts physical properties to logical storage unit - ==file==  
		将物理属性抽象为逻辑存储单元——文件（file）
	- Each medium is controlled by device (i.e., disk drive, tape drive)  
		每种介质由设备控制（即磁盘驱动器、磁带驱动器）
		- Varying properties include access speed, capacity, data-transfer rate, access method (sequential or random)  
			不同的属性包括访问速度、容量、数据传输率、访问方法（顺序或随机）
- File-System management  
	文件系统管理
	- Files usually organized into ==directories==  
		文件通常组织成目录（directories）
	- ==Access control== on most systems to determine who can access what  
		大多数系统上的访问控制（Access control），以确定谁可以访问什么
- OS activities include  
	操作系统活动包括
	- Creating and deleting files and directories  
		创建和删除文件与目录
	- Primitives to manipulate files and dirs  
		操作文件和目录（dirs）的原语
	- Mapping files onto secondary storage  
		将文件映射到二级存储
	- Backup files onto stable (non-volatile) storage media  
		将文件备份到稳定（非易失性）存储介质上
## Mass-Storage Management（大容量存储管理）
- Usually disks used to store data that does not fit in main memory or data that must be kept for a "long" period of time.  
	通常使用磁盘来存储无法放入主存的数据，或必须保留“长”时间的数据。
- Proper management is of central importance  
	恰当的管理至关重要
- Entire ==speed== of computer operation hinges on disk subsystem and its algorithms  
	计算机操作的整体速度取决于磁盘子系统及其算法（speed）
- OS activities  
	操作系统活动
	- Free-space management  
		空闲空间管理
	- Storage allocation  
		存储分配
	- Disk scheduling  
		磁盘调度
- Some storage needs not be fast  
	某些存储不需要很快
	- Tertiary storage includes optical storage, magnetic tape  
		三级存储包括光存储、磁带
	- Still must be managed  
		仍然必须被管理
	- Varies between WORM (write-once, read-many-times) and RW (read-write)  
		介于 WORM（一次写入，多次读取）和 RW（读写）之间
## I/O Subsystem（I/O子系统）
- One purpose of OS is to ==hide peculiarities== of hardware devices from the user – ease of usage & programming  
	操作系统的目的之一是向用户隐藏硬件设备的特殊性（peculiarities）——以便于使用和编程
- I/O subsystem responsible for  
	I/O子系统负责
	- Memory management of I/O including ==buffering== (storing data temporarily while it is being transferred), ==caching== (storing parts of data in faster storage for performance), ==spooling== (the overlapping of output of one job with input of other jobs)  
		I/O的内存管理，包括缓冲（buffering）（在数据传输时临时存储数据）、缓存（caching）（将部分数据存储在更快的存储中以提高性能）、假脱机（spooling）（将一个作业的输出与其他作业的输入重叠进行）
	- General device-driver interface  
		通用设备驱动程序接口
	- Drivers for specific hardware devices  
		特定硬件设备的驱动程序
## OS Purposes（操作系统目的）
- Abstraction  
	抽象
- Multiplex  
	多路复用
- Isolation  
	隔离
- Sharing  
	共享
- Security  
	安全
- Performance  
	性能
- Range of uses  
	使用范围（或适用范围）
