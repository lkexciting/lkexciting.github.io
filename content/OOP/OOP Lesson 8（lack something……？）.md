---
title: Lesson 8（lack something……？）
aliases:
  - OOP/notes/OOP Lesson 8（lack something……？）
---
# Copy Constructor：对象复制与资源所有权

## 1. 拷贝构造与拷贝赋值是不同操作

```cpp
#include <string>

struct Person {
    std::string name;
};

int main() {
    Person a{"Alice"};
    Person b = a;       // b 原先不存在：拷贝构造
    Person c{"Bob"};
    c = a;              // c 已存在：拷贝赋值
}
```

构造函数建立新对象；赋值运算符更新已有对象，还要处理它原先持有的资源。`T b(a)`、从左值按值传参都可能调用拷贝构造。返回值优化和移动语义意味着“看起来传了一个对象”并不保证一定发生一次拷贝。

## 2. 典型签名与参数传递

```cpp
class Buffer {
public:
    Buffer(const Buffer& other);
    Buffer& operator=(const Buffer& other);
};
```

拷贝构造的首参数是同类型的引用，最常见是 `const T&`。`T&` 等其他标准允许的形式也可能是拷贝构造，因此不能说签名只有一种。按值的 `T(T)` 不是合法的拷贝构造声明：建立参数本身就需要先复制对象，逻辑上会形成递归需求。

## 3. 默认成员复制为什么有时正确、有时危险

默认复制会复制基类和非静态成员。`std::string`、`std::vector` 自己管理资源，因此外层类通常可以直接使用默认复制。原生指针只复制地址，不会复制其指向的数据。

若指针表示非拥有的观察关系，复制地址可能正是所需语义；若指针独占动态数组，而析构函数会 `delete[]`，两个对象共享同一地址就可能重复释放。问题不是“指针一定不能复制”，而是复制行为必须符合所有权约定。

## 4. 深拷贝的完整例子

```cpp
#include <algorithm>
#include <cstddef>
#include <utility>

class Buffer {
    std::size_t size_;
    int* data_;
public:
    explicit Buffer(std::size_t n)
        : size_(n), data_(n ? new int[n]{} : nullptr) {}
    ~Buffer() { delete[] data_; }
    Buffer(const Buffer& other) : Buffer(other.size_) {
        if (size_) std::copy_n(other.data_, size_, data_);
    }
    Buffer& operator=(const Buffer& other) {
        Buffer copy(other); // 先成功建立副本；失败时原对象保持不变
        std::swap(size_, copy.size_);
        std::swap(data_, copy.data_);
        return *this;       // copy 离开作用域，释放原先的资源
    }
    int& operator[](std::size_t i) { return data_[i]; }
};

int main() {
    Buffer a(2);
    a[0] = 7;
    Buffer b = a;
    b[0] = 9; // 不改变 a[0]
    a = a;    // copy-and-swap 也能正确处理自赋值
}
```

这里的深拷贝给新对象分配独立存储。赋值使用 copy-and-swap，避免先销毁旧资源、随后分配失败而破坏对象。例子用于说明资源管理；生产代码通常应把成员换成 `std::vector<int>`，让库负责这些细节。

## 5. Rule of Three / Five / Zero

- 三法则：手工管理资源时，应一起考虑析构、拷贝构造和拷贝赋值。
- 五法则：C++11 以后还要考虑移动构造、移动赋值；移动可以转交资源而不是复制内容。
- 零法则：优先使用管理资源的成员类型，使外层类不需要自己实现这些特殊成员函数。

编译器可能把默认复制定义为删除，例如某成员本身不可复制。不能把“没有自己写”理解为“一定能正确复制”。

## 6. 检查题

- 新旧对象是否应该共享资源，还是分别拥有副本？
- 析构后，另一个对象的指针是否仍有效？
- 自赋值、分配失败、从函数返回时是否仍保持对象不变量？
- 是否可用 `vector`、`string` 或智能指针代替手工所有权？

进一步查阅：[C++ 标准草案的拷贝与移动构造规则](https://eel.is/c++draft/class.copy.ctor)。
