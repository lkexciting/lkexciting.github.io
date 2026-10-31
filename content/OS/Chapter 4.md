---
title: Chapter 4
aliases:
  - OS/notes/Chapter 4
---
# Threads
- Outlines
	- **Overview**
		1. Thread（线程）的引入
			- 单线程（Single Thread）程序任务顺序执行，一个任务阻塞会影响整个程序响应。
			- 使用 **Thread（线程）** 将任务拆分，由 OS（Operating System，操作系统）调度，提高响应性。
		2. Multithreading（多线程）
			- 一个进程（Process）可以包含多个线程。
			- 每个线程执行不同任务，提高程序效率。
		3. Multithreading **Benefits**（多线程优势）
			- **Responsiveness（响应性）**：提高交互程序响应速度。
			- **Resource Sharing（资源共享）**：线程共享进程的代码和数据。
			- **Economy（经济性）**：线程创建和切换成本低于进程。
			- **Utilization of MP Architectures（多处理器架构利用）**：提高多 CPU 并发能力。
		4. Concurrency vs. Parallelism（并发与并行）
			- **Concurrency（并发）**：多个任务交替执行。
			- **Parallelism（并行）**：多个任务同时执行，需要多个 CPU Core（核心）。
		5. Thread 类型
			**User Threads（用户线程）**
			- 由用户级线程库管理。
			- 常见：
			    - **Pthreads（POSIX Threads，POSIX 线程）**
			    - **Win32 Threads（Windows 线程）**
			    - **Java Threads（Java 线程）**
			**Kernel Threads（内核线程）**
			- 由 Kernel（内核）支持和管理。
			- 常见系统：
			    - Windows
			    - Solaris
			    - Linux
			    - Mac OS X
	- **Multithreading Models**
		- Many-to-One
			- 多个 **User Threads（用户线程）** 映射到一个 **Kernel Thread（内核线程）**。
			- 优点：
			    - Thread management（线程管理）效率高。
			- 缺点：
			    - 若该模型只有一个内核执行实体，阻塞系统调用可能使整个进程无法继续执行；运行库采用非阻塞或异步接口时需另行分析。
			    - Kernel 一次只能调度一个线程。
			- 示例：
			    - Solaris Green Threads
			    - GNU Portable Threads
		- One-to-One
			- 每个 User Thread 对应一个 Kernel Thread。
			- 优点：
			    - 支持更多并发（Concurrency）。
			    - 一个线程阻塞不会影响其他线程。
			- 缺点：
			    - 创建线程成本较高。
			- 示例：
			    - Windows NT/XP/2000
			    - Linux
			    - Solaris 9+
		- Many-to-Many
			- 多个 User Threads 映射到多个 Kernel Threads。
			- 优点：
			    - 灵活；
			    - 可以创建足够数量的 Kernel Threads；
			    - 兼顾并发和资源消耗。
			- 示例：
			    - Solaris 9 以前
			    - Windows NT/2000 ThreadFiber
		- ![[Pasted image 20261013172147.webp]]
		- Two-Level Model
			- 基于 Many-to-Many 模型。
			- 额外允许：
			    - 某个 User Thread 绑定（bind）到指定 Kernel Thread。
			- 示例：
			    - IRIX
			    - HP-UX
			    - Tru64 UNIX
			    - Solaris 8 及以前
	- **Threading Issues**
		- **fork()（创建进程）**
			- fork() 是否复制调用线程？
			- 或复制进程中的所有线程？
			- 两种方式：
				  - 复制所有线程；
				  - 只复制调用 fork() 的线程。
		- **exec()（执行新程序）**
			- 会替换整个 Process（进程）。	
		- **Thread Cancellation（线程取消）**
			- 在线程完成任务前终止 Thread（线程）。
		- **Asynchronous Cancellation（异步取消）**
			- 立即终止目标线程。
		- **Deferred Cancellation（延迟取消）**
			- 线程周期性检查取消标志（flag）；
			- 在合适时间终止。
		- **Signal Handling（信号处理）**
			- **Signal（信号）**
				- UNIX 系统中用于通知进程某事件发生。
			- 处理过程：
				- Signal generated（信号产生）
				- Signal delivered（信号传递）
				- Signal handled（信号处理）
			- 信号处理方式：
				- 发送给产生信号的线程；
				- 发送给进程中的所有线程；
				- 发送给指定线程；
				- 指定一个线程接收所有信号。
		- **Thread Pool（线程池）**
			- 预先创建多个 Thread（线程），等待任务。
			- 优势：
				- 使用已有线程处理请求，比创建新线程更快；
				- 限制程序中的线程数量。
		- **Thread-Local Storage（TLS，线程本地存储）**
			- 每个线程拥有自己的数据副本。
			- 特点：
				- 具有跨调用保存状态的用途，但每线程分别拥有一份；
				- 但每个 Thread 独立保存。
			- 适用：
				- 无法控制线程创建过程时；
				- 例如 Thread Pool（线程池）。
		- **Scheduler Activations（调度激活）**
			- 用于 Many-to-Many（多对多）模型和 Two-level Model（两级模型）。
			- 提供 Kernel（内核）与 Thread Library（线程库）的通信机制。
		- **LWP（Lightweight Process，轻量级进程）**
			- 连接 Kernel Thread（内核线程）和应用线程的虚拟处理器。
		- **Upcall（向上调用）**
			- Kernel 通知 Thread Library 发生事件。

## 4. 从线程模型到具体接口

### 4.1 Pthreads 是接口规范，不是映射模型

Pthreads 规定线程创建、等待和同步等操作的行为，具体实现决定用户线程怎样对应内核执行实体。因此不能看到程序调用 pthread_create，就断言它一定是纯用户级线程或某一种映射。

```c
#include <pthread.h>

static void* worker(void* arg) {
    int* result = arg;
    *result = 42;
    return 0;
}
int main(void) {
    pthread_t thread;
    int result = 0;
    if (pthread_create(&thread, 0, worker, &result) != 0) return 1;
    if (pthread_join(thread, 0) != 0) return 1;
    return result == 42 ? 0 : 1;
}
```

主线程把 result 的地址传给工作线程，并在工作线程结束前保持该变量存活。join 等待目标线程结束并提供所需的完成同步，因此主线程在 join 成功后再读取结果。若多个工作线程并发读写同一个结果，则还需另外设计互斥或原子协议。

### 4.2 Windows 的一对一模型

以 Windows XP 这一历史实现为例，一个应用线程对应一个内核线程；线程具有标识、寄存器上下文、用户栈、内核栈与线程私有存储。ETHREAD、KTHREAD、TEB 分别服务不同层次的线程管理。这说明“线程共享进程地址空间”不等于“线程没有自己的运行状态”。

### 4.3 Linux task 与共享关系

Linux 以 task 组织执行实体；clone 一类创建机制允许按选项共享地址空间等资源。理解线程时应先问共享哪些资源、独有哪个栈和执行上下文，而不是只看 API 名字里有没有 thread。

### 4.4 Java 线程的创建与状态

传统 Java 线程可通过继承 Thread 或提供 Runnable 创建，调用 start 请求开始新线程；直接调用 run 只是当前线程中的普通方法调用。NEW、RUNNABLE、BLOCKED、WAITING、TIMED_WAITING、TERMINATED 是不同状态，不能把所有等待都当成占用 CPU 的忙循环。

取消或中断是一种协作协议：任务需要检查状态，并在退出前释放资源；不能假定请求发出后对象立刻消失。

## 5. 线程题的判断步骤

1. 先列共享内容：代码、全局变量、堆、打开的资源。
2. 再列私有内容：寄存器、栈、线程局部数据。
3. 确定用户线程与内核执行实体的映射，判断阻塞会影响谁。
4. 区分并发交错与多核并行，单核不意味着没有数据竞争。
5. 明确退出、取消、等待和同步协议，检查参数与资源的生命周期。
