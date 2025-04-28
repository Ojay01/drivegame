"use client";
import { GameHistoryItem, GameState } from "@/lib/types/bet";
import { useState, useEffect, useCallback } from "react";

export const useGameEngine = () => {
  const [multiplier, setMultiplier] = useState<number>(1);
  const [gameState, setGameState] = useState<GameState>("betting");
  const [history, setHistory] = useState<GameHistoryItem[]>([]);
  const [crashPoint, setCrashPoint] = useState<number | null>(null);
  
  // Simulate game cycle
  const startGameCycle = useCallback(() => {
    // Betting phase (3 seconds)
    setGameState("betting");
    setMultiplier(1);
    setCrashPoint(null);
    
    const bettingTimeout = setTimeout(() => {
      // Driving phase
      const newCrashPoint = 1 + Math.random() * 35; // Random crash point between 1 and 35
      setGameState("driving");
      setCrashPoint(newCrashPoint);
      
      let currentMultiplier = 1;
      const startTime = Date.now();
      
      // Start increasing multiplier
      const multiplierInterval = setInterval(() => {
        const elapsedSeconds = (Date.now() - startTime) / 1000;
        const increment = currentMultiplier < 5 ? 0.02 : 
                         currentMultiplier < 10 ? 0.03 : 0.05;
        
        currentMultiplier += increment;
        currentMultiplier = Number(currentMultiplier.toFixed(2));
        setMultiplier(currentMultiplier);
        
        // Check if crashed
        if (currentMultiplier >= newCrashPoint) {
          clearInterval(multiplierInterval);
          setGameState("crashed");
          
          // Update history
          setHistory(prevHistory => {
            const newHistory = [{
              multiplier: currentMultiplier.toFixed(2),
              result: 'crash',
              winnings: 0
            }, ...prevHistory];
            
            return newHistory.slice(0, 10); // Keep only 10 latest records
          });
          
          // Start a new round after delay
          setTimeout(startGameCycle, 3000);
        }
      }, 50);
    }, 3000);
    
    return () => {
      clearTimeout(bettingTimeout);
    };
  }, []);
  
  // Place bet function
  const placeBet = useCallback((betData: any) => {
    console.log('Bet placed:', betData);
    // Add your bet handling logic here
  }, []);
  
  // Cash out function
  const cashOut = useCallback((cashOutData: any) => {
    console.log('Cash out:', cashOutData);
    // Add your cash out handling logic here
  }, []);
  
  // Initialize game on component mount
  useEffect(() => {
    startGameCycle();
    
    return () => {
      // Cleanup if needed
    };
  }, [startGameCycle]);
  
  return {
    connected: true, // Always "connected" since it's client-side
    socketMultiplier: multiplier,
    socketGameState: gameState,
    socketHistory: history,
    socketCrashPoint: crashPoint,
    sendMessage: (message: any) => {
      // For compatibility with existing code
      switch (message.type) {
        case 'place_bet':
          placeBet(message);
          break;
        case 'cash_out':
          cashOut(message);
          break;
        default:
          console.log('Received message:', message);
      }
      return true;
    }
  };
};