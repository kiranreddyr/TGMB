import styles from "./Header.module.css";

interface HeaderProps {
  generatedAt: string | null;
  cityCount: number;
}

export default function Header({ generatedAt, cityCount }: HeaderProps) {
  const asOf = generatedAt
    ? new Date(generatedAt).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <div className={styles.header}>
      <div className={styles.title}>The Global Melt Belt</div>
      <div className={styles.tagline}>Where on Earth it&rsquo;s perfect ice cream weather, right now.</div>
      {asOf && (
        <div className={styles.asOf}>
          As of {asOf} your time · {cityCount} cities
        </div>
      )}
    </div>
  );
}
