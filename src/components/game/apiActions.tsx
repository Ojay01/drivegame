import { createApiClient } from "@/lib/api";
import { BalanceResponse } from "@/lib/types/apitypes";

export const startGame = async (
  stake: number,
  walletType: "balance" | "with_balance" | "bonus",
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

export const getBalance = async (authToken: string): Promise<BalanceResponse> => {
  const api = createApiClient(authToken);

  const response = await api.get<BalanceResponse>("/get-balance");
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
  amount: any,
    authToken: string,
     score: number,
  data?: any,
) => {
  const api = createApiClient(authToken);

  const response = await api.post("/cashout", {
    amount,
    score,
    data,
  });

  return response.data;
};
