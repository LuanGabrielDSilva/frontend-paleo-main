// src/services/reward.service.ts

import api from "./api";

export async function rewardPlayer(
  userId: string,
  coins: number
) {
  const response = await api.post("/reward", {
    userId,
    coins,
  });

  return response.data;
}