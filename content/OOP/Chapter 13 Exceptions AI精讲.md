---
title: Chapter 13 Exceptions · AI 精讲
aliases:
  - OOP/notes/Chapter 13 Exceptions AI精讲
---
# Chapter 13 Exceptions：异常处理

> 对应课件：`13_Exceptions_2025.pdf`（49 页）
> 关键词：try/catch/throw、stack unwinding、exception hierarchy、`noexcept`、两阶段构造、exception safety

---

## 0. 为什么需要异常

C++ 的基本哲学是：

> **"badly formed code will not be run."**（写错的代码不该跑起来）

但**运行期**总会有意外：文件打不开、内存不够、下标越界、网络断了。这些都不是"代码写错"，而是"环境不配合"。

### 0.1 一个真实的例子：读文件

正常流程只有五行：

1. open the file
2. determine its size
3. allocate that much memory
4. read the file into memory
5. close the file

用**错误码**（error code）写出来是这样的：

```cpp
errorCodeType readFile {
    initialize errorCode = 0;
    open the file;
    if (theFileIsOpen) {
        determine its size;
        if (gotTheFileLength) {
            allocate that much memory;
            if (gotEnoughMemory) {
                read the file into memory;
                if (readFailed) {
                    errorCode = -1;
                }
            } else {
                errorCode = -2;
            }
        } else {
            errorCode = -3;
        }
        close the file;
        if (theFileDidntClose && errorCode == 0) {
            errorCode = -4;
        }
    } else {
        errorCode = -5;
    }
    return errorCode;
}
```

问题一目了然：

- **嵌套深**（五层 if），正常逻辑被淹没；
- **每一步都要记得"善后"**（`close the file` 必须在所有路径上执行）；
- **错误码是"约定"**，编译器不检查，调用者很容易忽略；
- **错误码不够用**：如果 `close` 失败而之前已经出错，`errorCode == 0` 的判断就是为了避免覆盖，这种细节没人记得住。

### 0.2 用异常写

```cpp
try {
    open the file;
    determine its size;
    allocate that much memory;
    read the file into memory;
    close the file;
} catch (fileOpenFailed) {
    doSomething;
} catch (sizeDeterminationFailed) {
    doSomething;
} catch (memoryAllocationFailed) {
    doSomething;
} catch (readFailed) {
    doSomething;
} catch (fileCloseFailed) {
    doSomething;
}
```

对比：

> **The significant benefit of exceptions is that they clean up error handling code.**
> **It separates the code that describes what you want to do from the code that is executed.**

两个收益：

1. **正常路径清晰**：`try` 里就是"我要做的事"，没有一行错误检查；
2. **错误处理集中**：所有 `catch` 排在一起，一眼能看完"这个函数能处理哪些错误"。

---

## 1. 异常的核心思想

> At the point where the problem occurs, you might **not know what to do with it**, but you **do know that you can't just continue on merrily**; you must stop, and **somebody, somewhere, must figure out what to do**.

这句话点出了异常的**分工**：

- **发现错误的地方**通常**没有能力**处理它（`Vector::operator[]` 不知道调用者想怎么办）；
- **有能力处理的地方**通常**离错误很远**（`main` 或更上层）；
- 异常就是"**把问题沿调用链往上抛，直到有人认领**"的机制。

所以：

> **When to use exceptions?**
> - 很多时候你**不知道**该做什么；
> - 如果你随便做点什么，**一定是错的**；
> - **Solution: expose the problem** —— 让调用者（或它的调用者……）负责。

---

## 2. 一个具体案例：`Vector::operator[]` 越界

```cpp
template <class T> class Vector {
private:
    T* m_elements;
    int m_size;
public:
    Vector(int size = 0) : m_size(size) { /* ... */ }
    ~Vector() { delete[] m_elements; }
    void length(int);
    int length() { return m_size; }
    T& operator[](int);
};
```

问题：**下标非法时，`[]` 该怎么办？** 课件列了四种选择，每种都有代价。

### 选择 1：返回随机内存里的对象

```cpp
return m_elements[idx];   // 越界了也照返回
```

→ **未定义行为**。它"能用"，但错得毫无征兆。

### 选择 2：返回一个特殊错误值

```cpp
if (idx < 0 || idx >= m_size) {
    T* error_marker = new T("some magic value");
    return *error_marker;
}
return m_elements[idx];
```

→ 课件评价：**"throws the baby out with the bath water"**（把洗澡水和孩子一起倒掉了）。

为什么？因为：

```cpp
x = v[2] + v[4];   // 如果 v[4] 越界，返回的是一个"魔法值"
```

这个错误值会**参与运算**，把错误"稀释"进正常数据里，你根本发现不了。而且它**永远泄漏内存**（`new` 出来的对象没人 delete）。

### 选择 3：直接死

```cpp
if (idx < 0 || idx >= m_size) {
    exit(22);
}
```

→ **库代码不该决定"整个程序是否该结束"**。你的 Vector 被别人的服务端程序使用时，一次越界就 kill 掉整个服务，这不可接受。

### 选择 4：优雅地死（带"验尸报告"）

```cpp
assert(idx >= 0 && idx < m_size);
return m_elements[idx];
```

→ 这是**调试期**的手段。`assert` 在 Release 版本里会被编译掉，运行期没有任何保护。

**结论**：四种都不合适。正确答案是**抛出异常**——把决定权交还给调用者。

---

## 3. 抛异常

```cpp
template <class T>
T& Vector<T>::operator[](int idx) {
    if (idx < 0 || idx >= m_size) {
        throw VectorIndexError(idx);   // throw 是关键字，异常在此处产生
    }
    return m_elements[idx];
}
```

### 3.1 抛什么？抛对象

> **What do you throw? What do you have? Data!**
> **Define a class to represent the error.**

```cpp
class VectorIndexError {
public:
    VectorIndexError(int v) : m_badValue(v) { }
    ~VectorIndexError() { }
    void diagnostic() {
        cerr << "index " << m_badValue << " out of range!";
    }
private:
    int m_badValue;
};
```

**为什么抛对象而不是抛 `int` 错误码？** 因为对象可以：

- **携带上下文**（`m_badValue` 记录了"哪个下标出错了"）；
- **提供方法**（`diagnostic()` 可以按需格式化输出）；
- **参与继承体系**（见第 5 节，可以用基类引用统一捕获）。

这就是"异常类"（exception class）的设计思路：**它不是一个数字，是一个能描述错误的对象**。

---

## 4. 调用者的四种态度

课件用四个 `outer` 函数演示了异常在调用链上的四种命运。

### 情况 1：完全不管（Doesn't care）

```cpp
int func() {
    Vector<int> v(12);
    v[3] = 5;
    int i = v[42];   // 越界
    // control never gets here!（控制流永远到不了这里）
    return i * 5;
}
```

如果没人捕获，异常会一路向上传播；如果传播到 `main` 之外，程序 **terminate**。

### 情况 2：非常关心（Cares deeply）

```cpp
void outer() {
    try {
        func();
        func2();
    } catch (VectorIndexError& e) {
        e.diagnostic();
        // 这个异常不再向上传播
    }
    cout << "Control is here after exception";
}
```

关键点：

- **`catch` 之后，控制流从 `try-catch` 之后继续**，`func2()` 被跳过；
- 用**引用**捕获（`& e`），避免切片，也能调用虚函数；
- 捕获即"认领"，异常到此为止。

### 情况 3：有点兴趣（Mildly interested）

```cpp
void outer2() {
    string err("exception caught");
    try {
        func();
    } catch (VectorIndexError) {
        cout << err;
        throw;              // 重新抛出（propagate）
    }
}
```

`throw;`（**不带操作数**）表示"**把当前正在处理的异常原样再抛出去**"。它只在 `catch` 块内有效。

用途：**记录日志但不想负责处理**。注意这里按值捕获 `VectorIndexError`，会**复制**一份（有切片风险，见第 8 节）；更好的写法是 `catch (VectorIndexError&)`。

### 情况 4：不在乎细节（Doesn't care about particulars）

```cpp
void outer3() {
    try {
        outer2();
    } catch (...) {
        // ... 捕获所有异常！
        cout << "The exception stops here!";
    }
}
```

`catch (...)` 是 **catch-all handler**，捕获任何类型。

用途：**最外层兜底**（防止异常逃出 `main` 导致 terminate）、**资源清理**。但它拿不到异常对象，无法知道出了什么事，所以**只能放在最后**。

### 4.1 传播过程全图

![异常的传播路径：operator[] 抛出 → func → outer2 → outer3](OOP/images/Chapter%2013%20Exceptions%20AI%E7%B2%BE%E8%AE%B2/ch13-p20-20.webp)

这张图就是"栈展开"（stack unwinding）的可视化：

- `operator[]` 抛出；
- `func` 没有 `try`，直接"退出这个作用域"；
- `outer2` 有 `try`，匹配到 `catch` → 打印后 `throw;` 再次抛出；
- `outer3` 的 `catch (...)` 接住，异常终止。

### 4.2 课件给出的判定流程

> 1. 当前是否在 `try` 里？
>    - **NO**：离开这个作用域（触发 stack unwinding）
>      - 是函数体吗？**YES** → 返回调用者，回到第 1 步
>      - **NO** → 终止程序（terminate）
>    - **YES**：尝试匹配一个 `catch`
>      - 匹配？**YES** → 执行该子句，然后跳到 try 块之后继续
>      - **NO** → 继续隐式抛出，回到第 1 步

---

## 5. 复习：异常机制的四个要点

> - **Throw statement raises the exception**
>   - Control propagates back to the **first handler for that exception**（回到第一个匹配的处理器）
>   - Propagation follows the **call chain**（沿调用链）
>   - **Objects on stack are properly destroyed**（栈上的对象被正确销毁）
> - `throw exp;` —— 抛出**值**用于匹配
> - `throw;` —— **重新抛出**正在处理的异常，**仅在 handler 内有效**

第三点是异常机制最优雅的部分：**栈展开会自动调用所有局部对象的析构函数**。这就是为什么"异常安全"和 RAII 是同一件事（第 9 节）。

### 5.1 try 块的四个性质

> - Establishes any number of handlers（可建立任意多个处理器）
> - Not needed if you don't use any handlers（不用处理器就不需要 try）
> - **Shows where you expect to handle exceptions**（表明你预期在哪里处理异常）
> - **Costs cycles**（有开销）

最后一条要正视：`try` 块在现代实现里是"零成本"的（异常表机制，不抛异常时几乎无开销），但**抛出异常本身很贵**（要遍历栈、构造异常对象）。所以**不要用异常做常规控制流**（第 7 节）。

### 5.2 处理器（handler）

> - Select exception by **type**（按类型选择）
> - Can re-raise exceptions（可重新抛出）
> - Two forms（两种形式）：
>   `catch (SomeType v) { }` 和 `catch (...) { }`
> - Take a single argument (like a formal parameter)（像形参一样，只接受一个参数）

---

## 6. 处理器如何选择

> - Can have any number of handlers（可以有任意多个）
> - **Handlers are checked in order of appearance**（按出现顺序检查）
> 1. **Check for exact match**（精确匹配）
> 2. **Apply base class conversions** —— reference and pointer types（基类转换，仅限引用与指针）
> 3. **Catch-all handler `(...)`**

关键推论：**顺序决定一切**。把 `catch (Base&)` 写在 `catch (Derived&)` 前面，派生类的处理器永远不会被执行。

### 6.1 用继承组织异常

```cpp
class MathErr {
public:
    virtual void diagnostic();
};
class OverflowErr  : public MathErr { /* ... */ };
class UnderflowErr : public MathErr { /* ... */ };
class ZeroDivideErr: public MathErr { /* ... */ };
```

正确的处理顺序（**从具体到一般**）：

```cpp
try {
    // ...
    throw UnderflowErr();
} catch (ZeroDivideErr& e) {
    // 处理除零
} catch (MathErr& e) {          // Note the order
    // 处理其它数学错误
} catch (UnderflowErr& e) {     // 永远走不到这里！
    // 处理下溢
} catch (...) {
    // 其它任何异常
}
```

课件把两个 `catch` 标上 **"Note the order"**，就是在提醒：`UnderflowErr` 会在 `MathErr&` 那一步就被"基类转换"匹配走，后面那个 `UnderflowErr` 处理器是**死代码**。

**结论**：**异常的 catch 顺序必须从派生到基类**，`catch (...)` 永远放最后。

---

## 7. 标准库异常层次

![标准库异常类层次：exception 为根](OOP/images/Chapter%2013%20Exceptions%20AI%E7%B2%BE%E8%AE%B2/ch13-p29-29.webp)

```
exception
├── bad_alloc          （new 失败）
├── bad_cast           （dynamic_cast 失败，引用版）
├── bad_typeid
├── bad_exception
├── runtime_error      （运行期才能发现）
│   ├── overflow_error
│   └── range_error
└── logic_error        （逻辑错误，本可避免）
    ├── domain_error
    ├── length_error
    ├── out_of_range   （vector::at 越界时抛这个）
    └── invalid_argument
```

记忆法：

- **`runtime_error`** = "跑起来才可能出错"（数值溢出、范围）；
- **`logic_error`** = "程序逻辑写错了"（参数非法、长度非法、下标越界）；
- 其余 `bad_*` 是"特定操作失败"（分配、转换、类型识别）。

**实践建议**：自定义异常类**继承 `std::exception`**（或它的子类），这样别人写 `catch (std::exception&)` 时能兜住你的异常。

---

## 8. 异常与 new、异常规格

### 8.1 `new` 失败抛异常

> - **`new` does NOT return 0 on failure**（`new` 失败不返回 0）
> - **`new` raises a `bad_alloc()` exception**

```cpp
void func() {
    try {
        while (1) {
            char* p = new char[10000];   // 一直分配直到失败
        }
    } catch (std::bad_alloc& e) {
        // ...
    }
}
```

这是 C++ 与 C 的重大差别：`malloc` 失败返回 `NULL`，`new` 失败**抛 `bad_alloc`**。

如果确实想拿 `NULL`，可以用 `new (std::nothrow) T`（不抛异常，失败返回 `nullptr`）。但一般不建议。

### 8.2 异常规格（exception specifications）

**历史包袱**：

```cpp
void abc(int a) throw(MathErr) {   // C++98 写法：只允许抛 MathErr
    // ...
}
```

- 不在列表里的异常往外跑 → 调用 `unexpected()`；
- **编译期不检查**；
- **C++11 起弃用，C++17 起移除**（除了 `throw()`，它是 `noexcept(true)` 的别名）。

**现代写法**：

```cpp
void abc(int a) noexcept {
    // ...
}
```

- 是**函数类型的一部分**，但**不是签名的一部分**（不能凭它重载）；
- 编译期未必检查，但编译器可以据此做优化（不需要准备展开栈）；
- **运行期**：如果有异常逃出 `noexcept` 函数 → **`std::terminate()`**。

`noexcept` 的正确用法：

| 场景 | 是否标 `noexcept` |
| --- | --- |
| 析构函数 | **是**（默认就是） |
| 移动构造/移动赋值 | **是**（否则 `vector` 扩容时不敢用它，会退化成拷贝） |
| 简单 getter、`swap` | 是 |
| 可能失败的普通函数 | 否 |

---

## 9. 设计考虑（课件三条反面教材）

### 9.1 不要用异常表示"正常结束"

```cpp
try {
    for (;;) {
        p = list.next();
        // ...
    }
} catch (List::end_of_list) {
    // 在这里处理"链表结束"
}
```

问题：**链表遍历到结尾是正常情况，不是错误**。用异常表达它，导致：

- 每次遍历都要付一次异常的代价（很贵）；
- 语义上把"正常"说成"异常"，读代码的人会被误导。

正确写法：`while (p != nullptr)`。

### 9.2 不要用异常代替好的设计

```cpp
void func() {
    File f;
    if (f.open("somefile")) {
        try {
            // 使用 f
        } catch (...) {
            f.close();      // 只在 catch 里关，正常路径呢？
        }
    }
}
```

问题：`f.close()` 只在异常路径上执行，**正常路径反而漏了**。而且如果 `try` 里有 `return`，一样会漏。

### 9.3 正确做法：用析构函数

```cpp
void func() {
    File f("some file");
    // 假设析构函数会关闭 f
    // 即使抛出异常，f 依然会被关闭！
    if (f.ok()) {
        // ...
    }
}
```

> **This is a good place to use the destructor.**

这就是 **RAII**（Resource Acquisition Is Initialization）：**把资源的生命周期绑定到对象的生命周期**。对象离开作用域 → 析构 → 资源释放，无论是因为正常返回还是异常。

RAII 是 C++ 处理资源的标准答案，也是智能指针（Ch.14）的理论基础。

---

## 10. 构造函数出错怎么办

### 10.1 为什么构造函数特别难

构造函数**没有返回值**，无法用返回码报告失败。三种应对：

| 方案 | 问题 |
| --- | --- |
| 用"未初始化标志"（uninitialized flag） | 每个使用者都要检查 `isValid()`，容易忘 |
| 把工作推迟到 `init()` 函数 | 对象可能处于"半成品"状态 |
| **抛异常** | **Better: Throw an exception** |

### 10.2 抛异常时的两条规则

> If your constructor can't complete, throw an exception:
> - **Dtors for the object won't be called.**（这个对象的析构函数**不会**被调用）
> - **Manually clean up allocated resources before throwing**, otherwise memory leak happens.（抛之前要手动清理已分配的资源）

为什么析构不会被调用？因为**对象从未构造完成**，C++ 认为"没有对象需要析构"。但**已经构造完成的成员**会正常析构（这是语言保证的），所以只泄漏"你自己 `new` 出来、还没交给成员管理"的资源。

```cpp
class Conn {
    Socket* s;
public:
    Conn() {
        s = new Socket();
        if (!s->connect()) {
            delete s;                    // 必须手动清理！
            throw ConnectError();
        }
    }
};
```

### 10.3 两阶段构造（two-stage construction）

更彻底的做法：

> **Do normal work in ctor**
> - Initialize all member objects
> - Initialize all primitive members
> - Initialize all pointers to 0
> - **NEVER request any resource**（文件、网络连接、内存）
>
> **Do additional initialization work in `Init()`**

优点：构造函数**永不失败**（只做纯内存操作），所有可能失败的动作集中在 `Init()` 里，用返回值或异常报告。

这就是"构造 = 建立不变量的骨架，初始化 = 获取外部资源"的分离。

### 10.4 用智能指针

> - `std::unique_ptr`
> - `std::shared_ptr`
> - **The destructor will delete the native pointer when it dies.**

```cpp
class Conn {
    std::unique_ptr<Socket> s;
public:
    Conn() : s(new Socket()) {
        if (!s->connect()) throw ConnectError();   // 无需手动 delete！
    }
};
```

因为 `s` 是**已构造完成的成员**，异常抛出时会正常析构，自动释放 `Socket`。**把裸指针换成智能指针，构造函数的异常安全就自动解决了。**

---

## 11. 异常与析构函数

> Destructors are called when:
> - Normal call ended: object exits from scope
> - **Exceptions thrown: "stack unwinding" invokes dtors on objects as they exit from scope**

那么问题来了：**如果析构函数里抛异常会怎样？**

> **Throwing an exception in a destructor that is itself being called as the result of an exception will invoke `std::terminate()`.**

原因：栈展开过程中又抛出一个异常，就有**两个异常同时在飞**，C++ 无法决定该处理哪个，于是直接 terminate。

规则（务必记住）：

> **Allowing exceptions to escape from destructors should be avoided, never throw it!**

实践：

- 析构函数默认就是 `noexcept`（C++11）；
- 如果析构里有可能失败的操作（如 `close()`），**捕获并吞掉**，最多记日志；
- 需要"可能失败的清理"时，提供一个显式的 `close()` 方法让用户调用（这也是为什么 `fstream` 需要手动 `close()`）。

---

## 12. 用异常编程：按值、按指针、按引用

这是本章最实用的一段。

### 12.1 按值抛出/捕获 → 切片

```cpp
struct X {};
struct Y : public X {};

try {
    throw Y();
} catch (X x) {      // 按值捕获
    // 这是 X 还是 Y？
}
```

答案：**是 `X`**。`Y` 被"切片"成 `X`，派生类部分丢失。这就是 Ch.7 讲的对象切片在异常场景的重演。

### 12.2 按指针抛出/捕获 → 所有权混乱

```cpp
try {
    throw new Y();
} catch (Y* p) {
    // 哎呀，忘了 delete
}
```

问题：

- **谁负责 delete？** 没人说清 → 必然泄漏；
- 如果异常没被这个 `catch` 接住，指针继续传播，最终谁也不知道该释放谁；
- 指针比较的是**地址**，跨模块抛出时可能被 `catch (X*)` 误捕（因为 `Y*` 和 `X*` 是不同的静态类型）。

### 12.3 按引用捕获 → 正确做法

```cpp
struct B {
    virtual void print() { /* ... */ }
};
struct D : public B { /* ... */ };

try {
    throw D("D error");
} catch (B& b) {
    b.print();      // 调用 D 的 print（多态生效！）
}
```

> **Prefer catching exceptions by reference.**

三个好处：

1. **不切片**：还是原来那个 `D` 对象；
2. **多态生效**：通过 `B&` 调用虚函数，得到 `D` 的实现；
3. **无所有权问题**：异常对象的生命周期由运行时管理，不需要 delete。

**规范**：`throw 具体类型;` + `catch (const 基类&)`。

---

## 13. 异常安全的总结

> - Develop an error-handling strategy **early in design**.
> - **Avoid over-use of try/catch blocks.** Use **objects** to acquire/release resources.
> - **Don't use exceptions where local control structures would suffice.**（本地控制结构能解决就别用异常）
> - Not every function can handle every error.（不是每个函数都能处理每个错误）
> - Use exception-specifications for major interfaces.（主要接口用 `noexcept` 标注）
> - **Library code should not decide to terminate a program. Throw exceptions and let the caller decide.**（库代码不该决定终止程序）

### 13.1 一个异常不安全的例子

```cpp
class BankAccount {
    void withdrawMoney(int amount) {
        reduceBalance(amount);   // 余额已扣……
        prepareCash();           // 这里抛异常！
        releaseCash();
    }
};
```

问题：**余额扣了，钱没出来**。对象处于"不一致状态"（invariant 被破坏）。

三种保证等级（必须知道）：

| 等级 | 含义 |
| --- | --- |
| **Basic guarantee**（基本保证） | 不泄漏资源，对象仍处于"有效但未指定"的状态 |
| **Strong guarantee**（强保证） | 要么成功，要么**完全回滚**（像事务） |
| **Nothrow guarantee**（不抛保证） | 承诺不抛异常（`noexcept`） |

修法（强保证）：**先做可能失败的操作，最后再做不可逆的修改**：

```cpp
void withdrawMoney(int amount) {
    Cash c = prepareCash(amount);   // 先准备（可能失败，此时余额未动）
    reduceBalance(amount);          // 再改状态（不抛异常）
    releaseCash(std::move(c));
}
```

这就是"**copy-and-swap**"思想的雏形：先在临时对象上完成所有可能失败的工作，再一次性提交。

---

## 14. 要点自检

1. 用错误码处理错误有什么四个问题？异常分别怎么解决？
2. `Vector::operator[]` 越界的四种"非异常"方案各有什么毛病？
3. 为什么抛的是对象而不是错误码？
4. `throw;` 与 `throw expr;` 的区别？
5. 栈展开（stack unwinding）过程中会发生什么？这为什么让 RAII 成为可能？
6. `catch` 的顺序为什么必须"派生在前、基类在后"？
7. 标准库异常里 `logic_error` 与 `runtime_error` 的区分依据？
8. 构造函数抛异常时，谁的析构函数会被调用、谁不会？
9. 为什么绝不能让异常逃出析构函数？
10. 按值、按指针、按引用捕获异常，各自的后果？
11. 三种异常安全保证分别是什么？

---

## 15. 易错点

- **`catch (Base&)` 写在 `catch (Derived&)` 前面** → 派生处理器成为死代码。
- **按值捕获异常** → 切片，多态失效。
- **`throw new T()`** → 所有权无人负责，必然泄漏。
- **在析构函数里抛异常** → 栈展开期间直接 terminate。
- **构造函数抛异常前忘记清理自己的 `new`** → 泄漏（成员会析构，裸指针不会）。
- **用异常做循环退出条件** → 性能灾难 + 语义误导。
- **以为 `new` 失败返回 `nullptr`** → 它抛 `bad_alloc`。
- **在 `noexcept` 函数里抛异常** → terminate。

---

*上一篇：[[OOP/Chapter 12 Iterators AI精讲|Chapter 12 Iterators AI精讲]]　下一篇：[[OOP/Chapter 14 Smart Pointers AI精讲|Chapter 14 Smart Pointers AI精讲]]*
