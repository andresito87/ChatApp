import { init, getLocaleFromNavigator, addMessages } from "svelte-i18n";
import en from "./locales/en.json";
import es from "./locales/es.json";
addMessages("en-US", en);
addMessages("es-ES", es);
init({
  fallbackLocale: "en-US",
  initialLocale: getLocaleFromNavigator(),
});
