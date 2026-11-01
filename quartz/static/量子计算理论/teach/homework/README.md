# 量子计算编程作业（NumPy / Qiskit）

配套课件《量子计算理论基础与软件系统》01–03 的动手练习。所有核心算法都用
**纯 NumPy 态向量模拟**实现，不依赖量子硬件；另提供 **Qiskit** 对照版作为可选作业。

## 环境

- Python 3.9+
- 必装：`pip install numpy`
- 可选（Qiskit 对照版）：`pip install qiskit`

## 运行

```bash
# 1) NumPy 版：自验证门 / 贝尔态 / Deutsch / QFT / QPE / Grover
python3 quantum_toolkit.py

# 2) Qiskit 对照版（需先 pip install qiskit）
python3 qiskit_demo.py
```

`quantum_toolkit.py` 末尾的 `__main__` 会跑一组断言自测，输出预期结果即说明实现正确：
- 门关系：`X²=I, H²=I, S²=Z, T²=S`
- 贝尔态 `|Φ+⟩ = (|00⟩+|11⟩)/√2`（纠缠判据 det≠0）
- Deutsch：常数函数→`constant`，平衡函数→`balanced`
- QPE：`φ=3/8`、`3` 个计数比特 → 测得 `011`，估计 `φ̂=0.375`
- Grover：`N=8`、迭代 `2` 次 → 目标态概率 ≈ `0.945`

## 文件说明

| 文件 | 内容 |
|------|------|
| `quantum_toolkit.py` | 单/双比特门、贝尔态、Deutsch、QFT、QPE、Grover 的 NumPy 实现 + 自验证 |
| `qiskit_demo.py` | 同一组算法的 Qiskit 线路实现（可选） |

### 约定（与课件一致）
- n 比特态 = 长度 `2^n` 的复数向量；基态索引 `i` 的二进制写法里**最左一位是 q0（高位）**。
- 例如两比特基序 `|00⟩,|01⟩,|10⟩,|11⟩` 的索引分别为 `0,1,2,3`。

## 作业题（在现有代码上扩展）

1. **SWAP 门**：用三个 CNOT 实现 `SWAP(q0,q1)`，并验证 `SWAP|01⟩=|10⟩`。
2. **受控-Z**：实现 `CZ`（控制位为 1 时翻转目标位的相位），说明 `CZ = H·CNOT·H`。
3. **多比特特征 QPE**：把 `qpe()` 从"单比特特征"扩成"m 比特特征空间"，用于估计任意酉矩阵的特征相位。
4. **Shor 周期查找**：取 `N=15, a=7`，用 `qpe()` 求 `f(x)=7^x mod 15` 的周期 `r`，再用 `gcd(7^{r/2}±1,15)` 得到 `15` 的因子（注意 `r` 为偶数且 `a^{r/2}≢−1 mod N`）。
5. **Qiskit 对比**：用 `qiskit_demo.py` 跑出贝尔态 / Deutsch，与 `quantum_toolkit.py` 的结果逐项核对，写出两者在"态向量顺序约定"上的差异（Qiskit 默认 **q0 是最低位**）。

## 提示
- 每个算法都已在 `quantum_toolkit.py` 给出现成实现，作业重点是**读懂并改造**，而不是从零默写。
- 复数相位用 `np.exp(2j*np.pi*phase)`；矩阵幂用 `np.linalg.matrix_power`。
- 如果运行报 `ModuleNotFoundError: numpy`，先 `pip install numpy`。
