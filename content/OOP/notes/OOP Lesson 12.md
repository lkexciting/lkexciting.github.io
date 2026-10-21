# Iterators
- **迭代器的作用**:    
    - 提供一种按顺序访问元素的方法，而无需了解容器（Container）的内部细节。        
    - 是指针（pointers）的**泛化**（Generalization）。        
    - 通过标准的迭代器接口函数，将容器和算法（Algorithms）分离开来。        
    - 是连接算法和数据结构的**粘合剂**（glue）。        
    - 如果没有迭代器，若有 N 个算法和 M 个数据结构，你需要编写 N*M 个实现；有了迭代器，只需要 N+M 个。
- ![[Pasted image 20251208145801.png]]![[Pasted image 20251215132823.png]]
- **Requirements**
	- 在算法中使用的统一接口。    
	- 工作方式类似于指向容器元素的指针。    
	- 拥有 ++ 运算符以按顺序访问元素。    
	- 拥有 * 运算符以访问元素的内容。
- **auto_ptr智能指针**![[Pasted image 20251215133040.png]]![[Pasted image 20251215133054.png]]使用Template，如何构建Iterator？
	- 为演示如何编写迭代器，先定义链表结构。    
	    - class List (左侧)：        
	        - 包含 insert_front, insert_end 等方法。            
	        - 私有成员：front (头指针), end (尾指针), _size。            
	    - class ListItem (右侧 - 节点类)：        
	        - val(): 返回值。            
	        - next(): 返回下一个节点。            
	        - 私有成员：_value (数据), _next (指向下个节点的指针)。
	- ![[Pasted image 20251215133451.png]]操作符重载operator++, operator\* 与 operator->
		- 对于&（\*\*this）: this->ListIter(pointer),则\*this -> ListIter,那么\*(\*this)为ptr->value()，返回的是指向Value的地址
	- ![[Pasted image 20251215134013.png]]
		- **代码内容：**    
		    - 创建列表 List\<int\> myList 并插入元素。        
		    - 获取迭代器：        
		        - ListIter\<int\> begin = myList.begin();            
		        - ListIter\<int\> end = myList.end();            
		    - 声明迭代器 iter。        
		    - 调用算法：iter = find(begin, end, 3);        
		    - 检查结果：if (iter == end) 输出 "not found"。
- **The associated type of an iterator (迭代器的关联类型)**![[Pasted image 20251215134206.png]]
	- 我们有一个算法func_impl，内容如上那么我们强制对方输入iterator的前提下输入值，那么通过T引用的形式来拿到iterator指向的value
	- 我们==不知道 iter 的数据类型==，所以我们需要==另一个变量 v 来推导 T==![[Pasted image 20251215134547.png]]func(I iter) 内部调用了 func_impl(iter, \*iter)。通过传 \*iter 给 func_impl，利用编译器的参数推导机制来推断出 T，==并且没有办法拿到返回值，只能解决函数内部的数据类型的问题！==
	-  然而，我们可能需要更多与迭代器关联的类型信息（==不仅仅是值类型==，可能还需要返回值类型等，且仅仅靠参数推导有时不够用）
- **解决方法：Define the type information for an iterator (为迭代器定义类型信息)**![[Pasted image 20251215134910.png]]
	- 在迭代器结构体 struct myIter 内部：    
		- **红框标注：** typedef T value_type;    
	- 这就是解决方案：在迭代器内部定义一个==类型别名 value_type==，这就相当于迭代器自己“告诉”==外界==它指向什么类型。
	- 右侧展示如何使用：
		-  **红框标注：** typename I::value_type func(I iter)
	- ==函数的返回类型现在可以写成 typename I::value_type。这样就不需要额外的参数来推导类型了！==
- **The problem of the typedef trick (typedef 技巧的问题)**
	- 它==不支持指针类型==的迭代器，例如 int*, double*, Complex*。因为==原生指针不是类==，无法在里面定义 typedef。这会严重削弱 STL 编程的能力。
	- **解决方案：** 使用 **iterator_traits** (迭代器萃取) 技巧。![[Pasted image 20251215135300.png]]
	- 通用版本：struct iterator_traits 内部使用 typedef typename I::value_type value_type; (如果 I 是类，取其内部定义的类型)。    
	- ==指针特化版本==：template \<class T> struct iterator_traits\<T*> 内部定义 typedef T value_type; (如果 ==I 是指针 T*，直接定义类型为 T==)。
- **iterator_traits (迭代器萃取)**
	- How to use?![[Pasted image 20251215135406.png]]
		- 函数定义：func(I iter) 的==返回类型==写为 typename iterator_traits\<I\>::value_type。
		- 通过这一层间接层（Indirection），无论是类迭代器还是原生指针都能工作。    
		- 示例1：myIter\<int\> -> 调用通用 traits -> 成功。    
		- 示例2：int* p = new int[20] -> 调用 func(p)。    
		- 注释：// iterator_traits<int*>?? 这会触发特化版本，从而也能成功获取类型 int。
- **Template specialization (模板特化)**
	- **Primary template:**
		- template<class T1, class T2, int I>
		- class A { … };
	- **Explicit (full) template specialization:**
		- template<>
		- class A<int, double, 5> { … };
	- **Partial template specialization:**
		- template<class T2>
		- class A<int, T2, 3> { … };
- **The traits technique with template specialization (配合模板特化的 Traits 技术)**![[Pasted image 20251215140024.png]]
	- 左侧：template\<class T> class C (通用版本)，构造函数输出 "template T"。    
	- 右侧：template\<class T> class C\<T*> (针对指针的偏特化版本)，构造函数输出 "template T*"。    
	- 这演示了编译器如何根据类型选择最匹配的模板实现。
- ![[Pasted image 20251215140039.png]]
	- 展示了 iterator_traits 的通用版本定义：    
	- typedef typename I::value_type value_type;    
	- typedef typename I::pointer_type pointer_type;    
	- 这适用于那些自己定义了这些类型的容器迭代器类。
- ![[Pasted image 20251215140048.png]]
	- 左侧：通用版本（同上页）。    
	- 右侧：针对原生指针 T* 的偏特化版本。    
	    - template\<class T> class iterator_traits\<T*>        
	    - typedef T value_type;        
	    - typedef T* pointer_type;        
	- 这样，当迭代器是 int* 时，value_type 就是 int。
- ![[Pasted image 20251215140054.png]]
	- 左侧：通用版本。    
	- 右侧：针对 const T* (常量指针) 的偏特化版本。    
	    - template\<class T> class iterator_traits\<const T*>        
	    - typedef T value_type; (注意：即使是 const 指针，其值类型通常还是 T，但在某些实现中需注意 const 的去除或保留，这里演示的是提取基础类型)。        
	    - typedef const T* pointer_type;
- **Standard traits in STL (STL 中的标准 Traits)**
	- 在 STL 中，标准的 iterator_traits 必须定义以下 5 种类型：
		1. iterator_category (迭代器类别，如输入、前向、随机访问等)    
		2. value_type (元素类型)    
		3. difference_type (两个迭代器之间的距离类型)    
		4. pointer (指针类型)    
		5. reference (引用类型)
- **Iterator category (types) (迭代器类别)**![[Pasted image 20251215140833.png]]
	- C++ STL 中迭代器分为五类（功能由弱到强）：
		1. InputIterator (输入迭代器：只读，单次扫描)    
		2. OutputIterator (输出迭代器：只写，单次扫描)    
		3. ForwardIterator (前向迭代器：可读写，多次扫描，只能向前)    
		4. BidirectionalIterator (双向迭代器：可双向移动)    
		5. RandomAccessIterator (随机访问迭代器：支持 +n, \[] 等操作，如 vector 的迭代器)
- **总结内容：**![[Pasted image 20251215140827.png]]
	- **容器 (Container)** 知道如何设计它自己的迭代器（因为只有容器知道自己的内存布局）。 
	- **Traits (萃取) 技巧** 提取嵌入在不同迭代器中的类型信息，包括对原生指针 (raw pointers) 的支持。    
	- **算法 (Algorithms)** 通过迭代器的设计哲学，实现了与容器的**独立 (independent)**。