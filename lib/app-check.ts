import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import { app } from "./firebase";

const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY;

export const appCheck = siteKey
  ? initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(siteKey),
      isTokenAutoRefreshEnabled: true,
    })
  : null;
