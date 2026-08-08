import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Chain from '@site/src/components/Chain';
import styles from './index.module.css';

type Part = {
  to: string;
  title: string;
  summary: string;
  topics: string[];
};

const parts: Part[] = [
  {
    to: '/docs/modern-cpp',
    title: 'Modern C++',
    summary:
      'The language as a medium for stating abstractions exactly: templates, concepts, constraints, and computation performed during translation.',
    topics: [
      'Language',
      'Templates',
      'Generic programming',
      'Concepts',
      'Constraints',
      'Metaprogramming',
      'Compile-time programming',
      'constexpr / consteval',
      'Standard library',
    ],
  },
  {
    to: '/docs/mathematics',
    title: 'Mathematics',
    summary:
      'The structures that generic components are written against — algebraic, analytic and probabilistic — stated in the form used later as concept requirements.',
    topics: [
      'Algebra',
      'Linear algebra',
      'Analysis',
      'Numerical analysis',
      'Optimization',
      'Probability',
      'Computational mathematics',
    ],
  },
  {
    to: '/docs/high-performance',
    title: 'High Performance',
    summary:
      'Cost models above the asymptotic one: memory hierarchy, data layout, vector execution, and the machine models that concurrency is written against.',
    topics: [
      'Computational complexity',
      'Memory',
      'Cache locality',
      'Data layout',
      'SIMD',
      'Vectorization',
      'Parallelism',
      'Concurrency',
      'GPU computing',
    ],
  },
  {
    to: '/docs/scientific-computing',
    title: 'Scientific Computing',
    summary:
      'Numerical kernels developed to the point of implementation: factorizations, sparse structure, quadrature, evolution equations and differentiation.',
    topics: [
      'Numerical linear algebra',
      'Sparse computation',
      'Numerical integration',
      'Differential equations',
      'Partial differential equations',
      'Automatic differentiation',
      'Optimization',
    ],
  },
  {
    to: '/docs/formal-cpp',
    title: 'Formal C++',
    summary:
      'Types read as sets with operations, concepts as predicates over those types, and the semantic obligations that the type system does not check.',
    topics: [
      'Types as abstractions',
      'Concepts as predicates',
      'Constraints',
      'Semantic requirements',
      'Type-level programming',
      'Compile-time reasoning',
      'Correctness',
    ],
  },
];

const material: Part[] = [
  {
    to: '/docs/examples',
    title: 'Examples',
    summary:
      'Complete derivations, each carried from a mathematical statement to a measured implementation.',
    topics: [],
  },
  {
    to: '/docs/benchmarks',
    title: 'Benchmarks',
    summary:
      'Measurement method, reported hardware, and results for the kernels developed in the reference.',
    topics: [],
  },
  {
    to: '/essays',
    title: 'Essays and Notes',
    summary:
      'Longer arguments about abstraction, cost and correctness that do not belong in a reference entry.',
    topics: [],
  },
];

export default function Home(): ReactNode {
  return (
    <Layout
      title="High Performance C++"
      description="A technical reference for modern C++, mathematical foundations, generic programming and performance-oriented computation.">
      <main className={styles.page}>
        <header className={styles.masthead}>
          <h1 className={styles.title}>High Performance C++</h1>
          <p className={styles.subtitle}>Mathematics · Abstraction · Computation</p>
          <p className={styles.abstract}>
            A technical reference for modern C++, mathematical foundations, generic
            programming, and performance-oriented computation. Entries are organised by
            subject rather than by language revision, and each is developed from a formal
            statement through to a measured implementation.
          </p>
          <nav className={styles.entry} aria-label="Primary entry points">
            <Link to="/docs">Reference</Link>
            <Link to="/docs/conventions">Conventions</Link>
            <Link to="/docs/examples">Examples</Link>
            <Link to="/docs/benchmarks">Benchmarks</Link>
            <Link to="/essays">Essays</Link>
          </nav>
        </header>

        <section className={styles.section} aria-labelledby="method">
          <h2 id="method" className={styles.sectionTitle}>
            Method
          </h2>
          <p className={styles.sectionLede}>
            Every entry follows the same derivation. A subject is admitted only when it can
            be carried the whole way along it.
          </p>
          <Chain
            stages={[
              {
                label: 'Abstraction',
                detail: 'The mathematical object and the structure it carries.',
              },
              {
                label: 'Specification',
                detail: 'Its operations, laws and admissible domain, stated formally.',
              },
              {
                label: 'Type / concept',
                detail: 'The C++ encoding of that specification as a constrained interface.',
              },
              {
                label: 'Implementation',
                detail: 'A generic algorithm written against the concept, not a type.',
              },
              {
                label: 'Complexity',
                detail: 'Operation counts and working set under a stated cost model.',
              },
              {
                label: 'Hardware mapping',
                detail: 'Layout, locality, vector width, and the parallel decomposition.',
              },
              {
                label: 'Measurement',
                detail: 'Timings against a declared machine, compiler and method.',
              },
            ]}
          />
        </section>

        <section className={styles.section} aria-labelledby="contents">
          <h2 id="contents" className={styles.sectionTitle}>
            Contents
          </h2>
          <ol className={styles.parts}>
            {parts.map((part) => (
              <li key={part.to} className={styles.part}>
                <h3 className={styles.partTitle}>
                  <Link to={part.to}>{part.title}</Link>
                </h3>
                <p className={styles.partSummary}>{part.summary}</p>
                <p className={styles.partTopics}>{part.topics.join(' · ')}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.section} aria-labelledby="material">
          <h2 id="material" className={styles.sectionTitle}>
            Supporting material
          </h2>
          <ul className={styles.material}>
            {material.map((item) => (
              <li key={item.to} className={styles.materialItem}>
                <Link to={item.to} className={styles.materialTitle}>
                  {item.title}
                </Link>
                <span className={styles.materialSummary}>{item.summary}</span>
              </li>
            ))}
          </ul>
        </section>

        <footer className={styles.note}>
          <p>
            The reference is revised in place. Language revisions are recorded as
            compatibility metadata on the pages they affect, so that entries remain valid as
            C++20, C++23 and C++26 material accumulates. See the{' '}
            <Link to="/colophon">colophon</Link> for the toolchain and editorial rules.
          </p>
        </footer>
      </main>
    </Layout>
  );
}
