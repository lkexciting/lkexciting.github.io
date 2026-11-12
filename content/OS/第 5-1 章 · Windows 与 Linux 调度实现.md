---
title: 第 5-1 章 · Windows 与 Linux 调度实现
tags:
  - OS
  - 调度
  - Windows
  - Linux
aliases:
  - OS/Chapter 5-1
  - OS/notes/Chapter 5-1
---

# 第 5-1 章 · Windows 与 Linux 调度实现

> 来源：`ch5-1 Windows & Linux scheduling.pdf`，82 页。基础与计算见 [[OS/第 5 章 · CPU 调度|Chapter 5]]；Linux 结构与进程创建见 [[OS/Linux 第 5 讲 · 进程管理|Linux 第 5 讲 · 进程管理]]。这里专门组织历史系统实现，不重复 FCFS、SJF、RR 的基础推导。

## 1. Windows 2000/XP 的线程调度（Thread Scheduling）

课件 1–48 页。调度对象是**线程（Thread）**，不是“每个进程只有一个可执行位置”。其示例采用抢占式优先级调度，同级可轮转；就绪集合与处理器约束共同决定选谁。

### 1.1 状态与处理器选择

就绪（Ready）、备用（Standby）、运行（Running）、等待（Waiting）等状态有不同职责。Standby 表示已选作某处理器的下一候选，不等于已经执行。

### 1.2 基本与动态优先级

课件以 0–31 级示例组织线程，其中可变优先级区与实时优先级区采用不同规则。进程优先级类（Process Priority Class）与线程相对优先级共同影响基本优先级（Base Priority）；当前动态优先级还可因等待完成等情况调整。

![课件优先级映射表](OS/pictures/Chapter%205-1/%E5%AD%A3%E8%80%81%E5%B8%88-p014.png)

不要把某个 API 的相对级别常量直接当作调度器最终使用的数字，也不要把这里较大数优先与旧 Linux 内部较小数优先的表示混用。

### 1.3 时间配额与切换

发生等待、被更高优先级就绪线程抢占、配额用完、线程结束时都可能触发选择。**时间配额（Quantum）** 是可运行时获得的执行预算，不保证线程不受抢占地连续运行到配额结束。

I/O 完成、事件等待结束、GUI 唤醒等可触发课件所述优先级提升（Priority Boost）；这是改善响应的具体政策，不能把所有提升都称为锁的优先级继承（Priority Inheritance）。

### 1.4 就绪位图与多处理器

每级有就绪队列，**就绪位图（Ready Bitmap）** 记录哪些级非空，帮助快速定位候选。

![课件就绪位图](OS/pictures/Chapter%205-1/%E5%AD%A3%E8%80%81%E5%B8%88-p022.png)

**处理器亲和性（Processor Affinity）** 限制线程可以在哪些处理器运行；首选处理器是额外的选择偏好。若最高优先级线程不允许在某个空闲 CPU 上运行，不能直接断言该 CPU 一定能运行它。

## 2. Linux 调度（Linux Scheduling）

课件 49–82 页，结合 [[OS/Linux 第 5 讲 · 进程管理|Linux 第 5 讲 · 进程管理]] 阅读。

### 2.1 版本先分开

- 2.4 示例：扫描可运行集合，使用相应权值选取。
- 早期 2.6 O(1)：优先级数组、位图、每 CPU runqueue、active/expired。
- CFS：课件另行介绍公平调度思想，不再等同于 O(1) 双数组方案。

### 2.2 active 与 expired

active 数组组织当前有资格竞争的实体；时间片用尽后按该历史算法进入 expired。active 没有可运行实体时交换两个数组角色，避免重新逐个重建所有运行预算。

![课件 runqueue 双数组字段](OS/pictures/Chapter%205-1/%E5%AD%A3%E8%80%81%E5%B8%88-p066.png)

简化例：同级 A、B 先在 active；A 用完片进入 expired，B 继续竞争；B 也用完且 active 空后，两数组交换，A/B 在下一轮再获机会。更高优先级就绪者和该版本的交互性规则还会影响实际运行，不能把示意例当完整调度器。

### 2.3 何时调用 schedule

等待事件可主动让出 CPU；时间片耗尽或更高优先级实体就绪可设置重新调度要求。是否允许立即切换还取决于当前上下文与抢占规则。

多 CPU 有负载均衡（Load Balancing）与迁移（Migration），迁移可能破坏缓存局部性，因此吞吐、公平和亲和性之间需要权衡。

## 3. 题目检查与复习（Review）

| 题目线索 | 要问的问题 |
| --- | --- |
| Windows 优先级数字 | 是类、相对值、基本值还是当前值？ |
| Quantum | 是否被抢占，还是已经真正用尽？ |
| 空闲处理器 | 候选线程亲和性是否允许？ |
| O(1) | 当前讲哪一代 Linux？ |
| active/expired | 哪个数组空了、何时交换？ |
| CFS | 不要套用另一代数组迁移规则 |

自测：高优先级线程只能在 CPU0 运行，而 CPU0 忙、CPU1 空，它是否必定立即在 CPU1 执行？答案：不一定，亲和性可能禁止它在 CPU1 运行。

术语：动态优先级（Dynamic Priority）、时间配额（Quantum）、亲和性（Affinity）、就绪位图（Ready Bitmap）、运行队列（Runqueue）、负载均衡（Load Balancing）。
