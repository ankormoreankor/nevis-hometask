import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

function safePlay(video: HTMLVideoElement, onPlayingChange: (playing: boolean) => void) {
  const playPromise = video.play();
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        onPlayingChange(true);
      })
      .catch(() => {
        onPlayingChange(false);
      });
  }
}

export function useVideoPlayback() {
  const prefersReducedMotion = useReducedMotion();
  const [isPlaying, setIsPlaying] = useState(!prefersReducedMotion);
  const userPausedRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Autoplay unless reduced motion; a user pause survives preference changes.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    video.muted = true;

    if (prefersReducedMotion) {
      video.pause();
      setIsPlaying(false);
    } else if (!userPausedRef.current) {
      safePlay(video, setIsPlaying);
    }
  }, [prefersReducedMotion]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (isPlaying) {
      userPausedRef.current = true;
      video.pause();
      setIsPlaying(false);
    } else {
      userPausedRef.current = false;
      safePlay(video, setIsPlaying);
    }
  };

  return {
    videoRef,
    isPlaying,
    prefersReducedMotion,
    togglePlay,
  };
}
