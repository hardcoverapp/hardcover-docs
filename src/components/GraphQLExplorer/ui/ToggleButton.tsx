import type { ReactNode } from "react";

export type TogglePosition = "start" | "middle" | "end" | "only";

const RADIUS: Record<TogglePosition, string> = {
  start: "rounded-l-md border",
  middle: "border-t border-b",
  end: "rounded-r-md border-t border-r border-b",
  only: "rounded-md border",
};

/**
 * A button in a segmented control.
 *
 * Previously these conveyed their selected state with background colour alone,
 * which is invisible to a screen reader and to anyone who cannot distinguish
 * the two colours. `aria-pressed` carries the state, and `label` is required so
 * icon-only buttons have an accessible name rather than only a `title`
 * (which does not survive touch and is unreliably announced).
 */
export const ToggleButton = ({
  pressed,
  onClick,
  label,
  position = "middle",
  className = "",
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  label: string;
  position?: TogglePosition;
  className?: string;
  children: ReactNode;
}) => (
  <button
    type="button"
    aria-pressed={pressed}
    aria-label={label}
    title={label}
    onClick={onClick}
    className={[
      "px-2 py-1 text-xs font-medium transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-offset-1",
      RADIUS[position],
      pressed
        ? "bg-accent-600 text-white border-accent-600"
        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700",
      className,
    ].join(" ")}
  >
    {children}
  </button>
);
