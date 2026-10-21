---
title: OOP Lesson 11
aliases:
  - OOP/notes/OOP Lesson 11
---
# Templates
- **为什么需要模板?**:    
    - 假设你需要一个存放 X 的列表和一个存放 Y 的列表。代码很相似，只是类型不同。        
    - **选择**:        
        1. **复制代码**: 虽保留类型安全，但难以维护。            
        2. **公共基类**: 可能不合适（强耦合）。       
        3. 无类型列表 (void)*: 类型不安全。
- **模板的作用**:    
    - **重用源代码**。        
    - **泛型编程 (Generic programming)**。        
    - 在类或函数定义中使用“类型”作为参数。        
	- **函数模板**: 例如 sort 函数。    
	- **类模板**: 例如容器 stack, list, queue。栈的操作与栈中存储的数据类型无关。![[Pasted image 20251208133920.png]]
- **模板语法**:    
    - 类型参数可以代表：        
        - 函数的参数类型。            
        - 函数的返回类型。            
        - 函数内部定义的变量类型。
- **模板实例化 (Template instantiation)**:    ==“想象为套用公式的类似”==
    - 根据模板和参数生成具体的函数或类定义的过程。        
    - 类型被替换进模板。        
    - 生成新的函数体或类定义（编译器会在此检查语法错误和类型）。        
    - **特化 (Specialization)**: 针对特定参数的模板版本。
- 示例![[Pasted image 20251208134324.png]]
	- 比如这一个例子中，它会变化为
		```c++
		void swap(int,int);
		void swap(float,float);
		```
		这两个函数
- **交互规则**:    
    - 只使用**精确匹配**的类型。        
    - **不应用转换操作**：        
        - Swap(int, int) -> OK            
        - Swap(int, double) -> **Error!** (因为==模板参数 T 不能同时是 int 又是 double==)。
    - ==也就是说只出现一个template T的时候仅代表一个数据类型，而不是同时可以指代多个数据类型！==
    - 即使是==隐式转换也会被忽略==。
- **重载规则**：    
    1. 优先匹配完全符合的普通函数。        
    2. 其次匹配函数模板（模板要求类型**精确匹配**，不进行自动类型转换）。        
    3. 最后才考虑需要隐式转换的普通函数。
	- ==当且仅当出现不存在可以使用的函数的时候才会使用模板==
- **类模板 (Class templates)**:    
    - 用类型参数化的类。        
    - 将操作从操作的数据类型中抽象出来。        
    - 定义了潜在的无穷多个类。        
    - 典型用途：容器类 (stack\<int\>, list\<Person*\>)。
- 以Vector为例
	- ![[Pasted image 20251208140330.png]]
	- ![[Pasted image 20251208140337.png]]
	- ![[Pasted image 20251208140344.png]]
	- ==T & Vector\<T\> :: operator[]\(int index)==必须添加这个T & 来表示这是谁的构造函数
	- ![[Pasted image 20251208140400.png]]
	- ![[Pasted image 20251208140405.png]]
- **多参数与嵌套**:    
    - 模板可以有多个参数：template <class Key, class Value>。        
    - 模板可以嵌套（作为新类型）：Vector<Vector<double*> > ==(注意：在旧标准中 >> 之间需要空格，否则会被识别为右移操作符==)。        
    - 类型参数可以很复杂（如函数指针）。
- **非类型参数 (Non-Type parameters)**:    
    - 模板参数可以是常量表达式（如整数），而不仅仅是类型。        
    - 示例：FixedVector 使用 int bounds 作为参数来定义固定大小的数组 T elements\[bounds]。        
    - **用法**: FixedVector<int, 50> v1;        
    - **总结**:        
        - 优点：可能代码更快（数组在栈上，无动态分配）。            
        - 缺点：代码膨胀（Vector<int, 50> 和 Vector<int, 51> 是两个完全不同的类），且大小写死不灵活。
- **模板与继承**:    
    - 模板类可以继承自非模板类。        
    - 模板类可以继承自模板类。        
    - 非模板类可以继承自模板类（例如 SupervisorGroup 继承自 List<Employee*>）。![[Pasted image 20251208142852.png]]
- **CRTP (奇异递归模板模式)**:    
    - **Curiously Recurring Template Pattern**: class Derived : public Base\<Derived>。     
    - **用途**: 在泛型编程中模拟虚函数（静态多态）。![[Pasted image 20251208143136.png]]        
    - 代码展示了基类如何通过 static_cast\<T*>(this) 调用派生类的实现。这发生在编译期，避免了虚函数表的运行时开销。
