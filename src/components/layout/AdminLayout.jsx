import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/store/authStore";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import {
  Trophy,
  LayoutDashboard,
  MapPin,
  Dumbbell,
  Tag,
  CreditCard,
  Calendar,
  LogOut,
  ChevronLeft,
  Menu as MenuIcon,
  X,
  Layers,
  Users,
  BellRing,
  Clock,
  Check,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Menu as AntMenu, Badge, Popover, Empty } from "antd";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import toast from "react-hot-toast";
import { realtimeService } from "@/services/realtimeService";
import notificationService from "@/services/notificationService";

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch unread count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread-notifications"],
    queryFn: () => notificationService.getUnreadCount(),
    refetchInterval: 60000, // Optional: poll every minute just in case SSE fails
  });

  // Fetch recent notifications for popover
  const { data: recentNotifsData } = useQuery({
    queryKey: ["admin-notifications", 0, 5],
    queryFn: () => notificationService.getNotifications(0, 5),
  });
  const recentNotifs = recentNotifsData?.items || [];

  const markAsReadMutation = useMutation({
    mutationFn: (id) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-notifications"]);
      queryClient.invalidateQueries(["unread-notifications"]);
    }
  });

  // Real-time integration (Websocket) - Chỉ invalidateQueries để chuông tự nhảy số, không hiện toast
  useEffect(() => {
    if (!user) return;
    
    const sub = realtimeService.subscribeOwnerNotifications((data) => {
      // Invalidate queries to fetch new notifications
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifications"] });
    });

    return () => {
      realtimeService.disconnect(sub);
    };
  }, [user, queryClient]);

  const menuItems = [
    {
      key: "/admin",
      icon: <LayoutDashboard className="h-4 w-4" />,
      label: "Dashboard",
    },
    {
      key: "sub-fields",
      icon: <Dumbbell className="h-4 w-4" />,
      label: "Quản lý sân",
      children: [
        { key: "/admin/fields", icon: <Dumbbell className="h-4 w-4" />, label: "Sân thể thao" },
        { key: "/admin/locations", icon: <MapPin className="h-4 w-4" />, label: "Cơ sở / Địa điểm" },
        { key: "/admin/sports", icon: <Trophy className="h-4 w-4" />, label: "Môn TT & Loại sân" },
        { key: "/admin/prices", icon: <Tag className="h-4 w-4" />, label: "Bảng giá" },
      ],
    },
    {
      key: "/admin/bookings",
      icon: <Calendar className="h-4 w-4" />,
      label: "Quản lý booking",
    },
    {
      key: "/admin/users",
      icon: <Users className="h-4 w-4" />,
      label: "Quản lý người dùng",
    },
  ];

  const notificationContent = (
    <div className="w-80 sm:w-96 flex flex-col max-h-[80vh]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-slate-800">Thông báo mới</h3>
        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
          {unreadCount > 0 ? `${unreadCount} thông báo mới` : "0 thông báo mới"}
        </span>
      </div>
      <div className="overflow-y-auto flex-1 p-0">
        {recentNotifs.length === 0 ? (
          <div className="p-8"><Empty description="Không có thông báo nào" /></div>
        ) : (
          <div className="divide-y divide-border">
            {recentNotifs.slice(0, 5).map((notif) => (
              <div 
                key={notif.id} 
                className={cn(
                  "px-4 py-3 hover:bg-slate-50 dark:hover:bg-muted/50 transition-colors flex gap-3 group relative cursor-pointer",
                  !notif.isRead ? "bg-primary/5 hover:bg-primary/10" : "bg-white dark:bg-card"
                )}
                onClick={() => {
                  if (!notif.isRead) markAsReadMutation.mutate(notif.id);
                  setPopoverOpen(false);
                  if (notif.type?.startsWith("PAYMENT_SUCCESS")) {
                    const searchId = notif.bookingId || (notif.type.includes(":") ? notif.type.split(":")[1] : "");
                    navigate(searchId ? `/admin/bookings?search=${searchId}` : `/admin/bookings`);
                  } else {
                    navigate(`/admin/bookings`);
                  }
                }}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5",
                  !notif.isRead ? "bg-primary text-primary-foreground" : "bg-slate-100 text-slate-400 dark:bg-muted dark:text-muted-foreground"
                )}>
                  <BellRing className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0 pr-8">
                  <p className={cn("text-sm truncate", !notif.isRead ? "font-semibold text-slate-900" : "font-medium text-slate-500 dark:text-slate-400")}>
                    {notif.title}
                  </p>
                  <p className={cn("text-xs mt-0.5 line-clamp-2", !notif.isRead ? "text-slate-800" : "text-slate-500 dark:text-muted-foreground")}>
                    {notif.message}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {notif.createdAt && format(new Date(notif.createdAt), "HH:mm, dd/MM", { locale: vi })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="p-2 border-t border-border bg-muted/20">
        <Button 
          variant="ghost" 
          className="w-full text-sm h-8 text-primary hover:text-primary" 
          onClick={() => {
            setPopoverOpen(false);
            navigate("/admin/notifications");
          }}
        >
          Xem tất cả thông báo
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r border-border bg-card transition-all duration-300 z-30",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          {sidebarOpen && (
            <div className="flex items-center gap-2 font-bold">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Trophy className="h-4 w-4" />
              </div>
              <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent text-sm">
                Sportify Admin
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn("h-8 w-8", sidebarOpen ? "ml-auto" : "mx-auto")}
          >
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <MenuIcon className="h-4 w-4" />}
          </Button>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-4 ant-menu-wrapper">
          <AntMenu
            mode="inline"
            theme="light"
            inlineCollapsed={!sidebarOpen}
            defaultOpenKeys={["sub-fields"]}
            selectedKeys={[location.pathname]}
            onClick={(info) => {
              navigate(info.key);
              queryClient.invalidateQueries();
            }}
            items={menuItems}
            style={{ borderRight: 0, backgroundColor: 'transparent' }}
          />
        </div>

        {/* Bottom */}
        <div className="border-t border-border p-3 space-y-2">
          {sidebarOpen && user && (
            <p className="text-xs text-muted-foreground px-2 truncate">
              {user.username || user.name}
            </p>
          )}
          <Button
            variant="ghost"
            size={sidebarOpen ? "sm" : "icon"}
            onClick={logout}
            className={cn("w-full gap-2", !sidebarOpen && "justify-center")}
          >
            <LogOut className="h-4 w-4" />
            {sidebarOpen && "Đăng xuất"}
          </Button>
          <Button
            variant="ghost"
            size={sidebarOpen ? "sm" : "icon"}
            onClick={() => navigate("/")}
            className={cn("w-full gap-2", !sidebarOpen && "justify-center")}
          >
            <ChevronLeft className="h-4 w-4" />
            {sidebarOpen && "Trang khách"}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-16 items-center justify-between border-b border-border px-6 bg-card sticky top-0 z-20">
          <h1 className="font-semibold text-lg hidden sm:block">Admin Dashboard</h1>
          <h1 className="font-semibold text-lg sm:hidden">Dashboard</h1>
          
          <div className="flex items-center gap-4 ml-auto">
            <Popover 
              content={notificationContent} 
              trigger="click" 
              placement="bottomRight"
              open={popoverOpen}
              onOpenChange={setPopoverOpen}
              overlayInnerStyle={{ padding: 0, borderRadius: '0.75rem', overflow: 'hidden' }}
            >
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <Badge count={unreadCount} size="small" offset={[-2, 2]}>
                  <BellRing className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                </Badge>
              </Button>
            </Popover>
            
            <div className="text-sm font-medium border-l border-border pl-4 hidden sm:block">
              Xin chào, <span className="text-primary">{user?.username || user?.name || "Admin"}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
