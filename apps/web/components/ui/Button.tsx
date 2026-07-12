/**
 * App-level Button — re-exports the shared design-system Button so product
 * code can keep importing from `@/components/ui/Button` while visuals and a11y
 * stay single-sourced in `@evolved-pros/ui`.
 */

export {
  Button,
  type ButtonProps,
  type ButtonVariant,
  type ButtonSize,
} from '@evolved-pros/ui'
