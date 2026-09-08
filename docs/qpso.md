# Quantum-Inspired Particle Swarm Optimization (QPSO)
**Mathematical Specification and Algorithmic Derivation for Intelligent Transportation Systems**  
**SIH 2026 Problem Statement SIH26137**

---

## 1. Background & Quantum Foundations

Standard Particle Swarm Optimization (PSO), introduced by Kennedy and Eberhart (1995), models candidate solutions as particles moving in continuous search space with positions $x_i$ and velocities $v_i$ obeying classical Newtonian mechanics:
$$v_{i,d}(t+1) = w \cdot v_{i,d}(t) + c_1 r_1 (pbest_{i,d} - x_{i,d}(t)) + c_2 r_2 (gbest_d - x_{i,d}(t))$$
$$x_{i,d}(t+1) = x_{i,d}(t) + v_{i,d}(t+1)$$

In classical PSO, particles have bounded velocity trajectories and can become trapped in local minima in rugged multi-modal transportation landscapes.

### Quantum Delta Potential Well Formulation
Sun, Feng, and Xu (2004) proposed Quantum-Behaved PSO (QPSO) based on quantum mechanics principles. In QPSO, particles possess quantum behavior and do not have deterministic trajectories or velocities. Instead, each particle moves in a quantum space governed by a **delta potential well** centered at its local attractor $p_i$.

The Schrödinger equation for a particle in a 1D delta potential well $V(x) = -\gamma \delta(x - p)$ is:
$$-\frac{\hbar^2}{2m} \frac{d^2 \psi(x)}{dx^2} - \gamma \delta(x - p) \psi(x) = E \psi(x)$$

Solving for the normalized bound-state wavefunction $\psi(x)$ yields:
$$\psi(y) = \frac{1}{\sqrt{L}} e^{-|y|/L}, \quad \text{where } y = x - p, \quad L = \frac{\hbar^2}{m\gamma}$$

The probability density function $Q(y)$ of observing the particle at position $y$ is:
$$Q(y) = |\psi(y)|^2 = \frac{1}{L} e^{-2|y|/L}$$

Using the Monte Carlo inverse transform method with random variable $u \sim U(0, 1)$:
$$x = p \pm \frac{L}{2} \ln\left(\frac{1}{u}\right)$$

---

## 2. QPSO Algorithmic Operators

### 2.1 Mean Best Position ($m_{best}$)
The swarm maintains a collective mean best position computed as the center of mass of all individual personal bests ($pbest$):
$$m_{best} = \frac{1}{N} \sum_{i=1}^N pbest_i = \left(\frac{1}{N} \sum_{i=1}^N pbest_{i,1}, \, \dots, \, \frac{1}{N} \sum_{i=1}^N pbest_{i,D}\right)$$

### 2.2 Local Attractor ($p_i$)
To ensure convergence toward optimal regions, each particle is attracted to a stochastic convex combination of its personal best ($pbest_i$) and the swarm global best ($gbest$):
$$p_{i,d} = \phi_d \cdot pbest_{i,d} + (1 - \phi_d) \cdot gbest_d, \quad \phi_d \sim U(0, 1)$$

### 2.3 Position Update Equation
Substituting the characteristic length scale $L = 2 \beta |m_{best} - x_i(t)|$ into the quantum wavefunction solution gives the core QPSO state update:
$$x_{i,d}(t+1) = p_{i,d} \pm \beta \cdot |m_{best,d} - x_{i,d}(t)| \cdot \ln\left(\frac{1}{u_{i,d}}\right)$$
where:
- $u_{i,d} \sim U(0, 1)$
- The sign $\pm$ is selected with equal probability ($P = 0.5$)
- $\beta$ is the **contraction-expansion coefficient**, scheduled dynamically from $\beta_{max} = 1.0$ to $\beta_{min} = 0.5$ over iterations $t \in [1, T_{max}]$:
  $$\beta(t) = \beta_{max} - \frac{\beta_{max} - \beta_{min}}{T_{max}} \cdot t$$

---

## 3. Discrete Road Route Encoding & Repair

Road network routing is fundamentally a discrete graph problem defined on $G = (V, E)$. Continuous numbers cannot simply be treated as road coordinates without an explicit encoding mechanism.

### 3.1 Candidate Archetype Logit Representation
1. For origin $O$ and destination $D$, Yen's algorithm extracts $K$ diverse, loop-free shortest candidate paths.
2. A particle position $X_i = (x_{i,1}, x_{i,2}, \dots, x_{i,K})$ represents continuous preference logits over candidate corridors.
3. Continuous coordinates are mapped to discrete corridor selections via softmax probabilities:
   $$P(k) = \frac{e^{x_{i,k} / \tau}}{\sum_{j=1}^K e^{x_{i,j} / \tau}}$$

### 3.2 Feasibility Checker & Local Detour Repair
If dynamic traffic, construction, or an incident closes a segment $(u, v)$ on the selected route:
1. The feasibility validator flags the road blockage constraint violation.
2. The **Repair Operator** computes a localized detour sub-path bypassing the blocked edge $(u, v)$ using localized search.
3. If an admissible detour exists, the route is repaired and preserved in the swarm.
4. If no detour exists, a heavy penalty is added to the fitness score ($F \leftarrow F + 10.0$) to steer particles away from disconnected corridors.

---

## 4. Multi-Factor Normalized Objective Function

Candidate routes are evaluated across five distinct transportation parameters:
$$F = w_1 \cdot T + w_2 \cdot C + w_3 \cdot D + w_4 \cdot R + w_5 \cdot B$$

Each factor is normalized strictly to the unit interval $[0, 1]$:
- $T = \min\left(1.0, \, \frac{\text{travel\_time\_min}}{T_{max}}\right)$
- $C = \text{congestion\_index} \in [0, 1]$
- $D = \min\left(1.0, \, \frac{\text{distance\_km}}{D_{max}}\right)$
- $R = \text{risk\_score} \in [0, 1]$
- $B = \begin{cases} 1.0 & \text{if road blocked/closed} \\ 0.0 & \text{if clear} \end{cases}$

Weights are constrained such that $\sum_{i=1}^5 w_i = 1.0$. Lower $F$ indicates a superior route.
