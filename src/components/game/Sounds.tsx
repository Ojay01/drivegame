// components/SoundManager.tsx
"use client";
import { useEffect, useRef, useState } from "react";

type SoundType = 'betting' | 'driving' | 'crashed' | 'cashout';

const SOUND_URLS = {
  betting: "https://cdn.freesound.org/previews/555/555389_5674468-lq.mp3",
  driving: "/sounds/driving.mp3",
  crashed: "/sounds/crash.wav",
  cashout: "https://cdn.freesound.org/previews/511/511484_4931062-lq.mp3"
};

export const useSoundManager = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const soundsRef = useRef<Record<SoundType, AudioBuffer | null>>({
    betting: null,
    driving: null,
    crashed: null,
    cashout: null
  });
  const [isReady, setIsReady] = useState(false);

  // Initialize audio context and load sounds
  const init = async () => {
    try {
      // @ts-ignore - Safari still uses webkitAudioContext
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();
      
      // Load all sounds
      await Promise.all(
        Object.entries(SOUND_URLS).map(async ([key, url]) => {
          const response = await fetch(url);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await audioContextRef.current!.decodeAudioData(arrayBuffer);
          soundsRef.current[key as SoundType] = audioBuffer;
        })
      );
      
      setIsReady(true);
    } catch (error) {
      console.error("Sound initialization failed:", error);
    }
  };

  // Play sound with Web Audio API
  const playSound = (type: SoundType) => {
    if (!isReady || !audioContextRef.current) return;

    const buffer = soundsRef.current[type];
    if (!buffer) return;

    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    
    if (type === 'driving') {
      source.loop = true;
    }
    
    source.start(0);
    return source;
  };

  // Expose initialization function
  return { init, playSound, isReady };
};