import axiosClient from "./axiosClient";

const authApi = {
  signIn: (username, password) => {
    return axiosClient.post("/auth/signin", { username, password });
  },
};

export default authApi;
