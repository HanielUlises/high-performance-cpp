---
slug: matlab-no-longer
title: MATLAB No Longer Has a Place in the Modern World
authors: [hpc]
tags: [numerical-analysis, scientific-computing, performance, semantics, robotics]
---

High-performance numerical kernels are defined by the algebraic laws they exploit and by the architectural parameters they expose. Associativity of addition, distributivity of multiplication over addition, cache-line geometry, SIMD vector width, TLB reach, and the precise cost of data motion through the memory hierarchy jointly determine both attainable accuracy and attainable throughput. Any language or environment that conceals those parameters prevents the programmer from stating the algorithm that is actually executed and from attaching a verifiable a-priori error bound to the computed result.

<!-- truncate -->

## Floating-point evaluation, parenthesisation and error bounds

Under IEEE-754 arithmetic the parenthesisation of a sum or an inner product is part of the algorithm. Let (s=\sum_{i=1}^n x_i). A strictly sequential left-to-right accumulation satisfies

$$
\bigl|\mathrm{fl}(s)-s\bigr|
\leq
\gamma_{n-1}\sum_{i=1}^n |x_i|,
$$

where

$$
\gamma_k=\frac{ku}{1-ku}
$$

and (u) is unit roundoff ((2^{-53}) for binary64).

An accumulation performed with (k) independent partial sums, the natural form under SIMD lanes or multi-threaded reduction trees, realises a bound of order

$$
\gamma_{n/k+k}.
$$

For terms of like sign the reassociated form is therefore both faster and more accurate: the depth of the dependency chain shrinks from (n) to roughly (n/k+k). When cancellation is present, both bounds become relative to (\sum |x_i|) rather than to (|s|), and the comparison of accuracy is data-dependent; the only way to know which parenthesisation was used is to control it in source.

MATLAB's `sum`, matrix-vector product and higher-level factorisations select a parenthesisation, a blocking factor and an intermediate precision sequence that never appear in the user's text. The realised value of (k) cannot be named, the corresponding (\gamma) constant cannot be written, and any subsequent change in the vendor's vectorisation heuristic or BLAS binding alters the bit pattern of the result without a corresponding change in the calling code. The same opacity governs every composite kernel: blocked LU with partial pivoting, sparse CSR or CSC matrix-vector products, and the recursive Newton-Euler algorithm for inverse dynamics all inherit an uninspectable accumulation order and an uninspectable policy for materialising temporaries.

Compensated summation and other error-free transformations illustrate the severity of the problem. The classical TwoSum step

$$
(s,e)=\mathrm{TwoSum}(a,b),
$$

i.e.

$$
s=\mathrm{fl}(a+b),
\qquad
e=\mathrm{fl}((a-s)+b),
$$

relies on the fact that the expression is algebraically zero yet numerically nonzero. Any global reassociation permission destroys the residual (e). Because MATLAB never exposes the intermediate rounding points, such transformations cannot be expressed reliably inside the language; they must be moved to a compiled extension whose floating-point contract is again outside the user's control.

## Memory layout, data motion and static cost models

On contemporary CPUs the dominant term in the runtime of dense and sparse kernels is data motion. The number of (L_1) and (L_2) misses, the number of TLB walks, the ability to issue 256-bit or 512-bit aligned loads, and the arithmetic intensity (flops per byte transferred from DRAM) are functions of the concrete layout (row-major versus column-major), the leading dimension, the alignment of each base pointer, and the reuse distance of each working set. A language that represents every array as an opaque descriptor whose strides and alignment are resolved only at run time precludes the construction of a static, compile-time cost model.

In C++ the layout can be made a first-class part of the type system. A concept that requires a contiguous, over-aligned range of rows permits the compiler to emit packed vector loads and permits the programmer to prove (L_1) residency for a given cache size. The same generic algorithm can be instantiated for a blocked layout whose panel width is a compile-time constant matching the target micro-architecture. The resulting instruction mix, the exact number of cache-line transfers, and the arithmetic intensity are therefore direct consequences of decisions written in the program text and can be checked by static analysis or by performance counters against a previously stated model.

## Python and Julia as partial alternatives

Python, through NumPy, SciPy and the surrounding array-programming stack, provides a convenient interactive surface and an extensive library ecosystem. Its performance-critical kernels are thin wrappers around the identical BLAS, LAPACK, FFTW and SuiteSparse binaries that MATLAB itself links. The language nevertheless retains a global interpreter lock, per-object reference-counting traffic, and fully dynamic stride and dtype information. Any kernel that demands custom fusion of several BLAS calls, a non-default accumulation order, or a hard upper bound on latency must be rewritten in a compiled language; the Python-C boundary crossing itself injects both additional memory traffic and an extra source of nondeterminism into the error analysis.

Julia was designed from the outset for numerical computing. Multiple dispatch, specialisation of generic functions on concrete layouts, and an aggressive LLVM-based JIT allow many of the transformations that remain hidden inside MATLAB to be written explicitly while still executing at speeds within a small constant of hand-tuned native code. Broadcast fusion and generated functions frequently eliminate temporaries that would otherwise be materialised.

Julia remains, however, a garbage-collected language. Allocation patterns that are invisible during interactive development become nondeterministic pauses once the same code is placed inside a real-time control loop. Interoperability with existing C and C++ libraries is efficient yet not zero-cost: each crossing must still respect Julia's GC rooting rules and calling convention. The corpus of production-grade, ABI-stable numerical libraries with multi-decade support remains substantially smaller than the corresponding C++ ecosystem.

## C++ under robotics constraints

Robotics imposes a stricter requirement set than most scientific computing workloads: hard real-time deadlines (commonly 1 kHz or faster torque loops), bounded and predictable memory traffic, deterministic latency from sensor interrupt to actuator command, and the ability to audit every floating-point residual that enters a safety-critical decision. The dominant middleware (ROS 2), the dominant kinematics and dynamics libraries (Pinocchio, RBDL, the C++ core of Drake), and the real-time operating systems deployed on robot controllers are written in C++. These systems rely on the language's zero-overhead abstraction principle, unrestricted access to SIMD intrinsics or portable vector types, explicit control of allocation, and the complete absence of a garbage collector.

Consider the recursive Newton-Euler algorithm for inverse dynamics of a kinematic tree. The computational graph is sparse; each spatial inertia, velocity and acceleration must be accumulated with a known forward-error bound and must remain inside the (L_1) cache of the core executing the control thread. In C++ the intermediate spatial vectors can be allocated with exact alignment and known lifetime, the cross-product and (6\times6) matrix-vector stages can be fused by hand or by expression templates, and the compiler can prove that no temporary escapes to the heap. The resulting binary meets a fixed deadline on a given micro-architecture with a cache-miss profile that can be measured once and thereafter treated as an invariant.

MATLAB's Robotics System Toolbox and Simulink Coder can emit C or C++ code. The generated artefacts nevertheless inherit the original opacity: the parenthesisation of each spatial operation, the temporary-materialisation policy, and the final memory layout remain those chosen by the code generator. The emitted binary is typically larger, still contains residual dynamic allocation or hidden copies, and must be re-validated against timing and accuracy requirements after every toolbox or coder update.

The identical pattern appears in model-predictive control (where the condensed QP or the Riccati recursion must execute inside a fixed time slot), in geometric collision detection (where bounding-volume hierarchy traversal must be cache-resident), and in the numerical integration of rigid-body dynamics (where energy drift is a direct function of the accumulation order inside the Lie-group integrators). In each of these kernels the properties that matter (determinism, cache residency, and an auditable floating-point bound) are language-level guarantees in C++ and only post-generation measurements in MATLAB.

## Algorithm design under explicit control

The construction of a numerical kernel therefore proceeds from the algebraic law that licenses a transformation, through the concrete data layout and accumulation order that realise it, to the forward-error bound and the memory-hierarchy cost model that quantify the result. Associativity licenses tree reductions and multi-accumulator schemes; cache geometry licenses cache-aware and cache-oblivious blocking; contiguity and alignment license packed vector loads; an explicit type system licenses the statement of all of the above requirements as concepts or traits that the compiler can check. Each decision remains under source control and can be regression-tested against both numerical residuals and performance counters.

When a language conceals the parenthesisation, the layout, the temporary policy and the binding to the underlying BLAS, none of those decisions can be recorded in the program text. The performance claim cannot be attached to a stated algorithm, and the error bound cannot be attached to a stated accumulation depth or a stated working-set size. For any workload in which both the algorithm and its numerical and temporal guarantees must be known (large-scale scientific computing kernels, real-time robotics, safety-critical simulation, or any other domain that treats floating-point evaluation as part of the specification) MATLAB supplies neither the algorithm nor the guarantees.
