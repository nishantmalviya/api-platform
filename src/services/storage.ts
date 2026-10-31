import type { StateStorage } from "zustand/middleware";

const PREFIX = "api-studio";

/**
 * localStorage backed state storage for the API Studio workspace store.
 * Values are JSON serialized by the zustand persist `createJSONStorage` wrapper.
 */
export const apiStudioStorage: StateStorage = {
  getItem: (name: string) =>
    window.localStorage.getItem(`${PREFIX}.${name}`) ?? null,
  setItem: (name: string, value: string) => {
    window.localStorage.setItem(`${PREFIX}.${name}`, value);
  },
  removeItem: (name: string) => {
    window.localStorage.removeItem(`${PREFIX}.${name}`);
  },
};
