"use client";
import React, { useState } from "react";
import { Toaster } from "react-hot-toast";
import { Wallet } from "lucide-react";
import { GameProvider, useGameContext } from "./GameContext";
import GameArea from "./GameArea";
import BettingControls from "./BettingControls";
import MultiplierHistory from "./MultiplierHistory";

// Inner component that uses the game context
const GameContent: React.FC = () => {
  const { walletType, setWalletType } = useGameContext();
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
          {/* <Menu className="mr-3" size={24} /> */}
          <h1 className="text-xl font-bold">1xDrives</h1>
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
            <div className="mb-2 ">
              <MultiplierHistory />
              <div className="flex items-center space-x-3 py-3">
                <label
                  htmlFor="wallet-type-select"
                  className="text-sm text-gray-400 whitespace-nowrap"
                >
                  Wallet:
                </label>
                <select
                  id="wallet-type-select"
                  value={walletType}
                  onChange={(e) => setWalletType(e.target.value as any)}
                  className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer w-full"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23A0AEC0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 0.5rem center",
                    backgroundSize: "1em",
                    paddingRight: "2rem",
                  }}
                >
                  <option value="deposit">Deposit Wallet</option>
                  <option value="commission">Commission Wallet</option>
                  <option value="withdrawable">Withdrawable Wallet</option>
                </select>
              </div>
            </div>
            <GameArea />
            <BettingControls />
          </div>

          {/* History Sidebar */}
          <div className="lg:col-span-1">{/* <GameHistory /> */}</div>
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
