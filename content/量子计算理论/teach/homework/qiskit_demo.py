# -*- coding: utf-8 -*-
"""
Qiskit 对照版（可选，需 pip install qiskit）
============================================
与 quantum_toolkit.py 功能相同，但用 Qiskit 的线路 / Statevector 实现，
方便你熟悉工业级量子编程框架（课件 00 · P55 提到 Qiskit、太元云平台等）。

运行：  pip install qiskit
        python3 qiskit_demo.py
"""

from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector
import numpy as np


def bell_qiskit():
    """用 Qiskit 制备贝尔态 |Φ+> = (|00>+|11>)/√2。"""
    qc = QuantumCircuit(2)
    qc.h(0)
    qc.cx(0, 1)
    return Statevector.from_instruction(qc).data


def deutsch_qiskit(kind):
    """Deutsch 算法。kind: 'const0' | 'const1' | 'id' | 'not'。"""
    qc = QuantumCircuit(2)
    qc.x(1)               # 第二寄存器置 |1>
    qc.h(0)
    qc.h(1)               # 变成 |+>|->

    if kind == "id":      # f(x) = x  -> CNOT
        qc.cx(0, 1)
    elif kind == "not":   # f(x) = 1 xor x -> CNOT 再翻第二寄存器
        qc.cx(0, 1)
        qc.x(1)
    elif kind == "const1":  # f(x) = 1 -> 翻转第二寄存器
        qc.x(1)
    # const0: 什么都不做

    qc.h(0)
    sv = Statevector.from_instruction(qc)
    p0 = abs(sv.data[0]) ** 2 + abs(sv.data[1]) ** 2   # 测第一比特取 0 的概率
    return "constant" if p0 > 0.5 else "balanced"


def qft_qiskit(n):
    """用 Qiskit 内置库构造 QFT 并取态向量。"""
    from qiskit.circuit.library import QFT
    qc = QFT(n, do_swaps=True)
    return Statevector.from_instruction(qc).data


if __name__ == "__main__":
    print("Qiskit 贝尔态 =", np.round(bell_qiskit(), 4),
          " (期望 (0.707,0,0,0.707))")
    for k in ["const0", "const1", "id", "not"]:
        print(f"Deutsch({k}) ->", deutsch_qiskit(k))
    print("Qiskit QFT_2 =")
    print(np.round(qft_qiskit(2), 3))
