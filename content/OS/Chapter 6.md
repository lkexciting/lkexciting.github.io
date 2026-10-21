---
title: Chapter 6
tags:
  - OS
  - 进程同步
  - 并发
source: ch6-Process Synchronization-20261020.pptx，共 105 页
aliases:
  - OS/notes/Chapter 6
---

# Chapter 6：进程同步（Process Synchronization）

> [!abstract] 这一章要解决什么？
> Chapter 5 讨论“谁获得 CPU”；本章讨论“多个执行者共享数据时，怎样保证结果正确”。
> 你需要能够：解释错误交错、判断临界区协议、设计信号量、读懂管程，以及分析并发事务。

> [!info] 阅读约定
> 依据所提供的 105 页课件整理，各节标注页码。专业术语在首次解释和关键定义处用“中文（English）”标注，算法同时注明英文全称和缩写。图片为课件原图，补充的推演明确标注为例题或理解补充。
> 除特别说明外，算法先在顺序一致性（Sequential Consistency）教学模型下讨论：每一步原子读写按某种全局交错发生，且各进程自己的程序顺序得到保留。忙等待算法还假设进程持续获得执行机会，临界区最终退出。现代语言和硬件的额外要求见第 5 节。
> 下文的 `wait/signal`、`sleep/wakeup` 和 `monitor` 多为教学伪代码（Pseudocode），不能直接当成完整 C 程序运行。

## 导航

- [[#1. 背景：为什么共享数据会出错]]
- [[#2. 临界区问题（Critical-Section Problem）]]
- [[#3. 三种不完整的软件方案]]
- [[#4. Peterson 算法（Peterson’s Solution）]]
- [[#5. 原子性、内存顺序与内存屏障]]
- [[#6. 面包房算法（Bakery Algorithm）]]
- [[#7. 硬件同步：关中断、TAS、Swap 与 CAS]]
- [[#8. 互斥锁（Mutex）与自旋锁（Spinlock）]]
- [[#9. 信号量（Semaphore）：从用法到实现]]
- [[#10. 唤醒丢失（Lost Wakeup）：为什么睡眠必须有协议]]
- [[#11. 死锁（Deadlock）与饥饿（Starvation）]]
- [[#12. 有界缓冲区（Bounded-Buffer Problem）]]
- [[#13. 读者—写者问题（Readers-Writers Problem）]]
- [[#14. 哲学家就餐问题（Dining-Philosophers Problem）]]
- [[#15. 管程（Monitor）与条件变量（Condition Variable）]]
- [[#16. 同步机制的系统实例与 Pthreads]]
- [[#17. 原子事务（Atomic Transactions）与恢复]]
- [[#18. 可串行化（Serializability）与并发控制]]
- [[#19. 对照表、做题模板与高频易错点]]
- [[#20. 自测题与逐步答案]]
- [[#21. 中英术语速查与课件覆盖索引]]

## 1. 背景：为什么共享数据会出错

对应课件：第 3～11 页。

### 1.1 从 CPU 调度过渡到进程同步

第 3 页复习上一章的 SJF/SRTF：调度会让进程在不同时间运行，抢占还会把一段执行拆开。于是，两个进程对同一变量的操作可能发生交错（Interleaving）。

- **并发（Concurrency）**：多个任务的执行在时间上重叠，可以在一个 CPU 上交错。
- **并行（Parallelism）**：多个任务在多个执行单元上同时执行。
- **协作进程（Cooperating Processes）**：一个进程能够影响另一个进程，或受其影响，例如共享缓冲区。
- **进程同步（Process Synchronization）**：通过协调执行顺序、进入条件和共享访问，维护程序要求。

**只有一个 CPU，也可能出现竞态。**因为进程可能恰好在“读了数据，还没写回”的时候被抢占。

### 1.2 生产者—消费者与环形缓冲区

生产者（Producer）生成数据，消费者（Consumer）取走数据，中间放一个大小为 N 的环形缓冲区（Circular Buffer）。

| 变量 | 含义 |
| --- | --- |
| buffer[N] | 存放数据的数组 |
| in | 下一次写入位置 |
| out | 下一次读取位置 |

每使用一个位置，指针向前走并循环：

```c
in  = (in  + 1) % N;
out = (out + 1) % N;
```

**不使用 count 的常见方案：保留一个空槽。**

- 空：`in == out`。
- 满：`(in + 1) % N == out`。
- 实际最多存 **N−1** 个元素，才能区分空和满。
- 元素数量可写为 `(in - out + N) % N`，假设下标均在 0～N−1。

课件写 `(in-out)%BUFFER_SIZE`，作为数学模可以理解；写成 C 时要考虑负余数，因此这里补上 `+N`。

例如 N=8，in=1、out=6，队列中有位置 6、7、0 共 3 个元素：`(1−6+8)%8=3`。

> [!note] 这个早期方案的边界
> 这里只用于理解环形下标，通常以单生产者、单消费者为背景。它不能不加条件地推广到多个生产者和消费者，也未解决现代内存可见性问题。

### 1.3 为使用全部 N 个槽，引入 count

令 `count` 记录已有数据数，初始为 0。生产者写入后执行 `count++`，消费者取走后执行 `count--`。

```c
// 错误示范：尚未加入正确同步
// producer
while (count == N) { }
buffer[in] = item;
in = (in + 1) % N;
count++;

// consumer
while (count == 0) { }
item = buffer[out];
out = (out + 1) % N;
count--;
```

直觉上“一加一减等于不变”，但 `++` 和 `--` 可能分别展开为三个步骤：

| producer 的 count++ | consumer 的 count-- |
| --- | --- |
| r1 = count | r2 = count |
| r1 = r1 + 1 | r2 = r2 − 1 |
| count = r1 | count = r2 |

`r1/r2` 是各自的寄存器或局部临时值，`count` 才是共享内存中的值。

### 1.4 手工推导：正确的 5 为什么变成 4 或 6

初始 count=5，一次生产和一次消费后，期望最终为 5。

| 步骤 | 操作 | r1 | r2 | 共享 count |
| --- | --- | ---: | ---: | ---: |
| 1 | producer 读取 count | 5 | — | 5 |
| 2 | producer 在本地加 1 | 6 | — | 5 |
| 3 | consumer 读取 count | 6 | 5 | 5 |
| 4 | consumer 在本地减 1 | 6 | 4 | 5 |
| 5 | producer 写回 | 6 | 4 | 6 |
| 6 | consumer 写回 | 6 | 4 | **4** |

生产者的更新被后写入的旧计算结果覆盖，称为**丢失更新（Lost Update）**。如果交换最后两次写回的顺序，结果变成 **6**。若完全串行执行一加一减，结果为 **5**。

> [!important] 不是“CPU 算错了”
> 每个进程的局部运算都正确，错误来自它们依据同一个旧值独立计算，并相互覆盖。

### 1.5 竞态条件与数据竞争

**竞态条件（Race Condition）**：程序的正确性依赖多个操作的相对执行时机，某些交错会破坏要求。

课件第 11 页给出实用识别线索：多个执行者并发访问同一内存位置，且至少一次是写。这个线索提醒我们检查同步，**并不表示已由锁正确保护的每次访问仍是错误**。

更严格的**数据竞争（Data Race）**是语言内存模型中的概念。以 C++ 为例，潜在并发、冲突、至少一方非原子且没有先行发生（Happens-before）关系，会导致数据竞争和未定义行为（Undefined Behavior）。因此，上面的 4/5/6 是教学交错模型的结果，不能据此声称真实有数据竞争的 C++ 程序只可能出现这三个值。参见 [C++ 标准草案：Data races](https://eel.is/c++draft/intro.races)。

### 1.6 课件提问：非抢占内核就没有竞态吗

**非抢占内核（Nonpreemptive Kernel）**减少了单 CPU 中“内核线程执行到一半被另一普通线程抢走”的情况，但不能无条件推出没有竞态：

- 多 CPU 上，另一个 CPU 仍可能同时访问共享内核数据（Shared Kernel Data）。
- 中断处理程序（Interrupt Handler）可能访问同一数据。
- 主动阻塞、显式调度等也需要纳入系统实际规则。

答题时应先列出单/多 CPU、是否允许中断、共享者有哪些，再判断是否有真正的互斥保证。

## 2. 临界区问题（Critical-Section Problem）

对应课件：第 12～15 页。

### 2.1 临界资源与临界区

- **临界资源（Critical Resource）**：需要按互斥等约束访问的共享资源，例如要保持一致性的计数器。
- **临界区（Critical Section，CS）**：程序中访问这些共享资源、需要相应保护的代码段。

“资源”是数据或设备，“区”是访问它的一段代码，不能混为一谈。

| 对象 | 是否需要互斥保护 |
| --- | --- |
| 多线程共同修改的全局计数器 | 通常需要同步 |
| 真正线程私有且未共享引用的局部变量 | 通常不需要跨线程锁 |
| 初始化后不再修改且已正确发布的只读数据 | 并发读取通常不需要独占锁 |
| 局部变量所指向的共享对象 | 指针是局部的，对象仍可能需要同步 |
| CPU | 是调度资源，不要简单把每段运行代码都称为临界区 |

### 2.2 一个进程的四段结构

```text
循环：
    进入区（Entry Section）       申请许可、检查是否能进入
    临界区（Critical Section）    访问受保护的数据
    退出区（Exit Section）        释放许可、必要时通知别人
    剩余区（Remainder Section）   与该临界资源无关的工作
```

### 2.3 正确协议的三个要求

| 要求 | 定义 | 用问题检查 |
| --- | --- | --- |
| 互斥（Mutual Exclusion） | 对同一互斥约束，不能同时有多个进程处于临界区 | 有没有可能两人同时进去？ |
| 空闲让进 / 进展（Progress） | 无人在临界区且有人申请时，下一位的选择不能无限推迟；不参与竞争者不应阻碍决策 | 明明空着，有人想进，却一直进不去吗？ |
| 有限等待（Bounded Waiting） | 申请后，其他进程先进入的次数有一个有限上界 | 会不会一直有人插队？ |

有限等待通常约束的是**被超越的次数（Number of Overtakes）**，不是没有调度前提的固定毫秒期限。不能靠假设“P0 一定比 P1 快”来证明协议正确。

### 2.4 中文教材的四句口诀

- 空闲让进：没人占用就允许适当的申请者进入。
- 忙则等待：已有占用者时，其他竞争者等待。
- 有限等待：不能无限被别人抢先。
- 让权等待（Blocking Wait）：不能进入时，尽可能让出 CPU，而不是一直空转。

> [!warning] 让权等待和前三项不是同一层要求
> Peterson 可以满足教材模型中的三个临界区正确性要求，却仍采用忙等待（Busy Waiting）。它没有因为忙等待就自动“互斥错误”。

## 3. 三种不完整的软件方案

对应课件：第 16～25 页。以下都先按教学顺序一致性模型分析。

### 3.1 单标志法：严格轮换（Strict Alternation）

共享变量 `turn` 表示轮到谁：

```c
// Pi，另一方为 Pj
while (true) {
    while (turn != i) { }
    critical_section();
    turn = j;
    remainder_section();
}
```

**能互斥：**turn 不可能同时等于 i 和 j。

**为什么不满足 Progress：**假设 turn=j，但 Pj 正在剩余区做很长的工作，根本不想进入临界区。此时临界区空着，Pi 也只能等 Pj 来一趟再把 turn 交回来。一个不参与竞争的人阻止了想进入的人。

课件将其有限等待标为 Yes，可以按严格轮换中“对方最多抢先一轮”的计次角度理解；但 **Progress 已失败，所以整个协议不正确**，不能说它保证实际一定很快进入。

### 3.2 双标志后检查：先表态，再看对方

`flag[i]=true` 表示 Pi 想进入：

```c
flag[i] = true;
while (flag[j]) { }
critical_section();
flag[i] = false;
```

错误交错：

1. Pi 设置 flag[i]=true。
2. Pj 设置 flag[j]=true。
3. Pi 看到 Pj 也想进，等待。
4. Pj 看到 Pi 也想进，等待。

双方都在等，临界区却空着，**违反 Progress**。在本模型下它能阻止双方同时进入，但缺少打破对称僵局的机制。

### 3.3 双标志先检查：先看对方，再表态

```c
while (flag[j]) { }
flag[i] = true;
critical_section();
flag[i] = false;
```

错误交错：

| 步骤 | Pi | Pj |
| --- | --- | --- |
| 1 | 看到 flag[j]=false，退出 while | — |
| 2 | — | 看到 flag[i]=false，退出 while |
| 3 | flag[i]=true | — |
| 4 | — | flag[j]=true |
| 5 | 进入 CS | 进入 CS |

**违反互斥。**问题在于“检查”和“宣布占用”之间有空隙，另一个执行者也能通过检查。

### 3.4 三种失败的核心区别

| 方法 | 核心问题 | 反例关键词 |
| --- | --- | --- |
| 单标志 turn | 不想进入的人也可能阻碍别人 | 空着，但没轮到我 |
| 先 flag=true，再检查 | 双方都表态，双方都等 | 一起想进，一起卡住 |
| 先检查，再 flag=true | 双方都在对方表态前通过检查 | 一起看到 false |

## 4. Peterson 算法（Peterson’s Solution）

对应课件：第 26～28 页；内存顺序问题见第 29～32 页。

### 4.1 两个变量各管什么

只考虑两个进程 P0、P1：

- `flag[i]`：**我想不想进入**。
- `turn`：**双方都想进入时，让谁先进入**。

初始化：`flag[0]=flag[1]=false`，turn 的初值不影响无人竞争时进入。

```c
// 教学伪代码。Pi 使用 i，另一方编号 j=1-i。
while (true) {
    flag[i] = true;                 // 我想进入
    turn = j;                      // 冲突时我先让对方
    while (flag[j] && turn == j) { }

    critical_section();

    flag[i] = false;                // 我退出竞争
    remainder_section();
}
```

> [!important] turn=j 是“让对方先”，不是“指定自己进”
> 课件第 27 页文字容易造成误解；以第 28 页实际代码为准。

### 4.2 while 条件要用一句话读出来

`flag[j] && turn==j`：**对方想进，而且现在我让对方先，所以我等。**

只要对方不想进，或者冲突裁决轮到我，整个条件就是 false，可以进入。

### 4.3 情形一：只有 Pi 申请

Pi 令 flag[i]=true、turn=j。由于 flag[j]=false，while 条件仍为 false。**即使 turn 指向对方，也不需要傻等。**这修复了严格轮换的问题。

### 4.4 情形二：双方同时申请

例如：

```text
P0: flag[0]=true
P1: flag[1]=true
P0: turn=1
P1: turn=0     ← 最后一次写 turn
```

- P0 检查 `flag[1] && turn==1`，为 true && false，进入。
- P1 检查 `flag[0] && turn==0`，为 true && true，等待。
- P0 退出时把 flag[0]=false，P1 的等待条件解除。

**最后写 turn 的人让步，另一人先进入。**

### 4.5 如何说明三个性质

**互斥：**若 Pi 已在临界区，它的 flag[i] 保持 true。Pj 如果继续申请，最后写 `turn=i` 时自己就应等待；当双方都已声明意愿时，turn 的最后取值也只能使一方获准。不能同时满足双方进入所需的裁决条件。

**Progress：**只有一人申请时不受 turn 阻碍；双方申请时由 turn 打破对称，总有一方能进入。

**Bounded Waiting：**当 Pi 完成 flag 和 turn 的声明并等待时，对方可以先进入；但对方再次申请会把 turn 让给 Pi，不能不断越过 Pi。两进程模型中可用“对方至多再先进入一次”理解上界，前提是各进程继续执行并最终离开临界区。

**缺点：**仅直接适用于两个进程、等待时占用 CPU，并依赖内存顺序与可见性条件。

## 5. 原子性、内存顺序与内存屏障

对应课件：第 29～32 页。

### 5.1 三件事不能混淆

| 概念 | 要回答什么 |
| --- | --- |
| 原子性（Atomicity） | 这个操作会不会被拆开，让别人观察到中间状态？ |
| 可见性（Visibility） | 一个线程写入后，另一个线程何时能看到？ |
| 顺序性（Ordering） | 其他线程观察到的操作顺序是否满足协议要求？ |

单次 LOAD/STORE 原子，不表示两个不同变量的读写自动满足 Peterson 的全部顺序要求。

### 5.2 把两行交换为什么会破坏 Peterson

课件第 30 页讨论将入口变成：

```c
turn = j;
flag[i] = true;
while (flag[j] && turn == j) { }
```

构造反例：

1. P0 执行 turn=1，尚未设置 flag[0]。
2. P1 执行 turn=0，然后 flag[1]=true。
3. P1 看到 flag[0]=false，进入临界区。
4. P0 执行 flag[0]=true。
5. P0 看到 flag[1]=true，但 turn=0，自己的等待条件 `turn==1` 不成立，也进入。

于是两人同时在临界区。**程序顺序是证明的一部分，不能任意交换。**

### 5.3 内存屏障做什么

**内存屏障（Memory Barrier / Memory Fence）**用来施加特定内存访问顺序约束。课件用 `mfence` 说明需要处理乱序执行（Out-of-Order Execution）或写入对外可见顺序。

> [!warning] 不能把课件汇编片段当成可移植修复模板
> 在 C++ 中，共享普通变量的数据竞争本身就违反语言规则。只插一条硬件 fence，不能自动替代原子变量（Atomic Variable）、编译器约束和正确的内存顺序。
> 学习算法时先使用声明清楚的抽象模型；实际编程优先使用语言或线程库提供的 Mutex、Atomic 等同步工具。C++ 对原子操作、锁和先行发生关系的规定见 [标准草案 intro.races](https://eel.is/c++draft/intro.races)。

`volatile` 也不能被当作通用线程互斥或完整内存同步工具。本章重心是理解为什么协议需要这些保证，而不是手写架构相关汇编锁。

## 6. 面包房算法（Bakery Algorithm）

对应课件：第 33～35 页。

### 6.1 取号排队的直觉

Peterson 直接处理两个人；Lamport 的面包房算法处理 n 个进程。每人先取号，**号码小的先进入，号码相同则编号小的先进入**。

![课件中的 Lamport 面包房算法论文](OS/pictures/Chapter%206/slide-33-fig-1.png)

共享数组：

| 变量 | 含义 | 初值 |
| --- | --- | --- |
| choosing[i] | Pi 正在取号，号码还未确定 | false |
| number[i] | Pi 持有的号码，0 表示不竞争 | 0 |

比较用**字典序（Lexicographic Order）**：

$$
(a,b)<(c,d)\iff (a<c)\lor(a=c\land b<d)
$$

例如 (3,1)<(3,4)，也有 (2,9)<(3,0)。先看票号，再看编号。

### 6.2 完整伪代码与逐行解释

```c
while (true) {
    choosing[i] = true;
    number[i] = 1 + max(number[0], ..., number[n-1]);
    choosing[i] = false;

    for (int j = 0; j < n; ++j) {
        while (choosing[j]) { }
        while (number[j] != 0 &&
               (number[j], j) < (number[i], i)) { }
    }

    critical_section();
    number[i] = 0;
    remainder_section();
}
```

这里的 `(number[j],j)<(...)` 是数学比较的简写，不是让你用 C 的逗号运算符直接写。

1. `choosing[i]=true`：告诉别人“我正在选号，别把暂时的 0 当成我不参加”。
2. 扫描已有票号，取最大值加 1。
3. 选号完成，公开结果。
4. 对每个对手，先等它选号完成，再看它是否排在我之前。
5. 所有排在我前面的人退出后，我进入。
6. 退出置 0，表示不再竞争。

### 6.3 为什么仍可能取到同一个号码

`max()+1` 整体不必是一个全局原子“取号器”。两个进程可能都读到最大值为 4，各自取到 5，所以需要编号作第二排序键。

**补充例题：**P0=(5,0)、P1=(5,1)、P2=(6,2)，则进入次序为 P0、P1、P2，假设三者都已完成选号且持续竞争。

### 6.4 为什么 choosing 不能随便删

假设 Pi 正在扫描 max、尚未写 number[i]。如果 Pj 此时将 number[i]=0 理解为“Pi 不竞争”，跳过它，随后 Pi 又完成选号，就可能与 Pj 对顺序的判断冲突。choosing 让“完成取号后再比较”成为协议的一部分。

算法在相应假设下实现互斥与等待保证，但扫描需要 O(n) 次量级的工作，且仍忙等待；实际实现还要考虑内存模型与票号溢出。原算法的寄存器假设比这里的简化课堂模型更细，延伸阅读可看 [Lamport 原论文](https://lamport.azurewebsites.net/pubs/bakery.pdf)。

## 7. 硬件同步：关中断、TAS、Swap 与 CAS

对应课件：第 36～46 页。

### 7.1 关中断（Disabling Interrupts）

```text
保存中断状态并关闭相关中断
执行短临界区
恢复先前的中断状态
```

单 CPU 内核中，屏蔽会造成相应抢占的中断，可以保护特定短临界区。实际代码应恢复原状态，而不是不分上下文地强行打开中断。

局限：

- 一般属于内核特权机制，普通用户程序不能任意使用。
- 关中断过久会增加中断响应延迟（Interrupt Latency）。
- 多 CPU 上只关本 CPU 的中断，**其他 CPU 仍会访问共享数据**。
- 能屏蔽哪些中断取决于架构，不能说屏蔽后什么事件都不会发生。

所以，多处理器共享数据通常还需要合适的锁；若同一数据也由本地中断处理程序访问，还要考虑锁与中断屏蔽的组合。

### 7.2 测试并设置（Test-and-Set，TAS）

原子地：**读旧值、写 true、返回旧值**。

```c
// 语义描述：整个操作必须由真实原子原语实现
bool TestAndSet(bool *target) {
    bool old = *target;
    *target = true;
    return old;
}
```

用它实现锁，初值 lock=false：

```c
while (TestAndSet(&lock)) { }  // 返回 true：之前已被占用，继续等
critical_section();           // 返回 false：我把空闲锁改成占用
lock = false;                // 教学释放；真实实现需正确的原子释放语义
```

| 原来的 lock | 返回值 | 操作后的 lock | 调用者 |
| --- | --- | --- | --- |
| false | false | true | 成功拿锁 |
| true | true | true | 继续等待 |

即使多个 CPU 同时请求，原子顺序中也只有第一个看到 false。**若把上面的普通函数逐行直接编译，它不会凭空成为原子操作。**

### 7.3 原子交换（Atomic Swap / Exchange）

```c
// 语义描述：整个交换视为原子
void Swap(bool *a, bool *b) {
    bool temp = *a;
    *a = *b;
    *b = temp;
}
```

课件第 41 页最后一行写成 `*b=*temp`，这里按“交换两个布尔值”的原意修正为 `*b=temp`。

全局 lock=false，每个进程有自己的局部 key：

```c
key = true;
while (key) {
    Swap(&lock, &key);
}
critical_section();
lock = false;
```

若 lock=false，交换后 lock=true、key=false，跳出循环；若 lock=true，交换后 key 仍为 true，继续等待。

### 7.4 比较并交换（Compare-and-Swap，CAS）

课件版本返回**旧值**：

```c
int compare_and_swap(int *value, int expected, int new_value) {
    int old = *value;
    if (old == expected)
        *value = new_value;
    return old;
}
```

以上仍是原子语义描述。实际语言接口的返回值规则可能不同，分析时以本题版本为准。

初值 lock=0：

```c
while (compare_and_swap(&lock, 0, 1) != 0) { }
critical_section();
lock = 0;
```

- 旧值为 0：与 expected 相同，改为 1，返回 0，拿锁成功。
- 旧值为 1：不修改，返回 1，拿锁失败。

### 7.5 简单原子锁为什么仍不保证有限等待

TAS、Swap、CAS 能解决“谁原子地取得空闲锁”，但不自动维护公平队列。

例如 P0 一直等待，P1 每次释放后恰好马上再次拿到，P0 就可能无限被超越。**原子性保证操作不可分，不保证公平性（Fairness）。**

### 7.6 第 46 页：带有限等待的 CAS 交接

共享 `lock=0`、`waiting[n]=false`，各进程有局部变量 key、j：

```c
while (true) {
    waiting[i] = true;
    key = 1;
    while (waiting[i] && key == 1)
        key = compare_and_swap(&lock, 0, 1);
    waiting[i] = false;

    critical_section();

    j = (i + 1) % n;
    while (j != i && !waiting[j])
        j = (j + 1) % n;

    if (j == i)
        lock = 0;
    else
        waiting[j] = false;

    remainder_section();
}
```

进入有两个路径：

1. 自己 CAS 成功，key=0。
2. 前任明确把资格交给自己，waiting[i] 被清为 false。

退出时按环形编号寻找等待者：找到则**定向交接（Handoff）**，保持 lock=1，不让新来者随意插入；没人等才把 lock 清零。

例如 n=4，P1 退出且 P2、P0 都等待，就先交给 P2。环形扫描使已经声明等待的人在教学模型下有至多 n−1 次别人进入的上界；仍假设进程继续运行、临界区最终退出，且内存语义正确。

## 8. 互斥锁（Mutex）与自旋锁（Spinlock）

对应课件：第 47～50 页。

### 8.1 互斥的接口

```c
acquire(lock);
// 受保护的共享数据访问
release(lock);
```

互斥锁（Mutual Exclusion Lock，Mutex）把进入协议封装起来。拿锁和放锁必须正确同步，共享数据的所有相关访问必须遵守同一协议。

课件中的 `while(!available); available=false;` 是抽象描述：**检查空闲和占用锁必须被原子地协调**，不能将二者当作任意普通语句，否则两个线程都可能看到 available=true。

### 8.2 等待方式的差别

| 对比 | 自旋锁（Spinlock） | 阻塞式互斥锁（Blocking Mutex） |
| --- | --- | --- |
| 等待时做什么 | 循环检查，持续占用执行时间 | 挂起，等待唤醒 |
| 主要代价 | 消耗 CPU、缓存一致性流量 | 调度、阻塞与唤醒开销 |
| 常见适用情况 | 很短的临界区，持有者能很快继续运行 | 等待可能较长，允许睡眠的线程上下文 |
| 是否天然公平 | 否 | 也不一定，取决于实现 |

“自旋锁没有上下文切换”应理解为**获取失败本身不通过睡眠主动切换**，不能推论线程永远不会被系统抢占。

“Mutex”描述互斥抽象，未必在所有实现中纯阻塞；有的锁先短暂自旋再睡眠，称为自适应行为（Adaptive Behavior）。课件第 49 页是在对比两种典型等待策略。

### 8.3 为什么持有自旋锁时一般不能睡眠

别人预期锁很快释放而一直自旋。如果持有者睡眠，等待会被拉长；在某些调度或中断关系下还会形成死锁。因此内核自旋锁的使用必须遵守具体上下文规则，不能把“任意长操作”包进去。

## 9. 信号量（Semaphore）：从用法到实现

对应课件：第 51～59、63、66 页。

### 9.1 把信号量想成“可取得的许可”

信号量是带原子操作的同步对象，不只是随便可读写的 int。基本操作：

- `wait(S)`，也记 `P(S)`：申请一个许可；没有许可时等待。
- `signal(S)`，也记 `V(S)`：交回或产生一个许可，必要时唤醒等待者。

**计数信号量（Counting Semaphore）**表示多个同类资源；**二元信号量（Binary Semaphore）**的可用许可在 0 与 1 之间。

二元信号量可用于互斥，但不能在所有接口层面都等同于 Mutex。Mutex 通常有所有者（Ownership）规则；信号量可由一个线程 wait、另一个线程 signal，用来表达事件顺序。

### 9.2 三类用途，初值不同

| 用途 | 初值 | 解释 |
| --- | ---: | --- |
| 保护一段互斥代码 | 1 | 一次只准一个执行者 |
| 表达“A 完成后 B 才能执行” | 0 | A 尚未完成，没有许可 |
| 管理 N 个可互换资源 | N | 最多发出 N 个许可 |

**互斥模板：**

```c
semaphore mutex = 1;
wait(mutex);
critical_section();
signal(mutex);
```

**顺序同步（Ordering Synchronization）模板：**

```c
semaphore done = 0;

// P1                  // P2
S1;                     wait(done);
signal(done);           S2;
```

无论 P1、P2 谁先获得 CPU，都保证 S1 在 S2 前完成。若 done 初值错设为 1，P2 可能不等 S1 就执行。

### 9.3 四个房间的例子

课件第 55 页：

- 四个房间功能等价、使用者不指定房间：一个初值为 4 的计数信号量可以限制总使用人数，**仍需可靠地分配具体空房间**。
- 四个房间各自独立，访问者可能指定不同房间：通常每房一个初值为 1 的信号量，允许不同房间并行使用。

如果只有一个初值为 4 的信号量，它只限制人数，不阻止两个人同时挑中同一个房间；如果用一个初值为 1 的全局锁，则能整体串行化，但牺牲不同房间的并行性。不能笼统说“一个信号量无论如何都会访问冲突”。

### 9.4 忙等待型定义

```text
wait(S):
    等待 S>0，然后以原子协调的方式取得一个许可，S--

signal(S):
    原子地 S++
```

课件 `while(S<=0); S--;` 不能解释为“拿着一个全局内部锁执行整个 while”：这样 signal 可能无法运行。正确实现必须让失败的申请者重试，同时允许其他人释放许可。

### 9.5 阻塞型定义与负值

每个信号量包含 value 和等待队列（Wait Queue）：

```c
wait(S) {
    S.value--;
    if (S.value < 0) {
        enqueue(S.queue, current_process);
        block();
    }
}

signal(S) {
    S.value++;
    if (S.value <= 0) {
        P = dequeue(S.queue);
        wakeup(P);
    }
}
```

以上计数、排队和睡眠必须按正确的内部原子协议协调，不能让唤醒发生在“尚未可靠登记等待”的空隙。

在这个教材定义的稳定记账点：

- value>0：有 value 个可用许可。
- value=0：没有多余许可。
- value<0：有 −value 个未满足的等待申请。

其他库接口不一定对外暴露负值，不能拿此内部表示推断所有 API 的读数。

### 9.6 为何 wait 判断 <0，signal 判断 <=0

初始 S=1，P0、P1、P2 依次 wait：

| 操作 | value 变化 | 结果 |
| --- | --- | --- |
| P0 wait | 1→0 | 成功取得最后一个许可，不阻塞 |
| P1 wait | 0→−1 | P1 阻塞 |
| P2 wait | −1→−2 | P2 阻塞 |
| P0 signal | −2→−1 | 仍有未满足申请，唤醒一个，例如 P1 |
| P1 signal | −1→0 | 仍需把许可交给最后的 P2，所以也要唤醒 |
| P2 signal | 0→1 | 无人等，留下一个许可 |

如果 signal 只在 `<0` 时唤醒，−1→0 这一刻就会漏掉最后一个等待者。

> [!important] 醒来不是立即运行
> wakeup 通常让进程进入就绪状态（Ready State），之后何时运行由调度器决定。上面的阻塞型 wait 已经做过减 1，被正确交接许可的进程恢复后不能又无条件减一次。

### 9.7 信号量内部为什么仍可能短暂自旋

应用等待资源可能很久，应阻塞；但修改 value 和队列的内部临界区很短，可以使用短自旋锁保护。

这两个层次不矛盾：**等待资源采用睡眠，维护等待机制本身采用很短的原子保护。**第 63 页若问“必须忙等待时怎么办”，应尽量缩短内部临界区，并保证持有者能运行、同步规则正确。

## 10. 唤醒丢失（Lost Wakeup）：为什么睡眠必须有协议

对应课件：第 57、60～62 页。这是理解条件变量的关键。

### 10.1 第一个例子：自旋很浪费，而且检查与扣减要一起保护

![忙等待信号量示例上半部分](OS/pictures/Chapter%206/slide-57-fig-1.png)

![忙等待信号量示例下半部分](OS/pictures/Chapter%206/slide-57-fig-2.png)

消费者循环检查 count，生产者长时间不提供资源时会浪费 CPU。课件以一生产者、一消费者讨论这一点；如果推广到多个消费者，“在锁外看到 count>0，然后才拿锁扣减”还会产生多个消费者抢同一许可的问题，需要在锁内重新检查。

### 10.2 直接把空转替换成 sleep 为什么不行

![直接 sleep 引起的唤醒丢失](OS/pictures/Chapter%206/slide-60-fig-1.png)

课件 P 的危险片段：

```c
while (s->count == 0)
    sleep(s);
```

令初始 count=0：

| 步骤 | 消费者 P | 生产者 V |
| --- | --- | --- |
| 1 | 看见 count==0，决定睡眠 | — |
| 2 | 尚未进入睡眠，被切走 | count++，变为 1 |
| 3 | — | wakeup，但此时等待队列没人 |
| 4 | 恢复后真正 sleep | 已经结束此次唤醒 |

**资源明明已经可用，消费者却睡着了。**如果之后没有新的 signal，它可能一直等。这就是唤醒丢失：通知发生在登记等待之前，且通知自身没有被保存为待处理事件。

### 10.3 加锁后抱着锁睡，也不行

![持有条件锁睡眠造成死锁](OS/pictures/Chapter%206/slide-61-fig-1.png)

```c
acquire(&s->lock);
while (s->count == 0)
    sleep(s);                 // 错误：仍占着 s->lock
```

消费者想等生产者增加 count，生产者却必须先拿 s->lock；锁被睡眠的消费者占着，生产者进不来。于是等待条件永远无法由生产者建立。

### 10.4 正确思路：登记等待和释放条件锁必须协调

![将条件锁交给 sleep 的实现上半部分](OS/pictures/Chapter%206/slide-62-fig-1.png)

![将条件锁交给 sleep 的实现下半部分](OS/pictures/Chapter%206/slide-62-fig-2.png)

课件改为 `sleep(s, &s->lock)`：

```c
acquire(&s->lock);
while (s->count == 0)
    sleep(s, &s->lock);
s->count--;
release(&s->lock);
```

需要遵守的语义：

1. 调用前，消费者持有保护 count 的锁。
2. sleep 协调“可靠进入等待状态”和“释放该锁”，避免产生可被唤醒漏掉的窗口。
3. 生产者取得同一锁后改变条件，并执行唤醒。
4. 消费者恢复时重新取得锁。
5. 再次检查 count，满足条件才扣减。

**为什么是 while？**醒来表示“可以重新看看”，并不保证资源还留给自己。别的消费者可能已经抢先取得资源。

## 11. 死锁（Deadlock）与饥饿（Starvation）

对应课件：第 64、74 页。

### 11.1 两把信号量反向获取

S=1、Q=1：

```c
// P0                 // P1
wait(S);              wait(Q);
wait(Q);              wait(S);
// work               // work
signal(Q);            signal(S);
signal(S);            signal(Q);
```

错误交错：P0 取得 S，P1 取得 Q；P0 等 Q，P1 等 S。双方都等只有对方后续执行才能释放的资源，产生死锁。

一个常见修复思路是**固定锁顺序（Global Lock Ordering）**：双方都先 S 后 Q，从而消除这种相反获取顺序。

### 11.2 两种“永远等”有什么不同

| 现象 | 含义 | 系统是否还可能有人继续完成工作 |
| --- | --- | --- |
| 死锁 | 一组执行者相互等待，无法推进 | 这组无法推进，其他无关进程可能仍能运行 |
| 饥饿 | 某个执行者长期拿不到机会 | 通常别人仍在推进 |

有公平队列可以改善饥饿，但不能自动解除错误资源顺序造成的死锁。

### 11.3 P/V 的常见错误

- `signal(mutex)` 在进入区前：无故增发许可，互斥失效。
- 连续 `wait(mutex)` 而中间不释放：对非可重入许可可能自我阻塞。
- 漏掉 signal：许可长期无法归还。
- 漏掉 wait：访问绕过保护。
- 提前返回或异常路径忘记释放：正常路径看似配对，实际仍泄漏。

“P/V 必须配对”应理解为：**整个协议的许可产生与消耗必须匹配**，不一定同一线程中相邻出现。用于顺序同步时，P 和 V 经常分布在不同进程中。

## 12. 有界缓冲区（Bounded-Buffer Problem）

对应课件：第 65～68 页。

### 12.1 为什么要三个信号量

| 信号量 | 初值 | 管什么 |
| --- | ---: | --- |
| empty | N | 还可以放多少个元素 |
| full | 0 | 还可以取多少个元素 |
| mutex | 1 | 对缓冲区与下标修改的互斥 |

empty/full 管**数量条件与先后关系**；mutex 管**同一时刻谁能改共享结构**。它们不能彼此替代。

### 12.2 正确模板

```c
// producer
while (true) {
    item = produce();
    wait(empty);             // 先等空位，可能阻塞
    wait(mutex);             // 再取得缓冲区修改权
    buffer[in] = item;
    in = (in + 1) % N;
    signal(mutex);
    signal(full);            // 现在可供消费的元素增加
}

// consumer
while (true) {
    wait(full);              // 先等已有数据
    wait(mutex);
    item = buffer[out];
    out = (out + 1) % N;
    signal(mutex);
    signal(empty);           // 现在空位增加
    consume(item);
}
```

生产和消费的耗时工作尽量放在临界区外，只在锁内维护共享缓冲区。

### 12.3 手推一次：N=2

忽略中途预留，只在每次完整操作结束的稳定点观察：

| 操作完成后 | empty 可用许可 | full 可用许可 | 缓冲区 |
| --- | ---: | ---: | --- |
| 初始 | 2 | 0 | 空 |
| 生产 A | 1 | 1 | A |
| 生产 B | 0 | 2 | A、B |
| 消费 A | 1 | 1 | B |
| 生产 C | 0 | 2 | B、C |

稳定点可观察到 empty+full=N，但在生产者已 wait(empty)、尚未 signal(full) 的中间阶段，许可已经被预留，不能要求两个可见数值始终相加等于 N。阻塞型信号量内部负值还带有等待者记账，更不能直接当作物理槽数。

### 12.4 为什么必须先等资源，再拿 mutex

错误消费者：

```c
wait(mutex);
wait(full);          // 空缓冲区时抱着 mutex 睡
```

若当前没有数据：消费者拿着 mutex 等 full；生产者为了写入数据需要 mutex，结果无法生产并 signal(full)。死锁。

口诀：**本题先做可能等待数量条件的 P，再做保护修改的 P。**

> [!warning] 不是所有同步题都能机械套同一 P 顺序
> 后面的读者—写者解法会在保护 readcount 的锁内获取 wrt。是否死锁要看依赖关系，不能只看出现了两个 wait 就凭口诀判断。

### 12.5 signal 的顺序真的完全无关吗

课件在本节背景中强调相邻 V 操作顺序通常不影响核心正确性。本模板一般推荐先释放 mutex，再通知 full/empty，避免把人唤醒后立即又堵在 mutex。

不能把它推广成任意系统“所有 signal 都可以随意交换”；实时优先级、调度语义以及其他条件协议仍可能受影响。

## 13. 读者—写者问题（Readers-Writers Problem）

对应课件：第 69～71 页。

### 13.1 谁可以与谁并行

| 组合 | 是否允许同时访问同一数据集 |
| --- | --- |
| Reader + Reader | 可以，纯读不改 |
| Reader + Writer | 不可以 |
| Writer + Writer | 不可以 |

目标：读者可以成组并发，写者独占。课件给出**读者优先（Reader Preference）**版本。

### 13.2 三个共享变量

```c
int readcount = 0;
semaphore mutex = 1;   // 保护 readcount 的修改
semaphore wrt = 1;     // 数据集的独占资格，供写者或整个读者组使用
```

`mutex` 不是把整个阅读过程锁住，否则多个读者无法并行。

### 13.3 Writer 代码

```c
while (true) {
    wait(wrt);
    write_data();
    signal(wrt);
}
```

### 13.4 Reader 代码逐段读

```c
while (true) {
    wait(mutex);
    readcount++;
    if (readcount == 1)
        wait(wrt);           // 第一个读者替整个读者组拿资格
    signal(mutex);

    read_data();             // 不持有 mutex，多个读者可并发阅读

    wait(mutex);
    readcount--;
    if (readcount == 0)
        signal(wrt);         // 最后一个读者替整个组释放
    signal(mutex);
}
```

“第一个”和“最后一个”是相对于当前连续存在的读者组，不是固定编号。

### 13.5 两个读者、一个写者的推演

1. R1 到达：readcount=1，取得 wrt，开始读。
2. R2 到达：readcount=2，无须再 wait(wrt)，和 R1 同时读。
3. W 到达：wrt 被读者组占用，阻塞。
4. R1 结束：readcount=1，不释放 wrt。
5. R2 结束：readcount=0，释放 wrt。
6. W 才能得到独占写入机会，具体唤醒和竞争次序依实现。

### 13.6 为什么这里拿着 mutex 等 wrt 不形成上一题那种死锁

若第一个读者阻塞在 wrt，它持有 mutex，但此时 wrt 的持有者是写者。写者释放 wrt **不需要 mutex**，因此没有形成“写者也必须等读者那把 mutex 才能释放”的循环。

### 13.7 为什么写者可能饥饿

只要始终有读者，readcount 就可能一直不降为 0。新读者可以加入现有读者组，写者长时间拿不到 wrt。

所以该解法允许读并发、保证写独占，但不保证写者有限等待。写者优先（Writer Preference）或公平读写锁（Fair Read-Write Lock）需要额外排队规则。

## 14. 哲学家就餐问题（Dining-Philosophers Problem）

对应课件：第 72～73 页；管程解法见第 77～78 页。

![哲学家围桌与共享筷子](OS/pictures/Chapter%206/slide-72-fig-1.png)

### 14.1 模型

五个人围桌，五根筷子（或五把叉子，资源模型相同），每人只有同时拿到左右两根才能吃饭，吃完放回，再思考。

每根筷子用一个初值为 1 的信号量：`chopstick[5]`。

```c
wait(chopstick[i]);
wait(chopstick[(i+1)%5]);
eat();
signal(chopstick[(i+1)%5]);
signal(chopstick[i]);
think();
```

### 14.2 每根筷子互斥，为什么整体仍会死锁

让五个人都先拿自己的第一根：每根筷子分别被占住，再请求第二根时，它在邻居手里。形成一圈等待。

**对每个资源都做了互斥，并不等于多个资源的获取协议无死锁。**

### 14.3 解法一：限制同时参与拿筷子的人数

加 `room=4`：

```c
wait(room);                         // 最多四人进入拿筷子的阶段
wait(chopstick[i]);
wait(chopstick[(i+1)%5]);
eat();
signal(chopstick[(i+1)%5]);
signal(chopstick[i]);
signal(room);
```

**准确含义是“最多四个人同时参与取筷子/用餐过程”**，不是“最多四个人同时真正吃饭”。五根筷子每人要两根，本来就不可能四人同时吃。

这个限制打破五人都各持一根形成整环的情形，但公平性还需要信号量排队等条件。

### 14.4 解法二：打破对称或统一资源顺序

- 一个哲学家反过来拿筷子，破坏全体同方向等待的环。
- 奇偶编号采用相反取筷子顺序，打破该环形模型中的对称等待。
- 所有人先拿编号较小的筷子、再拿较大的，形成统一资源顺序。

其中“统一按编号递增拿锁”特别适合解释：等待只能沿编号增大的方向走，无法绕回起点形成同类循环。

### 14.5 解法三：同时申请两根

课件提到 AND 型信号量（AND Semaphore）：只有两根都可用时才整体分配，否则不拿着其中一根等另一根。

这是“全有或全无”的资源申请思想，**不是简单连续执行两次普通 wait 就自动实现**。实现仍需原子地检查与分配。

## 15. 管程（Monitor）与条件变量（Condition Variable）

对应课件：第 74～78 页。

### 15.1 为什么需要更高层抽象

信号量容易因为漏 P/V、顺序颠倒而出错。管程把共享数据和操作它的过程封装在一起，进入过程时由语言/运行时提供互斥。

![管程、入口队列与共享数据](OS/pictures/Chapter%206/slide-75-fig-1.png)

管程包含：共享数据（Shared Data）、操作过程（Procedures）、初始化代码（Initialization Code），以及入口队列（Entry Queue）。

**同一时刻至多一个执行者在管程内主动执行。**其他线程可能已在管程条件队列中睡眠；“只能有一个活动者”不等于“管程内不能存在等待者”。

### 15.2 有互斥，为什么还需要条件变量

互斥只能保证“一个人进去检查”。缓冲区空时，消费者即使独占了管程，也变不出一个元素。它需要等待“非空”条件，同时允许生产者进入并改变条件。

![管程中的条件队列](OS/pictures/Chapter%206/slide-76-fig-1.png)

**条件变量（Condition Variable）**关联等待某种条件的队列：

- `x.wait()`：释放管程互斥并挂起，之后恢复执行时重新获得所需的互斥。
- `x.signal()`：有等待者时通知其中一个；无人等待时通常不积累许可。

真正的条件通常是共享数据上的**谓词（Predicate）**，例如 `count>0`。条件变量本身并不等于 count，也不自动保存真假状态。

### 15.3 signal 后谁继续：Hoare 与 Mesa

这是理解补充，用来解释为什么代码有时用 if，有时用 while。

| 语义 | signal 后的行为 | 对条件检查的影响 |
| --- | --- | --- |
| Hoare 风格（Signal-and-Wait） | 被唤醒者立即接管，通知者暂让 | 在严格语义及正确协议下可依赖交接瞬间的条件 |
| Mesa 风格（Signal-and-Continue） | 通知者继续，被通知者以后再竞争锁 | 恢复时条件可能已改变，需要 while 重查 |

Pthreads 等实际条件变量编程应使用谓词循环，不要把“收到 signal”当作“无须检查就有资格执行”。

### 15.4 信号量 signal 与条件变量 signal 的差别

| 比较 | Semaphore | Condition Variable |
| --- | --- | --- |
| 无人等待时 signal | 增加可保留的许可，受类型约束 | 通常不保留通知 |
| wait 的依据 | 有无可用许可 | 程序检查共享谓词后决定等待 |
| 等待时与锁的关系 | 依具体信号量接口 | 通常须与保护谓词的互斥锁协作 |
| 能否用初值记录一个已发生事件 | 初值/计数可表达许可 | 需额外共享状态，不能只靠一次 signal |

因此，“先 signal、后 wait”对计数信号量可能正确，对没有状态记录的条件变量则可能错失通知。

### 15.5 管程版哲学家：状态代替逐根占筷子

状态数组：`THINKING`、`HUNGRY`、`EATING`；每人一个条件变量 self[i]。

```c
monitor DiningPhilosophers {
    enum { THINKING, HUNGRY, EATING } state[5];
    condition self[5];

    void test(int i) {
        if (state[(i+4)%5] != EATING &&
            state[i] == HUNGRY &&
            state[(i+1)%5] != EATING) {
            state[i] = EATING;
            self[i].signal();
        }
    }

    void pickup(int i) {
        state[i] = HUNGRY;
        test(i);
        while (state[i] != EATING)
            self[i].wait();
    }

    void putdown(int i) {
        state[i] = THINKING;
        test((i+4)%5);
        test((i+1)%5);
    }

    initialization {
        for (int i=0; i<5; ++i)
            state[i] = THINKING;
    }
}
```

课件第 77 页用 if 等待；这里用 while 表达稳健的谓词重检，保持其“先授权 EATING，再通知”的基本思路。

哲学家使用：

```text
dp.pickup(i)
在管程外 eat()
dp.putdown(i)
```

**为什么 eat 在管程外？**否则一个人在管程中吃饭时，所有其他人连 pickup/putdown 都无法执行，连不相邻的人也不能并行用餐。

### 15.6 test 为什么不只是“通知一下”

`test(i)` 在锁保护下先把 state[i] 设为 EATING，相当于为它预留两侧资源，然后 signal。邻居的 test 会看到它已经 EATING，不会同时获得冲突授权。

若 pickup 自己 test 成功，此时没人等 self[i]，signal 不留下通知也没关系，因为后续检查 state[i]==EATING，根本不需要 wait。

### 15.7 安全不等于公平

这个状态协议禁止相邻者同时吃，也不出现“人人持一根筷子”的死锁状态。但某人左右邻居交替用餐，可能使它一直找不到两边都空的机会，**仍可能饥饿**。课件第 78 页正强调这一点。

## 16. 同步机制的系统实例与 Pthreads

对应课件：第 79～87 页。

> [!info] 历史实现的阅读方式
> Solaris、Windows XP 和本课件的 Linux 概述用于展示同步工具组合，不代表所有现代版本的完整实现；尤其不能把平台移植性标签无条件沿用到今天。

### 16.1 Solaris

- **自适应互斥锁（Adaptive Mutex）**：在适当条件下短暂自旋，否则睡眠。理解补充：持有者正在另一 CPU 运行时，短等可能有收益；持有者不能立即运行时，睡眠往往更合适。
- **条件变量（Condition Variables）**：等待共享状态变化。
- **读写锁（Readers-Writers Locks）**：允许读共享、写独占。
- **转闸（Turnstiles）**：课件用它描述组织等待获取锁的线程队列的机制。

### 16.2 Windows XP 与 Linux

课件中的 Windows XP 使用中断屏蔽（Interrupt Masks）、多处理器自旋锁（Spinlocks），以及分派器对象（Dispatcher Objects），后者可以体现互斥量、信号量、事件（Events）等同步行为。

事件可通知等待者，但不同事件对象可能有保持/重置语义，不能简单认定它与条件变量所有细节相同。

课件中的 Linux 用关中断保护特定短内核临界区，并提供信号量、自旋锁。保护多 CPU 共享数据时，仍须分析跨 CPU 的互斥，不能只引用“Linux 可以关中断”就当作完整方案。

### 16.3 Pthreads 的基础对象

POSIX 线程接口（POSIX Threads，Pthreads）提供平台间可用的编程接口，常用：

| API | 用途 |
| --- | --- |
| pthread_mutex_init / destroy | 初始化 / 销毁互斥锁 |
| pthread_mutex_lock / unlock | 获取 / 释放互斥锁 |
| pthread_cond_init / destroy | 初始化 / 销毁条件变量 |
| pthread_cond_wait | 原子协调解锁与等待，返回时重新持锁 |
| pthread_cond_signal | 通知至少一个等待者，具体以接口规范为准 |
| pthread_cond_broadcast | 通知所有当前等待者 |

第 83 页把读写锁、自旋锁列为 non-portable extensions，这是课件年代与平台背景下的说明；具体可用性和标准选项需要查目标环境，不能概括成“这些接口永远都不是 POSIX 的一部分”。

### 16.4 第 84～86 页：单槽缓冲区的轮询版本

共享 `buffer`、`buffer_has_item` 用一把 mutex 保护。写者拿锁后，如果为空则写入并置 1；读者拿锁后，如果有值则消费并置 0。两边每轮延迟一段时间再检查。

这种方法比无锁共享标志更有互斥保障，但**定期轮询（Polling）**仍会导致不必要的检查和额外响应延迟。课件还使用旧的非标准延时接口与不规范线程函数声明，适合学习逻辑，不宜原样复制。

### 16.5 用条件变量等待计数非零

课件第 87 页的核心逻辑可整理为：

```c
pthread_mutex_t count_lock = PTHREAD_MUTEX_INITIALIZER;
pthread_cond_t count_nonzero = PTHREAD_COND_INITIALIZER;
unsigned count = 0;

void decrement_count(void) {
    pthread_mutex_lock(&count_lock);
    while (count == 0)
        pthread_cond_wait(&count_nonzero, &count_lock);
    --count;
    pthread_mutex_unlock(&count_lock);
}

void increment_count(void) {
    pthread_mutex_lock(&count_lock);
    ++count;
    pthread_cond_signal(&count_nonzero);
    pthread_mutex_unlock(&count_lock);
}
```

这段为教学片段，省略错误处理和完整线程生命周期。与课件不同，这里每增加一个单位就通知一次，使多个等待消费者和多次增量也能获得相应通知机会。

**课件原来的优化：**只在 count 从 0 变为非零时 signal。单个等待者时容易理解，但若有多个线程各等一次减 1，生产者在它们恢复前连续增加，可能留下“count>0、仍有线程睡着”的状态，且没有新的通知。因此要结合等待者数量和操作语义选择每次 signal、broadcast 或其他协议。

### 16.6 为什么必须 while，不能 if

- **虚假唤醒（Spurious Wakeup）**：等待可能在没有期望通知的情况下返回。
- 即使确实被 signal，重新拿锁前，其他线程也可能先消耗了 count。

因此必须在持锁时重新检查谓词。POSIX 规定条件等待协调释放锁和阻塞，正常返回时再次取得锁，并明确要求考虑虚假唤醒。参见 [The Open Group：条件等待规范](https://pubs.opengroup.org/onlinepubs/9799919799/functions/pthread_cond_clockwait.html)。

> [!tip] 把条件变量的使用记成完整句子
> 拿锁 → while 条件不满足就 wait → 条件满足后修改共享状态 → 必要时通知 → 解锁。

## 17. 原子事务（Atomic Transactions）与恢复

对应课件：第 88～93 页。

### 17.1 为什么进程同步会讲到数据库

锁讨论“多个执行者同时来怎么办”；事务还要处理“操作进行一半，机器坏了怎么办”。两者都关心操作整体的正确性，但层次不同。

**事务（Transaction）**：完成一个逻辑功能的一组操作。结果要么整体成功，要么整体不生效，不能只留下半套修改。

事务可以：

- **提交（Commit）**：成功完成。
- **中止（Abort）**：失败，不应保留其未提交效果。
- **回滚（Rollback）**：撤销已做的修改，恢复到适当状态。

### 17.2 补充例子：账户转账

初始 A=100、B=50，转账 10：

```text
读 A，A=A−10，写 A
读 B，B=B+10，写 B
commit
```

若写完 A=90 就崩溃，B 还等于 50，总额从 150 变成 140。事务恢复必须防止这种只完成一半的持久效果。

**指令原子性**处理一个机器操作的不可分割性；**事务原子性（Transaction Atomicity）**处理多个操作在失败恢复后的整体效果。不能因为 CPU 有 CAS，就认为多次磁盘修改自动成为一个原子事务。

### 17.3 三种存储模型

| 类型 | English | 系统崩溃后数据是否保留 |
| --- | --- | --- |
| 易失性存储 | Volatile Storage | 通常丢失，例如内存、缓存 |
| 非易失性存储 | Nonvolatile Storage | 通常保留，例如磁盘；设备本身仍可能故障 |
| 稳定存储 | Stable Storage | 教学模型中视为不会丢失，以复制等方式近似 |

RAID、复制（Replication）只能在特定故障模型下提高可靠性，不是现实中“任何情况都不会丢”的绝对保证。

### 17.4 先写日志（Write-Ahead Logging，WAL）

修改数据前，先记录足够的恢复信息：

```text
<T starts>
<T, A, old=100, new=90>
<T, B, old=50, new=60>
<T commits>
```

关键规则：**对应日志记录先可靠落到稳定存储，相关修改后的数据才能被写回持久数据页。**单纯把日志放在易失内存里不够。

在需要保证提交持久性的模型中，向用户确认 commit 前还要使相关日志及提交记录可靠持久化。数据页可以之后再写回，由日志支持必要的重做。

### 17.5 Undo 与 Redo

| 操作 | 中文 | 使用哪个值 |
| --- | --- | --- |
| Undo(T) | 撤销 | 旧值 old |
| Redo(T) | 重做 | 新值 new |

课件的简化恢复规则：

- 有 starts，无 commits：未提交事务，撤销。
- 有 starts，也有 commits：已提交事务，重做其需要恢复的结果。

**为什么已提交还可能要 Redo？**提交日志可能已经落盘，而数据页仍在内存里，崩溃后数据页更新丢失。

**为什么未提交可能要 Undo？**在允许未提交数据页提前写出的恢复策略中，磁盘可能已经含有部分修改。

实际系统选择 Undo/Redo 的组合与缓存写回策略等有关；这里按课件给出的允许二者都需要的模型学习。

### 17.6 为什么恢复操作要幂等

**幂等性（Idempotence）**：做多次和做一次效果相同。

- `A=90` 可作为重做赋值，重复执行仍为 90。
- `A=A−10` 重复执行会变成 80、70，不具备同样的幂等性。

恢复过程本身也可能再次崩溃，所以不能默认重启后只恢复一次。对同一事务的多次写，Undo 通常按相反顺序撤销，Redo 按日志顺序重放，以免同一数据项被恢复到错误的中间值。

### 17.7 检查点（Checkpoint）

日志越长，从头恢复越慢。课件给出简化检查点步骤：

1. 将当前易失存储中的日志输出到稳定存储。
2. 将已修改数据输出到稳定存储。
3. 在稳定日志中输出 checkpoint 记录。

检查点让恢复能够缩小扫描范围。但**不能一概删除检查点以前的全部日志**：若事务在检查点前开始、之后尚未结束，恢复仍可能需要它的更早记录。具体起点取决于检查点如何记录活动事务及系统的恢复协议。

## 18. 可串行化（Serializability）与并发控制

对应课件：第 94～104 页。

### 18.1 串行与交错

- **调度（Schedule）**：多个事务的读写操作按实际执行先后排列的序列。这里的调度是事务操作序列，不是 Chapter 5 的 CPU 选人算法。
- **串行调度（Serial Schedule）**：一个事务完整做完，再做另一个，不交错。
- **非串行调度（Nonserial Schedule）**：事务的操作交错执行。
- **可串行化（Serializability）**：交错后的行为符合某个串行执行的正确性标准。

![先 T0 后 T1 的串行调度](OS/pictures/Chapter%206/slide-96-fig-1.png)

n 个事务若没有额外先后约束，有 n! 种排列出的串行顺序；不同顺序不必得到相同结果，因此可串行化通常是“等价于其中一种”，不是“等价于所有顺序”。

### 18.2 什么叫冲突（Conflict）

来自不同事务的两个操作，访问同一数据项，且至少一个是写，就冲突。

| 操作对 | 是否冲突 | 理由 |
| --- | --- | --- |
| read(A)、read(A) | 否 | 都不修改 |
| read(A)、write(A) | 是 | 读到的值可能改变 |
| write(A)、read(A) | 是 | 同上 |
| write(A)、write(A) | 是 | 最终写入者可能改变 |
| write(A)、read(B) | 否，A≠B | 不是同一数据项 |

冲突不表示“一定已经错”，而是表示这些操作的相对顺序具有语义约束。

### 18.3 冲突可串行化（Conflict Serializability）

如果能通过不断交换**相邻、不同事务、互不冲突**的操作，把一个调度变成串行调度，则它是冲突可串行化的。

![课件中的非串行但可串行化调度](OS/pictures/Chapter%206/slide-98-fig-1.png)

图中 T0 在 A 上的读写，先于 T1 在 A 上的读写；T0 在 B 上也先于 T1。虽然中间交错，但冲突方向一致，为 T0→T1。

T1 对 A 的操作与 T0 对 B 的操作不冲突，因此可以交换到适当位置，把序列整理成 T0 完整执行后再 T1。

### 18.4 理解补充：用优先图判题

**优先图 / 冲突图（Precedence Graph / Serialization Graph）**：

1. 每个事务画一个节点。
2. 若 Ti 的操作先于 Tj 的冲突操作，画 Ti→Tj。
3. 检查是否有环。

在通常事务调度模型下：**无环当且仅当冲突可串行化**；拓扑序（Topological Order）给出等价串行顺序。

补充反例：

```text
w0(A), r1(A), w1(B), r0(B)
```

- A 上：T0→T1。
- B 上：T1→T0。
- 有环，不能通过交换非冲突操作变成串行调度。

仅凭“最后数据恰好一样”不足以判定冲突可串行化，要检查操作间的冲突次序。

### 18.5 共享锁与排他锁

**锁协议（Locking Protocol）**把数据项访问纳入锁管理：

- **共享锁（Shared Lock，S）**：允许读，不能据此写。
- **排他锁（Exclusive Lock，X）**：允许持有者读写，排斥其他冲突访问。

兼容矩阵（Compatibility Matrix）：

| 已持有 / 新请求 | S | X |
| --- | --- | --- |
| S | 兼容 | 不兼容 |
| X | 不兼容 | 不兼容 |

这与读者—写者问题中“读共享、写独占”的目标对应。

### 18.6 两阶段锁协议（Two-Phase Locking，2PL）

| 阶段 | 允许的行为 |
| --- | --- |
| 增长阶段（Growing Phase） | 获取锁，不释放锁 |
| 收缩阶段（Shrinking Phase） | 释放锁，不再获取新锁 |

**关键边界：第一次释放锁之后，不能再申请新锁。**

```text
lock-S(A), lock-X(B), read(A), write(B), unlock(A), unlock(B)   ✓
lock-S(A), read(A), unlock(A), lock-X(B), write(B)              ✗
```

基本 2PL 保证相应模型下的冲突可串行化，**不防止死锁**：T0 拿 A 等 B，T1 拿 B 等 A，仍可能发生。

理解补充：严格两阶段锁（Strict 2PL）通常要求排他锁持有到提交/中止，从而对恢复有额外帮助；不要把这个附加要求与课件只写的基本 2PL 混为一谈。

### 18.7 时间戳排序（Timestamp Ordering）

事务开始前分配时间戳 `TS(Ti)`，数值小代表更早、更“老”。目标是让冲突操作符合时间戳规定的串行顺序。

对每个数据项 Q 保存：

| 变量 | 含义 |
| --- | --- |
| R_TS(Q) | 成功读过 Q 的事务的最大时间戳 |
| W_TS(Q) | 成功写过 Q 的事务的最大时间戳 |

注意它们记录的是**事务时间戳的最大值**，不是这次读写操作在墙上时钟的发生时刻。

### 18.8 read(Q) 的判断

事务 Ti 请求读取：

```text
若 TS(Ti) < W_TS(Q)：
    拒绝，回滚 Ti
否则：
    允许读取
    R_TS(Q) = max(R_TS(Q), TS(Ti))
```

解释：若一个“更年轻”的事务已经写过 Q，老事务现在再读到这个未来值，就不符合“老事务先执行”的逻辑顺序。

### 18.9 write(Q) 的判断

```text
若 TS(Ti) < R_TS(Q)：拒绝并回滚
否则若 TS(Ti) < W_TS(Q)：拒绝并回滚
否则：允许写入，并令 W_TS(Q)=TS(Ti)
```

- 小于 R_TS：年轻事务已经读过，老事务现在补写会让之前读值不符合预定串行顺序。
- 小于 W_TS：年轻事务已写出更新的版本，老事务现在再写是过时写（Obsolete Write）。

这里采用课件的**基本时间戳排序**，不引入“忽略过时写”的其他变体。

### 18.10 手算时间戳表

补充例题：初始 R_TS(Q)=W_TS(Q)=0，TS(T0)=5，TS(T1)=10。

| 请求 | 判断 | 结果与新状态 |
| --- | --- | --- |
| T0 read(Q) | 5≥0 | 成功，R_TS=5、W_TS=0 |
| T1 read(Q) | 10≥0 | 成功，R_TS=10、W_TS=0 |
| T0 write(Q) | 5<10=R_TS | 拒绝，T0 回滚，不能更新 W_TS |

另起一例：若 W_TS(Q)=10，则 TS=5 的事务无论请求读还是按本协议写 Q，都会被拒绝；TS=12 的事务是否能写，还要检查 R_TS 是否大于 12。

### 18.11 第 104 页为什么是允许的调度

![课件中可由时间戳协议接受的交错](OS/pictures/Chapter%206/slide-104-fig-1.png)

假设 TS(T2)<TS(T3)：T2 先读 B，T3 再读写 B；随后 T2 先读 A，T3 再读写 A。每个数据项的冲突方向都符合 T2→T3。

T2 在 T3 写完 B 后才读 A，并不意味着违规，因为它读的是另一个数据项 A，而此时图中 T3 尚未写 A。**按每个数据项的时间戳元数据判断，不能仅看整行的全局交错印象。**

### 18.12 时间戳协议的收益与代价

- 基本冲突处理以拒绝/回滚代替等锁，不产生这种锁等待形成的死锁。
- 可能反复回滚，造成饥饿或较大重做代价。
- 课件规定回滚事务重新分配时间戳再启动。
- 可串行化与失败恢复是不同问题；仅说明冲突顺序正确，不等于已经解决所有未提交数据读取和崩溃恢复问题。

## 19. 对照表、做题模板与高频易错点

### 19.1 四个问题先分清

| 你想保证什么 | 关键词 | 典型工具 |
| --- | --- | --- |
| 同一资源不能冲突访问 | 互斥（Mutual Exclusion） | Mutex、Semaphore、Monitor |
| A 做完后 B 才能做 | 顺序同步（Ordering） | 初值 0 的 Semaphore、带谓词的 Condition Variable |
| 多个资源获取不相互卡死 | 死锁控制（Deadlock Control） | 统一锁顺序、整体分配等 |
| 崩溃后不留下半笔修改 | 事务原子性（Transaction Atomicity） | 日志、Undo/Redo、恢复协议 |

### 19.2 核心方案对照

| 方法 | 主要能力 | 主要局限 |
| --- | --- | --- |
| 严格轮换 | 两者不同时进 | 不满足 Progress |
| 先表态后检查 | 阻止双方同时进 | 可能双方永远等 |
| 先检查后表态 | 不强制轮换 | 不满足互斥 |
| Peterson | 两进程在模型下满足三要求 | 忙等、内存顺序要求 |
| Bakery | 扩展到 n 进程、有票号顺序 | 扫描、忙等、实际实现约束 |
| 简单 TAS/Swap/CAS 锁 | 原子地取得互斥资格 | 不自动保证有限等待 |
| 带交接的 CAS | 增加有界超越机制 | 协议更复杂，仍忙等 |
| Blocking Semaphore | 计数资源、互斥和顺序同步 | P/V 顺序容易出错 |
| Monitor + Condition Variable | 封装数据与互斥，按条件等待 | 仍须正确写谓词与通知 |

### 19.3 信号量设计题的七步

1. **列参与者与动作。**谁生产、谁消费、谁读、谁写？
2. **列共享状态。**数组、下标、计数、资源数量分别是谁修改？
3. **列不变量（Invariant）。**例如不越界、写时无人读、相邻哲学家不同时吃。
4. **分清数量条件与互斥条件。**数量用计数许可，结构更新用互斥保护。
5. **写初值。**资源数是多少？事件是否已经发生？
6. **排 P/V。**在等待条件时是否握着别人完成条件所需的锁？
7. **用极端交错找反例。**空、满、同时申请、恰好在检查后切走、多等待者连续通知。

### 19.4 判断软件算法的四步

1. 列出共享变量初值与每个进程局部变量。
2. 把普通语句拆到题目规定的原子粒度。
3. 分别找“同时进入”“空着却卡住”“无限插队”的交错。
4. 明确内存模型和进程持续执行等假设，不用速度快慢代替证明。

### 19.5 高频易错表

| 错误想法 | 正确理解 |
| --- | --- |
| 一行 count++ 肯定原子 | 可能是读、算、写三个步骤 |
| 单 CPU 就没有竞态 | 抢占和中断仍可造成交错 |
| 全局变量都要独占，局部变量永远不用管 | 看实际共享对象和读写方式 |
| 只要互斥就完全正确 | 还要看 Progress、Bounded Waiting 等 |
| Peterson 的 turn 指向自己 | 标准入口先 turn=对方，冲突时让步 |
| 有原子指令就公平 | 互斥与公平是不同性质 |
| 关本地中断能保护所有 CPU | 其他 CPU 仍可能访问 |
| wait 一定睡眠，signal 让别人立刻运行 | 实现可忙等；唤醒通常只进入 Ready |
| 条件变量 signal 会留下一个许可 | 通常不会，谓词必须保存事实 |
| 被唤醒就一定满足条件 | 要 while 重新检查 |
| 持有普通条件锁直接 sleep 就安全 | 会阻碍改变条件者，须原子协调解锁和睡眠 |
| empty+full 在每条指令后总等于 N | 中途有预留，内部还可能有负值记账 |
| 读者优先不饿任何人 | 写者可能饥饿 |
| 哲学家最多四人吃就防死锁 | 要限制进入取筷子阶段的人数 |
| 两阶段锁指拿两把锁 | 指增长和收缩两个阶段 |
| 2PL 保证无死锁 | 保证可串行化仍可能死锁 |
| 时间戳协议没死锁就不会饥饿 | 可反复回滚 |
| 已提交事务无须重做 | 数据页可能尚未落盘 |
| 检查点以前的日志全无用 | 活跃事务等可能仍需旧记录 |

## 20. 自测题与逐步答案

### 20.1 概念题

1. count 初始为 5，生产和消费各一次为什么可能变成 4？
2. 严格轮换满足互斥，为什么还不是正确临界区协议？
3. Peterson 中 flag[j]=false、turn=j，Pi 能否进入？
4. CAS 返回旧值 0，表示拿锁成功还是失败？
5. 信号量用于“先 S1 后 S2”，初值为何是 0？
6. 条件变量无人等待时先 signal，稍后 wait 能直接通过吗？
7. 无死锁是否代表无饥饿？
8. 两阶段锁能否在释放 A 后再申请 B？

> [!success]- 点击查看答案
> 1. 双方读到同一个旧值，各自算出 6、4，消费者最后写回 4，覆盖生产者更新。
> 2. turn 指向不想进入的人时，临界区空着，另一个申请者仍会被阻止，违反 Progress。
> 3. 能。等待条件是两个子条件都为真，flag[j]=false 已使其不成立。
> 4. 课件的 CAS(&lock,0,1) 返回旧值 0，说明把 0 改成 1，成功。
> 5. 初始无“已经完成 S1”的许可；S1 完成后的 signal 才产生许可。
> 6. 通常不能依赖它通过，通知不积累，应检查共享谓词。
> 7. 不代表。读者优先可以使写者饥饿，其他人却仍有进展。
> 8. 基本 2PL 不允许，因为首次 unlock 后已进入收缩阶段。

### 20.2 信号量计数练习

S 初值为 2，采用允许负数的阻塞型定义。A、B、C、D 依次 wait，之后 A、B 依次 signal。假设等待队列 FIFO，问每步 value、阻塞和唤醒情况。

> [!success]- 点击逐步核对
> - A wait：2→1，A 继续。
> - B wait：1→0，B 继续。
> - C wait：0→−1，C 阻塞。
> - D wait：−1→−2，D 阻塞。
> - A signal：−2→−1，唤醒 C，D 仍等待。
> - B signal：−1→0，唤醒 D。
> - C/D 获得的是交接给它们的许可，不是醒来再重复扣一次。value=0 也不表示它们还在队列中等。

### 20.3 找错：有界缓冲区

```c
// 初始缓冲区为空
wait(mutex);
wait(full);
remove_item();
signal(empty);
signal(mutex);
```

> [!success]- 点击查看原因与修复
> 消费者在空缓冲区上拿着 mutex 等 full。生产者需要 mutex 才能添加并 signal(full)，形成死锁。
> 修复为 wait(full) 在前，wait(mutex) 在后；更新完通常先 signal(mutex)，再 signal(empty)。

### 20.4 找错：条件变量

```c
pthread_mutex_lock(&m);
if (count == 0)
    pthread_cond_wait(&cv, &m);
count--;
pthread_mutex_unlock(&m);
```

> [!success]- 点击查看修复
> if 改为 while。唤醒后条件可能失效，也可能发生虚假唤醒。count 的检查和修改必须受同一把 m 保护，wait 则负责协调释放与重新获取 m。

### 20.5 冲突图练习

调度：`r0(A), w0(A), r1(A), w1(B), r0(B)`。是否冲突可串行化？

> [!success]- 点击查看推理
> - w0(A) 在 r1(A) 前，得 T0→T1。
> - w1(B) 在 r0(B) 前，得 T1→T0。
> - 存在环，所以不是冲突可串行化。

### 20.6 时间戳练习

Q 的 R_TS=15、W_TS=9。分别独立判断 TS=12 的事务 read(Q)、write(Q) 是否允许。

> [!success]- 点击查看答案
> - read：12≥9，允许；R_TS=max(15,12)=15，不变。
> - write：12<15，违反已经发生的较年轻读取次序，拒绝并回滚。不能只检查 W_TS=9 就放行。

### 20.7 恢复练习

日志已可靠保存：`<T0 starts>, <T0,A,100,90>, <T0 commits>, <T1 starts>, <T1,B,50,80>`，随后崩溃。按本章简化 Undo/Redo 模型如何处理？

> [!success]- 点击查看答案
> - T0 有 commit，Redo 使 A 具有已提交的新值 90。
> - T1 无 commit，Undo 撤销其未提交效果，使 B 回到旧值 50。
> - 重复恢复应仍得到这些值，所以用相应旧值/新值恢复，而不是重复做加减。

## 21. 中英术语速查与课件覆盖索引

### 21.1 中英术语速查

| 中文 | English / 缩写 |
| --- | --- |
| 进程同步 / 协作进程 | Process Synchronization / Cooperating Processes |
| 并发 / 并行 / 交错 | Concurrency / Parallelism / Interleaving |
| 共享数据 / 数据一致性 | Shared Data / Data Consistency |
| 竞态条件 / 数据竞争 / 丢失更新 | Race Condition / Data Race / Lost Update |
| 临界资源 / 临界区 | Critical Resource / Critical Section，CS |
| 进入区 / 退出区 / 剩余区 | Entry Section / Exit Section / Remainder Section |
| 互斥 / 进展 / 有限等待 | Mutual Exclusion / Progress / Bounded Waiting |
| 忙等待 / 阻塞等待 / 唤醒 | Busy Waiting / Blocking Wait / Wakeup |
| 严格轮换 / 取号 / 字典序 | Strict Alternation / Ticket Selection / Lexicographic Order |
| 原子性 / 可见性 / 顺序性 | Atomicity / Visibility / Ordering |
| 顺序一致性 / 先行发生 | Sequential Consistency / Happens-before |
| 内存屏障 / 乱序执行 | Memory Barrier (Fence) / Out-of-Order Execution |
| 未定义行为 | Undefined Behavior，UB |
| 测试并设置 / 原子交换 | Test-and-Set，TAS / Atomic Swap (Exchange) |
| 比较并交换 | Compare-and-Swap，CAS |
| 互斥锁 / 自旋锁 / 自适应互斥锁 | Mutex / Spinlock / Adaptive Mutex |
| 信号量 / 计数信号量 / 二元信号量 | Semaphore / Counting Semaphore / Binary Semaphore |
| 等待队列 / 许可 / 交接 | Wait Queue / Permit / Handoff |
| 唤醒丢失 / 虚假唤醒 | Lost Wakeup / Spurious Wakeup |
| 死锁 / 饥饿 / 公平性 | Deadlock / Starvation / Fairness |
| 有界缓冲区 / 环形缓冲区 | Bounded Buffer / Circular Buffer |
| 生产者—消费者 | Producer-Consumer |
| 读者—写者 / 读者优先 | Readers-Writers / Reader Preference |
| 哲学家就餐 | Dining Philosophers |
| 管程 / 条件变量 / 谓词 | Monitor / Condition Variable / Predicate |
| 入口队列 / 条件队列 | Entry Queue / Condition Queue |
| 不变量 / 轮询 | Invariant / Polling |
| 中断屏蔽 / 中断延迟 | Interrupt Masking / Interrupt Latency |
| 分派器对象 / 事件 / 转闸 | Dispatcher Object / Event / Turnstile |
| 事务 / 提交 / 中止 / 回滚 | Transaction / Commit / Abort / Rollback |
| 易失性 / 非易失性 / 稳定存储 | Volatile / Nonvolatile / Stable Storage |
| 先写日志 / 撤销 / 重做 | Write-Ahead Logging，WAL / Undo / Redo |
| 幂等性 / 检查点 | Idempotence / Checkpoint |
| 串行调度 / 可串行化 | Serial Schedule / Serializability |
| 冲突可串行化 / 优先图 | Conflict Serializability / Precedence Graph |
| 共享锁 / 排他锁 / 兼容矩阵 | Shared Lock，S / Exclusive Lock，X / Compatibility Matrix |
| 两阶段锁 / 增长阶段 / 收缩阶段 | Two-Phase Locking，2PL / Growing Phase / Shrinking Phase |
| 时间戳 / 时间戳排序 / 过时写 | Timestamp / Timestamp Ordering / Obsolete Write |

### 21.2 课件覆盖索引

| 课件页码 | 主题 | 本笔记 |
| --- | --- | --- |
| 1～2 | 标题与目录 | 开头、导航 |
| 3 | CPU 调度复习 | 第 1.1 节；详细算例见 Chapter 5 |
| 4～11 | 同步背景、环形缓冲区、竞态 | 第 1 节 |
| 12～15 | 临界区与正确性要求 | 第 2 节 |
| 16～25 | 三种软件尝试 | 第 3 节 |
| 26～28 | Peterson | 第 4 节 |
| 29～32 | 乱序与屏障 | 第 5 节 |
| 33～35 | Bakery | 第 6 节 |
| 36～46 | 关中断、TAS、Swap、CAS、有界等待 | 第 7 节 |
| 47～50 | Mutex、Spinlock、硬件方法讨论 | 第 8 节与第 7 节 |
| 51～56 | 信号量、类型、用法、原子实现 | 第 9 节 |
| 57～59 | 忙等与阻塞型实现 | 第 9～10 节 |
| 60～62 | Lost Wakeup 与 sleep 锁协议 | 第 10 节 |
| 63～64 | 忙等选择、死锁、饥饿 | 第 9.7、11 节 |
| 65～68 | 经典问题提纲与有界缓冲区 | 第 12 节 |
| 69～71 | Readers-Writers | 第 13 节 |
| 72～73 | Dining Philosophers | 第 14 节 |
| 74～78 | P/V 错用、Monitor、Condition、管程哲学家 | 第 11.3、15 节 |
| 79～83 | 系统同步实例 | 第 16.1～16.3 节 |
| 84～87 | Pthread Mutex 与 Condition 示例 | 第 16.4～16.6 节 |
| 88～93 | 事务、存储、日志、恢复、检查点 | 第 17 节 |
| 94～98 | 调度、串行化、冲突 | 第 18.1～18.4 节 |
| 99～100 | 锁协议与 2PL | 第 18.5～18.6 节 |
| 101～104 | 时间戳协议、读写判断及图例 | 第 18.7～18.12 节 |
| 105 | 结束页 | 无新增知识点 |

### 21.3 配图与来源

- 课件路径：`D:\学习文件\大三上\OS\ch6-Process Synchronization-20261020.pptx`。
- 图片目录：`OS/pictures/Chapter 6/`，按 `slide-页码-fig-序号` 命名。
- 课件的 14 张嵌入图片均已提取保存；正文使用其中 13 张，另保留第 33 页人物照片。
- 外部核对仅用于明确算法、语言模型和 API 边界：[Lamport 的 Bakery 原论文](https://lamport.azurewebsites.net/pubs/bakery.pdf)、[C++ 标准草案的数据竞争定义](https://eel.is/c++draft/intro.races)、[POSIX 条件等待规范](https://pubs.opengroup.org/onlinepubs/9799919799/functions/pthread_cond_clockwait.html)。正文已在相关说明处给出链接。
