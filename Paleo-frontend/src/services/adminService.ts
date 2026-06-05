import api from "./api";

/* ================= USERS ================= */
export const getUsers = () => api.get("/users");
export const createUser = (data: any) => api.post("/users", data);
export const updateUser = (id: string, data: any) => api.put(`/users/${id}`, data);
export const deleteUser = (id: string) => api.delete(`/users/${id}`);

/* ================= ERAS ================= */
export const getEras = () => api.get("/eras");
export const createEra = (data: any) => api.post("/eras", data);
export const updateEra = (id: string, data: any) => api.put(`/eras/${id}`, data);
export const deleteEra = (id: string) => api.delete(`/eras/${id}`);

/* ================= ANIMALS ================= */
export const getAnimals = () => api.get("/animals");
export const createAnimal = (data: any) => api.post("/animals", data);
export const updateAnimal = (id: string, data: any) => api.put(`/animals/${id}`, data);
export const deleteAnimal = (id: string) => api.delete(`/animals/${id}`);