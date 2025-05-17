import axios from "axios";

export const createApiClient = (authToken: string | null) => {
  return axios.create({
    baseURL: "https://betpool.online/api/drives",
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
    },
  });
};
