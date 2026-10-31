---
title: Chapter 7 Polymorphism · AI 精讲
aliases:
  - OOP/notes/Chapter 7 Polymorphism AI精讲
---
# Chapter 7 Polymorphism：多态

> 对应课件：`7_Polymorphism_2025.pdf`（31 页）
> 关键词：upcast、dynamic binding、virtual function、vptr、vtable、virtual destructor、override、abstract class、pure virtual、interface class

---

## 0. 本章要回答的唯一问题

第 6 章末尾留下了一个尴尬：

```cpp
Employee* ep = &pete;   // pete 其实是 Manager
ep->print(cout);        // 却打印了 Employee 的版本
```

**为什么"看到了派生类对象，却调用了基类的函数"？怎么让它调用派生类的版本？**

答案就是多态：`virtual` + 动态绑定（dynamic binding）。这一章会从"概念 → 语法 → 内存实现 → 陷阱"四层讲清楚。

---

## 1. 从绘图程序说起

需求：画圆（Circle）、矩形（Rectangle）、椭圆（Ellipse），每个都能 `render`（渲染）、`move`（移动）、`resize`（缩放），并且都有 `center`（中心点）。

![概念模型：Shape 为父类，Rectangle/Ellipse 为子类，Square/Circle 再往下](OOP/images/Chapter%207%20Polymorphism%20AI%E7%B2%BE%E8%AE%B2/ch7-p04-04.webp)

课件对这张图的解读（非常"设计导向"）：

- 椭圆**是一个**形状（an ellipse is a shape）；
- 圆**是一种特殊的**椭圆（a circle is a special kind of ellipse）；
- 矩形**是另一种**形状；
- 三者**共享**共同的属性（attributes）与服务（services）；
- 但三者**并不相同**（not identical）。

最后一条是关键：共享 → 用继承提取公共部分；不相同 → 用虚函数保留差异。

> 图下还有一句提醒：**"Deriving Circle from Ellipse may be a poor design choice!"**
> 为什么？因为 `Ellipse` 有 `setMajorAxis` / `setMinorAxis` 这类操作，`Circle` 继承后如果允许单独改长轴，圆就不再是圆了——它破坏了 `Circle` 的不变量。这说明"概念上 is-a"不等于"代码上该继承"。这和第 6 章的 Square/Rectangle 是同一类问题。

---

## 2. 基类 Shape 与虚函数

```cpp
class Point { /* (x,y) */ };

class Shape {
public:
    Shape();
    void move(const Point&);      // 非虚：行为对所有形状一样
    virtual void render();        // 虚：每个形状自己画
    virtual void resize();        // 虚：每个形状自己缩放
    virtual ~Shape();             // 虚析构：见第 6 节
protected:
    Point center;
};
```

**哪些该虚、哪些不该虚？** 判据是"实现是否会因子类而不同"：

- `move` 只是改 `center`，所有形状逻辑相同 → **非虚**（non-virtual）；
- `render` 每个形状画法不同 → **虚**；
- `resize` 每个形状缩放规则不同 → **虚**；
- 析构：会被继承，且要通过基类指针删除 → **必须虚**。

### 2.1 派生类

```cpp
class Ellipse : public Shape {
public:
    Ellipse(float major, float minor);
    virtual void render();          // 自己实现
protected:
    float major_axis, minor_axis;
};

class Circle : public Ellipse {
public:
    Circle(float radius) : Ellipse(radius, radius) {}
    virtual void render();
};
```

注意 `Circle` 的构造函数：把长轴和短轴都设成半径，**复用**了 `Ellipse` 的构造。这是继承带来的直接好处。

### 2.2 静态绑定 vs 动态绑定

```cpp
void render(Shape* p) {
    p->render();   // 调用"正确"的 render —— 对给定的 Shape
}

void func() {
    Ellipse ell(10, 20);
    ell.render();     // static  -- Ellipse::render();
    Circle circ(40);
    circ.render();    // static  -- Circle::render();

    render(&ell);     // dynamic -- Ellipse::render();
    render(&circ);    // dynamic -- Circle::render()
}
```

课件对 "binding"（绑定 = 决定调用哪个函数）的定义：

| 绑定方式 | 依据 | 什么时候决定 |
| --- | --- | --- |
| **Static binding**（静态绑定） | 变量的**声明类型** | 编译期 |
| **Dynamic binding**（动态绑定） | 对象的**真实类型** | 运行期 |

观察上例：

- `ell.render()` 直接用对象调用，编译器知道 `ell` 是 `Ellipse`，**静态绑定**即可；
- `render(&circ)` 里，`p` 的声明类型是 `Shape*`，但真实类型是 `Circle`，所以要**动态绑定**。

这就解释了一个非常常见的困惑：**同样一个 `render` 调用，写在 main 里是静态的，写在以 `Shape*` 为参数的函数里就是动态的**。差别在于"编译器掌握多少信息"。

### 2.3 多态的两个前提

课件把 Polymorphism 拆成两件事：

1. **Upcast**：把派生类对象当作基类对象使用（`Ellipse` can be treated as a `Shape`）；
2. **Dynamic binding**：按对象真实类型决定调用哪个函数。

缺一不可：没有 upcast，就没有"统一接口"；没有动态绑定，upcast 之后只能调用基类版本。

---

## 3. 虚函数是怎么实现的

### 3.1 非虚 vs 虚

| 非虚函数（non-virtual） | 虚函数（virtual） |
| --- | --- |
| 编译器生成**静态/直接调用**（call 到确定地址） | 可以在派生类中被**透明地覆盖**（transparently overridden） |
| **执行更快** | 对象携带"一包"虚函数（objects carry a pack of their virtual functions） |
| 无额外空间开销 | 编译器查表后**动态调用**正确函数（多一次间接跳转） |
| — | 若编译器在编译期就能确定目标，**仍可生成静态调用**（去虚化 devirtualization） |

### 3.2 内存布局：vptr 与 vtable

![Shape 对象：开头是 vptr，指向 Shape vtable](OOP/images/Chapter%207%20Polymorphism%20AI%E7%B2%BE%E8%AE%B2/ch7-p11-11.webp)

关键机制：

- 每个**含虚函数的类**，编译器为它生成一张 **vtable**（virtual table，虚函数表），表里按固定顺序存放各虚函数的地址；
- 每个**对象**的头部（或某个固定偏移）多出一个隐藏指针 **vptr**，指向它所属类的 vtable；
- 调用 `p->render()` 时，编译成"**取 `p->vptr`，从表中第 k 个槽取出函数地址，跳过去**"。

```
A Shape                     Shape vtable
+--------+                  +-----------------+
|  vptr  | ---------------> | Shape::~Shape() |
+--------+                  | Shape::render() |
| center |                  | Shape::resize() |
+--------+                  +-----------------+
```

### 3.3 派生类的表

![Ellipse 对象：vptr 指向 Ellipse vtable，render 已被替换](OOP/images/Chapter%207%20Polymorphism%20AI%E7%B2%BE%E8%AE%B2/ch7-p13-13.webp)

对比两个对象：

| | Shape 对象 | Ellipse 对象 |
| --- | --- | --- |
| 布局 | `vptr` + `center` | `vptr` + `center` + `major_axis` + `minor_axis` |
| vtable 槽 1 | `Shape::~Shape()` | `Ellipse::~Ellipse()` |
| vtable 槽 2 | `Shape::render()` | **`Ellipse::render()`** |
| vtable 槽 3 | `Shape::resize()` | **`Shape::resize()`** |

两个重要观察：

1. **槽的顺序完全一致**（都按基类声明的顺序）。正因为顺序一致，"取第 k 个槽"才能在任何派生类上都得到正确结果——这是整个机制成立的前提。
2. **只有真正覆盖的才换**。`Ellipse` 没重写 `resize`，槽里仍然是 `Shape::resize()`。这解释了"派生类不写 `resize` 也能用"——它继承的是基类实现。

再往上 `Circle` 重写了 `render` 和 `resize`，于是 `Circle` 的 vtable 里两项都换成 `Circle::*`。

### 3.4 代价

- **空间**：每个对象多一个 vptr（8 字节，64 位）；每个类多一张 vtable。
- **时间**：一次间接跳转（无法内联，对 CPU 分支预测不友好）。
- 这就是为什么 C++ 不默认把所有函数都做成虚的——"**不用的东西不付代价**"。

---

## 4. 切片的三种情形（极其重要）

### 4.1 按值赋值：切片（object slicing）

```cpp
Ellipse elly(20f, 40f);
Circle circ(60f);
elly = circ;        // ???
```

课件的分析：

- **`circ` 中多出来的部分（`area`）被切掉了**——只有"能塞进 `elly`"的那部分被拷贝；
- **`circ` 的 vptr 被忽略**，`elly` 的 vptr 仍指向 `Ellipse` vtable。

```cpp
(&elly)->render();   // Ellipse::render()  —— 不是 Circle！
```

这叫**对象切片**：派生类对象被赋值给基类对象时，派生类那部分信息永久丢失。**多态在值语义下必然失效。**

### 4.2 指针赋值：不切片，但会泄漏

```cpp
Ellipse *elly = new Ellipse(20f, 40f);
Circle  *circ = new Circle(60f);
elly = circ;           // 指针赋值，类型不同但 C++ 允许（Circle* → Ellipse* 是 upcast）
```

后果（课件原文）：

- "the original Ellipse for elly is lost..."（原来那个 Ellipse 对象丢了 → **内存泄漏**）
- "elly and circ point to the same Circle object!"（两个指针指向同一个对象）
- `elly->render();` 打印 **`Circle::render()`** —— 因为 vptr 来自真实对象。

这同时演示了"按指针操作能保留多态"和"裸指针容易泄漏"两件事。

### 4.3 引用参数：表现与指针一致

```cpp
void func(Ellipse& elly) {
    elly.render();
}

Circle circ(60f);
func(circ);   // Circle::render() 被调用
```

> **References act like pointers.**

引用不产生新对象，所以不会切片，动态绑定照常生效。

**结论（务必记住）**：**多态只在"指针或引用"上成立，按值传递/赋值一定切片。**

---

## 5. 虚析构函数（virtual destructor）

```cpp
Shape *p = new Ellipse(100.0f, 200.0f);
// ...
delete p;    // 调用哪个析构？
```

课件给的答案很硬：

> If `Shape::~Shape()` is **not** virtual, **only** `Shape::~Shape()` will be invoked!

后果：`Ellipse` 的析构函数不会执行，`Ellipse` 里申请的资源（如果有）全部泄漏。

修法：

> Must declare `Shape::~Shape()` **virtual**, and it will call `Ellipse::~Ellipse()` implicitly.

```cpp
class Shape {
public:
    virtual ~Shape();     // 一行救全部
};
```

**规则**：只要一个类**可能被继承，并且可能通过基类指针删除派生类对象**，它的析构函数就必须是 `virtual`。

反过来，如果一个类**不打算被继承**（比如工具类），可以用 `final`（C++11）或非虚析构来表达"别继承我"。

---

## 6. 覆盖（overriding）与 `override` 关键字

```cpp
class Base {
public:
    virtual void func();
};

class Derived : public Base {
public:
    void func() override;   // 明确表示"我在覆盖 Base::func()"
};
```

`override`（C++11）本身不改变行为，它是**给编译器的断言**：如果基类里没有匹配的虚函数，编译就报错。

为什么需要它？因为一个经典事故：

```cpp
class Base {
public:
    virtual void func() const;   // 注意 const
};
class Derived : public Base {
public:
    void func();                 // 忘了 const → 这是"新函数"，不是覆盖！
};
```

没有 `override` 时，这段代码**能编译通过**，而且行为是"多态悄悄失效"。加上 `override` 后，编译器会立刻告诉你"没有可覆盖的函数"。

**现代 C++ 规范：覆盖虚函数一定写 `override`。**

### 6.1 调用链上的复用

```cpp
void Derived::func() {
    cout << "In Derived::func()!";
    Base::func();      // 显式调用基类版本
}
```

> This is a common way to add new functionality. **No need to copy the old stuff!**

这就是"扩展而不重复"的标准写法：派生类只写"增量"，公共逻辑通过 `Base::` 复用。Ch.6 的 `Manager::print` 也是同样套路。

### 6.2 返回类型放宽（return type relaxation）

若 `D` public 继承 `B`，则 `D::f()` 可以返回**比 `B::f()` 更"派生"的类型**，但**仅限指针和引用**。

```cpp
class Expr {
public:
    virtual Expr* newExpr();
    virtual Expr& clone();
    virtual Expr  self();
    Expr self2();
};

class BinaryExpr : public Expr {
public:
    virtual BinaryExpr* newExpr();   // ok：指针可以"收窄"
    virtual BinaryExpr& clone();     // ok：引用可以"收窄"
    virtual BinaryExpr  self();      // Error！返回值类型不协变
    BinaryExpr self2();              // ok —— 但这不是覆盖，是"新函数"（名字隐藏）
};
```

原因：返回值类型是函数签名的一部分，如果是**按值**返回，`BinaryExpr` 和 `Expr` 是不同类型，无法"兼容"；而指针/引用可以靠"派生类指针可隐式转基类指针"来兼容。

（这一特性叫 covariant return type，早期编译器支持不好，课件特意标注 "In most compilers now"。）

---

## 7. 重载与虚函数的互动

```cpp
class Base {
public:
    virtual void func();
    virtual void func(int);     // 重载
};

class Derived : public Base {
public:
    virtual void func() { Base::func(); }   // 只覆盖了无参版本
    virtual void func(int) { /* ... */ }    // 必须也覆盖这个
};
```

课件规则：

> **If you override an overloaded function, you should override all of the variants!**
> Can't override just one. If you don't override all, some will be hidden (when static binding occurs).

原因还是第 6 章的**名字隐藏**：派生类一旦声明了 `func`，基类所有同名重载就"看不见"了。所以：

- 想用哪个重载，就得覆盖哪个；
- 或者写 `using Base::func;` 把基类重载拉回来。

注意：**`virtual` 不改变名字查找规则**，它只改变"调用哪份实现"。名字查找仍然按作用域由内向外、找到即停。

---

## 8. 四条高频陷阱（课件 Tips）

### 8.1 永远不要重定义一个继承来的**非虚**函数

> Non-virtuals are **statically bound**. No dynamic dispatch!

```cpp
class Base { public: void f(); };
class Derived : public Base { public: void f(); };   // 灾难

Derived d;
Base* p = &d;
p->f();      // 调 Base::f()
d.f();       // 调 Derived::f()
```

同一个对象，两种行为——取决于你用什么类型看它。这种"精神分裂"是最难 debug 的 bug 之一。要么基类函数是虚的，要么别重定义。

### 8.2 永远不要重定义继承来的**默认参数值**

> They're **statically bound** too! And what would it mean?

```cpp
class Base {
public:
    virtual void f(int x = 1);
};
class Derived : public Base {
public:
    void f(int x = 2) override;
};

Derived d;
Base* p = &d;
p->f();    // 调 Derived::f，但默认参数用的是 Base 的 1！
```

**默认参数是静态绑定的，函数体是动态绑定的**。于是"用哪个默认值"和"执行哪份代码"来自两个不同的类。这种设计没有任何合理语义，标准里也称之为"令人困惑"，所以规则就是：**别改默认参数**。

### 8.3 构造函数/析构函数里调虚函数

```cpp
class A {
public:
    A() { f(); }              // 你以为会调到 B::f()
    virtual void f() { cout << "A::f()"; }
};

class B : public A {
public:
    B() { f(); }
    void f() { cout << "B::f()"; }
};

B b;   // 输出：A::f() 然后 B::f()
```

为什么第一次是 `A::f()`？因为**基类构造时，派生类部分还不存在**，vptr 还指向 `A` 的 vtable。C++ 明确规定：构造/析构期间，虚调用只解析到"当前正在构造/析构的那一层"。

推论：

- **不要在构造函数里调用虚函数**（它一定不是你想要的多态）；
- 同理，**不要在析构函数里调用虚函数**；
- 需要"构造后初始化"的逻辑，用一个显式的 `init()`，或用两阶段构造（Ch.13 会讲）。

### 8.4 析构函数不虚 → 见第 5 节

---

## 9. 抽象类（abstract base class）

### 9.1 纯虚函数（pure virtual function）

```cpp
class Shape {
public:
    Shape();
    virtual void render() = 0;   // 纯虚：只有接口，没有实现
    void move(const Point&);
    virtual void resize();
protected:
    Point center;
};
```

`= 0` 就是"纯虚"的标记。

规则：

- **抽象类不能被实例化**（cannot be instantiated）；
- 必须派生新类，**并为所有纯虚函数提供定义**，那个派生类才能被实例化。

```cpp
Shape s;          // Error：抽象类
class Circle : public Shape {
public:
    void render() override { /* ... */ }
};
Circle c;         // OK
```

### 9.2 为什么需要抽象类

| 理由 | 说明 |
| --- | --- |
| **Modeling**（建模） | "形状"这个概念本身没有具体画法，它只存在于抽象层 |
| **Force correct behavior**（强制正确行为） | 派生类**必须**实现 `render`，否则编译不过——把"约定"变成"编译期检查" |
| **Define interface without implementation** | 只定义"能做什么"，不规定"怎么做" |

什么时候用？

- **信息不足**（not enough information is available）——不知道具体怎么画；
- **面向接口继承设计**（designing for interface inheritance）。

### 9.3 纯虚函数可以有函数体

标准允许纯虚函数**有定义**（在类外），只是仍然不能实例化该类。派生类可以显式调用 `Shape::render()` 来复用默认行为。这个冷知识在某些框架里会用到。

---

## 10. 协议类 / 接口类（protocol / interface class）

定义（课件的四条，非常严格）：

1. **所有非静态成员函数都是纯虚的**，除了析构函数；
2. **虚析构函数，函数体为空**；
3. **没有任何非静态成员变量**（自己定义的、继承来的都不行）；
4. 可以包含静态成员。

```cpp
class CDevice {
public:
    virtual ~CDevice() {}

    virtual int read(...)  = 0;
    virtual int write(...) = 0;
    virtual int open(...)  = 0;
    virtual int close(...) = 0;
    virtual int ioctl(...) = 0;
};
```

为什么第 3 条要求"没有数据成员"？因为接口类的唯一职责是**描述能力**，不含状态。一旦带了状态，就变成"抽象基类"而不是"接口"，也就在实现细节上和派生类耦合了。

这就是 C++ 版本的"interface"（Java 的 `interface`、C# 的 `interface`）：**多重继承 + 纯虚 = 协议**。这个用法在 Ch.16（多重继承）里还会出现，因为它是 MI 唯一被广泛认可的正当用途。

---

## 11. 要点自检

1. 静态绑定与动态绑定的判据分别是什么？
2. 多态必须同时满足哪两个条件？
3. 画出 `Shape` 与 `Ellipse` 对象的内存布局，说明 vptr 与 vtable 的关系。
4. 为什么 vtable 里槽的顺序必须与基类一致？
5. 对象切片发生在什么场景？为什么指针/引用不会切片？
6. 虚析构函数不写会怎样？规则是什么？
7. `override` 关键字解决什么问题？
8. 为什么不要在构造函数里调用虚函数？
9. 抽象类与接口类的区别是什么？
10. 覆盖一个重载函数时，为什么必须覆盖全部变体？

---

## 12. 易错点汇总

- **默认参数是静态绑定的**，与虚函数机制不一致 → 永远不要改默认参数值。
- **构造/析构期间虚调用退化为当前层** → 不要在构造/析构中调虚函数。
- **按值传递基类参数会切片** → 多态必须用 `T*` 或 `T&`。
- **基类析构不虚 + 通过基类指针 delete** → 派生类析构不执行。
- **忘了 `override`**，函数签名差一个 `const` 就变成"隐藏"而非"覆盖"，编译器不报错。
- **重写一个重载只写一个变体** → 其余变体被隐藏。

---

*上一篇：[[OOP/Chapter 6 Composition and Inheritance AI精讲|Chapter 6 Composition and Inheritance AI精讲]]　下一篇：[[OOP/Chapter 8 Copy Constructor AI精讲|Chapter 8 Copy Constructor AI精讲]]*
