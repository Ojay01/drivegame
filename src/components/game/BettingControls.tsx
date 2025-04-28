"use client";
import React, { useState, useEffect } from "react";
import { Minus, Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import { useGameContext } from "./GameContext";
import { Bet, BetControlProps } from "@/lib/types/bet";


const BetControl: React.FC<BetControlProps> = ({
  bet,
  index,
  isActive,
  gameState,
  multiplier,
  balance,
  setBalance,
  onUpdate,
  onRemove,
  onActivate,
  canRemove
}) => {
  const quickAmounts = [1.00, 2.00, 5.00, 10.00];

  const updateBetAmount = (change: number): void => {
    const currentAmount = typeof bet.amount === 'number' ? bet.amount : 0;
    const newAmount = Math.max(0.10, currentAmount + change);
    onUpdate({
      ...bet,
      amount: Math.round(newAmount * 100) / 100
    });
  };

  const setBetAmount = (amount: number): void => {
    if (amount >= 0.10) {
      onUpdate({
        ...bet,
        amount
      });
    }
  };

  const handleBetAmountInput = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setBetAmount(value);
    } else if (e.target.value === '') {
      // Allow empty input for typing purposes
      onUpdate({
        ...bet,
        amount: ''
      });
    }
  };

  const updateAutoCashOut = (change: number): void => {
    const currentValue = typeof bet.autoCashOut === 'number' ? bet.autoCashOut : 1.10;
    const newValue = Math.max(1.10, currentValue + change);
    onUpdate({
      ...bet,
      autoCashOut: Math.round(newValue * 100) / 100
    });
  };

  const handleAutoCashOutInput = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 1.10) {
      onUpdate({
        ...bet,
        autoCashOut: value
      });
    } else if (e.target.value === '') {
      // Allow empty input for typing purposes
      onUpdate({
        ...bet,
        autoCashOut: ''
      });
    }
  };

  const toggleAutoCashOut = (): void => {
    onUpdate({
      ...bet,
      isAutoCashOutEnabled: !bet.isAutoCashOutEnabled
    });
  };

  const toggleAutoBet = (): void => {
    onUpdate({
      ...bet,
      isAutoBetEnabled: !bet.isAutoBetEnabled
    });
  };

  const placeBet = (): void => {
    const betAmount = typeof bet.amount === 'number' ? bet.amount : 0;
    
    // Can place bet immediately if in betting phase and has enough balance
    if (gameState === "betting" && balance >= betAmount) {
      setBalance(prev => prev - betAmount);
      onUpdate({
        ...bet,
        hasPlacedBet: true,
        pendingBet: false
      });
    } 
    // Otherwise, set as pending for next round
    else {
      onUpdate({
        ...bet,
        pendingBet: true
      });
    }
  };

  const cancelBet = (): void => {
    // Only refund if bet is active and game is in betting phase
    if (bet.hasPlacedBet && gameState === "betting") {
      const betAmount = typeof bet.amount === 'number' ? bet.amount : 0;
      setBalance(prev => prev + betAmount);
    }
    
    // Can cancel bet if it's pending or if the game is in betting phase
    onUpdate({
      ...bet,
      pendingBet: false,
      hasPlacedBet: bet.hasPlacedBet && gameState !== "betting" ? true : false
    });
  };

  const cashOut = (): void => {
    const betAmount = typeof bet.amount === 'number' ? bet.amount : 0;
    const cashOutAmount = betAmount * multiplier;
    
    setBalance(prev => prev + cashOutAmount);
    onUpdate({
      ...bet,
      hasPlacedBet: false,
      // Queue up next bet if auto bet is enabled
      pendingBet: bet.isAutoBetEnabled
    });
  };

  // Determine button state
  const getButtonState = () => {
    // If game is driving and this bet is active
    if (gameState === "driving" && bet.hasPlacedBet) {
      return {
        text: "Cash Out",
        action: cashOut,
        className: "bg-yellow-500 hover:bg-yellow-400 text-black font-medium",
      };
    }
    // If game crashed and this bet was active
    else if (gameState === "crashed" && bet.hasPlacedBet) {
      return {
        text: "Crashed",
        action: () => {},
        className: "bg-gray-600 text-white font-medium",
        disabled: true,
      };
    }
    // If bet is pending (waiting for next round)
    else if (bet.pendingBet) {
      return {
        text: "Cancel",
        action: cancelBet,
        className: "bg-red-600 hover:bg-red-500 text-white font-medium",
      };
    }
    // If bet is active but in betting phase (can still cancel)
    else if (bet.hasPlacedBet && gameState === "betting") {
      return {
        text: "Cancel",
        action: cancelBet,
        className: "bg-red-600 hover:bg-red-500 text-white font-medium",
      };
    }
    // Default state - can place bet at any time when not already active
    else {
      const canPlaceBet = !bet.hasPlacedBet;
      const betAmount = typeof bet.amount === 'number' ? bet.amount.toFixed(2) : '0.00';
      return {
        text: `Bet\n${betAmount} XAF`,
        action: placeBet,
        className: "bg-green-500 hover:bg-green-400 text-white font-medium",
        disabled: !canPlaceBet,
      };
    }
  };

  const buttonState = getButtonState();

  return (
    <div className={`bg-gray-900 rounded-lg mb-2 ${isActive ? 'border border-gray-600' : ''}`}>
      <div className="flex items-center justify-between p-2">
        <div className="flex items-center">
          <span className="text-sm mr-2">Bet {index + 1}</span>
          {isActive && <span className="bg-blue-500 text-xs px-1 rounded">Active</span>}
        </div>
        <div className="flex items-center">
          <button 
            onClick={onActivate}
            className="text-gray-400 hover:text-white mr-2"
          >
            {isActive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {canRemove && (
            <button 
              onClick={onRemove}
              className="text-gray-400 hover:text-red-500"
               title="Remove bet amount"
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
              onClick={() => updateBetAmount(-0.1)}
              className="bg-gray-800 px-2 py-1 rounded-l"
              title="Decrease bet amount"
            >
              <Minus size={12} />
            </button>
            <input
              type="text"
              value={typeof bet.amount === 'number' ? bet.amount.toFixed(2) : bet.amount}
              onChange={handleBetAmountInput}
              onBlur={() => {
                if (bet.amount === '' || typeof bet.amount !== 'number' || bet.amount < 0.10) {
                  setBetAmount(0.10);
                }
              }}
              className="bg-gray-800 text-center text-white p-1 w-16 outline-none"
              placeholder="Enter amount"
            />
            <button
              onClick={() => updateBetAmount(0.1)}
              className="bg-gray-800 px-2 py-1 rounded-r"
               title="pdate bet amount"
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
              onClick={() => setBetAmount(amount)}
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
            onClick={toggleAutoCashOut}
          >
            <div className={`absolute w-5 h-5 rounded-full bg-white top-0.5 transition-all ${bet.isAutoCashOutEnabled ? "right-0.5" : "left-0.5"}`}></div>
          </div>
        </div>

        {bet.isAutoCashOutEnabled && (
          <div className="flex items-center justify-between">
            <button
              onClick={() => updateAutoCashOut(-0.1)}
              className="bg-gray-800 px-2 py-1 rounded-l"
               title=" bet amount"
            >
              <Minus size={12} />
            </button>
            <input
              type="text"
              value={typeof bet.autoCashOut === 'number' ? bet.autoCashOut.toFixed(2) : bet.autoCashOut}
              onChange={handleAutoCashOutInput}
              onBlur={() => {
                if (bet.autoCashOut === '' || typeof bet.autoCashOut !== 'number' || bet.autoCashOut < 1.10) {
                  onUpdate({
                    ...bet,
                    autoCashOut: 1.10
                  });
                }
              }}
              className="bg-gray-800 text-center text-white p-1 w-16 outline-none"
               placeholder="Enter amount"
            />
            <div className="bg-gray-800 px-2 py-1">x</div>
            <button
              onClick={() => updateAutoCashOut(0.1)}
              className="bg-gray-800 px-2 py-1 rounded-r"
               title=" bet amount"
            >
              <Plus size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Auto Bet Control */}
      <div className="p-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm">Auto Bet</span>
          <div 
            className={`w-12 h-6 rounded-full relative cursor-pointer ${bet.isAutoBetEnabled ? "bg-green-500" : "bg-gray-700"}`}
            onClick={toggleAutoBet}
          >
            <div className={`absolute w-5 h-5 rounded-full bg-white top-0.5 transition-all ${bet.isAutoBetEnabled ? "right-0.5" : "left-0.5"}`}></div>
          </div>
        </div>
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

// Main Container Component
const BettingControls: React.FC = () => {
  const {
    gameState,
    balance,
    setBalance,
    multiplier,
  } = useGameContext();
  
  const [prevGameState, setPrevGameState] = useState(gameState);
  const [selectedTab, setSelectedTab] = useState<"Bet">("Bet");
  const [bets, setBets] = useState<Bet[]>([
    { 
      id: 1, 
      amount: 1.00, 
      autoCashOut: 2.00, 
      hasPlacedBet: false,
      pendingBet: false,
      isAutoCashOutEnabled: false,
      isAutoBetEnabled: false
    },
  ]);
  const [activeBetIndex, setActiveBetIndex] = useState<number>(0);

  // Track game state transitions
  useEffect(() => {
    // Handle game state transitions
    if (prevGameState !== "betting" && gameState === "betting") {
      // Process all pending bets when entering betting phase
      const updatedBets = bets.map(bet => {
        if (bet.pendingBet) {
          const betAmount = typeof bet.amount === 'number' ? bet.amount : 0;
          
          if (balance >= betAmount) {
            setBalance(prev => prev - betAmount); // Deduct balance
            
            return {
              ...bet,
              pendingBet: false,
              hasPlacedBet: true
            };
          }
        }
        return bet;
      });
      setBets(updatedBets);
    }
    
    if (prevGameState === "driving" && gameState === "crashed") {
      // When game crashes, update all bets - keep pending bets
      const updatedBets = bets.map(bet => {
        // If bet was active and auto bet is enabled, queue a new bet
        if (bet.hasPlacedBet && bet.isAutoBetEnabled) {
          return {
            ...bet,
            hasPlacedBet: false,
            pendingBet: true
          };
        }
        // Clear hasPlacedBet flag for any active bets but keep pending status
        if (bet.hasPlacedBet) {
          return {
            ...bet,
            hasPlacedBet: false
          };
        }
        return bet;
      });
      setBets(updatedBets);
    }
    
    setPrevGameState(gameState);
  }, [gameState, bets, setBalance, balance]);

  // Auto Cash Out handler for all active bets
  useEffect(() => {
    if (gameState === "driving") {
      bets.forEach((bet, index) => {
        if (
          bet.hasPlacedBet && 
          bet.isAutoCashOutEnabled && 
          typeof bet.autoCashOut === 'number' && 
          multiplier >= bet.autoCashOut
        ) {
          // Cash out this bet
          const betAmount = typeof bet.amount === 'number' ? bet.amount : 0;
          const cashOutAmount = betAmount * multiplier;
          
          setBalance(prev => prev + cashOutAmount);
          
          const updatedBets = [...bets];
          updatedBets[index] = {
            ...updatedBets[index],
            hasPlacedBet: false,
            // If auto bet is enabled, queue another bet for the next round
            pendingBet: updatedBets[index].isAutoBetEnabled
          };
          setBets(updatedBets);
        }
      });
    }
  }, [gameState, multiplier, bets, setBalance]);

  const addBet = (): void => {
    if (bets.length < 4) {
      const newBet: Bet = { 
        id: Date.now(), 
        amount: 1.00, 
        autoCashOut: 2.00,
        hasPlacedBet: false,
        pendingBet: false,
        isAutoCashOutEnabled: true,
        isAutoBetEnabled: false
      };
      setBets([...bets, newBet]);
      setActiveBetIndex(bets.length);
    }
  };

  const removeBet = (index: number): void => {
    if (bets.length > 1) {
      const newBets = [...bets];
      newBets.splice(index, 1);
      setBets(newBets);
      if (activeBetIndex >= newBets.length) {
        setActiveBetIndex(newBets.length - 1);
      }
    }
  };

  const updateBet = (index: number, updatedBet: Bet): void => {
    const newBets = [...bets];
    newBets[index] = updatedBet;
    setBets(newBets);
  };

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
      </div>

      <div className="p-2">
        {/* Multiple Bets Section */}
        <div className="mb-4">
          <div className="md:grid md:grid-cols-2 md:gap-2 block">
            {bets.map((bet, index) => (
              <BetControl
                key={bet.id}
                bet={bet}
                index={index}
                isActive={index === activeBetIndex}
                gameState={gameState}
                multiplier={multiplier}
                balance={balance}
                setBalance={setBalance}
                onUpdate={(updatedBet) => updateBet(index, updatedBet)}
                onRemove={() => removeBet(index)}
                onActivate={() => setActiveBetIndex(index)}
                canRemove={bets.length > 1}
              />
            ))}
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
      </div>
    </div>
  );
};

export default BettingControls;