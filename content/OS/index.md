---
title: OS
aliases:
  - OS/notes/index
  - OS/note/index
---

# OS 学习索引

> 本次整合来源：`D:/学习文件/大三上/OS/季老师ppt` 的 16 份有效 PDF。保留原来老师课件的笔记与例题，重复内容通过链接复用，另一版新增内容追加到对应章末。PDF 页码使用文件实际页数，可能与页面底部印刷编号不同。

## 1. 理论主线（Theory）

| 顺序 | 笔记 | 学习重点 |
| --- | --- | --- |
| 1 | [[OS/第 1 章 · 操作系统概述|Chapter 1]] | OS 角色、硬件、特权、虚拟化与计算环境 |
| 2 | [[OS/第 2 章 · 操作系统服务与结构|Chapter 2]] | 服务、系统调用、内核结构、构建与调试 |
| 3 | [[OS/第 3 章 · 进程|Chapter 3]] | 进程、状态、创建、IPC 与客户端服务器 |
| 4 | [[OS/第 4 章 · 线程|Chapter 4]] | 线程、映射模型、多核与隐式线程 |
| 5 | [[OS/第 5 章 · CPU 调度|Chapter 5]] | 调度算法、计算、实时与多处理器 |
| 5-1 | [[OS/第 5-1 章 · Windows 与 Linux 调度实现|Chapter 5-1]] | Windows/Linux 历史调度实现 |
| 6 | [[OS/第 6 章 · 进程同步|Chapter 6]] | 临界区、原子操作、信号量、管程及事务 |
| 7 | [[OS/第 7 章 · 死锁|Chapter 7]] | 死锁、安全状态、银行家、检测与恢复 |
| 8 | [[OS/第 8 章 · 主存管理|Chapter 8]] | 地址转换、分配、分页、TLB、分段 |
| 9 | [[OS/第 9 章 · 虚拟内存|Chapter 9]] | 缺页、置换算法、帧分配、工作集与抖动 |

## 2. Linux 实现专题（Implementation）

| 笔记 | 对应理论 | 内容 |
| --- | --- | --- |
| [[OS/Linux 第 1 讲 · 概述|Linux 第 1 讲 · 概述]] | 1–2 | GNU、发行版、目录、Shell、GCC、Make |
| [[OS/Linux 第 2 讲 · 内核|Linux 第 2 讲 · 内核]] | 2 | 子系统、源码目录、配置构建与启动 |
| [[OS/Linux 第 3 讲 · 内核模块|Linux 第 3 讲 · 内核模块]] | 2 | 模块生命周期、Kbuild、加载与清理 |
| [[OS/Linux 第 4 讲 · 系统调用|Linux 第 4 讲 · 系统调用]] | 2–3 | 旧 x86 调用入口、参数、分派、getuid 跟踪 |
| [[OS/Linux 第 5 讲 · 进程管理|Linux 第 5 讲 · 进程管理]] | 3–5 | task_struct、队列、fork/exec 与调度历史 |
| [[OS/Linux 第 6 讲 · 内存管理|Linux 第 6 讲 · 内存管理]] | 8–9 | VMA、页表、缺页、回收、Buddy 与 Slab |

## 3. 16 份课件对应关系（Source Coverage）

| 源 PDF | 页数 | 对应笔记与本次处理 |
| --- | ---: | --- |
| ch1 Introduction | 116 | Chapter 1，补虚拟化、云与内核结构数据 |
| ch2 Operating-System Structures | 90 | Chapter 2，补服务、结构、ABI 与调试 |
| ch3 processes | 95 | Chapter 3，补消息队列、POSIX共享内存、管道、Socket/RPC |
| ch4 Threads | 63 | Chapter 4，补多核任务划分与隐式线程 |
| ch5 CPU Scheduling | 69 | Chapter 5，保留已有算法与计算，添加对应说明 |
| ch5-1 Windows & Linux scheduling | 82 | 新建 Chapter 5-1 |
| ch6 Process Synchronization | 109 | Chapter 6，保留完整旧讲解并补题目边界 |
| ch7 Deadlocks | 72 | Chapter 7，补另一版定位和银行家读表 |
| ch8 Main Memory | 101 | 新建 Chapter 8 |
| ch9 Virtual Memory | 102 | 新建 Chapter 9 |
| L1 linux概述 | 72 | 新建 L1 Linux概述 |
| L2 Linux内核 | 38 | 新建 L2 Linux内核 |
| L3 Linux内核模块 | 14 | 新建 L3 Linux内核模块 |
| L4 Linux系统调用 | 38 | 新建 L4 Linux系统调用 |
| L5 Linux进程管理 | 89 | 新建 L5 Linux进程管理 |
| L6 Linux内存管理 | 85 | 新建 L6 Linux内存管理 |

## 4. 怎样避免重复学

先按理论章节建立概念与计算方法，再读对应 Linux 专题寻找代码与数据结构实现。已熟悉第 1–7 章时，先看章末“季老师补充”，不必从头重抄全部内容。

调度的 FCFS/SJF/RR 计算在 Chapter 5，系统队列细节在 Chapter 5-1；L5 侧重进程结构、状态和创建流程。内存换算先学 Chapter 8，置换与工作集先学 Chapter 9，再用 L6 把 VMA、页表、物理页和对象分配连起来。

## 5. 使用约定与材料限制

- 专业名词在正文或对照表附英文；公式示例说明假设与单位。
- 新增课件页图保存在 `OS/pictures/对应笔记名/`，文件名 `季老师-pNNN.png`；用相对路径引用。
- 历史 Windows XP、Linux 2.4/早期2.6、IA-32 例子按原版本理解，不混成统一的当前实现。
- 版本号、市场份额、代码行数等时间敏感数字没有做独立实时核验，不作为本笔记的已核验当前事实。
- 代码和命令用于解释课件；本次未在 Linux 环境编译、安装内核或加载模块。


