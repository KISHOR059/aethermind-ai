import { useEffect, useRef, useState } from "react";
import { Play, Pause, Square, Volume2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/cn";

export interface VoicePlayerProps {
  audioBuffer?: ArrayBuffer | null;
  onEnded?: () => void;
  autoPlay?: boolean;
  className?: string;
}

export function VoicePlayer({
  audioBuffer,
  onEnded,
  autoPlay = true,
  className,
}: VoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!audioBuffer || audioBuffer.byteLength === 0) return;

    const blob = new Blob([audioBuffer], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    audioUrlRef.current = url;

    const audio = new Audio(url);
    audioRef.current = audio;

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(100);
      onEnded?.();
    };

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("timeupdate", handleTimeUpdate);

    if (autoPlay) {
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }

    return () => {
      audio.pause();
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, [audioBuffer, autoPlay, onEnded]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleStop = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    setProgress(0);
    onEnded?.();
  };

  if (!audioBuffer) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs",
        className,
      )}
    >
      <Volume2 className="size-4 shrink-0 animate-pulse" />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={togglePlay}
        className="size-7 rounded-md"
      >
        {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleStop}
        className="size-7 rounded-md text-destructive"
      >
        <Square className="size-3.5" />
      </Button>

      <div className="flex-1 h-1.5 bg-primary/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export default VoicePlayer;
