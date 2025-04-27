"use client";
import React from "react";
import { ChevronUp, ChevronDown, CheckCircle, X } from "lucide-react";
import { useGameContext } from "./GameContext";

const BettingControls: React.FC = () => {
  const {
    betAmount,
    autoCashOut,
    gameState,
    hasPlacedBet,
    pendingBet,
    placeBet,
    cancelBet,
    handleCashOut,
    adjustBetAmount,
    adjustAutoCashOut,
  } = useGameContext();

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-medium mb-4">Place Your Bet</h3>
      
      {/* Bet Amount Control */}
      <div className="mb-4">
        <label className="block text-gray-400 text-sm mb-2">Bet Amount</label>
        <div className="flex items-center">
          <button
            onClick={() => adjustBetAmount(-5)}
            title="Decrease bet amount"
            className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-l-lg"
          >
            <ChevronDown size={18} />
          </button>
          <input
            type="number"
            value={betAmount}
            onChange={(e) => adjustBetAmount(Number(e.target.value) - betAmount)}
            className="bg-gray-700 text-center text-white p-2 w-full"
            title="Enter your bet amount"
            placeholder="Enter amount"
          />
          <button
            onClick={() => adjustBetAmount(5)}
            title="Increase bet amount"
            className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-r-lg"
          >
            <ChevronUp size={18} />
          </button>
        </div>
      </div>
      
      {/* Auto Cash Out Control */}
      <div className="mb-6">
        <label className="block text-gray-400 text-sm mb-2">Auto Cash Out (x)</label>
        <div className="flex items-center">
          <button
            onClick={() => adjustAutoCashOut(-0.1)}
            title="Decrease auto cash out"
            className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-l-lg"
          >
            <ChevronDown size={18} />
          </button>
          <input
            type="number"
            step="0.1"
            value={autoCashOut}
            onChange={(e) => adjustAutoCashOut(Number(e.target.value) - autoCashOut)}
            className="bg-gray-700 text-center text-white p-2 w-full"
            title="Enter auto cash out multiplier"
            placeholder="Enter multiplier"
          />
          <button
            onClick={() => adjustAutoCashOut(0.1)}
               title=" auto cash out"
            className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-r-lg"
          >
            <ChevronUp size={18} />
          </button>
        </div>
      </div>
      
 
{/* Action Buttons */}
<div className="flex gap-2">
        {!hasPlacedBet ? (
          <button
            onClick={placeBet}
            disabled={gameState === "crashed"}
            title="Place your bet"
            className={`flex-1 py-3 px-4 rounded-lg font-medium flex items-center justify-center ${
              gameState === "crashed"
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-500"
            }`}
          >
            <CheckCircle className="mr-2" size={18} />
            Place Bet
          </button>
        ) : gameState === "driving" ? (
          <button
            onClick={handleCashOut}
            title="Cash out your bet now"
            className="flex-1 py-3 px-4 rounded-lg font-medium bg-yellow-600 hover:bg-yellow-500 flex items-center justify-center"
          >
            Cash Out Now
          </button>
        ) : pendingBet ? (
          <button
            onClick={cancelBet}
            className="flex-1 py-3 px-4 rounded-lg font-medium bg-red-600 hover:bg-red-500 flex items-center justify-center"
          >
            <X className="mr-2" size={18} />
            Cancel Bet
          </button>
        ) : (
          <button
            disabled={true}
            className="flex-1 py-3 px-4 rounded-lg font-medium bg-gray-600 cursor-not-allowed flex items-center justify-center"
          >
            Bet Placed
          </button>
        )}
      </div>
      
      {/* Betting Presets */}
      <div className="mt-4">
        <label className="block text-gray-400 text-sm mb-2">Quick Bet</label>
        <div className="grid grid-cols-4 gap-2">
          {[5, 10, 25, 50].map((amount) => (
            <button
              key={amount}
              onClick={() => adjustBetAmount(amount - betAmount)}
              className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded"
            >
              ${amount}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BettingControls