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