---
title: OOP Lesson 9
aliases:
  - OOP/notes/OOP Lesson 9
---
# Overloaded Operators（重载运算符）
- 允许用户定义的类型像 *内置* 类型一样操作。
	- 假设我定义了一个类，分数类，那么使用原本的仅仅对数加减乘除方法必然无法得出正确的方法，需要自己定义一个==新型的运算方式==
- 另一种进行函数调用的方式。
- 哪些操作符可以重载？![[Pasted image 20251124133219.png]]
	一般的单目和双目运算符
- ==不能被重载的运算符：==![[Pasted image 20251124133305.png]]
	“.”是指针的取成员操作
	对于“.\*”这里给出一个例子
	![[Pasted image 20251124133747.png]]
		**补充知识点：**
		1. 指向成员的指针允许我们间接地访问类的成员，这在需要泛型回调或延迟绑定时非常有用。	    
		2. 使用`.*`或`->*`运算符来通过成员指针访问成员。
- **限制**
	- 只能重载已存在的运算符（不能创建\*\*运算符用于求幂）
	- 重载的运算符必须：
		– 保持操作数的数量
		– 保持优先级
- **C++的重载符**
	- 只是一个带有运算符名称的函数！
	- 使用operator关键字作为名称的前缀
		operator \*(...)
	- 可以是成员函数
		- 隐式第一个参数
			String String::operator+(const String& that);			
	- 可以是全局（自由）函数
		- 两个参数都是显式的  
			`String operator+(const String& 1, const String& r);`
- **==作为成员函数==**
	- 隐式第一个参数  
	- 不对接收者执行类型转换![[Pasted image 20251124134341.png]]
	- 例如：
		```c++
		Integer x(1), y(5), z;
		x + y; // ===> x.operator+(y);
		```
		- 隐式第一个参数
		- 开发者必须能够访问类定义		
		- 成员可以完全访问类中的所有数据		
		- 不对接收者执行类型转换
		z = x+y ==>z = x.operator + (y)✔
		z = x+3 ==>z = x.operator + (3)✔==此时会先将 3 变成integer类型==
		~~z = 3+y~~ 这种方法是错误的，3无法变成integer类型，无法操作
	- 对于二元运算符（+, -, \*, 等），成员函数需要==一个参数==。
	- 对于一元运算符（一元-, !, 等），成员函数不需要参数：
		```c++
		Integer operator-() const 
		{
		    return Integer(-i);
		}
		z = -x; // z.operator=(x.operator-());
		```
- **如何重载？作为==全局函数==**
	— 显示（explicit）第一个参数  
	— 对两个参数都执行类型转换  
	— 可以设为友元（can be made as a friend）
	```c++
	Integer operator+(const Integer& lhs, const Integer& rhs);
	Integer x, y;
	x + y // operator+(x, y);
	```
	- **显示第一个参数**    
	- **开发者不需要对类有特殊访问权限**    
	- **==可能==需要设为友元** （如果运算符需要访问私有成员，必须在类内声明为`friend`。）   
	- **对两个参数==都执行==类型转换**
- **全局运算符（friend）**
	```c++
	class Integer
	{
	public:
	    friend Integer operator+(const Integer&, const Integer&);
	    ...
	private:
	    int i;
	};
	
	Integer operator+(const Integer& lhs, const Integer& rhs)
	{
	    return Integer(lhs.i + rhs.i);
	}
	```
- **全局运算符**
	- Binary operators require two arguments
	- Unary operators require one argument![[Pasted image 20251124140029.png]]
	- 如果无法访问私有数据成员，那么全局函数必须使用公共接口（例如访问器）
- **Tips: Members vs. Free functions**
	- ==Unary operators== should be members（所有的单目运算符）
	- =() [] -> ->* must be members
	- ==All other== binary operators as non-members（其他的都应该是全局函数）
- **参数传递**（Argument passing）
	- If it is read-only: pass it in as a const reference(except built-ins)
	- Make member functions const that don't change the class(boolean operators, +, -, etc)
	- For global functions, if the left-hand side changes pass as a reference(stream inserters)
- **返回值**
	- 根据运算符的==预期含义选择返回类型==！
	- 对于`operator+`，你需要生成一个新对象。返回一个const对象，这样结果就不能作为左值（lvalue）被修改。
	- 逻辑运算符应该返回bool
- **运算符的原型**![[Pasted image 20251124140859.png]]
- **Operators ++ and --**
	- Postfix（后缀形式） forms take an int argument —— compiler will pass in 0 as that int![[Pasted image 20251124141112.png]]
	- 如上图，我们可以发现后缀的地方都在括号内加上了（int）以作区分，并且前缀的时候要添加“&”（虽然不知道为啥）
	- 下面给出一个例子：![[Pasted image 20251124142036.png]]
	- 使用重载的++和--![[Pasted image 20251124142402.png]]
	- 用户定义的前缀比后缀更高效。
- **关系运算符**
	- implement!=in terms of\=\=（用\=\=表示！=）
	- implement >, >=,<=in terms of <![[Pasted image 20251124142639.png]]![[Pasted image 20251124142648.png]]![[Pasted image 20251124142659.png]]
- **运算符“\[]”**==(示例：Vector.h 和 Vector.cpp)==
	- **Must be a ==member function**==
	- ==Single argument==
	- 意味着对象像数组一样操作，因此应该返回一个引用
- **Copy Vs Initialization**
	```c++
	MyType b;

	// 初始化使用拷贝构造函数
	MyType a = b;
	
	// 拷贝使用赋值运算符
	a = b;
	```
	- `MyType a = b;`**是初始化**，**调用拷贝构造函数**，**不是赋值**
- **自动 operator= 创建**
	- 如果未显式提供，编译器将自动创建一个。
	- 逐成员赋值
- **Assignment operator**（赋值运算符）
	- Must be a member function
	- Will be generated for you if you don't provide one![[Pasted image 20251124144610.png]]
	- For classes with dynamically allocated memory declare an assignment operator (and a copy constructor)【对于具有**动态**分配内存的类，声明一个赋值运算符（和一个拷贝构造函数）】
	- To prevent assignment, explicitly declare `operator=` as private, or use `=delete`
	- 使用`= delete`可以明确禁止拷贝赋值，这是现代C++的推荐做法。
- **运算符“（）”**
	- A functor（仿函数）, which overloads the function call operator, is an object that acts like a function.![[Pasted image 20251124145137.png]]
	- “F f”中的f实际上就是一个“functor”
- **值类（value classes）**
	- 表现得像原始数据类型
	- 传递给函数并从函数返回
	- 具有重载的运算符（通常）
	- 可以与其他类型相互转换
	- 补充：
		- 值类应该是轻量级的，适合按值传递。    
		- 设计值类时，应提供完整的运算符集，使其行为与内置类型一致。    
		- 值类通常应该是不可变的，或者至少提供值语义。
- **User-defined type conversions**（用户定义的类型转换）
	- A conversion operator can be used to convert an object of one class into
		–an object of another class
		–a built-in type
	- Compilers perform implicit conversions using:
		–Single-argument constructors
		–implicit type conversion operators
- **单参数构造函数**
	- ![[Pasted image 20251124145800.png]]
- **防止隐式转换**
	- ==新关键字：explicit==![[Pasted image 20251124145956.png]]
