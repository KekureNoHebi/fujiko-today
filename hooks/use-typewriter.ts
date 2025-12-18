import { useState, useEffect, useRef } from 'react';

export function useTypewriter(text: string, speed: number = 5) {
  const [displayedText, setDisplayedText] = useState('');
  const sourceTextRef = useRef(text);
  const indexRef = useRef(0);

  useEffect(() => {
    sourceTextRef.current = text;
  }, [text]);

  useEffect(() => {
    const timer = setInterval(() => {
      const currentSource = sourceTextRef.current;

      if (!currentSource) {
        if (indexRef.current !== 0) {
          indexRef.current = 0;
          setDisplayedText('');
        }
        return;
      }

      if (indexRef.current < currentSource.length) {
        indexRef.current += 1;
        setDisplayedText(currentSource.slice(0, indexRef.current));
      }
    }, speed);

    return () => clearInterval(timer);
  }, [speed]);

  return displayedText;
}
