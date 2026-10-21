# Smart Pointers
- **标准智能指针**
	- 栈上原生指针的标准库持有者
	- 销毁时释放资源![[Pasted image 20251222143813.png]]
	- - 栈上原生指针的标准库持有者  
	    − 标准库自动指针 (std::auto_ptr) (在 C++11 中弃用)  
	    − 标准库唯一指针 (std::unique_ptr)  
	    − 标准库共享指针 (std::shared_ptr)  
	    − 标准库弱指针 (std::weak_ptr)  
	    − …  
	    **参见 SmartPointerExample.cpp**
- **整合技术**
	- 模板    
	- 继承    
	- 引用计数    
	- 智能指针  
	    **参考资料：C++ 策略与战术，Robert Murray，1993年**
- **目标**
	- 引入维护引用计数的代码  
	    – 引用计数是对一个对象被共享次数的计数  
	    – 指针操作必须维护该计数    
	- UCObject 类持有计数  
	    –“使用计数的对象”    
	- UCPointer 是指向 UCObject 的智能指针  
	    – 智能指针是由类定义的对象  
	    – 使用模板实现  
	    – 重载了运算符-> 和 一元运算符\*
![[Pasted image 20251222145407.png]]
![[Pasted image 20251222145415.png]]
![[Pasted image 20251222145531.png]]