---
title: L1 Linux概述
tags:
  - OS
  - Linux
  - 开发工具
aliases:
  - OS/notes/L1 Linux概述
---

# L1 Linux概述

> 来源：`L1 linux概述.pdf`，72 页，按 PDF 实际页定位。对应 [[OS/第 1 章 · 操作系统概述|Chapter 1]] 的系统概念、[[OS/第 2 章 · 操作系统服务与结构|Chapter 2]] 的工具与接口。

## 1. Linux、GNU 与发行版（Kernel, GNU and Distribution）

课件 1–39 页。

- **内核（Kernel）** 管理 CPU、内存、设备、文件系统和进程间通信，提供系统调用。
- **用户空间（User Space）** 包含库、Shell、系统服务、编译器及应用程序。
- **发行版（Distribution）** 把内核、工具、安装器、软件包及维护机制组合成可用系统。
- **GNU** 提供大量自由软件工具，Linux 内核与 GNU 用户空间工具是不同项目和层次。
- **POSIX（Portable Operating System Interface）** 是可移植接口的标准体系，不是一种发行版，也不保证所有系统实现完全相同。

“使用同一 Linux 内核家族”不意味着发行版的软件包命令、服务配置和版本都相同。内核版本号与 Ubuntu 等发行版版本号也不能直接等同。

课件包含 Linux、UNIX、GNU 的历史人物与发展背景。理解主线：类 UNIX 接口与设计传统、开放协作开发、内核与完整发行系统的分工。

> [!info] 动态资料的处理
> 第 27、31、34–39 页列出的“最新版本”、代码行数、市场份额、超算排名等属于时间敏感信息，本笔记未将它们作为已核验的当前事实；学习时优先掌握概念。课件的许可证简述也不能替代具体项目许可证文本。

## 2. 安装方式与系统层次（Installation and Layers）

课件 40–46 页。安装到实机、双系统和虚拟机（Virtual Machine）是不同部署方式；虚拟机的来宾系统（Guest OS）运行在宿主（Host）提供的虚拟硬件上。

课程中的虚拟机安装步骤与软件版本是环境示例，不能直接用于当前电脑的分区改造。本任务只整理知识，没有安装或重配系统。

```text
应用程序 / Shell
    标准库与运行库
        系统调用接口
            Linux 内核
                硬件
```

命令通过 Shell 启动，很多命令随后使用系统调用；Shell 本身不是内核。

## 3. 文件系统目录（Filesystem Hierarchy）

课件 47–49 页。

| 目录 | 作用与辨析 |
| --- | --- |
| `/` | 根目录（Root Directory），不是 root 用户的家目录 |
| `/root`、`/home` | 管理员及一般用户的家目录（Home Directory） |
| `/etc` | 系统配置 |
| `/boot` | 引导相关文件 |
| `/dev` | 设备节点（Device Node） |
| `/proc` | 进程、内核状态的伪文件接口，许多内容动态生成 |
| `/lib`、`/usr/lib` | 库及相关运行支持，具体布局随发行版而异 |
| `/tmp` | 临时文件 |
| `/var` | 日志等可变数据 |
| `/mnt` | 临时挂载点的一种惯例 |
| `/usr`、`/usr/local` | 用户空间软件与本地安装的软件等 |

课件里的 `host+found` 应读作 `lost+found`，其作用与文件系统恢复有关；`/usr` 不是普通用户家目录的缩写位置。某些目录可能是符号链接，不能只凭路径名判断物理存储结构。

## 4. C 程序的构建链（Build Pipeline）

课件 50–66 页。

```text
源程序 .c
  预处理（Preprocessing） → .i
  编译（Compilation）    → .s
  汇编（Assembly）       → .o
  链接（Linking）        → 可执行文件
```

`gcc` 在这里作为驱动协调多个工具。`.o` 是可重定位目标文件（Relocatable Object），通常不能像最终程序一样直接执行；课件称其“可执行文件”不够精确。

```sh
# 以下是学习示例，不表示已在本机执行
gcc -E hello.c -o hello.i
gcc -S hello.i -o hello.s
gcc -c hello.s -o hello.o
gcc hello.o -o hello
./hello
```

| 选项 | 含义 |
| --- | --- |
| `-o` | 指定输出文件 |
| `-c` | 只到目标文件，不做最终链接 |
| `-I路径` | 增加头文件搜索目录 |
| `-L路径` | 增加库搜索目录 |
| `-l名字` | 请求链接对应库，如 `-lm` |
| `-g` | 生成调试信息 |

静态库（Static Library）常见 `.a`，共享库（Shared Library）常见 `.so`。头文件提供声明不等于已经链接了实现；遇到 undefined reference，应检查实现与链接步骤，而非只添加 include。

AT&T 汇编示例通常是 `源,目的`，寄存器带 `%`、立即数带 `$`；Intel 语法通常是 `目的,源`。课件以 x86 为背景，不能把具体寄存器、指令与全部 Linux 架构等同。

## 5. Shell、Make 与调试（Shell, Make and Debugging）

课件 51–52、67–71 页。

Shell 负责命令解释、变量、条件和循环；Make 根据依赖关系判断哪些目标需要重建；GDB 用于断点、单步、堆栈和变量检查。

```make
# 自编 Makefile：命令行开头必须是 Tab
hello: hello.o
	gcc hello.o -o hello
hello.o: hello.c
	gcc -c hello.c -o hello.o
```

修改 hello.c 后，hello.o 与 hello 都过期；仅再次运行 make 且输入未变时，不必重建。若目标还依赖头文件，Makefile 也必须记录该依赖，不能只列 .c。

## 6. 自测与来源索引（Review）

1. `.o` 与最终可执行文件的差别？
2. `/` 与 `/root` 是同一个目录吗？
3. 修改了头文件但 Make 没重编译，应检查什么？

> [!success]- 答案
> 1. `.o` 通常仍含待链接符号与重定位信息；可执行文件经过最终链接并具有相应加载结构。
> 2. 不是，前者是根目录，后者通常是管理员家目录。
> 3. 检查头文件是否被记录在目标依赖中。

| 课件页码 | 内容 |
| --- | --- |
| 1–39 | 历史、GNU、版本及应用背景 |
| 40–49 | 安装与文件系统目录 |
| 50–66 | Shell、C 与构建工具 |
| 67–72 | Make、调试、风格、POSIX 与问答 |
