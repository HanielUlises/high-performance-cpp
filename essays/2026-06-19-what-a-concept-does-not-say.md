---
slug: what-a-concept-does-not-say
title: What a Concept Does Not Say
authors: [hpc]
tags: [concepts, semantics, interface-design]
---

A concept named `Ring` is satisfied by any type with `+`, `*`, and the two identities. It is not
satisfied only by rings. The distinction is not pedantry: the algorithms constrained by such a
concept are correct on the rings and undefined on everything else in its model class, and the
compiler cannot tell the difference.

<!-- truncate -->

## The gap, precisely

A concept denotes a set of types — the ones for which its requirements are well-formed. The
mathematical structure it is named after denotes a smaller set: those types whose operations
additionally satisfy laws. The language checks membership in the larger set and the algorithm
requires membership in the smaller one.

Nothing about this is unusual or avoidable. Checking associativity would require quantifying over
all values of a type, which the language cannot do and no reasonable extension would. The gap is
structural.

What is avoidable is leaving it undocumented, which is the normal state of affairs.

## What goes wrong

Three failures, all ordinary.

`std::sort` requires a strict weak ordering, and a comparison over floating-point values
containing NaN is not one — NaN compares false against everything, so the induced equivalence is
not transitive. The consequence is not a mis-sorted range. Common implementations use the
ordering to bound an inner scan, and an invalid comparison walks past the end of the range. A
semantic violation produces a memory error.

`std::unordered_map` requires a hash consistent with equality. Supply one that is not, and
lookups fail to find elements that are present, silently, with no invariant visibly broken.

A parallel reduction over a type modelling `Monoid` returns a value depending on the thread
count, because the type's addition is not associative. Every individual component is correct.

In each case, the type satisfies the concept, the code compiles, and the defect lives in the gap.

## Writing the gap down

The treatment used in this reference is unremarkable and effective: the concept states the
syntax, and the semantic obligations are enumerated beside it with numbers.

```cpp
// Semantic requirements (unchecked by the compiler):
//   S1. op is associative on T.
//   S2. identity is a two-sided identity for op.
//   S3. op is a pure function of its arguments.
template <class T, class Op>
concept Monoid = /* syntax only */;
```

The numbering earns its place immediately. An algorithm can then say which obligations it uses —
"requires `Monoid<T, Op>` including S1" — which distinguishes the algorithms that reassociate
from those that do not, and tells a user supplying a non-associative operation exactly which
routines are safe.

The obligations also become testable. A property test over a generator of representative values
discharges S1 probabilistically, and for `double` under addition it fails, correctly, which is
the specification: the type does not satisfy S1, and the algorithms depending on it compute an
approximation whose bound is stated elsewhere.

## The design consequence

Once the gap is written down, a question becomes askable that is otherwise invisible: should this
obligation be an obligation at all, or should it be an invariant?

Some can be moved into the type. A normalised rational maintains `gcd(p, q) == 1` on
construction, so the obligation disappears. A matrix type constructed only from a Cholesky
factorization is positive definite by provenance. A sorted-range wrapper that permits no
unsorted construction removes the precondition from every algorithm consuming it.

Others can be moved into a check. Symmetry of an operator is not verifiable in general but is
verifiable probabilistically — $\langle Ax, y\rangle \approx \langle x, Ay\rangle$ for a few
random vectors — at the cost of a few applications, which is negligible against the iterations
that follow.

The remainder stay as obligations, and the point of enumerating them is that the remainder is now
a short, explicit list rather than an unbounded body of assumptions distributed across the
implementation.

## Why this is the interesting part

Concepts are usually discussed for what they added: better diagnostics, overload ordering,
constrained interfaces. Those are real and were worth the wait.

The more useful effect is that they made the boundary visible. Before C++20, requirements were
implicit and the distinction between the syntactic and semantic parts of an interface was not
expressible at all. Now the syntactic part is in the language, which throws the semantic part
into relief — and the semantic part is where the defects in generic numerical code actually live.
