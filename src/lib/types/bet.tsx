import toast from "react-hot-toast"; // Import toast
export type WalletType = "balance" | "bonus" | "with_balance" | "commissions";
export interface Bet {
  id: number;
  amount: number | string;
  autoCashOut: number | string;
  hasPlacedBet: boolean;
  pendingBet: boolean;
  isAutoCashOutEnabled: boolean;
  isAutoBetEnabled: boolean;
  walletType?: WalletType;
  gameId?: number;
}

export interface BetControlProps {
  bet: Bet;
  index: number;
  isActive: boolean;
  gameState: string;
  multiplier: number;
  balance: number;
    setBalance: (val: number | ((prev: number) => number), walletType?: WalletType) => void;
  onUpdate: (updatedBet: Bet) => void;
  onRemove: () => void;
  onActivate: () => void;
  canRemove: boolean;
    authToken: string | null;
    gameId: number;
    walletType?: WalletType;
}

export const showNotification = (
  message: string,
  type: "success" | "error" | "info"
) => {
  switch (type) {
    case "success":
      toast.success(message, {
        duration: 3000,
        style: {
          background: "#10B981",
          color: "#fff",
        },
        iconTheme: {
          primary: "#fff",
          secondary: "#10B981",
        },
      });
      break;
    case "error":
      toast.error(message, {
        duration: 4000,
        style: {
          background: "#EF4444",
          color: "#fff",
        },
        iconTheme: {
          primary: "#fff",
          secondary: "#EF4444",
        },
      });
      break;
    case "info":
      toast(message, {
        duration: 2000,
        icon: "📢",
        style: {
          background: "#3B82F6",
          color: "#fff",
        },
      });
      break;
    default:
      toast(message);
  }
};

// Define types
export type GameState = "betting" | "driving" | "crashed" | "waiting";

export interface GameHistoryItem {
  multiplier: string;
  result: string;
  winnings: number;
}

export interface GameContextType {
  balance: number;
  setBalance: (val: number | ((prev: number) => number), walletType?: WalletType) => void;
  betAmount: number;
  setBetAmount: React.Dispatch<React.SetStateAction<number>>;
  autoCashOut: number;
  setAutoCashOut: React.Dispatch<React.SetStateAction<number>>;
  multiplier: number;
  gameId: number; 
  setGameId: React.Dispatch<React.SetStateAction<number>>;
  gameState: GameState;
  history: GameHistoryItem[];
  hasPlacedBet: boolean;
  pendingBet: boolean;
  // placeBet: () => void;
  cancelBet: () => void;
  handleCashOut: () => void;
  adjustBetAmount: (amount: number) => void;
  adjustAutoCashOut: (amount: number) => void;
  carPosition: { x: number; y: number };
  walletType?: WalletType;
   setWalletType: React.Dispatch<
    React.SetStateAction<WalletType>
  >;
}
