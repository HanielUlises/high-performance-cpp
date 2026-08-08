import MDXComponents from '@theme-original/MDXComponents';
import Standards from '@site/src/components/Standards';
import Complexity from '@site/src/components/Complexity';
import Formal, {
  Definition,
  Proposition,
  Theorem,
  Law,
  Requirement,
} from '@site/src/components/Formal';
import Chain from '@site/src/components/Chain';

/**
 * Components available to every MDX page without an import, so that content
 * files stay close to plain prose.
 */
export default {
  ...MDXComponents,
  Standards,
  Complexity,
  Formal,
  Definition,
  Proposition,
  Theorem,
  Law,
  Requirement,
  Chain,
};
