"use client";
import React from "react";
import { Toaster, toast } from "react-hot-toast";
import { Wallet, Menu } from "lucide-react";
import { GameProvider, useGameContext } from "./GameContext";
import GameArea from "./GameArea";
import BettingControls from "./BettingControls";
import GameHistory from "./GameHistory";

// Inner component that uses the game context
const GameContent: React.FC = () => {
  const { balance } = useGameContext();

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
      <header className="bg-gray-800 py-4 px-6 flex justify-between items-center">
        <div className="flex items-center">
          <Menu className="mr-3" size={24} />
          <h1 className="text-xl font-bold">Car Multiplier</h1>
        </div>
        <div className="flex items-center bg-gray-900 py-2 px-4 rounded-lg">
          <Wallet className="mr-2 text-green-400" size={18} />
          <span className="font-medium">${balance.toFixed(2)}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Game and Controls */}
          <div className="lg:col-span-3 space-y-6">
            <GameArea />
            <BettingControls />
          </div>

          {/* History Sidebar */}
          <div className="lg:col-span-1">
            <GameHistory />
          </div>
        </div>
      </main>
    </div>
  );
};

const CarMultiplierGame: React.FC = () => {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
};

export default CarMultiplierGame;
