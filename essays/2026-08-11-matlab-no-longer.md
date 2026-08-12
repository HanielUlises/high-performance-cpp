---

slug: matlab-no-longer
title: MATLAB No Longer Has a Place in the Modern World
authors: [hpc]
tags: [numerical-analysis, scientific-computing, performance, semantics, robotics]
---

High-performance numerical kernels are defined by the algebraic laws they exploit and by the architectural parameters they expose. Associativity of addition, distributivity of multiplication over addition, cache-line geometry, SIMD vector width, TLB reach, and the precise cost of data motion through the memory hierarchy jointly determine both attainable accuracy and attainable throughput.

Any language or environment that conceals those parameters prevents the programmer from stating the algorithm that is actually executed and from attaching a verifiable a-priori error bound to the computed result.

<!-- truncate -->

## Floating-point evaluation, parenthesisation and error bounds

Under IEEE-754 arithmetic, the parenthesisation of a sum or an inner product is part of the algorithm. Let

$$
s = \sum_{i=1}^{n} x_i.
$$

A strictly sequential left-to-right accumulation satisfies

$$
\left|\operatorname{fl}(s)-s\right|
\leq
\gamma_{n-1}\sum_{i=1}^{n}|x_i|,
$$

where

$$
\gamma_k = \frac{ku}{1-ku},
$$

and (u) is the unit roundoff, equal to

$$
u = 2^{-53}
$$

for binary64.

An accumulation performed with (k) independent partial sums, the natural form under SIMD lanes or multi-threaded reduction trees, has a bound of order

$$
\gamma_{n/k+k}\sum_{i=1}^{n}|x_i|.
$$

For terms of like sign, the reassociated form is therefore both faster and potentially more accurate: the depth of the dependency chain shrinks from (n) to roughly (n/k+k).

When cancellation is present, both bounds become relative to

$$
\sum_{i=1}^{n}|x_i|
$$

rather than to

$$
|s|.
$$

The comparison of accuracy therefore becomes data-dependent.

The important point is that the parenthesisation is not an implementation detail. It is part of the numerical algorithm.

Consider the two computations

$$
s_{\mathrm{seq}}
=

(((x_1+x_2)+x_3)+\cdots)+x_n
$$

and

$$
s_{\mathrm{tree}}
=

(x_1+x_2)+(x_3+x_4)+\cdots.
$$

They are equal over the real numbers. They are not generally equal over floating-point numbers.

A four-way accumulation makes the distinction explicit:

```cpp
double a0 = 0.0;
double a1 = 0.0;
double a2 = 0.0;
double a3 = 0.0;

for (std::size_t i = 0; i + 4 <= n; i += 4) {
    a0 += x[i + 0];
    a1 += x[i + 1];
    a2 += x[i + 2];
    a3 += x[i + 3];
}

double sum = a0 + a1 + a2 + a3;
```

The source now specifies the reassociation. The compiler does not need permission to invent it.

MATLAB's `sum`, matrix-vector product and higher-level factorisations select a parenthesisation, a blocking factor and an intermediate precision sequence that never appear in the user's text. The realised value of (k) cannot be named, the corresponding (\gamma) constant cannot be written, and any subsequent change in the vendor's vectorisation heuristic or BLAS binding can alter the bit pattern of the result without a corresponding change in the calling code.

The same opacity governs every composite kernel: blocked LU with partial pivoting, sparse CSR or CSC matrix-vector products, and the recursive Newton-Euler algorithm for inverse dynamics all inherit an accumulation order and a temporary-materialisation policy that are external to the numerical specification written by the user.

Compensated summation makes the distinction even sharper. The classical TwoSum transformation is

$$
(s,e)=\operatorname{TwoSum}(a,b),
$$

with

$$
s=\operatorname{fl}(a+b),
\qquad
e=\operatorname{fl}((a-s)+b).
$$

The residual (e) is precisely the information that ordinary floating-point addition discards. Algebraically, the expression is zero. Numerically, it need not be.

A compiler transformation that assumes unrestricted associativity can therefore destroy the very rounding behaviour on which the algorithm depends.

## Memory layout, data motion and static cost models

On contemporary CPUs, the dominant term in the runtime of dense and sparse kernels is frequently data motion rather than arithmetic. The number of (L_1) and (L_2) misses, the number of TLB walks, the ability to issue 256-bit or 512-bit vector loads, and the arithmetic intensity in flops per byte transferred from DRAM are functions of the concrete layout, leading dimension, alignment, and reuse distance of the working set.

A language that represents every array as an opaque descriptor whose relevant properties are resolved only at run time makes these parameters difficult to express as part of the algorithm itself.

C++ allows them to become part of the interface.

For example, a kernel can require contiguous storage:

```cpp
#include <concepts>
#include <span>
#include <type_traits>

template<class T>
concept Arithmetic =
    std::is_arithmetic_v<T>;

template<Arithmetic T>
double dot(
    std::span<const T> x,
    std::span<const T> y)
{
    double result = 0.0;

    for (std::size_t i = 0; i < x.size(); ++i) {
        result += static_cast<double>(x[i])
                * static_cast<double>(y[i]);
    }

    return result;
}
```

The abstraction is not merely syntactic. `std::span` expresses a non-owning contiguous range, while the template constraint restricts the domain of the kernel.

The same operation can be expressed with stronger compile-time information when the extent is known:

```cpp
#include <array>
#include <cstddef>
#include <type_traits>

template<class T, std::size_t N>
requires std::is_arithmetic_v<T>
constexpr T dot(
    const std::array<T, N>& x,
    const std::array<T, N>& y)
{
    T result{};

    for (std::size_t i = 0; i < N; ++i) {
        result += x[i] * y[i];
    }

    return result;
}
```

The loop bound is now part of the type. For sufficiently small (N), the entire computation can be evaluated during translation:

```cpp
constexpr std::array<double, 4> x{
    1.0, 2.0, 3.0, 4.0
};

constexpr std::array<double, 4> y{
    5.0, 6.0, 7.0, 8.0
};

constexpr double result = dot(x, y);

static_assert(result == 70.0);
```

This does not mean that every C++ numerical kernel should be written with fixed-size arrays. It means that the programmer can choose which properties belong to the static interface and which remain dynamic.

The same principle applies to multidimensional layout. With `std::mdspan`, the shape and layout of a multidimensional view can be separated from the algorithm operating on it:

```cpp
#include <mdspan>
#include <algorithm>
#include <cstddef>

template<class Matrix>
double trace(const Matrix& A)
{
    double result = 0.0;

    const auto n =
        std::min(A.extent(0), A.extent(1));

    for (std::size_t i = 0; i < n; ++i) {
        result += A(i, i);
    }

    return result;
}
```

The algorithm does not have to be rewritten for row-major and column-major storage. The layout policy becomes part of the view.

That distinction matters because the machine does not execute an abstract matrix. It executes loads and stores at concrete addresses.

## Python and Julia are goated

Python, through NumPy, SciPy and the surrounding array-programming stack, provides an exceptionally productive interactive surface. For standard operations, this is not a weakness: NumPy delegates substantial numerical work to compiled native kernels, and Python is often an excellent orchestration language.

The distinction appears when the required computation is no longer one of those standard kernels.

A simple NumPy expression such as

```python
y = alpha * x + beta * z
```

looks like one operation at the language level. Depending on the expression and implementation, it can involve several native kernels and intermediate arrays.

A fused implementation can make the data movement more explicit:

```python
import numpy as np

def fused_axpby(alpha, x, beta, z, out):
    np.multiply(x, alpha, out=out)
    out += beta * z
    return out
```

This is already better because the destination is controlled. But the programmer still does not obtain the same degree of control over the generated machine-level kernel as a C++ implementation in which the loop, layout, vectorisation constraints, and accumulation structure are directly expressed.

The difference becomes larger when the algorithm itself is unusual.

Suppose the desired operation is a four-way reduction:

```python
def four_way_sum(x):
    a0 = 0.0
    a1 = 0.0
    a2 = 0.0
    a3 = 0.0

    n = len(x)

    for i in range(0, n - 3, 4):
        a0 += x[i + 0]
        a1 += x[i + 1]
        a2 += x[i + 2]
        a3 += x[i + 3]

    return a0 + a1 + a2 + a3
```

The algorithm is now explicit, but the Python loop is not a competitive implementation of the numerical kernel. The usual answer is to move the operation into NumPy, Numba, Cython, C, C++, Rust, or another compiled layer.

The language is therefore excellent at expressing the use of a numerical kernel while often being less suitable for expressing the kernel itself when its performance contract is unusually specific.

Julia closes much of this gap.

A Julia implementation can specialize a generic kernel on concrete argument types:

```julia
function dot_product(
    x::AbstractVector{T},
    y::AbstractVector{T}
) where {T<:AbstractFloat}

    result = zero(T)

    @inbounds @simd for i in eachindex(x, y)
        result += x[i] * y[i]
    end

    return result
end
```

Broadcast fusion can also keep an expression at the level of one fused computation:

```julia
y .= α .* x .+ β .* z
```

rather than requiring the programmer to explicitly construct every intermediate array.

This is one of Julia's major strengths. The language can preserve a high-level mathematical notation while specializing the implementation to concrete types.

It does not, however, eliminate the underlying machine-level questions. Allocation, aliasing, memory locality, vectorisation, garbage collection, calling conventions, and library boundaries remain properties of the executed program.

## C++ under numerical performance constraints

C++ occupies a different point in this design space because the language does not force the numerical algorithm to remain at the level of a dynamic array expression.

The programmer can state the representation, lifetime, alignment, ownership, layout, and algorithmic structure directly.

For example, allocation can be removed from a numerical kernel entirely:

```cpp
template<class T>
void axpy(
    T alpha,
    std::span<const T> x,
    std::span<T> y)
{
    for (std::size_t i = 0; i < x.size(); ++i) {
        y[i] += alpha * x[i];
    }
}
```

There is no hidden allocation in the algorithm. The function receives storage owned elsewhere.

For a reduction where reassociation is desirable, the algorithm can expose independent accumulators:

```cpp
template<class T>
requires std::is_floating_point_v<T>
T parallel_sum(std::span<const T> x)
{
    T a0{};
    T a1{};
    T a2{};
    T a3{};

    const std::size_t n = x.size();
    const std::size_t limit = n - (n % 4);

    for (std::size_t i = 0; i < limit; i += 4) {
        a0 += x[i + 0];
        a1 += x[i + 1];
        a2 += x[i + 2];
        a3 += x[i + 3];
    }

    T result = a0 + a1 + a2 + a3;

    for (std::size_t i = limit; i < n; ++i) {
        result += x[i];
    }

    return result;
}
```

The compiler may vectorise this loop, but the important fact is that the mathematical reassociation is already present in the source.

If a different numerical policy is required, it can be written instead:

```cpp
template<class T>
requires std::is_floating_point_v<T>
T compensated_sum(std::span<const T> x)
{
    T sum = 0;
    T correction = 0;

    for (const T value : x) {
        const T y = value - correction;
        const T t = sum + y;
        correction = (t - sum) - y;
        sum = t;
    }

    return sum;
}
```

These two functions represent different numerical algorithms. A global compiler option does not decide which one the programmer intended.

That is the crucial distinction.

The compiler is free to optimise the algorithm. It is not being asked to invent the numerical policy.

The same principle extends to matrix kernels. A simple blocked matrix multiplication can expose its blocking factor directly:

```cpp
template<class T>
void matmul_blocked(
    std::span<const T> A,
    std::span<const T> B,
    std::span<T> C,
    std::size_t n,
    std::size_t block)
{
    for (std::size_t ii = 0; ii < n; ii += block) {
        for (std::size_t kk = 0; kk < n; kk += block) {
            for (std::size_t jj = 0; jj < n; jj += block) {

                const std::size_t i_end =
                    std::min(ii + block, n);

                const std::size_t k_end =
                    std::min(kk + block, n);

                const std::size_t j_end =
                    std::min(jj + block, n);

                for (std::size_t i = ii; i < i_end; ++i) {
                    for (std::size_t k = kk; k < k_end; ++k) {
                        const T aik = A[i * n + k];

                        for (std::size_t j = jj; j < j_end; ++j) {
                            C[i * n + j] +=
                                aik * B[k * n + j];
                        }
                    }
                }
            }
        }
    }
}
```

The block size is now an algorithmic parameter rather than an implementation detail buried inside a library.

It can be benchmarked against the target cache hierarchy:

```cpp
constexpr std::size_t block = 32;

matmul_blocked(
    A,
    B,
    C,
    n,
    block);
```

Or selected according to the target architecture:

```cpp
template<class T>
constexpr std::size_t block_size()
{
    if constexpr (sizeof(T) == 8) {
        return 32;
    } else {
        return 64;
    }
}
```

This is not merely about writing more code. It is about deciding which quantities belong to the numerical and architectural specification.

## C++ and the separation of policy from mechanism

The strongest case for C++ in this context is not that C++ is inherently faster than every other language. It is that C++ permits the numerical algorithm, representation, and machine-level policy to remain visible simultaneously.

A reduction policy can be represented as a type:

```cpp
struct SequentialReduction {
    template<class T>
    static T combine(T a, T b)
    {
        return a + b;
    }
};

struct PairwiseReduction {
    template<class T>
    static T combine(T a, T b)
    {
        return a + b;
    }
};
```

A generic algorithm can then take the policy explicitly:

```cpp
template<class T, class Reduction>
requires std::is_floating_point_v<T>
T reduce(
    std::span<const T> x,
    Reduction reduction)
{
    if (x.empty()) {
        return T{};
    }

    T result = x.front();

    for (std::size_t i = 1; i < x.size(); ++i) {
        result = reduction.combine(result, x[i]);
    }

    return result;
}
```

The important abstraction is not the class itself. It is the fact that the numerical policy is represented as a program entity that can be inspected, tested and replaced.

The same design can be used for accumulation precision:

```cpp
template<class Input, class Accumulator>
Accumulator sum_as(
    std::span<const Input> x)
{
    Accumulator result{};

    for (const Input value : x) {
        result += static_cast<Accumulator>(value);
    }

    return result;
}
```

Now the distinction between binary32 input and binary64 accumulation is explicit:

```cpp
float sum_f32 = sum_as<float, float>(x);
double sum_f64 = sum_as<float, double>(x);
```

The precision policy is no longer an implicit property of an interpreter, a BLAS implementation, or a compiler heuristic.

## C++ under robotics constraints

Robotics imposes a stricter requirement set than most scientific computing workloads: hard real-time deadlines, bounded and predictable memory traffic, deterministic latency from sensor interrupt to actuator command, and the ability to audit numerical residuals that enter safety-critical decisions.

A typical torque-control loop might execute at 1 kHz or faster. At that point, a computation that occasionally allocates, triggers garbage collection, materialises an unexpected temporary, or changes its memory-access pattern can violate the timing contract even if its average benchmark is excellent.

The C++ model allows the real-time boundary to be made explicit:

```cpp
class Controller {
public:
    explicit Controller(std::span<double> workspace)
        : workspace_(workspace)
    {}

    void update(
        std::span<const double> q,
        std::span<const double> dq,
        std::span<double> tau)
    {
        compute_dynamics(q, dq, tau);
    }

private:
    std::span<double> workspace_;

    void compute_dynamics(
        std::span<const double> q,
        std::span<const double> dq,
        std::span<double> tau)
    {
        for (std::size_t i = 0; i < tau.size(); ++i) {
            tau[i] = q[i] + dq[i];
        }
    }
};
```

The controller owns no dynamic memory. The workspace is supplied from outside the control loop.

For a kinematic or dynamic kernel, spatial quantities can similarly be represented using fixed-size types:

```cpp
struct SpatialVector {
    double data[6];
};

struct SpatialInertia {
    double data[36];
};

inline SpatialVector cross_motion(
    const SpatialVector& a,
    const SpatialVector& b)
{
    SpatialVector result{};

    // Fixed-size spatial operation.

    return result;
}
```

The dimensions are part of the type. There is no dynamic matrix dimension to discover at runtime.

This matters for the recursive Newton-Euler algorithm because the computational graph is sparse and highly structured. Spatial inertia, velocity and acceleration operations have fixed dimensions, predictable access patterns, and well-defined lifetimes.

The implementation can therefore be tuned against a particular micro-architecture without changing the mathematical interface.

MATLAB's Robotics System Toolbox and Simulink Coder can emit C or C++ code. That is useful, but it does not eliminate the distinction between specifying an algorithm and generating one from a higher-level description. The generated artefacts inherit decisions made by the code generator concerning temporaries, layout, scheduling and numerical evaluation order.

The generated binary must consequently be re-validated whenever the toolchain or generated implementation changes.

The identical issue appears in model-predictive control, geometric collision detection, rigid-body dynamics, state estimation and numerical integration. In each case, the relevant properties are not simply "fast" or "slow". They are:

* bounded execution time,
* bounded allocation,
* predictable memory traffic,
* controlled numerical evaluation order,
* known data layout,
* and a measurable relationship between the source algorithm and the generated instructions.

## Algorithm design under explicit control

The construction of a numerical kernel therefore proceeds from the algebraic law that licenses a transformation, through the concrete data layout and accumulation order that realise it, to the forward-error bound and the memory-hierarchy cost model that quantify the result.

Associativity licenses tree reductions and multi-accumulator schemes.

Distributivity licenses transformations such as Horner's rule:

$$
a_0+a_1x+a_2x^2+\cdots+a_nx^n
=
a_0+x(a_1+x(a_2+\cdots+x a_n)).
$$

Cache geometry licenses cache-aware blocking.

Contiguity and alignment license efficient packed loads.

Static extents license compile-time reasoning about dimensions.

Concepts and traits allow these requirements to become part of the interface rather than informal assumptions.

Each decision can remain under source control and can be regression-tested against both numerical residuals and performance counters.

This is the distinction that matters when comparing numerical environments.

Python is excellent at orchestration and interactive numerical experimentation. NumPy and SciPy provide mature native kernels, and Python can express complex scientific workflows with very little code.

Julia goes further by making specialization and compilation central to the language. Multiple dispatch, broadcast fusion and generated specialization allow a substantial amount of numerical structure to remain visible at the language level while still reaching native performance.

C++ goes further in a different direction.

It permits the programmer to decide exactly where the abstraction boundary lies.

The programmer can write the high-level algorithm:

```cpp
template<class Matrix>
requires requires(const Matrix& A) {
    A.extent(0);
    A.extent(1);
    A(0, 0);
}
double trace(const Matrix& A)
{
    double result = 0.0;

    const auto n =
        std::min(A.extent(0), A.extent(1));

    for (std::size_t i = 0; i < n; ++i) {
        result += A(i, i);
    }

    return result;
}
```

and still specialize the representation, allocation strategy, vectorisation strategy, blocking policy and numerical accumulation scheme underneath it.

That combination is what makes modern C++ particularly powerful for high-performance numerical computing.

The goal is not to write everything by hand.

The goal is to make the parts that matter **explicit** and let the compiler eliminate everything else.

When a language conceals the parenthesisation, the layout, the temporary policy and the binding to the underlying BLAS, those decisions cannot be recorded directly in the program text. The performance claim cannot be attached cleanly to a stated algorithm, and the error bound cannot be attached cleanly to a stated accumulation depth or working-set size.

For interactive exploration, MATLAB remains convenient. For conventional numerical workflows, Python and Julia are both powerful alternatives, each with a different set of trade-offs.

But for workloads in which the algorithm, representation, numerical semantics and temporal behaviour must all be treated as part of the specification, modern C++ provides something fundamentally different: the ability to expose the abstraction boundary itself and decide, one layer at a time, which properties belong to the mathematics, which belong to the type system, which belong to the compiler, and which belong to the machine.

That is the point. MATLAB supplies neither the algorithm nor the guarantees.
