---
title: Chapter 12 Iterators · AI 精讲
aliases:
  - OOP/notes/Chapter 12 Iterators AI精讲
---
# Chapter 12 Iterators：迭代器

> 对应课件：`12_Iterators_2025.pdf`（26 页）
> 关键词：iterator、glue、iterator category、traits、template specialization、`value_type`、STL 解耦

---

## 0. 一句话概括

> 迭代器是**算法与容器之间的胶水（glue）**：它让算法只依赖"一个能 `++`、能 `*`、能比较"的统一接口，从而**完全不认识容器**。

这句概括解释了 STL 的全部架构：

- 没有迭代器时：**N 个算法 × M 个数据结构 = N×M 份实现**；
- 有迭代器时：**N + M 份**。

这就是第 2 章说的"STL 三大件"里最抽象、也最关键的一件。

---

## 1. 迭代器是什么

> Provide a way to **visit the elements in order**, without knowing the details of the container.
> —— **Generalization of pointers**（指针的泛化）

设计模式（GoF, Gang of Four）里的原文定义：

> "Provide a way to access the elements of an aggregate object **sequentially** without **exposing its underlying representation**."

三层含义：

1. **顺序访问**（sequentially）：不要求随机访问；
2. **不暴露内部表示**：使用者不知道底层是数组、链表还是树；
3. **指针的泛化**：像指针一样用 `*` 取值、用 `++` 前进，但可以比指针聪明得多。

---

## 2. 一个算法如何同时服务 vector 与 list

看 STL 的 `find`：

```cpp
template <class InputIterator, class T>
InputIterator find(InputIterator first, InputIterator last, const T& value)
{
    while (first != last && *first != value)
        ++first;
    return first;
}
```

**这个函数里没有一个字提到容器。** 它只用了四样东西：

| 用法 | 含义 |
| --- | --- |
| `first != last` | 迭代器可比较相等 |
| `*first` | 可解引用取值 |
| `++first` | 可前进 |
| 返回值 | 迭代器可拷贝、可返回 |

于是它能同时用于 `vector<int>` 和 `list<double>`：

```cpp
vector<int> vecTemp;
list<double> listTemp;

vector<int>::iterator fVecIter, lVecIter;
fVecIter = vecTemp.begin();
lVecIter = vecTemp.end();
fVecIter = find(fVecIter, lVecIter, 3);
if (fVecIter == lVecIter)
    cout << "3 not found in vecTemp" << endl;

list<double>::iterator fListIter, lListIter;
fListIter = listTemp.begin();
lListIter = listTemp.end();
fListIter = find(fListIter, lListIter, 3.0);
```

**同一份 `find` 代码，两种完全不同的底层结构。** 这就是"胶水"的价值。

---

## 3. 迭代器的四项要求

> - **A unified interface used in algorithms**（算法使用的统一接口）
> - **Work like a pointer to the elements in a container**（像指向容器元素的指针）
> - **Have `++` operator** to visit elements in order（顺序前进）
> - **Have `*` operator** to visit the content of an element（取值）

这四条是所有迭代器类别的**共同底线**。注意这里说的"像指针"，正是为什么 Ch.9 要单独讲 `operator*`、`operator++`、`operator->`——迭代器就是"把这些运算符重载到自定义类上"的产物。

### 3.1 一个最小的例子：`auto_ptr`

课件先用 `auto_ptr` 说明"重载 `*` 和 `->` 就能造出一个像指针的类"：

```cpp
template <class T>
class auto_ptr {
private:
    T* pointee;
public:
    T& operator*()  { return *pointee; }   // *p
    T* operator->() { return pointee; }    // p->member
};
```

`operator->` 的语义很特殊：`p->member` 会被编译器展开成 `(p.operator->())->member`，所以 `operator->` 必须返回一个**指针**（或另一个重载了 `->` 的对象，形成递归）。这是 C++ 里少数"语法规定必须这样"的地方。

（顺带：`auto_ptr` 在 C++17 已被移除，被 `unique_ptr` 取代——见 Ch.14。）

---

## 4. 手写一个链表迭代器

课件的完整例子，值得逐行读。

### 4.1 容器与节点

```cpp
template <class T>
class ListItem {
public:
    T& val() { return _value; }
    ListItem* next() { return _next; }
private:
    T _value;
    ListItem<T>* _next;
};

template <class T>
class List {
public:
    void insert_front();
    void insert_end();
    // ...
private:
    ListItem<T>* front;
    ListItem<T>* end;
    long _size;
};
```

### 4.2 迭代器类

```cpp
template <class T>
class ListIter {
    ListItem<T>* ptr;
public:
    ListIter(ListItem<T>* p = 0) : ptr(p) {}

    ListIter<T>& operator++() {                 // 前置 ++
        ptr = ptr->next();
        return *this;
    }

    bool operator==(const ListIter& i) const {
        return ptr == i.ptr;
    }

    T& operator*()  { return ptr->val(); }       // 解引用
    T* operator->() { return &(**this); }        // 成员访问
};
```

四个要点：

1. **迭代器的全部状态是一个指针**（`ptr`）——这就是"指针的泛化"的字面意思；
2. **`operator++` 返回 `*this` 的引用**（支持链式、支持前置语义，效率也更高，见 Ch.9）；
3. **`operator==` 比较的是内部指针**，不是值；
4. **`operator->` 用 `&(**this)` 实现**——先解引用得到 `T&`，再取地址得到 `T*`。这个写法看起来绕，但它让 `operator*` 与 `operator->` 保持单一真相来源。

### 4.3 使用

```cpp
List<int> myList;
// 插入元素

ListIter<int> begin = myList.begin();
ListIter<int> end = myList.end();
ListIter<int> iter;

iter = find(begin, end, 3);     // 复用同一个 find！
if (iter == end)
    cout << "not found" << endl;
```

**注意**：这里用的还是那个 `find`，一行都没改。你的自制容器 + 自制迭代器，立刻就能用 STL 的算法。

---

## 5. 难题：迭代器的"关联类型"

### 5.1 问题

如果算法里需要声明一个"元素类型"的变量，怎么办？

```cpp
template <class I>
void func(I iter) {
    ??? tmp;        // 元素类型是什么？
    tmp = *iter;
}
```

`I` 是迭代器类型（如 `vector<int>::iterator`），但算法需要的是**元素类型**（`int`）。这叫**关联类型（associated type）**问题。

### 5.2 第一次尝试：多传一个参数

```cpp
template <class I, class T>
void func_impl(I iter, T& v) {
    T tmp;
    tmp = *iter;
    // 处理代码
}

template <class I>
void func(I iter) {
    func_impl(iter, *iter);    // 用 *iter 让编译器推出 T
}
```

这是**类型推导技巧**：编译器无法从 `I` 推出 `T`，但可以从 `*iter` 的**表达式类型**推出 `T`。

缺点：如果算法需要**多个**关联类型（元素类型、指针类型、差值类型……），就得传一堆无用参数。

### 5.3 第二次尝试：在迭代器里 typedef

```cpp
template <class T>
struct myIter {
    typedef T value_type;      // 把自己的元素类型"写"进类型里

    T* ptr;
    myIter(T* p = 0) : ptr(p) {}
    T& operator*() { return *ptr; }
};

template <class I>
typename I::value_type func(I iter) {   // 从 I 里"取"出 value_type
    return *iter;
}

myIter<int> iter(new int(8));
cout << func(iter);
```

关键语法：**`typename I::value_type`**。

为什么需要 `typename`？因为编译器默认会把 `I::value_type` 当成"静态成员变量"，只有加了 `typename` 才明确"这是一个类型"。这是 C++ 模板里最著名的语法噪声之一。

### 5.4 typedef 技巧的致命缺陷

> **It cannot support pointer-type iterators**, e.g., `int*`, `double*`, `Complex*`, which cripples the STL programming.

问题：`int*` 是内置类型，它**没有成员**，所以 `int*::value_type` 根本不存在。但 `int*` 完全符合"迭代器"的语义（能 `++`、能 `*`、能 `!=`），STL 必须支持它——否则 `vector` 的迭代器（底层常常就是指针）就用不了。

需要一种机制：**对"有 `value_type` 的类型"走一条路，对"指针"走另一条路。**

这就是 traits 技巧。

---

## 6. traits 技巧与模板特化

### 6.1 模板特化速览（前置知识）

```cpp
// 主模板（primary template）
template <class T1, class T2, int I>
class A { /* ... */ };

// 显式（完全）特化 explicit (full) specialization
template <>
class A<int, double, 5> { /* ... */ };

// 偏特化 partial specialization
template <class T2>
class A<int, T2, 3> { /* ... */ };
```

三种形态：

| 形态 | 写法 | 含义 |
| --- | --- | --- |
| 主模板 | `template <class T1, class T2, int I> class A` | 通用版本 |
| 显式特化 | `template <> class A<int, double, 5>` | 所有参数都确定 |
| 偏特化 | `template <class T2> class A<int, T2, 3>` | 部分参数确定 |

### 6.2 用一个例子理解特化

```cpp
template <class T>
class C {
public:
    C() { cout << "template T" << endl; }
};

template <class T>
class C<T*> {              // 偏特化：参数是指针时走这里
public:
    C() { cout << "template T*" << endl; }
};
```

```cpp
C<int>  a;    // 输出 "template T"
C<int*> b;    // 输出 "template T*"  ← 偏特化优先
```

这就是 traits 的核心机制：**用偏特化给"特殊情况"（指针）单独开路。**

### 6.3 `iterator_traits` 的实现

```cpp
// 主模板：给"有内嵌 typedef 的类迭代器"用
template <class I>
class iterator_traits {
public:
    typedef typename I::value_type    value_type;
    typedef typename I::pointer_type  pointer_type;
    // ...
};

// 偏特化一：给普通指针用
template <class T>
class iterator_traits<T*> {
public:
    typedef T  value_type;
    typedef T* pointer_type;
    // ...
};

// 偏特化二：给 const 指针用
template <class T>
class iterator_traits<const T*> {
public:
    typedef T        value_type;    // 注意：去掉 const！
    typedef const T* pointer_type;
    // ...
};
```

三个版本，三种情况，全部覆盖。算法只写一次：

```cpp
template <class I>
typename iterator_traits<I>::value_type func(I iter) {
    return *iter;
}
```

```cpp
myIter<int> iter(new int(8));
cout << func(iter);        // 走主模板，取 myIter<int>::value_type

int* p = new int[20]();
cout << func(p);           // 走 iterator_traits<int*> 偏特化
```

**这就是"统一接口"的完整实现**：算法永远写 `iterator_traits<I>::value_type`，至于这个类型从哪来（迭代器自己声明 / 指针特化推导），由 traits 负责。

![iterator_traits：把各种迭代器（包括裸指针）统一映射到五个关联类型](OOP/images/Chapter%2012%20Iterators%20AI%E7%B2%BE%E8%AE%B2/ch12-p24-24.webp)

---

## 7. STL 标准的五个关联类型

真正的 `iterator_traits` 定义了五个：

```cpp
template <class I>
class iterator_traits {
public:
    typedef typename I::iterator_category iterator_category;  // 类别
    typedef typename I::value_type        value_type;         // 元素类型
    typedef typename I::difference_type   difference_type;    // 距离类型（通常是 ptrdiff_t）
    typedef typename I::pointer           pointer;            // 指针类型
    typedef typename I::reference         reference;          // 引用类型
};
```

| 关联类型 | 作用 | 典型值 |
| --- | --- | --- |
| `value_type` | 元素本身的类型 | `int` |
| `difference_type` | 两个迭代器相减的结果类型 | `ptrdiff_t` |
| `pointer` | 指向元素的指针类型 | `int*` |
| `reference` | 元素的引用类型 | `int&` |
| `iterator_category` | 迭代器能力等级 | `random_access_iterator_tag` |

`iterator_category` 是"能力标签"，算法靠它**在编译期选择最优实现**（这叫 tag dispatch）：

- 如果是随机访问迭代器，`advance` 可以直接 `+= n`；
- 如果是双向迭代器，只能循环 `++` n 次；
- 如果是输入迭代器，甚至只能读一次。

**同一份算法，按迭代器能力自动选择最优策略，且全部在编译期完成。**

### 7.1 五种迭代器类别

| 类别 | 能力 | 典型容器 |
| --- | --- | --- |
| **InputIterator** | 只读、单向、单遍 | `istream_iterator` |
| **OutputIterator** | 只写、单向、单遍 | `ostream_iterator`、`back_inserter` |
| **ForwardIterator** | 读写、单向、多遍 | `forward_list`、`unordered_*` |
| **BidirectionalIterator** | 读写、可双向（`--`） | `list`、`set`、`map` |
| **RandomAccessIterator** | 读写、可跳跃（`+ n`、`[]`、比较大小） | `vector`、`deque`、裸指针 |

这是一个**能力递增**的层次：RandomAccess 蕴含 Bidirectional 蕴含 Forward 蕴含 Input。

这也解释了 Ch.2 那个细节：**为什么 `list` 的迭代器不能用 `<` 比较，而 `vector` 可以？** 因为 `list` 是 Bidirectional，只保证 `==`/`!=`；`vector` 是 RandomAccess，才有大小关系。

---

## 8. 三条总结（课件的收尾）

> - **Container knows how to design its own iterator.**（容器知道怎么设计自己的迭代器）
> - **Traits trick extracts type information embedded in different iterators, including raw pointers.**（traits 技巧提取各类迭代器内嵌的类型信息，包括裸指针）
> - **Algorithms are independent to containers through the design philosophy of iterators.**（凭借迭代器的设计哲学，算法与容器相互独立）

再加一条实践建议：

> 遍历容器时优先写 `for (auto it = c.begin(); it != c.end(); ++it)`：
> - 用 `!=` 而不是 `<`（对所有迭代器类别都成立）；
> - 用前置 `++it`（少一次拷贝，见 Ch.9）。

---

## 9. 要点自检

1. 为什么说"没有迭代器需要 N×M 份实现，有迭代器只需 N+M"？
2. 迭代器必须支持哪四个操作？
3. `operator->` 的语义为什么特殊？为什么通常用 `&(**this)` 实现？
4. "关联类型"问题是什么？两种解法分别是什么？
5. `typename I::value_type` 里的 `typename` 为什么不能省？
6. typedef 技巧为什么无法支持 `int*`？
7. traits 是如何用模板特化解决这个问题的？三个版本分别处理什么？
8. 五种迭代器类别的能力差异是什么？为什么 `list` 迭代器不能用 `<`？
9. `iterator_category` 的作用是什么？

---

## 10. 易错点

- **对 `list` 用 `<` 比较迭代器** → 编译错误（Bidirectional 只有 `==`/`!=`）。
- **写 `i++` 而不是 `++i`** → 迭代器的后置 `++` 需要拷贝，效率低。
- **忘记 `typename`** → 编译器把 `I::value_type` 当静态成员，报"不是类型"。
- **以为 traits 是运行期机制** → 全在编译期，零开销。
- **`const T*` 的 `value_type` 是 `T` 而不是 `const T`** → 特化里必须去掉 const，否则 `vector<const int>` 之类的推导会出问题。
- **手写迭代器时 `operator++` 返回 `void`** → 无法链式、无法配合某些算法。

---

*上一篇：[[OOP/Chapter 11 Template AI精讲|Chapter 11 Template AI精讲]]　下一篇：[[OOP/Chapter 13 Exceptions AI精讲|Chapter 13 Exceptions AI精讲]]*
