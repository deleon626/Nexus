/**
 * ProgressBar Component
 *
 * Progress indicator showing form completion status.
 * Displays X/Y fields filled with visual progress bar.
 *
 * Features:
 * - Visual progress bar with smooth transitions
 * - Text display: "X/Y fields filled"
 * - Percentage-based fill width
 * - Fixed/sticky positioning support
 *
 * @see 03-CONTEXT.md "Progress Bar" section
 * @see 03-RESEARCH.md "Progress Calculation for Form Completion"
 */

import { cn } from '@/lib/utils';

// ============================================================================
// Props
// ============================================================================

export interface ProgressBarProps {
  /** Number of required fields filled */
  completed: number;
  /** Total number of required fields */
  total: number;
  /** Completion percentage (0-100) */
  percentage: number;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Progress bar showing form completion status
 *
 * Displays a visual bar with filled portion based on percentage,
 * and text showing "X/Y fields filled" format.
 *
 * @example
 * ```tsx
 * <ProgressBar
 *   completed={5}
 *   total={10}
 *   percentage={50}
 *   className="sticky top-0"
 * />
 * ```
 */
export function ProgressBar({
  completed,
  total,
  percentage,
  className,
}: ProgressBarProps) {
  // Clamp percentage between 0 and 100
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  return (
    <div className={cn('w-full space-y-2', className)}>
      {/* Progress text */}
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-300">
          {completed}/{total} fields filled
        </span>
        <span className="text-gray-500 dark:text-gray-400">
          {clampedPercentage}%
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={clampedPercentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Form progress: ${completed} of ${total} fields filled`}
      >
        {/* Filled portion with smooth transition */}
        <div
          className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300 ease-out rounded-full"
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
    </div>
  );
}
