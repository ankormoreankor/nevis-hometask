import { useVideoPlayback } from "@/lib/useVideoPlayback";
import styles from "./StatePage.module.css";

export type StatePageProps = {
  videoSrc: string;
  poster: string;
  videoWidth: number;
  videoHeight: number;
  children: React.ReactNode;
};

function PauseIcon() {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="10" y1="5" x2="10" y2="19" />
      <line x1="14" y1="5" x2="14" y2="19" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="7 5 19 12 7 19 7 5" />
    </svg>
  );
}

export default function StatePage({
  videoSrc,
  poster,
  videoWidth,
  videoHeight,
  children,
}: StatePageProps) {
  const { videoRef, isPlaying, prefersReducedMotion, togglePlay } = useVideoPlayback();

  return (
    <main className={styles.shell}>
      <div className={styles.mediaWrapper}>
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          autoPlay={!prefersReducedMotion}
          preload="metadata"
          poster={poster}
          aria-hidden="true"
          tabIndex={-1}
          src={videoSrc}
          width={videoWidth}
          height={videoHeight}
          className={styles.video}
        />
        <button
          type="button"
          aria-label={isPlaying ? "Pause animation" : "Play animation"}
          onClick={togglePlay}
          className={styles.pauseButton}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
      </div>
      <div className={styles.content}>{children}</div>
    </main>
  );
}
