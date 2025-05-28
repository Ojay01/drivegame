"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
// import { useGameEngine } from "../game/engine";
import toast from "react-hot-toast"; // Import toast
import { GameContextType, GameHistoryItem, GameState, WalletType } from "@/lib/types/bet";
import { useGameSocket } from "./GameSocket";
import { getBalance } from "./apiActions";
import { useSearchParams } from "next/navigation";

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGameContext must be used within a GameProvider");
  }
  return context;
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [betAmount, setBetAmount] = useState<number>(10);
  const [gameId, setGameId] = useState<number>(0);
  const [autoCashOut, setAutoCashOut] = useState<number>(2);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [gameState, setGameState] = useState<GameState>("waiting");
  const [history, setHistory] = useState<GameHistoryItem[]>([]);
  const [hasPlacedBet, setHasPlacedBet] = useState<boolean>(false);
  const [pendingBet, setPendingBet] = useState<boolean>(false);
  const [carPosition, setCarPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 150,
  });
  const [walletType, setWalletType] = useState<
    "balance" | "bonus" | "with_balance"
  >("balance");
  const [wallets, setWallets] = useState<{
    balance: number;
    bonus: number;
    with_balance: number;
  }>({
    balance: 0,
    bonus: 0,
    with_balance: 0,
  });

  // Replace old balance state
  const walletBalance = wallets[walletType];
  const currentBetRef = useRef<number>(0);
  const [authToken, setAuthToken] = useState<string | null>(null);


  useEffect(() => {
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("authToken");
    setAuthToken(token);
  }
}, []);


  useEffect(() => {
    if (authToken) {
      getBalance(authToken)
        .then((res) => {
          setWallets({
            balance: res.balance ?? 0,
            bonus: res.bonus ?? 0,
            with_balance: res.with_balance ?? 0,
          });
        })
        .catch(() => {
          // fallback values
          setWallets({ balance: 1000, bonus: 0, with_balance: 0 });
        });
    }
    setWallets({ balance: 1000, bonus: 750, with_balance: 500 });
  }, [authToken]);

  // Connect to WebSocket
  const {
    socketMultiplier,
    socketGameState,
    socketHistory,
    // socketCrashPoint,
    sendMessage,
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
      const newX = Math.min(50 + multiplier * 10, 80);
      const newY = 150 + Math.sin(multiplier * 0.5) * 5;
      setCarPosition({ x: newX, y: newY });
    } else if (gameState === "crashed") {
      // Add some random bounce effect on crash
      setCarPosition((prev) => ({
        x: prev.x,
        y: prev.y + (Math.random() * 5 - 2.5),
      }));
    }
  }, [multiplier, gameState]);

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
            background: "#10B981",
            color: "#fff",
          },
          iconTheme: {
            primary: "#fff",
            secondary: "#10B981",
          },
        });
        break;
      case "error":
        toast.error(message, {
          duration: 4000,
          style: {
            background: "#EF4444",
            color: "#fff",
          },
          iconTheme: {
            primary: "#fff",
            secondary: "#EF4444",
          },
        });
        break;
      case "info":
        toast(message, {
          duration: 2000,
          icon: "📢",
          style: {
            background: "#3B82F6",
            color: "#fff",
          },
        });
        break;
      default:
        toast(message);
    }
  };

  const cancelBet = () => {
    if (pendingBet) {
      setPendingBet(false);
      setHasPlacedBet(false);
      currentBetRef.current = 0;
      showNotification("Bet cancelled!", "info");

      // Notify server about cancelled bet
      sendMessage({
        type: "cancel_bet",
      });
    }
  };

  const handleCashOut = () => {
    if (!hasPlacedBet || gameState === "crashed") return;

    const winnings = Math.floor(betAmount * multiplier);
    setBalance((prev) => prev + winnings);

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
      multiplier: multiplier,
    });
  };

  const adjustBetAmount = (amount: number) => {
    setBetAmount((prev) => Math.max(1, prev + amount));
  };

  const adjustAutoCashOut = (amount: number) => {
    setAutoCashOut((prev) => Math.max(1.1, Number((prev + amount).toFixed(2))));
  };

  const setBalance = (val: number | ((prev: number) => number), type?: WalletType) => {
  setWallets(prev => {
    const key = type ?? walletType; // use provided type or fallback to current walletType
    const updated = typeof val === 'function' ? val(prev[key]) : val;
    return { ...prev, [key]: updated };
  });
  };

  // Handle pending bets when game state changes
  useEffect(() => {
    if (gameState === "betting" && pendingBet && hasPlacedBet) {
      const betToPlace = currentBetRef.current || betAmount;
      if (walletBalance >= betToPlace) {
        setBalance((prev) => prev - betToPlace);
        setPendingBet(false);
        showNotification("Bet placed for new round!", "success");

        // Notify server about the bet
        sendMessage({
          type: "place_bet",
          amount: betToPlace,
          autoCashOut: autoCashOut,
        });
      } else {
        setPendingBet(false);
        setHasPlacedBet(false);
        showNotification("Insufficient balance for pending bet!", "error");
      }
    }
  }, [
    gameState,
    pendingBet,
    hasPlacedBet,
    walletBalance,
    betAmount,
    autoCashOut,
  ]);

  // Auto cash out logic
  useEffect(() => {
    if (gameState === "driving" && hasPlacedBet && multiplier >= autoCashOut) {
      handleCashOut();
    }
  }, [gameState, hasPlacedBet, multiplier, autoCashOut]);

  return (
    <GameContext.Provider
      value={{
        balance: walletBalance,
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
        gameId,
        setGameId,
        walletType,
        setWalletType,
        cancelBet,
        handleCashOut,
        adjustBetAmount,
        adjustAutoCashOut,
        carPosition,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
