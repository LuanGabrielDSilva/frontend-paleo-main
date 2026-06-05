/* =========================================================
   TYPES
========================================================= */

export type MissionType =
  | "clicks"
  | "upgradeCost"
  | "coins"
  | "rebirths";

export interface Mission {
  id: string;

  text: string;

  type: MissionType;

  goal: number;

  reward: number;

  completed: boolean;
}

/* =========================================================
   MISSIONS
========================================================= */

export const missions: Mission[] = [

  /* CLICK MISSIONS */
  {
    id: "click_10",
    text: "Faça 10 cliques",
    type: "clicks",
    goal: 10,
    reward: 100,
    completed: false,
  },

  {
    id: "click_100",
    text: "Faça 100 cliques",
    type: "clicks",
    goal: 100,
    reward: 500,
    completed: false,
  },

  {
    id: "click_1000",
    text: "Faça 1.000 cliques",
    type: "clicks",
    goal: 1000,
    reward: 2500,
    completed: false,
  },

  /* UPGRADE MISSIONS */
  {
    id: "upgrade_100",
    text: "Compre um upgrade de 100 moedas",
    type: "upgradeCost",
    goal: 100,
    reward: 200,
    completed: false,
  },

  {
    id: "upgrade_1000",
    text: "Compre um upgrade de 1.000 moedas",
    type: "upgradeCost",
    goal: 1000,
    reward: 1500,
    completed: false,
  },

  /* COIN MISSIONS */
  {
    id: "coins_10k",
    text: "Acumule 10 mil moedas",
    type: "coins",
    goal: 10000,
    reward: 3000,
    completed: false,
  },

  {
    id: "coins_100k",
    text: "Acumule 100 mil moedas",
    type: "coins",
    goal: 100000,
    reward: 25000,
    completed: false,
  },

  /* REBIRTH MISSIONS */
  {
    id: "rebirth_1",
    text: "Faça 1 rebirth",
    type: "rebirths",
    goal: 1,
    reward: 50000,
    completed: false,
  },

  {
    id: "rebirth_5",
    text: "Faça 5 rebirths",
    type: "rebirths",
    goal: 5,
    reward: 500000,
    completed: false,
  },

];