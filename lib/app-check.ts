import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import { app } from "./firebase";

export const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider(
    process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY!
  ),
  isTokenAutoRefreshEnabled: true,
});
