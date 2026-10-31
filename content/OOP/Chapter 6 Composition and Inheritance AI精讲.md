---
title: Chapter 6 Composition and Inheritance · AI 精讲
aliases:
  - OOP/notes/Chapter 6 Composition and Inheritance AI精讲
---
# Chapter 6 Composition and Inheritance：组合与继承

> 对应课件：`6_Composition_and_Inheritance_2025.pdf`（60 页）
> 关键词：composition（has-a）、inheritance（is-a）、embedded object、name hiding、access protection、upcasting、substitution

---

## 0. 两种复用代码的方式

写新类时，最省力的方法是**复用已有的类**。C++ 提供两条路：

| | Composition（组合） | Inheritance（继承） |
| --- | --- | --- |
| 关系 | **has-a**（有一个） | **is-a**（是一个） |
| 做法 | 用已有对象拼出新对象 | 克隆已有类，再加/改 |
| 复用的是什么 | 实现（implementation） | 接口 + 实现 |
| 例子 | 汽车 has-a 引擎、轮胎 | 学生 is-a 人 |
| 耦合度 | 低（可随时换零件） | 高（父类改了子类受影响） |

一句话原则：**"有一个"用组合，"是一个"用继承**。判断错了，后面全是麻烦。

---

## 1. 组合（Composition）

> Composition: construct new object with existing objects. It is the relationship of **has-a**.

汽车由引擎（engine）和轮胎（tyre）组成——这就是组合。

### 1.1 包含的两种方式

| 方式 | 写法 | 特点 |
| --- | --- | --- |
| **完全包含**（fully / by value） | `Engine e;` | 对象是"身体的一部分"，同生共死 |
| **按引用包含**（by reference / by pointer） | `Engine* e;` | 允许**共享**（sharing），可以指向别人 |

课件强调 "Inclusion by reference allows sharing"：指针/引用成员可以让多个对象共享同一个子对象。

### 1.2 例子：Employee

一个 `Employee` **有**：

- Name（名字）
- Address（地址）
- Health Plan（医保方案）
- Salary History（薪资历史）—— 一组 `Raise` 对象的集合
- **Supervisor**（主管）—— **另一个 Employee 对象！**

最后一条很有意思：Employee has-a Employee。这是**自引用**结构（链表、树都是这样），所以必须用**指针**（`Employee*`），否则一个 Employee 的内存里要装另一个 Employee，无限递归，大小无法确定。

```cpp
class HealthPlan { /* ... */ };
class SalaryHistory { /* ... */ };

class Employee {
private:
    std::string name;
    std::string address;
    HealthPlan healthPlan;
    std::vector<SalaryHistory> salaryHistories;
    Employee* supervisor;   // 可以为 nullptr（没有主管）
public:
    Employee(const std::string& name, const std::string& address)
        : name(name), address(address), supervisor(nullptr) {}

    void addSalaryHistory(const SalaryHistory& history) {
        salaryHistories.push_back(history);
    }
    std::vector<SalaryHistory> getSalaryHistories() const { return salaryHistories; }

    void setSupervisor(Employee* sup) { supervisor = sup; }
    Employee* getSupervisor() const { return supervisor; }

    ~Employee() {}
};
```

注意几个细节：

- `supervisor` 用指针，因为"可能没有主管"（`nullptr`），而且"共享"同一个人；
- `salaryHistories` 用 `vector`，因为数量不定；
- `getSalaryHistories()` 返回**按值**（一份拷贝）。如果改成返回引用，调用者就能改内部数据——这是一个典型的封装权衡。

### 1.3 例子：SavingsAccount（嵌入式对象）

```cpp
class Person { /* ... */ };
class Currency { /* ... */ };

class SavingsAccount {
public:
    SavingsAccount(const char* name, const char* address, int cents);
    ~SavingsAccount();
    void print();
private:
    Person m_saver;      // 嵌入式对象（embedded object）
    Currency m_balance;
};
```

关键在构造函数怎么写：

```cpp
SavingsAccount::SavingsAccount(const char* name, const char* address, int cents)
    : m_saver(name, address),     // 用初始化列表给子对象传参
      m_balance(0, cents)
{}

void SavingsAccount::print() {
    m_saver.print();
    m_balance.print();
}
```

### 1.4 嵌入式对象必须被初始化

> **All embedded objects must be initialized.**
> The default constructor is called if you don't supply the arguments, and there is a default constructor (or one can be built).

初始化列表的语法：

```
name( args ) [':' init-list] '{'
```

- 任意多个对象，用逗号分隔；
- 可省略（省略则调用默认构造）；
- 用来给"子构造函数"（sub-constructor）传参。

### 1.5 一个"不明显的问题"

课件给出了**错误**的实现，非常值得警惕：

```cpp
// 错误写法：假设 Person/Currency 有 set 系列函数
SavingsAccount::SavingsAccount(const char* name, const char* address, int cents) {
    m_saver.set_name(name);
    m_saver.set_address(address);
    m_balance.set_cents(cents);
}
```

为什么错？因为**进入函数体之前，`m_saver` 和 `m_balance` 已经被"默认构造"了**。你只是给它们重新赋值，而不是初始化它们。

后果：

- 多了一次无谓的默认构造 + 赋值（性能损失）；
- 如果 `Person` / `Currency` **没有默认构造函数**，这段代码**根本编译不过**；
- 如果它们有 `const` 成员或引用成员，也编译不过。

这就是第 5 章"初始化 vs 赋值"的延伸：**子对象的初始化只能靠初始化列表**。

### 1.6 public 还是 private 嵌入？

| 嵌入方式 | 效果 |
| --- | --- |
| **private**（常见） | 子对象是"实现细节"；新类只暴露一部分旧类的公有接口 |
| **public** | 新类**完整继承**（暴露）子对象的公有接口 |

```cpp
class SavingsAccount {
public:
    Person m_saver;   // 公开嵌入
    // ...
};

SavingsAccount account;
account.m_saver.set_name("Fred");   // 直接访问子对象
```

课件说：私有嵌入是常态，因为"子对象是底层实现的一部分，新类只应该有选择地暴露接口"。公开嵌入相当于"手动组合接口"，容易破坏封装——如果你想要"完整接口"，通常该考虑**继承**或**私有继承**。

---

## 2. 继承（Inheritance）

> Inheritance is to take the existing class, **clone it**, and then make additions and modifications to the clone. It is the relationship of **is-a**.

三个层面理解继承：

1. **语言实现技术**（language implementation technique）；
2. **OO 设计方法论的重要组成**；
3. 允许共享**成员数据、成员函数、接口**的设计。

### 2.1 案例：DoME（Database of Multimedia Entertainment）

需求：存储 CD 和 DVD 的信息，支持录入、搜索、打印列表。

- **CD**：title（专辑名）、artist（艺术家）、numberOfTracks（曲目数）、playingTime（时长）、gotIt（是否拥有）、comment（评论）
- **DVD**：title、director（导演）、playingTime、gotIt、comment

### 2.2 第一版：两个独立的类

```java
public class Database {
    private ArrayList<CD> cds;
    private ArrayList<DVD> dvds;
}
public void addCD(CD theCD)  { cds.add(theCD); }
public void addDVD(DVD theDVD){ dvds.add(theDVD); }

public void list() {
    for (CD cd : cds) { cd.print(); System.out.println(); }
    for (DVD dvd : dvds) { dvd.print(); System.out.println(); }
}
```

课件对这个设计的批评只有两条，但都很致命：

> **Code duplication**（代码重复）
> - CD 和 DVD 类非常相似（大部分代码相同）
> - 使维护困难、工作量翻倍
> - 因维护不当而引入 bug 的风险
> - `Database` 类里也有重复

追问："**如果还要加新的媒体类型呢？**"（VideoGame、BoardGame……）每加一种，`Database` 里就要再加一个容器 + 一个 add 方法 + 一段 list 循环。这是 O(n) 的扩展成本，且必然有人漏改。

### 2.3 第二版：抽出父类 Item

![重构前后：从"Database 直接依赖 CD/DVD"到"两者共同继承 Item"](OOP/images/Chapter%206%20Composition%20and%20Inheritance%20AI%E7%B2%BE%E8%AE%B2/ch6-p30-30.webp)

方案：

- 定义一个超类（superclass）`Item`，放公共属性；
- `CD`、`DVD` 成为子类（subclass），各自加自己的属性。

```
        Item
  title
  playingTime
  gotIt
  comment
  setComment / getComment / setOwn / getOwn / print

   CD                    DVD
 artist                director
 numberOfTracks        getDirector
 getArtist
 getNumberOfTracks
```

于是 `Database` 只需一份代码：

```java
public void addItem(Item theItem) { items.add(theItem); }

public void list() {
    for (Item item : items) {
        item.print();            // 一行搞定 CD 和 DVD
        System.out.println();
    }
}
```

注意这里已经埋了 Ch.7 的伏笔：`item.print()` 到底调 `CD::print` 还是 `DVD::print`？在 Java 里自动是多态；**在 C++ 里必须把 `print` 声明为 `virtual` 才是多态**，否则永远调 `Item::print`。这是 C++ 与 Java 的重要差异。

再看 p30 那张图的右半边：`Database` 依赖 `Item`，`CD`/`DVD` **继承** `Item`（空心三角箭头指向父类）。左边是"Database 同时依赖两个具体类"，右边是"只依赖一个抽象概念"——**依赖方向从"多个具体"变成了"一个抽象"**，这就是解耦。

### 2.4 更深的层次

![继承层次（inheritance hierarchy）：Animal → Mammal/Bird → ...](OOP/images/Chapter%206%20Composition%20and%20Inheritance%20AI%E7%B2%BE%E8%AE%B2/ch6-p31-31.webp)

继承可以有多层：

```
Item
 ├── CD
 ├── DVD
 └── Game
      ├── VideoGame
      └── BoardGame
```

### 2.5 继承的优点（课件列出四条）

1. **Avoiding code duplication**（避免重复）
2. **Code reuse**（代码复用）
3. **Easier maintenance**（易维护）
4. **Extendibility**（可扩展）

### 2.6 术语对照

| 视角 | 上层 | 下层 |
| --- | --- | --- |
| 关系 | Base Class（基类） | Derived Class（派生类） |
| 层次 | Super / Parent | Sub / Child |

`Employee` → `Manager`：Employee 是基类，Manager 是派生类。

---

## 3. 继承的写法与构造顺序

### 3.1 基类

```cpp
class Employee {
public:
    Employee(const std::string& name, const std::string& ssn);
    const std::string& get_name() const;
    void print(std::ostream& out) const;
    void print(std::ostream& out, const std::string& msg) const;
protected:
    std::string m_name;
    std::string m_ssn;
};

Employee::Employee(const string& name, const string& ssn)
    : m_name(name), m_ssn(ssn)
{
    // 初始化列表就把值设好了！
}
```

这里第一次出现 `protected`：**既能被子类访问，又不对外公开**。为什么不用 `private`？因为 `Manager::title_name()` 里要访问 `m_name`。

### 3.2 派生类

```cpp
class Manager : public Employee {
public:
    Manager(const std::string& name,
            const std::string& ssn,
            const std::string& title);
    const std::string title_name() const;
    const std::string& get_title() const;
    void print(std::ostream& out) const;
private:
    std::string m_title;
};
```

### 3.3 派生类的构造函数

> **Think of inherited traits as an embedded object.** Base class is mentioned by class name.

也就是说：**基类子对象就像一个"没有名字的成员"**，必须在初始化列表里构造它，用**类名**（不是成员名）来调用：

```cpp
Manager::Manager(const std::string& name,
                 const std::string& ssn,
                 const std::string& title = "")
    : Employee(name, ssn), m_title(title)   // 基类在前，成员在后
{
}
```

三条铁律：

1. **基类总是先被构造**（Base class is always constructed first）；
2. **如果没有给基类传参，就会调用基类的默认构造函数**（若基类没有默认构造函数 → 编译错误）；
3. **析构顺序与构造顺序完全相反**（Destructors are called in exactly the reverse order）。

所以完整的构造顺序是：

```
基类 → 成员（按声明顺序）→ 派生类构造函数体
```

析构顺序：

```
派生类析构函数体 → 成员（逆序）→ 基类
```

### 3.4 派生类成员函数

```cpp
inline void Manager::print(std::ostream& out) const {
    Employee::print(out);      // 显式调用基类版本
    out << m_title << endl;
}

inline const std::string& Manager::get_title() const { return m_title; }

inline const std::string Manager::title_name() const {
    return string(m_title + ": " + m_name);   // 直接访问基类的 protected 成员
}
```

`Employee::print(out)` 这种**限定调用**（qualified call）是"我想用父类那份实现"的明确表达。不加 `Employee::` 会无限递归。

### 3.5 使用时的类型规则

```cpp
Employee bob("Bob Jones", "555-44-0000");
Manager  bill("Bill Smith", "666-55-1234", "ImportantPerson");

string name  = bill.get_name();   // okay —— Manager 继承了 Employee
string title = bob.get_title();   // Error —— bob 只是 Employee！
```

**规则**：派生类拥有基类的全部接口；基类**没有**派生类的接口。

```cpp
bob.print(cout);
bob.print(cout, "Employee:");
bill.print(cout);
bill.print(cout, "Employee:");   // Error —— hidden!
```

最后一行报错，就是下一节的名字隐藏。

---

## 4. 名字隐藏（Name Hiding）

> **If you redefine a member function in the derived class, all other overloaded functions in the base class are inaccessible.**

这是 C++ 里最反直觉的规则之一。

`Employee` 有两个 `print` 重载：

```cpp
void print(std::ostream& out) const;
void print(std::ostream& out, const std::string& msg) const;
```

`Manager` 里只重新定义了**一个**：

```cpp
void print(std::ostream& out) const;
```

结果：**`Manager` 作用域里的 `print` 把基类所有同名函数都"遮蔽"了**，于是 `bill.print(cout, "Employee:")` 找不到匹配，编译错误。

为什么？因为 C++ 的名字查找是**先找名字、再匹配重载**：在 `Manager` 的作用域里找到了 `print`，查找就停止了，不会再去 `Employee` 里找其他重载。

两种修法：

```cpp
// 修法一：把基类的重载也"拉"进来
class Manager : public Employee {
public:
    using Employee::print;          // 让基类所有 print 可见
    void print(std::ostream& out) const;
};

// 修法二：全部重新定义一遍（不推荐，重复代码）
```

课件留了一句："We'll see how the keyword `virtual` affects function overloading next time." —— 下一章会说明：**`virtual` 不影响名字查找规则**，隐藏照样发生。

---

## 5. 什么不会被继承

| 项目 | 说明 |
| --- | --- |
| **构造函数** | 不继承。编译器合成的构造函数按"逐成员"初始化；显式写拷贝构造时，**必须显式调用基类的拷贝构造**，否则会调用基类默认构造 |
| **析构函数** | 不继承（但会被自动调用） |
| **赋值运算符 `operator=`** | 不继承。合成的 `operator=` 逐成员赋值；自己写 `operator=` 时**必须显式调用基类的 `operator=`** |
| **private 数据** | 被隐藏，但**仍然存在于对象中**（只是访问不到） |

这三条（构造、析构、赋值）正是 Ch.8 和 Ch.9 的核心：**一旦类里有指针成员，就必须自己写这三个，而且一旦有继承，就必须在它们里面照顾基类**。

```cpp
// 拷贝构造：必须显式叫基类
Manager::Manager(const Manager& rhs)
    : Employee(rhs),        // 不能省！否则调用 Employee() 默认构造
      m_title(rhs.m_title) {}

// 赋值：必须显式叫基类
Manager& Manager::operator=(const Manager& rhs) {
    if (this != &rhs) {
        Employee::operator=(rhs);   // 不能省！
        m_title = rhs.m_title;
    }
    return *this;
}
```

---

## 6. 访问控制

### 6.1 `class` 与 `struct` 的唯一区别

> **class defaults to private；struct defaults to public.**

仅此而已。习惯上：`struct` 用于"纯数据聚合"，`class` 用于"有不变量的抽象"。

### 6.2 三种成员访问级别

| 级别 | 谁能访问 |
| --- | --- |
| `public` | 所有客户（clients） |
| `protected` | 本类 + 派生类（+ friends） |
| `private` | 只有本类（+ friends） |

### 6.3 三种继承方式

```cpp
class Derived : public Base    ...
class Derived : protected Base ...
class Derived : private Base   ...
```

### 6.4 继承如何影响访问（重点表）

设 `B` 继承自 `A`：

| 继承方式 \ 基类成员 | public | protected | private |
| --- | --- | --- | --- |
| `:public A` | public in B | protected in B | **不可访问** |
| `:private A` | **private in B** | private in B | 不可访问 |
| `:protected A` | **protected in B** | protected in B | 不可访问 |

读法：**取"更严格"的那一个**。public 继承保持原样，protected 继承最多到 protected，private 继承一律变 private。

实践：**99% 的情况用 `public` 继承**。`private` 继承是"用继承实现组合"（implementation inheritance），现代 C++ 更推荐直接用组合。

### 6.5 作用域与访问

| 说明符 | 同类内 | 派生类内 | 类外 |
| --- | --- | --- | --- |
| `private` | 是 | 否 | 否 |
| `protected` | 是 | 是 | 否 |
| `public` | 是 | 是 | 是 |

### 6.6 "protected 什么时候不是 protected？"

> **When your derived classes are ill-behaved!**

`protected` 对所有派生类都是公开的。一个"行为不端"的派生类可以把 `protected` 成员再 `public` 出去，从而泄露基类的实现细节。

所以课件给出的建议非常明确：

- **成员函数可以 protected**；
- **成员变量要 private**。

这是"封装"在继承体系里的正确做法：**把数据私有，把可扩展的行为保护起来**。

### 6.7 friend（友元）

- 用来**显式授权**给一个"不是成员"的函数；
- **由类自己控制**谁能访问它的成员；
- 可以声明全局函数、另一个类的成员函数、甚至整个类为 friend。

```cpp
class Matrix {
    friend std::ostream& operator<<(std::ostream&, const Matrix&);
private:
    double data[4][4];
};
```

friend 破坏了封装，但它是**受控的破坏**（由类自己宣布）。Ch.9 的 `operator<<` 必须用 friend，因为左操作数是 `ostream` 而不是 `Matrix`。

---

## 7. 类型转换：向上转型（Upcasting）

### 7.1 替换原则（substitution）

> **Public inheritance should imply substitution.**
> - If B is-a A, you can use a B anywhere an A can be used.
> - If B is-a A, then everything that is true for A is also true of B.
> - **Be careful if the substitution is not valid!**

这就是著名的**里氏替换原则**（Liskov Substitution Principle）的通俗版。它同时是"该不该用继承"的判据：

- 如果"派生类对象能替换基类对象"这个说法站不住，那么**不该用 public 继承**（用组合）；
- 经典反例：`Square` 继承 `Rectangle`。数学上正方形是矩形，但 `setWidth/setHeight` 的语义下，把 Square 当 Rectangle 用会破坏不变量——所以它不该是 public 继承。

### 7.2 向上转型的定义

> Upcasting is the act of converting from a **derived reference or pointer** to a **base class reference or pointer**.

"Regard an object of the derived class as an object of the base class. **Only valid on reference or pointer.**"

```cpp
Manager pete("Pete", "444-55-6666", "Bakery");
Employee* ep = &pete;     // Upcast（指针）
Employee& er = pete;      // Upcast（引用）
```

为什么**只能**用指针/引用？

- 用指针/引用时，**同一个对象**只是换了个"看它的视角"，不会产生新对象，也不会丢失派生类部分；
- 如果用**按值**的方式（`Employee e = pete;`），会发生**对象切片**（object slicing）——只拷贝基类那部分，`m_title` 被切掉，得到一个"残缺的 Employee"。这是 C++ 里非常隐蔽的 bug。

### 7.3 向上转型的代价：丢失类型信息

```cpp
ep->print(cout);   // prints base class version
```

这就是下一章的全部动机：**通过基类指针调用，默认只会调用基类的版本**，派生类的 `print` 根本不会被调用。要让 `ep->print()` 调到 `Manager::print`，必须把 `print` 声明为 `virtual`。

也就是说：

- **Upcasting 是语法层面自动完成的**（编译器无条件允许"派生→基"）；
- **调用哪份实现是语义问题**，由 `virtual` 决定。

---

## 8. 组合 vs 继承：怎么选

| 判据 | 选组合 | 选继承 |
| --- | --- | --- |
| 语义 | "有一个"（has-a） | "是一个"（is-a） |
| 是否需要替换 | 不需要 | 需要（多态） |
| 是否要复用接口 | 只想要实现 | 想要接口 + 实现 |
| 变化方向 | 内部零件会换 | 类型会扩展（加子类） |
| 耦合 | 可接受低耦合 | 接受与父类强耦合 |

一条工程经验：**"优先用组合，只有在需要多态替换时才用继承。"** 继承是 C++ 中耦合最强的机制之一——父类一改，所有子类都要重新验证。

---

## 9. 要点自检

1. has-a 与 is-a 分别对应哪种复用？举例说明。
2. 嵌入式对象为什么必须在初始化列表里构造？在函数体里 `set` 有什么问题？
3. 派生类的构造顺序和析构顺序分别是什么？
4. 为什么基类子对象在初始化列表里要用**类名**而不是成员名？
5. 名字隐藏是什么？为什么 `bill.print(cout, "Employee:")` 会报错？怎么修？
6. 哪三样东西不会被继承？分别要怎么做？
7. `:public`、`:protected`、`:private` 继承后，基类 public 成员在派生类里分别是什么访问级别？
8. 为什么 upcasting 只能用于指针/引用？按值会发生什么？
9. `ep->print()` 为什么打印的是基类版本？

---

## 10. 易错点

- **忘记在初始化列表里调用基类构造** → 编译器会调用基类默认构造 → 若没有默认构造，报错；若有，则基类数据没被正确初始化（隐蔽 bug）。
- **派生类重定义同名函数导致重载集被隐藏**，且编译器报错位置往往莫名其妙。
- **`private` 继承不是"不能继承"，而是"继承来的成员在派生类里变 private"**，仍然可以正常使用。
- **按值传递派生类对象给基类参数** → 对象切片。
- **DoME 那种"两个几乎一样的类"**，第一版能跑，但扩展成本是线性的——这是"重复代码是设计坏味道"的最好例子。

---

*上一篇：[[OOP/Chapter 5 Interaction Construction AI精讲|Chapter 5 Interaction Construction AI精讲]]　下一篇：[[OOP/Chapter 7 Polymorphism AI精讲|Chapter 7 Polymorphism AI精讲]]*
