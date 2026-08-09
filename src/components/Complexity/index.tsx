import React, {type ReactNode} from 'react';
import styles from './styles.module.css';

export type ComplexityRow = {
  /** Operation or algorithm being characterised. */
  operation: ReactNode;
  /** Time complexity, in asymptotic notation. */
  time: ReactNode;
  /** Working space beyond the input, where relevant. */
  space?: ReactNode;
  /** Arithmetic intensity, memory traffic, or any other qualifier. */
  note?: ReactNode;
};

/**
 * Cost summary for the operations discussed on a page. Kept separate from the
 * prose so that complexity claims are stated once, in a uniform shape.
 */
export default function Complexity({
  rows,
  title = 'Complexity',
  unit,
}: {
  rows: ComplexityRow[];
  title?: string;
  /** Cost model in force, e.g. "floating-point operations, dense n × n". */
  unit?: string;
}): ReactNode {
  const hasSpace = rows.some((row) => row.space !== undefined);
  const hasNote = rows.some((row) => row.note !== undefined);

  return (
    <figure className={styles.figure}>
      <figcaption className={styles.caption}>
        {title}
        {unit ? <span className={styles.unit}>; {unit}</span> : null}
      </figcaption>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Operation</th>
            <th scope="col">Time</th>
            {hasSpace ? <th scope="col">Space</th> : null}
            {hasNote ? <th scope="col">Remarks</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              <th scope="row" className={styles.operation}>
                {row.operation}
              </th>
              <td className={styles.cost}>{row.time}</td>
              {hasSpace ? <td className={styles.cost}>{row.space ?? 'n/a'}</td> : null}
              {hasNote ? <td>{row.note ?? 'n/a'}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
