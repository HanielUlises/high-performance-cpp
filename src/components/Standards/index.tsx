import React, {type ReactNode} from 'react';
import styles from './styles.module.css';

export type StandardEntry = {
  /** Standard revision, e.g. "C++20". */
  std: string;
  /** What that revision contributes to the subject of the page. */
  note: ReactNode;
  /** Optional paper or clause reference, e.g. "P0734R0". */
  paper?: string;
};

/**
 * Language-revision metadata for a page.
 *
 * Revisions are compatibility information attached to a subject, never the
 * organising principle of the reference; a page is about `constexpr`, and
 * records which revisions changed it.
 */
export default function Standards({
  entries,
  title = 'Language revisions',
}: {
  entries: StandardEntry[];
  title?: string;
}): ReactNode {
  return (
    <section className={styles.block} aria-label={title}>
      <p className={styles.title}>{title}</p>
      <dl className={styles.list}>
        {entries.map((entry) => (
          <React.Fragment key={entry.std}>
            <dt className={styles.term}>{entry.std}</dt>
            <dd className={styles.definition}>
              {entry.note}
              {entry.paper ? <span className={styles.paper}>{entry.paper}</span> : null}
            </dd>
          </React.Fragment>
        ))}
      </dl>
    </section>
  );
}
