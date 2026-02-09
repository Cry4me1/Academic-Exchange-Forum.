# 深入理解时间依赖的薛定谔方程 (Time-Dependent Schrödinger Equation)

在量子力学中，系统的状态由波函数 $\Psi(\mathbf{r}, t)$ 描述。对于一个在势场 $V(\mathbf{r}, t)$ 中运动的非相对论粒子，其演化遵循时间依赖的薛定谔方程：

$$
i \hbar \frac{\partial}{\partial t} \Psi(\mathbf{r}, t) = \hat{H} \Psi(\mathbf{r}, t)
$$

其中，$\hat{H}$ 是哈密顿算符 (Hamiltonian operator)：

$$
\hat{H} = -\frac{\hbar^2}{2m} \nabla^2 + V(\mathbf{r}, t)
$$

## 波函数的物理诠释

根据哥本哈根诠释， $|\Psi(\mathbf{r}, t)|^2$ 代表在时刻 $t$ 、位置 $\mathbf{r}$ 处找到粒子的**概率密度**。

$$
\int_{\text{all space}} |\Psi(\mathbf{r}, t)|^2 d^3r = 1
$$

## 数值模拟：一维无限深势井

我们可以使用 Python 对通过 Crank-Nicolson 方法对一维无限深势井中的波函数演化进行数值模拟。

以下是核心的演化代码片段：

```python
import numpy as np
import scipy.sparse as sparse
from scipy.sparse.linalg import spsolve

def crank_nicolson_step(psi, V, dx, dt, hbar=1.0, m=1.0):
    """
    使用 Crank-Nicolson 方法进行单步时间演化
    (I + i*dt/2hbar * H) * psi(t+dt) = (I - i*dt/2hbar * H) * psi(t)
    """
    N = len(psi)
    coef = 1j * dt / (2 * hbar)
    
    # 构造哈密顿矩阵 H (三对角矩阵)
    main_diag = 2.0 * np.ones(N) / dx**2 + 2 * m * V / hbar**2
    off_diag = -1.0 * np.ones(N-1) / dx**2
    
    H = sparse.diags([off_diag, main_diag, off_diag], [-1, 0, 1], format='csc')
    
    # Implicit equation matrices
    A = sparse.eye(N) + coef * H
    B = sparse.eye(N) - coef * H
    
    # 求解线性方程组 A * psi_new = B * psi_old
    psi_new = spsolve(A, B.dot(psi))
    
    return psi_new
```

## 结论

通过数值求解，我们可以清晰地观察到波包在势井壁上的**干涉与反射**现象，验证了能量守恒定律在量子系统中的体现。$\langle E \rangle = \langle \Psi | \hat{H} | \Psi \rangle$ 保持常数。
 