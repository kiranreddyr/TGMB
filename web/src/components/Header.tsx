import styles from "./Header.module.css";

interface HeaderProps {
  generatedAt: string | null;
  cityCount: number;
}

/** Small status badge over the globe — title/tagline now live in IntroSection above. */
export default function Header({ generatedAt, cityCount }: HeaderProps) {
  const asOf = generatedAt
    ? new Date(generatedAt).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  if (!asOf) return null;

  return (
    <div className={styles.header}>
      <span className={styles.dot} aria-hidden />
      <span>
        AS OF {asOf.toUpperCase()} YOUR TIME · {cityCount} CITIES
      </span>
    </div>
  );
}
