---
title: Chapter 8
tags:
  - 计算机网络
  - Security
  - Cryptography
  - RSA
  - Authentication
---

# Chapter 8 — Network Security（网络安全）

> 本篇将算法、密钥用途、认证消息流和安全目标连起来。古典密码、DES、SHA-1和旧式TLS握手用于学习历史设计与运算；理解它们不表示它们适合直接用于新系统。

## 1. Security Goals：先判断要保护什么

### 1.1 CIA 与其他目标

| Property | 中文 | 要问的问题 |
|---|---|---|
| Confidentiality | 机密性 | 未授权者能否读到内容？ |
| Integrity | 完整性 | 内容是否被篡改？ |
| Availability | 可用性 | 合法用户还能否使用服务？ |
| Authentication | 身份/来源认证 | 对方是谁，消息来自谁？ |
| Nonrepudiation | 不可否认性 | 发送者之后能否否认这次行为？ |
| Freshness | 新鲜性 | 这次消息是新的，还是旧消息重放？ |

加密主要保护confidentiality；不自动完成所有目标。攻击者即使不懂密文，也可能替换、重放或丢弃它。Checksum/CRC可检测随机差错，但不提供面对主动篡改者的密码学认证。

攻击动机可以是窃取信息、冒充身份、商业或政治目的、破坏服务等。常见行为：reconnaissance（侦察）、sniffing/snooping（窃听）、spoofing（伪装）、disruption/DoS（中断服务）。

每层都可参与保护：物理保护线路，链路加密保护一跳，网络层可用IPsec与过滤，传输连接可用TLS，应用可用消息签名和用户认证。链路逐跳解密不等于端到端内容对中间节点保密。

### 1.2 Eight Security Design Principles

1. **Economy of mechanism**：简单，便于审计，减少attack surface。
2. **Fail-safe defaults**：缺省无权限，而不是缺省全放行。
3. **Complete mediation**：每次访问都检查相应权限，不只首次。
4. **Least privilege / least authority**：只给完成工作所需的最少权限。
5. **Separation of privilege**：拆分职责和条件，不让单一权限万能。
6. **Least common mechanism**：减少不必要共享机制带来的共同风险。
7. **Open design**：安全不应依赖算法实现细节永远不被发现。
8. **Psychological acceptability**：安全机制应可理解、可正确使用。

## 2. Cryptography基础：P、C、K别混淆

Plaintext=$P$，Ciphertext=$C$，Key=$K$：

$$C=E_K(P),\qquad P=D_K(C),\qquad D_K(E_K(P))=P$$

Kerckhoffs’ principle：即使攻击者知道系统算法和结构，密钥保密时仍应安全。“公开设计”不表示必须把private key也公开。

攻击模型：ciphertext-only只见密文；known-plaintext知道一些明密文对；chosen-plaintext可选择明文并观察密文；更强模型还可能考虑chosen-ciphertext。系统要对明确威胁模型成立，不能仅看“没人猜到算法”。

### 2.1 Substitution Cipher（替换密码）

Caesar cipher把字母编号A=0…Z=25：

$$c=(p+k)\bmod26,\qquad p=(c-k)\bmod26$$

$k=3$时`ATTACK → DWWDFN`。例如T=19，$19+3=22$→W；X=23，$23+3=26\equiv0$→A。

Monoalphabetic substitution使用任意字母表排列，key space=$26!\approx4.03\times10^{26}$。空间虽大，却保留letter frequency、digrams/trigrams、重复模式，可用统计与probable word分析；暴力穷举不是唯一攻击方法。

例如`financial`的重复字母位置可以限制候选密文片段。替换保留符号次序但改变符号身份；transposition则保留符号本身而改变位置。

### 2.2 Transposition Cipher（置换密码）逐格运算

用无重复字母key `ZEBRA`。按字母顺序编号：A最小，因此各列rank为5、3、2、4、1。

```text
Key:    Z E B R A
Rank:   5 3 2 4 1
        H E L L O
        W O R L D
```

按rank从1到5逐列读：A列`OD`，B列`LR`，E列`EO`，R列`LL`，Z列`HW`，所以ciphertext=`ODLREOLLHW`。

解密：已知总长10、5列→每列2字符；按rank把密文两两填回对应列，再按行读回`HELLOWORLD`。不满矩形时要规定padding或短列规则；不说明规则就不能唯一复原。

## 3. One-Time Pad（OTP）：XOR与一次性密钥

$$C=P\oplus K,\qquad P=C\oplus K$$

```text
P = 10110010
K = 01101100
C = 11011110
```

再异或同一K：`11011110 XOR 01101100 = 10110010`。

完美保密要求：K真正均匀随机、与消息独立、至少与明文同长、秘密分发、只用一次。结论是ciphertext不改变攻击者对plaintext的先验分布，不是任何语言里的所有消息先验都必然相同概率。

**为什么不能复用？**

$$C_1\oplus C_2=(P_1\oplus K)\oplus(P_2\oplus K)=P_1\oplus P_2$$

已知$P_1$时可推出$K=C_1\oplus P_1$进而恢复$P_2$。同样的危险也适用于复用keystream的stream cipher或CTR nonce-counter组合。

OTP难点是等长随机密钥的生成、分发、存储和同步。Quantum key distribution属于密钥建立方向，仍需认证等系统前提，不是“任意OTP key都能无条件安全穿过网络”。OTP本身也不认证消息，可被位翻转。

### 3.1 Redundancy 与 Freshness

Redundancy帮助识别格式/结构异常，但可预测格式不能代替cryptographic MAC。Freshness可由nonce、timestamp、sequence number等实现；使用timestamp还需要时钟误差与重放窗口规则，单写一个时间戳并不能自动阻止所有重放。

## 4. Symmetric-key Algorithms：分组密码的结构

Symmetric-key双方共享secret key，适合大量数据。Product cipher组合S-box（substitution）与P-box（permutation），产生confusion/diffusion。S-box可非线性，P-box重新排列bit位置。

![S-box and P-box composition](计算机网络/pictures/Chapter8/sbox-pbox.png)

### 4.1 DES：64bit block、56bit有效key、16轮

DES每块64bit，key常表示为64bit含8个parity bits，实际有效key56bit。每块拆成$L_0,R_0$各32bit，Feistel一轮：

$$L_i=R_{i-1}$$
$$R_i=L_{i-1}\oplus f(R_{i-1},K_i)$$

$f$流程：32bit R扩展至48bit→与48bit round key异或→8个S-box分别6bit进4bit出→共32bit→P-box。Key schedule将有效56bit分成两份28bit，按轮次左移并选取48bit子密钥。解密使用相反的round-key顺序。

![DES and one Feistel round](计算机网络/pictures/Chapter8/des-round.png)

DES的56bit密钥不足以抵抗现代穷举，作为历史算法学习。不能把“有16轮”和“必然安全”画等号。

### 4.2 Triple DES（EDE）与兼容性

两key示意：

$$C=E_{K_1}(D_{K_2}(E_{K_1}(P)))$$
$$P=D_{K_1}(E_{K_2}(D_{K_1}(C)))$$

当$K_1=K_2=K$，中间$D_K(E_K(\cdot))$抵消，退化成单DES，这是EDE形式的兼容原因。三次运算不等于安全强度简单乘3；3DES是历史设计，不作为新系统选型建议。

### 4.3 AES：Block size与Key size分开记

| 算法 | Block size | Key size | Rounds |
|---|---|---|---|
| AES-128 | 128bit | 128bit | 10 |
| AES-192 | 128bit | 192bit | 12 |
| AES-256 | 128bit | 256bit | 14 |

AES由Rijndael家族标准化而来，但**AES分组始终128bit**，不能把Rijndael家族的其他block lengths都称作AES。

16byte按列填入4×4 state：

```text
p0  p4  p8   p12
p1  p5  p9   p13
p2  p6  p10  p14
p3  p7  p11  p15
```

初始AddRoundKey；普通轮SubBytes→ShiftRows→MixColumns→AddRoundKey；最后轮不做MixColumns。ShiftRows第0/1/2/3行分别循环移0/1/2/3byte。MixColumns使用有限域运算扩散列内信息；使用有限域并不等于已经证明算法对所有攻击无条件安全。

![AES state and round-key arrays](计算机网络/pictures/Chapter8/aes-state.png)

补充简单有限域算例：AES的xtime相当于乘$x$再按模多项式约简，`0x57 × 0x02 = 0xAE`；`0xAE × 0x02`左移得到超8bit的`0x15C`，与`0x11B`异或得`0x47`。不要把所有字节乘法当成普通整数乘法取低8bit。

### 4.4 Other Symmetric Ciphers（其他对称算法识读）

| 名称 | 类型/特点 | 复习时区分 |
|---|---|---|
| IDEA | 64bit分组、128bit key的历史分组密码 | 曾用于早期PGP |
| RC4 | 可变长key的stream cipher | 与按固定block加密的AES不同；不作为新系统方案 |
| RC5 | 可参数化word size、rounds和key length | 不能把所有配置当同一安全强度 |
| Serpent | AES候选，128bit block | AES竞赛候选不等于AES标准本身 |
| Twofish | AES候选，128bit block、最高256bit key | 同样需区分block size与key size |
| Triple DES | 多次DES组合 | 历史兼容方案，不等于AES |

算法名称、密钥长度、分组长度、运算模式是四个不同维度；仅报一个“256bit”不能完整描述加密方案。

## 5. Cipher Modes：有分组密码还要决定如何处理长消息

### 5.1 ECB（Electronic Codebook）

$$C_i=E_K(P_i)$$

相同key下相同明文块得到相同密文块，暴露重复结构。块可被剪贴替换，算法本身不验证完整性。可并行、可随机访问，但不足以安全隐藏长结构化消息模式。

### 5.2 CBC（Cipher Block Chaining）

$$C_0=IV,\quad C_i=E_K(P_i\oplus C_{i-1})$$
$$P_i=D_K(C_i)\oplus C_{i-1}$$

![CBC encryption and decryption](计算机网络/pictures/Chapter8/cbc-mode.png)

**画图：**P_i和上个C先进入XOR，再进入E_K；解密是C_i先进入D_K，再与C_{i-1}异或。不要把加密端XOR误放在E之后。

若$C_i$某一bit翻转，$P_i$通常被大范围扰乱；$P_{i+1}$相应bit精确翻转；更后块可恢复。CBC不是完整性校验机制，攻击者仍可能可控修改后块。加密串行，解密可对各块先独立做D后再XOR，因此不能说CBC任意随机解密必需解开全部先前块；解$P_i$主要需要$C_i$与$C_{i-1}$。

### 5.3 CFB（Cipher Feedback）

加密前一个反馈寄存器得到keystream，取所需部分与当前plaintext异或，ciphertext再反馈。可以处理小于block的片段；用byte反馈和bit反馈时错误传播范围不同。做题要写出block size与feedback segment size，不死背“一个错误永远只影响8B”。

### 5.4 Stream Cipher 与 CTR（Counter Mode）

Stream cipher：$C=P\oplus keystream$，接收方生成同一keystream恢复。Keystream必须不可预测，不能重复用同一流去保护不同明文。

CTR：

$$S_i=E_K(Nonce\parallel Counter_i),\quad C_i=P_i\oplus S_i$$

解密同样生成$S_i$并XOR；可并行、随机访问，密钥流也可预计算。Nonce-counter组合在同一key下必须唯一，counter不能回绕重复输入。

![Counter mode encryption](计算机网络/pictures/Chapter8/ctr-mode.png)

| Mode | 重复结构 | 并行/定位 | 完整性 |
|---|---|---|---|
| ECB | 同明文块泄露相等关系 | 加解密可并行 | 不提供 |
| CBC | 使用合适IV可隐藏直接重复 | 加密串行，解密较易并行 | 不提供 |
| CFB | 依赖反馈状态 | 依反馈段和模式而定 | 不提供 |
| CTR | 依赖唯一nonce/counter | 易并行、随机访问 | 不提供 |

补充：实际安全系统常使用AEAD，如AES-GCM，联合提供机密性与完整性；也仍必须遵守nonce等使用条件。模式的安全条件不能只靠“底层用了AES”省略。

## 6. Public-key Cryptography 与RSA

公钥可公开，私钥必须保密；两者计算相关，但应难以从公钥求私钥。加密给Bob：用**Bob的public key**，由Bob的private key解。签名由Alice private key生成，用Alice public key验证。

Public-key解决了部分key distribution难题，却没有自动证明“我拿到的public key真的属于Bob”，后面还需要certificate/authentication。

### 6.1 RSA Key Generation

1. 选两个不同素数$p,q$。
2. $n=pq$，$\varphi(n)=(p-1)(q-1)$。
3. 选$e$与$\varphi(n)$互素。
4. 求$d$使$ed\equiv1\pmod{\varphi(n)}$。
5. Public key=$(n,e)$，private key包含$d$等参数。
6. 教学整数模型：$C=M^e\bmod n$，$M=C^d\bmod n$，$0\le M<n$。

先选$d$再求$e$也可，只要满足条件。小素数例用于手算，不是可部署密码；真实RSA加密/签名需要对应编码与padding，不能直接对文件做裸幂运算。

### 6.2 完整RSA例：p=3、q=11、e=3

$$n=33,\quad\varphi(n)=20,\quad d=7$$

因为$3\times7=21\equiv1\pmod{20}$。取明文整数$M=4$：

$$C=4^3\bmod33=64\bmod33=31$$

用square-and-multiply解密：

$$31^2\equiv(-2)^2=4\pmod{33}$$
$$31^4\equiv16\pmod{33}$$
$$31^7=31^{4+2+1}\equiv16\times4\times31\equiv4\pmod{33}$$

中间每步取模，避免算巨大整数。图中RSA也可用于字母到数值的转换练习；字符编码与分块规则要事先明确。

![RSA letter and modular-arithmetic example](计算机网络/pictures/Chapter8/rsa-example.png)

### 6.3 模逆怎样求？

对$e=7,\varphi=40$，用Euclidean algorithm：

```text
40 = 5×7 + 5
 7 = 1×5 + 2
 5 = 2×2 + 1
```

回代：$1=5-2(7-5)=3\times5-2\times7=3\times40-17\times7$，所以$7^{-1}\bmod40=-17\bmod40=23$。验算$7\times23=161\equiv1$。

## 7. Hash、MAC、Signature：三者如何区分？

### 7.1 Cryptographic Hash / Message Digest

Hash把任意长度消息映射为固定长度digest，通常无secret key。期望性质：容易计算、preimage resistance、second-preimage resistance、collision resistance、avalanche effect。

- Preimage：给定h，难找M使H(M)=h。
- Second preimage：给定M，难找不同M'使摘要相同。
- Collision：难找任意一对不同消息摘要相同。

无key的hash不能独立认证：攻击者可以同时替换M与H(M)。数字签名或MAC才能把摘要和可信密钥绑定。

### 7.2 Birthday Attack（生日攻击）计算

$n$bit理想hash，找特定preimage工作量约$2^n$，找任意collision约$2^{n/2}$。$k$个独立均匀输出的碰撞概率近似：

$$P_{coll}\approx1-e^{-k(k-1)/(2\cdot2^n)}$$

约50%概率需要$k\approx1.177\times2^{n/2}$。例：32bit hash约7.7万样本就能有约一半概率见到某对碰撞，远少于$2^{32}$。不能用“输出空间很大”直接推导collision安全。

### 7.3 SHA-1结构与padding计算

SHA-1：512bit分组、160bit摘要、内部5个32bit状态字、每块扩展至80个word并执行80轮相关处理。这是历史结构知识；MD5和SHA-1不适合新数字签名的碰撞安全需求。

每个512bit block先分为16个32bit words；后续word由先前word的XOR及循环移位产生：$W_t=ROL_1(W_{t-3}\oplus W_{t-8}\oplus W_{t-14}\oplus W_{t-16})$，$16\le t\le79$。80轮结合工作变量A–E、轮函数、常量和模$2^{32}$加法，最后累加到hash状态；不要把整个算法误当成单次XOR。

Padding的精确方法：原长$\ell$bit，追加一个1，再追加$k$个0，使：

$$\ell+1+k\equiv448\pmod{512}$$

最后追加64bit原长度，得到512的倍数。不是先补满512再随意覆盖末64bit。

例：原消息100B=800bit，$800+1+k\equiv448\pmod{512}$，$k=159$；总长$800+1+159+64=1024$bit=128B。边界例56B=448bit时，仍必须追加1和64bit长度，因此需要新增一个分组，总128B。

### 7.4 HMAC的正确结构

HMAC（Hash-based Message Authentication Code）不是简单$H(P\parallel K)$，也不等于“用K加密H(P)”。标准结构：

$$HMAC_K(M)=H((K'\oplus opad)\parallel H((K'\oplus ipad)\parallel M))$$

$K'$按hash block size规范化；ipad为重复0x36，opad为重复0x5C。考完整运算需指定hash和key，不能凭一个消息就算出HMAC。

共享key双方都能生成tag，因此能向对方证明“掌握key的某一方产生”，却通常不能向第三方证明只有Alice生成。HMAC提供完整性/来源认证，不直接提供confidentiality或公开可验证的nonrepudiation。

## 8. Digital Signatures（数字签名）

目标：receiver可验证claimed sender；sender不能轻易否认；receiver不能自己伪造同样证据。实践中的不可否认还依赖private-key控制、证书状态、时间和法律流程等，并非仅凭一个数学等式解决所有争议。

### 8.1 Public-key Signatures：先hash再sign

$$h=H(M),\quad\sigma=Sign_{SK_A}(h)$$

接收方计算$H(M)$并用$PK_A$验证签名。通常发送`M || σ`；要保密，再将消息和签名放进面向Bob的加密封装。

```text
Sender:   M → Hash → h → Sign with Alice private key → σ
Send:     M, σ
Receiver: M → Hash → h' ─┐
                        ├→ Verify with Alice public key
                     σ ─┘
```

“签名=私钥加密、验证=公钥解密”只适合某些RSA教学符号直觉，不是所有签名算法定义；正确通用说法是Sign/Verify。

### 8.2 Trusted-arbiter / Symmetric-key Signature Model

每个用户与可信中心BB共享各自key。Alice把请求给BB，BB验证来源后，产生包含Alice身份、timestamp、消息或digest的可信凭证转给Bob。争议时由BB验证和仲裁。

这依赖BB诚实可靠、掌握长期key且保存必要信息，不等同于无需第三方参与即可公开验证的普通数字签名。Timestamp与nonce用于抑制重复使用凭证；消息签名不等于消息秘密。

### 8.3 密钥泄漏与更换

泄漏后攻击者可能伪造签名；改key并不会让旧key签名自动在数学上失效。需结合certificate validity、revocation、可信timestamp等判断何时签名及何时失陷。不能只说“私钥一改过去所有签名就不能验证”。

## 9. Public-key Management：Certificate与PKI

### 9.1 为什么公开网页上的key还不够？

攻击者可替换Bob网页或路径上的public key，使Alice误用Trudy的key。问题不是RSA不会算，而是**身份与key没有可信绑定**。

Certificate Authority（CA）签署subject身份和public key等信息。概念形式：

$$Cert_B=(Identity_B,PK_B,Validity,\ldots),\quad\sigma_{CA}=Sign_{SK_{CA}}(H(Cert_B))$$

Alice要用可信CA public key验证签名，还要匹配期待的身份/hostname，检查有效期、用途与撤销等。Trudy自己的合法证书只能证明Trudy的身份，不能自动冒充Bob。

### 9.2 X.509字段与Chain of Trust

常见字段：version、serial number、signature algorithm、issuer、validity、subject、subject public-key information、extensions、CA signature。ASN.1用于定义结构，DER等用于编码。

![X.509 certificate fields](计算机网络/pictures/Chapter8/x509-fields.png)

```text
Trusted Root CA
   signs → Intermediate CA certificate
               signs → Server certificate
                           binds → Server public key and identity
```

Root因预先配置为trust anchor而可信，不是“自签名所以天然可信”。每级用上级key验签，且检查CA约束等；实际chain validation比单纯递归验数学签名更严格。

![Hierarchical PKI and certificate chain](计算机网络/pictures/Chapter8/certificate-chain.png)

Certificate可由持有人携带、目录保存或在协议中发送。CRL（Certificate Revocation List）列出已撤销serial number；还可有在线状态机制。证书签名正确不等于未过期、未撤销、名称匹配或服务器行为可信。

## 10. Authentication Protocols：Nonce、Reflection与Replay

### 10.1 Challenge–response的基本想法

Verifier发随机challenge，prover对它计算依赖secret的response。只发送固定密码hash的方案可能被录下后直接重放；新的nonce使旧response不再适用。

一个有缺陷的对称模型：

```text
A → B : A, RA
B → A : RB, E_K(RA)
A → B : E_K(RB)
```

若两个方向使用相同key和相同消息结构，B可能被用作加密oracle，产生自己正在等待的response。

### 10.2 Reflection Attack逐步画

![Reflection using two parallel sessions](计算机网络/pictures/Chapter8/reflection-attack.png)

1. T假冒A向B开session1，发`A, RT`。
2. B回`RB, E_K(RT)`，要求T证明能处理RB。
3. T不会key，却新开session2，发`A, RB`。
4. B在session2回出`E_K(RB)`。
5. T把它复制回session1，B误以为对方掌握key。

攻击没有破解加密，只利用了**相同输入在不同方向/会话可获得同样认证值**。有的较长握手也会受到parallel-session interleaving，不能仅凭“消息多了一条”认定已修好。

### 10.3 身份、方向、会话上下文要绑定

可采用不同方向keys、明确role labels、互不相交challenge格式，并让认证值覆盖双方身份、两个nonce和协议用途。

```text
A → B : A, RA
B → A : B, RB, HMAC_K("B proves" || A || B || RA || RB)
A → B : HMAC_K("A proves" || A || B || RA || RB)
```

这是教学结构：方向标签不同，使B对“B proves”的输出不能直接作为“A proves”答案；fresh nonces绑定当前会话。实际还需编码无歧义、nonce随机性、key管理与状态规则。

> A nonce must be fresh, and the authentication tag should bind the identities, roles and session context.

## 11. Diffie–Hellman（DH）Key Exchange

公共参数prime$p$和generator$g$；Alice选私有$a$，Bob选私有$b$：

$$A=g^a\bmod p,\quad B=g^b\bmod p$$
$$K_A=B^a\bmod p=g^{ab}\bmod p= A^b\bmod p=K_B$$

### 11.1 手算例：p=23、g=5、a=6、b=15

Alice公开值$5^6\bmod23=8$；Bob公开值$5^{15}\bmod23=19$。

Alice算$19^2\bmod23=16$、$19^4\bmod23=3$，所以$19^6\bmod23=3\times16\bmod23=2$。Bob算$8^{15}\bmod23=2$，双方共享值为2。

公共的p、g、A、B可以被看见，但在合适大群上从公开值求私有指数应困难。这个共享群元素通常还需KDF派生成实际traffic keys；不能把小例的整数2直接当AES key。

### 11.2 未认证DH的MITM

```text
Alice  ←─ shared key K_AT ─→  Trudy  ←─ shared key K_TB ─→  Bob
```

T替换交换的public values，让A/B分别与T建key，之后可解密再加密转发。DH提供key agreement，不单独证明身份。用certificate/signature或预共享key绑定握手，才能阻止这类替换。

![Man-in-the-middle key exchange](计算机网络/pictures/Chapter8/mitm.png)

## 12. KDC、Kerberos与公钥认证

### 12.1 Key Distribution Center

A与KDC共享$K_A$，B与KDC共享$K_B$，KDC创建session key $K_S$，给A可解的结果及给B的ticket：

```text
A → KDC : A, B, fresh request context
KDC → A : E_KA(KS, B, context, ticketB)
ticketB : E_KB(A, KS, validity, context)
A → B   : ticketB, proof bound to this session
```

仅有可解密ticket不足以证明本次请求是新的。攻击者重放旧ticket/旧业务命令可能重复触发操作，尤其旧session key泄漏时危险；需要nonce、lifetime、authenticator与replay detection等配合。

Kerberos利用trusted KDC、ticket、ticket-granting服务和短期会话凭证等思想完成认证。概念上理解“长期密钥保护session key、ticket交给指定服务、authenticator证明当前使用者”，不要把每条KDC示意消息都直接称作完整Kerberos协议。

### 12.2 Mutual Authentication with Public Keys

先验证双方public-key身份，再通过加密nonce或签署握手证明私钥控制权，并绑定session key和双方身份。对方“能发送一个公钥加密包”不证明其身份，因为任何人都能使用public key加密；证明必须依赖只有对方掌握的秘密能力。

## 13. Security in Practice：Firewall、IPsec、TLS、DNSSEC

| Mechanism | 主要作用 | 不要误解为 |
|---|---|---|
| Firewall | 按规则允许/阻止流量 | 允许的应用流量必定无漏洞 |
| IDS / IPS | 检测/可阻断可疑行为 | 保证识别所有未知攻击 |
| IPsec | 网络层认证/加密机制集合 | 所有IP包天然已加密 |
| VPN | 构建逻辑专用连接，常结合安全隧道 | 任何名为隧道的技术都保密 |
| TLS | 连接上的机密性、完整性及认证 | 业务内容必然真实或网站必然可信 |
| DNSSEC | DNS数据来源/完整性验证 | DNS查询内容保密 |
| Wireless security | 无线接入与链路保护 | 替代端到端安全 |

### 13.1 TLS两个阶段

Handshake协商参数、验证身份、建立traffic secrets；record protection用派生key保护后续数据。传统HTTPS常见TLS在TCP上，QUIC结合TLS1.3握手并使用QUIC自身的包保护。

**旧式RSA key-transport握手教学流程：**ClientHello含client random→ServerHello选择参数并给server random→certificate→client验证证书→client生成premaster secret并以server public key加密→双方派生key→Finished验证握手。48B premaster=384bit不表示最终对称key必为384bit。

TLS1.3不使用这种旧式静态RSA premaster传送流程，而采用所支持的密钥交换/PSK机制并认证握手。学习旧消息流时应保留版本边界；单看历史9条箭头不能概括所有TLS。

### 13.2 如何画TLS时序图

画client/server两竖轴，箭头标消息名称；区分public negotiation、certificate authentication、key establishment和encrypted application data；在“开始使用派生key”的位置加边界。Nonce不是session key，certificate中的public key也不是用来直接加密全部Web正文的bulk key。

## 14. PGP：Hybrid Encryption把各机制组合

PGP式安全邮件组合签名、压缩、对称加密与会话key封装：

$$h=H(P),\quad\sigma=Sign_{SK_A}(h)$$
$$Z=Compress(P\parallel\sigma)$$
$$C=Enc_{K_M}(Z),\quad W=Enc_{PK_B}(K_M)$$

发送$W\parallel C$。Bob先用自己的private key恢复$K_M$，对称解密C、解压，拿出P和Alice签名，再验证。历史PGP版本曾采用IDEA/RSA/MD5等组合，不能把这组历史选型写成所有安全邮件的唯一算法。

![Hybrid encryption and signed email](计算机网络/pictures/Chapter8/pgp-flow.png)

顺序为什么合理？Hash/sign证明内容来源，compress减少冗余，symmetric encryption高效处理大数据，public-key encryption只保护短session key。加密后再压缩通常效果差，因为良好密文不应有明显可压缩模式；压缩也不是认证机制。

### 14.1 密钥使用速查

| Task | 使用哪把key？ |
|---|---|
| 发秘密给Bob | Bob public key封装/协商key，或共享session key加密内容 |
| Bob读秘密 | Bob private key恢复所需key，再解密内容 |
| Alice签名 | Alice private signing key |
| 验证Alice签名 | Alice public verification key |
| 验CA签证书 | 可信CA public key |
| HMAC生成/验证 | 双方共享secret key |

## 15. 综合计算练习与英文答题

1. Caesar k=3，`XYZ`加密？`ABC`，因为按mod26回绕。
2. OTP：P=1010，K=1100，C？0110。C XOR K恢复1010。
3. RSA p=5、q=11、e=3，d？φ=40，3×27=81≡1，所以d=27。
4. SHA-1消息55B需要几块？440+1+7+64=512bit，一块；56B需要两块。
5. AES-256每块多少bit、多少轮？128bit、14轮，不是256bit块。
6. 两份消息使用同一CTR keystream后异或密文得什么？P1 XOR P2，破坏保密性。
7. 有效signature是否意味着消息保密？否；普通签名可公开附在明文后。
8. 只验证certificate signature却不检查hostname够吗？不够，可能接受了别人的有效证书。

| English wording | 作答思路 |
|---|---|
| Compute the modular inverse | 扩展欧几里得→取正模→乘法验算 |
| Encrypt / Decrypt with RSA | 列n、φ、e、d，分解指数并反复取模 |
| Explain a replay / reflection attack | 标明旧消息、会话及复制路径，说明违反freshness还是role binding |
| Distinguish a MAC from a signature | shared secret vs. public verification；第三方能否验证 |
| Explain why DH needs authentication | 未认证公开值可被MITM替换 |
| Draw the encryption mode | 标P/C/IV/Counter/XOR/E或D顺序 |

> Encryption provides confidentiality; authentication and integrity require additional cryptographic protection.
>
> A digital signature is generated with the signer’s private key and verified with the corresponding public key.
>
> An unauthenticated Diffie–Hellman exchange is vulnerable to a man-in-the-middle attack.
