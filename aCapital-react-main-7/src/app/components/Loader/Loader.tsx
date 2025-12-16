import type { CSSProperties } from "react";

import styles from "./loader.module.scss";

type LoaderProps = {
  size?: number;
  className?: string;
  color?: string;
  label?: string;
};

const joinClassNames = (...values: Array<string | undefined>) => values.filter(Boolean).join(" ");

export default function Loader({ size = 16, className, color, label = "Загрузка" }: LoaderProps) {
  const borderWidth = Math.max(2, Math.round(size / 6));
  const spinnerStyle: CSSProperties = {
    width: size,
    height: size,
    borderWidth,
    borderTopColor: color ?? "var(--cusses, #80c069)",
  };

  return (
    <span className={joinClassNames(styles.loader, className)} role="status" aria-live="polite">
      <span className={styles.spinner} style={spinnerStyle} aria-hidden="true" />
      <span className={styles.srOnly}>{label}</span>
    </span>
  );
}
