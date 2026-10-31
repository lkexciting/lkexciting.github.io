---
title: Chapter 1 Introduction · AI 精讲
aliases:
  - OOP/notes/Chapter 1 Introduction AI精讲
---
# Chapter 1 Introduction：面向对象程序设计导论

> 对应课件：`1_Introduction_2025.pdf`（50 页）
> 课程：Object-Oriented Programming with C++（Zhaopeng Cui, ZJU）
> 关键词：OOP、Encapsulation、Inheritance、Polymorphism、C vs. C++、hybrid language

---

## 0. 这一章在整门课里的位置

第 1 章不教你写复杂代码，它做三件事：

1. **给出这门课的世界观**：把程序看成"一群对象互相发消息"（objects sending messages），而不是"一串按顺序执行的步骤"。
2. **给出这门课的地图**：把后续 15 章要讲的所有概念先以"行话"（buzzwords）的形式铺一遍，让你之后每次听到都似曾相识。
3. **给出这门课的工具前提**：C++ 是 C 的超集式演化（hybrid language），它同时支持过程式（procedure-oriented）、面向对象（object-oriented）、泛型（generic programming）三种范式。

所以本章的正确读法是：**不要试图一次记住所有名词，而是记住每个名词"解决什么痛点"**。后面每一章都是在把这里的一个 buzzword 展开成几十页。

---

## 1. 什么是面向对象（Object-Oriented）

课件引用了这样一段话：

> computers are not so much machines as they are mind amplification tools and a different kind of expressive medium… Object-oriented programming is part of this movement toward using the computer as an expressive medium.

翻译过来：计算机与其说是机器，不如说是**心智的放大器**和一种**表达媒介**（expressive medium），像写作、绘画、雕塑、动画、拍电影一样。面向对象编程就是"把计算机当作表达媒介"这一潮流的一部分。

这句话不是文艺装饰，它对应一个很实际的设计判断：

- 过程式编程（procedure-oriented）的表达单元是**函数/步骤**，它擅长描述"怎么做"（how）；
- 面向对象编程的表达单元是**对象/责任**（responsibility），它擅长描述"谁负责什么"（who does what）。

当软件规模变大、需求不断变化时，"谁负责什么"比"先做哪一步"更稳定，因为步骤会变、责任分配相对不变。这就是 OOP 在大规模软件开发（programming-in-the-large）中胜出的根本原因。

### 1.1 课件列出的 buzzwords

![OOP 核心行话一览](OOP/images/Chapter%201%20Introduction%20AI%E7%B2%BE%E8%AE%B2/ch1-p04-buzzwords-04.webp)

这张图里红色标出的三个词是 OOP 的三大支柱（three pillars），其余都是围绕它们展开的技术手段：

| 行话 | 中文 | 一句话解释 | 主要出现在 |
| --- | --- | --- | --- |
| Encapsulation | 封装 | 把数据和操作数据的函数捆在一起，并对外隐藏实现细节 | Ch.4 Class、Ch.5 |
| Inheritance | 继承 | 在已有类的基础上扩展出新类，复用接口与实现 | Ch.6 |
| Polymorphism | 多态 | 同一句调用，在不同实际类型上产生不同行为 | Ch.7 |
| responsibility-driven design | 责任驱动设计 | 先问"这个对象该负责什么"，再决定它有什么数据和函数 | Ch.15 |
| iterators | 迭代器 | 泛化的指针，用统一方式遍历不同容器 | Ch.12 |
| overriding | 覆盖/重写 | 派生类重新定义基类的虚函数 | Ch.7 |
| coupling | 耦合 | 模块之间相互依赖的程度，越低越好 | Ch.15 |
| cohesion | 内聚 | 一个模块内部元素的相关程度，越高越好 | Ch.15 |
| template | 模板 | 把类型当作参数，让一份代码适配多种类型 | Ch.11 |
| interface | 接口 | 对外暴露的"契约"，即头文件里声明的那部分 | Ch.4、Ch.7 |
| collection classes | 集合类 | 容器类，如 vector/list/map | Ch.2、Ch.12 |
| mutator methods | 修改器方法 | 会改变对象状态（成员变量）的成员函数 | Ch.5 |

**记忆线索**：封装解决"变化不外泄"，继承解决"复用"，多态解决"统一调用不同实现"，耦合/内聚解决"结构好坏"，模板/迭代器解决"泛型"。

---

## 2. 为什么是 C++

### 2.1 C 语言的优势与不足

课件对 C 的评价非常干脆：

| Strengths（优点） | Weakness（不足） |
| --- | --- |
| 高效（efficient programs） | 类型检查不足（insufficient type checking） |
| 可直接访问机器，适合操作系统与嵌入式（OS / ES） | 对大规模编程支持差（poor support for programming-in-the-large） |
| 灵活（flexible） | 是过程式语言（procedure-oriented programming） |

注意第三点"不足"的措辞：过程式本身不是错，而是**当程序规模超过一个人能装在脑子里的量级时**，纯过程式的组织方式会失控——全局数据满天飞、函数之间靠约定互相依赖、改一处崩一片。

C++ 的设计目标（Goal for C++）就是"两头都要"：

> To combine: flexibility and efficiency of C **+** support for object-oriented programming (from Simula and SmallTalk)

### 2.2 C++ 简史

| 时间 | 事件 |
| --- | --- |
| 1978 | Bjarne Stroustrup 在剑桥做仿真程序，使用 Simula；Simula 支持类（class）、继承（inheritance）和类型检查，但性能差 |
| 1979 | 到 AT&T Bell Labs，开发 "C with classes"（Cpre） |
| 1980 | 具备 C++ 大部分特性，但**还没有虚函数**（virtual functions） |
| 1983 | 加入虚函数，由 Rick Mascitti 命名为 C++ |
| 1985 | 出版《The C++ Programming Language》 |
| 1990 | ANSI/ISO C++ 委员会成立 |
| 1998 | 第一个国际标准 ISO/IEC 14882（即 C++98） |
| 2003/2011/2014/2017/2020 | C++03 / C++11 / C++14 / C++17 / C++20，持续演进 |

一个重要的历史细节：**C++ 的"类"来自 Simula，"效率"来自 C**。它不是凭空发明的语言，而是"给 C 装上 Simula 的抽象能力，同时不允许性能退化"。

### 2.3 C 与 C++ 的关系

![C 与 C++ 的关系：C++ 包含 C 并向外扩展](OOP/images/Chapter%201%20Introduction%20AI%E7%B2%BE%E8%AE%B2/ch1-p47-c-vs-cpp-47.webp)

课件用两个相交的椭圆表达这层关系：

- **C++ builds on C**：C++ 的语法、指针、数组、结构体、预处理器几乎全部继承自 C，绝大多数 C 程序可以直接用 C++ 编译器编译。
- **Knowledge of C helps you in C++**：会 C 是巨大优势。
- **C++ supports more styles of programming**：它不强迫你面向对象，"hybrid"（混血）是它的自我定位。
- **C++ provides more features**：见下表。

但课件紧接着强调一句很重要的话：

> C++ can be viewed as a "better" C（C++ => C = C + 1）；**but … C++ is not C**。Focus on C++ as a language in its own right.

意思是：**不要把 C++ 当作"C 加一点语法糖"来学**。很多 C 的习惯在 C++ 里是有害的（例如用 `malloc/free` 管理对象、用裸指针表达所有权、用宏代替 inline 函数）。这门课的大部分内容，本质上就是"改掉 C 的思维习惯"。

### 2.4 C++ 相对 C 的具体改进

| 类别 | 特性 |
| --- | --- |
| 抽象 | data abstraction（数据抽象）、access control（访问控制） |
| 生命周期 | initialization & cleanup（初始化与清理，即构造/析构） |
| 函数 | function overloading（函数重载）、inline functions（内联函数）、name control（名字控制/命名空间） |
| 引用 | references（引用） |
| 运算符 | operator overloading（运算符重载） |
| 内存 | 更安全、更强大的内存管理（new/delete、智能指针） |
| I/O | streams（流式 I/O） |
| 常量 | const（C99 才引入，C++ 更早且语义更强） |
| 范式 | 支持 OOP、templates（模板）、exception handling（异常处理） |
| 库 | 更丰富的库，尤其是 STL |

---

## 3. 第一个 C++ 程序与开发环境

```cpp
#include <iostream>
using namespace std;

int main()
{
    cout << "Hello, World! I am " << 18
         << " Today!" << endl;

    return 0;
}
```

读输入的版本：

```cpp
#include <iostream>
using namespace std;

int main()
{
    cout << "Enter a decimal number: ";

    int number;
    cin >> number;

    cout << "The number you entered is " << number << "." << endl;

    return 0;
}
```

几个值得在这里就讲清的点：

1. **`#include <iostream>` 是预处理指令**，不是语句。它在编译前把 `iostream` 头文件的内容原地"粘贴"进来，这解释了后面 Ch.4 讲的"编译单元（compile unit）"概念。
2. **`<<` 是运算符重载**（operator overloading）的典型例子：`cout << x` 之所以能工作，是因为 `operator<<` 被重载成了"向流中插入"的意思。Ch.9 会把这件事彻底讲透。
3. **`endl` 不只是换行**，它还 flush（刷新）缓冲区；只想换行用 `'\n'` 更快。
4. **`return 0` 表示程序正常结束**，操作系统据此判断成败；异常退出/返回非 0 会被上层脚本视为失败。

开发环境（Development Environment）：

- Windows：Visual Studio
- Linux / macOS：`g++`、`clang` 等编译器 + VS Code 等编辑器
- 原则：任何"良好支持 C++ 标准"的编译器都可以，不要依赖某个 IDE 的私货扩展。

---

## 4. 课程信息（Assessment 与资源）

| 项目 | 占比 | 说明 |
| --- | --- | --- |
| Lab（含课堂小测 in-class quiz） | 50% | 第 2、4、6、8、10、12（14、16）周布置；线上提交、人工批改；截止时间为第 3、5、7、9、11、13、16 周周六 24:00；**每迟一天扣满分 10%** |
| Final exam | 50% | 在 PTA 平台上机考 |

资源：

- 课件：https://course.zju.edu.cn（学在浙大）
- 作业：https://pintia.cn（PTA），"面向对象程序设计 2025-2026 秋冬习题集"
- 参考书：*Thinking in C++*（Bruce Eckel，2nd ed., Vol.1&2）、*C++ Primer*（5th ed.）；进阶：*The C++ Programming Language*、*Effective C++*、*Inside the C++ Object Model*、*C++ Templates*
- 在线：https://cppreference.com（查标准库最准）、https://isocpp.org/、CppCon（YouTube）

学术诚信（Academic honesty）：作业期间可以互相"给提示、讲解释"，**严禁抄代码**。

邮件规范：标题以 `[OOP]` 开头，正文写明姓名与学号，纯文本邮件（不要背景、音乐、彩色字体）。

---

## 5. 本章要点自检

1. 用一句话说明 OOP 与过程式编程在"表达单元"上的区别。
2. 三大支柱分别解决什么问题？（封装=隐藏变化；继承=复用；多态=统一接口多样实现）
3. 为什么说 C++ 是 hybrid language？它同时支持哪三种范式？
4. C 的三个不足分别对应 C++ 的哪些特性？（类型检查不足 → 模板/强类型与 const；大规模编程差 → 类、命名空间、头文件契约；过程式 → OOP）
5. `cout <<` 背后用到了哪个 C++ 机制？

---

## 6. 易错点与延伸

- **"C++ 就是 C 加类"是错的**。C++ 的引用、const 语义、RAII、模板、异常都与 C 有本质差异，混用 C 风格（malloc/free、裸 new/delete、宏）会抵消 C++ 的安全收益。
- **"面向对象就是写 class"是错的**。写一堆只有 getter/setter 的类，本质仍是过程式——只是把 struct 换了个关键字。判断标准是**责任分配**（responsibility-driven），这在 Ch.15 会展开。
- **性能不是 OOP 的敌人**。Stroustrup 的设计前提就是"零开销抽象"（zero-overhead abstraction）：不用虚函数就不付虚函数的代价。
- 课件也诚实地给了批评链接（C++ 与 OOP 的 criticism）。学这门课不是学"信仰"，而是学"什么时候该用哪把锤子"。

---

*下一篇：[[OOP/Chapter 2 Using Objects AI精讲|Chapter 2 Using Objects AI精讲]]*
