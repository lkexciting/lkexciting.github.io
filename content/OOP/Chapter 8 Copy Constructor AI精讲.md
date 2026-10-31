---
title: Chapter 8 Copy Constructor · AI 精讲
aliases:
  - OOP/notes/Chapter 8 Copy Constructor AI精讲
---
# Chapter 8 Copy Constructor：拷贝构造与 static

> 对应课件：`8_Copy_Constructor_2025.pdf`（31 页）
> 关键词：copy constructor、shallow copy / deep copy、memberwise initialization、object slicing 的姊妹问题、static 成员

---

## 0. 本章要解决的问题

**"创建对象"这件事，除了 `Point a(1,2);`，还有一支你平时没注意的路径：从一个已有对象创建新对象。**

```cpp
Currency bucks(100, 0);
func(bucks);           // 这里有拷贝发生
Person baby_b = baby_a; // 这里也有
return player;          // 这里还有
```

如果类里只有 `int`、`string` 这类成员，编译器替你做的"逐成员拷贝"是对的。但**一旦类里有裸指针（raw pointer），默认行为会把两个对象指向同一块内存**——然后析构两次，程序崩溃。

这一章就是讲清楚：**什么时候发生拷贝、默认拷贝干了什么、什么时候必须自己写。**

---

## 1. 拷贝构造是什么

> Copying is implemented by the **copy constructor**.

唯一签名（unique signature）：

```cpp
T::T(const T&);
```

三个要点：

1. **参数是自身的 const 引用**——必须用引用，因为按值传参又要拷贝，会无限递归；
2. **const 表示"不修改源对象"**；
3. **没有返回值**。

```cpp
class Person {
public:
    Person(const Person& w);   // copy ctor 的原型
};
```

### 1.1 编译器会自动生成一个

> C++ builds a copy ctor for you if you don't provide one!

它做的事叫**逐成员初始化（memberwise initialization）**：

- 拷贝每个**成员变量**：对数字、对象、对象数组都好用；
- 拷贝每个**指针**：只拷地址 → **数据被共享（data may become shared）**。

第二行就是所有问题的根源。

---

## 2. 类里有指针会怎样

```cpp
class Person {
public:
    Person(const char* s);
    ~Person();
    void print();
private:
    char* name;     // 注意：是 char*，不是 string
    // ... 其他信息
};
```

```cpp
Person::Person(const char* s) {
    name = new char[strlen(s) + 1];
    strcpy(name, s);
}

Person::~Person() {
    delete[] name;      // array delete
}
```

现在 `Person a("Fred"); Person b = a;`

默认拷贝构造让 `b.name == a.name`（同一个地址）。于是：

1. `a` 和 `b` 指向同一块堆内存；
2. `b` 析构时 `delete[] name`，那块内存被回收；
3. `a` 析构时**再次** `delete[] name` → **double free**，程序崩溃；
4. 更隐蔽的情况：`a` 改名会影响 `b`（它们共享数据），语义错乱。

### 2.1 两种选择

![两种拷贝策略：只拷指针（共享数据）vs 拷贝整块内容（各自独立）](OOP/images/Chapter%208%20Copy%20Constructor%20AI%E7%B2%BE%E8%AE%B2/ch8-p05-05.webp)

| 策略 | 行为 | 适用 |
| --- | --- | --- |
| **Copy pointer**（浅拷贝 shallow copy） | 两个对象指向同一块数据 | 想共享（需要引用计数/共享所有权） |
| **Copy entire block**（深拷贝 deep copy） | 为新对象单独分配一块，复制内容 | 值语义（value semantics） |

课件把这称为 "Choices"——**拷贝语义是一个设计选择，不是语法规定**。默认的逐成员拷贝选择了"拷指针"，所以你要么接受共享语义，要么自己写深拷贝。

绝大多数情况下，你要的是**深拷贝**。

---

## 3. C 风格字符串的必要知识

```cpp
#include <cstring>   // 即 <string.h>
```

```cpp
size_t strlen(const char *s);
// s 必须以 '\0' 结尾；返回长度，不含结尾的 '\0'

char *strcpy(char *dest, const char *src);
// 把 src 拷贝到 dest，包括结尾的 '\0'
// dest 必须有足够空间
// 返回值是 dest
```

"`"C++"` 在内存里是**四个**字符的数组"：`'C' '+' '+' '\0'`。少算这个 `\0`，就是经典的 `new char[strlen(s)]`（少 1 字节）→ 缓冲区溢出。

### 3.1 正确的深拷贝

```cpp
Person::Person(const Person& w) {
    name = new char[strlen(w.name) + 1];   // +1 给 '\0'
    strcpy(name, w.name);
}
```

课件的三条注解值得逐条读：

1. **No value returned** —— 构造函数没有返回值；
2. **Accesses `w.name` across client boundary** —— 注意它**直接访问了另一个对象的 private 成员**。这合法吗？合法。**访问控制是"类"级别的，不是"对象"级别的**：同类对象之间可以互访私有成员。
3. **The copy ctor initializes uninitialized memory** —— 拷贝构造面对的是**未初始化的内存**，所以它"初始化"而不是"赋值"。这也是为什么它必须用初始化列表/直接构造，而不能先默认构造再赋值。

---

## 4. 如果成员是 `string` 呢

```cpp
class Person {
public:
    Person(const string&);
    ~Person();
    void print();
private:
    string name;      // 嵌入式对象（composition）
};
```

那就**什么都不用做**：

> In the default copy ctor, the compiler **recursively calls the copy ctors for all member objects (and base classes)**.
> Default is **memberwise initialization**.

也就是说：

- 成员是 `string` → 调用 `string` 的拷贝构造（它自己做了深拷贝）；
- 成员是 `HealthPlan` → 调用 `HealthPlan` 的拷贝构造；
- 成员是基类子对象 → 调用基类的拷贝构造；
- 成员是 `int` → 按位拷贝。

**这就是"用 `string` 代替 `char*`"最实际的好处**：不需要写拷贝构造、赋值运算符、析构函数（rule of three）。

### 4.1 Rule of Three（三法则）

如果你需要自己写其中**任何一个**，通常三个都要写：

| 函数 | 默认行为 | 有裸指针时的问题 |
| --- | --- | --- |
| 拷贝构造 `T(const T&)` | 逐成员拷贝 | 浅拷贝 → double free |
| 拷贝赋值 `operator=` | 逐成员赋值 | 浅拷贝 + 内存泄漏 |
| 析构 `~T()` | 逐成员析构 | 需要 `delete[]` |

（C++11 之后扩展为 Rule of Five：再加移动构造、移动赋值。）

---

## 5. 拷贝构造在什么时候被调用

课件给了三个时机，每个都值得记牢。

### 5.1 按值传参（call by value）

```cpp
void roster(Person player);   // 声明

Person child("Ruby");
roster(child);                // child 被拷贝进 player
```

```
child                player
(Ruby)  ──copy──▶   (Ruby)
```

### 5.2 初始化（initialization）

![初始化时的三次"Fred"：baby_b、baby_c 都是拷贝构造出来的](OOP/images/Chapter%208%20Copy%20Constructor%20AI%E7%B2%BE%E8%AE%B2/ch8-p13-13.webp)

```cpp
Person baby_a("Fred");

// 下面两行都用拷贝构造
Person baby_b = baby_a;    // 注意：这不是赋值！
Person baby_c(baby_a);     // 也不是赋值
```

**这两行的 `=` 骗人**：只要 `=` 出现在**变量定义**里，它就是**初始化**，调用拷贝构造，而不是 `operator=`。

区分方法：

| 写法 | 语义 |
| --- | --- |
| `Person b = a;`（定义时） | 拷贝构造 |
| `Person b(a);` | 拷贝构造 |
| `b = a;`（b 已存在） | `operator=` |

这是 Ch.9 赋值运算符的伏笔：**"构造"和"赋值"是两件事**。

### 5.3 函数返回（function return）

```cpp
Person captain() {
    Person player("George");
    return player;      // 拷贝（概念上）
}

Person who = captain(); // 又一次拷贝（概念上）
```

现代编译器会做 **RVO / NRVO**（返回值优化），把这两次拷贝"优化掉"。

> Compilers can "optimize out" copies when safe!
> Programmers need to — Program for "dumb" compilers; be ready to look for optimizations.

意思是：**不要依赖优化来保证正确性，但要理解优化的存在**。写代码时假设"拷贝会发生"（所以拷贝构造必须正确），同时知道实际上可能不调用（所以别在拷贝构造里放副作用逻辑）。

### 5.4 一个对比示例

```cpp
Person copy_func(Person p) {
    p.print();
    return p;
}   // 拷贝构造被调用（传参一次，返回一次）

Person nocopy_func(const char* who) {
    return Person(who);    // 直接在返回值位置构造，无需拷贝
}
```

`nocopy_func` 的写法就是"避免拷贝"的经典手法：**在 return 语句里直接构造**，让编译器在调用者的空间里构造对象（copy elision）。

---

## 6. 构造 vs 赋值（Constructions vs. Assignment）

课件三条，非常凝练：

1. **Every object is constructed once.**（每个对象只构造一次）
2. **Every object should be destroyed once.**（也应该只析构一次）
   - 忘记 delete → 内存泄漏
   - delete 多次 → double free
3. **Once an object is constructed, it can be the target of many assignment operations.**（构造一次，可被赋值多次）

这三条是"资源管理"的公理。所有 `new/delete` 的 bug，都是违反了其中某一条。

---

## 7. 拷贝构造的四条准则

> 1. **In most cases, you don't have to write.**
> 2. **Be explicit when necessary, e.g., managing raw pointers.**
> 3. **If you don't need one, declare a private copy ctor (no need to define the body)** — 阻止默认拷贝构造的生成，让"拷贝"变成编译错误。
> 4. **Since C++11: `Person(const Person& rhs) = delete;`**

第 3、4 条是"禁止拷贝"（non-copyable）的两种写法。C++11 之后统一用 `= delete`，语义更清楚：

```cpp
class FileHandle {
public:
    FileHandle(const FileHandle&) = delete;             // 禁止拷贝构造
    FileHandle& operator=(const FileHandle&) = delete;  // 禁止拷贝赋值
};
```

这与 Ch.14 的 `unique_ptr` 是同一个思路：**所有权唯一的东西，不该被拷贝。**

---

## 8. `static`：复习与深入

这一章的后半段回到 `static`，因为"对象的一生"还有另一种形态：**静态存储期**。

### 8.1 两个基本含义

> **Static storage** —— allocated once at a fixed address（在固定地址分配一次）
> **Visibility of a name** —— internal linkage（名字的内部链接）

也就是说，`static` 在不同位置有不同的作用：

| 位置 | 含义 | 效果 |
| --- | --- | --- |
| 全局变量前 | 内部链接 | 本 `.cpp` 之外不可见 |
| 全局函数前 | 内部链接 | 本 `.cpp` 之外不可见 |
| 局部变量前 | 静态存储 | 只初始化一次，函数返回后仍保留 |
| 类成员前 | 类级共享 | 属于类，不属于任何对象 |

### 8.2 文件级隐藏

```cpp
// file1.cpp
int g_global;              // 其他文件可以 extern 访问
static int s_local;        // 只在本文件可见
static void hidden() { }   // 只在本文件可见

void func() { /* ... */ }
```

```cpp
// file2.cpp
extern int g_global;
void func();
extern int s_local;        // 链接时找不到！s_local 是内部链接

int myfunc() {
    g_global += 2;
    s_local *= g_global;   // 链接错误（或用别的同名变量）
    func();
}
```

课件在这里放了一个问号：`static void hidden()` 在另一个文件里能不能调用？**不能**。

### 8.3 函数内的 static

```cpp
void f() {
    static int num_calls = 0;
    // ...
    num_calls++;    // 统计函数被调用了多少次
}
```

- 值在整个程序期间保留；
- **初始化只发生一次**（第一次执行到这一行时）；
- 存储在全局数据区，不在栈上。

### 8.4 static 对象

```cpp
class X {
    X(int, int);
    ~X();
};

void f() {
    static X my_X(10, 20);   // 静态对象
}
```

规则：

- **构造发生在执行到定义处**（at most once），构造参数必须满足；
- **析构发生在程序退出时**，编译器保证 **LIFO**（后构造先析构）顺序。

### 8.5 条件构造（conditional construction）

```cpp
void f(int x) {
    if (x > 10) {
        static X my_X(x, x * 21);
        // ...
    }
}
```

`my_X` 的性质：

- **只在 `f` 以 `x > 10` 被调用过时才构造**（且只构造一次）；
- 之后一直保留它的值（即便后来用 `x <= 10` 调用 `f`）；
- **只有构造过才会析构**（destroyed only if constructed）。

这种"首次使用才初始化"的语义，正是**懒初始化（lazy initialization）**，也是单例模式（singleton）的经典写法：

```cpp
Logger& Logger::instance() {
    static Logger inst;    // C++11 保证线程安全
    return inst;
}
```

### 8.6 全局对象

```cpp
#include "X.h"
static X global_x(12, 34);
static X global_x2(8, 16);
```

- **构造函数在 `main()` 之前被调用**；
- 顺序由**在文件中出现的顺序**决定（`global_x` 先于 `global_x2`）；
- 所以 **`main()` 已经不再是"第一个被调用的函数"**；
- 析构在 `main()` 返回或 `exit()` 被调用时执行。

这带来著名的**静态初始化顺序问题**（static initialization order fiasco）：跨文件的全局对象，构造顺序**未定义**。如果一个全局对象的构造函数依赖另一个文件里的全局对象，就可能用到未构造的对象。

**结论**：少用跨文件的全局对象；必须用时，改用"函数内 static"（局部静态），因为它的初始化时机是确定的（首次调用时）。

### 8.7 static 成员

> Static means —— **Hidden**、**Persistent**.

- **Hidden**：static 成员仍然遵守常规的访问规则（它是个成员）；
- **Persistent**：它独立于任何实例存在。

**静态成员变量**：

- 对所有成员函数而言是"全局的"；
- **只初始化一次**，在文件作用域；
- 在 `.cpp` 里"给个地方并初始化它"；
- **在 `.cpp` 中初始化时不要再写 `static`**。

```cpp
// X.h
class X {
    static int count_;      // 声明
public:
    static int count() { return count_; }
};

// X.cpp
int X::count_ = 0;          // 定义 + 初始化（注意：没有 static）
```

**静态成员函数**：

- **没有隐含的接收者（no implicit `this`）**；
- 因此**只能访问静态成员变量**（或其他全局量）；
- **不能被动态覆盖**（不能是虚函数）。

为什么没有 `this`？因为 `this` 是"调用这个函数的对象"，而静态成员函数**不需要对象就能调用**（`X::count()`），自然没有对象可指。

**访问方式**：

```cpp
X::count();      // 用类名（推荐）
obj.count();     // 用对象名（也合法，但不推荐，容易误以为依赖对象）
```

---

## 9. 要点自检

1. 拷贝构造的唯一签名是什么？为什么参数必须是引用？
2. 默认拷贝构造做了什么？对指针成员意味着什么？
3. 深拷贝与浅拷贝的区别？各自适用于什么语义？
4. `Person b = a;` 调的是拷贝构造还是 `operator=`？怎么判断？
5. 拷贝构造在哪些时机被调用？（至少三个）
6. 为什么说"拷贝构造访问 `w.name` 跨越了客户边界"却仍然合法？
7. 有哪两种"禁止拷贝"的写法？C++11 推荐哪个？
8. `static` 用在全局、局部、成员上分别是什么意思？
9. 全局对象的构造在什么时候发生？为什么会引发"静态初始化顺序问题"？
10. 静态成员函数为什么不能访问非静态成员？

---

## 10. 易错点

- **`Person b = a;` 误认为是赋值** → 实际是拷贝构造，`operator=` 根本没被调用。
- **默认拷贝构造不会深拷贝指针** → double free / 共享数据。
- **在拷贝构造里用赋值而非初始化**（先默认构造再赋值）→ 效率差，且对 const/引用成员不可行。
- **`new char[strlen(s)]` 少一个字节** → 溢出。
- **在 `.cpp` 里定义静态成员时又写了 `static`** → 变成另一个内部链接变量，链接错误。
- **函数返回局部对象的引用** → 悬空引用（Ch.5 提过，这里再强调）。
- **依赖 RVO 保证正确性** → 优化不是语言保证（C++17 起部分场景已是保证，但别假设）。

---

*上一篇：[[OOP/Chapter 7 Polymorphism AI精讲|Chapter 7 Polymorphism AI精讲]]　下一篇：[[OOP/Chapter 9 Overloaded Operators AI精讲|Chapter 9 Overloaded Operators AI精讲]]*
