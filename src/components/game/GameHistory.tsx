// "use client";
// import React, { useState, useMemo } from "react";
// import { History, User, DollarSign, Activity, Users, Trophy } from "lucide-react";
// import { useGameContext } from "./GameContext";

// // Extend the history item type to include username, bet amount, and status
// type HistoryItem = {
//   username: string;
//   bet: number;
//   multiplier: string;
//   result: "crash" | "cashout";
//   winnings?: string;
//   status: "win" | "loss" | "pending";
// };

// type TabType = "global" | "personal";

// const GameHistory: React.FC = () => {
//   const { history, currentUser } = useGameContext();
//   const [activeTab, setActiveTab] = useState<TabType>("global");
  
//   // Filter history based on active tab
//   const filteredHistory = useMemo(() => {
//     if (activeTab === "personal") {
//       return history.filter(item => item.username === currentUser);
//     }
//     return history;
//   }, [history, activeTab, currentUser]);
  
//   // Calculate statistics based on filtered history
//   const highestMultiplier = filteredHistory.length > 0 
//     ? Math.max(...filteredHistory.map(h => parseFloat(h.multiplier))).toFixed(2)
//     : "0.00";
    
//   const averageCrashPoint = filteredHistory.length > 0 
//     ? (filteredHistory.reduce((acc, h) => acc + parseFloat(h.multiplier), 0) / filteredHistory.length).toFixed(2)
//     : "0.00";

//   return (
//     <div className="bg-gray-800 rounded-lg p-4 h-full shadow-lg">
//       <div className="flex items-center mb-4 border-b border-gray-700 pb-2">
//         <History className="mr-2 text-blue-400" size={20} />
//         <h3 className="font-medium text-lg">Game History</h3>
//       </div>
      
//       {/* Tab Navigation */}
//       <div className="flex mb-4 border-b border-gray-700">
//         <button
//           onClick={() => setActiveTab("global")}
//           className={`flex items-center px-4 py-2 ${
//             activeTab === "global" 
//               ? "border-b-2 border-blue-400 text-blue-400" 
//               : "text-gray-400 hover:text-gray-200"
//           }`}
//         >
//           <Users size={16} className="mr-2" />
//           <span>All Players</span>
//         </button>
//         <button
//           onClick={() => setActiveTab("personal")}
//           className={`flex items-center px-4 py-2 ${
//             activeTab === "personal" 
//               ? "border-b-2 border-blue-400 text-blue-400" 
//               : "text-gray-400 hover:text-gray-200"
//           }`}
//         >
//           <Trophy size={16} className="mr-2" />
//           <span>My History</span>
//         </button>
//       </div>
      
//       {/* Table header */}
//       <div className="grid grid-cols-4 gap-2 mb-2 text-sm text-gray-400 px-2">
//         <div className="flex items-center">
//           <User size={14} className="mr-1" />
//           <span>Player</span>
//         </div>
//         <div className="flex items-center">
//           <DollarSign size={14} className="mr-1" />
//           <span>Bet</span>
//         </div>
//         <div>Multiplier</div>
//         <div className="flex items-center">
//           <Activity size={14} className="mr-1" />
//           <span>Status</span>
//         </div>
//       </div>
      
//       <div className="divide-y divide-gray-700 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600">
//         {filteredHistory.length > 0 ? (
//           filteredHistory.map((item: HistoryItem, index) => (
//             <div key={index} className="py-3 grid grid-cols-4 gap-2 items-center hover:bg-gray-750 px-2 transition-colors duration-150">
//               <div className="font-medium truncate">
//                 {item.username === currentUser ? (
//                   <span className="text-blue-400">{item.username} (You)</span>
//                 ) : (
//                   item.username
//                 )}
//               </div>
              
//               <div className="font-mono">${item.bet.toFixed(2)}</div>
              
//               <div className="font-mono">{item.multiplier}x</div>
              
//               <div>
//                 <span className={`px-2 py-1 rounded text-xs font-medium ${
//                   item.status === "win" 
//                     ? "bg-green-500/20 text-green-400" 
//                     : item.status === "loss"
//                       ? "bg-red-500/20 text-red-400"
//                       : "bg-yellow-500/20 text-yellow-400"
//                 }`}>
//                   {item.status === "win" 
//                     ? `+${item.winnings}` 
//                     : item.status === "loss" 
//                       ? "CRASH" 
//                       : "PENDING"}
//                 </span>
//               </div>
//             </div>
//           ))
//         ) : (
//           <div className="py-8 text-center text-gray-400">
//             {activeTab === "personal" 
//               ? "You haven't placed any bets yet."
//               : "No game history available."}
//           </div>
//         )}
//       </div>
      
//       {/* Stats section with improved styling */}
//       <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-2 gap-4">
//         <div className="bg-gray-750 rounded-lg p-3">
//           <div className="text-gray-400 text-xs mb-1">
//             {activeTab === "personal" ? "Your Highest Multiplier" : "Highest Multiplier"}
//           </div>
//           <div className="font-bold text-yellow-400 text-lg">{highestMultiplier}x</div>
//         </div>
        
//         <div className="bg-gray-750 rounded-lg p-3">
//           <div className="text-gray-400 text-xs mb-1">
//             {activeTab === "personal" ? "Your Average Crash" : "Average Crash Point"}
//           </div>
//           <div className="font-bold text-blue-400 text-lg">{averageCrashPoint}x</div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default GameHistory;