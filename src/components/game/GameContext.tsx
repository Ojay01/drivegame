"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import toast from "react-hot-toast";
import {
  GameContextType,
  GameHistoryItem,
  GameState,
  WalletType,
} from "@/lib/types/bet";
import { useGameSocket } from "./GameSocket";
import { getBalance } from "./apiActions";
import { useDrivesSettings } from "@/lib/hooks/useSettings";

// const GameContext = createContext<GameContextType & { settings?: any } | undefined>(undefined);
const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGameContext must be used within a GameProvider");
  return context;
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const settings = useDrivesSettings(); // Load settings here

  const [betAmount, setBetAmount] = useState<number>(10);
  const [gameId, setGameId] = useState<number>(0);
  const [autoCashOut, setAutoCashOut] = useState<number>(2);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [gameState, setGameState] = useState<GameState>("waiting");
  const [history, setHistory] = useState<GameHistoryItem[]>([]);
  const [hasPlacedBet, setHasPlacedBet] = useState<boolean>(false);
  const [pendingBet, setPendingBet] = useState<boolean>(false);
  const [carPosition, setCarPosition] = useState<{ x: number; y: number }>({ x: 0, y: 150 });
  const [walletType, setWalletType] = useState<WalletType>("balance");
  const [wallets, setWallets] = useState({
    balance: 2500,
    bonus: 2000,
    with_balance: 1000,
    commissions: 500,
  });

  const walletBalance = wallets[walletType];
  const currentBetRef = useRef<number>(0);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Fetch authToken from URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      setAuthToken(urlParams.get("authToken"));
    }
  }, []);

  // Fetch wallet balances
  useEffect(() => {
    if (!authToken) return;

    getBalance(authToken)
      .then((res) => {
        setWallets({
          balance: res.balance ?? 0,
          bonus: res.bonus ?? 0,
          with_balance: res.with_balance ?? 0,
          commissions: res.commissions ?? 0,
        });
      })
      .catch(() => {
        setWallets({ balance: 1000, bonus: 0, with_balance: 0, commissions: 0 });
      });
  }, [authToken]);

  // Connect to WebSocket
  const { socketMultiplier, socketGameState, socketHistory, connected, sendMessage } = useGameSocket();

  useEffect(() => { if (connected && socketMultiplier !== null) setMultiplier(socketMultiplier); }, [socketMultiplier, connected]);
  useEffect(() => { if (connected && socketGameState !== null) setGameState(socketGameState); }, [socketGameState, connected]);
  useEffect(() => { if (connected && socketHistory !== null) setHistory(socketHistory); }, [socketHistory, connected]);

  // Car position calculation
  useEffect(() => {
    if (gameState === "driving") {
      const newX = Math.min(50 + multiplier * 10, 80);
      const newY = 150 + Math.sin(multiplier * 0.5) * 5;
      setCarPosition({ x: newX, y: newY });
    } else if (gameState === "crashed") {
      setCarPosition(prev => ({ x: prev.x, y: prev.y + (Math.random() * 5 - 2.5) }));
    }
  }, [multiplier, gameState]);

  const showNotification = (message: string, type: "success" | "error" | "info") => {
    switch (type) {
      case "success":
        toast.success(message, { duration: 3000, style: { background: "#10B981", color: "#fff" }, iconTheme: { primary: "#fff", secondary: "#10B981" } });
        break;
      case "error":
        toast.error(message, { duration: 4000, style: { background: "#EF4444", color: "#fff" }, iconTheme: { primary: "#fff", secondary: "#EF4444" } });
        break;
      case "info":
        toast(message, { duration: 2000, icon: "📢", style: { background: "#3B82F6", color: "#fff" } });
        break;
    }
  };

  const cancelBet = () => {
    if (pendingBet) {
      setPendingBet(false);
      setHasPlacedBet(false);
      currentBetRef.current = 0;
      showNotification("Bet cancelled!", "info");
      sendMessage({ type: "cancel_bet" });
    }
  };

  const handleCashOut = () => {
    if (!hasPlacedBet || gameState === "crashed") return;

    const winnings = Math.floor(betAmount * multiplier);
    setBalance(prev => prev + winnings);

    showNotification(`Cashed out at ${multiplier.toFixed(2)}x! Won $${winnings}`, "success");

    setHasPlacedBet(false);
    setPendingBet(false);
    currentBetRef.current = 0;

    sendMessage({ type: "cash_out", multiplier });
  };

  const adjustBetAmount = (amount: number) => setBetAmount(prev => Math.max(1, prev + amount));
  const adjustAutoCashOut = (amount: number) => setAutoCashOut(prev => Math.max(1.1, Number((prev + amount).toFixed(2))));

  const setBalance = (val: number | ((prev: number) => number), type?: WalletType) => {
    setWallets(prev => {
      const key = type ?? walletType;
      const updated = typeof val === "function" ? val(prev[key]) : val;
      return { ...prev, [key]: updated };
    });
  };

  // Pending bets
  useEffect(() => {
    if (gameState === "betting" && pendingBet && hasPlacedBet) {
      const betToPlace = currentBetRef.current || betAmount;
      if (walletBalance >= betToPlace) {
        setBalance(prev => prev - betToPlace);
        setPendingBet(false);
        showNotification("Bet placed for new round!", "success");
        sendMessage({ type: "place_bet", amount: betToPlace, autoCashOut });
      } else {
        setPendingBet(false);
        setHasPlacedBet(false);
        showNotification("Insufficient balance for pending bet!", "error");
      }
    }
  }, [gameState, pendingBet, hasPlacedBet, walletBalance, betAmount, autoCashOut]);

  // Auto cash out
  useEffect(() => {
    if (gameState === "driving" && hasPlacedBet && multiplier >= autoCashOut) handleCashOut();
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
        settings, // ✅ include settings here
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
