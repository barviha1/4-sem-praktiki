import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api"
});

export const getProducts = async () => {
  const response = await api.get("/products");
  return response.data;
};

export const deleteProduct = async (id) => {
  await api.delete(`/products/${id}`);
};