# -*- coding: utf-8 -*-
"""
量子计算工具包（纯 NumPy 实现，无需 Qiskit）
================================================
对应课件《量子计算理论基础与软件系统》01–03 的核心算法，用态向量（statevector）
方式模拟，方便你对照课堂推导做"笔头 → 代码"的练习。

约定（与课件一致）：
  - n 比特系统的态是长度 2^n 的复数向量。
  - 基态索引 i 的二进制写法里，最左边一位是 q0（高位）。
    例如两比特基序 |00>,|01>,|10>,|11> 的索引分别为 0,1,2,3。
  - 单比特门位置 p：p=0 表示最左边的比特（q0）。

运行：  python3 quantum_toolkit.py
"""

import numpy as np

# ------------------------- 单比特门 (2x2) -------------------------
I = np.array([[1, 0], [0, 1]], dtype=complex)
X = np.array([[0, 1], [1, 0]], dtype=complex)
Y = np.array([[0, -1j], [1j, 0]], dtype=complex)
Z = np.array([[1, 0], [0, -1]], dtype=complex)
H = (1.0 / np.sqrt(2.0)) * np.array([[1, 1], [1, -1]], dtype=complex)
S = np.array([[1, 0], [0, 1j]], dtype=complex)
T = np.array([[1, 0], [0, np.exp(1j * np.pi / 4)]], dtype=complex)


# ------------------------- 基础工具 -------------------------
def ket(bitstring):
    """返回计算基态向量，bitstring 左边是 q0（高位）。"""
    n = len(bitstring)
    v = np.zeros(2 ** n, dtype=complex)
    v[int(bitstring, 2)] = 1.0
    return v


def apply1(state, gate, p, n):
    """把 2x2 门 gate 作用到位置 p（0 = 最左边比特 q0）。"""
    out = np.zeros_like(state)
    pmask = 1 << (n - 1 - p)
    for i in range(len(state)):
        if (i & pmask) == 0:           # p 位 = 0
            j = i | pmask              # p 位 = 1
            out[i] = gate[0, 0] * state[i] + gate[0, 1] * state[j]
        else:                          # p 位 = 1
            j = i & ~pmask             # p 位 = 0
            out[i] = gate[1, 0] * state[j] + gate[1, 1] * state[i]
    return out


def cnot(state, ctrl, tgt, n):
    """受控非：当位置 ctrl 为 1 时翻转位置 tgt。"""
    tmask = 1 << (n - 1 - tgt)
    cmask = 1 << (n - 1 - ctrl)
    out = np.zeros_like(state)
    for i in range(len(state)):
        if (i & cmask):
            out[i] = state[i ^ tmask]
        else:
            out[i] = state[i]
    return out


def crk(state, ctrl, tgt, n, k):
    """受控相位门 R_k：当 ctrl 与 tgt 同时为 1 时乘相位 e^{2πi/2^k}。"""
    phase = np.exp(2j * np.pi / (2 ** k))
    tmask = 1 << (n - 1 - tgt)
    cmask = 1 << (n - 1 - ctrl)
    out = state.copy()
    for i in range(len(state)):
        if (i & cmask) and (i & tmask):
            out[i] *= phase
    return out


def measure(state, pos=None):
    """计算基测量。若给定 pos，返回该比特取 0 的概率；否则返回完整概率分布。"""
    n = int(np.log2(len(state)))
    probs = np.abs(state) ** 2
    if pos is None:
        return probs
    mask = 1 << (n - 1 - pos)
    p0 = sum(p for i, p in enumerate(probs) if (i & mask) == 0)
    return p0


# ------------------------- 贝尔态制备（课件 01 · P46） -------------------------
def make_bell():
    n = 2
    state = ket("00")
    state = apply1(state, H, 0, n)      # H 作用于 q0
    state = cnot(state, ctrl=0, tgt=1, n=n)  # CNOT(q0->q1)
    return state


# ------------------------- Deutsch 算法（课件 01 · P60–P63） -------------------------
def deutsch(f):
    """f: {0,1}-> {0,1}。返回 'constant' 或 'balanced'。"""
    n = 2
    state = ket("01")                   # |0>|1>
    state = apply1(state, H, 0, n)      # H on q0
    state = apply1(state, H, 1, n)      # H on q1  -> |+>|->

    # U_f: |x>|y> -> |x>|y xor f(x)>，在第二寄存器（q1）上翻转让 f(x)=1 时
    xmask = 1 << (n - 1 - 0)            # q0 = x
    ymask = 1 << (n - 1 - 1)            # q1 = y
    out = np.zeros_like(state)
    for i in range(len(state)):
        x = 1 if (i & xmask) else 0
        if f(x) == 1:
            out[i] = state[i ^ ymask]
        else:
            out[i] = state[i]
    state = out

    state = apply1(state, H, 0, n)      # H on q0
    p0 = measure(state, pos=0)          # 测第一比特
    return "constant" if p0 > 0.5 else "balanced"


# ------------------------- QFT（课件 03） -------------------------
def qft_matrix(n):
    """QFT 矩阵 U_F[x,y] = ω^{xy}/√N, ω = e^{2πi/N}。"""
    N = 2 ** n
    w = np.exp(2j * np.pi / N)
    F = np.array([[w ** (x * y) for y in range(N)] for x in range(N)], dtype=complex)
    return F / np.sqrt(N)


def qft(state, n):
    return qft_matrix(n) @ state


# ------------------------- QPE（课件 03） -------------------------
def controlled_U_on_feature(state, ctrl_pos, feature_pos, n_total, Umat):
    """计数位 ctrl_pos 为 1 时，对特征比特 feature_pos 施加 2x2 矩阵 Umat。"""
    out = np.zeros_like(state)
    cmask = 1 << (n_total - 1 - ctrl_pos)
    fmask = 1 << (n_total - 1 - feature_pos)
    for i in range(len(state)):
        if (i & fmask):          # feature=1 的行已在下面 pair 中处理，跳过
            continue
        j0 = i                   # feature=0
        j1 = i | fmask           # feature=1
        if (i & cmask):          # ctrl=1 -> 施加 Umat
            out[j0] = Umat[0, 0] * state[j0] + Umat[0, 1] * state[j1]
            out[j1] = Umat[1, 0] * state[j0] + Umat[1, 1] * state[j1]
        else:                    # ctrl=0 -> 不变
            out[j0] = state[j0]
            out[j1] = state[j1]
    return out


def qpe(n_count, U, u):
    """量子相位估计。
    U: 2x2 幺正（单比特特征空间），u: 特征态（长度2），特征值 e^{2πi φ}。
    返回计数寄存器上各结果的概率分布。"""
    n_tot = n_count + 1                # 1 个特征比特
    state = np.zeros(2 ** n_tot, dtype=complex)
    for f in range(2):
        state[(0 << 1) | f] = u[f]     # 计数寄存器初始化为 |0…0⟩，特征位为 |u⟩
    # H^n_count 作用于计数位
    for p in range(n_count):
        state = apply1(state, H, p, n_tot)
    # 受控 U^{2^{n_count-1-j}}：计数位置 j（0=最左/最高权重）对应权重 2^{n_count-1-j}
    for j in range(n_count):
        power = 2 ** (n_count - 1 - j)
        Upow = np.linalg.matrix_power(U, power)
        state = controlled_U_on_feature(state, ctrl_pos=j, feature_pos=n_count,
                                       n_total=n_tot, Umat=Upow)
    # QFT† 作用于计数位（计数位是最左 n_count 位，特征位最右）
    F = qft_matrix(n_count)
    mat = state.reshape(2 ** n_count, 2)
    mat = F.conj().T @ mat
    state = mat.reshape(-1)
    # 统计计数位概率
    probs = np.abs(state) ** 2
    count_probs = np.zeros(2 ** n_count)
    for i in range(len(probs)):
        count_probs[i >> 1] += probs[i]
    return count_probs


# ------------------------- Grover（课件 03） -------------------------
def grover(n, target_index, iterations):
    """n 比特无结构搜索，target_index 为目标态索引，迭代 iterations 次。"""
    N = 2 ** n
    state = np.ones(N, dtype=complex) / np.sqrt(N)   # 均匀叠加 H^n|0>

    def oracle(s):
        s = s.copy()
        s[target_index] *= -1
        return s

    def diffusion(s):
        mean = np.mean(s)
        return 2 * mean - s

    for _ in range(iterations):
        state = oracle(state)
        state = diffusion(state)
    return np.abs(state) ** 2


# ------------------------- 自验证 -------------------------
if __name__ == "__main__":
    np.set_printoptions(precision=4, suppress=True)

    print("=== 1. 门验证 ===")
    assert np.allclose(X @ X, I), "X^2 != I"
    assert np.allclose(H @ H, I), "H^2 != I"
    assert np.allclose(S @ S, Z), "S^2 != Z"
    assert np.allclose(T @ T, S), "T^2 != S"
    print("X^2=I, H^2=I, S^2=Z, T^2=S  ✓")

    print("\n=== 2. 贝尔态制备 ===")
    bell = make_bell()
    print("态 =", bell, " (期望 (1,0,0,1)/√2 = |Φ+>)")
    assert np.allclose(bell, np.array([1, 0, 0, 1]) / np.sqrt(2)), "贝尔态制备失败"
    print("纠缠判定 det =", bell[0] * bell[3] - bell[1] * bell[2], "（≠0 即纠缠）")

    print("\n=== 3. Deutsch ===")
    f_const0 = lambda x: 0
    f_const1 = lambda x: 1
    f_id = lambda x: x                      # 平衡
    f_not = lambda x: 1 ^ x                 # 平衡
    print("f(x)=0   ->", deutsch(f_const0), " (期望 constant)")
    print("f(x)=1   ->", deutsch(f_const1), " (期望 constant)")
    print("f(x)=x   ->", deutsch(f_id), " (期望 balanced)")
    print("f(x)=1⊕x ->", deutsch(f_not), " (期望 balanced)")
    assert deutsch(f_const0) == "constant"
    assert deutsch(f_id) == "balanced"

    print("\n=== 4. QFT 矩阵 ===")
    F2 = qft_matrix(2)
    print("QFT_2 =\n", F2)
    # 验证 QFT_2 作用到 |00> 得均匀叠加
    print("QFT|00> =", qft(ket("00"), 2))

    print("\n=== 5. QPE (φ=3/8, 3 个计数比特) ===")
    phi = 3.0 / 8.0
    U = np.array([[1, 0], [0, np.exp(2j * np.pi * phi)]], dtype=complex)  # 特征态 |1>
    u = np.array([0, 1], dtype=complex)
    cp = qpe(3, U, u)
    top = int(np.argmax(cp))
    print("测量分布 =", cp)
    print("最可能结果 =", format(top, "03b"), " -> 估计 φ =", top / 8.0, " (真实 φ =", phi, ")")
    assert top == 3, "QPE 结果应为 011 (即 3)"

    print("\n=== 6. Grover (N=8, 目标索引 5, 迭代 2 次) ===")
    probs = grover(3, target_index=5, iterations=2)
    print("各态成功概率 =", probs)
    print("目标态概率 =", probs[5], " (期望 ≈ 0.95)")
    assert probs[5] > 0.9, "Grover 目标概率过低"

    print("\n全部自验证通过 ✓")
