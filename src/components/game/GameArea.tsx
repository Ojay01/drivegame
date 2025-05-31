"use client";
import React, { useRef, useEffect, useState } from "react";
import { Gauge, Flame, TrendingUp, Clock } from "lucide-react";
import CarSVG from "@/components/car";
import { useGameContext } from "./GameContext";
import CrashedCarSVG from "../crashed-car";

// Sound URLs - replace these with your actual sound URLs
const SOUND_URLS = {
  betting: "https://cdn.freesound.org/previews/555/555389_5674468-lq.mp3", // UI ready sound
  driving: "/sounds/driving.mp3", // Engine revving sound
  crashed: "/sounds/crash.wav", // Crash sound
  cashout: "https://cdn.freesound.org/previews/511/511484_4931062-lq.mp3", // Cash register sound
  countdown: "https://cdn.freesound.org/previews/316/316847_5123451-lq.mp3", // Countdown beep sound
};

const GameArea: React.FC = () => {
  const { multiplier, gameState, autoCashOut, hasPlacedBet } = useGameContext();

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const roadRef = useRef<HTMLDivElement>(null);
  const [carPosition, setCarPosition] = useState<string>(() => {
    // Initialize car position based on initial game state
    // If page loads during driving state, start at 50% to avoid animation from 1%
    return gameState == "driving" ? "50%" : "1%";
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasGameStateChanged, setHasGameStateChanged] = useState(false);
  
  // Countdown state
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showCountdown, setShowCountdown] = useState(false);

  // Sound refs
  const bettingSoundRef = useRef<HTMLAudioElement | null>(null);
  const drivingSoundRef = useRef<HTMLAudioElement | null>(null);
  const crashedSoundRef = useRef<HTMLAudioElement | null>(null);
  const cashoutSoundRef = useRef<HTMLAudioElement | null>(null);
  const countdownSoundRef = useRef<HTMLAudioElement | null>(null);
  const [soundsLoaded, setSoundsLoaded] = useState(false);

  // Track initial game state to detect if it's a page reload during driving
  const [initialGameState] = useState(gameState);

  // Initialize sound objects
  useEffect(() => {
    // Create audio elements
    bettingSoundRef.current = new Audio(SOUND_URLS.betting);
    drivingSoundRef.current = new Audio(SOUND_URLS.driving);
    crashedSoundRef.current = new Audio(SOUND_URLS.crashed);
    cashoutSoundRef.current = new Audio(SOUND_URLS.cashout);
    countdownSoundRef.current = new Audio(SOUND_URLS.countdown);

    // Configure sounds
    if (drivingSoundRef.current) {
      drivingSoundRef.current.loop = true;
    }

    // Mark sounds as loaded
    setSoundsLoaded(true);

    // Cleanup function
    return () => {
      [
        bettingSoundRef,
        drivingSoundRef,
        crashedSoundRef,
        cashoutSoundRef,
        countdownSoundRef,
      ].forEach((ref) => {
        if (ref.current) {
          ref.current.pause();
          ref.current.currentTime = 0;
        }
      });
    };
  }, []);

  // Track when game state changes from initial state
  useEffect(() => {
    if (gameState !== initialGameState) {
      setHasGameStateChanged(true);
    }
  }, [gameState, initialGameState]);

  // Handle countdown when transitioning from crashed to betting
  useEffect(() => {
    if (gameState === "betting") {
      // Start countdown after crash
      const startCountdown = () => {
        setShowCountdown(true);
        setCountdown(5); // Fixed to 5 seconds
        
        const countdownInterval = setInterval(() => {
          setCountdown((prev) => {
            if (prev === null || prev <= 1) {
              clearInterval(countdownInterval);
              setShowCountdown(false);
              setCountdown(null);
              return null;
            }
            
            return prev - 1;
          });
        }, 1000);
      };

      // Start countdown after a brief delay to show crash effect first
      const crashTimeout = setTimeout(startCountdown, 1500);
      
      return () => {
        clearTimeout(crashTimeout);
      };
    } else {
      // Reset countdown when not in crashed state
      setShowCountdown(false);
      setCountdown(null);
    }
  }, [gameState]);

  // Play sounds based on game state changes
  useEffect(() => {
    if (!soundsLoaded) return;

    // Stop all sounds first (except countdown which is handled separately)
    [bettingSoundRef, drivingSoundRef, crashedSoundRef].forEach((ref) => {
      if (ref.current) {
        ref.current.pause();
        ref.current.currentTime = 0;
      }
    });

    // Play the appropriate sound based on game state
    if (gameState === "betting" && bettingSoundRef.current && !showCountdown) {
      bettingSoundRef.current
        .play()
        .catch((e) => console.log("Sound play error:", e));
    } else if (gameState === "driving" && drivingSoundRef.current) {
      drivingSoundRef.current
        .play()
        .catch((e) => console.log("Sound play error:", e));
    } else if (gameState === "crashed" && crashedSoundRef.current) {
      crashedSoundRef.current
        .play()
        .catch((e) => console.log("Sound play error:", e));
    }
  }, [gameState, soundsLoaded, showCountdown]);

  // Play cashout sound when user manually cashes out
  const playCashoutSound = () => {
    if (cashoutSoundRef.current) {
      cashoutSoundRef.current
        .play()
        .catch((e) => console.log("Sound play error:", e));
    }
  };

  // Control road animation based on game state
  useEffect(() => {
    const roadElement = roadRef.current;
    if (!roadElement) return;

    if (gameState === "driving") {
      roadElement.style.animationPlayState = "running";
    } else {
      roadElement.style.animationPlayState = "paused";
    }
  }, [gameState]);

  // Handle initial state synchronization
  useEffect(() => {
    // Mark component as initialized once data is received
    if (multiplier > 1 && !isInitialized) {
      setIsInitialized(true);
    }
  }, [multiplier, isInitialized]);

  // Update car position based on game state and multiplier
  useEffect(() => {
    let newPosition: string;

    if (gameState === "betting" || showCountdown) {
      newPosition = "1%"; // Starting position
    } else if (gameState === "driving") {
      // Move car based on multiplier progress
      const progressPercentage = Math.min((multiplier - 1) * 10, 40);
      newPosition = `${10 + progressPercentage}%`;
    } else if (gameState === "crashed") {
      newPosition = "50%"; // Centered position when crashed
    } else {
      newPosition = "1%"; // Default position
    }

    // Determine if we should animate the transition
    const shouldAnimate = 
      isInitialized || // Component is initialized
      hasGameStateChanged || // Game state has changed from initial
      gameState !== "driving" || // Not in driving state
      initialGameState !== "driving"; // Didn't start in driving state

    if (shouldAnimate) {
      // Normal transition with animation
      setCarPosition(newPosition);
    } else {
      // Immediate position update without animation (page reload during driving)
      setTimeout(() => setCarPosition(newPosition), 10);
    }
  }, [multiplier, gameState, isInitialized, showCountdown, hasGameStateChanged, initialGameState]);

  return (
    <div
      ref={gameAreaRef}
      className="w-full h-72 rounded-lg relative overflow-hidden mb-4 bg-gradient-to-b from-indigo-900 via-blue-800 to-blue-900 shadow-lg"
    >
      {/* Sound control button */}
      <button
        className="absolute top-4 left-4 z-20 p-2 rounded-full bg-gray-800 bg-opacity-70 text-white"
        onClick={() => {
          // Toggle mute all sounds
          [
            bettingSoundRef,
            drivingSoundRef,
            crashedSoundRef,
            cashoutSoundRef,
            countdownSoundRef,
          ].forEach((ref) => {
            if (ref.current) {
              ref.current.muted = !ref.current.muted;
            }
          });
        }}
      >
        {/* Sound on/off icon */}
        🔊
      </button>

      <div
        className={`relative w-full h-full transition-all ${
          gameState === "driving" ? "animate-mountains-move" : ""
        }`}
      >
        {/* Mountains in distance */}
        <div className="absolute inset-0">
          <img
            src="/bg.svg"
            alt="Mountains"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Multiplier Display */}
      <div className="absolute top-4 right-4 z-10 bg-gray-900 bg-opacity-80 px-6 py-3 rounded-lg shadow-lg border border-gray-700">
        <div
          className={`text-4xl font-mono font-bold ${
            multiplier >= 2 ? "text-yellow-400" : "text-white"
          }`}
        >
          {multiplier.toFixed(2)}x
        </div>
        {gameState === "driving" && hasPlacedBet && (
          <div className="text-sm text-gray-400 text-center mt-1">
            Auto: {autoCashOut}x
          </div>
        )}
      </div>

      {/* Game Status */}
      {gameState === "crashed" && !showCountdown && (
        <div className="absolute top-4 left-16 z-10 bg-red-900 bg-opacity-80 px-4 py-2 rounded-lg animate-pulse flex items-center">
          <Flame className="mr-2 text-red-400" size={18} />
        </div>
      )}

      {showCountdown && (
        <div className="absolute top-4 left-16 z-10 bg-orange-900 bg-opacity-80 px-4 py-2 rounded-lg flex items-center animate-pulse">
          <Clock className="mr-2 text-orange-400" size={18} />
          <span className="text-orange-400 font-bold">Next Round</span>
        </div>
      )}

      {gameState === "driving" && (
        <div className="absolute top-4 left-16 z-10 bg-green-900 bg-opacity-80 px-4 py-2 rounded-lg flex items-center">
          <Gauge className="mr-2 text-green-400" size={18} />
        </div>
      )}

      {gameState === "betting" && !showCountdown && (
        <div className="absolute top-4 left-16 z-10 bg-blue-900 bg-opacity-80 px-4 py-2 rounded-lg flex items-center">
          <TrendingUp className="mr-2 text-blue-400" size={18} />
        </div>
      )}

      {/* Cash Out Button */}
      {gameState === "driving" && hasPlacedBet && (
        <button
          className="absolute bottom-4 right-4 z-20 px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg shadow-lg"
          onClick={() => {
            playCashoutSound();
            // Add your actual cash out logic here
          }}
        >
          CASH OUT
        </button>
      )}

      {/* Countdown Display - Made smaller and more compact */}
      {showCountdown && countdown !== null && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
          <div className="bg-gray-900 bg-opacity-95 px-6 py-4 rounded-xl shadow-2xl border border-orange-500">
            <div className="text-center">
              <div className="text-sm font-semibold text-orange-400 mb-2">
                Next Round
              </div>
              <div 
                className="text-4xl font-mono font-bold text-white animate-pulse"
                key={countdown} // Force re-render for animation
              >
                {countdown}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animated Road */}
      <div className="absolute bottom-0 w-full h-24 bg-gray-800"></div>
      <div
        ref={roadRef}
        className="absolute bottom-12 w-full h-2 flex"
        style={{
          width: "200%",
          left: "0%",
          animation:
            gameState === "driving" ? "roadMove 2s linear infinite" : "none",
        }}
      >
        {/* Repeated road segments */}
        {[...Array(20)].map((_, i) => (
          <React.Fragment key={i}>
            <div className="h-full w-16 bg-white"></div>
            <div className="h-full w-16 bg-transparent"></div>
          </React.Fragment>
        ))}
      </div>

      {/* Dust effect */}
      {gameState === "driving" && (
        <div
          className="absolute bottom-10 left-0 w-24 h-8 opacity-50 animate-dust will-change-transform"
          style={{ left: `calc(${carPosition} - 8%)` }}
        >
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-gray-300 rounded-full"
              style={{
                width: "3px",
                height: "3px",
                left: `${Math.random() * 80}px`,
                top: `${Math.random() * 20}px`,
                animation: `dustFloat ${
                  0.8 + Math.random() * 0.4
                }s linear infinite`,
              }}
            />
          ))}
        </div>
      )}

      {/* Car SVG Positioning */}
      <div
        className="absolute z-10"
        style={{
          left: carPosition,
          bottom: "30px",
          transform: `rotate(${
            gameState === "driving" ? "0deg" : "0deg"
          }) scale(0.6)`,
          transformOrigin: "center center",
          transition: 
            isInitialized || hasGameStateChanged || gameState !== "driving" || initialGameState !== "driving"
              ? "all 0.5s ease-out" 
              : "none",
          filter:
            gameState === "crashed"
              ? "drop-shadow(0 0 8px rgba(255, 0, 0, 0.6))"
              : "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
          willChange: "transform, filter",
        }}
      >
        {gameState === "crashed" ? <CrashedCarSVG /> : <CarSVG />}
      </div>

      {/* Crash Effect */}
      {gameState === "crashed" && !showCountdown && (
        <div className="absolute inset-0 bg-red-600 bg-opacity-25 flex items-center justify-center">
          <div className="bg-black bg-opacity-80 px-8 py-5 rounded-xl shadow-2xl border border-red-500">
            <div className="text-3xl font-bold text-red-400 animate-pulse mb-2">
              CRASHED!
            </div>
            <div className="text-xl font-mono text-center text-white">
              {multiplier.toFixed(2)}x
            </div>
          </div>
          {/* Spark Particles */}
          <div className="absolute w-full h-full">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute bg-yellow-300 rounded-full"
                style={{
                  width: "2px",
                  height: "2px",
                  left: `calc(50% + ${Math.random() * 80 - 40}px)`,
                  top: `calc(50% + ${Math.random() * 80 - 40}px)`,
                  animation: `spark ${0.4 + Math.random() * 0.3}s ease-out`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes roadMove {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
};

export default GameArea;