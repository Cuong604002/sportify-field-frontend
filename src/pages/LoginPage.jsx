import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import React from 'react';

// Hàm xử lý đăng nhập Google qua Keycloak
const handleGoogleLogin = async () => {
  const keycloakBaseUrl = import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8180';
  const realm = import.meta.env.VITE_KEYCLOAK_REALM || 'sportify';
  const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'sportify-app';
  const redirectUri = `${window.location.origin}/login-callback`;

  // kc_idp_hint=google giúp chuyển hướng thẳng tới màn hình chọn tài khoản Gmail
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const verifier = btoa(String.fromCharCode(...randomBytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const challengeBytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  const challenge = btoa(String.fromCharCode(...challengeBytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const state = crypto.randomUUID();
  sessionStorage.setItem('sportify_oauth_state', state);
  sessionStorage.setItem('sportify_oauth_verifier', verifier);
  const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: 'code', scope: 'openid profile email', kc_idp_hint: 'google', code_challenge: challenge, code_challenge_method: 'S256', state });
  const googleAuthUrl = `${keycloakBaseUrl}/realms/${realm}/protocol/openid-connect/auth?${params}`;

  window.location.href = googleAuthUrl;
};

const loginSchema = z.object({
  username: z.string().min(1, "Vui lòng nhập username"),
  password: z.string().min(6, "Mật khẩu ít nhất 6 ký tự"),
});

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data) => {
    const result = await login(data);
    if (result?.success) {
      navigate(result.isAdmin ? "/admin" : "/");
    }
  };

  return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background px-4 py-12">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-3">
              <Trophy className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold">Chào mừng trở lại</h1>
            <p className="text-muted-foreground mt-1 text-sm">Đăng nhập vào Sportify</p>
          </div>

          <Card className="border-border shadow-xl">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username hoặc Email (Gmail)</Label>
                  <Input
                      id="username"
                      placeholder="Username hoặc Email (Gmail)"
                      {...register("username")}
                      className={errors.username ? "border-destructive" : ""}
                  />
                  {errors.username && (
                      <p className="text-xs text-destructive">{errors.username.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mật khẩu</Label>
                  <div className="relative">
                    <Input
                        id="password"
                        type={showPw ? "text" : "password"}
                        placeholder="Nhập mật khẩu"
                        {...register("password")}
                        className={errors.password ? "border-destructive pr-10" : "pr-10"}
                    />
                    <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPw(!showPw)}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                      <p className="text-xs text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                      <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Đang đăng nhập...
                  </span>
                  ) : (
                      "Đăng nhập"
                  )}
                </Button>
              </form>

              {/* Khối ngăn cách & Nút đăng nhập bằng Google */}
              <div className="mt-4">
                <div className="relative flex py-3 items-center">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <span className="flex-shrink mx-4 text-xs uppercase text-gray-400 font-semibold">
                  Hoặc tiếp tục với
                </span>
                  <div className="flex-grow border-t border-gray-200"></div>
                </div>

                <button
                    type="button"
                    onClick={() => handleGoogleLogin().catch(() => {})}
                    className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2.5 px-4 border border-gray-300 rounded-xl shadow-sm transition-all duration-200 active:scale-[0.99]"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                    />
                    <path
                        fill="#FBBC05"
                        d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                    />
                    <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                    />
                  </svg>
                  <span>Đăng nhập bằng Google</span>
                </button>
              </div>

              <div className="mt-4 text-center text-sm text-muted-foreground">
                Chưa có tài khoản?{" "}
                <Link to="/register" className="text-primary font-medium hover:underline">
                  Đăng ký ngay
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  );
}
