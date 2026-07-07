// Iconografia própria do CrossCamp — ícones de linha que herdam a cor do texto.
import type { CSSProperties } from "react";

export type IconName =
  | "calendar"
  | "pin"
  | "check"
  | "warn"
  | "block"
  | "camera"
  | "database"
  | "info";

export function Icon({
  name,
  size = 18,
  strokeWidth = 2,
  className,
  style,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const paths: Record<IconName, React.ReactNode> = {
    calendar: (
      <>
        <rect x="3" y="4.5" width="18" height="16" rx="2" />
        <path d="M8 2.5v4M16 2.5v4M3 9.5h18" />
      </>
    ),
    pin: (
      <>
        <path d="M12 21c4-4.2 7-7.4 7-11a7 7 0 1 0-14 0c0 3.6 3 6.8 7 11z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    check: <path d="M4 12.5l5 5L20 6" />,
    warn: (
      <>
        <path d="M12 3.5 22 20H2z" />
        <path d="M12 10v4" />
        <path d="M12 17.4v.2" />
      </>
    ),
    block: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M5.6 5.6l12.8 12.8" />
      </>
    ),
    camera: (
      <>
        <path d="M3 8.5a2 2 0 0 1 2-2h2l1.2-1.8h5.6L17 6.5h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <circle cx="12" cy="12.5" r="3.2" />
      </>
    ),
    database: (
      <>
        <ellipse cx="12" cy="6" rx="7" ry="3" />
        <path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
        <path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5" />
        <path d="M12 7.4v.2" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={{ verticalAlign: "-0.15em", flexShrink: 0, ...style }}
    >
      {paths[name]}
    </svg>
  );
}
