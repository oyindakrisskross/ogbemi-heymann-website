import { useEffect, useRef, useState } from "react";

type TypewriterTextProps = {
  text: string;
  className?: string;
  delay?: number;
  onComplete?: () => void;
  speed?: number;
};

function typingDelay(text: string, visibleCharacters: number, baseSpeed: number) {
  const previousCharacter = text[visibleCharacters - 1] || "";
  const nextCharacter = text[visibleCharacters] || "";
  const variation = ((visibleCharacters * 23) % 31) - 15;

  if (previousCharacter === "\n") return baseSpeed * 7;
  if ([".", "!", "?"].includes(previousCharacter)) return baseSpeed * 6;
  if ([",", ";", ":"].includes(previousCharacter)) return baseSpeed * 4;
  if (previousCharacter === " ") return baseSpeed * 2.25;
  if (nextCharacter === "\n") return baseSpeed * 1.8;

  return Math.max(45, baseSpeed + variation);
}

export function TypewriterText({
  text,
  className = "",
  delay = 0,
  onComplete,
  speed = 74
}: TypewriterTextProps) {
  const [visibleCharacters, setVisibleCharacters] = useState(0);
  const [typing, setTyping] = useState(false);
  const completedRef = useRef(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisibleCharacters(text.length);
      return;
    }

    const startTimer = window.setTimeout(() => {
      setTyping(true);
    }, delay);

    return () => window.clearTimeout(startTimer);
  }, [delay, text.length]);

  useEffect(() => {
    completedRef.current = false;
  }, [text]);

  useEffect(() => {
    if (!typing || visibleCharacters >= text.length) return;

    const typingTimer = window.setTimeout(() => {
      setVisibleCharacters((current) => current + 1);
    }, typingDelay(text, visibleCharacters, speed));

    return () => window.clearTimeout(typingTimer);
  }, [speed, text, typing, visibleCharacters]);

  useEffect(() => {
    if (visibleCharacters < text.length || completedRef.current) return;
    completedRef.current = true;
    onComplete?.();
  }, [onComplete, text.length, visibleCharacters]);

  const typedText = text.slice(0, visibleCharacters);

  return (
    <span className={`typewriter-text ${className}`} aria-label={text}>
      <span aria-hidden="true">{typedText}</span>
      <span
        aria-hidden="true"
        className={`typewriter-cursor ${visibleCharacters >= text.length ? "is-finished" : ""}`}
      />
    </span>
  );
}
