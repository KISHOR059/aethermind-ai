import { useEffect } from "react";

import LoginForm from "@/features/auth/components/LoginForm";
import { SIGN_OUT_REASON_KEY } from "@/features/auth/hooks/auth.context";
import { notify } from "@/shared/lib/notifications";

function LoginPage() {
  useEffect(() => {
    if (window.sessionStorage.getItem(SIGN_OUT_REASON_KEY) === "session-expired") {
      window.sessionStorage.removeItem(SIGN_OUT_REASON_KEY);
      notify.error("Your session has expired due to inactivity");
    }
  }, []);

  return <LoginForm />;
}

export default LoginPage;
