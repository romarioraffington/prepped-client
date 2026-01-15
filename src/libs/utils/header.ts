/**
 * Calculates the right spacing for headerTitleContainerStyle based on the number
 * of buttons in the headerRight component. Keeps title centering consistent.
 *
 * buttonCount:
 * - 0 -> 56px
 * - 1 -> 76px (one 20px icon + hitSlop/padding/margins)
 * - 2 -> 131px (two icons with gap + padding/margins)
 */
export function calculateHeaderRightSpacing(buttonCount: number): number {
  if (buttonCount === 0) return 56;
  if (buttonCount === 1) return 76;
  if (buttonCount === 2) return 131;
  return 56;
}
