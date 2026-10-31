---
title: Chapter 11 Template · AI 精讲
aliases:
  - OOP/notes/Chapter 11 Template AI精讲
---
# Chapter 11 Template：模板

> 对应课件：`11_Template_2025.pdf`（28 页）
> 关键词：generic programming、function template、class template、instantiation、non-type parameter、CRTP、template in header

---

## 0. 模板解决什么问题

假设你需要"一个 int 的列表"和"一个 string 的列表"。两份代码几乎一样，只差一个类型。你有哪些选择？

| 方案 | 代价 |
| --- | --- |
| **Clone code**（复制代码） | 保住类型安全，但**难以管理**（改一处要改 N 处） |
| **Make a common base class**（造公共基类） | 把 int 变成"对象"往往不可接受（性能、语义） |
| **Untyped lists**（void* 之类） | **类型不安全**，编译期检查全丢 |

模板是第四条路：

> Reuse source code —— **generic programming**（泛型编程）
> **use types as parameters** in class or function definitions.

也就是说，把**类型本身**当作参数传进去，让**编译器**为每个实际类型生成一份代码。这样既有类型安全，又没有重复劳动。

```cpp
template <class T>
void Swap(T& x, T& y);
```

`T` 不是变量，是**类型的占位符**（type parameter）。

---

## 1. 函数模板

先看"没有模板"的痛苦：

```cpp
void Swap(int& x, int& y) {
    int temp = x;
    x = y;
    y = temp;
}
```

如果还要 swap `float`、`string`、`Currency`、`Person` 呢？复制四遍。

模板版：

```cpp
template <class T>          // 或 template <typename T>
void Swap(T& x, T& y) {
    T temp = x;
    x = y;
    y = temp;
}
```

三个要点（课件原文）：

- **`template` 关键字引入模板**；
- **`class T` 声明一个"参数化类型名"**——注意这里的 `class` 意思是"**任何内置类型或用户自定义类型**"，不是"类"；
- **在模板内部，`T` 就当类型名用**。

`class` 与 `typename` 在这里**完全等价**。现代风格更推荐 `typename`（语义更准确，因为 `T` 不一定是 class）。

### 1.1 类型形参能代表什么

> Type parameters represent:
> - **types of arguments to the function**（函数参数的类型）
> - **return type of the function**（返回类型）
> - **variables defined within the function**（函数内部变量的类型）

```cpp
template <class T>
T max_value(T a, T b) {     // T 用于参数类型和返回类型
    T result = a;           // T 用于局部变量
    if (b > a) result = b;
    return result;
}
```

---

## 2. 实例化（instantiation）

> Generating a definition from a template class/function and template arguments:
> - **Types are substituted into template**
> - **New body of function or class definition is created**（并做语法检查、类型检查）
> - **Specialization** —— 针对特定参数的一个版本

```cpp
int i = 3, j = 4;
Swap(i, j);            // 使用已存在的 int Swap（或实例化一个）

float k = 4.5, m = 3.7;
Swap(k, m);            // 实例化 float Swap

std::string s("Hello"), t("World");
Swap(s, t);            // 实例化 std::string Swap
```

> **A template function is an instantiation of a function template.**
> （"模板函数"是"函数模板"的一个实例。）

术语区分（考试常考）：

| 术语 | 含义 |
| --- | --- |
| **function template**（函数模板） | 那个"带 T 的模板"，本身不是函数 |
| **template function**（模板函数） | 由模板实例化出来的具体函数 |

**关键理解**：模板在**编译期**展开。它**不是运行期多态**（那是虚函数），而是**编译期多态**（static polymorphism）。代价是代码膨胀，收益是零运行期开销。

---

## 3. 类型推导与"精确匹配"

> - **Only exact match on types is used**
> - **No conversion operations are applied**
> - **Even implicit conversions are ignored**

```cpp
Swap(int, int);        // ok
Swap(double, double);  // ok
Swap(int, double);     // error!
```

为什么 `Swap(1, 2.0)` 会失败？因为模板推导要求"**同一个 T 推导出同一个类型**"：第一个参数推出 `T = int`，第二个推出 `T = double`，冲突 → 推导失败。

想让它工作，必须显式指定：

```cpp
Swap<double>(1, 2.0);   // 显式指定 T = double，1 被转换成 double
```

这条规则是模板与普通函数最大的差别：**普通函数允许实参隐式转换，模板推导不允许**。

### 3.1 重载决议的顺序

> 1. **Check first for unique function match**（先找普通函数的唯一最佳匹配）
> 2. **Then check for unique function template match**（再找函数模板的唯一最佳匹配）
> 3. **Then implicit conversions on regular functions**（最后才考虑普通函数的隐式转换）

```cpp
void f(float i, float k) {}
template <class T> void f(T t, T u) {}

f(1.0f, 2.0f);   // 两个都精确匹配 → 选普通函数 f(float,float)
f(1.0, 2.0);     // double 精确匹配模板 → 选 f<double>
f(1, 2);         // 模板 f<int> 精确匹配 → 选模板
f(1, 2.0);       // 模板推导失败 → 回退到普通函数，做隐式转换
```

**推论**：课件强调"模板函数不是最后的候补"。很多人以为"模板只有在找不到普通函数时才用"，这是错的——**匹配质量优先于"是否模板"**：

```cpp
void f(double);
template <class T> void f(T);

f(1);      // 选 f<int>：精确匹配优于 int→double 转换
f(1.0);    // 两者都精确匹配，此时选非模板 f(double)
```

只有在**匹配质量相同**时，非模板函数才优先。

### 3.2 显式实例化

```cpp
template <class T>
void foo() { /* ... */ }

foo<int>();     // T = int
foo<float>();   // T = float
```

当**返回类型/参数里没有 T** 时，编译器无法推导，必须显式指定。

---

## 4. 类模板

> Classes parameterized by types:
> - **Abstract operations from the types being operated upon**
> - **Define potentially infinite set of classes**
> - **Another step towards reuse!**

典型用途：**容器类**（container classes）。

```cpp
stack<int>       // 元素是 int 的栈
list<Person*>    // 元素是 Person* 的链表
queue<Job>       // 元素是 Job 的队列
```

栈的 push/pop 逻辑与"元素是什么类型"**完全无关**，这正是模板的用武之地。

### 4.1 例子：Vector

```cpp
template <class T>
class Vector {
public:
    Vector(int);
    ~Vector();
    Vector(const Vector&);
    Vector& operator=(const Vector&);
    T& operator[](int);
private:
    T* m_elements;
    int m_size;
};
```

注意这里出现了 Rule of Three（拷贝构造、赋值、析构）——因为类里有裸指针 `T*`。

### 4.2 使用

```cpp
Vector<int> v1(100);
Vector<Complex> v2(256);

v1[20] = 10;
v2[20] = v1[20];    // 若 int→Complex 的转换已定义，则 OK
```

`Vector<int>` 和 `Vector<Complex>` 是**两个完全不同的类型**，编译器为它们各自生成一份代码。

### 4.3 类外定义成员

```cpp
template <class T>
Vector<T>::Vector(int size) : m_size(size) {
    m_elements = new T[m_size];
}

template <class T>
T& Vector<T>::operator[](int index) {
    if (index < m_size && index >= 0) {
        return m_elements[index];
    } else {
        // 越界处理
    }
}
```

三个必须注意的点：

1. **每个成员定义前都要重复写 `template <class T>`**；
2. **类名要写成 `Vector<T>`**（`Vector` 单独出现是不完整类型名）；
3. **返回类型 `T&` 写在 `Vector<T>::operator[]` 前面**，于是变成 `T& Vector<T>::operator[]`——这行看起来有点怪，但规则就是"返回类型 + 作用域限定的函数名"。

### 4.4 一个模板版的排序

```cpp
// 冒泡排序（课件自己也写了 "don't use it!"）
template <class T>
void Sort(Vector<T>& arr) {
    const size_t last = arr.size() - 1;
    for (int i = 0; i < last; i++)
        for (int j = last; j > i; j--) {
            if (arr[j] < arr[j - 1]) {
                Swap(arr[j], arr[j - 1]);
            }
        }
}
```

```cpp
Vector<int> vi(4);
vi[0] = 4; vi[1] = 3; vi[2] = 7; vi[3] = 1;
Sort(vi);        // 实例化 Sort(Vector<int>&)

Vector<string> vs(5);
vs[0] = "Fred"; vs[1] = "Wilma"; vs[2] = "Barney";
vs[3] = "Dino"; vs[4] = "Prince";
Sort(vs);        // 实例化 Sort(Vector<string>&)
```

> **NOTE: Sort uses `operator<` for comparison.**

这是一个关键的"隐式接口"（implicit interface）概念：

- 模板**不声明**"T 必须支持 `<`"；
- 但只要实例化时 `T` 没有 `<`，编译就失败；
- 所以模板对类型的要求是**隐式的、写在函数体里的**，而不是写在签名里的。

这就是模板报错往往"深不见底"的原因——错误发生在实例化的那一刻，而不是声明处。

---

## 5. 模板的进阶用法

### 5.1 多个类型参数

```cpp
template <class Key, class Value>
class HashTable {
    const Value& lookup(const Key&) const;
    void insert(const Key&, const Value&);
};
```

### 5.2 模板可以嵌套

> Templates nest —— they're just new types!

```cpp
Vector<Vector<double*> >    // 注意 `> >` 之间的空格
```

为什么要有空格？因为在 C++11 之前，`>>` 会被词法分析成**右移运算符**。C++11 之后这个问题被修复，`Vector<Vector<double*>>` 也能编译了，但老代码/老教材仍保留空格。

### 5.3 类型参数可以很复杂

```cpp
Vector<int (*)(Vector<double>&, int)>   // 元素是函数指针的 Vector
```

读法：`int (*)(Vector<double>&, int)` 是一个"接受 `Vector<double>&` 和 `int`、返回 `int`"的函数指针类型。把它当 `T` 塞进 `Vector` 完全合法。

---

## 6. 非类型参数（non-type parameters）

> Template arguments can be **constant expressions**.

```cpp
template <class T, int bounds = 100>
class FixedVector {
public:
    FixedVector();
    T& operator[](int);
private:
    T elements[bounds];   // 固定大小的数组！
};

template <class T, int bounds>
T& FixedVector<T, bounds>::operator[](int i) {
    return elements[i];   // 无越界检查
}
```

`int bounds` 不是类型，而是**编译期常量**——这是"非类型参数"（non-type parameter）。它还可以有**默认值**。

### 6.1 使用

```cpp
FixedVector<int, 50> v1;
FixedVector<int, 10 * 5> v2;   // 常量表达式也可以
FixedVector<int> v3;           // 使用默认值 bounds = 100
```

注意 `FixedVector<int, 50>` 与 `FixedVector<int, 100>` 是**两个不同的类型**——非类型参数参与类型标识。

### 6.2 代价与收益（课件的总结很中肯）

| 优点 | 缺点 |
| --- | --- |
| **Can make code faster**（数组大小编译期已知，可优化、可放栈上） | **Makes code more complicated**（`bounds` 这个参数要出现在所有地方：声明、定义、使用） |
| 无动态分配 | **Can lead to (even more) code bloat**（每个 bounds 都生成一份代码） |

> **"Embedding sizes not necessarily a good idea."**

现代 C++ 的折中是 `std::array<T, N>` 和 `std::vector<T>` 并存：想要栈上固定大小用前者，想要灵活性用后者。

---

## 7. 模板与继承

三种组合都可以：

```cpp
// 1. 模板继承非模板
template <class A>
class Derived : public Base { };

// 2. 模板继承模板
template <class A>
class Derived : public List<A> { };

// 3. 非模板继承模板
class SupervisorGroup : public List<Employee*> { };
```

第 3 种在实际代码里很常见：把一个具体类型的容器"固定"成一个具名类，从而获得一个正常（非模板）的类型。

---

## 8. CRTP：奇异递归模板模式

> **The Curiously Recurring Template Pattern (CRTP)**

```cpp
template <class T>
class Base {
    // ...
};

class Derived : public Base<Derived> {   // 把自己作为模板参数传给基类
    // ...
};
```

**"奇异"在哪？** 派生类在继承列表里，把自己（还没定义完的类型）当作模板实参传给基类。C++ 允许这么做，因为基类模板的实例化被推迟到需要时。

### 8.1 用途：在泛型编程里"模拟虚函数"

```cpp
template <class T>
class Base {
public:
    void interface() {
        static_cast<T*>(this)->implementation();   // 静态分派！
    }
    static void static_func() {
        T::static_sub_func();
    }
};

class Derived : public Base<Derived> {
public:
    void implementation();
    static void static_sub_func();
};
```

关键在 `static_cast<T*>(this)->implementation()`：

- `this` 的静态类型是 `Base<T>*`，但实际对象是 `Derived`；
- 因为 `T` 就是 `Derived`，`static_cast` 是**安全的向下转型**（编译器知道真实类型）；
- 于是调用被**静态解析**到 `Derived::implementation`，**没有 vtable、没有运行期开销**。

这叫 **static polymorphism**（静态多态）。对比：

| | 虚函数（dynamic polymorphism） | CRTP（static polymorphism） |
| --- | --- | --- |
| 决定时机 | 运行期 | 编译期 |
| 开销 | vptr + 间接跳转 | 零 |
| 能否内联 | 不能 | 能 |
| 灵活性 | 运行期可换实现 | 编译期固定 |
| 代码大小 | 一份 | 每个派生类一份 |

标准库里的 `std::enable_shared_from_this<T>` 就是 CRTP 的经典应用。

---

## 9. 模板中的 friend、static 与"放头文件"

### 9.1 friend 的两种写法

**写法一：在类内直接定义友元函数**

```cpp
template <typename T>
class MyClass {
    friend void myFunction(MyClass<T>& obj) {     // 每个 T 一个非模板友元
        std::cout << obj.privateData << std::endl;
    }
private:
    T privateData;
public:
    MyClass(T data) : privateData(data) {}
};
```

**写法二：让友元本身也是模板**

```cpp
template <typename T>
class MyClass {
    template <typename U>
    friend void myFunction(MyClass<U>& obj);      // 所有实例化共享一个友元模板
private:
    T privateData;
public:
    MyClass(T data) : privateData(data) {}
};

template <typename T>
void myFunction(MyClass<T>& obj) {
    std::cout << "Accessing private data: " << obj.privateData << std::endl;
}
```

区别很重要：第一种是"每个实例化都有自己的友元函数"，第二种是"一个友元模板管所有实例化"。写 `operator<<` 时通常用第一种。

### 9.2 为什么模板的定义要放头文件

> In general put the **definition and the declaration** for the template **in the header file**:
> - won't allocate storage for the class at that point
> - compiler/linker has mechanism for removing multiple definitions

这是 Ch.4 "头文件只放声明"的**唯一例外**，原因是：

- 模板**本身不生成代码**，只有实例化时才生成；
- 而实例化需要看到**完整定义**（否则编译器不知道 `T temp = x;` 里该生成什么指令）；
- 所以使用 `Swap<int>` 的那个 `.cpp` 必须能看到 `Swap` 的函数体 → 定义必须在头文件里。

那重复定义怎么办？编译器把模板实例化标记为"弱符号"（weak symbol），链接器自动去重。

C++11 之后还可以用**显式实例化**（explicit instantiation）来把定义放回 `.cpp`：

```cpp
// Vector.cpp
template class Vector<int>;      // 只实例化 int 版本
```

但这要求你事先知道所有会用到的类型，灵活性差，一般不用。

---

## 10. 写模板的推荐流程

课件的六步，非常工程化：

1. **Get a non-template version working first**（先让非模板版本跑通）；
2. **Establish a good set of test cases**（建立一组好测试）；
3. **Measure performance and tune**（测性能并调优）；
4. **Review implementation** —— *Which types should be parameterized?*（审视：哪些类型真该参数化）；
5. **Convert non-parameterized version into template**（改写成模板）；
6. **Test against established test cases**（用原来的测试验证）。

为什么先写非模板版？因为**模板的错误信息极难读**。先在一个具体类型上把逻辑调对，再泛化，可以避免"在模板里 debug"的噩梦。

---

## 11. 要点自检

1. 模板对比"复制代码/公共基类/void*列表"解决了什么问题？
2. `template <class T>` 中的 `class` 是什么意思？与 `typename` 有何区别？
3. 什么是实例化？function template 与 template function 的区别？
4. 为什么 `Swap(1, 2.0)` 编译失败？怎么修？
5. 重载决议中，模板与普通函数的优先级如何判定？
6. 类模板的成员在类外定义时，有哪些必须重复写的东西？
7. `Sort` 对 `T` 有什么要求？为什么这个要求没写在签名里？
8. `Vector<Vector<double*> >` 里的空格为什么必要？
9. 非类型参数的优缺点各是什么？
10. CRTP 如何实现"静态多态"？与虚函数对比如何？
11. 为什么模板的定义要放在头文件里，却不违反 ODR？

---

## 12. 易错点

- **以为模板会"运行时选择类型"** → 模板是编译期展开。
- **`Swap(1, 2.0)` 期待隐式转换** → 推导冲突，必须显式 `Swap<double>`。
- **类外定义成员忘记重复 `template <class T>`**。
- **类外定义写成 `Vector::` 而不是 `Vector<T>::`**。
- **在两个 `.cpp` 里各自用 `Vector<int>` 却把实现放在 `.cpp` 里** → 链接错误（找不到实例化）。
- **模板里 `T` 的接口要求靠"用"隐式表达**，报错点在使用处而非声明处，需要经验才能快速定位。
- **以为 `inline` 能解决模板重复定义** → 真正的原因是模板实例化的弱符号机制。

---

*上一篇：[[OOP/Chapter 10 Streams AI精讲|Chapter 10 Streams AI精讲]]　下一篇：[[OOP/Chapter 12 Iterators AI精讲|Chapter 12 Iterators AI精讲]]*
