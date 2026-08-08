---
slug: checking-the-cost-of-an-abstraction
title: Checking the Cost of an Abstraction
authors: [hpc]
tags: [generic-programming, performance, method]
---

The phrase "zero-overhead abstraction" is used as though it described a property that C++
abstractions possess. It describes a property that particular abstractions possess under
particular conditions, and the conditions are checkable. Treating the phrase as a guarantee is
how libraries acquire abstractions that cost twenty percent and nobody notices.

<!-- truncate -->

## What the claim actually says

An abstraction is free when the code generated for a concrete use is what a competent
hand-written monomorphic version would be. That is a statement about generated instructions, and
it is decided by reading them, not by reasoning about the language's design philosophy.

Three conditions have to hold. The parameterisation must be resolved during translation, so that
no indirect call remains. The representation must be unchanged, so that no additional data
movement is introduced. And the abstraction must not obstruct an optimisation the concrete
version would have received — which is the condition that fails most often and most quietly.

The first two are easy to check and are usually satisfied. `static_assert(sizeof(W) ==
sizeof(T))` settles the second; the absence of a virtual function settles the first.

## The third condition

The third fails in ways that have nothing to do with the abstraction's design.

A wrapper type with a user-provided copy constructor is no longer trivially copyable, so an array
of it can no longer be relocated with a `memcpy`, so vector growth becomes a loop of constructor
calls. The wrapper is still the same size. It still has no virtual functions. It costs a factor
of several on any code that grows containers of it.

A range adaptor pipeline three deep inlines and vectorizes; the same pipeline six deep exceeds
an inlining budget, and every element access becomes a call. Nothing about the source changed
except its length.

A generic kernel taking two `std::span` parameters cannot be vectorized without a runtime overlap
check, because the compiler cannot prove the spans are disjoint. The concrete version, written
with two local arrays, has no such problem. The abstraction did not add instructions; it removed
information.

In each case, the abstraction is free by the first two criteria and expensive in fact.

## The discipline

This suggests treating the claim the way any other performance claim is treated: as something to
be established for a specific abstraction in a specific use, and re-established when either
changes.

The mechanics are unremarkable. Compile the abstract and concrete versions of a kernel and
compare the generated code. Keep the comparison in the build, so that a compiler upgrade or an
innocuous refactor that breaks it is caught when it happens rather than during the next
performance investigation. Assert the representational properties — size, triviality, alignment —
next to the type, since they are part of its interface for the code that depends on them.

What makes this worth doing is not that abstractions are usually expensive. They are usually
free. It is that the cases where they are not are invisible in the source, and the cost is
attributed to something else — to the algorithm, to the machine, to the compiler — for a long
time before anyone looks.

## The stronger case

There is a stronger claim available, and it is the one worth making. A well-chosen abstraction is
not merely free; it is faster than the concrete code it replaces, because it makes a better
implementation feasible.

An algorithm written against a concept can dispatch to a specialised path when the argument
supports one. A kernel taking `mdspan` with a layout policy can be blocked once and used for
every storage order. An expression template can fuse three traversals into one, removing memory
traffic that the concrete version has no way to avoid without being rewritten.

This is the case for abstraction in performance-oriented code, and it is a stronger case than the
defensive one. It also has the same evidentiary requirement: the generated code, or the
measurement, or neither claim is made.
