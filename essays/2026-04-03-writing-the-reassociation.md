---
slug: writing-the-reassociation
title: Writing the Reassociation
authors: [hpc]
tags: [numerical-analysis, vectorization, semantics]
---

Almost every fast reduction in existence is licensed by a property that floating-point addition
does not have. The situation is stable, well understood, and routinely misdescribed — as a
compiler flag, as a precision setting, as a tolerance question — when it is none of those. It is
a question about which algorithm is being executed.

<!-- truncate -->

## The situation

A sum of $n$ terms evaluated left to right has one parenthesisation. A sum evaluated with four
accumulators, or eight vector lanes, or sixteen threads, has a different one. If addition were
associative these would agree. It is not, and they do not.

The differences are not pathological. For terms of like sign they are bounded by $\gamma_{n-1}
\sum |x_i|$ against $\gamma_{n/k + k}\sum|x_i|$, and the reassociated form is *more* accurate
than the sequential one — the split reduces the depth of the accumulation, and error grows with
depth. For terms of mixed sign with cancellation, both are unbounded relative to the true sum,
and which is closer is not predictable.

So the reassociated reduction is faster, usually more accurate, and returns a different value.
All three are true simultaneously, and each is sometimes reported alone as though it settled the
matter.

## The flag framing

The usual framing is: enable fast-math and the compiler will vectorize your reductions. This
gets the structure exactly backwards.

`-ffast-math` grants a global permission to reassociate, to assume no NaN or infinity, to
contract multiplications and additions, and to treat denormals as zero. It applies to every
floating-point operation in the translation unit, including the ones that are correct only under
strict semantics — the error-free transformations in a compensated summation, for instance,
which the flag deletes entirely because `(a - (s - b)) + (b - b')` is algebraically zero and is
not numerically zero, and the flag says to believe the algebra.

The result is a program whose numerical behaviour is determined by an option, in which the
reductions that should be reassociated and the ones that must not be are treated identically, and
in which the change is invisible at every point where it applies.

## The alternative

Write the reassociation.

```cpp
double a0 = 0.0, a1 = 0.0, a2 = 0.0, a3 = 0.0;
for (std::size_t i = 0; i + 4 <= n; i += 4) {
    a0 += x[i + 0];  a1 += x[i + 1];  a2 += x[i + 2];  a3 += x[i + 3];
}
```

This is a different algorithm from the sequential sum, and it says so. It compiles to the fast
form under strict semantics, because no permission is needed for a transformation the source
already performed. It has a stated error bound, which the flag-based version also has but which
nobody computes because the transformation was not visible. And the compensated summation
elsewhere in the same translation unit continues to work.

The cost is that the unrolling factor is in the source, and the right factor depends on the
target's arithmetic latency and throughput. That is a real cost. It is also a decision that
someone has to make, and making it explicitly is better than deferring it to a heuristic that has
no error analysis attached.

## The general shape

This is an instance of a pattern that recurs throughout the material in this reference. A
mathematical structure licenses an algorithmic transformation; the C++ type approximates the
structure; the transformation is applied anyway; the gap is a bounded error rather than a
correctness failure.

Associativity licenses tree reductions. Commutativity licenses unordered accumulation. An
identity licenses empty subranges. Distributivity licenses Horner's rule and strength reduction.
Every one of these is exact over the mathematical structure and approximate over the
floating-point type that models it.

The discipline that follows is to state which law each transformation uses, and to carry the
error bound alongside the performance claim. A reduction that is eight times faster and produces
a different answer is a good trade in almost every case; it is a trade, and it should be recorded
as one.
