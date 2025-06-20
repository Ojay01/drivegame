// "use client";
import { useEffect, useRef, useState } from "react";
import { useGameContext } from "./GameContext";
import { Bet, showNotification } from "@/lib/types/bet";
import { cashoutAPI, crashedAPI, startGame } from "./apiActions";
import BetControl from "../BetConttol";

// Main Container Component

interface GameControlsProps {
  authToken: string | null;
}

const BettingControls: React.FC<GameControlsProps> = ({ authToken }) => {
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
  const cashedOutRef = useRef<Set<string>>(new Set());
  const cashoutSoundRef = useRef<HTMLAudioElement>(null);
  
  const playCashoutSound = () => {
    if (cashoutSoundRef.current) {
      cashoutSoundRef.current
        .play()
        .catch((e) => console.log("Sound play error:", e));
    }
  };

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
      gameId: 0,
    },
  ]);
  const [activeBetIndex, setActiveBetIndex] = useState<number>(0);
  const betsRef = useRef<Bet[]>([]);

  useEffect(() => {
    betsRef.current = bets;
  }, [bets]);

  // Helper function to handle API calls without blocking UI
  const handleAPICall = (apiFunction: () => Promise<any>, fallbackAction: () => void) => {
    // Execute fallback immediately for instant UI response
    fallbackAction();
    
    // Then handle API call in background
    if (authToken) {
      apiFunction().catch((error) => {
        console.error("API call failed:", error);
        // Optionally revert changes or show error notification
      });
    }
  };

  useEffect(() => {
    // lockbets phase
    if (prevGameState !== "lockbets" && gameState === "lockbets") {
      let updatedBets = [...betsRef.current];
      const pendingBets = updatedBets.filter((bet) => bet.pendingBet);
      const totalPendingAmount = pendingBets.reduce(
        (sum, bet) => sum + (typeof bet.amount === "number" ? bet.amount : 0),
        0
      );

      if (balance < totalPendingAmount) {
        showNotification(
          "Insufficient balance for all pending bets!",
          "error"
        );
        updatedBets = updatedBets.map((bet) =>
          bet.pendingBet ? { ...bet, pendingBet: false } : bet
        );
        setBets(updatedBets);
        return;
      }

      // Immediately update UI state
      setBalance((prev) => prev - totalPendingAmount);

      pendingBets.forEach((bet) => {
        const index = updatedBets.findIndex((b) => b.id === bet.id);
        const betAmount = typeof bet.amount === "number" ? bet.amount : 0;
        let newGameId = gameId || Date.now(); // Use timestamp as fallback ID

        // Immediately update bet state for instant UI feedback
        updatedBets[index] = {
          ...bet,
          pendingBet: false,
          hasPlacedBet: true,
          gameId: newGameId,
        };

        // Handle API call in background
        if (authToken && walletType) {
          startGame(betAmount, walletType, authToken)
            .then((res) => {
              const actualGameId = res.game_id;
              const newBalance = res[walletType];
              
              // Update with real values from API
              setBalance(newBalance);
              setGameId(actualGameId);
              
              // Update bet with actual game ID
              setBets(currentBets => 
                currentBets.map(b => 
                  b.id === bet.id ? { ...b, gameId: actualGameId } : b
                )
              );
            })
            .catch((err) => {
              console.error("StartGame Error:", err);
              // Revert bet state on error
              setBets(currentBets => 
                currentBets.map(b => 
                  b.id === bet.id ? { ...b, pendingBet: false, hasPlacedBet: false } : b
                )
              );
              // Restore balance
              setBalance(prev => prev + betAmount);
            });
        }
      });

      setBets([...updatedBets]);
    }

    // driving -> crashed or crashed states
    if ((prevGameState === "driving" && gameState === "crashed") || gameState === "crashed") {
      const updatedBets = betsRef.current.map((bet) => {
        if (bet.hasPlacedBet) {
          // Handle crash API in background
          if (authToken) {
            crashedAPI(authToken, multiplier, null).catch((error) => {
              console.error("Crash API failed", error);
            });
          }

          return {
            ...bet,
            hasPlacedBet: false,
            pendingBet: bet.isAutoBetEnabled,
            gameId: 0,
          };
        }
        return bet;
      });

      setBets(updatedBets);
    }

    setPrevGameState(gameState);
  }, [
    gameState,
    setBalance,
    balance,
    gameId,
    setGameId,
    authToken,
    walletType,
    multiplier,
  ]);

  useEffect(() => {
    if (gameState === "driving") {
      const betsToProcess: Array<{
        bet: Bet;
        index: number;
        cashoutKey: string;
      }> = [];

      bets.forEach((bet, index) => {
        const cashoutKey = `${bet.id}-${bet.gameId}`;
        const alreadyCashedOut = cashedOutRef.current.has(cashoutKey);

        const isValidAutoCashOut =
          bet.hasPlacedBet &&
          bet.isAutoCashOutEnabled &&
          typeof bet.autoCashOut === "number" &&
          multiplier >= bet.autoCashOut &&
          typeof bet.gameId === "number" &&
          (authToken ? bet.gameId > 0 : bet.gameId === 0);

        if (isValidAutoCashOut && !alreadyCashedOut) {
          cashedOutRef.current.add(cashoutKey);
          betsToProcess.push({ bet, index, cashoutKey });
        }
      });

      if (betsToProcess.length > 0) {
        let updatedBets = [...bets];

        betsToProcess.forEach(({ bet, index, cashoutKey }) => {
          const betAmount = typeof bet.amount === "number" ? bet.amount : 0;
          const cashOutAmount = betAmount * multiplier;

          console.log(
            `🎯 Auto cashout for bet ${index} with gameId ${bet.gameId}`
          );

          // Immediately update UI state
          setBalance(
            (prev) => prev + cashOutAmount,
            walletType === "commissions" ? "commissions" : "with_balance"
          );

          updatedBets[index] = {
            ...bet,
            hasPlacedBet: false,
            pendingBet: bet.isAutoBetEnabled,
          };

          playCashoutSound();
          showNotification(
            `Auto cashed out at ${multiplier.toFixed(2)}x! Won ${cashOutAmount.toFixed(2)} XAF`,
            "success"
          );

          // Handle API call in background
          if (authToken) {
            cashoutAPI(cashOutAmount, authToken, multiplier, bet.gameId)
              .catch((error) => {
                console.error(`❌ Cashout failed for bet ${index}`, error);
                cashedOutRef.current.delete(cashoutKey);
                // Optionally revert balance or show error
                // showNotification(
                //   `Cashout failed for bet ${index + 1}. Please try manual cashout.`,
                //   "error"
                // );
              });
          }
        });

        setBets([...updatedBets]);
      }
    }

    if (gameState === "betting") {
      cashedOutRef.current.clear();
    }
  }, [gameState, multiplier, bets, authToken, walletType]);

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
        gameId: 0,
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
    <div className="bg-black bg-opacity-90 text-white rounded-lg border border-gray-800 shadow-lg overflow-hidden">
      <audio ref={cashoutSoundRef} preload="auto">
        <source src="/sounds/cashout.wav" type="audio/wav" />
      </audio>
      
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
          <div>
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
                    onActivate={() => setActiveBetIndex(index)}
                    canRemove={bets.length > 1}
                    authToken={authToken}
                    gameId={gameId}
                    walletType={walletType}
                  />
                ))}
              </div>

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
          <div className="space-y-4">
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <h3 className="text-lg font-medium mb-4 text-purple-400">
                Wallet Settings
              </h3>

              <div className="space-y-4">
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
                      <option value="" disabled>
                        -- Select Wallet --
                      </option>
                      <option value="balance">Deposit Wallet</option>
                      <option value="bonus">Bonus Wallet</option>
                      <option value="with_balance">Withdrawable Wallet</option>
                      <option value="commissions">Commissions Wallet</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        ></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">
                      Current Balance:
                    </span>
                    <span className="text-lg font-bold text-white">
                      {balance.toFixed(2)} XAF
                    </span>
                  </div>
                  <div className="h-1 w-full bg-gray-700 mt-3 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-full"
                      style={{ width: `${Math.min(100, balance / 10)}%` }}
                    />
                  </div>
                </div>

                <div className="bg-gray-800 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">
                    Wallet Status
                  </h4>
                  <div className="flex items-center space-x-2 text-xs text-gray-400">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        walletType ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></div>
                    <span>
                      {walletType ? "Wallet Selected" : "No Wallet Selected"}
                    </span>
                  </div>

                  {!walletType && (
                    <div className="mt-2 text-xs text-red-400 bg-red-900 bg-opacity-30 p-2 rounded">
                      Please select a wallet to place bets
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-blue-900 bg-opacity-20 rounded-lg p-3 border border-blue-800">
              <h4 className="text-sm font-medium text-blue-400">
                Wallet Information
              </h4>
              <ul className="mt-2 text-xs text-gray-400 space-y-1">
                <li>
                  • <span className="text-white">Deposit Wallet</span>: Main
                  wallet for your deposits
                </li>
                <li>
                  • <span className="text-white">Bonus Wallet</span>: Contains
                  bonus funds{" "}
                </li>
                <li>
                  • <span className="text-white">Withdrawable Wallet</span>:
                  Funds available for immediate withdrawal
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BettingControls;