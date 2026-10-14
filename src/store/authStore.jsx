import { createContext, useContext, useState, useCallback } from "react";
import {
  getAccessToken,
  getUserInfo,
  setTokens,
  setUserInfo,
  clearAuth,
} from "@/utils/token";
import { authService } from "@/services/authService";
import { toast } from "sonner";

const AuthContext = createContext(null);

/**
 * Parse lỗi đăng nhập từ backend hoặc Keycloak sang thông báo tiếng Việt thân thiện.
 *
 * Backend có thể forward nguyên error Keycloak vào field "message", ví dụ:
 *   { message: "Login failed: 400 — {\"error\":\"invalid_grant\",\"error_description\":\"Account disabled\"}" }
 * Hoặc Keycloak trả thẳng:
 *   { error: "invalid_grant", error_description: "Account disabled" }
 *
 * Giải pháp: gom toàn bộ text lại rồi mới map sang tiếng Việt.
 */
function parseLoginError(error) {
  const responseData = error.response?.data;

  // Gom tất cả text có thể chứa keyword Keycloak để tìm kiếm
  const allText = [
    responseData?.message,
    responseData?.error_description,
    responseData?.errorDescription,
    responseData?.error,
    typeof responseData === "string" ? responseData : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  // Map sang thông báo tiếng Việt theo keyword
  if (allText.includes("account disabled") || allText.includes("disabled")) {
    return "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.";
  }
  if (allText.includes("invalid user credentials") || allText.includes("invalid_credentials")) {
    return "Tên đăng nhập hoặc mật khẩu không chính xác.";
  }
  if (allText.includes("account is not fully set up")) {
    return "Tài khoản chưa được thiết lập đầy đủ. Vui lòng liên hệ quản trị viên.";
  }
  if (allText.includes("account temporarily disabled")) {
    return "Tài khoản tạm thời bị vô hiệu do đăng nhập sai nhiều lần. Vui lòng thử lại sau.";
  }

  // Nếu backend có message riêng (không phải lỗi Keycloak đã biết) thì dùng luôn
  if (responseData?.message) return responseData.message;

  return "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getUserInfo());
  const [isLoading, setIsLoading] = useState(false);

  const isAuthenticated = !!getAccessToken();
  const isAdmin = user?.role === "ADMIN" || user?.roles?.includes("ADMIN");

  const login = useCallback(async (credentials) => {
    setIsLoading(true);
    try {
      const { data } = await authService.login(credentials);
      setTokens(data.accessToken, data.refreshToken);
      
      // Lấy thông tin user hiện tại
      const { data: userProfile } = await authService.getMe();
      
      setUserInfo(userProfile);
      setUser(userProfile);
      
      toast.success("Đăng nhập thành công!");
      return { success: true, isAdmin: userProfile.role === "ADMIN" || userProfile.roles?.includes("ADMIN") };
    } catch (error) {
      const msg = parseLoginError(error);
      toast.error(msg);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data) => {
    setIsLoading(true);
    try {
      await authService.register(data);
      toast.success("Đăng ký thành công! Vui lòng đăng nhập.");
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || "Đăng ký thất bại";
      toast.error(msg);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    toast.success("Đã đăng xuất");
    window.location.href = "/login";
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isAdmin, isLoading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
