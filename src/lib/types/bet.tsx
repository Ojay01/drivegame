
import toast from 'react-hot-toast'; // Import toast
export interface Bet {
  id: number;
  amount: number | string;
  autoCashOut: number | string;
  hasPlacedBet: boolean;
  pendingBet: boolean;
  isAutoCashOutEnabled: boolean;
  isAutoBetEnabled: boolean; 
}

export interface BetControlProps {
  bet: Bet;
  index: number;
  isActive: boolean;
  gameState: string;
  multiplier: number;
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  onUpdate: (updatedBet: Bet) => void;
  onRemove: () => void;
  onActivate: () => void;
  canRemove: boolean;
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
          background: '#10B981',
          color: '#fff',
        },
        iconTheme: {
          primary: '#fff',
          secondary: '#10B981',
        },
      });
      break;
    case "error":
      toast.error(message, {
        duration: 4000,
        style: {
          background: '#EF4444',
          color: '#fff',
        },
        iconTheme: {
          primary: '#fff',
          secondary: '#EF4444',
        },
      });
      break;
    case "info":
      toast(message, {
        duration: 2000,
        icon: '📢',
        style: {
          background: '#3B82F6',
          color: '#fff',
        },
      });
      break;
    default:
      toast(message);
  }
};