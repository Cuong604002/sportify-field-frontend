import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { bookingService } from "@/services/bookingService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { TableRowSkeleton } from "@/components/common/Skeleton";
import { PaginationBar } from "@/components/common/PaginationBar";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select } from "antd";
import { formatDate, formatDateTime } from "@/utils/formatDate";
import { formatCurrency } from "@/utils/formatCurrency";
import { Calendar, CheckCircle, Star, Search, Eye, User, Building2, Clock, CreditCard, FileText } from "lucide-react";
import { toast } from "sonner";

export default function AdminBookingsPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const initialStatus = searchParams.get("status") || "";
  const [status, setStatus] = useState(initialStatus);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Search
  const initialSearch = searchParams.get("search") || "";
  const [search, setSearch] = useState(initialSearch);

  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ["admin-bookings", page, pageSize, status, search],
    queryFn: () => bookingService.getAllBookings({ page, size: pageSize, status, search }).then((r) => r.data),
  });

  const bookings = bookingsData?.items || bookingsData || [];
  const totalItems = bookingsData?.totalItems || 0;
  const totalPages = bookingsData?.totalPages || 0;

  useEffect(() => {
    if (search) {
      searchParams.set("search", search);
    } else {
      searchParams.delete("search");
    }

    if (status) {
      searchParams.set("status", status);
    } else {
      searchParams.delete("status");
    }

    setSearchParams(searchParams, { replace: true });
  }, [search, status, searchParams, setSearchParams]);

  const confirmMutation = useMutation({
    mutationFn: (id) => bookingService.confirmBooking(id),
    onSuccess: () => {
      toast.success("Xác nhận booking thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      setSelectedBooking(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || "Lỗi xác nhận"),
  });

  const completeMutation = useMutation({
    mutationFn: (id) => bookingService.completeBooking(id),
    onSuccess: () => {
      toast.success("Đánh dấu hoàn thành!");
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      setSelectedBooking(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || "Lỗi đánh dấu hoàn thành"),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            Quản lý booking
          </h2>
          <p className="text-muted-foreground text-sm">Xác nhận và quản lý danh sách đơn đặt sân</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm mã đơn, tên sân..."
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
            />
          </div>
          <Select
            className="w-[180px] h-9"
            value={status || undefined}
            placeholder="Tất cả trạng thái"
            allowClear
            onChange={(val) => { setStatus(val || ""); setPage(0); }}
            options={[
              { value: "PENDING", label: "Chờ thanh toán" },
              { value: "PAID_PENDING_CONFIRMATION", label: "Chờ xác nhận (đã trả)" },
              { value: "CONFIRMED", label: "Đã xác nhận" },
              { value: "COMPLETED", label: "Hoàn thành" },
              { value: "CANCELLED", label: "Đã hủy" },
            ]}
          />
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã</TableHead>
              <TableHead>Sân</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Ngày chơi</TableHead>
              <TableHead>Khung giờ</TableHead>
              <TableHead>Tổng tiền</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} cols={8} />)
            ) : !bookings?.length ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <EmptyState icon={Calendar} title="Chưa có booking nào" />
                </TableCell>
              </TableRow>
            ) : (
              bookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">#{b.id}</TableCell>
                  <TableCell className="font-semibold">{b.field?.name || b.fieldName || "—"}</TableCell>
                  <TableCell>{b.userName || ('User #' + b.userId)}</TableCell>
                  <TableCell>{formatDate(b.bookingDate)}</TableCell>
                  <TableCell>{b.startTime} – {b.endTime}</TableCell>
                  <TableCell className="font-medium text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(b.totalPrice)}
                  </TableCell>
                  <TableCell><StatusBadge status={b.status} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedBooking(b)}
                        className="gap-1 h-8 px-2 text-xs"
                      >
                        <Eye className="h-3.5 w-3.5" /> Chi tiết
                      </Button>

                      {["PENDING", "PAID_PENDING_CONFIRMATION"].includes(b.status) && (
                        <Button
                          size="sm"
                          onClick={() => confirmMutation.mutate(b.id)}
                          disabled={confirmMutation.isPending}
                          className="gap-1 h-8 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Xác nhận
                        </Button>
                      )}

                      {b.status === "CONFIRMED" && (() => {
                        const now = new Date();
                        const isArrived = b.bookingDate && b.startTime
                          ? now >= new Date(b.bookingDate + 'T' + b.startTime)
                          : false;
                        return (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => completeMutation.mutate(b.id)}
                            disabled={completeMutation.isPending || !isArrived}
                            title={!isArrived ? "Chưa đến giờ chơi của đơn này" : "Đánh dấu hoàn thành"}
                            className="gap-1 h-8 px-2 text-xs"
                          >
                            <Star className="h-3.5 w-3.5" /> Hoàn thành
                          </Button>
                        );
                      })()}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {totalPages > 0 && (
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
        )}
      </div>

      {/* Dialog Chi Tiết Booking cho Admin */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-md" onClose={() => setSelectedBooking(null)}>
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-base">
              <span>Chi tiết đơn đặt sân #{selectedBooking?.id}</span>
              {selectedBooking?.status && <StatusBadge status={selectedBooking.status} />}
            </DialogTitle>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4 text-sm py-2">
              {/* Sân & Cơ sở */}
              <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <Building2 className="h-4 w-4 text-primary" />
                  {selectedBooking.fieldName || selectedBooking.field?.name}
                </div>
                {selectedBooking.locationName && (
                  <p className="text-xs text-muted-foreground">Cơ sở: {selectedBooking.locationName}</p>
                )}
              </div>

              {/* Lịch đặt */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-border space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Ngày chơi
                  </p>
                  <p className="font-semibold">{formatDate(selectedBooking.bookingDate)}</p>
                </div>
                <div className="p-3 rounded-lg border border-border space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> Khung giờ
                  </p>
                  <p className="font-semibold">{selectedBooking.startTime} – {selectedBooking.endTime}</p>
                </div>
              </div>

              {/* Khách hàng & Giá */}
              <div className="space-y-2 border-t border-border pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <User className="h-4 w-4" /> Khách hàng:
                  </span>
                  <span className="font-semibold text-foreground">{selectedBooking.userName || ('User #' + selectedBooking.userId)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4" /> Tổng tiền:
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base">
                    {formatCurrency(selectedBooking.totalPrice)}
                  </span>
                </div>
                {selectedBooking.createdAt && (
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Thời gian tạo:</span>
                    <span>{formatDateTime(selectedBooking.createdAt)}</span>
                  </div>
                )}
              </div>

              {/* Ghi chú */}
              <div className="border-t border-border pt-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <FileText className="h-3.5 w-3.5" /> Ghi chú của khách:
                </p>
                <div className="p-2.5 rounded bg-muted/20 border border-border text-xs italic">
                  {selectedBooking.note || "Không có ghi chú"}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {selectedBooking && ["PENDING", "PAID_PENDING_CONFIRMATION"].includes(selectedBooking.status) && (
              <Button
                size="sm"
                onClick={() => confirmMutation.mutate(selectedBooking.id)}
                disabled={confirmMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
              >
                <CheckCircle className="h-3.5 w-3.5" /> Xác nhận đơn
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setSelectedBooking(null)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}