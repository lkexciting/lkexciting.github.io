---
title: Chapter 10 Streams · AI 精讲
aliases:
  - OOP/notes/Chapter 10 Streams AI精讲
---
# Chapter 10 Streams：流式 I/O

> 对应课件：`10_Streams_2025.pdf`（23 页）
> 关键词：stream、extractor、inserter、manipulator、`cin`/`cout`/`cerr`/`clog`、text vs. binary、format flag

---

## 0. 为什么单独讲 I/O

因为 I/O 是**运算符重载最成功的应用案例**，也是**"接口设计"最好的教材**：

- `cout << x` 看起来像语法，其实是 `operator<<(cout, x)`；
- 你给自己的类写一个 `operator<<`，它就自动融入了整个 I/O 体系，不需要改 `cout`；
- 这套设计用到了本课程几乎所有机制：类、继承、模板、运算符重载、引用返回。

学完这一章，你应该能回答："为什么 `cout << a << b` 能链式调用？"——答案是"返回 `ostream&`"，而这个技巧你在 Ch.9 已经学过。

---

## 1. 为什么用流（streams）

C 的 I/O 是 `printf` / `scanf`。C++ 引入了流：

| 优点 | 说明 |
| --- | --- |
| **Better type safety**（更好的类型安全） | `printf("%d", 3.14)` 编译通过但结果错；`cout << 3.14` 不可能错 |
| **Extensible**（可扩展） | 给自定义类型加一个 `operator<<` 就能打印，无需改库 |
| **More object-oriented** | 流是对象，有状态（格式标志）、有成员函数 |

| 缺点 | 说明 |
| --- | --- |
| **More verbose**（啰嗦） | 格式化不如 `printf("%08.2f")` 紧凑（C++20 的 `std::format` 把这种便利找回来了） |
| **Might be slower**（可能更慢） | 默认要与 C 的 stdio 同步 |

性能补救：

```cpp
std::ios::sync_with_stdio(false);   // 关闭与 C stdio 的同步
```

在算法竞赛/大批量 I/O 中这是常见的加速手段（关闭后不能再混用 `printf` 与 `cout`）。

### 1.1 C 与 C++ 的关系

- C 的 stdio **仍然可用**（`printf` 照常工作）；
- 但 C stdio **没有面向对象特性**，也**没有可重载的运算符**；
- C++ 可以**重载插入器与提取器**。

> **Moral: When converting C to C++, leave the I/O intact.**
> （把 C 代码改成 C++ 时，I/O 部分先别动。）

这是很务实的建议：I/O 往往是代码里最不需要"面向对象化"的部分，贸然改动只会引入 bug。

---

## 2. 什么是流

> A stream is a **common logical interface to a device**: one-dimensional, unidirectional.

两个特征：

- **一维（one-dimensional）**：数据是一个字符序列，没有"行/列"结构；
- **单向（unidirectional）**：输入流只读，输出流只写（同一个双向流是另一个概念）。

补充：**文件可以随机访问（random access，`seekg`/`seekp`），但 `std::cin`/`std::cout` 不行**——它们是"顺序的"。

### 2.1 命名的规律（naming conventions）

| | 输入 Input | 输出 Output | 头文件 |
| --- | --- | --- | --- |
| **通用 Generic** | `istream` | `ostream` | `<iostream>` |
| **文件 File** | `ifstream` | `ofstream` | `<fstream>` |
| **C 字符串（遗留）** | `istrstream` | `ostrstream` | `<strstream>` |
| **C++ 字符串** | `istringstream` | `ostringstream` | `<sstream>` |

记忆法：**`i` = input，`o` = output，`f` = file，`string` = 内存字符串**。于是 `istringstream` = "从字符串读"，`ofstream` = "写文件"。

`<sstream>` 在工程里非常有用：把数字转字符串、把一行拆成若干字段，都靠它。

```cpp
#include <sstream>
std::ostringstream oss;
oss << "x = " << 42;
std::string s = oss.str();

std::istringstream iss("12 34 56");
int a, b, c;
iss >> a >> b >> c;
```

### 2.2 流的三类操作

| 操作 | 作用 | 运算符 |
| --- | --- | --- |
| **Extractors**（提取器） | 从流中读一个值 | 重载 `>>` |
| **Inserters**（插入器） | 把一个值插入流 | 重载 `<<` |
| **Manipulators**（操纵器） | 改变流的状态 | 如 `endl`、`hex`、`setw` |

---

## 3. 文本流与二进制流

| | 文本流 Text | 二进制流 Binary |
| --- | --- | --- |
| 内容 | ASCII 文本 | 原始字节 |
| 是否翻译 | **会做字符翻译**（如换行 `\n` → 操作系统的实际表示，Windows 下是 `\r\n`） | **不翻译** |
| 包含 | 文件、字符缓冲区 | 文件 |
| 用途 | 人可读的数据 | 结构化数据、性能敏感场景 |

```cpp
std::ofstream outfile("file.bin", std::ios::binary);
std::ifstream infile("file.bin", std::ios::binary);
```

**为什么二进制模式重要？** 因为文本模式下，读写的内容可能与你写入的字节不完全一致（换行被转换），这对"按字节精确读写"是灾难。存 `struct` 或图像/音频时必须用 `binary`。

---

## 4. 四个预定义流

| 流 | 含义 | 缓冲 |
| --- | --- | --- |
| `cin` | 标准输入（standard input） | 缓冲 |
| `cout` | 标准输出（standard output） | 缓冲 |
| `cerr` | **无缓冲**的错误/调试输出（unbuffered error output） | 不缓冲 |
| `clog` | **缓冲**的错误/调试输出（buffered error output） | 缓冲 |

区别的实际意义：

- `cerr` 无缓冲 → 程序崩溃时，之前的错误信息**一定已经输出**（这对调试很关键）；
- `clog` 缓冲 → 性能更好，但崩溃时可能丢失最后几条；
- `cout` 缓冲 → 崩溃时可能丢输出，所以"崩溃前没打印"是常见假象，`cout.flush()` 或 `endl` 可以解决。

---

## 5. 提取器（Extractors）

### 5.1 基本用法

```cpp
int i; float f; char c;
char buffer[80];

cin >> c;              // 读下一个字符
cin >> i;              // 读一个整数，跳过空白
cin >> f >> buffer;    // 读一个 float 和一个以空白分隔的字符串
```

一个必须记住的行为：

> **Extractors skip leading whitespace, in general.**（提取器通常跳过前导空白。）

所以 `cin >> c` 读不到空格和回车——这也是"C++ 里读一行要用 `getline`"的原因。

### 5.2 内置类型对应的格式

| 表达式类型 | 输入格式 | 等价 C I/O |
| --- | --- | --- |
| `char` | 单个字符 | `%c` |
| `short`, `int` | 整数 | `%d` |
| `long` | 长十进制整数 | `%ld` |
| `float` | 浮点 | `%f` |
| `double` | 双精度浮点 | `%lf` |
| `char []` | 字符串 | `%s` |
| `void *` | 指针 | `%p` |

### 5.3 自定义提取器

**必须是 2 个参数的自由函数**：

- 第一个参数是 `istream&`；
- 第二个参数是被读对象的**引用**。

```cpp
istream& operator>>(istream& is, T& obj) {
    // 具体的读取代码
    return is;
}
```

**为什么返回 `istream&`？** 为了链式调用：

```cpp
cin >> a >> b >> c;
// 等价于
((cin >> a) >> b) >> c;
```

如果没有返回值，`(cin >> a)` 就无法再 `>> b`。

**为什么第二个参数必须是引用？** 因为要把读到的值"放进"调用者的变量里。如果按值传，改的是副本。

**为什么不能是成员函数？** 因为左操作数是 `istream`，不是你的类。你无法给 `istream` 加成员函数（标准库不能改），所以只能写成自由函数。

这一点是理解"为什么 `<<`/`>>` 必须是自由函数"的关键：**运算符的从左到右的位置决定了谁是"隐式第一个参数"**。

---

## 6. 其他输入操作

| 操作 | 语义 |
| --- | --- |
| `int get()` | 返回下一个字符；没有字符时返回 `EOF` |
| `istream& get(char& ch)` | 把下一个字符读入 `ch` |
| `get(char* buf, int limit, char delim='\n')` | 最多读 `limit` 个字符或到 `delim`；**补 `'\0'`**；**不消耗分隔符** |
| `getline(char* buf, int limit, char delim='\n')` | 同上，但**会消耗分隔符** |
| `ignore(int limit=1, int delim=EOF)` | 跳过 `limit` 个字符或跳到 `delim`；**找到了会跳过它** |
| `int gcount()` | 返回"刚刚读了几个字符" |
| `void putback(char c)` | 把一个字符放回流中 |
| `char peek()` | 看下一个字符但**不取走** |

### 6.1 `get()` 与 `getline()` 的唯一区别

**`get` 不消耗分隔符，`getline` 消耗分隔符。**

这个差别会导致经典的 bug：

```cpp
cin.get(buf, 100);      // 读了一行，但 '\n' 还留在流里
cin.get(buf2, 100);     // 立刻读到空串！因为第一个字符就是 '\n'
```

`getline` 就没这个问题。所以**读多行优先用 `getline`**。

### 6.2 逐字符拷贝（EOF 循环）

```cpp
int ch;
while ((ch = cin.get()) != EOF)
    cout.put(ch);
```

注意 `ch` 必须是 **`int`** 而不是 `char`：因为 `EOF` 通常是 `-1`，而 `char` 在有些平台上无符号，永远不等于 `-1`，循环会死掉。

### 6.3 `gcount()`

```cpp
char buffer[100];
cin.getline(buffer, sizeof(buffer));
cout << "read " << cin.gcount() << " characters";
```

`gcount()` 返回上一次**非格式化输入操作**实际读了多少字符（不含自动补的 `'\0'`）。

### 6.4 `peek()`：不取走地看

```cpp
switch (cin.peek()) {
    case 'y': /* ... */ break;
    case 'n': /* ... */ break;
}
```

解析器常用 `peek` 做"向前看一个字符"的判断。

---

## 7. 插入器（Inserters）

### 7.1 内置类型对应的格式

| 表达式类型 | 输出格式 | 等价 C I/O |
| --- | --- | --- |
| `char` | 字符 | `%c` |
| `short`, `int` | 整数 | `%d` |
| `long` | 长十进制整数 | `%ld` |
| `float` | 浮点 | `%f` |
| `double` | 双精度浮点 | `%lf` |
| `char []` | 字符串 | `%s` |
| `void *` | 指针 | `%p` |

### 7.2 自定义插入器

**同样必须是 2 个参数的自由函数**：

- 第一个参数 `ostream&`；
- 第二个参数是 `const T&`（**只读，加 const**）。

```cpp
ostream& operator<<(ostream& os, const T& obj) {
    // 把 obj 写到 os
    return os;
}
```

```cpp
cout << a << b << c;
// 等价于
((cout << a) << b) << c;
```

### 7.3 一个完整的例子

```cpp
class Point {
    int x_, y_;
public:
    Point(int x, int y) : x_(x), y_(y) {}
    int x() const { return x_; }
    int y() const { return y_; }
};

// 只依赖公有接口，不需要 friend
ostream& operator<<(ostream& os, const Point& p) {
    os << '(' << p.x() << ", " << p.y() << ')';
    return os;
}

// 需要访问 private 时用 friend 声明在类内
class Point2 {
    int x_, y_;
    friend ostream& operator<<(ostream&, const Point2&);
};
```

**输出格式的选择是接口设计的一部分**：`(1, 2)` 还是 `1 2`，应该考虑"这个输出将来能不能被自己的 `operator>>` 读回来"（round-trip 一致性）。

### 7.4 其他输出操作

| 操作 | 语义 |
| --- | --- |
| `put(char)` | 输出单个字符 |
| `flush()` | 强制把缓冲区内容写到设备 |

```cpp
cout.put('a');
cerr.put('!');

cout << "Enter a number";
cout.flush();     // 不换行也要立刻显示提示
```

**为什么需要 `flush`？** 因为 `cout` 是缓冲的，如果提示语没有换行也没 flush，用户可能看不到提示就开始输入——这是交互式程序的经典问题。

---

## 8. 操纵器（Manipulators）

> Manipulators modify the **state** of the stream. **Effects hold (usually).**

需要 `#include <iomanip>`。

```cpp
int n;
cout << "enter number in hexadecimal" << endl;
cin >> hex >> n;      // 之后的读入都按十六进制解析
```

注意 "effects hold"：`hex` 一旦设置，**后面所有整数 I/O 都受影响**，直到你改回来（`dec`）。

### 8.1 常用操纵器表

| 操纵器 | 效果 | 类型 |
| --- | --- | --- |
| `dec`, `hex`, `oct` | 设置数值进制 | I, O |
| `endl` | 插入换行并 flush | O |
| `flush` | 刷新流 | O |
| `setw(int)` | 设置字段宽度 | I, O |
| `setfill(ch)` | 设置填充字符 | I, O |
| `setbase(int)` | 设置进制 | O |
| `ws` | 跳过空白 | I |
| `setprecision(int)` | 设置浮点精度 | O |
| `setiosflags(long)` | 打开指定标志 | I, O |
| `resetiosflags(long)` | 关闭指定标志 | I, O |

**特别注意 `setw`**：它**只对下一次输出有效**，不"保持"。这与其它操纵器不同，是高频考点。

### 8.2 完整示例

```cpp
#include <iostream>
#include <iomanip>
using namespace std;

int main() {
    cout << setprecision(2) << 1230.243 << endl;
    cout << setw(20) << "OK!";
    return 0;
}
```

输出：

```
1.2e+03
                OK!
```

两个现象值得解释：

1. `setprecision(2)` 在**默认（general）格式**下表示"2 位有效数字"，于是 `1230.243` → `1.2e+03`（科学计数法）。如果你想要"2 位小数"，必须配合 `fixed`：

```cpp
cout << fixed << setprecision(2) << 1230.243;   // 1230.24
```

2. `setw(20)` 让 `"OK!"` 右对齐占 20 列（默认右对齐）。

### 8.3 自定义操纵器

> You can define your own manipulators!

骨架（输出流操纵器）：

```cpp
ostream& manip(ostream& out) {
    // ...
    return out;
}

ostream& tab(ostream& out) {
    return out << '\t';
}

cout << "Hello" << tab << "World!" << endl;
```

**为什么这样就能工作？** 因为 `operator<<` 有一个重载接受**函数指针**：

```cpp
ostream& operator<<(ostream& (*pf)(ostream&));
```

于是 `cout << tab` 被解释为"把 `tab` 这个函数作用到 `cout` 上"。这是"用函数指针做操纵器"的经典技巧，也是 Ch.9 仿函数思想的前身。

---

## 9. 格式标志（format flags）

| 标志 | 置位后的作用 |
| --- | --- |
| `ios::skipws` | 跳过前导空白 |
| `ios::left`, `ios::right` | 对齐方式 |
| `ios::internal` | 在符号与数值之间填充 |
| `ios::dec`, `ios::oct`, `ios::hex` | 数字进制 |
| `ios::showbase` | 显示数字的进制前缀（`0x`、`0`） |
| `ios::showpoint` | 总是显示小数点 |
| `ios::uppercase` | 进制前缀用大写（`0X`） |
| `ios::showpos` | 正数显示 `+` |
| `ios::scientific`, `ios::fixed` | 浮点格式 |
| `ios::unitbuf` | 每次写入都 flush |

### 9.1 两种设置方式

**方式一：操纵器**

```cpp
cout << setiosflags(ios::left | ios::showpos);
cout << resetiosflags(ios::left);
```

**方式二：流成员函数**

```cpp
cout.setf(ios::hex, ios::showbase);
cout.unsetf(ios::showbase);
```

两者的区别：`setf` 的**双参数版本**更安全——它接受"要设置的标志"和"要清除的掩码"，避免互相冲突的标志同时置位（例如同时设置 `dec` 和 `hex`）。

---

## 10. 要点自检

1. 流相比 `printf` 的三个优点、两个缺点分别是什么？
2. `cerr` 与 `clog` 的区别？为什么调试时用 `cerr`？
3. 文本流与二进制流的差别？什么时候必须用 `binary`？
4. `get` 与 `getline` 的唯一区别？会导致什么 bug？
5. 自定义插入器/提取器为什么必须是自由函数？为什么返回 `ostream&`/`istream&`？
6. `setw` 是"一次性"还是"保持"？其它操纵器呢？
7. `setprecision(2) << 1230.243` 为什么输出 `1.2e+03`？
8. 自定义操纵器为什么能写在 `<<` 链里？

---

## 11. 易错点

- **`cin >> c` 读不到空格/换行**：提取器默认跳过空白。
- **`cin.get` 后不 ignore 分隔符**，下一行读到空串。
- **`while ((ch = cin.get()) != EOF)` 里 `ch` 用了 `char`**：`EOF` 比较失效。
- **`setw` 以为会保持**：只影响下一次输出。
- **`setprecision` 不配合 `fixed`**：得到的是有效数字位数，不是小数位数。
- **`cout` 崩溃前没输出**：缓冲区没刷，加 `flush()` / `endl`。
- **混用 `printf` 与 `cout` 且关闭了 `sync_with_stdio`**：输出顺序错乱。

---

*上一篇：[[OOP/Chapter 9 Overloaded Operators AI精讲|Chapter 9 Overloaded Operators AI精讲]]　下一篇：[[OOP/Chapter 11 Template AI精讲|Chapter 11 Template AI精讲]]*
