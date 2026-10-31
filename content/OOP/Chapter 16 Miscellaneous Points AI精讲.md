---
title: Chapter 16 Miscellaneous Points · AI 精讲
aliases:
  - OOP/notes/Chapter 16 Miscellaneous Points AI精讲
---
# Chapter 16 Miscellaneous Points：零散要点

> 对应课件：`16.Miscellaneous_Points_2025.pdf`（58 页）
> 关键词：named casts、multiple inheritance、virtual base、namespace、visibility vs accessibility、static/dynamic polymorphism、typedef、cv-qualifier、`volatile`

---

## 0. 这一章的结构

课件名字叫 "Miscellaneous Points"（零散要点），共 58 页，包含四块互不相干的内容：

1. **命名转换（named casts）** —— C 风格转换的问题与四种替代；
2. **多重继承（multiple inheritance, MI）** —— 对象布局、菱形问题、虚基类；
3. **命名空间（namespace）** —— 名字控制、using、歧义；
4. **其它要点** —— 可见性 vs 可访问性、静态/动态多态、typedef、cv 限定符。

看似零散，其实是"把你学过的东西补上缺失的边角"：每种 cast 的语义、MI 的代价、namespace 的规则、`volatile` 的意义。

---

## 1. 命名转换（Named casts）

### 1.1 C 风格转换的两个问题

> The C-style cast is:
> - **dangerous because it can do (logically different) conversion**（它可能做逻辑上完全不同的转换）
> - **not search-friendly**（搜不到，代码审查时容易漏掉）

所谓"逻辑上不同"，是指 `(T)x` 可能在做**四种完全不同的事**之一：

| C 风格转换实际做的事 | 对应的命名转换 |
| --- | --- |
| 数值转换（`double` → `int`） | `static_cast` |
| 去掉 `const` | `const_cast` |
| 指针重解释（`int*` → `double*`） | `reinterpret_cast` |
| 继承体系内转型 | `static_cast` / `dynamic_cast` |

写 `(int)d` 时你看不出到底是哪一种，读代码的人也不知道你想干什么。

### 1.2 四种 cast 的对比（用同一个例子串起来）

课件用三个例子把四种 cast 讲得非常清楚。

**例一：数值转换**

```cpp
double d = 7.1;
int a;

a = d;                    // implicit（隐式）
a = (int)d;               // explicit，但含义模糊
a = static_cast<int>(d);  // exact meaning：我要做数值截断
```

**例二：指针重解释**

```cpp
int a = 7;
double* p;

p = (double*)&a;                  // ok（但 a 根本不是 double！）
p = static_cast<double*>(&a);     // error：类型无关，static_cast 拒绝
p = reinterpret_cast<double*>(&a);// ok：I really mean it（我就是要这么干）
```

这里体现了 `static_cast` 的价值：**它会拒绝不合理的转换**。`int*` → `double*` 在 `static_cast` 看来毫无意义（两者没有继承关系、不是数值），所以直接报错。而 `reinterpret_cast` 说"我知道我在做什么，别拦我"。

**例三：去 const**

```cpp
const int c = 7;
int* q;

q = &c;                     // error：不能把 const 地址给非 const 指针
q = (int*)&c;               // ok（但 *q = 2 真的允许吗？）
q = static_cast<int*>(&c);  // error：static_cast 不能移除 const
q = const_cast<int*>(&c);   // I really mean it
```

课件的括号注释是个警告：**语法上转换成功 ≠ 行为上合法**。如果 `c` 是真正的 const 对象（可能放在只读段），通过 `q` 写入是**未定义行为**。

### 1.3 向下转型：`static_cast` vs `dynamic_cast`

```cpp
struct A { virtual void f() {} };
struct B : public A {};
struct C : public A {};

A* pa = new B;
C* pc = static_cast<C*>(pa);    // OK: but *pa is B!
```

`static_cast` **不检查**，它只是"按偏移量调整指针"，于是你得到一个"指向 B 对象、但被当作 C 用"的指针。调用 `pc` 的成员函数 → 未定义行为。

```cpp
C* pc = dynamic_cast<C*>(pa);   // return nullptr
```

`dynamic_cast` 会**在运行期检查真实类型**，发现 `*pa` 是 `B` 不是 `C`，于是返回 `nullptr`。

**前提条件（重点）**：

```cpp
struct A { /* virtual void f() {} */ };   // 没有虚函数！
A* pa = new B;
C* pc = dynamic_cast<C*>(pa);             // Error!
```

**`dynamic_cast` 要求源类型是多态类型（至少有一个虚函数）**，因为它依赖 vtable 里的 RTTI 信息。没有虚函数 → 编译错误。

还有一条：

```cpp
struct D {};
D* pd = static_cast<D*>(pa);   // Error!
```

`static_cast` 要求两个类型之间**有继承关系**（或有转换路径）。`A*` 到 `D*` 毫无关系，直接编译错误——这是 `static_cast` 比 C 风格转换安全的地方。

### 1.4 四者总结

| cast | 适用 | 失败时 |
| --- | --- | --- |
| `static_cast` | 数值转换、有继承关系的指针/引用转换（**向上安全，向下不检查**） | 编译错误（类型无关时） |
| `dynamic_cast` | 多态类型的安全向下转型/交叉转型 | 指针返回 `nullptr`，引用抛 `bad_cast` |
| `const_cast` | 增删 `const` / `volatile` | 不会失败（但可能未定义行为） |
| `reinterpret_cast` | 指针 ↔ 整数、无关指针互转 | 不会失败（结果几乎是实现定义） |

**实践建议**：能用 `static_cast` 就别用 `reinterpret_cast`；涉及向下转型就用 `dynamic_cast`；`const_cast` 只在你确定"原对象本来不是 const"时使用。

---

## 2. 多重继承（Multiple Inheritance）

### 2.1 为什么需要 MI

现实中的类型经常"同时是两种东西"：

```
                    Employee
        ┌───────────────┼───────────────┐
   Secretary          MTS          Administrator
        │               │
     TempSec        Consultant
```

- **MTS**（Member of Technical Staff，技术序列员工）继承 `Employee`；
- **Temporary**（临时人员，属于某个外包公司）**不是** `Employee`；
- **Consultant**（顾问）**既是 MTS 又是 Temporary**。

```cpp
class Employee {
protected:
    String name;
    EmpID  id;
};

class MTS : public Employee {
protected:
    Degrees degree_info;
};

class Temporary {
protected:
    Company employer;
};

class Consultant : public MTS, public Temporary {
    // ...
};
```

> **Consultant picks up the attributes of both MTS and Temporary:** `name`、`id`、`degree_info`、`employer`.

这是 MI 的正当用途：**把两个独立的"能力/身份"组合到一个类型里**。

### 2.2 MI 让对象布局变复杂

![MI 的对象布局：Employee 子对象被复制了两份](OOP/images/Chapter%2016%20Miscellaneous%20Points%20AI%E7%B2%BE%E8%AE%B2/ch16-p14-14.webp)

看图：`Consultant` 对象里包含**两个 `Employee` 子对象**——一个来自 `MTS` 分支，一个来自 `Temporary` 分支（如果 `Temporary` 也继承 `Employee`）。

这就是 MI 的**第一个代价**：**重复继承（replicated bases）**。

### 2.3 重复基类的问题

```cpp
struct B1 { int m_i; };
struct D1 : public B1 {};
struct D2 : public B1 {};
struct M  : public D1, public D2 {};

int main() {
    M m;                          // OK
    B1* p = &m;                   // ERROR: which B1???
    B1* p1 = static_cast<D1*>(&m); // OK
    B1* p2 = static_cast<D2*>(&m); // OK
}
```

`M` 里有两个 `B1` 子对象，`&m` 到 `B1*` 的转换有**二义性**，编译器拒绝。

```cpp
m.m_i++;    // ERROR: D1::B1.m_i or D2::B1.m_i?
```

访问成员也有二义性。这就是著名的**菱形继承问题**（diamond problem）：

```
        B1
       /  \
      D1  D2
       \  /
        M
```

课件给了一个客观的判断：

> Normally replicated bases **aren't a problem**（通常不是问题，因为 D1、D2 用 B1 是实现细节）。
> Replication becomes a problem **if replicated data makes for confusing logic**（只有当重复的数据导致逻辑混乱时才是问题）。

关键句：**"只有当重复的数据导致逻辑混乱时才是问题"**。如果 `B1` 只是无数据的接口，重复完全无害——这一点在第 2.6 节会用到。

### 2.4 "Vanilla MI"：`iostream` 的例子

C++ 标准库的 `iostream` 就是**普通（vanilla）多重继承**的产物：

```
        ios
     (streambuf)
    /            \
istream        ostream
 (streambuf)   (streambuf)
    \            /
      iostream
```

- `istream` 有自己的 `streambuf`（输入缓冲）；
- `ostream` 有自己的 `streambuf`（输出缓冲）；
- `iostream` 两者都要——**这正是它想要的**！

> - Members are **duplicated**
> - Derived class has access to **full copies** of each base class
> - **This can be useful!**
>   - Multiple links for lists
>   - **Multiple streambufs for input and output**

所以"重复基类"并不总是坏事：**双向链表节点需要两个 `next` 指针**（一个指向前、一个指向后），`iostream` 需要两个缓冲区。这种"我就想要两份"的场景，普通 MI 是正确的。

### 2.5 虚基类：共享而非复制

但如果重复是**不想要的**呢？C++ 提供**虚基类（virtual base class）**：

```cpp
struct B1 { int m_i; };
struct D1 : virtual public B1 {};
struct D2 : virtual public B1 {};
struct M  : public D1, public D2 {};

int main() {
    M m;            // OK
    m.m_i++;        // OK, there is only one B1 in m
    B1* p = new M;  // OK，不再有二义性
}
```

`virtual public B1` 的意思是"**如果有多条路径到达 B1，只保留一份**"。

![虚基类：istream/ostream 共享同一个 streambuf](OOP/images/Chapter%2016%20Miscellaneous%20Points%20AI%E7%B2%BE%E8%AE%B2/ch16-p23-23.webp)

课件对 "virtual" 这个词的解释非常到位：

> - Base classes can be virtual —— **To C++ people, "virtual" means "indirect"**（对 C++ 程序员来说，virtual 意味着"间接"）
> - **Virtual member functions** have dynamic binding —— they use **pointer indirection**（间接调用）
> - **Virtual base classes** are represented **indirectly** —— they use **pointer indirection**（间接定位）

两处 `virtual` 语义不同，但机制相似：**都靠指针绕一下**。

代价：

> - **Use of virtual base imposes some runtime and space overhead.**（运行期与空间开销）
> - If replication isn't a problem then you don't need to make bases virtual.（重复不是问题就别虚继承）
> - **Abstract base classes (that hold no data except for a vptr) can be replicated with no problem —— virtual base can be eliminated.**（纯接口类可以随便重复，不需要虚基类）

最后一条极其重要，是 MI 的"最佳实践"：

> **如果基类没有数据（只有纯虚函数），重复它完全无害，根本不需要 virtual 继承。**

因为两个空的 `vptr` 各自指向各自的 vtable，逻辑上没有任何冲突。

### 2.6 MI 的复杂性清单

> - **Name conflicts** —— **Dominance rule**（支配规则）
> - **Order of construction** —— **Who constructs virtual base?**（谁负责构造虚基类？）
> - **Virtual bases not declared when you need them**（需要时才发现没声明 virtual）
> - **Code in virtual bases called more than once**（虚基类的代码可能被调用多次）
> - **Compilers are still iffy**（编译器支持仍有差异）
> - **Moral: Use sparingly. Avoid diamond patterns.**（谨慎使用，避免菱形）

"菱形"的经典图形：

```
        A
       / \
      B   C
       \ /
        D
```

课件对菱形的评价很直接：**expensive（昂贵）、hard（困难）**。

### 2.7 构造顺序的问题

"Who constructs virtual base?"——这是 MI 里最反直觉的规则：

**虚基类由"最派生的类"负责构造**，而不是由它的直接子类构造。

```cpp
struct A { A(int); };
struct B : virtual A { B() : A(1) {} };   // 这里的 A(1) 可能被忽略！
struct C : virtual A { C() : A(2) {} };
struct D : B, C {
    D() : A(3), B(), C() {}   // 最终由 D 决定用 A(3)
};
```

因为 `A` 只有一份，只能被构造一次，所以由 `D`（最派生）说了算。`B`、`C` 里写的 `A(1)`、`A(2)` 在 `D` 被构造时**被忽略**。

这条规则很容易让人写出"我明明传了参数，为什么没生效"的代码。

### 2.8 MI 的使用建议

> **TIPS for MI: In general, SAY NO.**

但有一个例外被反复认可：

> **Protocol / Interface classes**（协议类/接口类）

定义（与 Ch.7 相同）：

- 所有非静态成员函数都是**纯虚**（析构除外）；
- **虚析构函数，函数体为空**；
- **没有任何非静态成员变量**（自己定义的、继承来的都没有）；
- 可以包含静态成员。

```cpp
class CDevice {
public:
    virtual ~CDevice() {}
    virtual int read(...)  = 0;
    virtual int write(...) = 0;
    virtual int open(...)  = 0;
    virtual int close(...) = 0;
    virtual int ioctl(...) = 0;
};
```

于是"一个类实现多个接口"就成了 MI 的**唯一被广泛接受的用法**：

```cpp
class FileLogger : public ILoggable, public ICloseable, public ISerializable {
    // 每个基类都是纯接口，没有数据 → 无重复、无菱形问题
};
```

**总结 MI 的判断标准**：

| 场景 | 结论 |
| --- | --- |
| 需要"同时是两种具体类型"（有数据） | **避免**，改用组合 |
| 需要实现多个**纯接口** | **推荐**（Java/C# 的 `interface` 就是把这个用法语言化了） |
| 需要两份同名数据（如两个 streambuf） | 可以用普通 MI（但组合也能做到） |
| 出现菱形 | 尽量重构，实在不行用 `virtual` 继承 |

---

## 3. 命名空间（Namespace）

### 3.1 问题：名字冲突

```cpp
// old1.h
void f();
void g();

// old2.h
void f();     // 冲突！
void g();     // 冲突！
```

两个库都在全局作用域放了 `f`/`g`，同时包含就链接错误。

其实我们早就在用"名字控制"了——**类作用域**：

```cpp
class Marbles {
    enum Colors { Blue, Red, Green };
};

class Candy {
    enum Colors { Blue, Red, Green };   // 不冲突，因为在不同类里
};
```

命名空间就是把这种"作用域隔离"**扩展到全局**：

```cpp
// old1.h
namespace old1 { void f(); void g(); }

// old2.h
namespace old2 { void f(); void g(); }
```

### 3.2 命名空间是什么

> - **Expresses a logical grouping** of classes, functions, variables, etc.
> - **A namespace is a scope just like a class**（命名空间就是一个作用域，和类一样）
> - **Preferred when name encapsulation is needed**

```cpp
namespace Math {
    double abs(double);
    double sqrt(double);
    int trunc(double);
}   // Note: No terminating semicolon!（注意：末尾没有分号！）
```

那个注释是常见的笔误提醒：`namespace X { ... }` **不需要分号**，而 `class X { ... };` **需要**。

### 3.3 定义与实现

```cpp
// MyLib.h
namespace MyLib {
    void foo();
    class Cat {
    public:
        void Meow();
    };
}
```

```cpp
// MyLib.cpp
#include "MyLib.h"

void MyLib::foo() { cout << "foo\n"; }
void MyLib::Cat::Meow() { cout << "meow\n"; }
```

注意 `MyLib::Cat::Meow`——**命名空间 + 类名 + 函数名**，`::` 可以串联。这和 Ch.4 的 `Point::print`、Ch.11 的 `Vector<T>::push_back` 是同一套机制。

（另外还有一种写法：在 `.cpp` 里再开一次 `namespace MyLib { ... }` 把定义包起来。两种都合法。）

### 3.4 三种使用方式

**方式一：完全限定（最啰嗦，最清楚）**

```cpp
int main() {
    MyLib::foo();
    MyLib::Cat c;
    c.Meow();
}
```

> Can be tedious and distracting.（啰嗦，分散注意力）

**方式二：using-declaration（引入单个名字）**

```cpp
int main() {
    using MyLib::foo;
    using MyLib::Cat;
    foo();
    Cat c;
    c.Meow();
}
```

> Introduces a **local synonym** for name. **States in one place where a name comes from.** Eliminates redundant scope qualification.

特点：**一次只引入一个名字**，来源一目了然。这是**推荐的默认做法**。

**方式三：using-directive（引入整个命名空间）**

```cpp
int main() {
    using namespace std;
    using namespace MyLib;
    foo();
    Cat c;
    c.Meow();
    cout << "hello" << endl;
}
```

> Makes **all names** from a namespace available. **Can be used as a notational convenience.**

特点：省事，但**把整个命名空间倒进当前作用域**，风险大。

**关键区别**：

| | using-declaration | using-directive |
| --- | --- | --- |
| 写法 | `using MyLib::foo;` | `using namespace MyLib;` |
| 引入范围 | 一个名字 | 全部名字 |
| 冲突风险 | 低 | 高 |
| 推荐场景 | 函数内局部使用 | 只在 `.cpp` 顶部，不放在头文件里 |

**一条铁律**：**永远不要在头文件的全局作用域写 `using namespace std;`**。因为头文件会被无数 `.cpp` 包含，等于你替所有人做了这个决定，而且会在别人代码里制造歧义。

### 3.5 歧义（Ambiguities）

> - Using-directives **only make the names available**.
> - **Ambiguities arise only when you make calls.**（只有真正调用时才产生歧义）
> - **Use scope resolution to resolve.**

```cpp
namespace XLib { void x(); void y(); }
namespace YLib { void y(); void z(); }

int main() {
    using namespace XLib;
    using namespace YLib;
    x();       // OK
    y();       // Error: ambiguous（两个 y 都可见）
    XLib::y(); // OK, resolves to XLib
    z();       // OK
}
```

注意第一句的重要性：`using namespace` 本身**不报错**，报错发生在你**使用有冲突的名字**时。这让问题定位变得困难（错误出现在使用点，而不是引入点）。

### 3.6 别名（Aliases）

> - Namespace names that are **too short may clash**
> - Names that are **too long are hard to work with**
> - Use **aliasing** to create workable names
> - **Aliasing can be used to version libraries**

```cpp
namespace supercalifragilistic {
    void f();
}

namespace short_ns = supercalifragilistic;
short_ns::f();
```

第二个用途很实用：**库版本切换**。

```cpp
namespace lib_v2 = mylib::v2;
// 改版本只需改这一行
```

### 3.7 组合（Composition）

> Compose **new namespaces** using names from other ones.
> - **Using-declarations can resolve potential clashes.**
> - **Explicitly defined functions take precedence.**

```cpp
namespace first  { void x(); void y(); }
namespace second { void y(); void z(); }

namespace mine {
    using namespace first;
    using namespace second;
    using first::y;        // 解决冲突：明确指定用 first 的 y
    void mystuff();
}

int main() {
    mine::x();
    mine::y();       // call first::y()
    mine::mystuff();
}
```

规律：**using-declaration 比 using-directive 更"强"**——它把 `first::y` 变成一个"普通成员"，直接遮挡了 `second::y`，于是不再歧义。

### 3.8 选择性组合（Selection）

> Compose namespaces by **selecting a few features** from other namespaces. **Choose only the names you want rather than all.**

```cpp
namespace mine {
    using orig::Cat;    // 只要 Cat 这一个类
    void x();
    void y();
}
```

好处（课件原话）：**"Changes to `orig` declaration become reflected in `mine`."** —— `orig::Cat` 改进后，`mine::Cat` 自动跟着改（因为它是同一个东西，不是复制）。

### 3.9 命名空间是"开放的"

> **Namespaces are open.**
> Multiple namespace declarations **add to the same namespace**.
> Namespace can be **distributed across multiple files**.

```cpp
// header1.h
namespace X { void f(); }

// header2.h
namespace X { void g(); }   // X 现在有 f() 和 g()
```

这条性质非常重要：正是因为它"开放"，标准库才能把 `std` 分散在几十个头文件里；也正是因为它开放，你**不能**通过"重新声明同名命名空间"来覆盖别人的东西（只会不断往里添加）。

---

## 4. 其它要点

### 4.1 可见性 vs 可访问性（Visibility vs Accessibility）

这是两个**经常被混淆**的概念，课件区分得很清楚。

| | Visibility（可见性） | Accessibility（可访问性） |
| --- | --- | --- |
| 定义 | 编译器在给定作用域内**是否认得**这个成员 | 可见的成员**是否真的能被使用** |
| 由什么决定 | 声明在哪个作用域 | 访问说明符（`public`/`protected`/`private`） |
| 能否改变 | **一旦在作用域内声明，无法隐藏** | 由访问控制决定 |

> A member might be **visible** (the compiler knows it exists) but **not accessible** (the compiler will prevent you from using it).

例子：

```cpp
class A {
private:
    int secret;
};

int main() {
    A a;
    a.secret = 1;   // 错误信息不是"没有 secret"，而是"secret 是 private"
}
```

编译器**看得见** `secret`（它在 `A` 的作用域里，且是 `A` 的成员），但**不允许你用**。这就是"可见但不可访问"。

理解这个区别的价值：**编译错误的措辞会不一样**。

- "no member named 'x'" → **不可见**（名字不存在/不在作用域）；
- "'x' is private within this context" → **可见但不可访问**。

### 4.2 访问控制复习

| 成员 | 谁能访问 |
| --- | --- |
| `public` | 所有客户 |
| `protected` | 自己 + 派生类（+ friends） |
| `private` | 只有自己（+ friends） |

| 继承方式 | 效果 |
| --- | --- |
| `public` | 保持原样 |
| `protected` | 最多到 protected |
| `private` | 一律变 private |

（详见 Ch.6 的完整表格。）

### 4.3 静态多态 vs 动态多态

> **Static polymorphism**（编译期多态）：通过**函数重载**、**模板**（函数模板/类模板）实现。
> 之所以叫 "static"，是因为"调用哪个函数"的决定在**编译期**做出。
>
> **Dynamic polymorphism**（运行期多态）：通过**继承** + **虚函数**实现。
> 之所以叫 "dynamic"，是因为"调用哪个函数"推迟到**运行期**。

| | 静态多态 | 动态多态 |
| --- | --- | --- |
| 机制 | 重载、模板、CRTP | 继承 + `virtual` |
| 决定时机 | 编译期 | 运行期 |
| 开销 | 零 | vptr + 间接跳转 |
| 能否内联 | 能 | 不能 |
| 灵活性 | 编译期固定 | 运行期可换 |
| 代码量 | 每种类型一份 | 一份 |

**选择原则**：编译期能定的，用静态多态（更快）；需要运行期替换实现的，用动态多态。

### 4.4 运算符重载的三种实现方式（复习）

> - **Member function**（成员函数）
> - **Friend function**（友元函数）
> - **Non-member function**（非成员函数）

能重载的运算符清单（复习 Ch.9）：

```
+ - * / % ^ & | ~
= < > += -= *= /= %=
^= &= |= << >> >>= <<= ==
!= <= >= ! && || ++ --
, ->* -> () []
operator new   operator delete
operator new[] operator delete[]
```

不能重载的：

```
.  .*  ::  ?:
sizeof  typeid
static_cast  dynamic_cast  const_cast  reinterpret_cast
```

### 4.5 不能用 friend 重载的五个运算符

这一条是考点，值得单独记：

> **Among the in-built operators which cannot be overloaded using the friend function but can be overloaded by member functions:**
> - Assignment Operator `=`
> - Function call Operator `()`
> - Subscript Operator `[]`
> - Arrow Operator `->`
> - Pointer-to-member access Operator via pointer `->*`

原因（Ch.9 讲过）：这五个**必须作用于对象本身**，语言规定只能作为成员函数。用 friend 写会编译错误。

记忆：**`= ( ) [ ] -> ->*`** —— "赋值、调用、下标、箭头、成员指针箭头"。

### 4.6 typedef

> Annoying to type long names.

```cpp
map<Name, list<PhoneNum>> phonebook;
map<Name, list<PhoneNum>>::iterator finger;   // 又长又重复
```

```cpp
typedef map<Name, list<PhoneNum>> PB;
PB phonebook;
PB::iterator finger;
```

好处：

- **读起来清楚**；
- **Easy to change implementation**（改实现只改一处：把 `list` 换成 `vector` 只动 typedef 那一行）。

C++11 的两种现代写法：

```cpp
using PB = map<Name, std::list<PhoneNum>>;   // 别名声明，比 typedef 更好读
auto finger = phonebook.begin();             // 让编译器推导
```

`using` 相比 `typedef` 的优势：语法顺序直观（名字在左、类型在右），而且**能用于模板别名**（`template <class T> using Vec = std::vector<T>;`）。

### 4.7 把自己的类放进 STL 容器

> Might need:
> - **Assignment Operator `operator=()`**
> - **Default Constructor**

为什么？因为容器要能：

- 默认构造元素（`vector<T> v(n)`）；
- 赋值/移动元素（`insert`、`erase`、扩容）。

**对于有序容器（`set`、`map`）还需要：**

> - **Need less-than operator: `operator<()`**
> - Some types have this by default: `int`, `char`, `string`
> - Some do not: **`char*`**

`char*` 的 `<` 比较的是**指针地址**，不是字符串内容！这就是为什么 `map<char*, int>` 几乎总是错的——它按地址排序，而不是按字典序。

正确做法（课件的例子）：

```cpp
struct full_name {
    char* first;
    char* last;
    bool operator<(full_name& a) {
        return strcmp(first, a.first) < 0;
    }
};

map<full_name, int> phonebook;
```

补充两点：

1. `operator<` 应该声明为 `const` 成员函数：`bool operator<(const full_name& a) const;`
2. 更简单的办法是**用 `std::string` 而不是 `char*`**，因为 `std::string` 的 `<` 已经是字典序。

### 4.8 cv-qualifier-list

> It refers to the list of **type qualifiers** that can be applied to a type.
> **"cv" stands for "const" and "volatile"**, which are the two type qualifiers.

#### `volatile`

```cpp
volatile int flag = 0;   // flag 可能被硬件或其他线程修改

void func() {
    while (flag == 0) {
        // 没有 volatile 时，编译器可能把这个循环优化成死循环；
        // volatile 告诉编译器每次都从内存重新读 flag 的值
    }
}
```

`volatile` 的语义：**每次访问都必须真正读写内存，不能缓存到寄存器，不能优化掉**。

典型用途：

- **内存映射 I/O**（硬件寄存器）；
- **信号处理函数**修改的变量；
- 某些嵌入式场景。

**重要澄清**：**`volatile` 不解决多线程同步问题**。它不保证原子性、不保证内存序。多线程请用 `std::atomic` 或互斥量。

#### cv-qualifier 作用于成员函数

> A cv-qualifier-list applied to a class method **modifies the `this` pointer**, which points to the object the method is being called on.

```cpp
void myMethod() const;
// 等价于
void myMethod(const ClassType* this);
```

课件给出的完整形式：

```cpp
[cv-qualifier-list] classType * const this
```

拆解：

- `classType * const this` —— `this` 本身永远是 `const` 指针（不能改指向）；
- 前面的 `[cv-qualifier-list]` —— 修饰**指向的对象**（`const` 表示不能改对象）。

所以：

| 成员函数声明 | `this` 的类型 | 能改对象吗 |
| --- | --- | --- |
| `void f()` | `T* const` | 能 |
| `void f() const` | `const T* const` | 不能 |
| `void f() volatile` | `volatile T* const` | 能（但访问都是 volatile 的） |
| `void f() const volatile` | `const volatile T* const` | 不能 |

这就是 Ch.5 讲的"const 成员函数不能改成员、不能调用非 const 成员函数"的**根本原因**：`this` 变成了指向 const 的指针。

---

## 5. 要点自检

1. C 风格转换的两个问题是什么？四种命名转换分别对应它可能做的哪件事？
2. 为什么 `static_cast<double*>(&a)`（`a` 是 `int`）会报错？
3. `dynamic_cast` 的前提条件是什么？失败时返回什么？
4. 多重继承的对象布局会带来什么问题？什么时候"重复"反而是想要的？
5. 虚基类解决什么问题？代价是什么？
6. 为什么"纯接口类可以随便重复，不需要 virtual 继承"？
7. 虚基类由谁负责构造？
8. `using MyLib::foo;` 与 `using namespace MyLib;` 的本质区别？
9. using-declaration 与 using-directive 谁更强？为什么？
10. 可见性与可访问性的区别？编译错误的措辞如何反映它？
11. 哪五个运算符不能用 friend 重载？
12. `map<char*, int>` 为什么几乎总是错的？
13. `volatile` 保证什么？不保证什么？
14. `void f() const` 里 `this` 的完整类型是什么？

---

## 6. 易错点

- **用 `const_cast` 改真正的 const 对象** → 未定义行为（可能在只读段）。
- **`static_cast` 做向下转型** → 不检查，得到"类型错误"的指针。
- **`dynamic_cast` 用在没有虚函数的类上** → 编译错误。
- **`namespace X { ... };` 多加一个分号** → 虽然多数编译器容忍，但不规范。
- **在头文件里 `using namespace std;`** → 污染所有包含它的文件。
- **以为 `using namespace` 立刻报错** → 只有真正调用冲突名字时才报。
- **`map<char*, int>` 按地址排序** → 用 `std::string` 或自定义 `operator<`。
- **以为 `volatile` 能替代互斥量** → 它只禁止优化，不保证原子性与可见性。
- **虚基类构造函数参数"没生效"** → 由最派生类负责，中间层的参数被忽略。

---

## 7. 全课程回顾（16 章的一张地图）

| 主题 | 章节 | 一句话 |
| --- | --- | --- |
| 导论 | 1 | OOP 以"对象+消息"代替"步骤"，C++ 是混合范式语言 |
| 使用对象 | 2 | 先用好 `string`/STL，再学写类 |
| 内存模型 | 3 | 全局/栈/堆、引用、`new`/`delete`、`const` |
| 类 | 4 | 数据+操作、接口=契约、编译单元与头文件 |
| 交互与构造 | 5 | 消息、构造/析构、初始化列表、`this`、`inline` |
| 组合与继承 | 6 | has-a 用组合，is-a 用继承；名字隐藏 |
| 多态 | 7 | vptr/vtable、虚析构、抽象类、接口类 |
| 拷贝构造 | 8 | 浅拷贝 vs 深拷贝、Rule of Three、`static` |
| 运算符重载 | 9 | 另一种函数调用、成员 vs 自由函数、四种 cast |
| 流 | 10 | 插入器/提取器/操纵器，链式调用 |
| 模板 | 11 | 类型作为参数、实例化、CRTP |
| 迭代器 | 12 | 算法与容器之间的胶水、traits |
| 异常 | 13 | 栈展开、RAII、异常安全 |
| 智能指针 | 14 | 引用计数、envelope/letter、侵入式 vs 非侵入式 |
| 类的设计 | 15 | 低耦合高内聚、责任驱动、重构 |
| 零散要点 | 16 | 命名转换、多重继承、命名空间、cv 限定符 |

---

*上一篇：[[OOP/Chapter 15 Class Design AI精讲|Chapter 15 Class Design AI精讲]]*
