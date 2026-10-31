---
title: Chapter 2
aliases:
  - OS/notes/Chapter 2
---
## Outline
- Operating System Services
- User Operating System Interface
- System Calls
- Types of System Calls
- System Programs
- Operating System Design and Implementation
- Operating System Structure
- Virtual Machines
- Operating System Generation
- System Boot
## Objectives
- To describe the services an operating system provides to users, processes, and other systems
	描述操作系统提供给用户、进程和其他系统的服务
- To discuss the various ways of structuring an operating system
	讨论构建操作系统的各种方式
- To explain how operating systems are installed and customized and how they boot
	解释操作系统如何被安装、定制以及如何引导启动
## Operating System Services
**One set of** operating-system services provides functions that are helpful to the user:
- ==User interface== - Almost all operating systems have a user interface (UI)
	用户界面 — 几乎所有操作系统都有用户界面 (UI)
	- Varies between Command-Line (CLI), Graphics User Interface (GUI), Batch
		分为命令行 (CLI)、图形用户界面 (GUI)、批处理
- ==Program execution== - The system must be able to load a program into memory and to run that program, end execution, either normally or abnormally (indicating error)
	程序执行 — 系统必须能将程序加载到内存并运行，正常或异常（指示错误）结束执行
- ==I/O operations== - A running program may require I/O, which may involve a file or an I/O device.
	I/O操作 — 运行中的程序可能需要I/O，可能涉及文件或I/O设备
- ==File-system manipulation== - The file system is of particular interest. Obviously, programs need to read and write files and directories, create and delete them, search them, list file information, permission management.
	文件系统操作 — 文件系统特别受关注。程序需读写文件和目录、创建和删除、搜索、列出文件信息、权限管理
- ==Communications== - Processes may exchange information, on the same computer or between computers over a network
	通信 — 进程可以交换信息，在同一台计算机上或通过网络的计算机之间
	- Communications may be via shared memory or through message passing (packets moved by the OS)
		通信可以通过共享内存或通过消息传递（由OS移动数据包）
- ==Error detection== - OS needs to be constantly aware of possible errors
	错误检测 — OS需要持续注意可能的错误
	- May occur in the CPU and memory hardware, in I/O devices, in user program
		可能发生在CPU和内存硬件、I/O设备、用户程序中
	- For each type of error, OS should take the appropriate action to ensure correct and consistent computing
		对于每种类型的错误，OS应采取适当的操作以确保正确和一致的计算
	- Debugging facilities can greatly enhance the user's and programmer's abilities to efficiently use the system
		调试工具可以极大地增强用户和程序员高效使用系统的能力
**Another** set of OS functions exists for ensuring the efficient operation of the system itself via resource sharing
- ==Resource allocation== - When multiple users or multiple jobs running concurrently, resources must be allocated to each of them
	资源分配 — 当多个用户或多个作业并发运行时，必须将资源分配给它们中的每一个
	- Many types of resources - Some (such as CPU cycles, memory, and file storage) may have special allocation code, others (such as I/O devices) may have general request and release code.
		多种类型的资源 — 有些（如CPU周期、内存和文件存储）可能有特殊的分配代码，其他（如I/O设备）可能有一般的请求和释放代码。
- ==Accounting== - To keep track of which users use how much and what kinds of computer resources
	记账 — 跟踪哪些用户使用了多少和什么类型的计算机资源
- ==Protection and security== - The owners of information stored in a multiuser or networked computer system may want to control use of that information, concurrent processes should not interfere with each other
	保护和安全 — 存储在多用户或网络计算机系统中的信息的所有者可能希望控制该信息的使用，并发进程不应相互干扰
	- Protection involves ensuring that all access to system resources is controlled
		保护涉及确保所有对系统资源的访问都受控
	- Security of the system from outsiders requires user authentication, extends to defending external I/O devices from invalid access attempts
		系统免受外部侵害的安全需要用户认证，延伸到防御外部I/O设备的无效访问尝试
	- If a system is to be protected and secure, precautions must be instituted throughout it. A chain is only as strong as its weakest link.
		如果系统要受到保护和保证安全，必须在整个系统中建立预防措施。链条的强度取决于它最薄弱的环节。
## User Operating System Interface
- CLI
	- 核心主题
		CLI allows direct command entry
		CLI（命令行界面）允许直接输入命令
	- 核心特点
		Sometimes implemented in kernel, sometimes by systems program
		有时在内核中实现，有时由系统程序实现
		Sometimes multiple flavors implemented - shells
		有时实现多种版本 — shells（壳）
		Primarily fetches a command from user and executes it
		主要从用户获取命令并执行它
		Sometimes commands built-in (DOS), sometimes just names of programs (Unix)
		有时命令是内置的（DOS），有时只是程序的名称（Unix）
		- If the latter, adding new features doesn't require shell modification
		- 如果是后者，添加新功能不需要修改shell
- GUI
	GUI采用桌面隐喻（desktop metaphor），通常使用鼠标（mouse）、键盘（keyboard）和显示器（monitor），用图标（icon）表示文件、程序、动作等。用户通过对界面对象点击不同鼠标按钮触发各种操作，如提供信息、显示选项、执行功能或打开目录（文件夹）。该技术最早发明于施乐帕克研究中心（Xerox PARC）。如今许多操作系统同时包含命令行界面（Command-Line Interface, CLI）和GUI，例如微软Windows以GUI为主并配有CLI命令壳（command shell）；苹果Mac OS X在UNIX内核（kernel）之上提供Aqua GUI界面，并可使用shell；而Solaris则以CLI为基础，可选安装Java Desktop或KDE等GUI环境。
- **System Calls**![[Pasted image 20260922165843.webp|668]]
	- System call sequence to copy the contents of one file to another file![[Pasted image 20260922170017.webp|548]]
		内容很长，所以一般现在不写了
	- System Call Implementation
		通常，每个系统调用（system call）都关联一个编号（==number==），系统调用接口（system-call interface）维护一个按这些编号索引的表（==table==）。该接口调用操作系统内核（OS kernel）中对应的系统调用，并==返回调用状态（status）和返回值（return values）==。调用者（caller）无需了解系统调用的具体实现，只需遵守应用程序接口（API）并理解操作系统的行为结果。大部分操作系统==接口细节被API隐藏==，由运行时支持库（run-time support library，即编译器自带库中的一组函数）管理。![[Pasted image 20260922170821.webp|522]]
	- Standard C Library Example
		C program invoking printf() library call, which calls write() system call![[Pasted image 20260922171013.webp]]
	- System Call Parameter Passing
		系统调用参数传递（System Call Parameter Passing）
		- 向操作系统（OS）传递参数时，通常所需的信息不仅仅是系统调用（system call）的标识，确切的信息类型和数量根据操作系统和具体调用而异。
		- 有三种通用方法：
			- 最简单的方法是在寄存器（registers）中传递参数，但有时参数数量会多于寄存器。
			- 第二种方法是将参数存储在内存中的一个块（block）或表（table）中，并将该块的地址作为一个参数在寄存器（register）中传递，Linux 和 Solaris 采用了这种方法。
			- 第三种方法是由程序将参数放置（或压入，pushed）到栈（stack）上，然后由操作系统从栈中弹出（popped off）。块（block）和栈（stack）方法不限制传递参数的数量或长度。
## Types of System Calls
- Process control
- File management
- Device management
- Information maintenance (e.g., time, date)
- Communications
- Protection![[Pasted image 20260922172002.webp|572]]
	Unix: Everything is a file!
## System Programs
- 系统程序（System programs）为程序开发和执行提供了一个便捷的环境。它们可以分为：文件操作（File manipulation）、状态信息（Status information）、文件修改（File modification）、编程语言支持（Programming language support）、程序加载和执行（Program loading and execution）、通信（Communications）以及应用程序（Application programs）。大多数用户对操作系统（operating system）的看法是由系统程序（system programs）定义的，而不是实际的系统调用（system calls）。![[Pasted image 20260922172815.webp]]
- 为程序开发和执行提供一个便捷环境（convenient environment）。其中一些仅仅是系统调用（system calls）的用户接口（user interfaces）；而另一些则相当复杂。
- 文件管理（File management）——创建、删除、复制、重命名、打印、转储、列出以及通常对文件和目录的操作。
- 状态信息（Status information）。一些程序向系统请求信息（info）——日期、时间、可用内存量、磁盘空间、用户数量。其他程序提供详细的性能、日志记录和调试信息。通常，这些程序格式化输出并将其打印到终端（terminal）或其他输出设备。一些系统实现了注册表（registry）——用于存储和检索配置信息。
- 文件修改（File modification）：使用文本编辑器（Text editors）创建和修改文件，以及使用特殊命令（Special commands）搜索文件内容或执行文本转换。编程语言支持（Programming-language support）——有时提供编译器（Compilers）、汇编器（assemblers）、调试器（debuggers）和解释器（interpreters）。程序加载和执行（Program loading and execution）——包括绝对加载器（Absolute loaders）、可重定位加载器（relocatable loaders）、链接编辑器（linkage editors）和覆盖加载器（overlay-loaders），以及用于高级语言和机器语言的调试系统（debugging systems）。通信（Communications）——提供在进程（processes）、用户（users）和计算机系统（computer systems）之间创建虚拟连接（virtual connections）的机制，允许用户互相发送消息到屏幕、浏览网页（web pages）、发送电子邮件（electronic-mail messages）、远程登录（log in remotely）、以及将文件从一台机器传输到另一台机器（transfer files from one machine to another）。
## Operating System Design and Implementation
- 操作系统（Operating System, OS）的设计与实现并非“可解的（solvable）”，但一些方法已被证明是成功的。不同操作系统（Operating Systems）的内部结构（Internal structure）可能差异很大。首先需要定义目标（goals）和规格（specifications），这受到硬件选择（choice of hardware）和系统类型（type of system）的影响。用户目标（User goals）和系统目标（System goals）：用户目标——操作系统应便于使用（convenient to use）、易于学习（easy to learn）、可靠（reliable）、安全（safe）且快速（fast）；系统目标——操作系统应易于设计、实现和维护（easy to design, implement, and maintain），并且灵活（flexible）、可靠（reliable）、无错误（error-free）且高效（efficient）。![[Pasted image 20260922173759.webp|600]]![[Pasted image 20260922173830.webp]]
	==机制与策略分离==
## Operating System Structure
- Simple Structure: MS-DOS – written to provide the most functionality in the least space
	![[Pasted image 20260922174322.webp|430]]
	- Not divided into modules
	- Although MS-DOS has some structure, its interfaces and levels of functionality are not well separated
- ==Monolithic Structure（宏内核）==: UNIX – limited by hardware functionality, the original UNIX operating system had limited structuring.  The UNIX OS consists of two separable parts
	- System programs
	- The kernel
		- Consists of everything below the system-call interface and above the physical hardware
		- Provides the file system, CPU scheduling, memory management, and other operating-system functions; ==a large number of functions for one level==分层简单
		![[Pasted image 20260922174453.webp|529]]
- ==Microkernel Structure（微内核）== 
	将尽可能多的功能从内核（kernel）移入“用户”（user）空间。用户模块（user modules）之间使用消息传递（message passing）进行通信（Communication）。优点（Benefits）：更容易扩展微内核（microkernel）；更容易将操作系统移植（port）到新的体系结构（architectures）；更可靠（reliable）（更少代码运行在内核模式（kernel mode）下）；更安全（secure）。缺点（Detriments）：用户空间（user space）到内核空间（kernel space）通信的性能开销（Performance overhead）。
	![[Pasted image 20260922175025.webp]]
- 可不可以结合宏内核和微内核？
	![[Pasted image 20260929164507.webp|526]]
	宏内核和微内核得结合==hybrid（杂交的）==
	![[Pasted image 20260929165254.webp|530]]
- ==Layered Approach（分层方法）==
	- The operating system is divided into a number of layers (levels), ==each built on top of lower layers==.  The bottom layer (layer 0), is the hardware; the highest (layer N) is the user interface.
	- With modularity, layers are selected such that each uses functions (operations) and services of only lower-level layers
	![[Pasted image 20260929165424.webp|369]]
- ==Modules模块==
	- Most modern operating systems implement ==kernel modules==
		- Uses object-oriented approach
		- Each core component is separate
		- Each talks to the others over known interfaces
			- Modules call each other instead of message passing
		- Each is ==loadable== as needed within the kernel
	- Overall, similar to layers but more flexible
	![[Pasted image 20260929165900.webp|455]]
- ==Other Structure==
	- Exokernel (1994), 高度简化kernel，只负责资源分配，提供了低级的硬件操作，必须通过定制library供应用使用。高性能，但定制化library难度大，兼容性差
	![[Pasted image 20260929165946.webp|425]]
	- Unikernel: statically linked with the OS code needed. Good for cloud service, APP boots in tens of ms.
		![[Pasted image 20260929170219.webp|427]]
## Virtual Machines
- A ==virtual machine== takes the layered approach to its logical conclusion.  It treats hardware and the operating system kernel as though they were all hardware
- A virtual machine provides an interface identical to the underlying bare ==hardware==
- The operating system creates the illusion of multiple processes, each executing on its own processor with its own (virtual) memory
- The resources of the physical computer are shared to create the virtual machines
	- CPU scheduling can create the appearance that users have their own processor
	- Spooling and a file system can provide virtual card readers and virtual line printers
	- A normal user time-sharing terminal serves as the virtual machine operator’s console
	![[Pasted image 20260929171207.webp|310]]
- Types of Hypervisor
	![[Pasted image 20260929171618.webp|311]]
- The Java Virtual Machine
	![[Pasted image 20260929171643.webp|318]]
- Different Techniques
	![[Pasted image 20260929171703.webp|315]]
- The virtual-machine concept provides complete protection of system resources since each virtual machine is isolated from all other virtual machines.  This isolation, however, permits no direct sharing of resources.
- A virtual-machine system is a perfect vehicle for operating-systems research and development.  ==System development== is done on the virtual machine, instead of on a physical machine and so does not disrupt normal system operation.
- The virtual machine concept is difficult to implement due to the effort required to provide an ==exact== duplicate to the underlying machine. (for example, virtual user mode and kernel mode)
## Operating System Generation
- Operating systems are designed to run on any of a class of machines; the system must be configured for each specific computer site
- SYSGEN program obtains information concerning the specific configuration of the hardware system
- Booting – starting a computer by loading the kernel
- Bootstrap program – code stored in ROM that is able to locate the kernel, load it into memory, and start its execution
## System Boot
- Operating system must be made available to hardware so hardware can start it
	- Small piece of code – bootstrap program (a.k.a. bootstrap loader), locates the kernel, loads it into memory, and starts it
	- Sometimes two-step process where boot block at fixed location loads bootstrap loader
	- When power initialized on system, execution starts at a fixed memory location
		- Firmware used to hold initial boot code
