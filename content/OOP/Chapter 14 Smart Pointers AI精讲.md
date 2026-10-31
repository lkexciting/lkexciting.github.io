---
title: Chapter 14 Smart Pointers · AI 精讲
aliases:
  - OOP/notes/Chapter 14 Smart Pointers AI精讲
---
# Chapter 14 Smart Pointers：智能指针与引用计数

> 对应课件：`14_Smart_Pointers_2025.pdf`（24 页）
> 关键词：smart pointer、reference counting、`UCObject`/`UCPointer`、envelope & letter、copy-on-write、intrusive design

---

## 0. 这一章在讲什么

前半段是**标准库的智能指针一览**（`auto_ptr` → `unique_ptr`/`shared_ptr`/`weak_ptr`），后半段是**从零手写一个引用计数的智能指针**，并用它实现 `String`。

为什么值得从零写一遍？因为只有自己写过，你才会真正理解：

- 为什么拷贝构造/赋值/析构必须成对出现（Ch.8 的 Rule of Three）；
- 为什么"引用计数"能同时解决"共享"与"自动释放"；
- 为什么 `shared_ptr` 有循环引用问题（需要 `weak_ptr`）。

课件开头引用的参考书是 Robert Murray 的 *C++ Strategies and Tactics*（1993），这是"计数指针"（counted pointer）的经典出处。

---

## 1. 标准库的智能指针

> **Standard library holder for raw pointers on stack** —— 在栈上放一个"持有裸指针"的壳子。
> **Releases resource when destroyed** —— 它析构时释放资源。

这个定义里两个要点：

1. **壳子在栈上**：它的生命周期由作用域自动管理；
2. **资源在堆上**：它持有的是 `new` 出来的东西。

于是"栈的自动性"就传染给了"堆的资源"——这正是 RAII。

### 1.1 `auto_ptr`（历史的教训）

```cpp
template <class X>
class auto_ptr {
public:
    explicit auto_ptr(X* p = 0) throw();
    auto_ptr(auto_ptr&) throw();
    auto_ptr& operator=(auto_ptr&) throw();
    ~auto_ptr();
    X& operator*() const throw();
    X* operator->() const throw();
};
```

注意 `auto_ptr(auto_ptr&)`——参数**不是 `const` 引用**。这是它的致命缺陷：

- 拷贝 `auto_ptr` 时它必须**转移所有权**（把源指针置空），所以无法接受 `const`；
- 于是它**不能放进 STL 容器**（容器要求元素可拷贝，且拷贝后源对象仍有效）；
- 传参时按值传递会"悄悄把所有权拿走"，让人莫名其妙。

`auto_ptr` 在 C++11 被标记 **deprecated**，C++17 被**移除**。

### 1.2 现代四个智能指针

| 指针 | 语义 | 开销 |
| --- | --- | --- |
| `std::auto_ptr` | （已废弃）独占，拷贝即转移 | — |
| `std::unique_ptr` | **独占所有权**，不可拷贝、可移动 | 零（与裸指针同大小） |
| `std::shared_ptr` | **共享所有权**，引用计数 | 一个控制块 + 原子计数 |
| `std::weak_ptr` | **弱引用**，不增加计数，用来打破循环 | 与控制块关联 |

选型速查：

```cpp
std::unique_ptr<T>  p(new T());       // 默认选择：独占
std::shared_ptr<T>  q = std::make_shared<T>();  // 确实需要共享时
std::weak_ptr<T>    w = q;            // 观察但不拥有（解决循环引用）
```

**默认用 `unique_ptr`**：它的语义最清晰（谁拥有一目了然），开销最小，还能自动转成 `shared_ptr`。

---

## 2. 手写智能指针：整体设计

课件把这章称为 "Putting it all together"，因为它把前面所有东西拼在一起：

```
        Templates
       Inheritance
   Reference Counting
     Smart Pointers
```

### 2.1 目标

> - Introduce the code for maintaining **reference counts**
>   - A reference count is a count of the number of times an object is **shared**
>   - Pointer manipulations have to maintain the count
> - **Class `UCObject` holds the count** —— "Use-counted object"
> - **`UCPointer` is a smart pointer to a `UCObject`**
>   - A smart pointer is an object defined by a class
>   - Implemented using a template
>   - Overloads `operator->` and unary `operator*`

两个类，两个职责：

| 类 | 职责 |
| --- | --- |
| `UCObject` | **被共享的东西**，内部维护"有多少人在用我" |
| `UCPointer<T>` | **使用者**，负责在拷贝/赋值/析构时增减计数 |

### 2.2 引用计数是怎么工作的

```cpp
String x("abcdef");        // x 独占，计数 = 1
```

```
x ──▶ [1] "abcdef"
```

```cpp
String y = x;              // 浅拷贝（shallow copy），共享同一块内存
```

```
x ─┐
   ├──▶ [2] "abcdef"
y ─┘
```

```cpp
x = "Hello world";         // 写时复制（copy on write）
```

![写时复制：x 改为新内容后，旧数据只剩 y 一个使用者](OOP/images/Chapter%2014%20Smart%20Pointers%20AI%E7%B2%BE%E8%AE%B2/ch14-p08-08.webp)

```
x ──▶ [1] "Hello world"
y ──▶ [1] "abcdef"
```

三个关键洞察：

1. **拷贝是 O(1)**：只加计数，不复制字符（这是引用计数最大的性能收益）；
2. **写时才复制**（copy-on-write）：只有当某个使用者要改内容、而计数 > 1 时，才真正复制一份；
3. **计数归零才释放**：最后一个使用者消失时，`delete` 才发生。

### 2.3 计数的三条规则

> - 每个可共享对象有一个计数器，初始值 0
> - 每当指针被赋值：`p = q;`
>   ```cpp
>   p->decrement();   // p 原来的目标计数减一
>   p = q;
>   p->increment();   // q（现在也是 p）的目标计数加一
>   ```

注意顺序：**先减旧的，再指新的，再加新的**。顺序错了会导致"自己减到 0 把自己删了，然后再去访问"的惨剧。

---

## 3. 四个类的结构

![四个类的关系：UCPointer 持有 UCObject，String 持有 StringRep](OOP/images/Chapter%2014%20Smart%20Pointers%20AI%E7%B2%BE%E8%AE%B2/ch14-p10-10.webp)

| 编号 | 类 | 职责 | 关系 |
| --- | --- | --- | --- |
| ① | `UCObject` | 实现引用计数 | `StringRep` **is-a** `UCObject` |
| ② | `UCPointer` | 指向 `UCObject` 的智能指针（模板） | `String` **has-a** `UCPointer` |
| ③ | `StringRep` | 字符串的**实际表示**，可共享 | is-a `UCObject` |
| ④ | `String` | 对客户的**公开接口** | has-a `UCPointer<StringRep>` |

这个结构有个专门的名字：**Envelope and Letter**（信封与信纸）模式。

> - **Envelope provides protection**（信封负责保护）
> - **Letter contains the contents**（信纸装着内容）

`String` 是信封（对外接口、值语义），`StringRep` 是信纸（实际数据、可共享）。使用者只看到 `String`，完全不知道"内容其实是共享的"。

---

## 4. `UCObject`：引用计数的实现

```cpp
class UCObject {
public:
    UCObject() : m_refCount(0) { }
    virtual ~UCObject() { assert(m_refCount == 0); }
    UCObject(const UCObject&) : m_refCount(0) { }   // 注意：拷贝时计数从 0 开始

    void incr() { m_refCount++; }
    void decr();
    int references() { return m_refCount; }

private:
    int m_refCount;
};
```

### 4.1 三个设计细节

**细节一：拷贝构造把计数重置为 0**

```cpp
UCObject(const UCObject&) : m_refCount(0) { }
```

为什么不是拷贝原计数？因为"复制一个 `UCObject`"意味着**产生一个新的可共享对象**，它自己还没被任何人引用，所以计数是 0。（随后 `UCPointer` 的构造会把它加到 1。）

**细节二：`decr()` 减到 0 就自杀**

```cpp
inline void UCObject::decr() {
    m_refCount -= 1;
    if (m_refCount == 0) {
        delete this;
    }
}
```

> **"delete this" is legal —— But don't use `this` afterward.**

`delete this` 是合法的 C++，意味着"我自己决定我的死亡"。这是引用计数能自动释放的核心：**最后一个使用者离开时，对象自己销毁自己**。

危险点：`delete this` 之后，`this` 指向的内存已被释放，任何对成员的访问都是未定义行为。所以 `decr()` 里 `delete this` 之后**不能再有任何代码**。

**细节三：析构函数里断言计数为 0**

```cpp
virtual ~UCObject() { assert(m_refCount == 0); }
```

如果你在计数 > 0 时析构，说明有人还在用它（bug），断言会立刻把它抓出来。**这是"把不变量写成运行时检查"的典型手法。**

注意析构函数是 `virtual`——因为 `StringRep` 继承它，而 `UCObject*` 可能指向 `StringRep` 对象（Ch.7 的虚析构规则）。

---

## 5. `UCPointer`：智能指针本体

```cpp
template <class T>
class UCPointer {
private:
    T* m_pObj;
    void increment() { if (m_pObj) m_pObj->incr(); }
    void decrement() { if (m_pObj) m_pObj->decr(); }

public:
    UCPointer(T* r = 0) : m_pObj(r) { increment(); }
    ~UCPointer() { decrement(); }

    UCPointer(const UCPointer<T>& p);
    UCPointer& operator=(const UCPointer<T>&);

    T* operator->() const;
    T& operator*() const { return *m_pObj; }
};
```

### 5.1 构造与析构

```cpp
UCPointer(T* r = 0) : m_pObj(r) { increment(); }   // 接管即加一
~UCPointer() { decrement(); }                       // 死亡即减一
```

这两行就是 RAII 的全部：**获得资源时登记，释放时注销**。

`increment()` / `decrement()` 里的 `if (m_pObj)` 检查是为了支持空指针（`UCPointer<T> p;` 时 `m_pObj == 0`）。

### 5.2 拷贝构造

```cpp
template <class T>
UCPointer<T>::UCPointer(const UCPointer<T>& p) {
    m_pObj = p.m_pObj;
    increment();
}
```

**默认的逐成员拷贝不够用**——它只拷指针，不加计数。计数少了，对象就会被提前 `delete`。所以必须自己写（这正是 Ch.8 说的"有裸指针就要自己写拷贝构造"）。

### 5.3 赋值运算符

```cpp
template <class T>
UCPointer<T>& UCPointer<T>::operator=(const UCPointer<T>& p) {
    if (m_pObj != p.m_pObj) {     // 自赋值检查
        decrement();              // 1. 放过旧的
        m_pObj = p.m_pObj;        // 2. 指向新的
        increment();              // 3. 抓住新的
    }
    return *this;
}
```

**三步顺序不能错**：必须**先 `decrement` 再改指针**。如果先改指针，就再也找不到旧目标了，旧目标的计数永远减不掉 → 内存泄漏。

自赋值检查（`m_pObj != p.m_pObj`）也是必须的：如果 `p` 就是自己，`decrement()` 可能把计数减到 0 进而 `delete this`，然后 `increment()` 就在访问已释放的内存。

（注意这里的检查是**比较指针**，而不是 `this != &p`。两者都能防自赋值，比较指针更宽松一点——两个不同的 `UCPointer` 指向同一个对象时，也不需要增减。）

### 5.4 `operator->` 与多态的配合

```cpp
template <class T>
T* UCPointer<T>::operator->() const {
    return m_pObj;
}
```

课件的例子展示了一个重要性质：

```cpp
// 假设 Shape 继承自 UCObject
Ellipse* pEll = new Ellipse(200F, 300F);
UCPointer<Shape> p(pEll);
p->render();     // calls Ellipse::render() on elly!
```

`p` 的静态类型是 `UCPointer<Shape>`，但 `m_pObj` 实际指向 `Ellipse`。因为 `render` 是虚函数（Ch.7），`p->render()` 经过 `operator->` 拿到 `Shape*`，再虚调用到 `Ellipse::render()`。

**结论：智能指针不破坏多态。** 这也是 `shared_ptr<Base>` 能装 `Derived` 对象的原因。

---

## 6. 完整案例：引用计数的 `String`

### 6.1 `String`：公开接口（信封）

```cpp
class String {
public:
    String(const char*);
    ~String();
    String(const String&);
    String& operator=(const String&);
    int operator==(const String&) const;
    String operator+(const String&) const;
    int length() const;
    operator const char*() const;      // 转换运算符（Ch.9）
private:
    UCPointer<StringRep> m_rep;        // 唯一的数据成员！
};
```

注意：`String` 里**没有任何字符数组**，只有一个智能指针。所有数据都在 `StringRep` 里。

### 6.2 `StringRep`：实际表示（信纸）

```cpp
class StringRep : public UCObject {
public:
    StringRep(const char*);
    ~StringRep();
    StringRep(const StringRep&);
    int length() const { return strlen(m_pChars); }
    int equal(const StringRep&) const;
private:
    char* m_pChars;
};
```

```cpp
StringRep::StringRep(const char* s) {
    if (s) {
        int len = strlen(s) + 1;
        m_pChars = new char[len];
        strcpy(m_pChars, s);
    } else {
        m_pChars = new char[1];
        *m_pChars = '\0';
    }
}

StringRep::~StringRep() {
    delete[] m_pChars;
}

StringRep::StringRep(const StringRep& sr) {
    int len = sr.length();
    m_pChars = new char[len + 1];
    strcpy(m_pChars, sr.m_pChars);
}

int StringRep::equal(const StringRep& sp) const {
    return (strcmp(m_pChars, sp.m_pChars) == 0);
}
```

`StringRep` 自己做了**深拷贝**（拷贝构造里 `new` + `strcpy`），这是有意的：如果某天真的要"分裂"出独立的一份，`StringRep` 的拷贝构造能直接用来做这件事。

### 6.3 `String` 的实现：全部委托

```cpp
String::String(const char* s)
    : m_rep(new StringRep(s)) {}      // 构造 rep 在初始化列表里

String::~String() {}                  // 什么都不用做！

// 注意 rep 的构造在初始化列表里
String::String(const String& s) : m_rep(s.m_rep) {}   // 拷贝 = 共享

String& String::operator=(const String& s) {
    m_rep = s.m_rep;      // 让智能指针去做工作！
    return *this;
}

int String::operator==(const String& s) const {
    return m_rep->equal(*s.m_rep);    // 智能指针的 -> 和 *
}

int String::length() const {
    return m_rep->length();
}
```

这段代码有个惊人的特点：**`String` 的析构函数是空的，拷贝构造和赋值都只有一行。**

为什么？因为所有"记账"工作（增减计数、归零释放）都被 `UCPointer` 包办了。这就是**封装的力量**：把复杂逻辑放进一个可复用的组件，使用者代码就变得极简。

> `m_rep = s.m_rep;  // let smart pointer do work!`

---

## 7. 评价：这个设计好在哪里、差在哪里

课件的 critique 很诚实：

| 优点 | 说明 |
| --- | --- |
| `UCPointer` maintains reference counts | 计数逻辑集中在一个模板里 |
| `UCObject` hides the details of the count | 计数实现对外不可见 |
| **`String` is very clean** | 客户代码极简 |
| `StringRep` deals only with string storage | 职责单一 |
| `UCObject` and `UCPointer` are **reusable** | 别的类也能拿来用 |

| 缺点 | 说明 |
| --- | --- |
| **Slower than raw pointers** | 每次拷贝/析构都要改计数（`shared_ptr` 还要原子操作） |
| **Intrusive design**（侵入式设计） | 被管理的类**必须继承 `UCObject`**——这是对"被管理者"的侵入 |

### 7.1 侵入式 vs 非侵入式

这是本章最重要的一个概念对比：

| | 侵入式（intrusive） | 非侵入式（non-intrusive） |
| --- | --- | --- |
| 代表 | `UCObject` + `UCPointer` | **`std::shared_ptr`** |
| 要求 | 被管理类**必须继承计数基类** | 任意类都能用，不需要改类 |
| 计数存放 | 在对象内部 | 在**独立的控制块**（control block）里 |
| 优点 | 少一次间接访问、可用对象指针直接找到计数 | 通用、可管理第三方类型、可管理内置类型 |
| 缺点 | 无法管理别人的类（`int`、`std::string`） | 多一次间接、控制块有额外内存 |

`std::shared_ptr` 的布局大致是：

```
shared_ptr ──▶ [ ptr ][ control block: strong count, weak count, deleter ]
```

所以 `shared_ptr` 能管任何东西（包括 `int`、数组、甚至 `FILE*` 配自定义 deleter），代价是多一层间接和一块控制块内存。

**课件的结论**：`UCObject`/`UCPointer` 是很好的教学模型，工程上直接用 `std::shared_ptr`。

---

## 8. 循环引用：引用计数的死穴

引用计数有一个无法自救的问题：

```cpp
struct Node {
    std::shared_ptr<Node> next;
    std::shared_ptr<Node> prev;   // 双向链表
};

auto a = std::make_shared<Node>();
auto b = std::make_shared<Node>();
a->next = b;    // b 的计数 = 2
b->prev = a;    // a 的计数 = 2
// a、b 离开作用域，各自计数减到 1，永远不为 0 → 永不释放
```

两个对象互相持有，计数永远不归零 → **内存泄漏**。

解法：**把其中一个方向改成 `weak_ptr`**。

```cpp
struct Node {
    std::shared_ptr<Node> next;
    std::weak_ptr<Node>   prev;   // 弱引用：不增加计数
};
```

`weak_ptr` 的三个特点：

- **不增加强引用计数**，所以不影响生存期；
- 用之前必须 `lock()` 提升为 `shared_ptr`（如果对象已死，得到空指针）；
- 用来**观察**对象是否还存在（`expired()`）。

这就是为什么 `shared_ptr` 和 `weak_ptr` 必须成对出现。

---

## 9. 什么时候该用智能指针（实践建议）

| 场景 | 选择 |
| --- | --- |
| 函数内 `new` 一个对象，函数结束就要释放 | `std::unique_ptr`（或干脆用栈对象） |
| 一个对象被多处共享，谁最后走谁释放 | `std::shared_ptr` |
| 需要打破循环引用 | `std::weak_ptr` |
| 只是"借用"一个对象，不涉及所有权 | **裸指针或引用**（不要用智能指针） |
| 数组 | `std::vector` / `std::array`（比 `unique_ptr<T[]>` 更好） |

一条重要原则：**智能指针是用来表达"所有权"（ownership）的，不是用来"替代所有指针"的**。参数传 `const T&` 或 `T*`（不涉及所有权）时，用裸指针是正确的。

另外，`shared_ptr` 只在**创建时**决定用哪个 deleter，之后不可更改；而 `unique_ptr` 的 deleter 是**类型的一部分**，可以零开销定制（比如 `unique_ptr<FILE, decltype(&fclose)>`）。

---

## 10. 要点自检

1. 什么是智能指针？"壳在栈上、资源在堆上"为什么是关键？
2. `auto_ptr` 为什么被废弃？它的签名哪里有问题？
3. `unique_ptr`、`shared_ptr`、`weak_ptr` 各自的语义与开销？
4. 引用计数的三条增减规则是什么？为什么赋值时必须"先减后加"？
5. `UCObject` 的拷贝构造为什么把计数重置为 0？
6. `delete this` 合法吗？有什么限制？
7. `UCPointer::operator=` 的三步为什么不能换顺序？自赋值检查防的是什么？
8. Envelope and Letter 模式中，"信封"和"信纸"各承担什么职责？
9. 侵入式与非侵入式引用计数的区别？`shared_ptr` 属于哪种？
10. 循环引用如何产生？`weak_ptr` 如何解决？

---

## 11. 易错点

- **只写析构不写拷贝构造/赋值** → 计数不对，double free 或泄漏（Rule of Three）。
- **赋值时先改指针再 `decrement`** → 旧目标永远泄漏。
- **`decr()` 里 `delete this` 之后还访问成员** → 未定义行为。
- **用引用计数管理有循环引用的结构** → 永不释放。
- **把 `shared_ptr` 当参数类型到处传** → 无谓地增加计数（应该传 `const shared_ptr<T>&` 或 `T*`）。
- **对同一个裸指针构造两个 `shared_ptr`** → 两个独立控制块 → double free。正确做法是 `make_shared` 或 `enable_shared_from_this`。
- **以为 `auto_ptr` 还能用** → C++17 已移除。

---

*上一篇：[[OOP/Chapter 13 Exceptions AI精讲|Chapter 13 Exceptions AI精讲]]　下一篇：[[OOP/Chapter 15 Class Design AI精讲|Chapter 15 Class Design AI精讲]]*
