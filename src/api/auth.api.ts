import api from "./axios";

export const registerSystem = (data: any) => {
  return api.post("/systems/register", data);
};

export const loginSystem = (data: any) => {
  return api.post("/auth/login", data);
};
export const logoutSystem = () => {
  return api.post("/auth/logout");
}