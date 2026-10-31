---
title: Appendix B Final Project · AI 精讲
aliases:
  - OOP/notes/Appendix B Final Project AI精讲
---
# Appendix B Final Project：STL Allocator 与内存池

> 对应课件：`About_Final_Project_2025.pdf`（10 页）
> 关键词：allocator、memory pool、block-based allocation、`std::vector`、template parameter、xmemory0

---

## 0. 任务一句话

> **实现一个带内存池的 STL 分配器（allocator），让它能作为模板参数支持 `std::vector` 和 `std::list`，并显著加快大量小对象的动态分配。**

这个项目之所以放在课程最后，是因为它同时用到：

| 前置知识 | 用在哪 |
| --- | --- |
| 模板（Ch.11） | allocator 本身是类模板 |
| 运算符重载（Ch.9） | `operator new` / `operator delete` |
| 类的设计（Ch.15） | 池的结构、接口的划分 |
| 内存模型（Ch.3） | 手动管理原始内存、`placement new` |
| 异常（Ch.13） | 分配失败的处理 |

---

## 1. 从"allocator 是模板参数"说起

STL 容器的完整声明其实是**两个**模板参数：

```cpp
template <class T, class Alloc = allocator<T>> class vector;
template <class T, class Alloc = allocator<T>> class list;
```

第二个参数 `Alloc` 就是**分配器**，默认是 `std::allocator<T>`。

**你可以换成自己的**：

```cpp
std::vector<int, MyAlloc<int>> v;     // 用你自己的分配器
```

这是 C++ 容器"**把内存策略外置**"的设计：容器的算法逻辑（增长、移动、排序）与"怎么拿内存"解耦。

### 1.1 为什么需要自定义分配器

默认的 `std::allocator` 每次 `allocate` 都直接调用 `::operator new`（最终是 `malloc`）。问题在于：

- **小对象分配非常频繁**（`vector` 扩容、`list` 每次插入一个结点）；
- 每次 `malloc/free` 都有**固定的簿记开销**（查找空闲块、加锁、元数据）；
- 大量小对象的分配会导致**堆碎片**。

**内存池（memory pool）** 的思路：**一次向系统要一大块，然后自己切成小块分发**。分配变成"从链表摘一个节点"，释放变成"挂回链表"——O(1)，且几乎没有簿记开销。

---

## 2. allocator 的接口

课件的框架下，allocator 需要提供一组**成员类型**和**成员函数**（参考 MSVC 的 `xmemory0`）。

### 2.1 成员类型（member types）

```cpp
typedef void              _Not_user_specialized;
typedef _Ty               value_type;          // 元素类型
typedef value_type*       pointer;             // 指针
typedef const value_type* const_pointer;       // 常量指针
typedef value_type&       reference;           // 引用
typedef const value_type& const_reference;     // 常量引用
typedef size_t            size_type;           // 大小类型
typedef ptrdiff_t         difference_type;     // 差值类型

typedef true_type propagate_on_container_move_assignment;
typedef true_type is_always_equal;
```

这些 typedef **不是装饰**：STL 内部通过 `allocator_traits<Alloc>::pointer` 之类的别名来获取类型（这正是 Ch.12 讲的 traits 技巧的应用）。少了某个 typedef，容器可能编译不过。

### 2.2 成员函数（member functions）

```cpp
pointer       address(reference _Val) const noexcept;
const_pointer address(const_reference _Val) const noexcept;

pointer allocate(size_type _Count);                    // 分配 n 个元素的空间（未构造）
void    deallocate(pointer _Ptr, size_type _Count);    // 释放

template <class _Uty>
void destroy(_Uty* _Ptr);                              // 调用析构函数

template <class _Objty, class... _Types>
void construct(_Objty* _Ptr, _Types&&... _Args);       // 在已有内存上构造对象
```

**关键区分（这是整个项目最容易搞错的地方）**：

| 操作 | 做什么 | 是否构造对象 |
| --- | --- | --- |
| `allocate` | 只拿**原始内存**（raw memory） | **不构造** |
| `construct` | 在已分配的内存上**构造对象** | 构造 |
| `destroy` | 调用**析构函数** | 析构 |
| `deallocate` | 归还内存 | 不析构 |

`vector` 扩容时正是分两步走：先 `allocate` 一块更大的原始内存，再把旧元素**移动/拷贝构造**过去，最后 `destroy` 旧的并 `deallocate`。

**为什么必须分开？** 因为 `allocate` 要能分配"还没有对象"的空间。如果用 `new T[n]`，会**默认构造 n 个对象**——对 `vector` 来说是巨大的浪费（先构造 n 个空对象，再逐个赋值）。

所以分配器里用的是**原始内存 + placement new**：

```cpp
// allocate：只要字节
T* p = static_cast<T*>(::operator new(n * sizeof(T)));

// construct：在这块内存上构造
new (p) T(args...);        // placement new

// destroy：显式调用析构
p->~T();
```

`placement new` 的语法 `new (地址) 类型(参数)` 表示"**不分配内存，直接在给定地址上构造**"。这正是 `std::vector` 能在"容量 > 大小"时保留未使用空间的原因。

---

## 3. 课件给出的骨架

```cpp
namespace JJ
{
template <class T>
inline T* _allocate(ptrdiff_t size, T*) {
    T* tmp = (T*)(::operator new((size_t)(size * sizeof(T))));
    if (tmp == 0) {
        cerr << "out of memory" << endl;
        exit(1);
    }
    return tmp;
}

template <class T>
inline void _deallocate(T* buffer) {
    ::operator delete(buffer);
}
// ……
}
```

三点值得注意：

1. **用 `::operator new` 而不是 `new T[]`**——只拿字节，不构造对象；
2. **强制转换 `(T*)`** 把 `void*` 转成 `T*`（这里可以用 `static_cast`，更规范）；
3. **课件里用了 `exit(1)`**，但按 Ch.13 的原则，**库代码不该决定终止程序**——工程上应该抛 `std::bad_alloc`。（这可能是课件有意留下的"改进点"。）

---

## 4. 内存池的设计

> **Speed up of a larger number of dynamic memory allocation.**
> An example: **Mem pool using block-based allocation strategy**.

### 4.1 基本结构

典型的**定长块池**（fixed-size block pool）：

```
        一次向系统申请的大块（block）
   ┌──────────────────────────────────────┐
   │ 8B │ 8B │ 8B │ 8B │ 8B │ 8B │ 8B │... │
   └──────────────────────────────────────┘
     ↑
   空闲链表（free list）：把空闲块的"前 8 字节"当作 next 指针
```

核心技巧：**复用空闲块自身的内存来存链表指针**（这叫 "embedding the free list in the free blocks"），于是**零额外开销**。

```cpp
struct FreeNode {
    FreeNode* next;
};

class Pool {
public:
    explicit Pool(size_t blockSize, size_t blockCount);
    ~Pool();

    void* allocate();          // 从 free list 摘一个
    void  deallocate(void* p); // 挂回 free list

private:
    size_t     blockSize_;
    FreeNode*  freeList_;
    char*      chunk_;         // 整块内存的起点
};

Pool::Pool(size_t blockSize, size_t count)
    : blockSize_(blockSize < sizeof(FreeNode*) ? sizeof(FreeNode*) : blockSize),
      freeList_(nullptr),
      chunk_(static_cast<char*>(::operator new(blockSize_ * count)))
{
    // 把整块内存切成 count 个块，串成链表
    for (size_t i = 0; i < count; ++i) {
        FreeNode* node = reinterpret_cast<FreeNode*>(chunk_ + i * blockSize_);
        node->next = freeList_;
        freeList_ = node;
    }
}

void* Pool::allocate() {
    if (!freeList_) { /* 扩容：再申请一块更大的，或抛 bad_alloc */ }
    FreeNode* node = freeList_;
    freeList_ = freeList_->next;
    return node;
}

void Pool::deallocate(void* p) {
    FreeNode* node = static_cast<FreeNode*>(p);
    node->next = freeList_;
    freeList_ = node;
}
```

注意 `blockSize_` 的最小值处理：块必须**至少能装下一个指针**，否则没法串链表。这是新手常见的坑。

### 4.2 任意大小的请求怎么办

> **The allocator should support arbitrary memory size allocation request.**

这是本题的核心难点。`std::vector<double>` 要 8 字节的块，`std::vector<BigStruct>` 要几百字节的块——**一个池只服务一种尺寸**。

三种常见方案：

| 方案 | 思路 | 优缺点 |
| --- | --- | --- |
| **多池**（size-class pools） | 按尺寸分级（8/16/32/64/128…），每级一个池 | 简单高效，主流做法；有内部碎片 |
| **单一池 + 自由链表** | 一个池管理所有块，用"最佳适配"找空闲块 | 通用但慢 |
| **分级 + 大块回退** | 小尺寸走池，超过阈值（如 4KB）直接 `::operator new` | 兼顾通用与性能 |

推荐**第三种**：小对象走池（这正是收益最大的场景），大对象走系统分配（避免浪费）。

```cpp
constexpr size_t kMaxPooledSize = 1024;

void* allocate(size_t n) {
    if (n > kMaxPooledSize)
        return ::operator new(n);          // 大块直接要
    return poolFor(sizeClass(n)).allocate();
}
```

尺寸分级常用"**向上取整到 8 的倍数**"：

```cpp
size_t sizeClass(size_t n) { return (n + 7) / 8 * 8; }
```

于是 `sizeClass(1..8) = 8`，`sizeClass(9..15) = 16`…… 最多 128 个池（1KB / 8B）。

### 4.3 为什么这样能变快

| | 默认 `std::allocator` | 内存池 |
| --- | --- | --- |
| 分配 | 调用 `malloc`（查找空闲块、可能加锁） | 从链表摘一个节点（2 条指令） |
| 释放 | 调用 `free`（合并相邻块） | 挂回链表（2 条指令） |
| 簿记 | 每块都有 header | **零**（指针存在块内部） |
| 碎片 | 会产生 | 池内无碎片（但可能有内部碎片） |

**代价**：池的内存**不会及时还给系统**（要等池析构）。所以池适合"生命周期长、分配频繁"的场景。

---

## 5. 把它包装成 STL 分配器

```cpp
template <class T>
class PoolAllocator {
public:
    using value_type = T;
    using pointer       = T*;
    using const_pointer = const T*;
    using reference       = T&;
    using const_reference = const T&;
    using size_type       = std::size_t;
    using difference_type = std::ptrdiff_t;

    // 允许从 PoolAllocator<U> 构造（容器内部会用到）
    template <class U>
    PoolAllocator(const PoolAllocator<U>&) noexcept {}

    PoolAllocator() noexcept = default;

    T* allocate(std::size_t n) {
        return static_cast<T*>(Pool::instance().allocate(n * sizeof(T)));
    }

    void deallocate(T* p, std::size_t n) {
        Pool::instance().deallocate(p, n * sizeof(T));
    }

    // C++17 起 allocator_traits 会代劳，但显式提供更保险
    template <class U, class... Args>
    void construct(U* p, Args&&... args) {
        ::new (static_cast<void*>(p)) U(std::forward<Args>(args)...);
    }

    template <class U>
    void destroy(U* p) { p->~U(); }
};

// 两个不同 T 的分配器必须能互相比较相等
template <class T, class U>
bool operator==(const PoolAllocator<T>&, const PoolAllocator<U>&) { return true; }
template <class T, class U>
bool operator!=(const PoolAllocator<T>&, const PoolAllocator<U>&) { return false; }
```

### 5.1 三个必须注意的细节

1. **`template <class U> PoolAllocator(const PoolAllocator<U>&)`**
   容器内部会把 `PoolAllocator<int>` 转成 `PoolAllocator<Node>`，缺了这个构造函数会编译失败。

2. **`operator==` / `operator!=`**
   标准要求两个分配器可以比较。**如果所有实例共享同一个池，就永远相等**（返回 `true`），这是最常见的写法。

3. **`rebind`（老标准）**
   C++03 要求 `Alloc::rebind<U>::other`；C++11 起 `allocator_traits` 会自动推导，通常不用写。但如果题目明确要求兼容 C++03，就要补上。

### 5.2 使用

```cpp
std::vector<int, PoolAllocator<int>> v;
v.push_back(1);
v.push_back(2);

std::list<double, PoolAllocator<double>> l;
l.push_back(3.14);
```

注意：**两个容器的元素类型不同，但共用同一个池**（因为 `Pool::instance()` 是全局单例），这正是"分级池"要解决的问题。

---

## 6. 测试方法（课件明确规定了）

> - **First, create more than ten thousand vectors with different number of elements**（先创建一万多个不同大小的 vector）
> - **Second, pick up 1000 random vectors and resize them with random size**（随机挑 1000 个 resize）
> - **Third, release all vectors**（全部释放）

为什么要这样测？

| 步骤 | 验证什么 |
| --- | --- |
| 大量创建 | 分配的吞吐量、池的扩容策略 |
| 随机 resize | `allocate`/`deallocate` 的**反复复用**（这是池的核心优势） |
| 全部释放 | 是否泄漏（用 Valgrind / ASan 检查） |

### 6.1 通过文件指定测试参数

课件给出了输入文件格式：

```
// to create vectors
15000            // number of vectors to be created
10     int       // an integer vector with 10 elements
34     Float     // a float vector with 34 elements
…………….

// to create lists
100              // number of lists to be created
10     int       // an integer list with 10 elements
34     Float     // a float list with 34 elements
…………….

// random resize
23 30            // random vector index, new vector size
56 78
1345 1000
6700 2000
```

> "You can write a program to generate this file to test your allocator."

**实现提示**：

- 需要一个 `std::vector<std::vector<int>>` 之类的外层容器（**注意：外层容器必须用默认分配器**，否则你就在用"还没测试过的池"测试池）；
- 类型名 `int` / `Float` 的映射需要一个工厂函数；
- resize 时按索引找到对应向量，`v.resize(newSize)`。

### 6.2 怎么证明"更快"

必须做**对比测试**：

| 指标 | 怎么测 |
| --- | --- |
| 耗时 | `std::chrono::high_resolution_clock`，同一份输入跑两遍（默认分配器 vs 池） |
| 内存 | 峰值 RSS / `getrusage` |
| 正确性 | 结果与原容器一致；用 `-fsanitize=address` 跑一遍 |

报告里应当给出**数据**，而不只是"更快了"。

---

## 7. 提交要求

> - **Can be a team work (1~2 students)**（1–2 人组队）
> - Besides the code, submit a **report** including:
>   - The team members
>   - **The method description**（方法描述）
>   - **The evaluation**（评测）
>   - **C++ standard version**（使用的 C++ 标准版本）
> - **Zip the codes together with the report.**
> - **Submit it individually.**（各自单独提交）

**"C++ standard version" 为什么要写？** 因为分配器接口在 C++03 / C++11 / C++17 之间差异很大（`rebind`、`construct`/`destroy` 是否必须、`allocate` 的对齐要求）。写清版本，助教才能正确编译。

### 7.1 报告应该写什么

| 章节 | 内容 |
| --- | --- |
| 方法描述 | 池的结构（size class 划分、free list 嵌入方式）、扩容策略、大块回退阈值 |
| 正确性 | 如何验证没有泄漏、没有 double free |
| 评测 | 对比数据（时间 / 内存），最好有表格与结论 |
| 边界情况 | 0 字节请求、超大请求、对齐要求 |
| 已知问题 | 例如"池在程序结束前不归还内存" |

---

## 8. 常见坑

| 坑 | 现象 | 解法 |
| --- | --- | --- |
| 用 `new T[n]` 实现 `allocate` | 多构造了 n 个对象，析构次数不对 | 用 `::operator new` + placement new |
| 块大小小于 `sizeof(void*)` | 链表指针写不下，踩坏数据 | `blockSize = max(blockSize, sizeof(void*))` |
| `dealloc` 时不知道块大小 | 无法归还到正确的池 | 记录 size class，或在块头存元数据 |
| 忘记 `operator==` | 某些容器编译失败 | 全部返回 `true` |
| 缺少 `template<class U>` 构造 | `list` 编译不过（要 rebind） | 补上转换构造 |
| 池内存在对齐问题 | 某些平台崩溃 | 保证块起始地址按 `alignof(std::max_align_t)` 对齐 |
| 用池的对象本身又用池 | 递归调用 | 池的内部结构用默认分配器 |
| 程序结束时池先析构 | 全局对象析构顺序问题 | 池设计成"永不析构"（函数内 static + 故意泄漏） |

最后一条很有意思：**很多工业级内存池故意"泄漏"自己**（在进程退出时不释放），因为全局对象的析构顺序不可控，池先死了而后面的对象还在用它，会导致崩溃。（回想 Ch.8 的"静态初始化顺序问题"。）

---

## 9. 要点自检

1. 为什么 allocator 是容器的模板参数？这带来什么好处？
2. `allocate` 与 `construct` 的区别？为什么必须分开？
3. 什么是 placement new？它在 `vector` 的哪里被用到？
4. 内存池为什么能加速小对象分配？代价是什么？
5. 如何支持"任意大小"的分配请求？为什么要设"大块回退阈值"？
6. 为什么块大小至少要等于一个指针大小？
7. 自定义分配器必须提供哪些成员类型与成员函数？
8. `operator==` 为什么必须提供？返回 `true` 意味着什么？
9. 课件为什么要求测"随机 resize"？
10. 报告里为什么要写 C++ 标准版本？

---

*返回：[[OOP/Chapter 1 Introduction AI精讲|Chapter 1 Introduction AI精讲]]*
