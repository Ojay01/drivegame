"use client";
import React, { useRef, useEffect, useState } from "react";
import { Gauge, Flame, TrendingUp } from "lucide-react";
import CarSVG from "@/components/car";
import { useGameContext } from "./GameContext";

// Sound URLs - replace these with your actual sound URLs
const SOUND_URLS = {
  betting: "https://cdn.freesound.org/previews/555/555389_5674468-lq.mp3", // UI ready sound
  driving: "/sounds/driving.mp3", // Engine revving sound
  crashed: "/sounds/crash.wav", // Crash sound
  cashout: "https://cdn.freesound.org/previews/511/511484_4931062-lq.mp3" // Cash register sound
};

const GameArea: React.FC = () => {
  const {
    multiplier,
    gameState,
    autoCashOut,
    hasPlacedBet,
  } = useGameContext();


  
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const roadRef = useRef<HTMLDivElement>(null);
  const [carPosition, setCarPosition] = useState<string>("1%");
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Sound refs
  const bettingSoundRef = useRef<HTMLAudioElement | null>(null);
  const drivingSoundRef = useRef<HTMLAudioElement | null>(null);
  const crashedSoundRef = useRef<HTMLAudioElement | null>(null);
  const cashoutSoundRef = useRef<HTMLAudioElement | null>(null);
  const [soundsLoaded, setSoundsLoaded] = useState(false);
  
  // Initialize sound objects
  useEffect(() => {
    // Create audio elements
    bettingSoundRef.current = new Audio(SOUND_URLS.betting);
    drivingSoundRef.current = new Audio(SOUND_URLS.driving);
    crashedSoundRef.current = new Audio(SOUND_URLS.crashed);
    cashoutSoundRef.current = new Audio(SOUND_URLS.cashout);
    
    // Configure sounds
    if (drivingSoundRef.current) {
      drivingSoundRef.current.loop = true;
    }
    
    // Mark sounds as loaded
    setSoundsLoaded(true);
    
    // Cleanup function
    return () => {
      [bettingSoundRef, drivingSoundRef, crashedSoundRef, cashoutSoundRef].forEach(ref => {
        if (ref.current) {
          ref.current.pause();
          ref.current.currentTime = 0;
        }
      });
    };
  }, []);
  
  // Play sounds based on game state changes
  useEffect(() => {
    if (!soundsLoaded) return;
    
    // Stop all sounds first
    [bettingSoundRef, drivingSoundRef, crashedSoundRef].forEach(ref => {
      if (ref.current) {
        ref.current.pause();
        ref.current.currentTime = 0;
      }
    });
    
    // Play the appropriate sound based on game state
    if (gameState === "betting" && bettingSoundRef.current) {
      bettingSoundRef.current.play().catch(e => console.log("Sound play error:", e));
    } else if (gameState === "driving" && drivingSoundRef.current) {
      drivingSoundRef.current.play().catch(e => console.log("Sound play error:", e));
    } else if (gameState === "crashed" && crashedSoundRef.current) {
      crashedSoundRef.current.play().catch(e => console.log("Sound play error:", e));
    }
  }, [gameState, soundsLoaded]);
  
  // Play cashout sound when user manually cashes out
  const playCashoutSound = () => {
    if (cashoutSoundRef.current) {
      cashoutSoundRef.current.play().catch(e => console.log("Sound play error:", e));
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
  // This is the key fix - we now update car position in a separate effect
  useEffect(() => {
    let newPosition: string;
    
    if (gameState === "betting") {
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
    
    // Only animate if initialized or not in driving state
    const shouldAnimate = isInitialized || gameState !== "driving";
    
    if (shouldAnimate) {
      // Normal transition
      setCarPosition(newPosition);
    } else {
      // Immediate position update without animation on page load during driving state
      // Use a short timeout to ensure the DOM has updated
      setTimeout(() => setCarPosition(newPosition), 10);
    }
  }, [multiplier, gameState, isInitialized]);

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
          [bettingSoundRef, drivingSoundRef, crashedSoundRef, cashoutSoundRef].forEach(ref => {
            if (ref.current) {
              ref.current.muted = !ref.current.muted;
            }
          });
        }}
      >
        {/* Sound on/off icon - you can replace with an actual icon */}
        🔊
      </button>

      {/* Sky with moving clouds when driving */}
      <div className="absolute inset-0 z-0">
        <div className={`absolute inset-0 bg-gradient-to-b from-indigo-900 via-blue-800 to-blue-900`} />
        
        {/* Clouds that move faster during driving state */}
        <div className={`absolute top-5 left-0 w-full flex justify-between transition-all duration-300 ${
          gameState === "driving" ? "animate-cloud-move" : ""
        }`}>
          <div className="w-24 h-12 bg-white bg-opacity-30 rounded-full filter blur-md"></div>
          <div className="w-32 h-16 bg-white bg-opacity-20 rounded-full filter blur-md"></div>
          <div className="w-20 h-10 bg-white bg-opacity-30 rounded-full filter blur-md"></div>
        </div>
        
        <div className={`absolute top-20 left-0 w-full flex justify-around transition-all duration-300 ${
          gameState === "driving" ? "animate-cloud-move-slow" : ""
        }`}>
          <div className="w-28 h-14 bg-white bg-opacity-20 rounded-full filter blur-md"></div>
          <div className="w-20 h-10 bg-white bg-opacity-10 rounded-full filter blur-md"></div>
          <div className="w-36 h-12 bg-white bg-opacity-20 rounded-full filter blur-md"></div>
        </div>
      </div>
      
      {/* Parallax background elements */}
      <div className={`absolute left-0 bottom-24 w-full h-20 transition-all ${
        gameState === "driving" ? "animate-mountains-move" : ""
      }`}>
        {/* Mountains in distance */}
        <div className="absolute bottom-0 left-0 w-full">
          <svg width="100%" height="40" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path
              d="M0,0 L0,120 L1200,120 L1200,0 L0,0 Z M0,120 L200,70 L400,100 L600,30 L800,90 L1000,60 L1200,120 L0,120 Z"
              fill="#0f1729"
              opacity="0.7"
            ></path>
          </svg>
        </div>
      </div>
      
      {/* Buildings in middle distance */}
      <div className={`absolute left-0 bottom-24 w-full h-24 transition-all ${
        gameState === "driving" ? "animate-buildings-move" : ""
      }`}>
        {/* City skyline */}
        <div className="absolute bottom-0 left-0 w-full flex space-x-2">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i}
              className="bg-gray-900" 
              style={{
                width: `${20 + Math.random() * 50}px`,
                height: `${30 + Math.random() * 60}px`,
                opacity: 0.8
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Multiplier Display */}
      <div className="absolute top-4 right-4 z-10 bg-gray-900 bg-opacity-80 px-6 py-3 rounded-lg shadow-lg border border-gray-700">
        <div className={`text-4xl font-mono font-bold ${
          multiplier >= 2 ? 'text-yellow-400' :
          'text-white'
        }`}>
          {multiplier.toFixed(2)}x
        </div>
        {gameState === "driving" && hasPlacedBet && (
          <div className="text-sm text-gray-400 text-center mt-1">
            Auto: {autoCashOut}x
          </div>
        )}
      </div>
      
      {/* Game Status */}
      {gameState === "crashed" && (
        <div className="absolute top-4 left-16 z-10 bg-red-900 bg-opacity-80 px-4 py-2 rounded-lg animate-pulse flex items-center">
          <Flame className="mr-2 text-red-400" size={18} />
        </div>
      )}
      
      {gameState === "driving" && (
        <div className="absolute top-4 left-16 z-10 bg-green-900 bg-opacity-80 px-4 py-2 rounded-lg flex items-center">
          <Gauge className="mr-2 text-green-400" size={18} />
        </div>
      )}
      
      {gameState === "betting" && (
        <div className="absolute top-4 left-16 z-10 bg-blue-900 bg-opacity-80 px-4 py-2 rounded-lg flex items-center">
          <TrendingUp className="mr-2 text-blue-400" size={18} />
        </div>
      )}
      
      {/* Cash Out Button - trigger cash sound */}
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
      
      {/* Animated Road */}
      <div className="absolute bottom-0 w-full h-24 bg-gray-800"></div>
      <div 
        ref={roadRef}
        className="absolute bottom-12 w-full h-2 flex"
        style={{
          width: "200%", // Extended width for smooth animation loop
          left: "0%",
          animation: gameState === "driving" ? "roadMove 2s linear infinite" : "none"
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
      
      {/* Car SVG Positioning - Modified to handle WebSocket state */}
      <div 
        className={`absolute ${gameState === "crashed" ? "animate-bounce" : ""}`} 
        style={{ 
          left: carPosition, // Using state variable instead of function call
          bottom: '30px',
          transform: `rotate(${gameState === "driving" ? '5deg' : '0deg'}) scale(1.2)`,
          transformOrigin: "center center",
          // Conditional transition based on initialization state
          transition: isInitialized ? "all 0.5s ease-out" : "none"
        }}
      >
        <CarSVG 
          animationType={"rotate"} 
          animationDuration={15} 
          width="170"
          animate 
        />
        
        {/* Flames effect when driving */}
        {gameState === "driving" && (
          <div className="absolute -right-6 top-1/2 transform -translate-y-1/2">
            <div className="w-8 h-4 bg-gradient-to-r from-red-500 via-orange-400 to-transparent rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
      
      {/* Crash Effect */}
      {gameState === "crashed" && (
        <div className="absolute inset-0 bg-red-500 bg-opacity-30 flex items-center justify-center">
          <div className="bg-black bg-opacity-70 px-8 py-4 rounded-lg shadow-lg">
            <div className="text-3xl font-bold text-red-500 animate-pulse mb-1">
              CRASHED
            </div>
            <div className="text-xl font-mono text-center text-white">
              {multiplier.toFixed(2)}x
            </div>
          </div>
        </div>
      )}
      
      {/* Add this to your global CSS file or styles */}
      <style jsx>{`
        @keyframes roadMove {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

export default GameArea;