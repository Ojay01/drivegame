import { useState, useMemo, useEffect } from "react";
import { History, Users, Trophy, TrendingUp, ArrowUpDown } from "lucide-react";
import { getGames } from "./apiActions";
import { Game } from "@/lib/types/apitypes";

type TabType = "global" | "personal" | "topbets";

interface GameHistoryProps {
  authToken: string | null;
  clearSession?: boolean; 
}

const GameHistory: React.FC<GameHistoryProps> = ({ 
  authToken, 
  clearSession = false
}) => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("global");
  const [authUserId, setAuthUserId] = useState<number | null>(null);
  const [lastClearSession, setLastClearSession] = useState<boolean>(false);
  const [liveGames, setLiveGames] = useState<Game[]>([]);
  const [showPersonalTopBets, setShowPersonalTopBets] = useState<boolean>(false);
  

useEffect(() => {
  if (clearSession && !lastClearSession) {
    setGames([]);
    setLiveGames([]); 
  }
  setLastClearSession(clearSession);
}, [clearSession, lastClearSession]);



  useEffect(() => {
  if (!authToken) return;

  let isMounted = true;

  const fetchGames = async () => {
    try {
      const response = await getGames(authToken);
      if (!isMounted) return;

      setGames(response.games);
      setAuthUserId(response.authUser);

      // Update liveGames
      setLiveGames((prevLiveGames) => {
        const updatedLiveGames = [...prevLiveGames];
        const existingIds = new Set(prevLiveGames.map(g => g.id));

        for (const newGame of response.games) {
          const existingIndex = updatedLiveGames.findIndex(g => g.id === newGame.id);

          // Add if new and was playing
          if (!existingIds.has(newGame.id) && newGame.result === "playing") {
            updatedLiveGames.push(newGame);
          }

          // Update existing entry
          if (existingIndex !== -1) {
            if (newGame.result === "lost") {
              // Remove if lost
              updatedLiveGames.splice(existingIndex, 1);
            } else {
              // Update if still playing or became won
              updatedLiveGames[existingIndex] = newGame;
            }
          }
        }

        return updatedLiveGames;
      });

      setError(null);
    } catch (err) {
      if (isMounted) {
        setError("Failed to load game history");
      }
    } finally {
      if (isMounted) setLoading(false);
    }
  };

  fetchGames();
  const intervalId = setInterval(fetchGames, 1000);

  return () => {
    isMounted = false;
    clearInterval(intervalId);
  };
}, [authToken]);

  // Calculate statistics for live games
  const liveStats = useMemo(() => {
    const totalCashoutCount = liveGames.filter(game => game.result === "won").length;
    const totalLiveCount = liveGames.length;
    
    return {
      totalCashoutCount,
      totalLiveCount
    };
  }, [liveGames]);

  // Filter games based on active tab
  const filteredGames = useMemo(() => {
    if (activeTab === "personal" && authUserId) {
      const personalGames = games.filter(game => String(game.user_id) === String(authUserId));
      
      // Sort by stake if showPersonalTopBets is enabled
      if (showPersonalTopBets) {
        return personalGames.sort((a, b) => (b.stake || 0) - (a.stake || 0));
      }
      
      return personalGames;
    } else if (activeTab === "global") {
      // Show all games for global tab (playing, won, lost)
      return liveGames;
    } else if (activeTab === "topbets") {
      // Show top 25 bets sorted by bet amount (stake) in descending order
      return liveGames
        .sort((a, b) => (b.stake || 0) - (a.stake || 0))
        .slice(0, 25);
    }
    return games;
  }, [games, activeTab, authUserId, liveGames, showPersonalTopBets]);

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

  // Helper function to generate avatar initials
  const getAvatarInitials = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  // Helper function to generate consistent avatar color
  const getAvatarColor = (username: string) => {
    const colors = [
      "bg-red-500",
      "bg-blue-500", 
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500"
    ];
    const index = username.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Helper function to get the display multiplier and payout
  const getDisplayValues = (game: Game) => {
    const multiplier = game.score || 0;
    const payout = game.stake * multiplier;
    
    return {
      multiplier,
      payout
    };
  };

  // Helper function to get row background color based on status
  const getRowBackground = (game: Game) => {
    if (game.result === "won") return "bg-green-900/20 border-green-500/30";
    if (game.result === "lost") return "bg-red-900/20 border-red-500/30";
    return "bg-gray-700/30 border-gray-600/30"; // playing
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
      <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-2">
        <div className="flex items-center">
          <History className="mr-2 text-blue-400 flex-shrink-0" size={20} />
          <h3 className="font-medium text-base sm:text-lg truncate">Game History</h3>
        </div>
        
        {/* Live Statistics */}
        <div className="flex items-center text-xs sm:text-sm overflow-hidden">
          <div className="flex items-center text-gray-300 whitespace-nowrap">
            <span className="font-mono text-green-400">{liveStats.totalCashoutCount}</span>
            <span className="mx-1 text-gray-500">/</span>
            <span className="font-mono text-orange-400">{liveStats.totalLiveCount}</span>
          </div>
        </div>
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
          <span className="text-sm sm:text-base">Live</span>
        </button>
        <button
          onClick={() => setActiveTab("topbets")}
          className={`flex items-center px-3 sm:px-4 py-2 whitespace-nowrap flex-shrink-0 ${
            activeTab === "topbets" 
              ? "border-b-2 border-blue-400 text-blue-400" 
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <TrendingUp size={16} className="mr-2" />
          <span className="text-sm sm:text-base">Top </span>
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

      {/* Personal Top Bets Toggle - Only show when on personal tab */}
      {activeTab === "personal" && (
        <div className="flex justify-end mb-3">
          <button
            onClick={() => setShowPersonalTopBets(!showPersonalTopBets)}
            className={`flex items-center px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              showPersonalTopBets
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                : "bg-gray-700/50 text-gray-400 border border-gray-600/30 hover:bg-gray-700 hover:text-gray-300"
            }`}
          >
            <ArrowUpDown size={14} className="mr-1.5" />
            Top Bets
          </button>
        </div>
      )}
      
      <div className="max-h-96 sm:max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600">
        {filteredGames.length > 0 ? (
          <div className="space-y-1">
            {filteredGames.map((game: Game) => {
              const isCurrentUser = isCurrentUserGame(game);
              const avatarInitials = getAvatarInitials(game.username);
              const avatarColor = getAvatarColor(game.username);
              const { multiplier, payout } = getDisplayValues(game);
              const multiplierColor = getMultiplierColor(multiplier);
              const rowBg = getRowBackground(game);
              
              return (
                <div key={game.id} className={`${rowBg} border rounded-lg w-fit p-1 transition-all duration-200`}>
                  <div className="flex items-center justify-between">
                    {/* Left side - Avatar and Username */}
                    <div className="flex items-center min-w-0 flex-shrink-0" style={{ width: '120px' }}>
                      <div className={`w-6 h-6 rounded-full ${avatarColor} flex items-center justify-center text-white font-medium text-sm mr-3 flex-shrink-0`}>
                        {avatarInitials}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate text-sm">
                          {isCurrentUser ? (
                            <span className="text-blue-400">{game.username}</span>
                          ) : (
                            <span className="text-white">{game.username}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bet Amount */}
                    <div className="flex items-center text-gray-300 flex-shrink-0 min-w-0" style={{ width: '80px' }}>
                      <span className="font-mono text-sm">₣{game.stake.toFixed(2)}</span>
                    </div>

                    {/* Multiplier */}
                    <div className={`font-mono font-bold text-sm flex-shrink-0 min-w-0 text-center ${multiplierColor}`} style={{ width: '60px' }}>
                      {multiplier.toFixed(2)}x
                    </div>

                    {/* Payout or Status */}
                    <div className="flex items-center flex-shrink-0 min-w-0 text-right justify-end" style={{ width: '80px' }}>
                      {game.result === "won" ? (
                        <span className="font-mono text-sm text-gray-300">₣{payout.toFixed(2)}</span>
                      ) : (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          game.result === "playing" 
                            ? "bg-yellow-500/20 text-yellow-400" 
                            : "bg-red-500/20 text-red-400"
                        }`}>
                          {game.result === "playing" ? "PLAYING" : "CRASH"}
                        </span>
                      )}
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
              : activeTab === "topbets"
              ? "No live bets found."
              : "No active games found."}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameHistory;