import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingService } from "@/services/bookingService";
import { paymentService } from "@/services/paymentService";
import { fieldService } from "@/services/fieldService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Skeleton } from "@/components/common/Skeleton";
import { formatDate, formatDateTime } from "@/utils/formatDate";
import { formatCurrency } from "@/utils/formatCurrency";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Phone,
  CreditCard,
  User,
  FileText,
  Trophy,
  Users,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RotateCcw,
  Building2,
  Hourglass
} from "lucide-react";

export default function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  // Fetch Booking detail
  const { data: booking, isLoading: isBookingLoading } = useQuery({
    queryKey: ["booking", id],
    queryFn: () => bookingService.getBookingById(id).then((r) => r.data),
  });

  // Fetch Field detail if fieldId is available
  const { data: field } = useQuery({
    queryKey: ["field-detail", booking?.fieldId],
    queryFn: () => fieldService.getFieldById(booking.fieldId).then((r) => r.data),
    enabled: !!booking?.fieldId,
  });

  // Pay mutation
  const payMutation = useMutation({
    mutationFn: () => paymentService.createPayment({ bookingId: id, paymentMethod: "VNPAY" }),
    onSuccess: (res) => {
      if (res.data?.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      }
    },
    onError: (e) => {
      toast.error(e.response?.data?.message || "Thanh toán thất bại");
    },
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: () => bookingService.cancelBooking(id),
    onSuccess: () => {
      toast.success("Đã hủy đơn đặt thành công");
      queryClient.invalidateQueries({ queryKey: ["booking", id] });
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      setCancelModalOpen(false);
    },
    onError: (e) => {
      toast.error(e.response?.data?.message || "Hủy đơn đặt thất bại");
      setCancelModalOpen(false);
    },
  });

  if (isBookingLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-96 md:col-span-2 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
        <h2 className="text-xl font-bold">Không tìm thấy thông tin đơn đặt sân</h2>
        <p className="text-sm text-muted-foreground">Đơn đặt sân này không tồn tại hoặc đã bị xóa.</p>
        <Button onClick={() => navigate("/bookings")} variant="outline" className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Quay lại danh sách
        </Button>
      </div>
    );
  }

  const isPending = booking.status === "PENDING";
  const isConfirmed = booking.status === "CONFIRMED";
  const isCompleted = booking.status === "COMPLETED";
  const isCancelled = booking.status === "CANCELLED";

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
      {/* Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/bookings")}
            className="gap-1.5 h-9"
          >
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">Chi tiết đơn đặt #{booking.id}</h1>
              <StatusBadge status={booking.status} />
            </div>
            {booking.createdAt && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Tạo lúc: {formatDateTime(booking.createdAt)}
              </p>
            )}
          </div>
        </div>


      </div>

      {/* Status Notice Banner */}
      {isPending && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 dark:text-amber-200">
          <div className="flex items-start gap-3">
            <Hourglass className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0 animate-pulse" />
            <div className="text-sm">
              <p className="font-semibold">Đơn đặt sân đang chờ thanh toán</p>
              <p className="text-amber-700 dark:text-amber-300 mt-0.5">
                Vui lòng hoàn tất thanh toán qua VNPAY để xác nhận lịch giữ sân của bạn.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => payMutation.mutate()}
            disabled={payMutation.isPending}
            className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 flex-shrink-0 w-full sm:w-auto"
          >
            <CreditCard className="h-4 w-4" />
            {payMutation.isPending ? "Đang chuyển hướng..." : "Thanh toán ngay"}
          </Button>
        </div>
      )}

      {isConfirmed && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800 p-4 flex items-center gap-3 text-emerald-900 dark:text-emerald-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-semibold">Đơn đặt sân đã được xác nhận thanh toán!</p>
            <p className="text-emerald-700 dark:text-emerald-300 mt-0.5">
              Bạn chỉ cần đến sân đúng khung giờ đã đăng ký. Chúc bạn có trải nghiệm chơi thể thao tuyệt vời!
            </p>
          </div>
        </div>
      )}

      {isCompleted && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 p-4 flex items-center gap-3 text-blue-900 dark:text-blue-200">
          <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-semibold">Lịch đặt sân đã hoàn thành</p>
            <p className="text-blue-700 dark:text-blue-300 mt-0.5">
              Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của Sportify!
            </p>
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-800 p-4 flex items-center gap-3 text-rose-900 dark:text-rose-200">
          <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-semibold">Đơn đặt sân này đã bị hủy</p>
            <p className="text-rose-700 dark:text-rose-300 mt-0.5">
              Khung giờ này đã được giải phóng trên hệ thống. Bạn có thể chọn đặt lại lịch mới nếu muốn.
            </p>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 columns: Detailed Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Field & Venue Card */}
          <Card className="overflow-hidden border-border">
            {field?.imageUrl && (
              <div className="h-48 w-full overflow-hidden bg-muted relative">
                <img
                  src={field.imageUrl}
                  alt={field.name || booking.fieldName}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end p-4">
                  <div className="text-white">
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                      {field.sportName || "Môn thể thao"}
                    </p>
                    <h3 className="text-xl font-bold">{booking.fieldName}</h3>
                  </div>
                </div>
              </div>
            )}

            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Thông tin sân & Địa điểm
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {!field?.imageUrl && (
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Trophy className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">{booking.fieldName}</h3>
                    <p className="text-xs text-muted-foreground">Mã sân: #{booking.fieldId}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Sport */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Môn thể thao</p>
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                    {field?.sportName || "Thể thao"}
                  </div>
                </div>

                {/* Field Type & Capacity */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Loại sân / Sức chứa</p>
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    {field?.fieldTypeName || "Loại sân tiêu chuẩn"}
                    {field?.playerCapacity && (
                      <Badge variant="secondary" className="text-[11px] font-normal ml-1">
                        {field.playerCapacity} người
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border space-y-2">
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">
                      Cơ sở: {field?.locationName || booking.locationName || "Cơ sở thể thao"}
                    </p>
                    {field?.locationAddress && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Địa chỉ: {field.locationAddress}
                        {field.locationRegion ? `, ${field.locationRegion}` : ""}
                      </p>
                    )}
                  </div>
                </div>

                {field?.locationHotline && (
                  <div className="flex items-center gap-2.5 pt-1 text-xs text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Hotline liên hệ: <strong className="text-foreground font-medium">{field.locationHotline}</strong></span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Schedule & Time Details Card */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Thời gian đặt sân
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-muted/40 border border-border/60">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Ngày chơi</p>
                  <div className="flex items-center gap-2 font-bold text-foreground">
                    <Calendar className="h-4 w-4 text-primary" />
                    {formatDate(booking.bookingDate)}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Khung giờ</p>
                  <div className="flex items-center gap-2 font-bold text-foreground">
                    <Clock className="h-4 w-4 text-primary" />
                    {booking.startTime} – {booking.endTime}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Thời lượng</p>
                  <div className="flex items-center gap-2 font-bold text-foreground">
                    <Hourglass className="h-4 w-4 text-primary" />
                    {booking.durationHours || "1.0"} giờ
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer & Notes Card */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Thông tin người đặt & Ghi chú
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="text-muted-foreground">Tên người đặt:</span>
                <span className="font-semibold text-foreground">{booking.userName || "Khách hàng"}</span>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 flex items-center gap-1.5">
                  <FileText className="h-4 w-4" /> Ghi chú từ khách hàng:
                </p>
                <div className="p-3 rounded-lg bg-muted/30 border border-border text-xs italic text-foreground">
                  {booking.note ? booking.note : "Không có ghi chú nào."}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 column: Payment Summary & Action Panel */}
        <div className="space-y-6">
          <Card className="border-border shadow-sm sticky top-20">
            <CardHeader className="pb-3 border-b border-border bg-muted/20">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Tóm tắt thanh toán</span>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-sm">
              <div className="space-y-2.5 pb-4 border-b border-border">
                <div className="flex justify-between text-muted-foreground">
                  <span>Mã đơn đặt:</span>
                  <span className="font-mono font-medium text-foreground">#{booking.id}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Trạng thái:</span>
                  <StatusBadge status={booking.status} />
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Hình thức:</span>
                  <span className="font-medium text-foreground">
                    Trực tuyến qua VNPAY
                  </span>
                </div>
                {booking.updatedAt && (
                  <div className="flex justify-between text-muted-foreground text-xs">
                    <span>Cập nhật:</span>
                    <span>{formatDateTime(booking.updatedAt)}</span>
                  </div>
                )}
              </div>

              <div className="pt-1 space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-foreground">Tổng tiền thanh toán</span>
                </div>
                <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(booking.totalPrice)}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  * Giá đã bao gồm phí giữ chỗ và thuế GTGT.
                </p>
              </div>

              {/* Actions */}
              <div className="pt-4 space-y-2.5 border-t border-border">
                {isPending && (
                  <>
                    <Button
                      className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5"
                      onClick={() => payMutation.mutate()}
                      disabled={payMutation.isPending}
                    >
                      <CreditCard className="h-4 w-4" />
                      {payMutation.isPending ? "Đang xử lý..." : "Thanh toán ngay"}
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => setCancelModalOpen(true)}
                    >
                      <XCircle className="h-4 w-4" /> Hủy đơn đặt sân
                    </Button>
                  </>
                )}

                {isConfirmed && (
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium text-center">
                    ✓ Đã thanh toán thành công
                  </div>
                )}

                <Button
                  variant="ghost"
                  className="w-full gap-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => navigate("/bookings")}
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Quay lại danh sách đơn đặt
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        open={cancelModalOpen}
        onOpenChange={setCancelModalOpen}
        title="Xác nhận hủy đơn đặt sân"
        description="Bạn có chắc chắn muốn hủy đơn đặt sân này không? Thao tác này sẽ giải phóng khung giờ đặt."
        confirmText="Hủy đơn đặt"
        cancelText="Giữ lại đơn"
        onConfirm={() => cancelMutation.mutate()}
        isLoading={cancelMutation.isPending}
      />
    </div>
  );
}