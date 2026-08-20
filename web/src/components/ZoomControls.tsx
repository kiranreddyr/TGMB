import styles from "./ZoomControls.module.css";

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
}

/** Mouse-wheel zoom is disabled on the globe (it fights the page's own scroll), so zoom is button-driven instead. */
export default function ZoomControls({ onZoomIn, onZoomOut }: ZoomControlsProps) {
  return (
    <div className={styles.controls}>
      <button className={styles.button} onClick={onZoomIn} aria-label="Zoom in">
        +
      </button>
      <button className={styles.button} onClick={onZoomOut} aria-label="Zoom out">
        −
      </button>
    </div>
  );
}
