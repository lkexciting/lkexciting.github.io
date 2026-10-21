- **Image format**
	- Purpose: store image information
	- Characteristic of image: pixel based, rectangle region, with lots of information
	- Some image formats are highly related to operating systems: windows, unix, mac OS, etc..
	- Encoding methods: without compression, lossless compression, Lossy compression
	- Representative formats: BMP、JPEG、TIFF、GIF、PNG……
- **BPM格式**
	- Windows系统中的标准文件格式之一    
	- 有时.bmp文件也被保存为.dib文件。    
	- 大多数情况下，BMP以非压缩方式组织。    
	- 但是，它也支持图像压缩，例如，RLE格式（游程编码）
- BMP文件结构  
	- BITMAPFILEHEADER   bmfh; // 图像文件头  
	- BITMAPINFOHEADER bmih; // 图像信息头  
	- RGBQUAD                   aColors\[]; // 调色板  
	- BYTE                            aBitmapBits\[]; // 图像数据
- BMP图像文件头
	`BITMAPFILEHEADER` 结构体定义：
	```c
	typedef struct tagBITMAPFILEHEADER {
	    WORD bfType;      // 文件类型，必须为'BM'
	    DWORD bfSize;     // 文件总大小（字节）
	    WORD bfReserved1; // 保留，必须为0
	    WORD bfReserved2; // 保留，必须为0
	    DWORD bfOffBits;  // 从文件头到实际图像数据的偏移量
	} BITMAPFILEHEADER, *PBITMAPFILEHEADER;
	```

	文件头各字段说明：

|起始位置|大小|名称|用途|
|---|---|---|---|
|1|2|bfType|必须始终设置为'BM'，表明这是一个.bmp文件。|
|3|4|bfSize|指定文件的总大小（字节）。|
|7|2|bfReserved1|必须始终设置为零。|
|9|2|bfReserved2|必须始终设置为零。|
|11|4|bfOffBits|指定从文件头到实际位图数据的偏移量。|
- **BMP图像信息头**
	`BITMAPINFOHEADER` 结构体定义：
	```c
	typedef struct tagBITMAPINFOHEADER {
	    DWORD biSize;          // 本结构体所需的字节数
	    LONG  biWidth;         // 图像宽度（像素）
	    LONG  biHeight;        // 图像高度（像素）。正数表示倒向位图，负数表示正向位图
	    WORD  biPlanes;        // 颜色平面数，必须为1
	    WORD  biBitCount;      // 每像素位数（位/像素），可为1, 4, 8, 16, 24, 32
	    DWORD biCompression;   // 压缩类型，此处讨论无压缩：BI_RGB
	    DWORD biSizeImage;     // 图像数据大小（字节）。当biCompression=BI_RGB时，可设为0
	    LONG  biXPelsPerMeter; // 水平分辨率，像素/米
	    LONG  biYPelsPerMeter; // 垂直分辨率，像素/米
	    DWORD biClrUsed;       // 实际使用的颜色索引数（0表示使用调色板所有项）
	    DWORD biClrImportant;  // 显示图像重要的颜色索引数（0表示所有项都重要）
	} BITMAPINFOHEADER, *PBITMAPINFOHEADER;
	```
	![[Pasted image 20260312135921.png]]
- **调色板与位图数据 (Palette and bitmap data)**
	- **调色板 (Palette)**：大小为 N * 4 字节。对于调色板中的每一项 (RGBQUAD数组)，这 4 个字节分配如下：    
	    - 1 字节用于蓝色 (rgbBlue)        
	    - 1 字节用于绿色 (rgbGreen)        
	    - 1 字节用于红色 (rgbRed)        
	    - 1 字节始终为零 (rgbReserved，保留字)![[Pasted image 20260312141352.png]]        
	- **位图数据 (Bitmap data)**：其大小取决于图像尺寸和颜色深度。它存储的是调色板的索引号，或者是直接的 RGB 值（取决于色深设置）。
- **位图数据读取规则**
	- **屏幕显示 vs 文件存储**：存储在 .bmp 文件中的像素行是上下颠倒的。您无需手动翻转行，用于显示位图的 API 函数会自动帮您处理。    ![[Pasted image 20260312141514.png|478]]
	- **字节对齐要求（四字节对齐）**：非常重要的一点是，**一行中的字节数必须始终调整为 ==4 的倍数**==。只需在行末追加空白（0字节），直到一行达到 4 的倍数。
		- for example:![[Pasted image 20260312141531.png]]
- **成像设备的发展历史与基本原理**
	- **成像工具 ：卡片数码相机、数码单反相机 (DSLR)、网络摄像头 (Webcam)、智能手机。    
	- **历史进程 **：    
	    - 动物眼睛的进化（很久以前）。        
	    - **中国古代《墨经》** (2400年前)：记录了小孔成像原理（“景到，在午有端……”）。        
	    - **针孔透视投影**：Brunelleschi（15世纪）。        
	    - **暗箱 (Camera obscura)**：16世纪。        
	    - **第一台摄影相机**：Niepce（尼埃普斯），1816年，拍下了人类第一张照片。
- **What is the suitable size for aperture（光圈）?**
	- Why **not** make the aperture ==as small as possible==?
		- The quantity of light is too small.
		- Lead to diffraction if the aperture is too small.
		- Difficult to control.
- **增加透镜（Adding a Lens）：
	- 透镜将光线聚焦在胶片上。在特定的距离内，物体处于“对焦 (in focus)”状态；
	- 而其他未对焦的点在图像中会投射成“==**弥散圆**== (circle of confusion)”。
	- ==改变透镜形状会改变这一距离==。![[Pasted image 20260312142127.png|453]]
- **光圈大小与景深（Aperture size vs. depth of field）**：
	- 改变光圈大小会影响景深。
	- **较小的光圈（数字大，如 f/32）会增加清晰对焦的范围（即景深变大）**。![[Pasted image 20260312142021.png|325]]
- **相机的演变 (History of imaging device)**![[Pasted image 20260312142313.png|370]]
	- 19世纪的工作室相机（大画幅）。    
	- 1885-1888：柯达与胶卷 (film) 的诞生。   ![[Pasted image 20260312142331.png|450]] 
	- **35毫米相机**：Oskar Barnack 于1913年开始设计。1925年 Leica I 问世。佳能在1936年开始生产35mm相机。 ![[Pasted image 20260312142342.png|469]]   
	- **镜头组**：更灵活的控制和更好的成像质量（展示了复杂的镜头剖面图）。   ![[Pasted image 20260312142405.png|422]] 
	- **SLR（单镜头反光相机）**：1933年初步设计；苏联的“Sport”是第一台真正的35mm单反；二战后开始流行。代表厂商：Pentax, Canon, Nikon, Leica。（包含单反内部反光镜结构图）。    ![[Pasted image 20260312142418.png|586]]
	- **自动相机**：20世纪70年代第一台自动曝光相机；1982年第一台“傻瓜相机（紧凑型）”。
- **数码时代与数码相机原理(Digital age & DC principle)**、
	- **数码时代 (第 30 页)**：
		- 记录介质从胶片（Film）向 CCD（电荷耦合器件）的转变。伴随着行业霸主伊士曼柯达的破产。    
	- **数码相机的诞生 (第 31 页)**：    
	    - 技术源于 1961 年航天器的测高技术。        
	    - 1988年：富士 DS-1P，第一台真正的数码相机（未商业化）。        
	    - 1990年：罗技 Fotoman，第一台商用数码相机。        
	    - 代表产品：柯达 DCS-100；尼康 D1（第一台数码单反）。        
	- **CCD结构图 (第 32 页)**：光线 -> 透镜 -> CCD/光电二极管 -> 放大器 -> AD 转换 -> DSP -> 内存。    ![[Pasted image 20260312142731.png|511]]
	- **数码相机成像原理步骤 (第 33 页)**：【原笔记缺少图片：Pasted image 20260312142756.png】
	    1. 拍照时，光线穿过镜头到达 CCD。        
	    2. 曝光时，光电二极管受激释放电荷，产生电信号。        
	    3. CCD 将电信号收集并输出到放大器。        
	    4. 放大滤波后信号到达 ADC（模数转换器），将连续信号转为离散数字信号。        
	    5. 数字信号交由 **DSP (数字信号处理器)** 处理。进行色彩校正和白平衡处理，编码为目标格式。        
	    6. 最终作为图像文件保存在存储卡上供预览。
- **颜色的物理意义与反光去除 (Physical meaning of color)**
	- 五彩缤纷的视觉产生于光线与物体之间的相互作用，如：反射、折射、散射、透射、吸收和衍射。    
	- 引出一个底层但尚未完全解决的图像处理难题：**双色反射分离 (Dichromatic Reflection Separation)**，即去除透明介质上的反光现象。![[Pasted image 20260312145544.png]]
- **光、色彩与人眼视觉 (Light, color and human eye)**
	- **光与色**：颜色视觉是不同波长的光到达视网膜时人类大脑产生的感觉。可见光波长在 390nm\~780nm 之间。人类通常可分辨 120\~180 种颜色，包括7大主色。    
	- **视网膜 (Retina)**：功能类似相机底片。包含两种视觉细胞：    
	    - **视杆细胞 (Rods)**：约 1 亿个，对光敏感，但**不能分辨颜色**。        
	    - **视锥细胞 (Cones)**：约 600-700 万个，在强光下工作，**能分辨不同颜色**。        
	- **三原色视觉机制**：    
	    - 人类具有三种视锥细胞（或感光色素），分别响应**红(RED)、绿(GREEN)和蓝(BLUE)**波长。        
	    - 光线刺激对应的视锥细胞，在大脑中产生颜色感知。        
	    - 如果三种视锥细胞同时受到等量刺激，就会产生全色盲/无彩色视觉（即看到白色/灰色）。
- **色彩视觉基础与 CIE 标准**![[Pasted image 20260312145839.png|566]]
	- **CIE（国际照明委员会)基于实验结果，选择 700nm(红)、541.6nm(绿)和 435.8nm(蓝)作为物理三原色，绘制了标准的刺激光谱分布图（左图）。    
	- 引出了1931年定义的 CIE 颜色空间（马蹄图）。
- **颜色视觉的物理与心理特性**
	- **环境上下文影响**：绝对颜色视觉是不精确的，人类依赖视觉环境（对比度）来识别颜色。（图中 A 块和 B 块实际灰度相同，但因周边颜色不同看起来差异极大）。![[Pasted image 20260312145939.png|206]]    
	- **个体差异：不同的人可能具有不同的颜色/灰度感知能力。    
	- **韦伯定律 / Weber's Law：人眼可感知的最小亮度差异（可见对比度）与背景的原始亮度成正比。    ![[Pasted image 20260312150015.png|551]]
	- **感知优先级与敏感度：    
	    - **优先级**：人类首先注意到**色相(H)**的变化，然后是**饱和度(S)**，最后是**亮度(V)**。   
	    - **敏感度**：人眼对**亮度的变化最为敏感**，并拥有最高的分辨率，这就是人眼具有极高动态范围 (HDR) 的原因。