---
title: OOP Lesson 6
aliases:
  - OOP/notes/OOP Lesson 6
---
# Composition & Inheritance（组合与继承）
- ==`Composition 组合 `==：用已有的对象构造新对象
	- 一个对象是可以由其他已经存在的对象组成的，是==“**有一个（has-a）**”==的关系
	- 对象可以构建其他的对象，可以通过==完全包含==和==通过引用包含==的方法，其中通过引用包含可以共享
	![[Pasted image 20251103135801.png]]
	![[Pasted image 20251103135933.png]]
	- 上图是一个简单的雇佣关系的例子
	![[Pasted image 20251103140131.png]]
	![[Pasted image 20251103140148.png]]
	- 这事一个在银行存钱的例子
	- **Embedded objects（嵌入对象）**
		- 所有嵌入对象都必须被初始化    
	    - 在以下情况下会调用默认构造函数：        
	        - 你没有提供参数，并且存在默认构造函数（或者可以构建一个）            
		- 构造函数的初始化列表    
		    - 任意数量的对象，用逗号分隔        
		    - 是可选的        
		    - 为子构造函数提供参数        
		- 语法：  
		    名称 ( 参数 ) [':' 初始化列表] '{'
	- 为什么能初始化列表就要初始化列表呢？
		- 因为在我们进入对象之前，成员对象已经自动被调用了构造函数了！
		- const只能通过列表进行修改，否则就会造成修改不了的情况
	- 尽量使用Private而不是Public，这样可以控制接口的安全性，是底层实现的一部分
- ==`Inheritance（继承）`==
	- **继承**是获取现有的类，克隆它，然后对这个克隆进行添加和修改。    
	- 这是 _**is-a**_（是一个）的关系
	- 是一种语言实现技术	    
	- 也是面向对象设计方法学的重要组成部分	    
	- 它允许共享以下内容的设计：	    
	    - 成员数据	        
	    - 成员函数	        
	    - 接口	        
	- 它是C++ 中的关键技术
	![[Pasted image 20251103143506.png]]
	- 表示CD是public的Item的一个继承，DVD也是public的Item的继承
	- 继承的优点：
		- 避免代码重复    
		- 代码重用		    
		- 更易于维护		    
		- 可扩展性
	- 对于之前组合的一个员工的例子，在继承中可以从雇佣者中继承出一个类：manager，管理人员，来体现管理人员会有一些不同于普通员工的函数或者变量。
		- Declare an Employee class
		![[Pasted image 20251103144031.png]]
		- Constructor for Employee
		![[Pasted image 20251103144103.png]]
		- Employee member functions
		![[Pasted image 20251103144126.png]]
		- Now add Manager
		![[Pasted image 20251103144140.png]]
		- 注意==class Manager : public Employee==，说明这是继承自Employee的类Manager
	- 因此，继承和构造函数：
		- 将继承的特性视为一个嵌入对象    
		- 基类通过类名提及
		![[Pasted image 20251103144420.png]]
	- ==值得注意的是，由于继承出来的类仍然属于父类，所以要对父类先进性初始化，再对这一个类进行初始化这个子类！==
		- 基类总是先被构造    
		- 如果没有显式参数传递给基类    
		    - 将调用默认构造函数        
		- 析构函数的调用顺序与构造函数完全相反。
	- 由于衍生类包含所有父类拥有的函数，所以在使用时加上前缀防止“认错”，如：
	![[Pasted image 20251103144906.png]]
	- 可以看到==Employee::print(out);==的存在，这就是调用父函数的前缀要求！
	- 当两者的函数名称相同时，他将只会看到子类的print而不是父类的print函数，这就是==Name hiding==现象（如下图）！
	![[Pasted image 20251103145541.png]]
	- “为什么bill里面的get_name可以被使用呢？”因为子类中没有这个函数！
	- ==Name Hiding：如果你在派生类中重定义了一个成员函数，那么基类中所有其他重载的函数都将变得不可访问。==
	- 那什么东西没被继承呢？
		- 基类构造函数
		- Destination
		- 赋值操作
	- class和struct的一个继承的区别
		- class defaults to private
		- struct defaults to public
		- public private与protected
		![[Pasted image 20251110132927.png]]
		也就是说：private>protected>public的优先级
		![[Pasted image 20251110133155.png]]
	- Friends（有缘类）的定义
		- 如果定义了另一个为这个类的friend,那么所有的数据将会被开放，可以看到private和protected的变量
		- 定义方式：
		```c++
		………………
		class ClassB;
		class ClassA
		{
			……
			friend class ClassB;
			……
		}
		………………
		```
		定义的时候一定要先告诉编译器存在一个ClassB了，不能直接定义friend class ClassB。
	- 有缘函数的定义：
	```c++
	class ClassA
	{
		……
		friend int addAB(ClassA,ClassB);
		……
	}
	class ClassB
	{
		……
		friend int addAB(ClassA,ClassB);
		……
	}
	```
	则这个addAB函数就是AB同时可以调用的全局函数！
	- Conversions
	- 公有继承应满足替换原则  
		– 若B是一种A，则在任何需要使用A的地方都能用B替代。  
		– 若B是一种A，则A具有的所有特性B也必然具备。  
		– 若替换不成立，务必谨慎处理！
	![[Pasted image 20251110135929.png]]
	- Up-casting(向上转型)
		- 向上转型是指从派生类的引用或指针转换为基类的引用或指针的行为。（子类到父类的，如果反过来会有机会出现错误！）
		- 用处是将派生类对象视为基类对象，但==仅对引用和指针有效==！
		- 举例：学生是人类。你们是学生，所以你们是人类（有种三段论？）。
