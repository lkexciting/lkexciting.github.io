# THE PHYSICAL LAYER（物理层）

> 根据 Chapter2.pdf 第 1–117 页整理。中文解释保留英文专业名词；配图来自原课件，页码为 PDF 页码。以“介质 → 信道极限 → 编码与调制 → 复用 → 通信系统”为主线。历史设备、速率与监管案例按课件背景理解；补充提醒说明公式条件和易错点。

## 1. Physical Layer: Overview

**Physical Layer / PHY** 是课程模型的最底层，规定如何将 bits 表示为信号并在 Channel 上传输，包括电气、光学、机械、时序及相关接口。

- **Guided media**：信号沿 Copper、Coaxial cable、Fiber 等介质传播。
- **Wireless media**：以地面无线电等方式传播。
- **Satellite communication**：借助卫星中继。
- **Digital modulation / Line coding**：把 bits 映射为可传输的波形。
- **Multiplexing**：让多个通信流共享介质或传输资源。

PHY 主要处理 Signal、Symbol、Bit，不负责 IP Routing 或应用语义；Frame 的识别主要属于 Data Link Layer。

## 2. Guided Transmission Media

### 2.1 Persistent Storage

把数据写入 Tape/Disk，再物理运送。大批量数据可有很高的有效 Throughput，但具有较大的 Latency，难以支持实时交互。

课件例：800 GB/tape×1000 tapes，在一天内运送：

`800×1000×10⁹×8/86400 ≈ 74.07 Gbps`。

这是批量传输平均值，未计写入、读取与其他搬运时间。

### 2.2 Twisted Pair

**Twisted pair** 由两根绝缘 Copper wires 相互绞合。绞合配合差分传输有助于降低外部干扰和 Crosstalk。

- **UTP（Unshielded Twisted Pair）**：无屏蔽双绞线。
- **Shielded twisted pair**：增加屏蔽以改善干扰条件。
- 课件比较 Category 3 与 Category 5，后者绞合更密。
- Category、频率性能、长度及使用的 Ethernet 标准共同决定可用速率，不能只凭“Cat 6”推出所有距离都支持同一速率。

![Category 3 与 Category 5，PDF 第 6 页](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%202_ai/page-006.png)

**传输方向：**

| 模式 | 特点 | 例子 |
|---|---|---|
| Simplex | 只有一个方向 | 单向广播模型 |
| Half-duplex | 可双向，但不能同时 | Walkie-talkie |
| Full-duplex | 可同时双向 | 支持双工的点对点链路 |

### 2.3 Coaxial Cable

由中心导体、绝缘层、外导体/屏蔽和保护外套组成。屏蔽有助于抗噪声，课件用于长距离线路和 Cable network 示例。

![Coaxial cable 的结构，PDF 第 8 页](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%202_ai/page-008.png)

### 2.4 Power Lines

在供电线路上承载通信，可用于抄表、家庭组网等。优势是利用已有布线；挑战是介质最初不是为高质量通信设计，受电器噪声、负载和线路结构影响。

### 2.5 Fiber Optics

基本组成：**Light source → Fiber → Detector**。典型光纤由 Core、Cladding 和保护层组成，通过折射率结构约束光传播。

- **Multimode fiber**：可传播多个 modes，Modal dispersion 会使不同传播分量到达时间不同。
- **Single-mode fiber**：主要传播单一 mode，减少 Modal dispersion，适合较长距离；仍可能存在 Chromatic dispersion 等限制。
- 常见光通信波长窗口：0.85、1.30、1.55 μm，即约 850、1300、1550 nm。
- Light source：LED 或 Semiconductor laser；Detector 常用 Photodiode。
- 连接：Connector、Mechanical splice、Fusion splice。

![光在光纤中的传播与约束，PDF 第 11 页](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%202_ai/page-011.png)

![Attenuation 与波长窗口，PDF 第 12 页](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%202_ai/page-012.png)

| 相对 Copper 的优势 | 代价或限制 |
|---|---|
| 较大传输容量、较低衰减，适合长距离 | 光电接口、安装和连接要求 |
| 不受电磁干扰，电气隔离 | Fiber 不能像 Copper 一样直接输送电力 |
| 细、轻 | 弯曲、机械损伤、接头损耗等约束 |
| 难以直接电磁窃听 | 不等于无法被窃听，也不自动替代加密 |

**课件提醒：**“1 ns Detector 限制约 1 Gbps”“Fiber 没有极限”等表述是设备例子或强调容量的修辞，不是所有光通信的上限。电气隔离也不代表整套设备不会受断电影响。

## 3. Wireless Transmission

### 3.1 Electromagnetic Spectrum

在同一传播介质中，**v=fλ**；真空中 v=c≈3×10⁸ m/s。

- Frequency f 越高，对应 Wavelength λ 越短。
- **Bandwidth H** 是频率范围的宽度，单位 Hz；不是某个 Carrier frequency，也不是 bps。
- 较宽 H 可以支持更高 Data rate，但还受 Noise、调制和编码条件影响。
- 频段会影响天线、传播、遮挡、干扰及可用资源。

![Electromagnetic spectrum，PDF 第 18 页](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%202_ai/page-018.png)

### 3.2 Spread Spectrum

- **FHSS（Frequency-Hopping Spread Spectrum）**：按共享规则切换频率。
- **DSSS（Direct-Sequence Spread Spectrum）**：用更高速 chip sequence 扩展数据的频谱。
- **UWB（Ultra-Wideband）**：使用很宽频谱范围的信号。

扩频涉及同步与接收处理，不能简单理解为“把频率变高”或“直接提高有效数据率”。

### 3.3 Radio、Microwave、Infrared、Lightwave

| 类型 | 主要传播特点 | 主要挑战 |
|---|---|---|
| Radio transmission | 传播条件随频段变化；低频可有 Ground wave，HF 可有 Ionospheric propagation | 干扰、频谱协调、天线与环境 |
| Microwave transmission | 常使用定向天线与 Line-of-sight | 遮挡、Multipath fading、部分频段的 Rain attenuation |
| Infrared | 常用于近距离定向或室内场景，通常不穿透不透明墙体 | 遮挡、环境光干扰 |
| Millimeter wave | 短波长，便于形成窄波束 | 遮挡、对准、随频段变化的吸收和衰减 |
| Lightwave / Free-space optical | 激光等在自由空间形成定向连接 | 对准、雾、湍流与气流 |

![Ground wave 与 Ionospheric propagation，PDF 第 23 页](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%202_ai/page-023.png)

![Free-space optical 与气流影响，PDF 第 28 页](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%202_ai/page-028.png)

课件“Radio 总是全向”“Infrared 不能室外使用”“某频率以上都完全直线”等是简化说明。方向性还受 Antenna 影响，能否应用需结合具体传播环境，不能当作绝对规律。

## 4. Communication Satellites

### 4.1 基本原理

卫星可看作空中的 Relay。**Transponder** 接收 Uplink 信号，经过处理或放大，再在 Downlink 发出；上、下行常用不同频率以减少相互干扰。

**Kepler 关系：**Orbital period `T ∝ r^(3/2)`，r 是距地心的轨道半径，不是直接用离地高度代替。

### 4.2 GEO、MEO、LEO

| Orbit | 高度与运动的理解 | 通信取舍 |
|---|---|---|
| GEO（Geostationary） | 约 35,800 km；圆形、赤道轨道、同地球自转方向，周期约一个恒星日 | 大 Footprint、地面天线可较稳定指向，但传播时延大 |
| MEO（Medium-Earth Orbit） | 介于低轨与地球静止轨道之间，典型示例为导航系统 | Coverage、数量、Delay 介于不同轨道系统之间 |
| LEO（Low-Earth Orbit） | 较低高度，相对地面快速运动 | 较短空间链路、较低传播时延，通常需要更多 Satellites 和 Handover |

![卫星轨道、覆盖和 Delay，PDF 第 32 页](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%202_ai/page-032.png)

**易错：**Geosynchronous 不必然 Geostationary；后者还要求适当轨道形状、倾角和运动方向。Latency 不能只由“低轨”两个字确定，还要计入地面路由与处理。

### 4.3 VSAT 与 LEO 示例

- **VSAT（Very Small Aperture Terminal）** 是小口径卫星终端。
- 课件 Hub 架构中，两个低功率终端通过大天线地面 Hub 中继；多一段中继可能进一步增加 Delay。
- **Iridium** 是课件的 LEO 历史案例，借此理解星座、多轨道面和覆盖，而非记为当前卫星数量的完整事实。
- 网络可用 Inter-satellite links 在空间转发，也可在地面完成主要转接。

![VSAT Hub，PDF 第 34 页](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%202_ai/page-034.png)

![Space relay 与 Ground relay，PDF 第 39 页](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%202_ai/page-039.png)

课件“MEO 不用于电信”“进入辐射带会很快毁坏”等不能作绝对结论：MEO 可承载通信，辐射带主要增加设计与耐辐射要求。此处无需记忆过时部署判断。

## 5. From Waveforms to Bits

### 5.1 Fourier Analysis 与 Bandwidth-Limited Signals

一个适当的周期波形可以分解为 DC component 和多个 Sinusoidal harmonics。

`g(t)=c/2 + Σ[a_n sin(2πnft)+b_n cos(2πnft)]`，其中 `f=1/T`。

- Fundamental frequency 为 f，第 n 个 Harmonic 的频率为 nf。
- 方波等含多个高频分量；Channel 带宽有限，会衰减部分分量，使边沿变圆、波形失真。
- 保留更多 Harmonics，通常可以更接近原波形。
- 并非一定要恢复完美方波才能恢复 bits；关键是 Receiver 能否可靠判断发送的 Symbols。

![信号与 Harmonics，PDF 第 44 页](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%202_ai/page-044.png)

![保留有限 Harmonics 后的近似，PDF 第 48 页](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%202_ai/page-048.png)

课件 8-bit pattern 的例子：bit rate 为 b，则周期 `T=8/b`，Fundamental frequency `f=b/8`。H=3000 Hz 时，最多通过约 `floor(24000/b)` 个 Harmonics。这个 T 只对应所设的 8-bit repeating pattern，不是所有数据流的通用周期。

### 5.2 Symbol Rate vs. Data Rate

- **Symbol**：从一组可区分信号状态中选择一个状态。
- **Symbol rate / Baud rate**：每秒发送的 Symbols，单位 baud。
- **Data rate / Bit rate**：每秒承载的 bits，单位 bps。
- 固定长度映射、无额外编码时，M 个 Symbols 对应 `log₂M` bits/symbol，`R_b=R_s log₂M`。
- 有 Line coding、Error-correcting code、Framing 等开销时，Net data rate 还需扣除冗余。

例：8 个电平，每 Symbol 3 bits；1200 baud 则为 3600 bps。Manchester 中一个 data bit 用两个 half-bit signal elements，按课件定义 line symbol rate 为 data rate 的两倍。

### 5.3 Nyquist Theorem

在课件的 **ideal noiseless、带宽 H 的实基带信道** 模型中：

**`R_s ≤ 2H`**，**`R_b ≤ 2H log₂M`**。

- H 单位 Hz，M 为可区分的 signal levels。
- 说明有限带宽限制 Symbol rate；提高每 Symbol bits 可提高对应 bit rate。
- 该理想上界需要合适的 Pulse shaping 等条件，不是任意波形都可直接达到。
- 不只适用于 Copper；任何满足相应信道模型的介质，包括 Fiber，都受这一类带宽约束。

### 5.4 Shannon Capacity

在课件使用的带宽 H、加性白高斯噪声等理想模型中：

**`C=H log₂(1+S/N)`**。

- S/N 是功率比，必须用 Linear ratio。
- `SNR_dB=10 log₁₀(S/N)`，反换算为 **`S/N=10^(SNR_dB/10)`**。
- 20 dB → S/N=100，而不是 20。
- C 是理论 Capacity；不能保证某个具体 Modulation、Code 或有限 block length 可以达到。

### 5.5 联合使用与公式约定

如果题目采用课件统一的 H 定义，并规定 M 个可区分 levels，则分别检查：

`R_b ≤ min[2H log₂M, H log₂(1+S/N)]`。

**特别提醒：**对实际 Passband QAM，Bandpass bandwidth、Pulse shaping 和 Symbol rate 的关系必须按题目定义。有些模型使用 `H_passband≈(1+α)R_s`，不能把实基带的 `R_s≤2H` 无条件搬到任意无线 Channel。本笔记的课件 Quiz 使用课件自己的 Nyquist 约定计算。

## 6. Digital Modulation

### 6.1 Baseband vs. Passband

- **Baseband transmission**：信号占据靠近零频到某个上限的频率范围，常用 Line coding。
- **Passband transmission**：信号位于 Carrier 附近，用 Amplitude、Frequency、Phase 等变化承载信息。
- “Digital information”与“Analog waveform”并不矛盾：数字 bits 必须借助实际连续物理信号传播。

### 6.2 Baseband Line Coding

| Coding | 规则 | 优点 | 主要问题 |
|---|---|---|---|
| NRZ（Non-Return-to-Zero） | 用不同电平表示 0/1 | 简单、较少 signal elements | 长串相同比特缺少变化，Clock recovery 困难 |
| NRZI（NRZ Inverted） | 课件约定：1 导致 transition，0 不变 | 对 transition 而非绝对电平判决 | 长串 0 仍缺少 transition；规则可因协议不同而相反 |
| Manchester | 每 bit 中点必有 transition，方向表示数据 | 携带时钟信息 | 每 bit 两个 signal elements，频带需求更大 |
| AMI（Alternate Mark Inversion） | 0 为零电平，1 正负交替 | 减少 DC 成分，可利用极性规则 | 长串 0 仍可能缺乏 transitions |

![NRZ、NRZI、Manchester、AMI 波形，PDF 第 57 页](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%202_ai/page-057.png)

**Clock recovery**：Receiver 必须知道 Symbol/Bit boundaries。电平不变时，难以仅凭波形判断究竟经过了多少个 bits。

### 6.3 4B/5B

用 5 个 line bits 编码 4 个 data bits，选取适当 Codewords 限制连续 0，并配合如 NRZI 的方式提供时钟变化。

- Code rate=4/5=80%。
- Line bits 相对 data bits 增加 25%；冗余占输出比例为 20%，分母不同。
- 例：课件 `0000→11110`，`0001→01001`。
- 它是 Block/Line coding，不能把“有冗余”直接理解为能纠正任意错误。

![4B/5B 映射表，PDF 第 61 页](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%202_ai/page-061.png)

按课件简化模型，带宽 H、无噪声：Binary NRZ 最大 data rate≈2H，Manchester≈H；给定 data rate B，所需带宽分别至少约 B/2、B。实际频谱占用还取决于带宽定义、脉冲形状与允许失真。

### 6.4 Passband Modulation

- **ASK（Amplitude Shift Keying）**：改变 Amplitude。
- **FSK（Frequency Shift Keying）**：改变 Frequency。
- **PSK（Phase Shift Keying）**：改变 Phase。
- **QPSK（Quadrature PSK）**：4 个相位状态，每 Symbol 2 bits。
- **QAM（Quadrature Amplitude Modulation）**：通过正交 I/Q 分量组合形成多个 Amplitude/Phase 状态。

![ASK、FSK、PSK 波形，PDF 第 62 页](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%202_ai/page-062.png)

**Constellation diagram** 中每个点代表一个 Symbol。M 个点时，固定长度映射每 Symbol 为 log₂M bits。

| Modulation | Points | Gross bits/symbol |
|---|---:|---:|
| QPSK | 4 | 2 |
| 16-QAM | 16 | 4 |
| 64-QAM | 64 | 6 |

![QPSK、16-QAM、64-QAM Constellations，PDF 第 63 页](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%202_ai/page-063.png)

点数越多，在相同功率下通常越密集，Receiver 越难区分，需要更好的 SNR 或更强处理。若每 Symbol 有 check bits，有效 bits/symbol 小于 gross mapping bits。

## 7. Multiplexing

### 7.1 总体对比

| 方法 | 共享维度 | 核心思路 |
|---|---|---|
| FDM（Frequency Division Multiplexing） | Frequency | 为不同流分配频带，通常设置 Guard bands |
| TDM（Time Division Multiplexing） | Time | 按 Time slots 轮流使用资源 |
| CDM（Code Division Multiplexing） | Code | 用可分离 Code sequences 同时传输 |
| WDM（Wavelength Division Multiplexing） | Optical wavelength | 多种光波长共享一根 Fiber |

### 7.2 FDM 与 OFDM

**FDM** 把多个信号放到不同频带。**OFDM（Orthogonal Frequency Division Multiplexing）** 使用正交 Subcarriers，频谱可以重叠，但在理想同步条件下仍可分离，提高频谱利用率。

![FDM，PDF 第 65 页](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%202_ai/page-065.png)

![OFDM 正交 Subcarriers，PDF 第 66 页](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%202_ai/page-066.png)

OFDM 不是“每个用户必然对应一个 Subcarrier”；如何向用户分配资源属于进一步的 Multiple access 设计。频偏、时间同步误差等会破坏理想正交条件。

### 7.3 TDM

多个输入按时间交错。**Synchronous TDM** 可固定分配 slots，若用户没有数据，其 slot 可能空闲。**Statistical multiplexing** 根据当前需求分配资源，是理解共享效率的补充概念。

![TDM 与 Time slots，PDF 第 67 页](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%202_ai/page-067.png)

### 7.4 CDM / CDMA

课件理想模型：每站有长度 m 的 bipolar chip vector X，各站 code 相互 Orthogonal；发送同步，信号线性相加。

- Bit 1：发送 +X。
- Bit 0：发送 −X。
- Silent：发送零向量。
- Channel composite：`Y=Σ b_i X_i`，b_i∈{+1,−1,0}。
- 解码 X：**`b_X=(Y·X)/m`**。
- 由 `X·X=m`、`X·Z=0`，恢复值 +1、−1、0 分别表示 1、0、Silent。

![CDMA Code 与复合信号示例，PDF 第 72 页](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%202_ai/page-072.png)

实际系统会受 Noise、不同功率、Multipath 与异步影响；不能把理想点积保证无条件推广。码长为 m 的向量空间最多容纳 m 个相互正交、非零 code vectors。

### 7.5 WDM

用不同 Optical wavelengths 复用光信号，通过光学 Combiner/Splitter 合并和分离。由于 `v=fλ`，它可理解为光频率范围内的 FDM。

![WDM，PDF 第 73 页](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%202_ai/page-073.png)

## 8. Public Switched Telephone Network（PSTN）

### 8.1 Structure of the Telephone System

传统电话系统由三部分组成：

- **Local loops**：用户到本地交换局的接入连接。
- **Trunks**：交换局之间的干线。
- **Switching offices**：连接不同线路并控制呼叫。

全互联 n 个用户需 `n(n−1)/2` 条点对点连接，规模扩大后难以管理，因此引入中心交换与分层交换结构。

![全互联、集中式与分层交换，PDF 第 79 页](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%202_ai/page-079.png)

课件的五级电话网和模拟 Copper local loop 是传统架构背景，不意味着所有电话接入都仍是该结构。

### 8.2 Modem vs. Codec

- **Modem（Modulator/Demodulator）**：把已经存在的数字信息调制为适合 Channel 的信号，再在另一端从信号恢复数字信息。
- **Codec（Coder/Decoder）**：在本节中把模拟语音 Sampling、Quantization、Encoding 成数字数据，再反向还原。
- 二者都可能涉及模拟/数字转换，但信息来源与任务不同：Demodulator 判决编码过的通信 Symbols，语音 Coder 表示原始模拟声音。

![Modem 与 Codec 的位置，PDF 第 83 页](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%202_ai/page-083.png)

### 8.3 Dial-up Modems

课件 voice-grade Channel 取约 3000 Hz。通过增加 constellation points，提高每 Symbol 承载信息。

V.32 示例：2400 baud，每 Symbol 4 个有效 data bits 加 1 个 coding redundancy bit，总共 32 points；有效速率 `2400×4=9600 bps`，不能把 32 points 的 5 bits 全算有效 data。

课件 V.90/V.92 的 56 kbps 等是相应系统历史参数，其模型涉及运营商数字侧和模拟 local loop；不能当作“两端完全模拟的 3-kHz Channel”任意突破 Shannon 的例子。

### 8.4 ADSL 与 FTTH

**ADSL（Asymmetric Digital Subscriber Line）** 利用现有 Copper local loop，在语音频段以外使用更宽频谱，下行与上行分配不对称。

- **DMT（Discrete Multitone）**：把可用频谱划成多个 subchannels，各自根据信道质量承载数据。
- **Splitter** 分离语音和 DSL 信号。
- **DSLAM（DSL Access Multiplexer）** 位于接入汇聚侧，连接大量用户 DSL 线路与运营商数据网络。
- 距离、Attenuation、Crosstalk 影响实际速率。

![ADSL 的 DMT 频段示例，PDF 第 85 页](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%202_ai/page-085.png)

![ADSL Modem、Splitter、DSLAM，PDF 第 87 页](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%202_ai/page-087.png)

**FTTH（Fiber to the Home）** 把 Fiber 延伸到用户住宅。课件配图使用 Optical splitter/combiner，说明光接入也可能共享某段资源，不是所有 Fiber 用户都拥有端到端独占带宽。

![FTTH 与 Optical splitter，PDF 第 88 页](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%202_ai/page-088.png)

### 8.5 PCM 与 T1

**PCM（Pulse Code Modulation）**：Sampling → Quantization → Encoding。

- 传统数字语音示例：8000 samples/s，每样本 8 bits。
- 单路 gross voice data rate=`8000×8=64 kbps`。
- Sample interval=`1/8000=125 μs`。
- T1 每 125 μs 承载 24×8=192 bits，再加 1 framing bit。
- Gross rate=`193×8000=1.544 Mbps`。
- 24 路 8-bit 时隙的 aggregate rate=`192×8000=1.536 Mbps`，它与总线路速率不同。
- 课件 T1 图使用某类 Signaling bit 安排；实际可用 Payload 还取决于具体 framing/signaling，不应把 1.536 Mbps 总当作任意业务净速率。

![T1 的 193-bit Frame，PDF 第 92 页](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%202_ai/page-092.png)

### 8.6 SONET / SDH

**SONET（Synchronous Optical Network）** 与 **SDH（Synchronous Digital Hierarchy）** 以同步 Frame 组织光传输，使不同设备可按一致时序与格式互通。

课件 STS-1：9 rows×90 columns=810 bytes，每 125 μs 一个 Frame。

| 层次 | 计算 | Rate |
|---|---|---:|
| Gross line rate | 810×8/125 μs | 51.84 Mbps |
| SPE（Synchronous Payload Envelope） | 9×87×8/125 μs | 50.112 Mbps |
| 去除一列 Path overhead 后的容量 | 9×86×8/125 μs | 49.536 Mbps |

- 前 3 columns 为 Transport overhead；课件进一步分为 Section 与 Line overhead。
- SPE 可跨 Frame boundary，Pointer 指出起始位置。
- Electrical signal 称 STS-n，Optical carrier 称 OC-n。
- `c` 表示 Concatenated，形成一个更大的连续 payload，不能直接与多个独立小 payload 的 Path overhead 算法混用。

![SONET Frame 与 SPE 跨界，PDF 第 95 页](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%202_ai/page-095.png)

课件第 96 页出现“6480 b/s”，应理解为每 Frame 6480 bits，再乘 8000 frames/s 才得到 51.84 Mbps。

### 8.7 Circuit Switching vs. Packet Switching

| 维度 | Circuit switching | Packet switching |
|---|---|---|
| 资源使用 | 先建立 Circuit，预留相关资源 | 多个流统计共享资源 |
| 发送前 | 通常需要 Setup | Datagram 模型不需同类 Circuit setup |
| 闲置时 | 预留资源可能被浪费 | 可将资源用于其他流 |
| 延迟 | Setup 后较可预测 | 可受 Queueing 影响 |
| 转发 | 按已建立的 Circuit 传输 | 按 Packet 转发，常用 Store-and-forward |
| 顺序 | 沿 Circuit 按序传输 | Datagram 可能不同路、乱序 |

![Circuit 与 Packet 的路径，PDF 第 98 页](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%202_ai/page-098.png)

![Setup、Propagation、Store-and-forward 与 Queueing，PDF 第 99 页](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%202_ai/page-099.png)

**易错：**Packet switching 也包括 Virtual-circuit 等形态，不能把所有 Packet networks 都说成“无连接、每帧不同路径”。课件“按分钟/按 Packet 计费”“Switch crash 是否 fatal”等是历史比较，不是技术定义。

## 9. Cellular Networks

- **1G**：课件概括为 Analog voice。
- **2G**：Digital voice。
- **3G**：增加较广泛的 Digital data services。
- **4G**：以 Packet-switched core 为基础，语音可由相应 IP 服务承载。
- **5G**：课件列出的后续代际；“正在部署、未来几年替代”等是课件编写时背景，不作为当前进度结论。

**Cellular design** 划分 Cells，使用 Frequency reuse、协调资源和 Handover。图中 Hexagon 是覆盖的理想几何模型，真实覆盖受地形和传播环境影响。

![Frequency reuse 与 Cell splitting，PDF 第 104 页](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%202_ai/page-104.png)

## 10. Cable Networks and Access Network Comparison

### 10.1 Cable Networks

**HFC（Hybrid Fiber-Coax）**：骨干/汇聚使用 Fiber，较靠近用户的部分使用 Coaxial cable，利用既有 Cable TV infrastructure 承载数据。

![HFC 与电话接入架构对比，PDF 第 106 页](%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C/pictures/Chapter%202_ai/page-106.png)

### 10.2 Cable、ADSL、FTTH、Satellite

| 接入 | Last-mile 介质与特征 | 主要考虑 |
|---|---|---|
| ADSL | Copper local loop，用户接入线通常是独立的一对线 | 距离、干扰、可用频谱 |
| Cable/HFC | Coax 与 Fiber 组合，接入段常共享 | 同一共享域负载、资源调度 |
| FTTH | Fiber 到户，可为 Point-to-point 或共享 PON | 光接入架构、分光比、调度与上联容量 |
| Satellite | 地面与卫星之间无线链路 | 覆盖、遮挡、天气、轨道、Delay 与成本 |

课件“Fiber/ADSL 总是独占、一定更稳定”“ADSL 天然更安全”等是过度概括。独立 Local loop 不代表所有上游资源独占；安全也依赖加密、设备与运营配置。

Satellite 适合地面基础设施薄弱、偏远或移动环境，并可支持广播；地面接入则有其覆盖和建设条件。选择要综合 Throughput、Latency、可靠性与部署条件。

## 11. Policy at the PHY Layer

### 11.1 Spectrum Allocation

课件说明国际协调、国家监管与许可制度，以避免不同系统互相干扰。分配方式示例包括 Comparative selection、Lottery、Auction。

- **Licensed spectrum**：在相应许可下使用。
- **Unlicensed spectrum**：满足规定条件时使用，并不等于“无任何功率、频段或设备要求”。
- **ISM（Industrial, Scientific, Medical）**、U-NII 是课件举出的频谱类别；可用范围依司法辖区变化。

### 11.2 Cellular 与 Telephone Policy

- **MVNO（Mobile Virtual Network Operator）** 借助其他运营商基础设施提供服务，通常不拥有相同的无线接入网络设施。
- 课件对美国/欧洲收费、制式及 AT&T 拆分、LATA、LEC、IXC 的讨论是历史案例：展示市场制度如何影响互联、业务和部署。
- 本节不把历史收费或法律限制当作当前规定。

## 12. Typical Calculations

### 12.1 3-kHz Channel、Binary signal、20-dB SNR

H=3000 Hz，M=2，S/N=100。

- Nyquist：`2×3000×log₂2=6000 bps`。
- Shannon：`3000×log₂101≈19974.63 bps`。
- 因题目限制 Binary signal，课件模型的联合上限为 **6000 bps**。

若没有 M=2 的约束，就不能将 Nyquist 的 M 固定为 2。

### 12.2 最小 Bandwidth：8 Levels、20 dB

按课件约定，目标 bit rate 为 B：

- Nyquist 要求 `H≥B/(2log₂8)=B/6`。
- Shannon 要求 `H≥B/log₂101≈B/6.6582`。
- 两项同时满足：**H_min=B/6 Hz**，这是理论下界。

### 12.3 最小 Bandwidth：64-QAM、20 dB

**按课件统一 Nyquist 带宽约定计算**，M=64：

- Nyquist：H≥B/12。
- Shannon：H≥B/log₂101≈0.15019B。
- 因此取更严格者：**H_min≈B/6.6582 Hz**。

这一结果是该 Quiz 的联合理论下界，不保证具体 64-QAM 系统在此带宽和 SNR 下达到目标误码率。若题目采用实际 Passband bandwidth，则还必须按对应 Symbol rate、Roll-off 和 Channel 模型重算，见第 5.5 节。

### 12.4 Constellation 与 Baud

点 `(1,1)、(1,−1)、(−1,1)、(−1,−1)` 共 4 个，`log₂4=2 bits/symbol`。

1200 baud、无其他冗余时：**R=1200×2=2400 bps**。

### 12.5 OC-12c 的 Payload Capacity

按照本节传统 SONET concatenated frame 模型：

- Gross：12×51.84=622.08 Mbps。
- 去 Transport overhead：12×50.112=601.344 Mbps。
- 连续 SPE 中一列 Path overhead 为 9 B/frame，即 0.576 Mbps。
- 另有 11 列 Fixed stuff，共 11×0.576=6.336 Mbps。
- 可用 Payload：**601.344−0.576−6.336=594.432 Mbps**。

这是 SONET Payload 容量，若内部再封装 PPP/IP 等，还需扣其开销。数值与课件表的 594.432 Mbps 一致；不要只减一列 Path overhead 而漏掉 Fixed stuff。

### 12.6 CDMA：A、B、C 同时发送 0

课件第 72 页：

`A=(-1,-1,-1,+1,+1,-1,+1,+1)`

`B=(-1,-1,+1,-1,+1,+1,+1,-1)`

`C=(-1,+1,-1,+1,+1,+1,-1,-1)`

发送 0 取各 Code 的负向量，因此合成：

**`Y=−A−B−C=(+3,+1,+1,−1,−3,−1,−1,+1)`**。

分别与 A、B、C 点积并除以 8，得到 −1，恢复各自发送的 0；假设其他站静默，且满足理想同步与线性叠加条件。

## 13. Review Checklist

- 能对比 Twisted pair、Coaxial cable、Power lines、Fiber 的传播与部署特点。
- 能区分 Simplex、Half-duplex、Full-duplex。
- 能说明 Single-mode 与 Multimode 的差别，不将“单模”当作“完全无 Dispersion”。
- 会用 v=fλ，并区分 Frequency、Bandwidth 与 Data rate。
- 能对比 GEO、MEO、LEO，理解 Footprint、Handover 与 Delay。
- 能解释有限 Harmonics 为什么导致失真，及 Symbol rate 与 Bit rate 的区别。
- 会使用 Nyquist、Shannon，先将 dB 转 Linear ratio，再核对适用模型。
- 能读 NRZ/NRZI/Manchester 波形，计算 4B/5B 的两种开销比例。
- 能从 Constellation points 求 bits/symbol，并扣除 coding redundancy。
- 能区分 FDM、OFDM、TDM、CDM、WDM，计算理想 CDMA 点积。
- 会计算 PCM 64 kbps、T1 1.544/1.536 Mbps、SONET Gross/SPE/Payload。
- 能区分 Modem 与 Codec、Circuit switching 与 Packet switching。
- 能说明 ADSL、Cable、FTTH 的 Last-mile 特征，并将历史案例与技术定义分开。

