import api from "./api";

export const InventoryService = {
  async getInventory() {
    const { data } = await api.get("/inventory");
    return data;
  }
};