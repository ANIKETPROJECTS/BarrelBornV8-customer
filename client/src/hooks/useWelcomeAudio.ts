import { useEffect, useRef, useState } from "react";
import barrelbornWelcomeAudio from "@assets/Barrelbornwelcome_1766651854689.mp3";

// Global audio instance to prevent multiple setups
let globalAudio: HTMLAudioElement | null = null;
let globalAudioReady = false;
let globalSetupComplete = false;

export function useWelcomeAudio() {
  const [hasPlayedAudio, setHasPlayedAudio] = useState(() => {
    try {
      return sessionStorage.getItem('welcomeAudioPlayed') === 'true';
    } catch {
      return false;
    }
  });
  const [audioError, setAudioError] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playWelcomeAudio = async () => {
    if (hasPlayedAudio || audioError || !globalAudio || !globalAudioReady) {
      return;
    }

    try {
      globalAudio.currentTime = 0;
      const playPromise = globalAudio.play();
      
      if (playPromise !== undefined) {
        await playPromise;
        setHasPlayedAudio(true);
        try {
          sessionStorage.setItem('welcomeAudioPlayed', 'true');
        } catch (error) {
          console.warn('Could not save to sessionStorage:', error);
        }
        console.log('Welcome audio played successfully');
      }
    } catch (error) {
      console.error('Audio playback failed:', error);
    }
  };

  useEffect(() => {
    const audioSources = [
      barrelbornWelcomeAudio,
      '/Welcome.mp3',
      './Welcome.mp3', 
      '/assets/Welcome.mp3'
    ];

    const setupAudioGlobal = async () => {
      if (globalSetupComplete) {
        if (globalAudio && globalAudioReady) {
          setIsReady(true);
          audioRef.current = globalAudio;
        }
        return;
      }

      globalSetupComplete = true;
      
      const absolutePath = window.location.origin + barrelbornWelcomeAudio;
      const audioSources = [
        barrelbornWelcomeAudio,
        absolutePath,
        '/Welcome.mp3',
        './Welcome.mp3', 
        '/assets/Welcome.mp3'
      ];
      
      for (const source of audioSources) {
        try {
          const audio = new Audio();
          audio.preload = 'auto';
          audio.volume = 0.6;
          audio.loop = false;
          
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Load timeout')), 3000);
            
            const onCanPlay = () => {
              clearTimeout(timeout);
              audio.removeEventListener('canplaythrough', onCanPlay);
              audio.removeEventListener('error', onError);
              resolve();
            };
            
            const onError = (e: any) => {
              clearTimeout(timeout);
              audio.removeEventListener('canplaythrough', onCanPlay);
              audio.removeEventListener('error', onError);
              reject(e);
            };
            
            audio.addEventListener('canplaythrough', onCanPlay, { once: true });
            audio.addEventListener('error', onError, { once: true });
            
            audio.src = source;
            audio.load();
          });

          globalAudio = audio;
          globalAudioReady = true;
          audioRef.current = audio;
          setIsReady(true);
          console.log(`Audio ready from source: ${source}`);
          break;
          
        } catch (error) {
          console.warn(`Failed to load audio from ${source}:`, error);
        }
      }

      if (!globalAudio || !globalAudioReady) {
        console.error('All audio sources failed to load');
        setAudioError(true);
      }
    };

    setupAudioGlobal();
  }, [hasPlayedAudio, audioError]);

  return { hasPlayedAudio, audioError, isReady, playWelcomeAudio };
}