# Polymorphism（多态）
- 先考虑一一种情况：有很多的图形需要存储以及生成，那么对每一种图形单独形成一个class以及指针是很复杂的。这时可以使用shape进行总体的概括，用shape以及render可以把众多形状放到一起使用虚函数管理。
- 定义一个shape函数:
```c++
class Point{...};// (x,y) point
class Shape
{
public:
	Shape();
	void move(const Point&);
	virtual void render();
	virtual void resize();
	virtual ~Shape();
protected:
	Point center;
}
```
- 如何增加新的shape？
```c++
class Ellipse: public Shape
{
public:
	Ellipse(float major, float minor);
	virtual void render();// will define own
protected:
	float major_axis, minor_axis;
};
class Circle: public Ellipse{
public:
	Circle(float radius) : Ellipse(radius, radius) {}
	virtual void render();
};
```
- 怎么调用呢?
```c++
void render(Shape*p) 
{
	p->render();// calls correct render function
}// for given Shape!
void func() 
{
	Ellipse ell(10, 20);
	ell.render();// static --Ellipse::render();
	Circle circ(40);
	circ.render();// static --Circle::render();
	render(&ell);// dynamic --Ellipse::render();
	render(&circ);// dynamic --Circle::render()
}
```
- Polymorphism（多态）
	- **向上转型**: 将派生类对象视为基类对象。==考虑lesson6中向上转型的范围！如果只是赋值是不会有多态的==
	- **绑定**:
		- **静态绑定**: 根据声明类型调用函数。    
		- **动态绑定**: 根据对象的"真实"类型调用函数（运行的时候才能决定）。==多态的关键因素==
	- 举个例子：当构建一个circl的时候，circle会有一个半径的值，但是也要初始化一个ellipse类，然后只不过是短轴和长轴的长相同！
- Virtual functions（虚函数）
	- 可以在派生类中透明地重写。
	- 对象携带一个虚函数表。
	- 编译器检查该表并动态地调用正确的函数。
	- 如果编译器在编译时能确定函数，也可能生成静态调用。
	- ==How virtual works in C++？==
		- 存在一个虚指针，指向相应的函数！
		![[Pasted image 20251110143559.png]]
		- 下面给出几个例子：
			- ellipse
			![[Pasted image 20251110143703.png]]
			- circle
			![[Pasted image 20251110143738.png]]
			- 比较ellipse与shape：
			![[Pasted image 20251110143805.png]]
	- 当我强制的将子类的赋值赋值给基类时：
		- **场景**: 将Circle对象赋值给Ellipse对象。    
		- **后果**:    
		    - Circle对象特有的部分（如area）被==**切割掉**==。		        
		    - 只复制了适合Ellipse对象大小的部分。		        
		    - Circle的vptr被忽略，elly的vptr仍然指向Ellipse的虚函数表。		        
		    - 因此，通过elly调用render()，执行的仍然是Ellipse::render()。
	- 但当我使用指针赋值时：
		- **场景**: 将Circle指针赋值给Ellipse指针。    
		- **后果**:		    
		    - 两个指针指向**同一个Circle对象**。		        
		    - 通过Ellipse指针调用render()，会**动态调用Circle::render()**，因为虚函数机制通过vptr查找。
	- 虚函数与引用参数
		```c++
		void func(Ellipse&elly) {
			elly.render();
		}
		
		Circle circ(60F);
		func(circ);
		```
		- 使用`Circle::render()`即可调用
	- 虚析构函数
		- **重要性**: 如果析构函数可能被继承（即通过基类指针删除派生类对象），则必须将其声明为**虚函数**。    
		- **示例**: 
			```c++
			Shape *p= new Ellipse(100.0F, 200.0F);
			...
			delete p;// which dtor?
			```
		- **非虚析构函数问题**: 只有~Shape()被调用，可能导致Ellipse的资源泄漏。	    
		- **虚析构函数作用**: 调用~Shape()时会动态调用~Ellipse()，确保正确清理。
	- 重写(overriding在子类发生)
		```c++
		classBase
		{
			public:
			virtual void func();
			}
			class Derived: public Base{
			public:
			void func() override;// overrides Base::func()
		}
		```
	-  调用链上的函数（调用基类版本）
		```c++
		voidDerived::func() 
		{
			cout<<"In Derived::func()!";
			Base::func();// call to base class
		}
		```
		- `BaseClass::functionName()` 的语法,无需旧的函数名称！
	- 返回类型协变（当前标准）
		![[Pasted image 20251110145737.png]]
		- **规则**: 当D公有继承B时，D::f()可以返回B::f()返回类型的子类（对于指针或引用类型）。    
		- **状态**: 大多数现代编译器支持。
		- 示例
			```c++
			class Expr
			{
				public:
					virtual Expr* newExpr();
					virtual Expr& clone();
					virtual Expr self();
					Expr self2();
			};
			class BinaryExpr: public Expr
			{
				public:
					virtual BinaryExpr* newExpr();// ok
					virtual BinaryExpr& clone();// ok
					virtual BinaryExpr self();// Error!
					BinaryExpr self2();// ok, since it is a new function (name hiding)
			};
			```
	- 重载与虚函数（overloading）
		- **要点**: 如果重写一个重载的虚函数（多个版本），应该重写所有的重载版本。    
		- **风险**: 如果只重写一部分，未被重写的版本在派生类中可能会被**隐藏**（在静态绑定时无法访问）。
		- 示例
			```c++
			class Derived: public Base
			{
				public:
					virtual void func()
					{
						Base::func();
					}
				virtual void func(int) { ... };
			}		
			```
		- When you override an overloaded function, override all of the variants!
	- **重要提示**    
		![[Pasted image 20251110145852.png]]
		- **提示1**: **永远不要**重新定义继承来的非虚函数（因为没有动态分发）。		    
		- **提示2**: **永远不要**重新定义继承来的默认参数值（因为默认参数是静态绑定的）。
	- **Abstract base classes（抽象基类）**
		- **定义**: 包含**纯虚函数**的类。==完全没有任何的函数体==！
		- **特性**:    
		    - 只定义接口，不提供函数体（用`= 0`标记）。        
		    - 不能实例化对象。        
		    - 必须派生新类，并为所有纯虚函数提供定义后，才能实例化派生类对象。
	![[Pasted image 20251117134526.png]]
	- **为何使用**:    
	    - 建模需要。        
	    - 强制正确的行为（要求派生类实现接口）。        
	    - 定义接口而不定义实现。        
	- **何时使用**:    
	    - 当信息不足时（比如太抽象了，不知道怎么实现）。        
	    - 为接口继承而设计时。
	- **协议/接口类**
		- **定义**: 一种特殊的抽象基类，具有以下特点：    
		    - 所有非静态成员函数（除析构函数外）都是**纯虚函数**。        
		    - 拥有一个空的虚析构函数。        
		    - 没有非静态成员变量。        
		    - 可以包含静态成员。
		- 例如：![[Pasted image 20251117134921.png]]