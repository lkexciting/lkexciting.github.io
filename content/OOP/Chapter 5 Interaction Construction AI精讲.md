---
title: Chapter 5 Interaction Construction · AI 精讲
aliases:
  - OOP/notes/Chapter 5 Interaction Construction AI精讲
---
# Chapter 5 Interaction Construction：对象交互与构造

> 对应课件：`5_Interaction_Construction_2025.pdf`（69 页）
> 关键词：message、encapsulation、abstraction、modularization、constructor、destructor、initializer list、`this`、const member function、inline

---

## 0. 本章解决三个问题

1. **对象之间怎么协作？** —— 消息（message）、封装、抽象、模块化。
2. **对象怎么生、怎么死？** —— 构造函数（constructor）与析构函数（destructor），初始化列表。
3. **对象内部怎么表达"我"？** —— `this` 指针，const 成员函数。
4. （附加）**函数调用的代价怎么省？** —— `inline`。

这一章是整门课从"会用类"到"会写类"的转折点。后面 Ch.8 的拷贝构造、Ch.13 的异常安全，都建立在"构造/析构是成对的、且必须被保证"这个基础上。

---

## 1. 对象交互：发消息

> Objects send and receive messages (objects do things!)

消息的三要素：

- **由发送者组成**（composed by the sender）—— 发送者决定要调用谁、传什么；
- **由接收者解释**（interpreted by the receiver）—— 同一个消息名在不同类里可以有不同实现（这就是多态）；
- **由方法实现**（implemented by methods）—— 消息最终落地为成员函数调用。

消息的两种效果：

- **可能返回值**（may return results）；
- **可能改变接收者的状态，即副作用**（side effects）。

> 重要认知：**"调用一个函数"在 OOP 里叫"发一条消息"**。这不只是换词——它把注意力从"我调用什么代码"转向"我请求谁来做"，于是接收者可以换（换实现、换子类），发送者的代码不用改。

### 1.1 封装（Encapsulation）的三层含义

课件给了三句，层层递进：

1. **把数据与操作这些数据的方法捆绑在一个对象里**（bundle data and methods together）；
2. **隐藏数据和动作的细节**（hide the details）；
3. **访问权限只给公开的方法**（restrict access only to the publicized methods）。

注意第三句：封装的重点不是"有个 private 关键字"，而是**外界只能通过你公开的那扇门进来**。所以：

```cpp
class Account {
public:
    void deposit(double amount);      // 公开的门
    double balance() const;           // 公开的门
private:
    double money_;                    // 里面，谁都别碰
    void audit();                     // 内部琐事，不对外
};
```

如果一个类把所有成员都写成 `public`，再加一堆 getter/setter 把每个字段原样暴露，那叫"**用 class 关键字包装的 struct**"，封装是假的。

### 1.2 抽象（Abstraction）与模块化（Modularization）

- **Abstraction**：忽略局部的细节，把注意力放在更高层的问题上。
- **Modularization**：把一个整体切成**定义良好**的部分，这些部分可以**单独构建和检验**，并且以**定义良好的方式**交互。

这两句是软件工程的基石。判断一个模块切得好不好，就看三件事：能不能单独编译、能不能单独测试、接口是否清晰。

### 1.3 案例：时钟显示（Clock display）

需求：显示形如 `11:03` 的时钟。

有两种模块化方案：

1. 做一个 4 位数字的显示器（一个整体）；
2. 做**两个 2 位数字的显示器**，一个显示小时、一个显示分钟。

![时钟显示：11:03](OOP/images/Chapter%205%20Interaction%20Construction%20AI%E7%B2%BE%E8%AE%B2/ch5-p07-07.webp)

第二种方案更好，理由是"变化"：

- 小时是 0–23 循环，分钟是 0–59 循环——**进位规则不同**；
- 想改成 12 小时制，只需换小时那一半；
- 想加秒，只需再加一个 `NumberDisplay`。

于是识别出两个类：

![类图：ClockDisplay 组合了两个 NumberDisplay](OOP/images/Chapter%205%20Interaction%20Construction%20AI%E7%B2%BE%E8%AE%B2/ch5-p10-10.webp)

类图（class diagram）的读法：

- 方框分三层：类名 / 属性 / 方法；
- `-` 表示 private，`+` 表示 public；
- `-hours : NumberDisplay` 表示"私有属性 hours，类型是 NumberDisplay"；
- 从 `ClockDisplay` 指向 `NumberDisplay` 的箭头表示**组合/拥有**（has-a）关系。

```cpp
class NumberDisplay {
    int limit;      // 上限（24 或 60）
    int value;      // 当前值
public:
    // 构造函数与方法省略
};

class ClockDisplay {
    NumberDisplay hours;      // 注意：这里是"对象成员"，不是指针
    NumberDisplay minutes;
public:
    // 构造函数与方法省略
};
```

**这是一个极重要的伏笔**：`ClockDisplay` 里直接放了两个 `NumberDisplay` 对象（而不是指针），意味着：

- `ClockDisplay` 一旦被创建，两个 `NumberDisplay` 必须一起被创建；
- 它们的析构由编译器自动完成；
- `ClockDisplay` 的构造函数必须负责给它们传参。

这就是 Ch.6 组合（composition）与构造顺序的来源。

---

## 2. 构造与析构

### 2.1 从 `init()` 到构造函数

第 4 章的写法是：

```cpp
Point a;
a.init(1, 2);
a.move(2, 2);
a.print();
```

问题：**`Point a;` 之后、`a.init()` 之前，这个对象是"未初始化"的**。如果中间有人调用了 `a.print()`，输出的是垃圾值。更糟的是，你可能忘写 `init()`。

构造函数的解决方案（课件原文）：

> If a class has a constructor, the compiler **automatically** calls that constructor at the point an object is created, **before client programmers can get their hands on the object**.

关键短语："before client programmers can get their hands on the object"——在你拿到对象之前，构造已经完成了。这叫**保证初始化（guaranteed initialization）**。

```cpp
class X {
    int i;
public:
    X();          // 构造函数：名字与类名相同，无返回类型
};

void f() {
    X a;          // 这里自动调用 X::X()，即 a.X();
}
```

要点：

- 构造函数**没有返回类型**（连 `void` 都不写）；
- 名字与类名相同；
- **不能手动调用**（`a.X()` 这种写法在 C++ 里不合法，编译器才会调）。

### 2.2 带参构造

```cpp
class Tree {
public:
    Tree(int i) { /* ... */ }
};

Tree t(12);       // 调用 Tree::Tree(int)
```

构造函数可以有参数，用来**指定对象怎么被创建**、给它初始值。

### 2.3 默认构造函数（default constructor）

> A default constructor is one that can be called with **no arguments**.

两种形态：

```cpp
class A { public: A(); };              // 显式无参
class B { public: B(int x = 0); };     // 所有参数都有默认值，也能无参调用
```

`B` 的构造函数**也是默认构造函数**——判据是"能否无参调用"，不是"参数表是否为空"。这是常见考点。

### 2.4 析构函数（destructor）

> In C++, cleanup is as important as initialization and is therefore guaranteed with the destructor.

```cpp
class Y {
public:
    ~Y();        // 名字 = 类名前加 ~，永不带参数
};
```

- 名字是类名前加 `~`；
- **永远没有参数**（所以不能重载）；
- 编译器在对象**离开作用域**时自动调用；
- 课件的一句妙语："**The only evidence for a destructor call is the closing brace of the scope that surrounds the object.**"（析构函数唯一的"证据"，就是包围这个对象的那对花括号的右括号。）

```cpp
void f() {
    X a;        // 构造
    // ...
}               // ← 这里析构 a
```

### 2.5 存储分配与构造时机

> The compiler allocates all the storage for a scope at the opening brace of that scope. The constructor call doesn't happen until the sequence point where the object is defined.

翻译：**内存在进入作用域时就一次性分配好了，但构造函数要等到对象定义那一行才执行**。

```cpp
void f() {
    // 进入这里时，栈空间已经为 a、b 预留
    if (cond) {
        X a;      // 只有走到这一行，才构造 a
    }
    X b;          // 只有走到这一行，才构造 b
}
```

这个区别解释了一个常见困惑："为什么对象没构造却不崩？"——因为它只是"预留了空间"，还没有对象。也解释了为什么 `goto` 跳过带初始化的变量定义是非法的（会破坏"构造/析构成对"）。

### 2.6 聚合初始化（aggregate initialization）

```cpp
int a[5] = {1,2,3,4,5};
int b[6] = {5};                     // 其余元素补 0
int c[] = {1,2,3,4};                // 大小由初始化列表决定：sizeof(c)/sizeof(*c)

struct X { int i; float f; char c; };
X x1 = {1, 2.2, 'c'};
X x2[3] = { {1, 1.1, 'a'}, {2, 2.2, 'b'} };   // 第三个元素零初始化
```

**一旦有用户定义的构造函数，就要用构造函数的形式**：

```cpp
struct Y {
    float f;
    int i;
    Y(int a);
};

Y y1[] = { Y(1), Y(2), Y(3) };   // 显式构造
Y y2[2] = { Y(1) };              // 第二个元素？→ 需要默认构造函数！
```

课件连续四页逐步追问，就是要引出这个结论：

| 代码 | 是否合法 |
| --- | --- |
| `Y y1[] = { Y(1), Y(2), Y(3) };` | 合法（每个元素都显式给了实参） |
| `Y y2[2] = { Y(1), Y(2) };` | 合法 |
| `Y y2[2] = { Y(1) };` | **不合法**（第二个元素需要默认构造，但 Y 只有 `Y(int)`） |
| `Y y3[7];` | **不合法**（7 个元素都要默认构造） |
| `Y y4;` | **不合法**（需要默认构造） |

**规则**：只要用户声明了任何构造函数，编译器就**不再**提供默认构造函数。想同时支持 `Y(int)` 和 `Y y;`，就自己写 `Y(int a = 0)` 或额外写 `Y()`。

### 2.7 "auto" 默认构造函数

> If you have a constructor, the compiler ensures that construction always happens.
> **If (and only if) there are no constructors for a class, the compiler will automatically create one for you.**

"if and only if"（当且仅当）四个字要划重点：

- **没有任何构造函数** → 编译器生成一个空的默认构造函数；
- **已有任意构造函数** → 编译器不生成。

而且要注意：**编译器生成的那个默认构造函数什么也不做**，内置类型成员不会初始化！

```cpp
class P { int x; int y; };   // 无构造函数
P p;                          // x、y 是垃圾值！
```

这一点与 Java 不同，是 C++ 的高频坑。

---

## 3. 初始化：初始化列表（initializer list）

### 3.1 为什么需要它

```cpp
class Point {
private:
    const float x, y;      // const 成员
public:
    Point(float xa, float ya) : y(ya), x(xa) {}   // 只能用初始化列表
};
```

`const` 成员（以及引用成员）**必须在初始化列表里初始化**，因为它们不能被"赋值"，只能被"初始化"。

### 3.2 初始化列表的地位

- 可以初始化任何类型的数据；
- 对内置类型，相当于"伪构造函数调用"（pseudo-constructor calls）；
- 不需要在构造函数体内再赋值；
- **初始化顺序由声明顺序决定，不是列表顺序**；
- **析构顺序与初始化顺序相反**。

第二条尤其坑人：

```cpp
class A {
    int m_a;
    int m_b;
public:
    A(int v) : m_b(v), m_a(m_b + 1) {}   // 危险！
};
```

你以为先初始化 `m_b` 再算 `m_a`，实际上 `m_a` 先被初始化（因为声明顺序是 `m_a` 在前），此时 `m_b` 还是垃圾值。**编译器通常会警告 `-Wreorder`**，务必重视。

### 3.3 初始化 vs 赋值（initialization vs. assignment）

```cpp
Student::Student(string s) : name(s) {}    // 初始化：在构造函数体之前完成
Student::Student(string s) { name = s; }   // 赋值：在构造函数体内完成
```

差别是实质性的：

| | 初始化列表 | 构造函数体内赋值 |
| --- | --- | --- |
| 时机 | 进入函数体之前 | 进入函数体之后 |
| 过程 | 直接构造 `name` | 先默认构造 `name`，再 `operator=` |
| 要求 | 无 | **成员类型必须有默认构造函数** |
| 性能 | 一次构造 | 一次构造 + 一次赋值 |

第二行是关键：如果 `name` 的类型（比如 `const string`，或某个没有默认构造函数的类）没有默认构造函数，"在体内赋值"的版本根本编译不过。

**结论**：能用初始化列表就用初始化列表。这不仅是性能问题，更是**可行性问题**。

### 3.4 C++11 的成员直接初始化（member init）

```cpp
class Point {
    int x = 0;       // 声明处给默认值
    int y = 0;
public:
    Point() = default;
    Point(int a, int b) : x(a), y(b) {}
};
```

好处：**对所有构造函数都生效**，不用在每个构造函数里重复写。缺点：如果某个构造函数在列表里也写了同一个成员，列表优先。

---

## 4. 字段 vs 形参 vs 局部变量

这三者的区分，是"读懂一个成员函数"的基本功。

```cpp
int TicketMachine::refundBalance() {
    int amountToRefund;      // 局部变量
    amountToRefund = balance;// balance 是字段
    balance = 0;
    return amountToRefund;
}
```

- `amountToRefund` 的生命周期 = 一次函数调用；
- `balance` 的生命周期 = 整个对象的生命周期，它构成对象的**状态**。

课件追问："**But how is the access to balance achieved?**"（`balance` 是怎么被访问到的？）答案是 `this->balance`——下一节就讲。

### 4.1 字段（field）

- 定义在构造函数和方法之外；
- 用来存储**贯穿对象整个生命周期**的数据，即对象当前状态；
- **类作用域**（class scope）：整个类内任何构造函数/方法都能用。

### 4.2 三者对照表

| | 字段 field | 形参 formal parameter | 局部变量 local variable |
| --- | --- | --- | --- |
| 定义位置 | 类内、函数外 | 函数头 | 函数体内 |
| 生命周期 | 与对象相同 | 一次调用 | 一次调用（或所在块） |
| 作用域 | 整个类 | 该函数 | 定义它的块 |
| 初值 | 由构造函数决定（可能未初始化） | 由调用者传入 | **必须自己初始化，没有默认值** |
| 是否持久 | 是（保存状态） | 否（临时） | 否（临时） |

两条高频错误：

1. **局部变量与字段同名，会遮蔽（shadow）字段**：

```cpp
void TicketMachine::setBalance(int balance) {
    balance = balance;    // 自己赋给自己！字段没被改
}
```

修法：`this->balance = balance;` 或者改参数名。

2. **局部变量不初始化就是垃圾值**，而字段的初始化责任在构造函数。

---

## 5. `this`：隐藏的参数

核心句：

> `this` is a hidden parameter for all member functions, with the type of the struct.

```cpp
void Point::print()
// 可以看作
void Point::print(Point *this)
```

```cpp
Point a;
a.print();
// 可以看作
Point::print(&a);
```

所以在成员函数内部，`this` 是**指向"调用这个函数的那个对象"的指针**：

- 它是所有成员函数的一个"天然局部变量"；
- **你不能定义它，但可以直接使用它**；
- 它的类型是 `Point*`，在 const 成员函数里是 `const Point*`。

三种典型用途：

```cpp
// 1. 解决同名遮蔽
void setColor(int color) { this->color = color; }

// 2. 返回自身，支持链式调用
Point& move(int dx, int dy) { x += dx; y += dy; return *this; }

// 3. 判断自赋值（Ch.9 赋值运算符）
String& operator=(const String& rhs) {
    if (this == &rhs) return *this;
    // ...
}
```

**为什么 `this` 是理解一切成员函数的基础？** 因为它解释了：

- 为什么成员函数能访问成员变量（有 `this`）；
- 为什么 `const` 成员函数不能改成员（`this` 是 `const T*`）；
- 为什么静态成员函数不能访问非静态成员（**没有 `this`**）。

---

## 6. const 对象与 const 成员函数

### 6.1 问题

```cpp
const Currency the_raise(42, 38);
```

一个 const 对象，**哪些成员函数可以访问它的内部**？又怎么保证它不被改？

### 6.2 答案：把"安全"的成员函数声明为 const

```cpp
void Date::set_day(int d) {
    day = d;        // ok：非 const 函数，可以改
}

int Date::get_day() const {
    return day;     // ok：只读
}
```

const 成员函数的约束（比你想的更严）：

```cpp
int Date::get_day() const {
    day++;          // ERROR：修改数据成员
    set_day(12);    // ERROR：调用非 const 成员函数
    return day;     // OK
}
```

即：**const 成员函数不能改任何（非 mutable 的）数据成员，也不能调用任何非 const 成员函数**。

原理就是第 5 节说的：在 const 成员函数里，`this` 的类型是 `const Date*`，通过 `const` 指针当然改不了东西。

### 6.3 使用规则

1. **声明和定义都要写 `const`**：

```cpp
int get_day() const;              // 声明
int get_day() const { return day; }  // 定义
```

只写一处会变成两个不同的函数（声明与定义不匹配 → 链接错误），这是新手常犯的错。

2. **不改数据的成员函数都应该声明为 const**。
3. const 成员函数是可以被 const 对象调用的"通行证"。

```cpp
// 非 const 对象
Date when(1, 1, 2001);
int day = when.get_day();     // OK
when.set_day(13);             // OK

// const 对象
const Date birthday(12, 25, 1994);
int day = birthday.get_day(); // OK
birthday.set_day(14);         // Error
```

一句话总结：**const 对象只能调用 const 成员函数**。

### 6.4 类中的常量成员

```cpp
class A {
    const int i;    // 必须在构造函数的初始化列表里初始化
};
```

### 6.5 类中的编译期常量

```cpp
class HasArray {
    const int size;
    int array[size];   // ERROR：size 不是编译期常量
};
```

为什么错？因为 `const int size;` 是"每个对象一份"的常量，它的值要到构造时才确定，编译器没法用它定数组大小。

两种修法：

```cpp
// 方案一：static const（每个类一份，不是每个对象一份）
class HasArray {
    static const int size = 100;
    int array[size];   // OK
};

// 方案二：匿名 enum hack（老代码常见）
class HasArray {
    enum { size = 100 };
    int array[size];   // OK
};
```

C++11 之后更推荐 `static constexpr int size = 100;`。注意 `static` 成员在 C++17 前还需要在 `.cpp` 里给一个定义（`const int HasArray::size;`），否则取地址时会链接失败。

---

## 7. inline 函数

### 7.1 函数调用的开销

课件列了四步：

- push parameters（压参数）
- push return address（压返回地址）
- prepare return values（准备返回值）
- pop all pushed（弹出所有压栈内容）

对 `int f(int i) { return i*2; }` 这种"一行函数"，调用的开销比函数体本身还大。

### 7.2 inline 的思想

> An inline function is **expanded in place**, like a preprocessor macro in C, so the overhead of the function call is eliminated.

```cpp
// 原始
inline int f(int i) { return i*2; }

int main() {
    int a = 4;
    int b = f(a);
}
```

```cpp
// 展开后（概念上）
int main() {
    int a = 4;
    int b = a * 2;
}
```

注意 `a + a` 是课件示例中宏展开的语义（对 `i*2` 而言是 `a*2`），但关键点是：**函数体被原地插入到调用点**。

### 7.3 inline 比宏好在哪

```cpp
inline int safe(int i) { return i >= 0 ? i : -i; }
#define unsafe(i) ((i) >= 0 ? (i) : -(i))

int f();

int main() {
    ans = safe(x++);     // x++ 只执行一次
    ans = unsafe(x++);   // x++ 可能执行两次！
    ans = safe(f());     // f() 只调用一次
    ans = unsafe(f());   // f() 可能调用两次！
}
```

宏是**文本替换**，参数被替换多次就会求值多次；inline 函数是**真正的函数**，参数只求值一次，而且**会做类型检查**。所以课件说 "Much safer than macro. It checks the types of the parameters, and has no dangerous side effect."

### 7.4 inline 的工程规则

| 规则 | 说明 |
| --- | --- |
| 定义放头文件 | inline 函数的"定义"必须放在头文件里，被 include 到每个使用它的编译单元 |
| 不会生成代码 | "An inline function definition may not generate any code in .obj file" |
| 本质是声明 | 它更像"声明"而不是"定义"，所以**不怕重复定义**（多个编译单元各有一份是合法的） |
| 类内定义自动 inline | 任何直接写在类声明里的函数都自动是 inline |

```cpp
class Cup {
    int color;
public:
    int getColor() { return color; }              // 自动 inline
    void setColor(int color) { this->color = color; }  // 自动 inline
};
```

### 7.5 代价与选择

> **gains speed at the expenses of space**（以空间换时间）。

代码膨胀（code bloat）的代价是真实的：如果 inline 一个大函数被调用 100 处，可执行文件就多 100 份代码，还会挤爆指令缓存（I-cache）。

| 适合 inline | 不适合 inline |
| --- | --- |
| 2–3 行的小函数 | 超过 20 行的大函数 |
| 被频繁调用（如循环体内） | 递归函数（无法真正展开） |

### 7.6 "Inline may not in-line"

> The compiler **does not have to** honor your request.

原因：函数太大、函数递归、或者该编译器根本没实现这个特性。

而且课件给了一个非常现代的观点：

> Nowadays, the keyword `inline` for functions comes to mean "**multiple definitions are permitted**" rather than "inlining is preferred".

也就是说，今天 `inline` 的**语言语义**是"允许在多个编译单元中出现相同定义"（这是为了头文件里放函数定义），而"是否真的展开"完全交给优化的编译器。现代编译器在开 `-O2` 时，会自动把该内联的函数内联，不管你有没有写 `inline`。

### 7.7 减少 clutter（noise）

课件提到 "in situ"（拉丁语"原地"）：成员函数直接写在类里虽然方便，但会让接口变脏。

```cpp
// 干净的做法：类里只放声明，定义放 .cpp（除了极小的访问函数）
class Point {
public:
    void move(int dx, int dy);   // 只声明
    int x() const;
private:
    int x_, y_;
};
```

判断标准：**"接口宣言"应该一眼能看完**。如果类里塞满函数体，读代码的人就找不到重点。

---

## 8. 参数与返回值的类型选择

### 8.1 入口（way in）

| 形式 | 语义 |
| --- | --- |
| `void f(Student i);` | 在 `f` 内部**新建一个对象**（拷贝） |
| `void f(Student *p);` | 传地址；不改的话应加 `const` |
| `void f(Student& i);` | 传引用；不改的话应加 `const` |

### 8.2 出口（way out）

| 形式 | 语义 |
| --- | --- |
| `Student f();` | 返回时**新建一个对象** |
| `Student* f();` | **它该指向什么？**（谁负责释放？） |
| `Student& f();` | **它该引用什么？**（不能返回局部变量！） |

后两个的问号就是全部的坑。

### 8.3 一个"艰难的决定"

```cpp
char *foo() {
    char *p;
    p = new char[10];
    strcpy(p, "something");
    return p;          // 谁负责 delete？
}

void bar() {
    char *p = foo();
    printf("%s", p);
    delete p;          // 这里 delete 了，但 foo 的调用者可能不知道
}
```

问题：`foo` 分配、`bar` 释放——**所有权（ownership）没有写进接口**。只要有一个调用者忘了 delete，就是内存泄漏；如果有两个调用者都 delete，就是 double free。

课件的建议：**"Better to ask user to take resp., pass pointers in & out"**（让使用者承担分配责任，把指针传进去再传出来）。也就是"**谁调用，谁提供缓冲区**"：

```cpp
void foo(char* buf, size_t n);   // 调用者提供空间
```

这与现代 C++ 的做法一致：用 `std::string` / `std::vector` / 智能指针表达所有权，而不是裸 `new`。

### 8.4 六条 tip（强烈建议背下来）

1. **Pass in an object if you want to store it.**（要存下来就按值传，让它成为你的副本）
2. **Pass in a const pointer or reference if you want to get the values.**（只读取值就传 const 指针/引用）
3. **Pass in a pointer or reference if you want to do something to it.**（要修改它就传指针/引用）
4. **Pass out an object if you create it in the function.**（函数里创建的对象，按值返回）
5. **Pass out pointer or reference of the passed in only.**（只能返回"传进来的东西"的指针或引用，不能返回局部变量的）
6. **Never `new` something and return the pointer.**（永远不要 new 完把指针返回出去）

第 6 条在 C++11 之后可以放宽一点：返回 `std::unique_ptr` 是安全的（所有权明确），但"裸指针 + new"依然是禁忌。

---

## 9. 要点自检

1. 消息的三个组成要素是什么？"副作用"指什么？
2. 构造函数为什么能做到"保证初始化"？
3. 析构函数什么时候被调用？为什么说"唯一证据是右花括号"？
4. 编译器什么时候会自动生成默认构造函数？"当且仅当"的条件是什么？
5. 初始化列表和构造函数体赋值的三点区别？
6. 成员初始化顺序由什么决定？写错顺序会有什么后果？
7. `this` 在 const 成员函数里的类型是什么？这解释了哪些限制？
8. 为什么 inline 函数的定义要放头文件，却不违反"头文件只放声明"的原则？
9. 六个参数/返回值 tip 分别对应什么场景？

---

## 10. 易错点

- **`const int size; int a[size];` 编译不过**——`const` 成员不是编译期常量，要用 `static const` / `enum` / `constexpr`。
- **构造函数写成 `void X()`**——加了返回类型就变成普通函数，对象根本没构造。
- **默认构造函数的判据错**：`B(int x = 0)` 也算默认构造函数。
- **成员初始化顺序**：按声明顺序，不按列表顺序。
- **const 成员函数只在一个地方写 const** → 声明与定义不匹配。
- **在类内定义的大函数**默认 inline，会造成代码膨胀（虽然编译器可能拒绝）。
- **返回局部变量的引用**是最常见的未定义行为之一。

---

*上一篇：[[OOP/Chapter 4 Class AI精讲|Chapter 4 Class AI精讲]]　下一篇：[[OOP/Chapter 6 Composition and Inheritance AI精讲|Chapter 6 Composition and Inheritance AI精讲]]*
