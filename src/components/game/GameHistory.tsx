"use client";
import React from "react";
import { History } from "lucide-react";
import { useGameContext } from "./GameContext";

const GameHistory: React.FC = () => {
  const { history } = useGameContext();
  
  // Calculate statistics
  const highestMultiplier = history.length > 0 
    ? Math.max(...history.map(h => parseFloat(h.multiplier))).toFixed(2)
    : "0.00";
    
  const averageCrashPoint = history.length > 0 
    ? (history.reduce((acc, h) => acc + parseFloat(h.multiplier), 0) / history.length).toFixed(2)
    : "0.00";

  return (
    <div className="bg-gray-800 rounded-lg p-4 h-full">
      <div className="flex items-center mb-4">
        <History className="mr-2 text-blue-400" size={18} />
        <h3 className="font-medium">Recent Rounds</h3>
      </div>
      
      <div className="divide-y divide-gray-700 max-h-96 overflow-y-auto">
        {history.map((item, index) => (
          <div key={index} className="py-2 flex justify-between items-center">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                item.result === "crash" ? "bg-red-500" : "bg-green-500"
              }`}></div>
              <span className="font-mono">{item.multiplier}x</span>
            </div>
            <span className={item.result === "crash" ? "text-red-400" : "text-green-400"}>
              {item.result === "crash" ? "CRASH" : `+$${item.winnings}`}
            </span>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="text-xs text-gray-400">
          <div className="flex justify-between mb-1">
            <span>Highest Multiplier:</span>
            <span className="font-medium text-yellow-400">
              {highestMultiplier}x
            </span>
          </div>
          <div className="flex justify-between">
            <span>Average Crash Point:</span>
            <span className="font-medium text-blue-400">
              {averageCrashPoint}x
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameHistory;