export interface BalanceResponse {
  balance: number;
  bonus: number;
  with_balance: number;
  commissions: number,
}


export interface Game {
  id: number;
  username: string;
  user_id: number;
  type: string;
  stake: number;
  result: string;
  score: number;
  profit: number;
  data: any;
  created_at: string;
  formatted_date: string;
  time_ago: string;
}

export interface GetGamesResponse {
  games: Game[];
  authUser: number;
}
