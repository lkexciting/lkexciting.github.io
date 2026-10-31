---
title: Chapter 2 Using Objects · AI 精讲
aliases:
  - OOP/notes/Chapter 2 Using Objects AI精讲
---
# Chapter 2 Using Objects：使用对象

> 对应课件：`2_Using_Objects_2025.pdf`（40 页）
> 关键词：`std::string`、STL、container、algorithm、iterator、vector、list、map、pitfall

---

## 0. 本章的逻辑

这门课第一次讲"对象"，选的例子不是自己写的类，而是**别人写好的类**：`string`、`vector`、`list`、`map`。

这是一种刻意的教学顺序——先当"使用者"（client / user of a class），再当"实现者"。因为只有先用得舒服，你才知道一个类该提供什么样的接口；也只有先被 STL 的坑坑过，你才会在 Ch.4 写 `class` 时想到"边界检查""隐式插入"这些问题。

本章三条主线：

1. **一个类怎么用**：`string` —— 它解决了 C 字符串的什么痛点。
2. **一套库怎么组织的**：STL 的三大件（containers / algorithms / iterators）。
3. **常见的坑**：访问越界、隐式插入、效率误用。

---

## 1. 为什么需要 `string`

C 风格字符串是 `char` 数组 + 以 `'\0'` 结尾的约定。它的问题不是"能不能用"，而是**每件事都要你亲自操心**：

```cpp
char cstr1[20];
char cstr2[20] = "jaguar";
cstr1 = cstr2;      // 编译错误！数组名不能被赋值
```

数组名是常量指针，不能整体赋值，只能 `strcpy`；长度要自己数，缓冲区要自己估，忘记 `'\0'` 就是未定义行为。这就是课件标题 "Safe way to manipulate strings?" 的问号所在。

`std::string` 把"字符序列"变成了**真正的对象**：它自己管理内存，自己知道长度，自己能增长。

```cpp
#include <string>
using namespace std;

string str;              // 定义一个 string 变量，和其他类型一样
string s = "Hello";      // 用字符串常量初始化
cin >> str;              // 用 cin/cout 读写
cout << str;
```

对比一下赋值：

```cpp
char cstr1[20];
char cstr2[20] = "jaguar";
string str1;
string str2 = "panther";

cstr1 = cstr2;  // illegal
str1 = str2;    // legal —— operator= 被重载了
```

同一行"看起来一样"的赋值，一个合法一个非法。差别不在语法，而在于 **`string` 是一个类，`=` 对它来说是成员函数调用**（`str1.operator=(str2)`）。这正是 Ch.9 运算符重载要解释的事。

### 1.1 `string` 的常用操作

拼接（concatenation）：

```cpp
string str3;
str3 = str1 + str2;   // operator+
str1 += str2;         // operator+=
str1 += "lalala";     // 与 C 字符串混用
```

构造函数（constructors / ctors）：

```cpp
string(const char* cp, int len);          // 取 cp 前 len 个字符
string(const string& s2, int pos);        // 从 s2 的 pos 开始到末尾
string(const string& s2, int pos, int len);// 从 s2 的 pos 开始取 len 个
```

取子串与查找：

```cpp
substr(int pos, int len);
find(const string& s);   // 返回下标，找不到返回 string::npos
```

修改（modification）：

```cpp
assign(...);
insert(...);
insert(int pos, const string& s);
erase(...);
append(...);
replace(...);
replace(int pos, int len, const string& s);
```

**注意 `find` 的返回值**：它是 `size_type`（无符号），找不到时返回 `string::npos`（通常是 `(size_type)-1`，即最大值）。如果你写成 `if (s.find("x") >= 0)`，由于无符号比较恒真，判断永远成立——这是经典陷阱，正确写法是 `if (s.find("x") != string::npos)`。

---

## 2. 文件 I/O 的最小知识

```cpp
#include <fstream>

std::ofstream File1("test.txt");
File1 << "Hello world" << std::endl;

std::ifstream File2("test.txt");
std::string str;
File2 >> str;
```

- `ofstream` = output file stream（输出文件流），`ifstream` = input file stream。
- 用法与 `cout` / `cin` 完全一致，因为 `<<` / `>>` 是同一套重载。
- 一个隐藏知识点：`>>` 按空白（空格、换行、制表符）分隔，所以 `File2 >> str` 只能读到第一个单词。要读整行用 `getline(File2, str)`。

---

## 3. C++ 标准库与 STL

C++ 标准库（C++ Standard Library）包含：

- I/O Stream Library（流库）
- String Library（字符串库）
- **STL**
- Threading Library（线程库）
- Mathematical Functions（数学函数）
- …

**库中所有标识符都在 `std` 命名空间里**，这就是为什么每个程序开头都有 `using namespace std;`（Ch.16 会讲这个 `using` 到底做了什么、为什么在头文件里写它是坏习惯）。

### 3.1 STL 是什么

- STL = **Standard Template Library**（标准模板库），是 ISO C++ 标准库的一部分。
- 提供**数据结构与算法**。
- 作者：Alexander Stepanov（《From Mathematics to Generic Programming》）。

为什么用它（课件列的理由，值得背）：

| 理由 | 说明 |
| --- | --- |
| Reduce development time | 数据结构已经写好并调试过 |
| Code readability | 一页能放下更多"有意义"的东西 |
| Robustness | 容器自动增长（不用手写 realloc） |
| Portable code | 跨平台跨编译器 |
| Maintainable code | 别人看得懂 |
| Easy | 用起来简单 |

### 3.2 STL 的三大件

| 组件 | 作用 |
| --- | --- |
| **Containers**（容器） | 类模板，实现常见数据结构 |
| **Algorithms**（算法） | 作用于"元素区间"（range）的函数 |
| **Iterators**（迭代器） | 指针的泛化，用统一方式访问元素 |

三者关系一句话：**算法不关心容器长什么样，它只通过迭代器操作一段区间 `[first, last)`；容器负责提供迭代器；迭代器负责把"第几个元素"抽象成"位置"。**

这也是 STL 能做到 M×N 变 M+N 的原因：M 个容器 + N 个算法，不用写 M×N 个组合函数。

### 3.3 容器的分类

| 类别 | 成员 | 特点 |
| --- | --- | --- |
| 顺序容器 Sequential | `array`（静态）、`vector`（动态）、`deque`（双端队列）、`forward_list`（单链表）、`list`（双链表） | 按插入位置/顺序存储 |
| 关联容器 Associative | `set`（唯一键集合）、`map`（键值对）、`multiset`、`multimap` | 有序，通常红黑树实现，查找 O(log n) |
| 无序关联容器 Unordered Associative | `unordered_set`、`unordered_map`、`unordered_multiset`、`unordered_multimap` | 哈希（hashed by keys），平均 O(1) |
| 适配器 Adaptors | `stack`、`queue`、`priority_queue` | 用别的容器实现特定接口 |

---

## 4. `vector`：最常用的容器

```cpp
#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> x;
    for (int a = 0; a < 1000; a++)
        x.push_back(a);

    vector<int>::iterator p;
    for (p = x.begin(); p < x.end(); p++)
        cout << *p << " ";
}
```

### 4.1 接口一览

| 分组 | 成员 |
| --- | --- |
| 构造 | `vector<Elem> c;`、`vector<Elem> c1(c2);` |
| 基本信息 | `V.size()`、`V.empty()`、`==, !=, <, >, <=, >=`、`v1.swap(v2)` |
| 迭代器 | `I.begin()`、`I.end()`、`cbegin()`、`cend()` |
| 元素访问 | `V.at(i)`、`V[i]`、`V.front()`、`V.back()`、`V.data()` |
| 增删 | `V.push_back(e)`、`V.pop_back()`、`V.insert(pos, e)`、`V.erase(pos)`、`V.clear()` |
| 容量 | `reserve(n)`、`capacity()`、`resize(n)` |

### 4.2 `vector` 的三条本质

1. **能自动扩容**：元素变多时，它自己腾出足够空间。
2. **自己记数量**：`size()` 返回当前存了几个对象（不是容量）。
3. **保持插入顺序**：取出的顺序与插入顺序一致。

### 4.3 两种用法

```cpp
// 方式一：预分配（preallocate）
vector<int> v(100);
v[80] = 1;    // okay
v[200] = 1;   // bad —— 越界，未定义行为

// 方式二：尾部增长（grow tail）
vector<int> v2;
int i;
while (cin >> i)
    v2.push_back(i);
```

**为什么 `v[200] = 1` 是"bad"而不是"报错"？** 因为 `operator[]` 不做边界检查，它只做"基地址 + 偏移"的算术。`at()` 才会检查并抛 `out_of_range`。这是 C++ "不为不用的东西付代价"哲学的典型体现：想要安全检查，就显式用 `at()`。

### 4.4 效率提示

- 估算规模并**预留内存**（`reserve`），避免反复扩容带来的拷贝。
- **避免多余拷贝**：传参用 `const vector<T>&`，不要按值传。
- `push_back` 均摊（amortized）是 O(1)，但单次扩容是 O(n)。

---

## 5. `list`

```cpp
#include <iostream>
#include <string>
#include <list>
using namespace std;

int main() {
    list<string> s;
    s.push_back("hello");
    s.push_back("world");
    s.push_back("stl");

    list<string>::iterator p;
    for (p = s.begin(); p != s.end(); p++)
        cout << *p << " ";
    cout << endl;
}
```

与 `vector` 相同的基本概念：构造、比较、`front()`/`back()`、`push_back`/`push_front`、`pop_back`/`pop_front`、`remove(item)`。

**关键差异（也是常见考点）**：

```cpp
for (p = s.begin(); p != s.end(); p++)   // list 必须用 !=
for (p = x.begin(); p < x.end(); p++)    // vector 可以用 <
```

原因：`list` 的节点在内存里**不连续**，迭代器是节点指针的封装，只有"相等/不等"的意义，没有"大小"的意义；`vector` 的迭代器本质是指针，可以比较大小。

有序插入的例子（边读边保持有序）：

```cpp
list<string> s;
string t;
list<string>::iterator p;
for (int a = 0; a < 5; a++) {
    cout << "enter a string : ";
    cin >> t;
    p = s.begin();
    while (p != s.end() && *p < t)
        p++;
    s.insert(p, t);   // 插到第一个 >= t 的位置之前
}
```

这段代码同时演示了 `insert(pos, value)` 的语义：**插入到 `pos` 之前**，返回新元素的位置。链表插入本身是 O(1)，但"找位置"是 O(n)，所以整体仍是 O(n)。

---

## 6. `map`

![map 是 key-value 对的集合：以电话簿为例](OOP/images/Chapter%202%20Using%20Objects%20AI%E7%B2%BE%E8%AE%B2/ch2-p31-map-31.webp)

- map 是存放"值对"（pairs）的集合；
- 每个 pair 由 **key**（键）和 **value**（值）组成；
- 查找方式：给 key，取 value；
- 典型例子：电话簿，`map<string, string>`。

```cpp
#include <iostream>
#include <map>
using namespace std;

int main() {
    map<string, float> price;
    price["snapple"] = 0.75;
    price["coke"] = 0.50;

    string item;
    double total = 0;
    while (cin >> item)
        total += price[item];   // 注意：这里藏着坑！

    cout << total << endl;
    return 0;
}
```

`map` 的 `operator[]` 有一个特殊语义：**如果 key 不存在，它会静默地插入一个"默认构造的 value"**。所以上面这段代码在你打错一个单词时，不会报错，而是悄悄插入一条价格为 0 的记录。

---

## 7. 算法（Algorithms）

所有算法作用于一个**左闭右开区间** `[first, last)`：

- `for_each`、`find`、`count` …
- `copy`、`fill`、`transform`、`replace`、`rotate` …
- `sort`、`partial_sort`、`nth_element` …
- `set_difference`、`set_union` …
- `min_element`、`max_element` …
- `accumulate`、`partial_sum` …

为什么是右开区间？因为 `last` 表示"结束位置"，可以是"最后一个元素的下一个位置"，这样空区间就是 `[first, first)`，不需要特判，循环条件统一写成 `p != last`。

![C++ STL 算法世界地图（Fluent C++）](OOP/images/Chapter%202%20Using%20Objects%20AI%E7%B2%BE%E8%AE%B2/ch2-p35-algo-map-35.webp)

这张"世界地图"是一张很好的索引图：它按"对查询 / 对区间 / 对结构 / 对原始内存 / 对值"等主题把上百个算法分块。需要查某个算法时，比翻 cppreference 的字母序列表更快建立全局印象。网址：https://www.fluentcpp.com/getthemap/

**迭代器（iterators）** 负责把容器和算法连起来，课件特意说"讲完模板和运算符重载之后再讲"——因为它本质上是"给指针定义一套统一接口"，需要类、模板、运算符重载三样工具都就绪才能讲清楚（Ch.12）。

---

## 8. 三个经典陷阱（Pitfalls）

### 8.1 访问安全（access safety）

```cpp
vector<int> v;
v[100] = 1;    // Whoops! 未定义行为
```

解决方案：

1. 用 `push_back()` 让容器自己扩容；
2. 用构造函数预分配：`vector<int> v(101);`
3. 用 `resize()` 重新分配；
4. 用 `size()` 检查下标；
5. 需要检查时用 `at()`。

### 8.2 静默插入（silent insertion）

```cpp
if (foo["bob"] == 1)     // 悄悄创建了 "bob" 这一项
    ...

if (foo.count("bob"))    // 只查不改
    ...

if (foo.contains("bob"))  // C++20
    ...
```

区别在于：`operator[]` **会修改容器**（可能插入），`count` / `contains` / `find` **不会**。所以"只想查一下"时，绝对不能用 `[]`。

### 8.3 用 `empty()` 判空

```cpp
if (my_list.size() == 0) {...}  // 慢
if (my_list.empty())     {...}  // 快
```

对 `list` 来说，`size()` 在早期标准实现中可能是 O(n)（要遍历计数），而 `empty()` 只需比较头尾指针，永远是 O(1)。这是个"看起来等价、实际差一个数量级"的例子。

---

## 9. 其他数据结构（课件末尾点名）

`set`、`multiset`、`multimap`、`queue`、`priority_queue`、`stack`、`deque`、`slist`、`bitset`、`valarray`。

选型速查：

| 需求 | 选择 |
| --- | --- |
| 随机访问 + 尾部增删 | `vector` |
| 频繁在中间/头部插入删除 | `list` / `forward_list` |
| 双端进出 | `deque` |
| 有序去重集合 | `set` |
| 键值查找（有序） | `map` |
| 键值查找（只要快，不要顺序） | `unordered_map` |
| 后进先出 | `stack` |
| 先进先出 | `queue` |
| 每次取最大/最小 | `priority_queue` |

---

## 10. 要点自检

1. 为什么 `cstr1 = cstr2` 非法而 `str1 = str2` 合法？
2. `V[i]` 与 `V.at(i)` 的区别是什么？设计上为什么允许前者存在？
3. `list` 的迭代器为什么不能用 `<` 比较？
4. `map::operator[]` 与 `map::count` 在"是否修改容器"上的差别会导致什么 bug？
5. STL 三大件为什么能让 M 个容器 × N 个算法不必写 M×N 份代码？

---

*上一篇：[[OOP/Chapter 1 Introduction AI精讲|Chapter 1 Introduction AI精讲]]　下一篇：[[OOP/Chapter 3 Memory Model AI精讲|Chapter 3 Memory Model AI精讲]]*
