import { Link, NavLink, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Calendar,
  LogOut,
  Menu,
  X,
  User,
  LayoutDashboard,
} from "lucide-react";
import { useState } from "react";

const NAV_LINKS = [
  { to: "/", label: "Trang chủ" },
  { to: "/fields", label: "Sân thể thao" },
  { to: "/bookings", label: "Lịch đặt của tôi" },
];

export function Header() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleNavClick = (to) => {
    if (to === "/bookings") {
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
    }
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md glass">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Trophy className="h-4 w-4" />
          </div>
          <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
            Sportify
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors hover:text-primary ${isActive ? "text-primary" : "text-muted-foreground"
                }`
              }
              onClick={() => handleNavClick(link.to)}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Right Side */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/admin")}
                  className="gap-2"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Admin
                </Button>
              )}
              <button
                onClick={() => navigate("/profile")}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md px-2 py-1 hover:bg-accent"
                title="Xem hồ sơ cá nhân"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User className="h-3.5 w-3.5" />
                </div>
                <span className="font-medium">{user?.username || user?.name}</span>
              </button>
              <Button variant="ghost" size="sm" onClick={logout} className="gap-2">
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
                Đăng nhập
              </Button>
              <Button size="sm" onClick={() => navigate("/register")}>
                Đăng ký
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-3">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              onClick={() => handleNavClick(link.to)}
              className={({ isActive }) =>
                `block text-sm font-medium py-2 ${isActive ? "text-primary" : "text-muted-foreground"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <div className="border-t border-border pt-3 flex flex-col gap-2">
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { navigate("/admin"); setMobileOpen(false); }}
                  >
                    Admin Dashboard
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start gap-2"
                  onClick={() => { navigate("/profile"); setMobileOpen(false); }}
                >
                  <User className="h-4 w-4" />
                  {user?.username || user?.name}
                </Button>
                <Button variant="ghost" size="sm" onClick={logout}>
                  Đăng xuất
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { navigate("/login"); setMobileOpen(false); }}
                >
                  Đăng nhập
                </Button>
                <Button
                  size="sm"
                  onClick={() => { navigate("/register"); setMobileOpen(false); }}
                >
                  Đăng ký
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
