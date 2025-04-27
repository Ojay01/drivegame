"use client";
import React, { useState, useEffect } from "react";
import { Minus, Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import { useGameContext } from "./GameContext";

const BettingControls = () => {
  const {
    gameState,
    balance,
    setBalance,
    placeBet,
    cancelBet,
    handleCashOut,
    multiplier,
  } = useGameContext();

  const [selectedTab, setSelectedTab] = useState("Bet");
  const [isAutoBet, setIsAutoBet] = useState(false);
  const [bets, setBets] = useState([
    { 
      id: 1, 
      amount: 1.00, 
      autoCashOut: 2.00, 
      hasPlacedBet: false,
      pendingBet: false,
      isAutoCashOutEnabled: true
    },
  ]);
  const [activeBetIndex, setActiveBetIndex] = useState(0);

  // Handle auto cash out logic for each bet independently
  useEffect(() => {
    if (gameState === "driving") {
      const updatedBets = [...bets];
      let shouldUpdate = false;
      
      updatedBets.forEach((bet, index) => {
        if (bet.hasPlacedBet && bet.isAutoCashOutEnabled && multiplier >= bet.autoCashOut && bet.autoCashOut > 1) {
          // Cash out this specific bet
          handleCashOutSingleBet(index);
          shouldUpdate = true;
        }
      });
      
      if (shouldUpdate) {
        setBets(updatedBets);
      }
    }
  }, [gameState, multiplier, bets]);

  // Handle auto bet logic
  useEffect(() => {
    if (isAutoBet && gameState === "driving") {
      const anyPendingBets = bets.some(bet => bet.pendingBet);
      const anyActiveBets = bets.some(bet => bet.hasPlacedBet);
      
      if (!anyPendingBets && !anyActiveBets) {
        placeBetsAll();
      }
    }
  }, [isAutoBet, gameState, bets]);

  const handleCashOutSingleBet = (index) => {
    // Call the game context cash out function with proper multiplier
    const cashOutAmount = bets[index].amount * multiplier;
    
    // This is a simplification - you'd need to modify your GameContext to support multiple bets
    handleCashOut(index, cashOutAmount);
    
    // Update local state
    const updatedBets = [...bets];
    updatedBets[index].hasPlacedBet = false;
    setBets(updatedBets);
  };

  const addBet = () => {
    if (bets.length < 4) {
      const newBet = { 
        id: Date.now(), 
        amount: 1.00, 
        autoCashOut: 2.00,
        hasPlacedBet: false,
        pendingBet: false,
        isAutoCashOutEnabled: true
      };
      setBets([...bets, newBet]);
      setActiveBetIndex(bets.length);
    }
  };

  const removeBet = (index) => {
    if (bets.length > 1) {
      const newBets = [...bets];
      newBets.splice(index, 1);
      setBets(newBets);
      if (activeBetIndex >= newBets.length) {
        setActiveBetIndex(newBets.length - 1);
      }
    }
  };

  const updateBetAmount = (index, change) => {
    const newBets = [...bets];
    const newAmount = Math.max(0.10, newBets[index].amount + change);
    newBets[index].amount = Math.round(newAmount * 100) / 100;
    setBets(newBets);
  };

  const setBetAmount = (index, amount) => {
    if (amount >= 0.10) {
      const newBets = [...bets];
      newBets[index].amount = amount;
      setBets(newBets);
    }
  };

  const handleBetAmountInput = (index, e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setBetAmount(index, value);
    } else if (e.target.value === '') {
      // Allow empty input for typing purposes
      const newBets = [...bets];
      newBets[index].amount = '';
      setBets(newBets);
    }
  };

  const updateAutoCashOut = (index, change) => {
    const newBets = [...bets];
    const newValue = Math.max(1.10, newBets[index].autoCashOut + change);
    newBets[index].autoCashOut = Math.round(newValue * 100) / 100;
    setBets(newBets);
  };

  const handleAutoCashOutInput = (index, e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 1.10) {
      const newBets = [...bets];
      newBets[index].autoCashOut = value;
      setBets(newBets);
    } else if (e.target.value === '') {
      // Allow empty input for typing purposes
      const newBets = [...bets];
      newBets[index].autoCashOut = '';
      setBets(newBets);
    }
  };

  const toggleAutoCashOut = (index) => {
    const newBets = [...bets];
    newBets[index].isAutoCashOutEnabled = !newBets[index].isAutoCashOutEnabled;
    setBets(newBets);
  };

  const quickAmounts = [1.00, 2.00, 5.00, 10.00];

  const placeBetsAll = () => {
    // Place all bets
    const activeBets = bets.map(bet => ({
      amount: bet.amount,
      autoCashOut: bet.autoCashOut,
      isAutoCashOutEnabled: bet.isAutoCashOutEnabled
    }));
    
    // This needs to be implemented in your GameContext
    placeBet(activeBets);
    
    // Update local state
    const updatedBets = bets.map(bet => ({
      ...bet,
      pendingBet: true
    }));
    setBets(updatedBets);
  };

  const placeSingleBet = (index) => {
    // This needs to be implemented in your GameContext
    placeBet([{
      amount: bets[index].amount,
      autoCashOut: bets[index].autoCashOut,
      isAutoCashOutEnabled: bets[index].isAutoCashOutEnabled
    }], index);
    
    // Update local state
    const updatedBets = [...bets];
    updatedBets[index].pendingBet = true;
    setBets(updatedBets);
  };

  const cancelSingleBet = (index) => {
    // This needs to be implemented in your GameContext
    cancelBet(index);
    
    // Update local state
    const updatedBets = [...bets];
    updatedBets[index].pendingBet = false;
    setBets(updatedBets);
  };

  const getButtonState = (index) => {
    const bet = bets[index];
    
    if (gameState === "driving" && bet.hasPlacedBet) {
      return {
        text: "Cash Out",
        action: () => handleCashOutSingleBet(index),
        className: "bg-yellow-500 hover:bg-yellow-400 text-black font-medium",
      };
    } else if (bet.pendingBet) {
      return {
        text: "Cancel",
        action: () => cancelSingleBet(index),
        className: "bg-red-600 hover:bg-red-500 text-white font-medium",
      };
    } else {
      return {
        text: `Bet\n${typeof bet.amount === 'number' ? bet.amount.toFixed(2) : '0.00'} USD`,
        action: () => placeSingleBet(index),
        className: "bg-green-500 hover:bg-green-400 text-white font-medium",
        disabled: gameState === "crashed",
      };
    }
  };

  const getMainButtonState = () => {
    const allBetsPlaced = bets.every(bet => bet.hasPlacedBet);
    const someBetsPending = bets.some(bet => bet.pendingBet);
    const someBetsPlaced = bets.some(bet => bet.hasPlacedBet);
    
    if (gameState === "driving" && someBetsPlaced) {
      return {
        text: "Cash Out All",
        action: () => bets.forEach((bet, idx) => {
          if (bet.hasPlacedBet) handleCashOutSingleBet(idx);
        }),
        className: "bg-yellow-500 hover:bg-yellow-400 text-black font-medium",
      };
    } else if (someBetsPending) {
      return {
        text: "Cancel All",
        action: () => bets.forEach((bet, idx) => {
          if (bet.pendingBet) cancelSingleBet(idx);
        }),
        className: "bg-red-600 hover:bg-red-500 text-white font-medium",
      };
    } else {
      const totalBetAmount = bets.reduce((sum, bet) => sum + (typeof bet.amount === 'number' ? bet.amount : 0), 0);
      return {
        text: `Bet All\n${totalBetAmount.toFixed(2)} USD`,
        action: placeBetsAll,
        className: "bg-green-500 hover:bg-green-400 text-white font-medium",
        disabled: gameState === "crashed",
      };
    }
  };

  const renderBetControl = (bet, index) => {
    const isActive = index === activeBetIndex;
    const buttonState = getButtonState(index);
    
    return (
      <div key={bet.id} className={`bg-gray-900 rounded-lg mb-2 ${isActive ? 'border border-gray-600' : ''}`}>
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center">
            <span className="text-sm mr-2">Bet {index + 1}</span>
            {isActive && <span className="bg-blue-500 text-xs px-1 rounded">Active</span>}
          </div>
          <div className="flex items-center">
            <button 
              onClick={() => setActiveBetIndex(index)}
              className="text-gray-400 hover:text-white mr-2"
            >
              {isActive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {bets.length > 1 && (
              <button 
                onClick={() => removeBet(index)}
                className="text-gray-400 hover:text-red-500"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        
        {/* Bet Amount Controls */}
        <div className="p-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm">Bet Amount</span>
            <div className="flex items-center">
              <button
                onClick={() => updateBetAmount(index, -0.1)}
                className="bg-gray-800 px-2 py-1 rounded-l"
              >
                <Minus size={12} />
              </button>
              <input
                type="text"
                value={typeof bet.amount === 'number' ? bet.amount.toFixed(2) : bet.amount}
                onChange={(e) => handleBetAmountInput(index, e)}
                onBlur={() => {
                  if (bet.amount === '' || bet.amount < 0.10) {
                    setBetAmount(index, 0.10);
                  }
                }}
                className="bg-gray-800 text-center text-white p-1 w-16 outline-none"
              />
              <button
                onClick={() => updateBetAmount(index, 0.1)}
                className="bg-gray-800 px-2 py-1 rounded-r"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>

          {/* Quick Bet Amounts */}
          <div className="grid grid-cols-4 gap-2 mb-2">
            {quickAmounts.map((amount) => (
              <button
                key={amount}
                onClick={() => setBetAmount(index, amount)}
                className="bg-gray-800 py-1 text-sm rounded-md"
              >
                {amount.toFixed(2)}
              </button>
            ))}
          </div>
        </div>

        {/* Auto Cash Out Controls */}
        <div className="p-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm">Auto Cash Out</span>
            <div 
              className={`w-12 h-6 rounded-full relative cursor-pointer ${bet.isAutoCashOutEnabled ? "bg-green-500" : "bg-gray-700"}`}
              onClick={() => toggleAutoCashOut(index)}
            >
              <div className={`absolute w-5 h-5 rounded-full bg-white top-0.5 transition-all ${bet.isAutoCashOutEnabled ? "right-0.5" : "left-0.5"}`}></div>
            </div>
          </div>

          {bet.isAutoCashOutEnabled && (
            <div className="flex items-center justify-between">
              <button
                onClick={() => updateAutoCashOut(index, -0.1)}
                className="bg-gray-800 px-2 py-1 rounded-l"
              >
                <Minus size={12} />
              </button>
              <input
                type="text"
                value={typeof bet.autoCashOut === 'number' ? bet.autoCashOut.toFixed(2) : bet.autoCashOut}
                onChange={(e) => handleAutoCashOutInput(index, e)}
                onBlur={() => {
                  if (bet.autoCashOut === '' || bet.autoCashOut < 1.10) {
                    const newBets = [...bets];
                    newBets[index].autoCashOut = 1.10;
                    setBets(newBets);
                  }
                }}
                className="bg-gray-800 text-center text-white p-1 w-16 outline-none"
              />
              <div className="bg-gray-800 px-2 py-1">x</div>
              <button
                onClick={() => updateAutoCashOut(index, 0.1)}
                className="bg-gray-800 px-2 py-1 rounded-r"
              >
                <Plus size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Individual Bet Button */}
        <div className="p-2">
          <button
            onClick={buttonState.action}
            disabled={buttonState.disabled}
            className={`w-full h-12 rounded-lg flex flex-col items-center justify-center whitespace-pre-line ${buttonState.className} ${
              buttonState.disabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {buttonState.text}
          </button>
        </div>
      </div>
    );
  };

  const mainButtonState = getMainButtonState();

  return (
    <div className="bg-black text-white rounded-lg">
      {/* Tab Selection */}
      <div className="flex border-b border-gray-800 mb-2">
        <button
          className={`flex-1 py-2 ${selectedTab === "Bet" ? "border-b-2 border-gray-400" : ""}`}
          onClick={() => setSelectedTab("Bet")}
        >
          Bet
        </button>
        <button
          className={`flex-1 py-2 ${selectedTab === "Auto" ? "border-b-2 border-gray-400" : ""}`}
          onClick={() => setSelectedTab("Auto")}
        >
          Auto
        </button>
      </div>

      <div className="p-2">
        {/* Auto Bet Option */}
        {selectedTab === "Auto" && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span>Auto Bet</span>
              <div 
                className={`w-12 h-6 rounded-full relative cursor-pointer ${isAutoBet ? "bg-green-500" : "bg-gray-700"}`}
                onClick={() => setIsAutoBet(!isAutoBet)}
              >
                <div className={`absolute w-5 h-5 rounded-full bg-white top-0.5 transition-all ${isAutoBet ? "right-0.5" : "left-0.5"}`}></div>
              </div>
            </div>
          </div>
        )}

        {/* Multiple Bets Section */}
        <div className="mb-4">
          <div className="md:grid md:grid-cols-2 md:gap-2 block">
            {bets.map((bet, index) => renderBetControl(bet, index))}
          </div>
          
          {/* Add Bet Button */}
          {bets.length < 4 && (
            <button 
              onClick={addBet}
              className="w-full py-2 border border-dashed border-gray-600 rounded-lg hover:border-gray-400 text-gray-400 hover:text-gray-200 mt-2"
            >
              + Add Bet
            </button>
          )}
        </div>

        {/* Main Action Button */}
        <button
          onClick={mainButtonState.action}
          disabled={mainButtonState.disabled}
          className={`w-full h-16 rounded-lg flex flex-col items-center justify-center whitespace-pre-line ${mainButtonState.className} ${
            mainButtonState.disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {mainButtonState.text}
        </button>
      </div>
    </div>
  );
};

export default BettingControls;