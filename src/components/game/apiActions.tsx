import { createApiClient } from "@/lib/api";
import { BalanceResponse, GetGamesResponse } from "@/lib/types/apitypes";
import { WalletType } from "@/lib/types/bet";

export const startGame = async (
  stake: number,
  walletType: WalletType,
  authToken: string
) => {
  const api = createApiClient(authToken);

  try {
    const response = await api.post("/start-game", {
      stake,
      walletType,
    });

    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message || "Something went wrong");
    } else {
      throw new Error("Network or server error");
    }
  }
};

export const getBalance = async (
  authToken: string
): Promise<BalanceResponse> => {
  const api = createApiClient(authToken);

  const response = await api.get<BalanceResponse>("/get-balance");
  return response.data;
};

export const getGames = async (
  authToken: string
): Promise<GetGamesResponse> => {
  const api = createApiClient(authToken);
  const response = await api.get<GetGamesResponse>("/get-games");
  return response.data;
};



export const crashedAPI = async (
  authToken: string,
  score?: number,
  data?: any
) => {
  const api = createApiClient(authToken);

  const response = await api.post("/lose", {
    score,
    data,
  });

  return response.data;
};

export const cashoutAPI = async (
  amount: number,
  authToken: string,
  score: number,
  gameId?: number
) => {
  const api = createApiClient(authToken);
  const response = await api.post("/cashout", {
    amount,
    score,
    game_id: gameId,
  });

  return response.data;
};
