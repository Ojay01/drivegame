import axios from "axios";

const DRIVES_URL = process.env.NEXT_PUBLIC_DRIVES_URL || "https://betpool.online/api/drives";


export const createApiClient = (authToken: string | null) => {
  return axios.create({
    baseURL: DRIVES_URL,
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
    },
  });
};
