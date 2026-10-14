import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { dashboardService } from "@/services/dashboardService";
import { formatCurrency } from "@/utils/formatCurrency";
import { realtimeService } from "@/services/realtimeService";
import { useAuth } from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, Calendar, CreditCard, Trophy, TrendingUp, Layers, CheckCircle, Clock, AlertCircle, Wifi, Hourglass, BadgeDollarSign, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/common/StatusBadge";

function SimpleBarChart({ data, title, valueFn, formatValueFn, colorBase = "bg-primary/50", colorHover = "group-hover:bg-primary" }) {
  if (!data || data.length === 0) return <div className="text-center text-muted-foreground py-10">Không có dữ liệu</div>;
  const maxValue = Math.max(...data.map(d => valueFn(d) || 0), 1);

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-sm text-muted-foreground">{title}</h3>
      <div className="flex h-48 items-end gap-1 px-1 border-b border-border pb-1">
        {data.map((item, i) => {
          const value = valueFn(item) || 0;
          const heightPercent = (value / maxValue) * 100;
          return (
            <div key={i} className="group relative flex-1 flex flex-col items-center justify-end h-full">
              <div 
                className={`w-full ${colorBase} ${colorHover} transition-colors rounded-t-sm`}
                style={{ height: `${Math.max(heightPercent, 2)}%` }} 
              />
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 bg-popover text-popover-foreground border border-border shadow-md text-xs px-2 py-1 rounded whitespace-nowrap">
                {item.date}: {formatValueFn ? formatValueFn(value) : value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const formatDate = (date) => date.toISOString().split("T")[0];

  const [fromDate, setFromDate] = useState(formatDate(firstDay));
  const [toDate, setToDate] = useState(formatDate(lastDay));

  const { data: bookingData, isLoading: loadingBookings } = useQuery({
    queryKey: ["dashboard-bookings", fromDate, toDate],
    queryFn: () => dashboardService.getBookingsDashboard({ from: fromDate, to: toDate, topLimit: 5 }).then(r => r.data),
  });

  const { data: paymentData, isLoading: loadingPayments } = useQuery({
    queryKey: ["dashboard-payments", fromDate, toDate],
    queryFn: () => dashboardService.getPaymentsDashboard({ from: fromDate, to: toDate }).then(r => r.data),
  });

  // Real-time integration (Websocket) - Chỉ invalidateQueries để dashboard tự động update số liệu
  useEffect(() => {
    if (!user) return;
    
    const sub = realtimeService.subscribeOwnerNotifications((data) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-payments"] });
    });

    return () => {
      realtimeService.disconnect(sub);
    };
  }, [user, queryClient]);

  const quickLinks = [
    { title: "Quản lý sân", desc: "Thêm, sửa, đổi trạng thái sân thể thao", href: "/admin/fields", icon: Dumbbell },
    { title: "Quản lý địa điểm", desc: "Quản lý các địa điểm sân thể thao", href: "/admin/locations", icon: Trophy },
    { title: "Quản lý môn thể thao", desc: "Thêm, sửa, xóa môn thể thao", href: "/admin/sports", icon: TrendingUp },
    { title: "Quản lý loại sân", desc: "Thêm, sửa, xóa loại sân", href: "/admin/field-types", icon: Layers },
    { title: "Quản lý bảng giá", desc: "Thiết lập giá theo khung giờ, ngày", href: "/admin/prices", icon: TrendingUp },
    { title: "Quản lý booking", desc: "Xác nhận và hoàn thành", href: "/admin/bookings", icon: Calendar },
  ];

  const bOverview = bookingData?.overview || {};
  const pOverview = paymentData?.overview || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            Dashboard
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Tổng quan hệ thống Sportify Booking</p>
        </div>
        <div className="flex items-center gap-2 bg-card p-2 rounded-lg border border-border">
          <Input 
            type="date" 
            value={fromDate} 
            onChange={(e) => setFromDate(e.target.value)} 
            className="w-auto h-8 text-sm"
          />
          <span className="text-muted-foreground">-</span>
          <Input 
            type="date" 
            value={toDate} 
            onChange={(e) => setToDate(e.target.value)} 
            className="w-auto h-8 text-sm"
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Doanh thu thật (SUCCESS)</p>
                <p className="text-2xl font-bold mt-1 text-emerald-600">{formatCurrency(bOverview.actualRevenue || pOverview.totalRevenue || 0)}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Từ các booking thành công</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Doanh thu dự kiến</p>
                <p className="text-2xl font-bold mt-1 text-amber-600">{formatCurrency(bOverview.expectedRevenue || 0)}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-amber-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Từ tất cả các booking</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tổng lượt đặt sân</p>
                <p className="text-2xl font-bold mt-1 text-blue-600">{bOverview.totalBookings || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
              <span className="text-emerald-500 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> {bOverview.todayBookings || 0} hôm nay</span>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:border-rose-300 hover:shadow-md transition-all group"
          onClick={() => navigate('/admin/bookings?status=PAID_PENDING_CONFIRMATION')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cần xử lý (Pending)</p>
                <p className="text-2xl font-bold mt-1 text-rose-600">
                  {(bOverview.pendingAdminConfirmation || 0) + (bOverview.pendingBookings || 0)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-rose-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{bOverview.pendingAdminConfirmation || 0} online chờ</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Biểu đồ doanh thu */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Doanh thu theo ngày</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart 
              data={bookingData?.dailyTrends} 
              title="Doanh thu thực tế (VNĐ)" 
              valueFn={(d) => d.actualRevenue || d.revenue || d.totalRevenue || d.value || 0} 
              formatValueFn={formatCurrency}
              colorBase="bg-emerald-500/50"
              colorHover="group-hover:bg-emerald-500"
            />
          </CardContent>
        </Card>

        {/* Biểu đồ booking */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lượt đặt sân theo ngày</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart 
              data={bookingData?.dailyTrends} 
              title="Số lượng Booking" 
              valueFn={(d) => d.bookingCount || d.totalBookings || d.count || d.value || 0} 
              colorBase="bg-blue-500/50"
              colorHover="group-hover:bg-blue-500"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Booking Status Breakdown */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Trạng thái Booking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(bOverview.bookingsByStatus || {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <StatusBadge status={status} />
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
              {(!bOverview.bookingsByStatus || Object.keys(bOverview.bookingsByStatus).length === 0) && (
                <div className="text-center text-muted-foreground py-4">Chưa có dữ liệu</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Fields */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Sân được đặt nhiều nhất (Top 5)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bookingData?.topFields?.length > 0 ? (
                bookingData.topFields.map((field, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                        #{i + 1}
                      </div>
                      <div>
                        <p className="font-medium">{field.fieldName || field.name || `Sân ID: ${field.fieldId}`}</p>
                        <p className="text-xs text-muted-foreground">{field.bookingCount || field.totalBookings || field.count} lượt đặt</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col justify-center gap-1.5">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Dự kiến</p>
                        <p className="font-semibold text-slate-800 leading-none">{formatCurrency(field.expectedRevenue || 0)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-emerald-600/80 uppercase tracking-wider mb-0.5">Doanh thu thực</p>
                        <p className="font-semibold text-emerald-600 leading-none">{formatCurrency(field.actualRevenue || field.revenue || field.totalRevenue || 0)}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">Chưa có dữ liệu</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <div>
        <h3 className="font-semibold mb-3">Truy cập nhanh</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {quickLinks.map(({ title, desc, href, icon: Icon }) => (
            <div
              key={title}
              onClick={() => navigate(href)}
              className="group p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <Icon className="h-4 w-4" />
                </div>
                <h4 className="font-medium text-sm">{title}</h4>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
