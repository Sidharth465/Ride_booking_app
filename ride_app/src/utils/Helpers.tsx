import { Href, router } from "expo-router";

export const resetAndNavigate = (newPath: Href) => {
  router.replace(newPath);
};
