import React, {type ReactNode} from 'react';
import styles from './styles.module.css';

type FormalKind = 'Definition' | 'Proposition' | 'Theorem' | 'Law' | 'Requirement' | 'Remark';

/**
 * A numbered formal statement. Numbering is supplied by a CSS counter reset
 * once per page, so statements renumber themselves when a page is reordered.
 */
export function Formal({
  kind,
  title,
  children,
}: {
  kind: FormalKind;
  title?: string;
  children: ReactNode;
}): ReactNode {
  return (
    <aside className={styles.block} data-kind={kind}>
      <p className={styles.head}>
        <span className={styles.kind}>{kind}</span>
        {title ? <span className={styles.title}>{title}</span> : null}
      </p>
      <div className={styles.body}>{children}</div>
    </aside>
  );
}

export const Definition = (props: {title?: string; children: ReactNode}) => (
  <Formal kind="Definition" {...props} />
);
export const Proposition = (props: {title?: string; children: ReactNode}) => (
  <Formal kind="Proposition" {...props} />
);
export const Theorem = (props: {title?: string; children: ReactNode}) => (
  <Formal kind="Theorem" {...props} />
);
export const Law = (props: {title?: string; children: ReactNode}) => (
  <Formal kind="Law" {...props} />
);
export const Requirement = (props: {title?: string; children: ReactNode}) => (
  <Formal kind="Requirement" {...props} />
);

export default Formal;
