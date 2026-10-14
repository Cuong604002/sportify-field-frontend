import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { bookingService } from "@/services/bookingService";
import { paymentService } from "@/services/paymentService";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { PaginationBar } from "@/components/common/PaginationBar";
import { TableRowSkeleton } from "@/components/common/Skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/utils/formatDate";
import { formatCurrency } from "@/utils/formatCurrency";
import { Calendar, CreditCard, MapPin, Clock, Banknote, FileText, XCircle, Dumbbell } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function MyBookingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [cancelId, setCancelId] = useState(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState("");

  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ["my-bookings", page, pageSize, statusFilter],
    queryFn: () => bookingService.getMyBookings({ page, size: pageSize, status: statusFilter }).then((r) => r.data),
  });

  const rawBookings = bookingsData?.items || (Array.isArray(bookingsData) ? bookingsData : []);
  const bookings = rawBookings.filter((b) => {
    if (!statusFilter) return true;
    if (statusFilter === "PENDING") {
      return b.status === "PENDING" || b.status === "PAID_PENDING_CONFIRMATION" || b.status === "CASH_PENDING_PAYMENT";
    }
    return b.status === statusFilter;
  });
  const totalItems = bookingsData?.totalItems || bookings.length;
  const totalPages = bookingsData?.totalPages || (totalItems ? Math.ceil(totalItems / pageSize) : 0);

  const payMutation = useMutation({
    mutationFn: (id) => paymentService.createPayment({ bookingId: id, paymentMethod: "VNPAY" }),
    onSuccess: (res) => {
      if (res.data?.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      }
    },
    onError: (e) => {
      toast.error(e.response?.data?.message || "Thanh toán thất bại");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => bookingService.cancelBooking(id),
    onSuccess: () => {
      toast.success("Đã hủy booking thành công");
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      setCancelId(null);
    },
    onError: (e) => {
      toast.error(e.response?.data?.message || "Hủy booking thất bại");
      setCancelId(null);
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Lịch đặt sân của tôi</h1>
          <p className="text-muted-foreground text-sm mt-1">Quản lý các lịch đặt sân của bạn</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "", label: "Tất cả" },
            { value: "PENDING", label: "Chờ thanh toán" },
            { value: "CONFIRMED", label: "Đã xác nhận" },
            { value: "COMPLETED", label: "Hoàn thành" },
            { value: "CANCELLED", label: "Đã hủy" },
          ].map((s) => (
            <Button
              key={s.value}
              variant={statusFilter === s.value ? "default" : "outline"}
              size="sm"
              onClick={() => { setStatusFilter(s.value); setPage(0); }}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <TableRowSkeleton cols={1} />
              </CardContent>
            </Card>
          ))
        ) : !bookings?.length ? (
          <Card>
            <CardContent className="p-10">
              <EmptyState
                icon={Calendar}
                title={statusFilter ? "Không tìm thấy lịch đặt sân" : "Chưa có lịch đặt sân"}
                description={
                  statusFilter
                    ? "Không có đơn đặt sân nào tương ứng với trạng thái này."
                    : "Hãy đặt sân ngay để bắt đầu"
                }
                action={
                  statusFilter ? (
                    <Button variant="outline" onClick={() => { setStatusFilter(""); setPage(0); }}>
                      Xem tất cả đơn đặt
                    </Button>
                  ) : (
                    <Button onClick={() => navigate("/fields")}>Đặt sân ngay</Button>
                  )
                }
              />
            </CardContent>
          </Card>
        ) : (
          bookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="p-5 border-b border-border">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-muted-foreground">
                          <Dumbbell className="h-5 w-5" />
                        </span>
                        <h3 className="font-bold text-lg uppercase">
                          {booking.sportName ? `${booking.sportName} - ${booking.fieldName || booking.field?.name}` : `MÔN THỂ THAO - ${booking.fieldName || booking.field?.name}`}
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-4 w-4" /> Cơ sở: {booking.field?.location?.name || booking.locationName || "Chưa xác định"} 
                        {booking.field?.location?.address ? ` (${booking.field?.location?.address})` : ""}
                      </p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-sm font-medium text-muted-foreground mb-1">MÃ ĐƠN HÀNG: #{booking.id}</p>
                      <StatusBadge status={booking.status} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Ngày chơi:</span>
                      <span className="font-medium">{formatDate(booking.bookingDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Khung giờ:</span>
                      <span className="font-medium">{booking.startTime} - {booking.endTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Tổng tiền:</span>
                      <span className="font-medium text-emerald-600 text-base">{formatCurrency(booking.totalPrice)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Thanh toán:</span>
                      <span className="font-medium">
                        {booking.paymentMethod === "CASH" ? "Tiền mặt" : "Trực tuyến qua VNPAY"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-muted/20 flex flex-wrap items-center justify-between gap-4">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/bookings/${booking.id}`)}
                    className="gap-2"
                  >
                    <FileText className="h-4 w-4" /> Xem Chi Tiết Đơn Đặt
                  </Button>

                  <div className="flex items-center gap-2">
                    {booking.status === "PENDING" && (
                      <>
                        <Button
                          variant="destructive"
                          onClick={() => setCancelId(booking.id)}
                          className="gap-1"
                        >
                          <XCircle className="h-4 w-4" /> Hủy Đơn Đặt
                        </Button>
                        <Button
                          onClick={() => payMutation.mutate(booking.id)}
                          disabled={payMutation.isPending}
                          className="gap-1"
                        >
                          <CreditCard className="h-4 w-4" />
                          {payMutation.isPending ? "Đang xử lý..." : "Thanh Toán Ngay"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {totalPages > 0 && (
          <div className="bg-card rounded-xl border border-border p-1">
            <PaginationBar
              page={page}
              pageSize={pageSize}
              totalItems={totalItems}
              totalPages={totalPages}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(0);
              }}
            />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!cancelId}
        onOpenChange={(open) => !open && setCancelId(null)}
        title="Hủy đặt sân"
        description="Bạn có chắc chắn muốn hủy lịch đặt sân này không?"
        confirmText="Hủy đặt sân"
        onConfirm={() => cancelMutation.mutate(cancelId)}
        isLoading={cancelMutation.isPending}
      />
    </div>
  );
}
