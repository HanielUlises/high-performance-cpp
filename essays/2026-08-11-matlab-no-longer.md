---
slug: writing-the-reassociation
title: Writing the Reassociation
authors: [hpc]
tags: [numerical-analysis, vectorization, semantics]
---

Almost every fast reduction in existence is licensed by a property that floating-point addition does not have. The situation is stable, well understood, and routinely misdescribed as a compiler flag, a precision setting, or a tolerance question when it is none of those. It is a question about which algorithm is being executed.

<!-- truncate -->

## The situation

A sum of (n) terms evaluated left to right has one parenthesisation. A sum evaluated with four accumulators, or eight vector lanes, or sixteen threads, has a different one. If addition were associative, these would agree. It is not, and they do not.

For terms of like sign, the forward error of sequential accumulation is bounded by

$$
\gamma_{n-1}\sum_{i=1}^{n}|x_i|,
$$

where

$$
\gamma_k = \frac{ku}{1-ku},
$$

and (u) is the unit roundoff.

A reassociated reduction with (k) independent partial sums has a bound of the form

$$
\gamma_{n/k+k}\sum_{i=1}^{n}|x_i|.
$$

The reassociated form can therefore be **more accurate** than the sequential one: splitting the accumulation reduces its depth, and rounding error grows with that depth.

For terms of mixed sign with cancellation, both bounds are relative to

$$
\sum_{i=1}^{n}|x_i|
$$

rather than to

$$
\left|\sum_{i=1}^{n}x_i\right|,
$$

so which parenthesisation is closer to the exact result is data-dependent.

So the reassociated reduction is faster, usually more accurate, and returns a different value. All three are true simultaneously, and each is sometimes reported alone as though it settled the matter.

## The flag framing

The usual framing is: enable fast-math and the compiler will vectorize your reductions. This gets the structure exactly backwards.

`-ffast-math` grants a global permission to reassociate, to assume no NaN or infinity, to contract multiplications and additions, and to treat denormals as zero. It applies to every floating-point operation in the translation unit, including the ones that are correct only under strict semantics.

Consider the error-free transformations used by compensated summation. An expression such as

$$
(a - (s-b)) + (b-b')
$$

is algebraically zero but need not be numerically zero. Under aggressive floating-point reassociation, the compiler may legally transform it according to the algebraic identity rather than preserve the sequence of operations on which the compensation depends.

The result is a program whose numerical behaviour is determined by an option, in which the reductions that should be reassociated and the ones that must not be are treated identically, and in which the change is invisible at every point where it applies.

## The alternative

Write the reassociation.

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

This is a different algorithm from the sequential sum, and it says so. It compiles to the fast form under strict semantics because no additional permission is needed for a transformation that is already present in the source.

The reassociation is explicit: four independent accumulation chains are formed and combined only at the end. A compiler can map these chains naturally onto SIMD lanes or independent floating-point execution resources without being granted permission to change the semantics of unrelated operations.

The numerical structure is visible as well. The source makes clear that the computation is no longer

$$
(((x_0+x_1)+x_2)+x_3)+\cdots,
$$

but instead consists of several partial sums followed by a final reduction.

The compensated summation elsewhere in the same translation unit can therefore remain untouched.

The cost is that the unrolling factor is now part of the source, and the right factor depends on the target's arithmetic latency, throughput, register pressure, and vector width. That is a real cost.

It is also a decision that someone has to make, and making it explicitly is better than deferring it to a heuristic that has no error analysis attached.

## The general shape

This is an instance of a pattern that recurs throughout the material in this reference. A mathematical structure licenses an algorithmic transformation; the C++ type approximates the structure; the transformation is applied anyway; the gap is a bounded error rather than a correctness failure.

Associativity licenses tree reductions. Commutativity licenses unordered accumulation. An identity licenses empty subranges. Distributivity licenses Horner's rule and strength reduction.

Every one of these is exact over the mathematical structure and approximate over the floating-point type that models it.

The discipline that follows is to state which law each transformation uses, and to carry the error bound alongside the performance claim.

A reduction that is eight times faster and produces a different answer is a good trade in almost every case; it is a trade, and it should be recorded as one.
