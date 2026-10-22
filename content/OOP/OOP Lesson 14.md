---
title: OOP Lesson 14
aliases:
  - OOP/notes/OOP Lesson 14
---
# Smart Pointers：用对象管理资源的生命周期

## 1. 先确定所有权，再选择指针

原生指针只保存地址，并不能说明谁负责 `delete`。若多个对象都以为自己是所有者，就可能重复释放；若所有对象都不释放，就会泄漏。智能指针把所有权写进类型，并通过析构函数自动清理资源，这是 RAII（Resource Acquisition Is Initialization）的应用。

| 类型 | 所有权 | 能否直接复制 | 典型用途 |
|---|---|---|---|
| `std::unique_ptr<T>` | 唯一所有者 | 不能，可移动 | 默认的堆对象所有权 |
| `std::shared_ptr<T>` | 多个对象共同拥有 | 可以，增加共享计数 | 确实需要共享生命周期 |
| `std::weak_ptr<T>` | 不拥有对象 | 可以 | 观察共享对象、打破循环 |
| `T*`、`T&` | 通常不表达所有权 | 可以 | 临时访问已有对象 |

`auto_ptr` 是旧式转移所有权的指针，复制行为容易误导，已从 C++17 标准库移除。新代码使用 `unique_ptr`。

## 2. unique_ptr：所有权只能有一份

```cpp
#include <memory>
#include <utility>

int main() {
    auto a = std::make_unique<int>(42);
    // auto bad = a;  // 不能复制唯一所有权
    auto b = std::move(a);
    if (!a && b) {
        *b = 7;
    }
} // b 析构，自动 delete 所拥有的 int
```

`std::move` 本身是类型转换；所有权转移发生在 `unique_ptr` 的移动构造或移动赋值中。转移后本例的 `a` 为空，不得再直接解引用。

- `get()` 取得观察用的原生指针，不转移所有权，不能再自行 `delete`。
- `reset()` 释放当前资源，也可接管一个新指针。
- `release()` 放弃所有权并返回指针，不会释放对象；调用方必须安排后续清理。
- 数组使用 `unique_ptr<T[]>`，不能把 `new T[n]` 交给管理单对象的默认删除器。

## 3. shared_ptr：对象与控制块

共享所有者通过控制块维护强引用计数。复制会增加强引用；销毁或 `reset()` 会减少强引用。强引用归零时销毁被管理对象。若仍有弱引用，控制块还需保留，以便判断对象已经失效。

```cpp
#include <memory>

int main() {
    auto a = std::make_shared<int>(10); // 一个共享所有者
    {
        auto b = a;                   // 两个共享所有者
        *b = 20;                      // a 与 b 观察同一个对象
    }                                 // b 释放所有权，a 仍有效
    a.reset();                        // 最后一个所有者释放，对象销毁
}
```

不要对同一个原生指针分别构造两个独立 `shared_ptr`：两套控制块都可能删除同一对象。正确做法是复制已经存在的 `shared_ptr`。

## 4. weak_ptr 为什么能够打破循环

若 A 用 `shared_ptr` 持有 B，B 又用 `shared_ptr` 持有 A，即使外部变量消失，双方的强引用计数仍不为零，因而无法回收。把其中一条非所有权关系改成 `weak_ptr`，就不会维持这个循环。

```cpp
#include <memory>

struct Node {
    std::shared_ptr<Node> child;
    std::weak_ptr<Node> parent;
};

int main() {
    auto root = std::make_shared<Node>();
    root->child = std::make_shared<Node>();
    root->child->parent = root;
    if (auto parent = root->child->parent.lock()) {
        // lock 成功后，parent 在这个作用域内保持对象存活。
    }
}
```

不能直接解引用 `weak_ptr`，应调用 `lock()` 并检查结果；不要先 `expired()` 再假定之后一定仍然存活。

## 5. 引用计数不等于对象线程安全

不同 `shared_ptr` 实例可以共享控制块，但这不自动保护指向对象中的数据。多个线程同时修改同一个整数或容器，仍需要锁或合适的原子操作。`use_count()` 也不适合作为并发正确性的判断条件。

## 6. 自己实现引用计数时必须维护什么

教学版 `UCPointer<T>` 至少要定义：接管资源、复制时增加计数、析构时减少计数、最后一份引用释放对象，以及复制赋值时先建立新关系再解除旧关系。还要考虑自赋值、异常安全、移动、删除器与计数的并发访问。仅重载 `operator*` 和 `operator->` 并不能获得正确的资源管理。

## 7. 自测

1. 一个函数只是临时读对象，需要让调用方创建 `shared_ptr` 吗？——通常不需要，传 `const T&` 即可。
2. 为什么两个 `shared_ptr` 指向同一地址仍可能重复释放？——它们可能来自不同控制块。
3. `release()` 是否等于 `reset()`？——前者交出资源，后者释放或更换资源。
4. 为什么父指针适合用 `weak_ptr`？——父子关系中的回指通常只需要观察，不应额外延长父对象生命周期。
