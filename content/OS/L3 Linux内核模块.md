---
title: L3 Linux内核模块
tags:
  - OS
  - Linux
  - 内核模块
aliases:
  - OS/notes/L3 Linux内核模块
---

# L3 Linux内核模块

> 来源：`L3 Linux内核模块.pdf`，14 页。前置 [[OS/L2 Linux内核|L2 Linux内核]]。本笔记解释课程机制与代码结构，未在本机编译、加载或卸载模块。

## 1. 模块是什么（Module Concept）

课件 3–6 页。**可加载内核模块（Loadable Kernel Module，LKM）**是运行时加入内核的目标代码，常用于驱动、文件系统及其他内核功能。

模块不是普通用户态可执行程序，不依靠 `main()` 作为启动入口；装入后在内核态执行，与内核共享故障影响范围。模块化提升灵活性，但不意味着隔离性与用户进程相同。

收益：修改某功能不必重建全部内核，不需要时可以不装入。代价：符号与依赖管理、驻留内存和同步维护，以及错误可能破坏整个内核。

## 2. 生命周期与入口（Lifecycle and Entry Points）

课件 7–9 页使用 `init_module()`、`cleanup_module()`。核心语义：装入时初始化并注册资源，卸载前取消注册、停止活动并回收资源。

![课件原始模块例子](OS/pictures/L3%20Linux%E5%86%85%E6%A0%B8%E6%A8%A1%E5%9D%97/%E5%AD%A3%E8%80%81%E5%B8%88-p007.png)

下面是补充的入口注册写法，用于辨认结构，不代表已经针对课程运行内核验证：

```c
#include <linux/init.h>
#include <linux/module.h>
#include <linux/printk.h>

static int __init hello_init(void)
{
    pr_info("hello module\n");
    return 0;
}

static void __exit hello_exit(void)
{
    pr_info("goodbye module\n");
}

module_init(hello_init);
module_exit(hello_exit);
MODULE_LICENSE("GPL");
```

初始化返回 0 表示成功；中途失败要清理已取得的资源。日志走内核日志缓冲，不保证显示在当前终端。`MODULE_LICENSE` 是模块元数据，不是把任意代码自动变成具有相应授权来源的声明工具。

## 3. 构建过程（Kbuild）

课件第 8 页：

```make
obj-m += helloworld.o
KDIR ?= /lib/modules/$(shell uname -r)/build
all:
	$(MAKE) -C $(KDIR) M=$(CURDIR) modules
```

命令行需要 Tab。`obj-m` 告诉内核构建系统形成模块；`-C` 转到内核构建目录，`M` 指出外部模块源码目录。

![课件 Makefile](OS/pictures/L3%20Linux%E5%86%85%E6%A0%B8%E6%A8%A1%E5%9D%97/%E5%AD%A3%E8%80%81%E5%B8%88-p008.png)

普通 C 程序可直接链接用户库；模块需要匹配的内核构建环境与配置。只改变文件扩展名为 `.ko` 不会产生可加载模块。

## 4. 加载、查看、卸载（Load, Inspect and Unload）

课件 9–13 页。以下是命令含义，不是已执行记录：

| 操作 | 示例 | 目的 |
| --- | --- | --- |
| 加载 | `insmod ./helloworld.ko` | 请求内核装入指定模块 |
| 查看 | `lsmod` | 查看已加载模块及使用信息 |
| 查看原始接口 | `cat /proc/modules` | 读取模块列表接口 |
| 查看日志 | `dmesg` | 查找初始化/退出信息，权限依环境 |
| 卸载 | `rmmod helloworld` | 请求卸载模块，通常使用模块名而非 .ko 路径 |

内核需要处理验证、符号解析、重定位及初始化；不要把这些工作全部归于用户态 `insmod` 自己完成。模块被引用、仍有活动回调或环境限制时，卸载可能失败。

## 5. 资源配对与自测（Resource Pairing and Review）

| 初始化时 | 退出/失败时 |
| --- | --- |
| 申请内存 | 释放内存 |
| 注册设备或接口 | 取消注册 |
| 启动工作项、定时器等 | 停止并等待仍可能执行的活动 |

仅释放内存但留下可运行回调，会导致后续访问已释放资源。退出函数不是“最后打印一句话”就足够。

1. 为什么模块不能直接 `./helloworld.ko` 当普通程序运行？
2. 初始化失败时，先前申请的资源由谁处理？
3. 卸载失败是否总是代码语法错误？

> [!success]- 答案
> 1. 它是为内核链接、装入的模块目标，不是普通进程启动映像。
> 2. 失败路径必须正确撤销已完成的初始化。
> 3. 不是，还可能有引用、活动任务、版本或环境限制。

术语：模块入口（Module Entry）、导出符号（Exported Symbol）、重定位（Relocation）、引用计数（Reference Count）、依赖（Dependency）。
