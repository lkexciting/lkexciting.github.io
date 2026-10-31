---
title: Chapter 9 Overloaded Operators · AI 精讲
aliases:
  - OOP/notes/Chapter 9 Overloaded Operators AI精讲
---
# Chapter 9 Overloaded Operators：运算符重载

> 对应课件：`9_Overloaded_Operators_2025.pdf`（48 页）
> 关键词：operator overloading、member vs. free function、`operator=`、prefix/postfix `++`、conversion operator、`explicit`、四种 cast

---

## 0. 一句话本质

> **Overloaded operators: another way to make a function call.**

运算符重载不是"发明新语法"，它只是让**函数调用看起来像运算符**。`x + y` 本质上就是 `x.operator+(y)` 或 `operator+(x, y)`。

理解这一点，下面所有规则（哪个必须是成员、参数几个、返回什么）都能自己推出来。

**目的**：让**用户自定义类型（user-defined types）** 表现得像内置类型。

---

## 1. 能重载哪些运算符

```text
+  -  *  /  %  ^  &  |  ~
=  <  >  +=  -=  *=  /=  %=
^=  &=  |=  <<  >>  >>=  <<=  ==
!=  <=  >=  !  &&  ||  ++  --
,  ->*  ->  ()  []
new  new[]  delete  delete[]
```

### 1.1 不能重载的

```text
.   .*   ::   ?:
sizeof   typeid
static_cast   dynamic_cast   const_cast   reinterpret_cast
```

为什么不能？

| 运算符 | 原因 |
| --- | --- |
| `.` `.*` `->*` | 成员访问涉及语言核心语义，重载会打破对象模型 |
| `::` | 作用域解析是编译期的名字查找，不是运行期操作 |
| `?:` | 三目运算符有短路语义，函数调用无法模拟 |
| `sizeof` `typeid` | 编译期运算符 |
| 四种 cast | 类型转换语法本身，重载会自相矛盾 |

### 1.2 两条铁律

> - **Only existing operators can be overloaded**（不能发明 `**` 表示乘方）
> - **Preserve number of operands / preserve precedence**（保持操作数个数与优先级）

也就是说：不能把 `+` 重载成一元的，也不能让 `a + b * c` 变成 `(a + b) * c`。

### 1.3 成员指针（pointer to member）——顺带一提

课件在这里插了一个冷知识，因为 `.*` 和 `->*` 与它有关：

```cpp
class MyClass {
public:
    int data;
    void display() { cout << data << endl; }
};

int main() {
    MyClass obj;
    obj.data = 42;

    int MyClass::*ptrToData = &MyClass::data;            // 成员变量指针
    void (MyClass::*ptrToFunc)() = &MyClass::display;    // 成员函数指针

    cout << obj.*ptrToData << endl;      // 42
    (obj.*ptrToFunc)();                  // 调用 obj.display()
}
```

`&MyClass::data` 得到的不是绝对地址，而是"**相对于对象起始位置的偏移**"，所以它必须配合一个对象（`obj.*`）或对象指针（`p->*`）才能使用。这是 C++ 里唯一需要 `.*` 的场景，也是 `.*` 不能被重载的原因。

---

## 2. 两种实现形式

> Just a function with an operator name! Use the `operator` keyword as a prefix.

| 形式 | 写法 | 第一个参数 |
| --- | --- | --- |
| **成员函数** | `String String::operator+(const String& that);` | **隐式**（`this`） |
| **全局（自由）函数** | `String operator+(const String& l, const String& r);` | **显式** |

### 2.1 成员函数版

```cpp
class Integer {
public:
    Integer(int n = 0) : i(n) {}
    Integer operator+(const Integer& n) const {
        return Integer(i + n.i);
    }
private:
    int i;
};
```

```cpp
Integer x(1), y(5), z;
x + y;    // ====> x.operator+(y);
```

成员函数版的特点：

- **隐式第一个参数**（就是 `this`）；
- 开发者**必须有类的定义**（不然写不出成员函数）；
- 成员函数**对类内所有数据有完全访问权**；
- **对接收者（receiver）不做类型转换**：

```cpp
z = x + y;   // ✔
z = x + 3;   // ✔ 3 被转换成 Integer(3)，因为参数是 const Integer&
z = 3 + y;   // ✘ 3 不是 Integer，没法调用 3.operator+(y)
```

最后一行是关键限制：**成员函数的"左边"必须是该类对象，不能靠隐式转换得到**。

二元运算符作为成员只需**一个**参数；一元运算符作为成员**不需要**参数：

```cpp
Integer operator-() const { return Integer(-i); }   // 一元负号
z = -x;    // z.operator=(x.operator-());
```

### 2.2 全局函数版

```cpp
Integer operator+(const Integer& lhs, const Integer& rhs);
Integer x, y;
x + y;    // operator+(x, y);
```

特点：

- **第一个参数显式**；
- 不需要对类有特殊访问权；
- **可能需要声明为 friend**；
- **两个参数都参与类型转换**：

```cpp
z = x + y;   // operator+(x, y)
z = x + 3;   // operator+(x, Integer(3))
z = 3 + y;   // operator+(Integer(3), y)   ← 成员版做不到！
z = 3 + 7;   // Integer(10)  —— 根本不调用重载
```

这就是为什么"对称的二元运算符"通常写成全局函数：**只有全局版才能让 `3 + y` 工作**。

### 2.3 friend 版

```cpp
class Integer {
public:
    friend Integer operator+(const Integer&, const Integer&);
private:
    int i;
};

Integer operator+(const Integer& lhs, const Integer& rhs) {
    return Integer(lhs.i + rhs.i);   // 直接访问 private
}
```

如果不加 friend，全局函数就只能用公有接口（getter），有时会破坏封装或带来性能损失。

---

## 3. 成员 vs 自由函数：怎么选

课件的三条 tips：

> - **Unary operators should be members**（一元运算符做成员）
> - **`= () [] -> ->*` must be members**（这五个必须是成员）
> - **All other binary operators as non-members**（其余二元做非成员）

为什么这五个必须是成员？因为它们**必须作用于"对象本身"**，语言规定不能是自由函数：

| 运算符 | 原因 |
| --- | --- |
| `=` | 赋值必须修改左操作数本身，自由函数拿不到"左值引用" |
| `()` | 函数调用语义，必须绑定到对象 |
| `[]` | 下标必须返回引用才能 `v[i] = x` |
| `->` | 指针语义，必须递归解析 |
| `->*` | 同上 |

---

## 4. 参数与返回值的规范

### 4.1 参数传递

> - 只读参数用 **const 引用**（内置类型除外）
> - 不修改类的成员函数声明为 **const**（`==`、`+`、`-` 等）
> - 全局函数中，若**左操作数会被修改**，按**引用**传（如流插入器 `ostream&`）

### 4.2 返回值

> - `operator+` 需要生成一个新对象 → **按值返回**
> - 逻辑运算符返回 **`bool`**（老编译器返回 `int`）

课件有一句被标注为过时的建议：

> Return as a const object so the result cannot be modified as an lvalue.
> **（Modern C++ no longer recommends returning `const T` because it inhibits move semantics.）**

也就是说，早年建议 `const T operator+(...)` 以防止 `(a+b) = c;` 这种怪代码；但 C++11 之后，返回 `const T` 会**阻止移动语义**（编译器无法把临时对象"搬走"），性能受损。现代做法是：**返回 `T`（不加 const）**。

### 4.3 原型速查表

| 运算符类别 | 原型 |
| --- | --- |
| `+ - * / % ^ & \| ~` | `const T operator X(const T& l, const T& r);` |
| `! && \|\| < <= == >= >` | `bool operator X(const T& l, const T& r);` |
| `[]` | `E& T::operator[](int index);` |

---

## 5. `++` 与 `--`：前缀与后缀

难点：`i++` 和 `++i` 都是 `operator++`，怎么区分？

> **Postfix forms take an `int` argument** —— compiler will pass in 0 as that int.

```cpp
class Integer {
public:
    const Integer& operator++();      // prefix ++
    const Integer operator++(int);    // postfix ++
    const Integer& operator--();      // prefix --
    const Integer operator--(int);    // postfix --
};
```

那个 `int` 参数**只是个标记**，从不会被使用。

### 5.1 实现

```cpp
const Integer& Integer::operator++() {   // ++x
    *this += 1;      // increment
    return *this;    // 返回引用
}

// int 参数不使用，所以不命名，避免编译警告
const Integer Integer::operator++(int) { // x++
    Integer old(*this);   // fetch（先存旧值）
    ++(*this);            // increment（复用前缀版）
    return old;           // return（返回旧值的副本）
}
```

### 5.2 调用对应关系

```cpp
Integer x(5);
++x;   // calls x.operator++();
x++;   // calls x.operator++(0);
--x;   // calls x.operator--();
x--;   // calls x.operator--(0);
```

### 5.3 为什么前缀更高效

- **前缀**：改自己，返回引用（无拷贝）；
- **后缀**：先拷贝一份旧值，改自己，返回旧值副本（**一次拷贝构造**）。

> **User-defined prefix is more efficient than postfix.**

所以循环里写 `++i` 而不是 `i++`——对 `int` 无所谓，对迭代器/大对象差别明显（Ch.12 会再次强调）。

---

## 6. 关系运算符：只写两个，其余推导

课件给了非常优雅的写法：**用 `==` 定义 `!=`，用 `<` 定义其余全部**。

```cpp
bool Integer::operator==(const Integer& rhs) const { return i == rhs.i; }

bool Integer::operator!=(const Integer& rhs) const { return !(*this == rhs); }

bool Integer::operator<(const Integer& rhs) const { return i < rhs.i; }

bool Integer::operator>(const Integer& rhs) const { return rhs < *this; }

bool Integer::operator<=(const Integer& rhs) const { return !(rhs < *this); }

bool Integer::operator>=(const Integer& rhs) const { return !(*this < rhs); }
```

为什么这样做？

- **一致性**：只维护两个"原始定义"，其余五个自动保持一致；
- **不容易出错**：手写六份，很容易把 `<=` 写成 `>=`；
- 数学上，`<` 是**严格弱序**（strict weak ordering），其余关系都能从它推出。

（C++20 引入了 `<=>` 三路比较，可以一次生成全部六个，是这套思想的极致形态。）

---

## 7. `operator[]`

> - **Must be a member function**
> - **Single argument**
> - 暗示对象像数组，所以**应该返回引用**

```cpp
Vector v(100);
v[10] = 45;      // 需要返回引用才能赋值
```

如果返回指针，写法就变成 `*v[10] = 45;`——完全违背直觉。

标准写法：

```cpp
E&       T::operator[](int index);         // 非 const 版本
const E& T::operator[](int index) const;   // const 版本（必须成对提供）
```

**两个版本都要写**：const 对象只能调 const 版本，而它必须返回 const 引用（不能返回可写引用，否则 const 对象的内容就能被改了）。

---

## 8. 赋值运算符 `operator=`

### 8.1 先分清"拷贝"与"初始化"

```cpp
MyType b;
MyType a = b;   // 拷贝构造（Initialization）
a = b;          // 赋值运算符（Assignment）
```

这是全章最容易搞错的一点：**`=` 出现在定义里是初始化，出现在语句里是赋值**。

### 8.2 编译器自动生成

> The compiler will automatically create one if it's not explicitly provided. **Memberwise assignment.**

和默认拷贝构造一样：逐成员赋值。**对指针成员就是"拷地址"**，问题与 Ch.8 完全相同。

### 8.3 三条硬要求

1. **必须是成员函数**；
2. **返回 `*this` 的引用**，以支持链式赋值：

```cpp
A = B = C;      // 实际执行 A = (B = C);
```

3. **必须给所有数据成员赋值**（尤其是指针！）；
4. **必须检查自赋值**（self-assignment）。

### 8.4 标准骨架（建议背下来）

```cpp
T& T::operator=(const T& rhs) {
    // 检查自赋值
    if (this != &rhs) {
        // 执行赋值
        // ...
    }
    return *this;
}
```

课件特别标注：**"This checks address, not value (`*this != rhs`)"** —— 比较的是**地址**，不是内容。因为内容相等时跳过赋值也可能是错的（比如内部有指针，虽然值相等但指向不同内存）。

**为什么自赋值危险？** 典型的深拷贝赋值会先 `delete` 旧内存再 `new`：

```cpp
String& String::operator=(const String& rhs) {
    if (this != &rhs) {          // 若省掉这一行
        delete[] data;           // 先把自己的内存删了
        data = new char[strlen(rhs.data) + 1];  // rhs 就是自己！data 已被删
        strcpy(data, rhs.data);  // 读已释放内存 → 未定义行为
    }
    return *this;
}
```

### 8.5 阻止赋值

```cpp
// 旧写法：声明为 private（不必定义函数体）
class T {
private:
    T& operator=(const T&);
};

// C++11 推荐
class T {
public:
    T& operator=(const T&) = delete;
};
```

### 8.6 Rule of Three 再次出现

> **For classes with dynamically allocated memory declare an assignment operator (and a copy constructor).**

有动态内存 → 拷贝构造、赋值运算符、析构函数，三者都要写。这就是 Ch.8 那条规则的完整版。

---

## 9. `operator()`：仿函数（functor）

> A functor is an object that acts like a function.

```cpp
struct F {
    void operator()(int x) const {
        std::cout << x << "\n";
    }
};   // F is a functor

F f;
f(2);    // calls f.operator()(2)
```

仿函数的意义：**它既能像函数一样被调用，又能携带状态**。这让它能配合 STL 算法使用（Ch.12）：

```cpp
struct GreaterThan {
    int threshold;
    GreaterThan(int t) : threshold(t) {}
    bool operator()(int x) const { return x > threshold; }
};

std::count_if(v.begin(), v.end(), GreaterThan(10));
```

---

## 10. 值类（value classes）与类型转换

### 10.1 值类的特征

> - 看起来像基本数据类型
> - 可以按值传入/返回函数
> - 通常有重载运算符
> - 可以与其他类型互相转换
> - 例：`Complex`、`Date`

`Complex`（复数）是教科书式的例子：它需要 `+ - * /`、`==`、`<<`，还要能和 `double` 混算。

### 10.2 隐式转换的两条途径

编译器会用两种机制做**隐式转换**：

1. **单参数构造函数**（single-argument constructors）；
2. **隐式类型转换运算符**（implicit conversion operators）。

**途径一：单参数构造**

```cpp
class PathName {
    string name;
public:
    PathName(const string&);   // 单参数（或其余参数有默认值）
};

string abc("abc");
PathName xyz(abc);   // OK：显式构造
xyz = abc;           // OK：abc => PathName（隐式转换后赋值）
```

注意第二行：`xyz = abc` 之所以能编译，是因为 `abc` 先被隐式转换成一个临时 `PathName`，再调用 `operator=`。**这种隐式转换常常带来意外**。

### 10.3 `explicit`：阻止隐式转换

```cpp
class PathName {
    string name;
public:
    explicit PathName(const string&);
};

string abc("abc");
PathName xyz(abc);   // OK
xyz = abc;           // error!
```

**规则**：单参数构造函数默认应加 `explicit`，除非你确实想要隐式转换（如 `std::string` 允许 `const char*` 隐式转换）。

**途径二：转换运算符**

```cpp
class Rational {
public:
    operator double() const {
        return numerator_ / (double)denominator_;
    }
};

Rational r(1, 3);
double d = 1.3 * r;   // r => double
```

一般形式：

```
X::operator T()
```

- 运算符名是**任意类型描述符**；
- **没有显式参数**；
- **没有返回类型**（返回类型就是 `T`）；
- 编译器会把它当作 `X → T` 的转换。

### 10.4 该不该用？

> **In general, be careful!** —— 会在函数被意外调用时引发大量问题。

课件的建议很明确：

> **Use explicit conversion functions.** Instead of the conversion operator, declare a member function:
> `double to_double() const;`

即：**优先写具名函数（`to_double()`），而不是转换运算符（`operator double()`）**。因为具名函数不会在你没意识到的时候被调用。

C++11 之后还可以用 `explicit operator bool()`（用于 `if (obj)` 这种场景），既保留便利又避免隐式转换到 `int` 的坑。

### 10.5 重载决议：最佳匹配 = 最便宜

> C++ checks each argument for a "best match". **Best match means cheapest.**
> - 精确匹配（exact match）——零成本
> - 涉及内置转换的匹配
> - 用户定义类型转换

当同时存在"构造函数转换"和"转换运算符"时，很容易出现**二义性**（ambiguity）。这就是为什么课件提醒 "See: TypeConversionAmbiguity.cpp"。

---

## 11. 什么时候该重载运算符

> **Just because you can overload an operator doesn't mean you should.**
> Overload operators when it makes the code **easier to read and maintain**.

判断标准：

| 该重载 | 不该重载 |
| --- | --- |
| 语义与内置运算一致（`Complex` 的 `+`） | 语义牵强（`Date + Date` 是什么意思？） |
| 让代码更好读（`v[i]`、`a + b`） | 让代码更晦涩（把 `<<` 重载成"删除元素"） |
| 值类（value class） | 实体类（entity class，如 `Employee`） |

---

## 12. 四种 cast（命名转换）

C 风格转换 `(Type)expr` 太模糊：它可能是"重解释指针""去 const""数值转换"，编译器不区分。C++ 提供四种**语义明确**的转换。

| 转换 | 用途 | 安全性 |
| --- | --- | --- |
| `static_cast<T>(e)` | 编译期可确定的类型转换 | 向上转型安全；**向下转型不检查** |
| `dynamic_cast<T>(e)` | 运行期检查的向下转型 | 安全（失败返回 `nullptr`），需 RTTI |
| `const_cast<T>(e)` | 增删 `const`/`volatile` | 只在对"本来不是 const"的对象上才安全 |
| `reinterpret_cast<T>(e)` | 指针 ↔ 整数、比特级重解释 | 最危险，几乎总是实现定义 |

### 12.1 `static_cast`

```cpp
char a = 'a';
int b = static_cast<int>(a);              // 数值转换

double *c = new double;
void *d = static_cast<void*>(c);          // 指针到 void*

int e = 10;
const int f = static_cast<const int>(e);  // 加 const，OK

const int g = 20;
int *h = static_cast<int*>(&g);           // ERROR：static_cast 不能去掉 const
```

危险用法（**向下转型不检查**）：

```cpp
class A { public: virtual void test() {} };
class B : public A { public: virtual void test() {} };

A *pA1 = new B();
B *pB = static_cast<B*>(pA1);   // downcast，不安全！
```

如果 `pA1` 实际指向的不是 `B`，`static_cast` 不会报错，你会得到一个"看起来像 B 的野指针"。

### 12.2 `dynamic_cast`

> checks whether a downcast of object pointer is **safe**.

```cpp
A *pA1 = new B();
B *pB = dynamic_cast<B*>(pA1);   // safe downcast，成功

C *pC = dynamic_cast<C*>(pA1);   // 不是同一继承体系，返回 nullptr
```

- 失败时**返回 `nullptr`**（对引用则抛 `bad_cast` 异常）；
- **要求基类有虚函数**（依赖 RTTI，靠 vtable 实现）；
- 有运行期开销。

### 12.3 `const_cast`

```cpp
const int g = 20;
int *h = const_cast<int*>(&g);        // 语法正确

const int g2 = 20;
int &h2 = const_cast<int&>(g2);       // 语法正确

const char *s = "hello";
char *t = const_cast<char*>(s);       // 语法正确
```

**注意**：语法正确 ≠ 行为正确。如果 `g` 本身定义成 `const`（可能在只读段），通过 `h` 写入就是**未定义行为**。`const_cast` 只在"对象本来不是 const，只是通过 const 指针/引用被看到"时才安全。

### 12.4 `reinterpret_cast`

```cpp
int a, b;
int *pA = &b;
a = reinterpret_cast<int>(pA);      // 指针 → 整数
pA = reinterpret_cast<int*>(a);     // 整数 → 指针

b = reinterpret_cast<int>(a);       // Error：不能用于同类型非指针之间
```

用于**指针与整数之间**（或完全不同类型的指针之间）的比特级重解释。除了底层编程（驱动、序列化），几乎不该用。

---

## 13. 要点自检

1. 为什么说"运算符重载只是另一种函数调用"？由此能推出哪些规则？
2. 哪些运算符必须是成员函数？为什么？
3. 成员版 `operator+` 为什么不能支持 `3 + y`？
4. 前缀 `++` 与后缀 `++` 如何区分？为什么前缀更高效？
5. 为什么只要写 `==` 和 `<` 就能推出其余四个关系运算符？
6. `operator[]` 为什么要返回引用？为什么 const/non-const 两个版本都要写？
7. `operator=` 的三条硬要求是什么？自赋值检查为什么要比较地址？
8. 单参数构造函数为什么默认该加 `explicit`？
9. `static_cast` 与 `dynamic_cast` 在向下转型上的区别？
10. 四种 cast 各自的适用场景与危险点？

---

## 14. 易错点

- **`MyType a = b;` 以为是赋值** → 实际是拷贝构造。
- **`operator=` 忘了返回 `*this`** → 链式赋值 `a = b = c` 报错。
- **忘记自赋值检查** → `delete` 了自己正在读的内存。
- **`operator[]` 返回指针而非引用** → `v[i] = x` 编译不过。
- **只写了非 const 的 `operator[]`** → const 对象无法下标访问。
- **`static_cast` 做向下转型** → 不检查，可能得到野指针。
- **返回 `const T` 的 `operator+`** → 阻止移动语义（现代 C++ 不推荐）。
- **`explicit` 用反了**：本意是"允许隐式转换"，却加了 `explicit`；或者本意是"禁止"，却忘了加。

---

*上一篇：[[OOP/Chapter 8 Copy Constructor AI精讲|Chapter 8 Copy Constructor AI精讲]]　下一篇：[[OOP/Chapter 10 Streams AI精讲|Chapter 10 Streams AI精讲]]*
