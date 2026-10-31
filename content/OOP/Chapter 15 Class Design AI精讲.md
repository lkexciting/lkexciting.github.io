---
title: Chapter 15 Class Design · AI 精讲
aliases:
  - OOP/notes/Chapter 15 Class Design AI精讲
---
# Chapter 15 Class Design：类的设计

> 对应课件：`15_Class_Design_2025.pdf`（24 页）
> 关键词：responsibility-driven design、coupling、cohesion、code duplication、refactoring、localizing change

---

## 0. 这一章为什么放在最后

前面 14 章都在讲"**怎么把一个类写对**"（语法、内存、多态、异常）。这一章讲"**该写哪些类**"——这是语法书不会告诉你的部分。

课件开篇就定义了目标：

> How to write classes in a way that they are **easily understandable, maintainable and reusable**.

三个词对应三种人：**读代码的人**（understandable）、**改代码的人**（maintainable）、**用代码的人**（reusable）。

---

## 1. 设计时要回答的五个问题

> - How many types of class do we need?（需要几个类？）
> - When to define a class?（什么时候该定义类？）
> - What interface and data in a class?（类里放什么接口、什么数据？）
> - Do we need to construct inheritance to promote interface and code reuse?（要不要用继承来复用？）
> - Which function should be virtual to support dynamic binding at run-time?（哪些函数该虚？）

这五个问题正好对应前 14 章的每一块内容：

| 问题 | 相关章节 |
| --- | --- |
| 几个类？ | Ch.4（Class）、Ch.6（组合 vs 继承） |
| 何时定义类？ | Ch.4（Objects = Attributes + Services） |
| 接口与数据？ | Ch.5（封装、const 成员） |
| 要不要继承？ | Ch.6（is-a vs has-a） |
| 哪些虚？ | Ch.7（多态） |

本章的四个主题：**责任驱动设计（RDD）、耦合（coupling）、内聚（cohesion）、重构（refactoring）**。

---

## 2. 前提：软件会变

> Software is **not like a novel** that is written once and then remains unchanged.
> Software is **extended, corrected, maintained, ported, adapted**…
> The work is done by **different people over time (often decades)**.

这一段是整章的价值观基础。它推出一个残酷的结论：

> **Change or die.**
> - Either it is continuously maintained
> - Or it dies.
> **Software that cannot be maintained will be thrown away.**

所以"设计好坏"的判据不是"现在能不能跑"，而是"**改起来贵不贵**"。

课件最后一句说得最直白：

> **There is a big difference in the amount of work required to change poorly structured and well structured code.**

同样的需求变更，好结构改 10 行，坏结构改 10 个文件——这就是本章要争取的东西。

---

## 3. 衡量代码质量的两个维度

> Two important concepts for quality of code: **Coupling** and **Cohesion**.

这两个词是所有软件设计讨论的坐标系。

### 3.1 耦合（Coupling）

> Coupling refers to **links between separate units** of a program.
> If two classes depend closely on many details of each other, we say they are **tightly coupled**.
> **We aim for loose coupling.**

课件的检验方法极其好用，一句话就能判断：

> **If X changes → how much code in Y must be changed?**

- 改 X 完全不用动 Y → **松耦合**；
- 改 X 导致 Y 一片编译错误 → **紧耦合**。

### 3.2 松耦合带来什么

> Loose coupling makes it possible to:
> - **Understand one class without reading others**（理解一个类不必读别的类）
> - **Change one class without affecting others**（改一个类不影响别的类）
> - **Thus: improves maintainability**（于是提高可维护性）

第一条常被忽略但极其重要：**读代码的时间远多于写代码的时间**。如果读一个类必须先读它的五个依赖，那这个类的实际成本是它的 6 倍。

### 3.3 怎么降低耦合

课件只列了两条：

> - **call-back**（回调）
> - **message mech.**（消息机制）

这两条其实是同一个思想的两个层次：**不要让 A 直接依赖 B 的具体类型，而是让 A 依赖"一个抽象的调用点"**。

用 C++ 的语言说就是：

| 手段 | 效果 |
| --- | --- |
| 依赖**抽象基类**（interface）而非具体类 | 具体实现可替换 |
| **回调**（函数指针 / `std::function` / 接口） | 被调用方不需要知道调用方 |
| **消息/事件机制** | 双方互不知道对方存在 |
| 前向声明 + 只在 `.cpp` 里 `#include` | 减少编译期依赖 |

一个具体的对比例子：

```cpp
// 紧耦合：Button 直接依赖具体动作
class Button {
public:
    void click() { m_sound.playClick(); }   // 必须知道 Sound 的一切
private:
    Sound m_sound;
};
```

```cpp
// 松耦合：依赖一个回调
class Button {
public:
    void setOnClick(std::function<void()> f) { m_onClick = std::move(f); }
    void click() { if (m_onClick) m_onClick(); }
private:
    std::function<void()> m_onClick;
};
```

第二种写法的好处：

- `Button` **不认识** `Sound`，换成一个网络请求也不用改 `Button`；
- 可以**单独测试** `Button`（传一个空的 lambda 就行）；
- 编译依赖大幅减少（`Button.h` 不再需要 `#include "Sound.h"`）。

### 3.4 内聚（Cohesion）

> Cohesion refers to **the number and diversity of tasks** that a single unit is responsible for.
> If each unit is responsible for **one single logical task**, we say it has **high cohesion**.
> Cohesion applies to **classes and methods**.
> **We aim for high cohesion.**

注意方向：**耦合要低，内聚要高**。这是一对容易记反的词，可以这样记：

- **耦合**是"和别人牵扯多少" → **越少越好**；
- **内聚**是"自己内部多团结" → **越多越好**。

### 3.5 高内聚带来什么

> - **Understand what a class or method does**（一眼看懂它在做什么）
> - **Use descriptive names**（能取一个描述性的名字）
> - **Reuse classes or methods**（容易复用）

第二条是个巧妙的判据：**如果你给一个类/函数起不出一个准确的名字，说明它做了不止一件事。**

比如 `processDataAndSaveAndNotify()` 这种名字，就是内聚低的直接证据。

### 3.6 方法的内聚

> **A method should be responsible for one and only one well defined task.**

```cpp
// 内聚低：一个函数干了三件事
void handleOrder(Order o) {
    // 1. 校验
    // 2. 算钱
    // 3. 发邮件
}
```

```cpp
// 内聚高：三个函数，各自一件事
bool validate(const Order& o);
Money computeTotal(const Order& o);
void notifyCustomer(const Order& o);
```

注意：这不是"函数越短越好"，而是"**一件事**"的定义。`computeTotal` 可以有 30 行，只要它只做"算总价"这一件事。

### 3.7 类的内聚

> **Classes should represent one single, well defined entity.**

判据：**这个类能不能用一个名词准确描述？** 如果可以（`Invoice`、`Patient`、`HttpRequest`），内聚通常没问题；如果只能描述成"XX 管理器""XX 工具类""XXHelper"，往往是把多个实体塞在了一起。

---

## 4. 代码重复（Code duplication）

> Code duplication:
> - **is an indicator of bad design**
> - **makes maintenance harder**
> - **can lead to introduction of errors during maintenance**

重复代码的三个害处层层递进：

1. **它是坏设计的信号**——为什么会有两份一样的逻辑？通常是没有找到正确的抽象；
2. **维护变难**——改一处要记得改另一处；
3. **改漏就出 bug**——而且这种 bug 极难发现（两份代码"看起来都对"）。

### 4.1 第 6 章 DoME 的例子就是标本

`CD` 和 `DVD` 两个类几乎一样，`Database` 里 `addCD`/`addDVD`、两个 `list` 循环全都重复。加一种媒体类型，就要复制一整段。

抽出 `Item` 基类后，重复消失，扩展成本从 O(n) 变成 O(1)。

**这就是"重复代码 → 找到抽象"的完整路径**：不是"看到重复就抽函数"，而是"**看到重复，问它们是不是同一个概念的两种表现**"。

### 4.2 但重复也有"假重复"

警惕一种过度设计：两个函数**长得像但语义不同**，强行合并会引入参数开关：

```cpp
// 过度抽象：一个函数用 bool 控制两种完全不同的行为
void save(Data d, bool asBackup);
```

这种情况下的"去重"反而降低了内聚。判断标准：**它们的"变化原因"是否相同**。如果未来会因为不同原因而修改，就该分开。

---

## 5. 责任驱动设计（Responsibility-Driven Design, RDD）

这是本章的核心方法论。

> **Question: where should we add a new method (which class)?**
> - **Each class should be responsible for manipulating its own data.**
> - **The class that owns the data should be responsible for processing it.**
> - **RDD leads to low coupling.**

### 5.1 判据：数据在哪，方法就在哪

遇到"这个函数该放哪个类"的问题，只看一件事：**它主要操作谁的数据？**

```cpp
// 坏：Printer 去掏 Invoice 的内部数据
class Printer {
public:
    void print(const Invoice& inv) {
        cout << inv.items << inv.total;   // 依赖 Invoice 的内部结构
    }
};
```

```cpp
// 好：Invoice 自己知道自己怎么打印
class Invoice {
public:
    void print(std::ostream& out) const;   // 数据的拥有者负责处理数据
};
```

第二种写法下，`Invoice` 的内部结构变了，`Printer` 一行都不用改——**这就是低耦合**。

### 5.2 一个反例：getter/setter 满天飞

```cpp
class Account {
public:
    double getBalance() const;
    void setBalance(double);     // 谁都能随便改余额？
};
```

一旦暴露 `setBalance`，所有业务规则（不能透支、不能负数）都跑到类外面去了，变成"每个调用者都要记得检查"。这违反了 RDD：**`Account` 拥有余额，就该由它负责维护余额的合法性**。

正确做法是提供**有语义的操作**：

```cpp
class Account {
public:
    void deposit(double amount);
    bool withdraw(double amount);   // 内部检查余额，失败返回 false 或抛异常
    double balance() const;         // 只读
};
```

判断一个类是否"封装良好"的快捷方法：**它的 setter 是不是只做 `x = v`？** 如果是，说明这个类只是个数据袋（data bag），不变量（invariant）无处安放。

### 5.3 局部化变更（Localizing change）

> One aim of reducing coupling and RDD is to **localize change**.
> When a change is needed, **as few classes as possible should be affected**.

这与耦合是同一件事的两面：

- 耦合低 → 变更影响面小 → 变更被"局部化"；
- 局部化 → 改一处、测一处，工作量可控。

### 5.4 前瞻（Thinking ahead）

> When designing a class, we try to **think what changes are likely to be made in the future**.
> **We aim to make those changes easy.**

注意措辞：不是"预测未来会怎么变"，而是"**让可能的变化变容易**"。这两者差别很大：

- 前者是算命（通常算错，导致过度设计）；
- 后者是留出**接缝**（seam）——比如把"可能换实现"的部分抽成接口。

一个务实的判据：**如果你能说出"这个决定以后大概会改"，就在那里留一个抽象；说不出来，就别留。**

---

## 6. 重构（Refactoring）

> When classes are maintained, often code is added.
> Classes and methods tend to **become longer**.
> Every now and then, classes and methods should be **refactored** to maintain cohesion and low coupling.

**重构的定义**：在不改变外部行为的前提下，改善内部结构。

关键在"**不改变外部行为**"——这也是它和"重写"的区别。

### 6.1 重构的黄金规则

> - When refactoring code, **separate the refactoring from making other changes**.
> - **First do the refactoring only, without changing the functionality.**
> - **Test before and after refactoring** to ensure that nothing was broken.

三条合起来是一个"提交纪律"：

| 步骤 | 提交内容 |
| --- | --- |
| 1 | 先跑测试，确认当前是绿的 |
| 2 | **只做重构**，不改功能，提交 |
| 3 | 再跑测试，确认还是绿的 |
| 4 | 然后才做功能变更，提交 |

**为什么必须分开？** 因为如果混在一个提交里，测试红了，你无法判断是"重构改坏了"还是"新功能有 bug"。分开之后，问题范围立刻缩小一半。

### 6.2 常见的重构动作（本课程语境内）

| 坏味道 | 重构 |
| --- | --- |
| 重复代码（DoME 的 CD/DVD） | 提取基类 / 提取函数 |
| 函数过长 | 提取函数（Extract Method） |
| 类做了太多事 | 拆分类（Extract Class） |
| 参数列表过长 | 引入参数对象 |
| 依赖具体类 | 依赖接口 / 引入回调 |
| 一堆 getter/setter | 改成有语义的操作（RDD） |
| 魔法数字 | 命名常量 |

---

## 7. 那些"经典问题"现在能回答了

> Common questions:
> - **How long should a class be?**
> - **How long should a method be?**
>
> **Can now be answered in terms of cohesion and coupling.**

也就是说，"多少行算长"是个假问题。真正的判据是：

> - **A method is too long if it does more than one logical task.**
> - **A class is too complex if it represents more than one logical entity.**

并且课件诚实地补充：

> **Note: these are guidelines —— they still leave much open to the designer.**

**设计没有唯一正确答案**。同样是 200 行的类，有的恰到好处，有的应该拆成五个——取决于它承担了几个"逻辑实体"。

---

## 8. 复习：本章的四句话

> - **Programs are continuously changed.**（程序持续在变）
> - **It is important to make this change possible.**（让变化成为可能才是关键）
> - **Quality of code requires much more than just performing correct at one time.**（"现在跑得对"远不等于"质量好"）
> - **Code must be understandable and maintainable.**（代码必须可读、可维护）

> - **Good quality code avoids duplication, displays high cohesion, low coupling.**
> - **Coding style (commenting, naming, layout, etc.) is also important.**
> - **There is a big difference in the amount of work required to change poorly structured and well structured code.**

注意第二句：**编码风格（注释、命名、排版）也是质量的一部分**。它不是"个人偏好"，因为读你代码的人不是你——风格一致性直接影响理解成本。

---

## 9. 要点自检

1. 耦合与内聚分别衡量什么？各自的目标是高还是低？
2. "If X changes → how much code in Y must be changed?" 这个问句在检验什么？
3. 松耦合带来哪两个具体好处？为什么第一条常被低估？
4. 降低耦合的三种技术手段（callback、消息、接口）共同的思想是什么？
5. "取不出好名字"为什么是内聚低的信号？
6. 责任驱动设计的核心判据是什么？为什么它能带来低耦合？
7. 为什么"一堆 getter/setter"是 RDD 的反面？
8. 重构的三条纪律是什么？为什么重构必须和功能变更分开提交？
9. "一个方法多长算太长"该怎么回答？
10. 什么样的重复代码该消除，什么样的"重复"其实不该合并？

---

## 10. 易错点

- **把"耦合"和"内聚"记反**：耦合要**低**，内聚要**高**。
- **以为"类越小越好"**：判据是"几个逻辑实体"，不是行数。
- **为了去重而强行抽象**：变化原因不同的两段代码，合并反而降低内聚。
- **重构时顺手改功能**：测试红了无法定位问题。
- **只测重构后，不测重构前**：没有基线，等于没测。
- **把 `setX()` 当成封装**：真正的封装是"提供有语义的操作，并守护不变量"。
- **过度前瞻**：为"可能会变"的地方留抽象是对的，但为"也许某天"加三层继承是错的。

---

*上一篇：[[OOP/Chapter 14 Smart Pointers AI精讲|Chapter 14 Smart Pointers AI精讲]]　下一篇：[[OOP/Chapter 16 Miscellaneous Points AI精讲|Chapter 16 Miscellaneous Points AI精讲]]*
