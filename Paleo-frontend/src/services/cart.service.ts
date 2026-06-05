import api from "./api";

export const CartService = {
  async getCart() {
    const { data } = await api.get("/cart");
    return data;
  },

  async removeItem(itemId: string) {
    const { data } = await api.post("/cart/remove", {
      id: itemId
    });
    return data;
  },

  async clearCart() {
    const { data } = await api.post("/cart/clear");
    return data;
  }
};