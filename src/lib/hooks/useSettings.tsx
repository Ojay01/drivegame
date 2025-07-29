import { useEffect, useState } from "react";
import { createPublicApiClient } from "@/lib/api";

export type FruitSettings = {
  min_bet: number;
  percentage_to_migrate_balance: number;
  max_number: number;
  mode: string;
  number_of_live_fake_bets: number;
  next_round_number: number;
};

export const useDrivesSettings = () => {
  const [settings, setSettings] = useState<FruitSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const authToken = urlParams.get("authToken");
      if (!authToken) return;

      try {
        const api = createPublicApiClient();
        const res = await api.get("/settings");
        console.info("settings", res);
        setSettings(res.data);
      } catch (error) {
        console.error("Failed to fetch fruit settings", error);
      }
    };

    fetchSettings();
  }, []); 

  return settings;
};
