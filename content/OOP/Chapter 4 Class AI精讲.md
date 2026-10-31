---
title: Chapter 4 Class · AI 精讲
aliases:
  - OOP/notes/Chapter 4 Class AI精讲
---
# Chapter 4 Class：类

> 对应课件：`4_Class_2025.pdf`（59 页）
> 关键词：class、member function、`::` resolver、encapsulation、compile unit、header guard、declaration vs definition、Makefile、CMake

---

## 0. 本章的叙事线

课件用一条非常教学化的路径引入"类"：

1. 先用 C 的 `struct` + 一堆自由函数实现一个 `Point`，让你看到**痛点**；
2. 再把数据和函数"捆"进 `class`，让你看到**封装**；
3. 用一个售票机（TicketMachine）案例，说明**从过程式到对象式的思维转变**；
4. 最后讲**工程组织**：`.h` / `.cpp` / `#include` / 头文件保护 / Makefile / CMake。

顺序很重要：类不是为了"看起来高级"，而是为了解决"数据和操作分离"带来的维护灾难。

---

## 1. 从 C 的 struct 到 C++ 的 class

### 1.1 C 的做法

```c
typedef struct point {
    int x;
    int y;
} Point;

Point a;
a.x = 1; a.y = 2;

void print(const Point* p) {
    printf("%d %d\n", p->x, p->y);
}
print(&a);

void move(Point* p, int dx, int dy) {
    p->x += dx;
    p->y += dy;
}
move(&a, 2, 2);
```

先声明原型（prototypes），再使用：

```c
void print(const Point* p);
void move(Point* p, int dx, int dy);

Point a, b;
a.x = b.x = 1;
a.y = b.y = 1;
move(&a, 2, 2);
print(&a);
print(&b);
```

这段代码能跑，问题在于：

- **数据和操作是分离的两套名字**：`Point` 和 `print`/`move` 之间没有任何语法上的绑定，编译器不知道它们属于同一个概念；
- **谁都能改 `x`、`y`**：`a.x = -999` 也没人拦，不变量（invariant）无法维持；
- **函数名字会污染全局**：再来一个 `print(Student*)` 就得改名叫 `printStudent`；
- **每加一个类型，就要复制一套函数**。

### 1.2 C++ 的做法

```cpp
class Point {
public:
    void init(int x, int y);
    void move(int dx, int dy);
    void print() const;

private:
    int x;
    int y;
};
```

成员函数的定义（在类外）：

```cpp
void Point::init(int ix, int iy) {
    x = ix; y = iy;
}

void Point::move(int dx, int dy) {
    x += dx; y += dy;
}

void Point::print() const {
    cout << x << ' ' << y << endl;
}
```

使用：

```cpp
Point a;
a.init(1, 2);
a.move(2, 2);
a.print();
```

对比表：

| C | C++ |
| --- | --- |
| `typedef struct point {...} Point;` | `class Point {...};` |
| `void print(const Point* p);` | `void print() const;`（成员函数） |
| `void move(Point* p, int dx, int dy);` | `void move(int dx, int dy);` |
| `a.x = 1; a.y = 2;` | `a.init(1, 2);` |
| `move(&a, 2, 2);` | `a.move(2, 2);` |
| `print(&a);` | `a.print();` |

注意三个关键变化：

1. **函数"长"在对象上**：`a.move(2,2)` 读起来是"让 a 移动"，而不是"对 a 施加 move"；
2. **不需要显式传 `&a`**：`this` 指针隐式传入（Ch.5 详述）；
3. **`x`、`y` 变成 `private`**：外部再也无法绕过 `init`/`move` 直接改数据。

### 1.3 `::` 作用域解析运算符（resolver）

```cpp
<Class Name>::<function name>     // 定义成员函数
::<function name>                 // 访问全局名字
```

```cpp
void S::f() {
    ::f();   // 否则会递归调用自己
    ::a++;   // 选择全局的 a
    a--;     // 选择类作用域的 a
}
```

`::` 的完整语义是"**在某个作用域里找这个名字**"。`::f()` 前面什么都没有，表示全局作用域。这条规则在 Ch.11（类模板的成员定义 `Vector<T>::push_back`）和 Ch.16（命名空间）里会反复用到。

---

## 2. 对象 = 属性 + 服务

![Objects = Attributes + Services：数据被操作包裹](OOP/images/Chapter%204%20Class%20AI%E7%B2%BE%E8%AE%B2/ch4-p11-11.webp)

课件的等式：

> **Objects = Attributes + Services**
> Data：the properties or status（属性/状态）
> Operations：the functions（操作/服务）

那个"绿色小圆被蓝色大圆包住"的图，正是**封装（encapsulation）** 的可视化：数据在里面（被保护），操作在外面（对外可见）。外部只能通过"服务"这一层间接接触数据。

### 2.1 一个更贴近工程的例子：售票机

需求描述：

> 售票机在顾客投入正确金额后打印一张票。它需要顾客先投钱，再请求打印。机器还要持续统计它总共收了多少。

**过程式的写法**：把流程写成步骤——走到机器前、投币、机器打票、取票离开。它能工作，但课件一针见血：

> It works. But there is no such machine. There's nothing left for the further development.
> （它能跑，但世界上并不存在这样一台"机器"。更重要的是，这样的程序没有继续发展的余地。）

因为流程里**没有任何"东西"可以复用、可以修改、可以替换**。需求一变（加个找零），整个流程就得重写。

**对象式的写法**：先找出"那里有什么东西"（something is there）——

![售票机被识别为一个对象：属性 + 服务](OOP/images/Chapter%204%20Class%20AI%E7%B2%BE%E8%AE%B2/ch4-p18-18.webp)

左边是**类**（class）的蓝图，右边是**对象**（object）的实例：

- 属性（attributes）：`PRICE`（票价，常量）、`balance`（当前投入）、`total`（累计收入）
- 服务（services）：`showPrompt()`、`getMoney()`、`printTicket()`、`showBalance()`、`printError()`

写成代码：

```cpp
class TicketMachine {
public:
    void showPrompt();
    void getMoney();
    void printTicket();
    void showBalance();
    void printError();

private:
    const int PRICE;
    int balance;
    int total;
};
```

**这就是"责任驱动设计"（responsibility-driven design）的雏形**：不问"程序先做什么"，而问"哪个对象负责什么"。

### 2.2 对象 vs 类

| Objects（对象） | Class（类） |
| --- | --- |
| 代表具体的事物、事件或概念 | 定义实例应有的属性 |
| 运行期响应消息（respond to messages at run-time） | 像 C++ 里的类型（act like types） |
| 有各自的存储 | 不占运行期存储（只是蓝图） |

课件的关系图是 "class **defines** object"、"object **is a** class" 的双向箭头。用一句话记：**类是模具，对象是铸件**。

### 2.3 OOP 的五条世界观

课件列出的五条，是判断"这段代码是否真的面向对象"的标准：

1. **Everything is an object.**（一切都是对象）
2. **A program is a bunch of objects telling each other what to do by sending messages.**（程序是一群对象互相发消息）
3. **Each object has its own memory made up of other objects.**（每个对象有自己的存储，由其他对象组成）
4. **Every object has a type.**（每个对象都有类型）
5. **All objects of a particular type can receive the same messages.**（同类型的对象能接收相同的消息）

第 5 条是**多态**（polymorphism）的种子：既然"同类型能接收相同消息"，那么"看起来同类型、实际不同类型"的对象，就可以用同一句话调用出不同行为——这就是 Ch.7 的虚函数。

### 2.4 C++ 里"对象"的严格定义

> In C++, an object is just a variable, and the purest definition is "a region of storage".

这句要记住，因为它解释了很多"反直觉"的现象：

- `int i;` 里的 `i` 在 C++ 标准眼里就是一个对象；
- 对象不一定是"类的实例"，内置类型也是对象；
- 所以"面向对象"不等于"到处写 class"。

---

## 3. 类的工程组织：一个类 = 一个 `.h` + 一个 `.cpp`

### 3.1 为什么要拆文件

- **编译单元（compile unit）**：编译器一次只看**一个 `.cpp` 文件**，为它生成一个 `.obj`（目标文件）；
- **链接器（linker）** 把所有 `.obj` 合成一个可执行文件；
- 那么 A.cpp 怎么知道 B.cpp 里的函数长什么样？——靠 **`.h` 提供的信息**。

### 3.2 头文件 = 接口 = 契约

> The header is a **contract** between you and the user of your code. The compiler enforces the contract by requiring you to declare all structures and functions before they are used.

头文件里放什么：

- 类声明（class declaration）+ 成员函数原型（prototypes）
- `extern` 变量声明
- 函数原型
- `struct` / `class` 声明
- 常量、`inline` 函数、模板定义（这两个是例外，必须放头文件）

`.cpp` 里放什么：

- 所有函数体（函数定义）

> **Only declarations are allowed to be in `.h`.**

### 3.3 `#include` 到底做了什么

```cpp
#include "xx.h"   // 通常先在当前目录找（implementation defined）
#include <xx.h>   // 在指定的系统目录找
#include <xx>     // 等价于 <xx.h>
```

`#include` 是**预处理器**（pre-compiler）指令：**把被包含文件的内容原地插入到 `#include` 所在的位置**。它不理解 C++ 语法，只是文本替换。

![C++ 程序结构：.h 声明 + .cpp 定义，预处理后拼成一个编译单元](OOP/images/Chapter%204%20Class%20AI%E7%B2%BE%E8%AE%B2/ch4-p33-33.webp)

这张图把整条链路画清楚了：

- 左边的 `.h` 只有 declarations；
- 中间的 `.cpp` 有 definitions 和 `#include`；
- 预处理之后（after pre-compiler），`.h` 的内容被**复制粘贴**到 `.cpp` 顶部，形成一张大文件——这就是真正送给编译器的编译单元；
- 下方另一个 `.cpp`（其他模块）也会 `#include` 同一个 `.h`，于是每个编译单元里都有一份**声明**（但没有定义，定义只在某处存在一份）。

由此可以推出两条铁律：

- **头文件里放定义 → 多个 `.cpp` 都 include 它 → 同一个符号被定义多次 → 链接错误 `multiple definition`**；
- **定义没写进任何 `.cpp` → 链接器找不到 → `undefined reference`**。

### 3.4 头文件保护（header guard）

因为 `#include` 是"复制粘贴"，同一个头文件被间接包含两次，就会出现"重复定义"：

```cpp
#ifndef HEADER_FLAG
#define HEADER_FLAG
// all kinds of declarations here...
#endif // HEADER_FLAG
```

或者（更简洁、但非标准、所有主流编译器都支持）：

```cpp
#pragma once
```

课件明确指出：**`#pragma once` equivalent to `#ifndef…#endif`**。

### 3.5 头文件四条军规

1. **一个头文件只放一个类的声明**；
2. **与同名同前缀的源文件配对**（`Point.h` ↔ `Point.cpp`）；
3. **内容用安全哨兵包起来**（`#ifndef/#define/#endif`）；
4. `#pragma once` 可以替代哨兵。

---

## 4. 构建工具：Makefile

### 4.1 动机

小项目单文件编译没问题，项目变大后：

- 文件长，人和机器都难管理；
- 改一行要全量编译，太慢；
- 多人在同一文件上改会冲突；
- 需要按组件切分。

目标：**良好的组件划分 + 最小化编译 + 易于维护依赖关系**。

### 4.2 依赖是一张 DAG

项目结构可以表示为一个**有向无环图（DAG, Directed Acyclic Graph）**：

![三个文件的依赖 DAG：sum 依赖于两个 .o，各自依赖 .c 和 .h](OOP/images/Chapter%204%20Class%20AI%E7%B2%BE%E8%AE%B2/ch4-p45-45.webp)

对应 Makefile：

```make
sum: main.o sum.o
	gcc -o sum main.o sum.o

main.o: main.c sum.h
	gcc -c main.c

sum.o: sum.c sum.h
	gcc -c sum.c
```

规则语法（rule syntax）：

```
target: dependencies
	action
```

**注意：命令前必须是 Tab，不是空格**——这是新手最常踩的坑。

### 4.3 等价简化

`.o` 默认依赖同名 `.c`，所以可以省略：

```make
sum: main.o sum.o
	gcc -o sum main.o sum.o

main.o: sum.h
	gcc -c main.c

sum.o: sum.h
	gcc -c sum.c
```

再用内置宏压缩（`$@` = 目标名，`$*` = 目标去后缀）：

```make
sum: main.o sum.o
	gcc -o $@ main.o sum.o

main.o sum.o: sum.h
	gcc -c $*.c
```

### 4.4 make 的工作流程

1. 构造依赖树；
2. 目标是**第一条规则**的目标；
3. 自顶向下检查：**只要目标文件比某个依赖旧，就要重建**；
4. 自底向上重建；
5. 有任何改动通常都需要重新链接。

例：`sum 10:03`、`main.o 09:56`、`sum.o 09:35`、`main.c 10:45`、`sum.c 09:14`、`sum.h 08:39`

→ `main.c` 比 `main.o` 新 → 重新 `gcc -c main.c` → `main.o` 变新，比 `sum` 新 → 重新链接 `gcc -o sum main.o sum.o`。`sum.o` 不动。

**反面教材**（千万不要这么写）：

```make
prog: main.c sum1.c sum2.c
	gcc -o prog main.c sum1.c sum2.c
```

任何改动都会导致全量编译，等于放弃了 make 的全部价值。

参考：https://www.gnu.org/software/make/manual/make.html

---

## 5. 构建工具：CMake

- **跨平台、开源的构建系统**（cross-platform, open-source build system）；
- 用**与平台/编译器无关的配置文件**描述"如何编译"；
- 它**生成**原生 makefile 或 IDE 工程，再交给你的编译器环境去执行；
- 目标是一套配置，到处能用：**Don't make any assumption about the platform or compiler!**

最小示例：

```cmake
# 1. 最低 CMake 版本
cmake_minimum_required(VERSION 2.8)

# 2. 项目信息
project(point_design)

# 3. 生成可执行目标，并列出源文件
add_executable(point_design main.cpp Point.cpp)
```

一句话理解两者关系：**Makefile 是"怎么做"，CMake 是"描述要做什么"，然后替你生成 Makefile。**

---

## 6. 要点自检

1. C 的 `struct` + 自由函数有什么三个具体痛点？`class` 分别怎么解决？
2. `Point::print` 里的 `::` 是什么？`::a` 和 `a` 在成员函数里有什么区别？
3. 头文件为什么只能放声明？放定义的后果是什么？
4. 什么是编译单元？`#include` 在哪个阶段发生？
5. 头文件保护解决什么问题？`#pragma once` 与它等价吗？
6. Makefile 里"目标比依赖旧"意味着什么？
7. `TicketMachine` 例子中，"过程式写法没有继续发展的余地"具体指什么？

---

## 7. 易错点

- **类定义末尾的分号不能少**：`class Point { ... };` 少了 `;` 会报一堆莫名其妙的错。
- **成员函数定义忘记写 `Point::`**：会变成普通全局函数，访问不到成员变量（编译报"未声明"）。
- **在头文件里定义普通函数/全局变量** → 被多个 `.cpp` 包含 → `multiple definition`。
- **类内定义的成员函数默认是 `inline`**（详见 Ch.5），所以小函数写在类里没问题；大函数应移到 `.cpp`。
- **`#include "x.h"` 与 `<x.h>` 的区别是"查找路径"，不是"是否标准库"**——标准库也可以用引号，只是找不到时会退化到系统路径。

---

*上一篇：[[OOP/Chapter 3 Memory Model AI精讲|Chapter 3 Memory Model AI精讲]]　下一篇：[[OOP/Chapter 5 Interaction Construction AI精讲|Chapter 5 Interaction Construction AI精讲]]*
