import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import { useAuth } from "@/store/authStore";

export default function LoginCallbackPage() {
  const navigate = useNavigate();
  const { completeGoogleLogin } = useAuth();
  const started = useRef(false);
  const [message, setMessage] = useState("Đang hoàn tất đăng nhập Google...");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const finishLogin = async () => {
      const params = new URLSearchParams(window.location.search);
      const expectedState = sessionStorage.getItem("sportify_oauth_state");
      const verifier = sessionStorage.getItem("sportify_oauth_verifier");
      const code = params.get("code");
      const state = params.get("state");
      sessionStorage.removeItem("sportify_oauth_state");
      sessionStorage.removeItem("sportify_oauth_verifier");

      if (params.has("error")) throw new Error(params.get("error_description") || params.get("error"));
      if (!code || !expectedState || state !== expectedState || !verifier) {
        throw new Error("Callback đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.");
      }

      const redirectUri = `${window.location.origin}/login-callback`;
      const { data: tokens } = await authService.exchangeGoogleCode({ code, codeVerifier: verifier, redirectUri });
      const user = await completeGoogleLogin(tokens);
      window.history.replaceState({}, document.title, "/login-callback");
      navigate(user.role === "ADMIN" || user.roles?.includes("ADMIN") ? "/admin" : "/", { replace: true });
    };

    finishLogin().catch((error) => {
      setMessage("Đăng nhập Google thất bại.");
      toast.error(error.response?.data?.message || error.message || "Đăng nhập Google thất bại.");
      navigate("/login", { replace: true });
    });
  }, [completeGoogleLogin, navigate]);

  return <div className="flex min-h-[60vh] items-center justify-center">{message}</div>;
}
