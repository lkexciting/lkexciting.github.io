---
title: OOP Lesson 12
aliases:
  - OOP/notes/OOP Lesson 12
---
# Iterators 与 Traits：把算法和容器分开

## 1. 为什么算法不直接操作容器内部结构

数组通过地址相邻排列，链表通过 next 指针连接。如果每个查找、排序、统计算法都直接处理每一种内部结构，实现数量会迅速增加。迭代器提供统一访问协议：取得元素、前进、比较位置，让算法只依赖所需的访问能力。

## 2. 半开区间与最小查找算法

`[first,last)` 包含 first 指向的元素，不包含 last。空区间满足 `first==last`；last 常代表尾后位置，不能解引用。

```cpp
#include <vector>

template<class It, class T>
It find_value(It first, It last, const T& value) {
    for (; first != last; ++first)
        if (*first == value) return first;
    return last;
}

int main() {
    int a[] = {2, 4, 6};
    auto p = find_value(a, a + 3, 4); // 指向 a[1]
    std::vector<int> v{1, 3, 5};
    auto it = find_value(v.begin(), v.end(), 9);
    if (it == v.end()) { /* 未找到，不可解引用 it */ }
    return *p == 4 ? 0 : 1;
}
```

同一算法可处理原生指针和 vector 迭代器，因为它们都提供这里所需的比较、前进和读取操作。

## 3. 链表迭代器怎样实现指针式接口

```cpp
template<class T>
struct Node { T value; Node* next; };

template<class T>
class ListIter {
    Node<T>* ptr_;
public:
    using value_type = T;
    explicit ListIter(Node<T>* ptr = nullptr) : ptr_(ptr) {}
    T& operator*() const { return ptr_->value; }
    T* operator->() const { return &ptr_->value; }
    ListIter& operator++() { ptr_ = ptr_->next; return *this; }
    ListIter operator++(int) { auto old = *this; ++*this; return old; }
    bool operator==(const ListIter& other) const { return ptr_ == other.ptr_; }
    bool operator!=(const ListIter& other) const { return !(*this == other); }
};
```

前置 `++it` 返回前进后的迭代器引用；后置 `it++` 保存并返回旧位置，参数中的 `int` 仅用于区分重载。`operator->` 返回元素地址，不能把迭代器自身的地址当成元素地址。对空迭代器解引用或前进都不合法。

这个例子只展示最小协议，不是完整标准容器：尚未实现 const 迭代器、全部标准关联类型和生命周期管理。

## 4. 关联类型为什么需要 traits

算法有时需要知道“迭代器指向的值是什么类型”。对于类迭代器可以写 `typename It::value_type`，但 `int*` 不是类，没有这样的成员。

```cpp
template<class It>
struct ValueTraits { using value_type = typename It::value_type; };

template<class T>
struct ValueTraits<T*> { using value_type = T; };

template<class T>
struct ValueTraits<const T*> { using value_type = T; };
```

主模板处理类迭代器，指针偏特化处理原生指针，算法通过统一入口取类型。`typename` 告诉编译器，依赖于模板参数的限定名称是一个类型。

实际泛型算法通常使用标准库的 `std::iterator_traits<It>`；现代代码还可按相应标准使用 `std::iter_value_t<It>`。注意 `const int*` 的值类型是 int，读取引用则可以是 `const int&`，值类型不等于引用类型。

## 5. 特化与能力分类

- 全特化固定全部模板实参，如 `Traits<int*>` 的专门实现。
- 偏特化固定一部分或限制参数形式，如 `Traits<T*>`。
- 函数模板不能直接偏特化，通常用重载或调用类模板实现分派。

| 迭代器能力 | 代表性操作 | 能否任意位置跳转 |
|---|---|---|
| 输入 | 单遍读取、++ | 不能 |
| 输出 | 写入、++ | 不能 |
| 前向 | 可多遍遍历、++ | 不能 |
| 双向 | ++、-- | 不能 |
| 随机访问 | +n、差值、大小比较 | 可以，常数时间 |
| 连续 | 随机访问且元素连续存放 | 可以 |

不是所有迭代器都能用于 `std::sort`：它要求随机访问能力；链表通常使用自己的成员排序算法。

## 6. 迭代器失效是生命周期问题

vector 扩容可能使原先的指针、引用和迭代器全部失效；擦除元素也会按容器规则影响相关位置。保存一个迭代器不等于保存元素副本，更不能保证容器修改后它仍有效。

自测：为什么 find 返回 last？因为它用统一的尾后位置表达“未找到”；调用方必须先比较，再解引用。
