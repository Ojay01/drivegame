"use client";
import React, { useRef, useEffect } from "react";
import { Gauge, Flame, TrendingUp } from "lucide-react";
import CarSVG from "@/components/car";
import { useGameContext } from "./GameContext";

const GameArea: React.FC = () => {
  const {
    multiplier,
    gameState,
    autoCashOut,
    hasPlacedBet,
    carPosition
  } = useGameContext();
  
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const roadRef = useRef<HTMLDivElement>(null);
  
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

  return (
    <div 
      ref={gameAreaRef}
      className="w-full h-72 rounded-lg relative overflow-hidden mb-4 bg-gradient-to-b from-indigo-900 via-blue-800 to-blue-900 shadow-lg"
    >
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
        <div className="absolute top-4 left-4 z-10 bg-red-900 bg-opacity-80 px-4 py-2 rounded-lg animate-pulse flex items-center">
          <Flame className="mr-2 text-red-400" size={18} />
          <span className="font-bold text-red-100">CRASHED</span>
        </div>
      )}
      
      {gameState === "driving" && (
        <div className="absolute top-4 left-4 z-10 bg-green-900 bg-opacity-80 px-4 py-2 rounded-lg flex items-center">
          <Gauge className="mr-2 text-green-400" size={18} />
          <span className="font-bold text-green-100">RUNNING</span>
        </div>
      )}
      
      {gameState === "betting" && (
        <div className="absolute top-4 left-4 z-10 bg-blue-900 bg-opacity-80 px-4 py-2 rounded-lg flex items-center">
          <TrendingUp className="mr-2 text-blue-400" size={18} />
          <span className="font-bold text-blue-100">READY</span>
        </div>
      )}
      
      {/* Animated Road */}
      <div className="absolute bottom-0 w-full h-24 bg-gray-800"></div>
      <div 
        ref={roadRef}
        className={`absolute bottom-12 w-full h-2 flex ${
          gameState === "driving" ? "animate-road-move" : ""
        }`}
        style={{
          width: "200%", // Extended width for smooth animation loop
          left: "0%"
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
      
      {/* Car SVG Positioning */}
      <div 
        className={`absolute transition-all duration-100 ${
          gameState === "crashed" ? "animate-bounce" : ""
        }`} 
        style={{ 
          left: `${carPosition.x}%`, 
          bottom: '30px',
          transform: `rotate(${gameState === "driving" ? '5deg' : '0deg'}) scale(1.2)`
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
    </div>
  );
};

export default GameArea;
