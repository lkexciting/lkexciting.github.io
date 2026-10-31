---
title: Chapter 3
aliases:
  - OS/notes/Chapter 3
---
# Chapter 3:  Processes
- **Outlines**
	- Process Concept
	- Process Scheduling
	- Operations on Processes
	- Cooperating Processes
	- Interprocess Communication
	- Communication in Client-Server Systems
- **Process Concept**
	- An operating system executes a variety of programs:
		- Batch system – a batch is a sequence of jobs
		- Time-sharing systems – user programs or tasks
			- Multitasking
			- Less turnaround, less CPU idle, user interaction
	![[Pasted image 20260929172756.webp]]
	- Textbook uses the terms job and process almost interchangeably
	- ==Process== – a program in execution; process execution must progress in sequential fashion
	- A process includes:
		- text section (code) 存放程序执行的机器指令，通常为只读。
		- data section (global vars) 存放全局变量和静态变量。
		- stack (function parameters, local vars, return addresses) 存放函数参数、局部变量和返回地址，采用后进先出原则，由系统自动分配和回收。
		- heap (dynamically allocated memory) 用于动态内存分配，需程序员手动申请和释放。
		- program counter 指向当前执行指令的下一条指令地址，属于 CPU 寄存器，上下文切换时需保存和恢复。
	- **Process in Memory**
		![[Pasted image 20260929173538.webp|480]]
		==注意 stack 和 heap 是相向的，是为了灵活，动态共享中间的区域！==
	- **Process State**
		- As a process executes, it changes ==state==
			- **new**:  The process is being created
			- **running**:  Instructions are being executed
			- **ready**:  The process is waiting to be assigned to a processor (loaded into main memory)
			- **waiting/blocked**:  The process is waiting/blocked for some event to occur
			- **terminated**:  The process has finished execution
		![[Pasted image 20260929174310.webp|591]]
	- **Process Control Block 进程控制块**（PCB）
		Information associated with each process
		- Process state
		- Program counter
		- Contents of CPU registers （CPU 寄存器内容）
		- CPU scheduling information （CPU 调度信息）
		- Memory-management information （内存管理信息）
		- Accounting information （记账信息）
		- I/O status information
		![[Pasted image 20261008135143.webp|206]]![[Pasted image 20261008135729.webp|383]]
- **Process Scheduling**
	- ==Job queue== – set of all processes in the system （进程调度队列）
	- ==Ready queue== – set of all processes residing in main memory, ready and waiting to execute （就绪队列——驻留在主存中、已就绪并等待执行的所有进程的集合）
	- ==Device queues== – set of processes waiting for an I/O device （设备队列——等待 I/O 设备的进程集合）
	- Processes migrate among the various queues （进程在各种队列之间迁移）
	==就绪队列和 I/O 设备队列==
	![[Pasted image 20261008141015.webp|467]]
	==进程调度表示==
	![[Pasted image 20261008141050.webp|467]]
	- **Schedulers**
		- ==Long-term scheduler==  (or job scheduler) – selects which processes should be brought into memory (the ready queue)
		- ==Short-term scheduler==  (or CPU scheduler) – selects which process should be executed next and allocates CPU
		![[Pasted image 20261008141719.webp|452]]![[Pasted image 20261008141732.webp|452]]
		- Short-term scheduler is invoked very frequently 短期调度器被非常频繁地调用(milliseconds) →(must be fast)
		- Long-term scheduler is invoked very infrequently 长期调度器被非常不频繁地调用(seconds, minutes) →(may be slow)
		- The long-term scheduler controls the ==degree of multiprogramming==长期调度器控制多道程序设计的程度
		- Processes can be described as either:
			- ==I/O-bound process== – spends more time doing I/O than computations, many short CPU bursts
			- ==CPU-bound process== – spends more time doing computations; few very long CPU bursts
	- **Context Switch**
		- **基本操作**：CPU 切换到另一进程时，系统必须保存旧进程状态，并加载新进程的已保存状态。
		- **切换开销**：上下文切换时间属于系统开销（overhead），切换期间系统不做有用工作，通常耗时毫秒级（milliseconds）。
		- **硬件依赖**：切换耗时取决于硬件支持（hardware support），例如 SPARC 架构（SPARC architecture）提供了寄存器组（groups of registers）。
- **Operations on Processes**
	- 父进程（Parent process）创建子进程（Children processes），子进程再继续创建其他进程，从而形成进程树（Tree of processes）。
	- 在==资源共享==（Resource sharing）方面，父子进程之间可以共享所有资源（Share all resources）、共享父进程资源的子集（Share subset of parent's resources），或者完全不共享（Share no resources）。
	- 在==执行方式==（Execution）上，父子进程可以并发执行（Execute concurrently），或者父进程等待直到子进程终止（Parent waits until children terminate）。
	- **地址空间（Address space）**
		- 子进程是父进程的副本（Child duplicate of parent）
		- 子进程加载一个程序（Child has a program loaded into it）
	- **UNIX 示例（UNIX examples）**
		- fork 系统调用（fork system call）创建新进程
		- exec 系统调用（exec system call）在 fork 之后使用，用新程序替换进程的内存空间（memory space）
		![[Pasted image 20261008143819.webp|516]]![[Pasted image 20261008144141.webp|521]]![[Pasted image 20261008144155.webp|517]]
	- **Process Termination**
		- 当进程执行完最后一条语句后，会通过 **exit**​ 系统调用请求操作系统删除自身，并通过 **wait**​ 将输出数据传递给父进程，随后操作系统回收该进程的资源（**deallocated**）。
		- 此外，父进程也可通过 **abort**​ 主动终止子进程的执行，常见原因包括子进程超出了分配的资源（**exceeded allocated resources**）或分配给它的任务不再需要。
		- 当父进程退出时，某些操作系统不允许子进程继续运行，而是触发级联终止（**cascading termination**），即终止所有子进程。
- **Cooperating Processes**
	- ==Independent== process cannot affect or be affected by the execution of another process （独立进程不能影响其他进程的执行，也不能被其他进程的执行所影响）
	- ==Cooperating== process can affect or be affected by the execution of another process （协作进程可以影响其他进程的执行，也可以被其他进程的执行所影响）
	- Advantages of process cooperation （进程协作的优点）
		- Information sharing （信息共享）
		- Computation speed-up (Multiple CPUs) （计算加速（多 CPU））
		- Modularity （模块化）
		- Convenience （便利性）
	- Paradigm for cooperating processes, producer process produces information that is consumed by a consumer process （协作进程的一种范式，生产者进程生产信息，由消费者进程消费）
		- unbounded-buffer places no practical limit on the size of the buffer. Consumer has to wait if no new item. （无界缓冲区对缓冲区大小没有实际限制。如果没有新项，消费者必须等待。）
		- bounded-buffer assumes that there is a fixed buffer size. Producer must wait if buffer full. （有界缓冲区假定缓冲区大小是固定的。如果缓冲区满，生产者必须等待。）
			- Bounded-Buffer – Shared-Memory Solution
				```c
				Shared data
				#define BUFFER_SIZE 10
				typedef struct {
				    // item fields
				} item;

				item buffer[BUFFER_SIZE];
				int in = 0;
				int out = 0;
				```
			- Bounded-Buffer – Insert() Method
				```c
				Producer pseudo-code:
				while(true){
				    Produce an item;
				    while(((in + 1) % BUFFER_SIZE == out)
				        ;/* do nothing-- no free buffers*/
				    buffer[in] = item;
				    in = (in + 1) % BUFFER_SIZE;
				}
				```
			- Bounded Buffer – Remove() Method
				```c
				Consumer pseudo-code:
				while(true){
				    while(in == out)
				        ;//do nothing, nothing to consume
				    Remove an item from the buffer;
				    item = buffer[out];
				    out = (out + 1) % BUFFER_SIZE;
				    return item;
				}
				// Solution is correct, but can only use BUFFER_SIZE-1 elements
				```
- **Interprocess Communication**
	进程间通信（IPC）
	- Mechanism for processes to communicate and to synchronize their actions
	    进程间通信和同步其动作的机制
	- Two models for IPC: message passing and shared memory
	    IPC 的两种模型：消息传递和共享内存
	- Message passing – processes communicate with each other without resorting to shared variables
	    消息传递——进程之间在不借助共享变量的情况下进行通信
	- Message-passing facility provides two operations:
	    消息传递设施提供两种操作：
	    - send(message) – message size fixed or variable
	        send(message)（发送（消息））——消息大小固定或可变
	    - receive(message)
	        receive(message)（接收（消息））
	- If P and Q wish to communicate, they need to:
	    如果进程 P 和 Q 希望进行通信，它们需要：
	    - establish a communication link between them
	        在它们之间建立一条通信链路
	    - exchange messages via send/receive
	        通过 send/receive（发送/接收）交换消息
	- Implementation of communication link
	    通信链路的实现
	    - physical (e.g., shared memory, hardware bus)
	        物理的（例如，共享内存、硬件总线）
	    - logical (e.g., logical properties)
	        逻辑的（例如，逻辑属性）
	![[Pasted image 20261008150421.webp|526]]
	- **Direct Communication**
		- Processes must name each other ==explicitly==: （进程必须显式地命名彼此：）
			- send (P, message) – send a message to process P （send(P, message) – 向进程 P 发送消息）
			- receive(Q, message) – receive a message from process Q （receive(Q, message) – 从进程 Q 接收消息）
		- Properties of communication link （通信链路的属性）
			- Links are established ==automatically== （链路自动建立）
			- A link is associated with ==exactly one pair== of communicating processes （一条链路只与恰好一对通信进程相关联）
			- Between each pair there exists ==exactly one link== （每一对进程之间恰好存在一条链路）
			- The link may be unidirectional, but is usually bi-directional （链路可以是单向的，但通常是双向的）
	- **Indirect Communication**
		- Messages are directed and received from ==mailboxes== (also referred to as ==ports==) （消息被定向到邮箱（也称为端口）并从邮箱接收）
			- Each mailbox has a unique id （每个邮箱都有一个唯一的标识符（id））
			- Processes can communicate only if they share a mailbox （只有当进程共享一个邮箱时，它们才能进行通信）
		- Properties of communication link （通信链路的属性）
			- Link established only if processes share a common mailbox （只有当进程共享一个公共邮箱时，链路才会被建立）
			- A link may be associated with ==many processes== （一条链路可以与多个进程相关联）
			- Each pair of processes may share ==several communication links== （每一对进程可以共享多条通信链路）
			- Link may be unidirectional or bi-directional （链路可以是单向的或双向的）
		- Operations （操作）
			- create a new mailbox （创建新邮箱）
			- send and receive messages through mailbox （通过邮箱发送和接收消息）
			- destroy a mailbox （销毁邮箱）
		- Primitives are defined as: （原语定义如下：）
			    send(A, message) – send a message to mailbox A （send(A, message) – 向邮箱 A 发送消息）
			    receive(A, message) – receive a message from mailbox A （receive(A, message) – 从邮箱 A 接收消息）
		- Mailbox sharing
			邮箱共享
			- P1, P2, and P3 share mailbox A
				P1、P2 和 P3 共享邮箱 A
			- P1, sends; P2 and P3 receive
				P1 发送；P2 和 P3 接收
			- Who gets the message?
				谁会收到消息？
		- Solutions
			解决方案
			- Allow a link to be associated with at most two processes
				允许一条链路最多与两个进程相关联
			- Allow only one process at a time to execute a receive operation
				允许每次只有一个进程执行接收操作
			- Allow the system to select arbitrarily the receiver. Sender is notified who the receiver was.
				允许系统任意选择接收者。发送者会收到通知，告知接收者是谁。
	- **Synchronization**
		- Message passing may be either blocking or non-blocking
			消息传递可以是阻塞的或非阻塞的
		- Blocking is considered synchronous
			阻塞被视为同步
			- Blocking send has the sender blocked until the message is received
				阻塞发送会使发送者阻塞，直到消息被接收
			- Blocking receive has the receiver block until a message is available
				阻塞接收会使接收者阻塞，直到有消息可用
		- Non-blocking is considered asynchronous
			非阻塞被视为异步
			- Non-blocking send has the sender send the message and continue
				非阻塞发送让发送者发送消息后继续执行
			- Non-blocking receive has the receiver receive a valid message or null
				非阻塞接收让接收者接收一个有效消息或空值
