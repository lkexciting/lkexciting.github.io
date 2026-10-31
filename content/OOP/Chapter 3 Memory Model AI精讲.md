---
title: Chapter 3 Memory Model · AI 精讲
aliases:
  - OOP/notes/Chapter 3 Memory Model AI精讲
---
# Chapter 3 Memory Model：内存模型

> 对应课件：`3_Memory_Model_2025.pdf`（69 页）
> 关键词：storage duration、global data / stack / heap、`extern`、`static`、reference、`new`/`delete`、`const`、const-correctness

---

## 0. 这一章为什么重要

C/C++ 里最难的不是语法，是**"这个东西现在在哪、活多久、谁能改它"**三个问题。本章就是在回答这三问：

| 问题 | 对应概念 |
| --- | --- |
| 在哪？ | global data / stack / heap 三个区 |
| 活多久？ | storage duration（存储期）：静态、自动、动态 |
| 谁能改？ | `const` 与 const-correctness |

之后的拷贝构造（Ch.8）、智能指针（Ch.14）、异常安全（Ch.13）全都是在这张地图上展开的。**如果这一章没吃透，后面所有"析构两次""内存泄漏""悬空引用"的 bug 你都只能靠背片段来修。**

---

## 1. 变量都放在哪里

先看一段把各类变量凑齐的代码：

```cpp
int i;                  // global vars.
string str;
static int j;           // static global vars.

void f()
{
    int k;              // local vars.
    static int l;       // static local vars.

    int *p = malloc(sizeof(int));  // allocated vars.
}
```

问题：它们分别在哪？

![三类存储区域：global data、stack、heap](OOP/images/Chapter%203%20Memory%20Model%20AI%E7%B2%BE%E8%AE%B2/ch3-p03-03.webp)

| 区域 | 存放 | 生命周期 | 谁分配/释放 |
| --- | --- | --- | --- |
| **global data**（全局数据区，含 static 区） | 全局变量、静态全局变量、静态局部变量、字符串常量 | 程序开始到结束 | 编译器/加载器 |
| **stack**（栈） | 局部变量（自动变量）、函数参数、返回地址 | 进入作用域到离开作用域 | 编译器自动 |
| **heap**（堆） | `new` / `malloc` 动态分配的变量 | 从分配到 `delete` / `free` | 程序员手动 |

记忆方式：**"全局活一辈子，局部活一个花括号，堆活到你亲手杀掉它。"**

顺带说清三个常见误解：

1. 栈不是"很小的、会溢出的神秘东西"，它就是一块由 `rsp` 指针管理的连续内存；递归太深撑爆它叫 stack overflow。
2. 全局区的变量**默认初始化为 0**，栈上的局部变量**默认是垃圾值**，堆上的内存也**不会自动清零**（`new int` 是未初始化的，`new int()` 才是 0）。
3. `static` 局部变量虽然写在函数里，但它**存在全局区**，函数退出不销毁——这是它"能记住上次的值"的原因。

---

## 2. 全局变量、`extern` 与 `static`

### 2.1 全局变量

- 定义在任何函数之外；
- **可以在多个 .cpp 文件之间共享**；
- 但"共享"需要声明，于是有了 `extern`。

### 2.2 `extern`：声明 vs 定义

```cpp
// a.cpp
int g = 42;      // 定义：真正分配了存储空间

// b.cpp
extern int g;    // 声明：告诉编译器"别处有这么个变量"
```

课件的措辞很精确：

> `extern` is a declaration says there will be such a variable somewhere in the whole program. "such a" means the type and the name of the variable.

- **声明（declaration）**：只描述"类型 + 名字"，不分配空间；
- **定义（definition）**：真正分配存储空间。**全局变量是定义**。

这条区分在 Ch.4 讲头文件时会再次出现（头文件里只能放声明），并且是链接错误 "multiple definition" 与 "undefined reference" 的根源。

### 2.3 `static` 的两个完全不同的含义

这是 C++ 里最容易混淆的关键字，因为它的语义取决于**用在哪**：

| 用法 | 效果 |
| --- | --- |
| `static` 全局变量 | **禁止外部文件访问**（internal linkage），把名字"藏"在本 .cpp 内 |
| `static` 函数 | 同上，函数只在本文件可见 |
| `static` 局部变量 | **持久化**（persistence）：函数返回后值仍保留，首次访问时才初始化 |

课件的总结非常凝练：

> for global stuff: **access restriction**（访问限制）
> for local stuff: **persistence**（持久性）

```cpp
void counter() {
    static int l = 0;   // 只初始化一次
    l++;
    cout << l;          // 依次输出 1 2 3 …
}
```

注意 "is to be initialized at its first access"：静态局部变量的初始化发生在**第一次执行到该声明时**（C++11 起还保证线程安全），而不是程序启动时。这一点在讲单例模式（singleton）时会用到。

---

## 3. 指向对象的指针

```cpp
string s = "hello";
string* ps = &s;
```

| 运算符 | 含义 | 例 |
| --- | --- | --- |
| `&` | 取地址（get address） | `ps = &s;` |
| `*` | 取对象（get the object） | `(*ps).length()` |
| `->` | 通过指针调用成员（call the function） | `ps->length()` |

`(*ps).length()` 和 `ps->length()` 完全等价，`->` 只是为了少写两个括号而存在的语法糖。

**两种访问方式的本质区别**（课件特意对比）：

```cpp
string s;      // s 就是对象本身；这一行对象已被创建并初始化
string *ps;    // ps 是指向对象的指针；这一行还不知道它指向谁
```

- `string s;` 一定构造了一个（空的）string 对象；
- `string *ps;` 只是有一个指针，**没有对象**，解引用它就是未定义行为。

赋值时的差别更致命：

```cpp
string s1, s2;
s1 = s2;        // 内容拷贝：s1 变成 s2 的副本

string *ps1, *ps2;
ps1 = ps2;      // 指针拷贝：两个指针指向同一对象，内容一份
```

这就是"值语义（value semantics）vs 引用语义（reference semantics）"的分水岭，Ch.8 的浅拷贝/深拷贝问题就出在这里。

---

## 4. 引用（reference）

### 4.1 声明

引用是 C++ **新增**的数据类型（C 里没有）：

```cpp
char c;         // a character
char* p = &c;   // a pointer to a character
char& r = c;    // a reference to a character
```

- 局部或全局变量：`type& refname = name;`，**普通变量必须给初值**；
- 参数列表和成员变量中：`type& refname`，绑定由调用者或构造函数完成。

### 4.2 引用是"别名"，不是"指针"

```cpp
int X = 47;
int &Y = X;      // Y 是 X 的引用，X 与 Y 现在是同一个变量

cout << "Y = " << Y;   // prints Y = 47
Y = 18;
cout << "X = " << X;   // prints X = 18
```

改 `Y` 就是改 `X`，因为它们是**同一块存储的两个名字**。引用不占额外空间（概念上），也不存在"引用的地址"这回事（`&Y` 得到的是 `X` 的地址）。

### 4.3 规则

1. **定义时必须初始化**（必须绑定）；
2. 初始化即建立绑定（binding）：可以在定义时绑定，也可以在函数调用时绑定：

```cpp
void f(int& x);
f(y);          // 调用时完成初始化
```

3. **绑定运行时不可更改**（unlike pointers）。指针可以改指向，引用不行：

```cpp
int& y = x;
y = z;         // 这是"把 z 的值赋给 x"，不是"让 y 改指 z"
```

4. **引用的目标必须有地址（location）**：

```cpp
void func(int&);
func(i * 3);   // Warning or Error! 临时值没有地址
```

这条规则解释了为什么 `const int& r = 42;` 合法（const 引用可以绑定临时量，编译器为它延长生命周期），而 `int& r = 42;` 非法。

### 4.4 限制

| 写法 | 是否合法 | 原因 |
| --- | --- | --- |
| `int&& r`（引用引用） | 否（`int&&` 在 C++11 是右值引用，另一回事） | 没有"引用的引用"这种类型 |
| `int&* p`（指向引用的指针） | 否 | 引用没有地址可指 |
| `int*& p`（引用的指针） | 是 | p 是一个指针变量的引用 |
| 引用数组 | 否 | 数组元素必须能取地址 |

```cpp
int&* p;          // illegal
void f(int*& p);  // ok —— 可以修改调用者传进来的指针本身
```

`int*&` 在链表操作里非常常用：`void insert(Node*& head, ...)` 能直接改调用者的头指针。

### 4.5 指针 vs 引用

| References（引用） | Pointers（指针） |
| --- | --- |
| 不能为 null | 可以设为 null |
| 不能改绑到别的地址 | 可以改指向别的地址 |
| 依赖一个已存在的变量，是它的别名 | 独立于任何已存在对象 |

一句话选择原则：**"一定存在、且不会换目标"用引用；"可能不存在、或要换目标"用指针。**

---

## 5. 动态内存分配

### 5.1 `new` / `delete` 基础

```cpp
new int;         // 一个 int
new Stash;       // 一个对象
new int[10];     // 数组

delete p;        // 单个对象
delete[] p;      // 数组
```

与 `malloc` / `free` 的关系：

- `new` 类似 `malloc`：在程序运行时分配内存，**指针成为访问这块内存的唯一途径**；
- `delete` 类似 `free`：把内存还给内存池；
- **但 `new`/`delete` 额外保证正确调用构造函数（Ctor）与析构函数（Dtor）**。`malloc` 只给字节，`new` 给"对象"。

这是本章最重要的一句话之一。它意味着：

```cpp
string* ps = (string*)malloc(sizeof(string));  // 只有字节，string 内部指针是垃圾
string* ps = new string("hi");                 // 构造完成，可用
```

### 5.2 动态数组

```cpp
int *psome = new int[10];
delete[] psome;
```

`new[]` 返回的是**第一个元素的地址**；`delete[]` 的方括号告诉运行时"要释放整个数组，而不只是第一个元素"。

### 5.3 new/delete 的底层机制（为什么 `delete[]` 不能省）

![new 分配时在对象前面偷偷记了一个 cookie](OOP/images/Chapter%203%20Memory%20Model%20AI%E7%B2%BE%E8%AE%B2/ch3-p30-30.webp)

看这张图：`new int` 分配 4 字节，`new int[10]` 分配 40 字节。左边那个小格子里记着 **4** 和 **40**——这是分配器写在**返回指针之前**的隐藏字段，俗称 **cookie**（或 header）。

- 对数组，cookie 里存的是元素个数（这里是 10）或整块字节数，`delete[]` 靠它知道要调用几次析构函数；
- 对单个对象，`delete` 不需要这个数字，所以用错 `delete[]`/`delete` 时，运行时可能读到垃圾数据，进而"调用 1 万次析构函数"或直接崩溃。

所以规则不是"养成好习惯"这么温和，而是**语义层面的配对**：

```cpp
int *p = new int;
int *a = new int[10];
Student *q = new Student();
Student *r = new Student[10];

delete p;      // 对
delete[] a;    // 对
delete q;      // 对
delete[] r;    // 对

// delete[] q;  -> 未定义行为
// delete a;    -> 只析构第一个元素，未定义行为
// delete r;    -> 同上
```

### 5.4 使用 `new` / `delete` 的六条铁律

1. 不要用 `delete` 释放不是 `new` 分配的内存；
2. 不要连续 `delete` 同一块内存两次（double free）；
3. `new[]` 必须配 `delete[]`；
4. `new`（无方括号）必须配 `delete`（无方括号）；
5. 对空指针 `delete` 是安全的（什么也不发生）——所以 `delete p; p = nullptr;` 是常见的防御写法；
6. **不要混用 `new`/`delete` 与 `malloc`/`free`**。

第 6 条在工程上尤其重要：混用会导致堆管理器内部结构被破坏，症状往往在很久之后才爆出来，极难定位。

---

## 6. `const`

### 6.1 基本语义

```cpp
const int x = 123;
x = 27;      // illegal!
x++;         // illegal!

int y = x;   // ok，const 可以拷贝给非 const
y = x;       // ok
const int z = y;  // ok，const 更安全
```

规则：**非 const 可以隐式转成 const，反过来不行**（除显式 `const_cast`）。这条单向性就是 const-correctness 的全部基础。

### 6.2 编译期常量 vs 运行期常量

```cpp
const int bufsize = 1024;   // 编译期常量：值进编译器符号表
// extern const int bufsize;  // 若加 extern，才会真的分配存储
```

- C++ 中 **`const` 默认是内部链接（internal linkage）**，编译器尽量不为它分配存储，而是把值放在符号表里；
- 因此**必须初始化**（否则无法放进符号表），除非你用 `extern` 显式声明。

编译期常量的用途是"能当数组大小用"：

```cpp
const int class_size = 12;
int finalGrade[class_size];   // ok

int x;
cin >> x;
const int size = x;           // 运行期才知道
double classAverage[size];    // error（标准 C++ 不允许变长数组）
```

**区分点**：`const` 只保证"不可修改"，不保证"编译期可知"。只有值在编译期能算出来的 `const`（以及 `constexpr`）才能用于数组维度、模板实参等。

### 6.3 聚合类型上的 `const`

```cpp
const int i[] = { 1, 2, 3, 4 };
float f[i[3]];   // Illegal

struct S { int i, j; };
const S s[] = { { 1, 2 }, { 3, 4 } };
double d[s[1].j]; // Illegal
```

对聚合（aggregate，如数组、结构体数组）用 `const` 时，**一定会分配存储**，`const` 的含义退化为"这块存储不能改"。而编译器没有被要求知道这块存储的内容，所以它的值**不能当编译期常量使用**。

### 6.4 指针与 `const`：四种组合

![指针本身 const 与所指对象 const 的区别](OOP/images/Chapter%203%20Memory%20Model%20AI%E7%B2%BE%E8%AE%B2/ch3-p60-60.webp)

关键读法：**`const` 修饰它左边的东西；左边没有东西时才修饰右边。**

```cpp
int a[] = {53, 54, 55};

int * const p = a;    // p 是 const（指针本身不能改）
*p = 20;              // OK：所指的 int 不是 const
p++;                  // ERROR：不能改 p

const int *p = a;     // (*p) 是 const（所指对象不能改）
*p = 20;              // ERROR
p++;                  // OK：p 本身可以改
```

四种组合完整表：

| 写法 | 指针可改？ | 所指对象可改？ | 记忆 |
| --- | --- | --- | --- |
| `int * p` | ✔ | ✔ | 普通 |
| `const int * p` = `int const * p` | ✔ | ✘ | 指向常量（pointer to const） |
| `int * const p` | ✘ | ✔ | 常量指针（const pointer） |
| `const int * const p` | ✘ | ✘ | 两者都锁死 |

课件里的 quiz 值得盯着看三遍：

```cpp
string s("Fred");
const string* p = &s;    // 指向 const string 的指针
string const* p = &s;    // 同上，写法不同而已
string *const p = &s;    // 常量指针，指向 string
```

第二行说明 `const string*` 与 `string const*` **完全等价**；第三行说明 `const` 放在 `*` 右边时修饰的是指针本身。

再看这张赋值合法性表：

![哪些"取地址赋给指针"是合法的](OOP/images/Chapter%203%20Memory%20Model%20AI%E7%B2%BE%E8%AE%B2/ch3-p64-64.webp)

|  | `int i;` | `const int ci = 3;` |
| --- | --- | --- |
| `int * ip;` | `ip = &i;` ✔ | `ip = &ci;` ✘ Error |
| `const int *cip;` | `cip = &i;` ✔ | `cip = &ci;` ✔ |

规律：**只有"能力"可以变弱，不能变强**。`const int*` 承诺"我不改"，所以它能指向任何 int；`int*` 保留了"可能改"的权利，所以不能指向 const 对象。

```cpp
*ip  = 54;   // always legal since ip points to int
*cip = 54;   // never legal since cip points to const int
```

### 6.5 字符串常量

```cpp
char* s = "Hello, world!";   // s 指向一个字符串常量
```

- 这实际上是 `const char*`，但老编译器允许省略 `const`；
- **千万不要试图修改字符**（未定义行为，可能段错误，也可能悄悄改掉只读段）；
- 想改就放进数组（拷贝一份）：

```cpp
char s[] = "Hello, world!";   // 数组版，可以改
```

### 6.6 转换规则与按值传 const

```cpp
void f(const int* x);
int a = 15;
f(&a);              // ok：非 const → const

const int b = a;
f(&b);              // ok
b = a + 1;          // Error!
```

- 永远可以"把非 const 当 const 用"；
- 反过来必须显式 `const_cast`（而且只有在原对象本来就不是 const 时才安全，否则仍是未定义行为）。

关于**按值传 const**：

```cpp
void f1(const int i) {
    i++;   // illegal: compile-time error
}
```

这有意义吗？几乎没有。因为按值传递的 `i` 是**副本**，改它不会影响调用者；加 `const` 只是限制函数内部不能改自己的副本。所以实践建议是：**按值参数不加 `const`（只会污染接口），按指针/引用参数尽量加 `const`**。

关于**按值返回 const**：

```cpp
int f3() { return 1; }
const int f4() { return 1; }

const int j = f3();  // works fine
int k = f4();        // this works fine too
```

返回 `const int` 毫无意义（内置类型的返回值本来就是右值，不可赋值），甚至对自定义类型返回 `const T` 还会**阻止移动语义**（move semantics），是过时写法。

### 6.7 为什么到处都要 `const`：传地址

> Passing large objects are expensive. Better to pass by address, using a pointer or a reference. Make it `const` whenever possible to prevent unexpected modification.

三句话总结成本模型：

- 按值传大对象 = 一次拷贝构造（可能还要一次析构）；
- 传指针/引用 = 传一个地址，O(1)；
- 加 `const` = 保留 O(1) 的同时，把"我不改你的数据"写进类型系统，让编译器替你抓 bug。

这就是 `const T&` 成为 C++ 参数传递默认选择的全部理由。

---

## 7. 要点自检

1. `int i; static int j; void f(){ int k; static int l; }` 四个变量各自的存储区和生命周期？
2. `extern int g;` 是声明还是定义？全局变量 `int g;` 呢？
3. `static` 用在全局和局部上分别是什么意思？
4. 为什么 `func(i * 3)` 不能绑定到 `int&` 参数，但能绑定到 `const int&`？
5. `delete` 与 `delete[]` 用错会怎样？cookie 是干什么的？
6. 说出 `const int * const p` 里两个 `const` 分别约束什么。
7. 为什么按值参数上写 `const` 基本没有意义？

---

## 8. 易错点清单

- **`new int` 未初始化**，`new int()` 才初始化为 0；`new int[10]` 也是未初始化。
- **`delete p; p = nullptr;`** 才算"删干净"，否则 p 成为悬空指针（dangling pointer）。
- **返回局部变量的引用/指针**是最经典的未定义行为：函数返回后栈帧已被回收。
- **`const` 成员变量必须在构造函数初始化列表中初始化**（Ch.5 讲），在函数体里赋值会编译失败。
- **`const` 与 `constexpr`**：C++11 起要"编译期常量"应该用 `constexpr`，`const` 只保证只读。

---

*上一篇：[[OOP/Chapter 2 Using Objects AI精讲|Chapter 2 Using Objects AI精讲]]　下一篇：[[OOP/Chapter 4 Class AI精讲|Chapter 4 Class AI精讲]]*
