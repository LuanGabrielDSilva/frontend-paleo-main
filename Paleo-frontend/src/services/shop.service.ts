import api from "./api";

export type Product = {
  id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
};

export const ShopService = {
  async listProducts(): Promise<Product[]> {
    const { data } = await api.get("/products");
    return data;
  },

  async addToCart(product_id: string) {
    const { data } = await api.post("/cart/add", {
      product_id,
      quantity: 1
    });
    return data;
  }
};