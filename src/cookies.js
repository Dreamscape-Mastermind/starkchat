import { CookieJar } from "tough-cookie";

// Create a custom cookie jar with proper configuration
export const cookieJar = new CookieJar(undefined, {
  allowSpecialUseDomain: true,
  looseMode: true,
});
