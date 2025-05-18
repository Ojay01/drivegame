"use client";
import { useEffect, useRef, useState } from "react";
import { useGameContext } from "./GameContext";
import { Bet, showNotification } from "@/lib/types/bet";
import { cashoutAPI, crashedAPI, startGame } from "./apiActions";
import BetControl from "../BetConttol";

// Main Container Component
const BettingControls: React.FC = () => {
  const {
    gameState,
    balance,
    gameId,
    setGameId,
    setBalance,
    walletType,
    setWalletType,
    multiplier,
  } = useGameContext();
  const cashedOutRef = useRef<Set<string>>(new Set()); // Using string for composite IDs
  const [prevGameState, setPrevGameState] = useState(gameState);
  const [selectedTab, setSelectedTab] = useState<"Bet" | "Wallet">("Bet");
  const [bets, setBets] = useState<Bet[]>([
    {
      id: 1,
      amount: 10.0,
      autoCashOut: 2.0,
      hasPlacedBet: false,
      pendingBet: false,
      isAutoCashOutEnabled: false,
      isAutoBetEnabled: false,
      gameId: 0, // Changed from null to 0
    },
  ]);
  const [activeBetIndex, setActiveBetIndex] = useState<number>(0);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("authToken");
    setAuthToken(token);
  }, []);

  useEffect(() => {
    if (prevGameState !== "betting" && gameState === "betting") {
      // Process all pending bets when entering betting phase
      const processBets = async () => {
        // Create a copy of bets to update
        let updatedBets = [...bets];

        // Process each bet sequentially to ensure proper game IDs
        for (let i = 0; i < updatedBets.length; i++) {
          const bet = updatedBets[i];

          if (bet.pendingBet) {
            const betAmount = typeof bet.amount === "number" ? bet.amount : 0;

            if (balance >= betAmount) {
              // Deduct balance (will be corrected by API response)
              setBalance((prev) => prev - betAmount);

              showNotification(
                `Pending bet of ${betAmount.toFixed(2)} XAF placed`,
                "success"
              );

              // 🔥 Call the API here
              if (authToken && walletType) {
                try {
                  const res = await startGame(betAmount, walletType, authToken);
                  const newBalance = res[walletType];
                  console.info("StartGame newBalance:", newBalance);
                  setBalance(newBalance);

                  const newGameId = res.game_id;
                  console.info(`StartGame for bet ${i} gameId:`, newGameId);

                  // Update this specific bet with its own game ID
                  updatedBets[i] = {
                    ...bet,
                    pendingBet: false,
                    hasPlacedBet: true,
                    gameId: newGameId, // Store the game ID with this specific bet
                  };

                  // Also update the global game ID (for other features that might use it)
                  setGameId(newGameId);
                } catch (err) {
                  showNotification("Failed to start game", "error");
                  console.error("StartGame Error:", err);

                  // Update bet state for failed bet
                  updatedBets[i] = {
                    ...bet,
                    pendingBet: false,
                  };
                }
              } else if (!walletType) {
                showNotification("Wallet type is not selected!", "error");
                updatedBets[i] = {
                  ...bet,
                  pendingBet: false,
                };
              }
            } else {
              showNotification(
                "Insufficient balance for pending bet!",
                "error"
              );
              updatedBets[i] = {
                ...bet,
                pendingBet: false,
              };
            }
          }
        }

        // Update all bets at once
        setBets(updatedBets);
      };

      processBets();
    }

    // The rest of your transitions
    if (prevGameState === "driving" && gameState === "crashed") {
      showNotification("Game crashed!", "error");

      if (authToken) {
        crashedAPI(authToken, multiplier, null)
          .then((response) => {
            // setBalance(response.balance);
          })
          .catch((error) => {
            console.error("Crash API failed", error);
            console.error("multiplier", multiplier);
            console.error("token", authToken);
          });
      }

      const updatedBets = bets.map((bet) => {
        if (bet.hasPlacedBet && bet.isAutoBetEnabled) {
          showNotification("Auto bet queued for next round", "info");
          return {
            ...bet,
            hasPlacedBet: false,
            pendingBet: true,
            gameId: 0, // Reset gameId to 0 for next round
          };
        }
        if (bet.hasPlacedBet) {
          return {
            ...bet,
            hasPlacedBet: false,
            gameId: 0, // Reset gameId to 0 for next round
          };
        }
        return bet;
      });
      setBets(updatedBets);
    }

    if (prevGameState !== "betting" && gameState === "betting") {
      showNotification("New betting round started", "info");
    }

    if (prevGameState !== "driving" && gameState === "driving") {
      showNotification("Game started!", "info");
    }

    setPrevGameState(gameState);
  }, [
    gameState,
    bets,
    setBalance,
    balance,
    gameId,
    setGameId,
    authToken,
    walletType,
  ]);

  // Auto Cash Out handler for all active bets
useEffect(() => {
  if (gameState === "driving" && authToken) {
    // First, gather all bets that need to be cashed out
    const betsToProcess: Array<{
      bet: Bet;
      index: number;
      cashoutKey: string;
    }> = [];

    bets.forEach((bet, index) => {
      // Create a composite key using bet ID and game ID to ensure uniqueness
      const cashoutKey = `${bet.id}-${bet.gameId}`;
      const alreadyCashedOut = cashedOutRef.current.has(cashoutKey);

      const isValidAutoCashOut =
        bet.hasPlacedBet &&
        bet.isAutoCashOutEnabled &&
        typeof bet.autoCashOut === "number" &&
        multiplier >= bet.autoCashOut &&
        typeof bet.gameId === "number" &&
        bet.gameId > 0; // Ensure the bet has a valid gameId

      if (isValidAutoCashOut && !alreadyCashedOut) {
        // Mark this bet as being processed to prevent duplicate cashouts
        cashedOutRef.current.add(cashoutKey);
        betsToProcess.push({ bet, index, cashoutKey });
      } else {
        // For logging only
        if (alreadyCashedOut) {
          console.log(`🛑 Bet ${index} already cashed out, skipping`);
        } else if (typeof bet.gameId !== "number" || bet.gameId <= 0) {
          console.log(
            `⚠️ Bet ${index} has invalid gameId (${bet.gameId}), cannot cashout`
          );
        } else if (
          bet.hasPlacedBet &&
          bet.isAutoCashOutEnabled &&
          typeof bet.autoCashOut === "number"
        ) {
          console.log(
            `⏭️ Skipping bet ${index} — multiplier (${multiplier}) < autoCashOut (${bet.autoCashOut})`
          );
        }
      }
    });

    // If there are bets to cash out, handle them and update state once
    if (betsToProcess.length > 0) {
      console.log(
        `🎯 Processing ${betsToProcess.length} bets for auto cashout`
      );

      // Track successful cashouts and state updates
      const processedResults: {
        index: number;
        updatedBet: Bet;
      }[] = [];

      // Use a sequential approach to process bets to ensure consistent state updates
      const processBetsSequentially = async () => {
        // Create a copy of current bets to update
        let updatedBets = [...bets];
        let anySuccessfulCashout = false;

        for (const { bet, index, cashoutKey } of betsToProcess) {
          const betAmount = typeof bet.amount === "number" ? bet.amount : 0;
          const cashOutAmount = betAmount * multiplier;

          console.log(
            `🎯 Attempting auto cashout for bet ${index} with gameId ${bet.gameId}`
          );

          try {
            const response = await cashoutAPI(
              cashOutAmount,
              authToken,
              multiplier,
              bet.gameId
            );

            showNotification(
              `Auto cashed out at ${multiplier.toFixed(
                2
              )}x! Won ${cashOutAmount.toFixed(2)} XAF`,
              "success"
            );

            // Update this specific bet in our working copy
            updatedBets[index] = {
              ...bet,
              hasPlacedBet: false,
              pendingBet: bet.isAutoBetEnabled,
            };

            if (bet.isAutoBetEnabled) {
              showNotification(
                `Auto bet ${index + 1} queued for next round`,
                "info"
              );
            }

            anySuccessfulCashout = true;
          } catch (error) {
            console.error(`❌ Auto cashout failed for bet ${index}`, error);
            showNotification(
              `Cashout failed for bet ${index + 1}. Please try again.`,
              "error"
            );

            // Remove from cashedOut set so it can be retried
            cashedOutRef.current.delete(cashoutKey);
          }
        }

        // Only update state if we have at least one successful cashout
        if (anySuccessfulCashout) {
          // Update all bets at once to avoid multiple re-renders
          setBets(updatedBets);
        }
      };

      // Execute the sequential processing
      processBetsSequentially();
    }
  }

  // Reset cashout set when game state changes to betting
  if (gameState === "betting") {
    cashedOutRef.current.clear();
  }
}, [gameState, multiplier, bets, authToken]);

  const addBet = (): void => {
    if (bets.length < 4) {
      const newBet: Bet = {
        id: Date.now(),
        amount: 10.0,
        autoCashOut: 2.0,
        hasPlacedBet: false,
        pendingBet: false,
        isAutoCashOutEnabled: false,
        isAutoBetEnabled: false,
        gameId: 0, // Initialize with 0 instead of null
      };
      setBets([...bets, newBet]);
      setActiveBetIndex(bets.length);
      showNotification("New bet added", "success");
    } else {
      showNotification("Maximum of 4 bets allowed", "error");
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
    <div className="bg-black bg-opacity-90 text-white rounded-lg border border-gray-800 shadow-lg overflow-hidden">
      {/* Tab Selection - Enhanced with gradient and better styling */}
      <div className="flex border-b border-gray-800">
        <button
          className={`flex-1 py-3 font-medium text-sm transition-all duration-200 ${
            selectedTab === "Bet"
              ? "bg-gradient-to-r from-blue-900 to-blue-800 border-b-2 border-blue-500 text-white"
              : "text-gray-400 hover:text-gray-200 hover:bg-gray-900"
          }`}
          onClick={() => setSelectedTab("Bet")}
        >
          Place Bets
        </button>
        <button
          className={`flex-1 py-3 font-medium text-sm transition-all duration-200 ${
            selectedTab === "Wallet"
              ? "bg-gradient-to-r from-purple-900 to-purple-800 border-b-2 border-purple-500 text-white"
              : "text-gray-400 hover:text-gray-200 hover:bg-gray-900"
          }`}
          onClick={() => setSelectedTab("Wallet")}
        >
          Wallet Settings
        </button>
      </div>

      <div className="p-4">
        {selectedTab === "Bet" ? (
          /* Betting Tab Content */
          <div>
            {/* Multiple Bets Section with improved grid layout */}
            <div className="mb-4">
              <div className="md:grid md:grid-cols-2 md:gap-3 block space-y-3 md:space-y-0">
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
                    onActivate={() => {
                      setActiveBetIndex(index);
                      showNotification(`Bet ${index + 1} is now active`, "info");
                    }}
                    canRemove={bets.length > 1}
                  />
                ))}
              </div>

              {/* Add Bet Button with enhanced styling */}
              {bets.length < 4 && (
                <button
                  onClick={addBet}
                  className="w-full py-3 mt-3 border border-dashed border-gray-600 rounded-lg 
                           bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-gray-200 
                           transition-all duration-300 hover:border-gray-400 font-medium"
                >
                  + Add New Bet
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Wallet Tab Content - Enhanced with better styling and structure */
          <div className="space-y-4">
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <h3 className="text-lg font-medium mb-4 text-purple-400">Wallet Settings</h3>
              
              <div className="space-y-4">
                {/* Wallet Selection with enhanced styling */}
                <div className="relative">
                  <label
                    htmlFor="wallet-type-select"
                    className="block text-sm font-medium text-gray-400 mb-2"
                  >
                    Select Active Wallet:
                  </label>
                  <div className="relative">
                    <select
                      id="wallet-type-select"
                      value={walletType || ""}
                      onChange={(e) => setWalletType(e.target.value as any)}
                      className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg 
                               border border-gray-700 focus:outline-none focus:ring-2 
                               focus:ring-purple-500 focus:border-transparent appearance-none 
                               cursor-pointer pr-10 transition-all duration-200"
                    >
                      <option value="">-- Select Wallet --</option>
                      <option value="balance">Deposit Wallet</option>
                      <option value="bonus">Bonus Wallet</option>
                      <option value="with_balance">Withdrawable Wallet</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Current Balance Display */}
                <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Current Balance:</span>
                    <span className="text-lg font-bold text-white">{balance.toFixed(2)} XAF</span>
                  </div>
                  <div className="h-1 w-full bg-gray-700 mt-3 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-full" 
                      style={{ width: `${Math.min(100, balance / 10)}%` }} 
                    />
                  </div>
                </div>
                
                {/* Wallet Status Information */}
                <div className="bg-gray-800 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Wallet Status</h4>
                  <div className="flex items-center space-x-2 text-xs text-gray-400">
                    <div className={`w-2 h-2 rounded-full ${walletType ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span>{walletType ? 'Wallet Selected' : 'No Wallet Selected'}</span>
                  </div>
                  
                  {!walletType && (
                    <div className="mt-2 text-xs text-red-400 bg-red-900 bg-opacity-30 p-2 rounded">
                      Please select a wallet to place bets
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Wallet Help Section */}
            <div className="bg-blue-900 bg-opacity-20 rounded-lg p-3 border border-blue-800">
              <h4 className="text-sm font-medium text-blue-400">Wallet Information</h4>
              <ul className="mt-2 text-xs text-gray-400 space-y-1">
                <li>• <span className="text-white">Deposit Wallet</span>: Main wallet for your deposits</li>
                <li>• <span className="text-white">Bonus Wallet</span>: Contains bonus funds </li>
                <li>• <span className="text-white">Withdrawable Wallet</span>: Funds available for immediate withdrawal</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BettingControls;