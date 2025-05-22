import React, { useState, useMemo, useEffect } from "react";
import { History, User, DollarSign, Activity, Users, Trophy } from "lucide-react";
import { getGames } from "./apiActions";
import { Game } from "@/lib/types/apitypes";

type TabType = "global" | "personal";

interface GameHistoryProps {
  authToken: string | null;
}

const GameHistory: React.FC<GameHistoryProps> = ({ authToken }) => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("global");
  const [authUserId, setAuthUserId] = useState<number | null>(null);

  // Fetch games data only when authToken is non-null
  useEffect(() => {
    if (!authToken) return;

    let isMounted = true;
    const fetchGames = async () => {
      try {
        const response = await getGames(authToken);
        if (isMounted) {
          setGames(response.games);
          setAuthUserId(response.authUser);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError("Failed to load game history");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchGames(); // Initial fetch

    const intervalId = setInterval(fetchGames, 1000); // Poll every second

    return () => {
      isMounted = false;
      clearInterval(intervalId); // Clean up
    };
  }, [authToken]);

  // Filter games based on active tab
  const filteredGames = useMemo(() => {
    if (activeTab === "personal" && authUserId) {
      // Compare authUserId with game.user_id (handle both string and number types)
      return games.filter(game => String(game.user_id) === String(authUserId));
    }
    return games;
  }, [games, activeTab, authUserId]);

  // Helper function to get status display
  const getStatusDisplay = (game: Game) => {
    if (game.result === "won") {
      return {
        label: `WON`,
        className: "bg-green-500/20 text-green-400"
      };
    } else if (game.result === "lost") {
      return {
        label: "CRASH",
        className: "bg-red-500/20 text-red-400"
      };
    } else {
      return {
        label: "PLAYING",
        className: "bg-yellow-500/20 text-yellow-400"
      };
    }
  };

  // Helper function to get multiplier color
  const getMultiplierColor = (score: number | null | undefined) => {
    if (!score || score === 0) return "text-gray-400";
    if (score < 1.5) return "text-red-400";
    if (score < 3) return "text-yellow-400";
    if (score < 5) return "text-green-400";
    return "text-purple-400";
  };

  // Helper function to check if game belongs to current user
  const isCurrentUserGame = (game: Game) => {
    return authUserId && String(game.user_id) === String(authUserId);
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 h-full shadow-lg">
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-400">Loading game history...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 h-full shadow-lg">
        <div className="flex items-center justify-center h-96">
          <div className="text-red-400">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-3 sm:p-4 h-full shadow-lg">
      <div className="flex items-center mb-4 border-b border-gray-700 pb-2">
        <History className="mr-2 text-blue-400 flex-shrink-0" size={20} />
        <h3 className="font-medium text-base sm:text-lg truncate">Game History</h3>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex justify-between mb-4 border-b border-gray-700 overflow-x-auto">
        <button
          onClick={() => setActiveTab("global")}
          className={`flex items-center px-3 sm:px-4 py-2 whitespace-nowrap flex-shrink-0 ${
            activeTab === "global" 
              ? "border-b-2 border-blue-400 text-blue-400" 
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <Users size={16} className="mr-2" />
          <span className="text-sm sm:text-base">All Players</span>
        </button>
        <button
          onClick={() => setActiveTab("personal")}
          className={`flex items-center px-3 sm:px-4 py-2 whitespace-nowrap flex-shrink-0 ${
            activeTab === "personal" 
              ? "border-b-2 border-blue-400 text-blue-400" 
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <Trophy size={16} className="mr-2" />
          <span className="text-sm sm:text-base">My History</span>
        </button>
      </div>
      
      {/* Desktop Table Header - Hidden on mobile */}
      <div className="hidden sm:grid sm:grid-cols-4 gap-4 mb-2 text-sm text-gray-400 px-2 py-1">
        <div className="flex items-center min-w-0">
          <User size={14} className="mr-1 flex-shrink-0" />
          <span className="truncate">Player</span>
        </div>
        <div className="flex items-center justify-center min-w-0">
          <DollarSign size={14} className="mr-1 flex-shrink-0" />
          <span className="truncate">Bet</span>
        </div>
        <div className="flex justify-center min-w-0">
          <span className="truncate">Multiplier</span>
        </div>
        <div className="flex items-center justify-center min-w-0">
          <Activity size={14} className="mr-1 flex-shrink-0" />
          <span className="truncate">Status</span>
        </div>
      </div>
      
      <div className="max-h-96 sm:max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600">
        {filteredGames.length > 0 ? (
          <div className="divide-y divide-gray-700">
            {filteredGames.map((game: Game) => {
              const status = getStatusDisplay(game);
              const multiplierColor = getMultiplierColor(game.score);
              const isCurrentUser = isCurrentUserGame(game);
              
              return (
                <div key={game.id} className="py-3 hover:bg-gray-750 px-2 transition-colors duration-150">
                  {/* Mobile Layout */}
                  <div className="block sm:hidden space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">
                          {isCurrentUser ? (
                            <span className="text-blue-400">{game.username} (You)</span>
                          ) : (
                            <span className="text-white">{game.username}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${status.className}`}>
                          {status.label}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center text-gray-300">
                        <DollarSign size={12} className="mr-1" />
                        <span className="font-mono">₣{game.stake.toFixed(2)}</span>
                      </div>
                      <div className={`font-mono font-medium ${multiplierColor}`}>
                        {game.score ? `${game.score.toFixed(2)}x` : "0.00x"}
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden sm:grid sm:grid-cols-4 gap-4 items-center">
                    <div className="font-medium min-w-0">
                      <div className="truncate">
                        {isCurrentUser ? (
                          <span className="text-blue-400">{game.username} (You)</span>
                        ) : (
                          <span className="text-white">{game.username}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="font-mono text-center min-w-0">
                      <span className="truncate inline-block">₣{game.stake.toFixed(2)}</span>
                    </div>
                    
                    <div className={`font-mono text-center font-medium min-w-0 ${multiplierColor}`}>
                      <span className="truncate inline-block">
                        {game.score ? `${game.score.toFixed(2)}x` : "0.00x"}
                      </span>
                    </div>
                    
                    <div className="flex justify-center min-w-0">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${status.className} truncate`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-400">
            {activeTab === "personal" 
              ? "You haven't placed any bets yet."
              : "No game history available."}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameHistory;