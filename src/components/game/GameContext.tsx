"use client";
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useGameSocket } from "../game/GameSocket";
import toast from 'react-hot-toast'; // Import toast

// Define types
export type GameState = "betting" | "driving" | "crashed" | "waiting";

export interface GameHistoryItem {
  multiplier: string;
  result: string;
  winnings: number;
}

interface GameContextType {
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  betAmount: number;
  setBetAmount: React.Dispatch<React.SetStateAction<number>>;
  autoCashOut: number;
  setAutoCashOut: React.Dispatch<React.SetStateAction<number>>;
  multiplier: number;
  gameState: GameState;
  history: GameHistoryItem[];
  hasPlacedBet: boolean;
  pendingBet: boolean;
  placeBet: () => void;
  cancelBet: () => void;
  handleCashOut: () => void;
  adjustBetAmount: (amount: number) => void;
  adjustAutoCashOut: (amount: number) => void;
  carPosition: { x: number; y: number };
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGameContext must be used within a GameProvider");
  }
  return context;
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [balance, setBalance] = useState<number>(1000);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [autoCashOut, setAutoCashOut] = useState<number>(2);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [gameState, setGameState] = useState<GameState>("waiting");
  const [history, setHistory] = useState<GameHistoryItem[]>([]);
  const [hasPlacedBet, setHasPlacedBet] = useState<boolean>(false);
  const [pendingBet, setPendingBet] = useState<boolean>(false);
  const [carPosition, setCarPosition] = useState<{ x: number; y: number }>({ x: 50, y: 150 });
  
  const currentBetRef = useRef<number>(0);
  
  // Connect to WebSocket
  const { 
    socketMultiplier, 
    socketGameState, 
    socketHistory, 
    // socketCrashPoint,
    sendMessage 
  } = useGameSocket();
  
  // Update local state when socket data changes
  useEffect(() => {
    if (socketMultiplier !== null) {
      setMultiplier(socketMultiplier);
    }
  }, [socketMultiplier]);
  
  useEffect(() => {
    if (socketGameState !== null) {
      setGameState(socketGameState);
    }
  }, [socketGameState]);
  
  useEffect(() => {
    if (socketHistory !== null) {
      setHistory(socketHistory);
    }
  }, [socketHistory]);
  
  // Calculate car position based on multiplier and game state
  useEffect(() => {
    if (gameState === "driving") {
      const newX = Math.min(50 + (multiplier * 10), 80);
      const newY = 150 + Math.sin(multiplier * 0.5) * 5;
      setCarPosition({ x: newX, y: newY });
    } else if (gameState === "crashed") {
      // Add some random bounce effect on crash
      setCarPosition(prev => ({ 
        x: prev.x, 
        y: prev.y + (Math.random() * 5 - 2.5)
      }));
    }
  }, [multiplier, gameState]);
  
  // Initial fake history for demonstration
  useEffect(() => {
    if (history.length === 0) {
      setHistory([
        { multiplier: "2.15", result: "cash_out", winnings: 21 },
        { multiplier: "1.50", result: "cash_out", winnings: 15 },
        { multiplier: "3.24", result: "crash", winnings: 0 },
        { multiplier: "5.67", result: "cash_out", winnings: 56 },
        { multiplier: "1.89", result: "crash", winnings: 0 },
      ]);
    }
  }, [history.length]);

  // Implement the notification system using toast
  const showNotification = (
    message: string,
    type: "success" | "error" | "info"
  ) => {
    switch (type) {
      case "success":
        toast.success(message, {
          duration: 3000,
          style: {
            background: '#10B981',
            color: '#fff',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#10B981',
          },
        });
        break;
      case "error":
        toast.error(message, {
          duration: 4000,
          style: {
            background: '#EF4444',
            color: '#fff',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#EF4444',
          },
        });
        break;
      case "info":
        toast(message, {
          duration: 2000,
          icon: '📢',
          style: {
            background: '#3B82F6',
            color: '#fff',
          },
        });
        break;
      default:
        toast(message);
    }
  };

  const placeBet = () => {
    if (gameState === "driving" || gameState === "crashed") {
      currentBetRef.current = betAmount;
      setHasPlacedBet(true);
      setPendingBet(true);
      showNotification("Bet queued for next round!", "info");
      return;
    }

    if (balance < betAmount) {
      showNotification("Insufficient balance!", "error");
      return;
    }

    currentBetRef.current = betAmount;
    setBalance(prev => prev - betAmount);
    setHasPlacedBet(true);
    showNotification("Bet placed successfully!", "success");
    
    // Send bet to WebSocket server
    sendMessage({
      type: "place_bet",
      amount: betAmount,
      autoCashOut: autoCashOut
    });
  };

  const cancelBet = () => {
    if (pendingBet) {
      setPendingBet(false);
      setHasPlacedBet(false);
      currentBetRef.current = 0;
      showNotification("Bet cancelled!", "info");
      
      // Notify server about cancelled bet
      sendMessage({
        type: "cancel_bet"
      });
    }
  };

  const handleCashOut = () => {
    if (!hasPlacedBet || gameState === "crashed") return;

    const winnings = Math.floor(betAmount * multiplier);
    setBalance(prev => prev + winnings);
    
    showNotification(
      `Cashed out at ${multiplier.toFixed(2)}x! Won $${winnings}`,
      "success"
    );

    setHasPlacedBet(false);
    setPendingBet(false);
    currentBetRef.current = 0;
    
    // Notify server about cash out
    sendMessage({
      type: "cash_out",
      multiplier: multiplier
    });
  };

  const adjustBetAmount = (amount: number) => {
    setBetAmount(prev => Math.max(1, prev + amount));
  };

  const adjustAutoCashOut = (amount: number) => {
    setAutoCashOut(prev => Math.max(1.1, Number((prev + amount).toFixed(2))));
  };

  // Handle pending bets when game state changes
  useEffect(() => {
    if (gameState === "betting" && pendingBet && hasPlacedBet) {
      const betToPlace = currentBetRef.current || betAmount;
      if (balance >= betToPlace) {
        setBalance(prev => prev - betToPlace);
        setPendingBet(false);
        showNotification("Bet placed for new round!", "success");
        
        // Notify server about the bet
        sendMessage({
          type: "place_bet",
          amount: betToPlace,
          autoCashOut: autoCashOut
        });
      } else {
        setPendingBet(false);
        setHasPlacedBet(false);
        showNotification("Insufficient balance for pending bet!", "error");
      }
    }
  }, [gameState, pendingBet, hasPlacedBet, balance, betAmount, autoCashOut]);

  // Auto cash out logic
  useEffect(() => {
    if (gameState === "driving" && hasPlacedBet && multiplier >= autoCashOut) {
      handleCashOut();
    }
  }, [gameState, hasPlacedBet, multiplier, autoCashOut]);

  return (
    <GameContext.Provider
      value={{
        balance,
        setBalance,
        betAmount,
        setBetAmount,
        autoCashOut,
        setAutoCashOut,
        multiplier,
        gameState,
        history,
        hasPlacedBet,
        pendingBet,
        placeBet,
        cancelBet,
        handleCashOut,
        adjustBetAmount,
        adjustAutoCashOut,
        carPosition
      }}
    >
      {children}
    </GameContext.Provider>
  );
};