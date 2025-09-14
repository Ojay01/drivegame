"use client";

import { Toaster } from "react-hot-toast";
import { Wallet } from "lucide-react";
import { GameProvider, useGameContext } from "./GameContext";
import GameArea from "./GameArea";
import BettingControls from "./BettingControls";
import MultiplierHistory from "./MultiplierHistory";
import GameHistory from "./GameHistory";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useRef } from "react";
import GameLoader from "./GameLoader";

// Inner component that uses the game context
const GameContent: React.FC = () => {
  const { balance, gameState, settings } = useGameContext();
  const searchParams = useSearchParams();
  const authToken = searchParams.get("authToken");
  const [clearSession, setClearSession] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastStateRef = useRef<string | null>(null);

  // Check every 500ms for gameState === "crashed"
  useEffect(() => {
    const interval = setInterval(() => {
      if (
        gameState === "crashed" &&
        !clearSession &&
        lastStateRef.current !== "crashed"
      ) {
        // Prevent duplicate timeouts
        if (!timeoutRef.current) {
          timeoutRef.current = setTimeout(() => {
            setClearSession(true);
            timeoutRef.current = null;
          }, 3000);
        }
      }

      lastStateRef.current = gameState;

      // If session was cleared, reset for future cycles
      if (clearSession && gameState !== "crashed") {
        setClearSession(false);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [gameState, clearSession]);

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#333",
            color: "#fff",
          },
        }}
      />

      {/* Header */}
      <header className="bg-gray-800 py-4 px-6">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <img
              src="/images/logo.png"
              alt="1xDrives Logo"
              className="h-12 w-auto"
            />
          </div>

          <div className="flex items-center bg-gray-900 py-2 px-4 rounded-lg">
            <Wallet className="mr-2 text-green-400" size={18} />
            <span className="font-medium">
              ₣
              {new Intl.NumberFormat("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(balance ?? 0)}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Game and Controls */}
          <div className="lg:col-span-3 space-y-6">
            <div className="mb-2">
              <MultiplierHistory /> 
            </div>
            <GameArea />
             <BettingControls authToken={authToken} settings={settings ?? null} />
          </div>

          {/* History Sidebar */}
          <div className="lg:col-span-1">
            <GameHistory authToken={authToken} clearSession={clearSession} />
          </div>
        </div>
      </main>
    </div>
  );
};

const CarMultiplierGame: React.FC = () => {
  const [ready, setReady] = useState(false);

  // Force 5-second minimum loading delay
  useEffect(() => {
    const timeout = setTimeout(() => setReady(true), 5000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <GameProvider>{ready ? <GameContent /> : <GameLoader />}</GameProvider>
  );
};

export default CarMultiplierGame;
