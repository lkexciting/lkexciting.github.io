---
title: Lesson 11
aliases:
  - OOP/notes/OOP Lesson 11
---
# Templates：把类型作为程序参数

## 1. 模板解决什么问题

若整数栈和字符串栈的入栈、出栈逻辑相同，复制两份实现会使修改和修复成倍增加。`void*` 容器又丢失类型检查。模板把类型作为参数，让编译器针对实际类型生成并检查具体实现。

## 2. 函数模板与类型推导

```cpp
#include <utility>

template<class T>
void exchange_values(T& a, T& b) {
    T temp = std::move(a);
    a = std::move(b);
    b = std::move(temp);
}

int main() {
    int a = 1, b = 2;
    exchange_values(a, b); // T 推导为 int，实参随后变为 2、1
}
```

模板形参 `T` 在一次实例化中代表一个确定类型。对 `template<class T> T max_value(T,T)`，`max_value(1,2.0)` 会尝试把同一个 T 推导成 int 和 double，因冲突而失败。可以显式写 `max_value<double>(1,2.0)`，或者重新设计为两个类型参数。

“推导时通常不靠任意用户定义转换求出 T”，不等于“模板函数永远不能发生类型转换”。模板实参已确定后，调用仍要按通常规则检查实参转换。

## 3. 模板函数不是最后的候补

重载决议先比较可行候选的匹配质量；只有匹配等条件相同时，非模板函数相对函数模板的优先规则才可能决定结果。

```cpp
void f(double);
template<class T> void f(T);
// f(1) 选择 f<int>：精确匹配优于 int 到 double 的转换。
// f(1.0) 两者都精确匹配，这里选择非模板 f(double)。
```

因此，“只有找不到普通函数才会用模板”是不准确的。

## 4. 类模板与类外成员定义

```cpp
#include <array>
#include <cstddef>

template<class T, std::size_t N>
class FixedVector {
    std::array<T, N> values_{};
public:
    T& operator[](std::size_t index);
    constexpr std::size_t size() const { return N; }
};

template<class T, std::size_t N>
T& FixedVector<T, N>::operator[](std::size_t index) {
    return values_[index];
}
```

`T&` 是 `operator[]` 的返回类型；`FixedVector<T,N>::` 说明它属于哪个类实例，不是“标记构造函数”。该实现没有边界检查，调用者必须保证 `index<N`。

模板定义通常放在头文件，让使用者在实例化处看到定义；也可使用明确控制实例化的组织方式。把普通类的声明/实现分文件方式机械套用到模板，容易产生链接错误。

## 5. 类型参数、非类型参数与嵌套

`FixedVector<int,50>` 的 `int` 是类型参数，`50` 是非类型参数。`FixedVector<int,50>` 与 `FixedVector<int,51>` 是不同类型。固定尺寸便于优化，但不能在运行时任意改变。

`std::vector<std::vector<double>>` 表示嵌套容器。C++11 及以后，结尾的 `>>` 可以按两个模板右尖括号解析；老代码常写成 `> >`。

## 6. 特化、继承与 CRTP

类模板可以继承普通类或另一个类模板，普通类也能继承某个已实例化的模板类。特化则是针对某些模板参数提供不同实现；它和继承不是同一机制。

```cpp
template<class Derived>
struct Printable {
    void print() const {
        static_cast<const Derived*>(this)->print_impl();
    }
};
struct Item : Printable<Item> {
    void print_impl() const { /* 具体输出逻辑 */ }
};
```

这种 `Derived : Base<Derived>` 形式称为 CRTP。基类在编译期获知派生类型，能组织静态多态；它并不提供通过任意基类指针替换运行时对象类型的能力。需要运行时多态时仍应考虑虚函数。

## 7. 自测

1. 一个 T 能否在同一次实例化中同时是 int 和 double？——不能。
2. 普通函数需要转换、模板精确匹配时，是否必选普通函数？——不是。
3. `T& Vector<T>::operator[](OOP/notes/...)` 中，T& 表示什么？——返回元素引用。
4. 模板参数的正确性何时检查？——定义时检查非依赖部分，依赖具体类型的要求还需在相应实例化阶段检查。

进一步查阅：[C++ 标准草案的函数模板实参推导](https://eel.is/c++draft/temp.deduct.call)。
