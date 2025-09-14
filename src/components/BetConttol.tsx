import { Minus, Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { BetControlProps, showNotification } from "@/lib/types/bet";
import { cashoutAPI, startGameSingle } from "./game/apiActions";

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
  canRemove,
  authToken,
  walletType,
  settings,
}) => {
  const [quickAmounts, setQuickAmounts] = useState<number[]>([]);

useEffect(() => {
  if (settings?.min_bet && settings?.max_bet) {
    const { min_bet, max_bet } = settings;

    // Generate 4 amounts evenly spaced
    const step = (max_bet - min_bet) / 3;
    const amounts = [
      min_bet,
      min_bet + step,
      min_bet + step * 2,
      max_bet,
    ].map((amt) => Math.round(amt / 50) * 50); // round to nearest 50

    // Remove duplicates in case rounding collapses values
    const uniqueAmounts = Array.from(new Set(amounts));

    console.log("⚡ Quick amounts from BE (rounded to 50):", uniqueAmounts, settings);
    setQuickAmounts(uniqueAmounts);
  } else {
    console.log("⚠️ Using default quick amounts, no settings yet");
    setQuickAmounts([10, 20, 50, 100]);
  }
}, [settings]);

  const displayQuickAmounts = quickAmounts.length > 0 ? quickAmounts : [10, 20, 50, 100];



// Keep your existing ref
const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

// NEW: live multiplier ref
const multiplierRef = useRef(multiplier);
useEffect(() => {
  multiplierRef.current = multiplier;
}, [multiplier]);

// Only depend on gameState/authToken so timers aren't torn down by multiplier changes
useEffect(() => {
  if (gameState !== "driving" || !authToken) return;

  let cancelled = false;

  const scheduleNext = () => {
    const delay = Math.floor(Math.random() * (5000 - 500 + 1)) + 500; // 500–10000 ms
    timeoutRef.current = setTimeout(async () => {
      if (cancelled) return;

      try {
        const m = multiplierRef.current; // always the latest multiplier
        await cashoutAPI(1, authToken, m, 0); // betId=0 as you wanted
        console.log("Auto cashout with multiplier:", m);
      } catch (err) {
        console.error("Auto cashout failed:", err);
      }

      if (!cancelled && gameState === "driving") {
        scheduleNext(); // chain next random trigger
      }
    }, delay);
  };

  scheduleNext(); // first trigger also randomized

  return () => {
    cancelled = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };
}, [gameState, authToken]);

  
  // Add the missing ref for cashout sound
  const cashoutSoundRef = useRef<HTMLAudioElement>(null);

  // Determine if controls should be disabled
  const isControlsDisabled = bet.hasPlacedBet || bet.pendingBet;

  const updateBetAmount = (change: number): void => {
    if (isControlsDisabled) return;

    const currentAmount = typeof bet.amount === "number" ? bet.amount : 0;
    const newAmount = Math.max(0.1, currentAmount + change);
    onUpdate({
      ...bet,
      amount: Math.round(newAmount * 100) / 100,
    });
  };

  const setBetAmount = (amount: number): void => {
    if (isControlsDisabled) return;

    if (amount >= 0.1) {
      onUpdate({
        ...bet,
        amount,
      });
    }
  };

  const handleBetAmountInput = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    if (isControlsDisabled) return;

    const value = e.target.value;
    if (value) {
      const parsedValue = parseFloat(value);
      if (!isNaN(parsedValue)) {
        setBetAmount(parsedValue);
      }
    } else if (e.target.value === "") {
      // Allow empty input for typing purposes
      onUpdate({
        ...bet,
        amount: "",
      });
    }
  };

    const handleAutoCashOutInput = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    if (isControlsDisabled) return;

    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 1) {
      onUpdate({
        ...bet,
        autoCashOut: value,
      });
    } else if (e.target.value === "") {
      // Allow empty input for typing purposes
      onUpdate({
        ...bet,
        autoCashOut: "",
      });
    }
  };

  const updateAutoCashOut = (change: number): void => {
    if (isControlsDisabled) return;

    const currentValue =
      typeof bet.autoCashOut === "number" ? bet.autoCashOut : 1.1;
    const newValue = Math.max(1.1, currentValue + change);
    onUpdate({
      ...bet,
      autoCashOut: Math.round(newValue * 100) / 100,
    });
  };

  const toggleAutoCashOut = (): void => {
    if (isControlsDisabled) return;

    onUpdate({
      ...bet,
      isAutoCashOutEnabled: !bet.isAutoCashOutEnabled,
    });
  };

  // Updated toggleAutoBet to set bet as active or pending when turned on
  const toggleAutoBet = (): void => {
    if (isControlsDisabled) return;

    const newAutoState = !bet.isAutoBetEnabled;

    // If turning AutoBet on, place bet immediately or set pending
    if (newAutoState) {
      const betAmount = typeof bet.amount === "number" ? bet.amount : 0;

      // If we can place the bet immediately (in betting phase)
      if (gameState === "betting" && balance >= betAmount) {
        setBalance((prev) => prev - betAmount);
        onUpdate({
          ...bet,
          isAutoBetEnabled: true,
          hasPlacedBet: true,
          pendingBet: false,
        });
      }
      // Otherwise set as pending for next round
      else {
        onUpdate({
          ...bet,
          isAutoBetEnabled: true,
          pendingBet: true,
          hasPlacedBet: false,
        });
      }
    } else {
      // Just turn off AutoBet
      onUpdate({
        ...bet,
        isAutoBetEnabled: false,
      });
    }
  };

const placeBet = (): void => {
  const betAmount = typeof bet.amount === "number" ? bet.amount : 0;

  if (betAmount <= 0) return;

  if (gameState === "lockbets" && balance >= betAmount) {
    if (!walletType) return;

    // Immediately update UI
    onUpdate({
      ...bet,
      hasPlacedBet: true,
      pendingBet: false,
    });
    setBalance((prev) => prev - betAmount);

    // Fire async call without await
    startGameSingle(betAmount, walletType, authToken ?? "")
      .then((res) => {
        const newBalance = res[walletType];
        const newGameId = res.game_id;

        setBalance(newBalance);
        onUpdate({
          ...bet,
          hasPlacedBet: true,
          pendingBet: false,
          gameId: newGameId,
        });
      })
      .catch((error) => {
        console.error("Failed to place bet:", error);
        onUpdate({
          ...bet,
          pendingBet: false,
          hasPlacedBet: true,
          gameId: 0,
        });
      });

    return;
  }

  // Queue bet for next round
  onUpdate({
    ...bet,
    pendingBet: true,
  });
};

  const playCashoutSound = () => {
    if (cashoutSoundRef.current) {
      cashoutSoundRef.current
        .play()
        .catch((e) => console.log("Sound play error:", e));
    }
  };

  // Updated cancelBet to turn off AutoBet as well
  const cancelBet = (): void => {
    // Only refund if bet is active and game is in betting phase
    if (bet.hasPlacedBet && gameState === "betting") {
      const betAmount = typeof bet.amount === "number" ? bet.amount : 0;
      setBalance((prev) => prev + betAmount);
    }

    // Turn off AutoBet, cancel pending bet status, and handle hasPlacedBet
    onUpdate({
      ...bet,
      isAutoBetEnabled: false, // Turn off AutoBet when canceling
      pendingBet: false,
      hasPlacedBet: bet.hasPlacedBet && gameState !== "betting" ? true : false,
    });
  };

  const cashOut = (): void => {
    const betAmount = typeof bet.amount === "number" ? bet.amount : 0;
    const cashOutAmount = betAmount * multiplier;

    if (betAmount < 1) {
      showNotification("Invalid bet amount for cashout", "error");
      return;
    }

    // Play cashout sound
    playCashoutSound();

    onUpdate({
      ...bet,
      hasPlacedBet: false,
      pendingBet: bet.isAutoBetEnabled,
    });
     setBalance((prev) => prev + cashOutAmount, walletType === 'commissions' ? 'commissions' : 'with_balance');

    showNotification(
      `Cashed out at ${multiplier.toFixed(2)}x! Won ${cashOutAmount.toFixed(
        2
      )} XAF`,
      "success"
    );
    if (authToken) {
      // Real cashout for authenticated users
      cashoutAPI(cashOutAmount, authToken, multiplier, bet.gameId);
    } else {
      // Simulated cashout for unauthenticated users
      onUpdate({
        ...bet,
        hasPlacedBet: false,
        pendingBet: bet.isAutoBetEnabled,
      });

      setBalance((prev) => prev + cashOutAmount);
    }
  };

  // Determine button state
const getButtonState = () => {
  // If game is driving and this bet is active
  if ((gameState === "driving" || gameState === "lockbets") && bet.hasPlacedBet) {
    const betAmount = typeof bet.amount === "number" ? bet.amount : 0;
    const potentialWin = betAmount * multiplier;
    return {
      text: `Cash Out\n${potentialWin.toFixed(2)} XAF`,
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
    const betAmount = typeof bet.amount === "number" ? bet.amount : 0;

    // Use settings if defined, otherwise default min/max
    const minBet = settings?.min_bet ?? 1;
    const maxBet = settings?.max_bet ?? 50000;

    // Determine if betAmount is valid based on settings/defaults
    const isAmountValid = betAmount >= minBet && betAmount <= maxBet;

    const canPlaceBet = !bet.hasPlacedBet && isAmountValid;

    return {
      text: `Bet\n${betAmount.toFixed(2)} XAF`,
      action: placeBet,
      className: "bg-green-500 hover:bg-green-400 text-white font-medium",
      disabled: !canPlaceBet,
    };
  }
};



  const buttonState = getButtonState();

  return (
    <div
      className={`bg-gray-900 rounded-lg mb-2 ${
        isActive ? "border border-gray-600" : ""
      }`}
    >
      {/* Hidden audio element for cashout sound */}
      <audio ref={cashoutSoundRef} preload="auto">
        <source src="/sounds/cashout.wav" type="audio/wav" />
      </audio>

      <div className="flex items-center justify-between p-2">
        <div className="flex items-center">
          <span className="text-sm mr-2">Bet {index + 1}</span>
          {isActive && (
            <span className="bg-blue-500 text-xs px-1 rounded">Active</span>
          )}
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
              onClick={() => {
                if (!isControlsDisabled) {
                  onRemove();
                }
              }}
              className={`text-gray-400 hover:text-red-500 ${
                isControlsDisabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={isControlsDisabled}
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
              onClick={() => updateBetAmount(-0.5)}
              className={`bg-gray-800 px-2 py-1 rounded-l ${
                isControlsDisabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={isControlsDisabled}
              title="Decrease bet amount"
            >
              <Minus size={12} />
            </button>
<input
              type="number"
              value={bet.amount}
              onChange={handleBetAmountInput}
              disabled={isControlsDisabled}
              onBlur={() => {
                if (
                  !isControlsDisabled &&
                  (bet.amount === "" ||
                    typeof bet.amount !== "number" ||
                    bet.amount < 0.1)
                ) {
                  setBetAmount(10);
                }
              }}
              className={`bg-gray-800 text-center text-white p-1 w-20 outline-none ${
                isControlsDisabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
              placeholder="Amount"
            />
            <button
              onClick={() => updateBetAmount(0.1)}
              className={`bg-gray-800 px-2 py-1 rounded-r ${
                isControlsDisabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={isControlsDisabled}
              title="Update bet amount"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>

        {/* Quick Bet Amounts */}
        <div className="grid grid-cols-4 gap-2 mb-2">
         {displayQuickAmounts.map((amount) => (

            <button
              key={amount}
              onClick={() => {
                if (!isControlsDisabled) {
                  setBetAmount(amount);
                }
              }}
              disabled={isControlsDisabled}
              className={`bg-gray-800 py-1 text-sm rounded-md ${
                isControlsDisabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {amount.toFixed(2)}
            </button>
          ))}
        </div>
      </div>

      {/* Auto Controls - Both on same line */}
      <div className="p-2">
        <div className="flex justify-between space-x-4">
          {/* Auto Cash Out Controls */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Auto Cash Out</span>
              <div
                className={`w-12 h-6 rounded-full relative ${
                  bet.isAutoCashOutEnabled ? "bg-green-500" : "bg-gray-700"
                } ${isControlsDisabled ? "opacity-50" : "cursor-pointer"}`}
                onClick={isControlsDisabled ? undefined : toggleAutoCashOut}
              >
                <div
                  className={`absolute w-5 h-5 rounded-full bg-white top-0.5 transition-all ${
                    bet.isAutoCashOutEnabled ? "right-0.5" : "left-0.5"
                  }`}
                ></div>
              </div>
            </div>

            {bet.isAutoCashOutEnabled && (
              <div className="flex items-center justify-between">
                <button
                  onClick={() => updateAutoCashOut(-0.1)}
                  className={`bg-gray-800 px-2 py-1 rounded-l ${
                    isControlsDisabled ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={isControlsDisabled}
                  title="Decrease auto cash out"
                >
                  <Minus size={12} />
                </button>
                <input
                  type="number"
                  value={bet.autoCashOut}
                  onChange={handleAutoCashOutInput}
                  disabled={isControlsDisabled}
                  onBlur={() => {
                    if (
                      !isControlsDisabled &&
                      (bet.autoCashOut === "" ||
                        typeof bet.autoCashOut !== "number" ||
                        bet.autoCashOut < 1.1)
                    ) {
                      onUpdate({
                        ...bet,
                        autoCashOut: 1.1,
                      });
                    }
                  }}
                  className={`bg-gray-800 text-center text-white p-1 w-16 outline-none ${
                    isControlsDisabled ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  placeholder="Value"
                />
                <div className="bg-gray-800 px-2 py-1">x</div>
                <button
                  onClick={() => updateAutoCashOut(0.1)}
                  className={`bg-gray-800 px-2 py-1 rounded-r ${
                    isControlsDisabled ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={isControlsDisabled}
                  title="Increase auto cash out"
                >
                  <Plus size={12} />
                </button>
              </div>
            )}
          </div>

          {/* Auto Bet Control */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Auto Bet</span>
              <div
                className={`w-12 h-6 rounded-full relative ${
                  bet.isAutoBetEnabled ? "bg-green-500" : "bg-gray-700"
                } ${isControlsDisabled ? "opacity-50" : "cursor-pointer"}`}
                onClick={isControlsDisabled ? undefined : toggleAutoBet}
              >
                <div
                  className={`absolute w-5 h-5 rounded-full bg-white top-0.5 transition-all ${
                    bet.isAutoBetEnabled ? "right-0.5" : "left-0.5"
                  }`}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Individual Bet Button */}
      <div className="p-2">
        <button
          onClick={buttonState.action}
          disabled={buttonState.disabled}
          className={`w-full h-12 rounded-lg flex flex-col items-center justify-center whitespace-pre-line ${
            buttonState.className
          } ${buttonState.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {buttonState.text}
        </button>
      </div>
    </div>
  );
};

export default BetControl;


