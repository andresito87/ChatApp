import { writable } from "svelte/store";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
interface TokenPayload {
  name: string;
}

// function to set the token in the axios header of the request
function setAxiosAuth(token: string) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

// function to create the auth store in svelte
function createAuthStore() {
  const token = localStorage.getItem("authToken");
  if (token) {
    setAxiosAuth(token);
  }

  const { subscribe, set } = writable<string | null>(token);

  return {
    subscribe,
    set: (value: string) => {
      localStorage.setItem("authToken", value);
      set(value);
      if (value) {
        setAxiosAuth(value);
      } else {
        delete axios.defaults.headers.common["Authorization"];
      }
    },
    remove: () => {
      localStorage.removeItem("authToken");
      set(null);
      delete axios.defaults.headers.common["Authorization"];
    },
    getPayload: () => {
      const token = localStorage.getItem("authToken");
      if (token) {
        const decoded: TokenPayload = jwtDecode(token);
        return decoded;
      }
      return null;
    },
  };
}

export const authToken = createAuthStore();
