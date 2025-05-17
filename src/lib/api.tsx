import axios from "axios";

export const createApiClient = (authToken: string | null) => {
  return axios.create({
    baseURL: "http://localhost:8000/api/drives",
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
    },
  });
};
