import React, {type ReactNode} from 'react';
import styles from './styles.module.css';

export type ChainStage = {
  label: string;
  detail?: string;
};

/**
 * The derivation the reference follows: abstraction to formal specification to
 * type, implementation, cost, hardware mapping and measurement.
 */
export default function Chain({
  stages,
  compact = false,
}: {
  stages: ChainStage[];
  compact?: boolean;
}): ReactNode {
  return (
    <ol className={compact ? `${styles.chain} ${styles.compact}` : styles.chain}>
      {stages.map((stage) => (
        <li key={stage.label} className={styles.stage}>
          <span className={styles.label}>{stage.label}</span>
          {stage.detail && !compact ? (
            <span className={styles.detail}>{stage.detail}</span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
