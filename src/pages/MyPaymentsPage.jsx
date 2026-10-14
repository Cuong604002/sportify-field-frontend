import { useQuery } from "@tanstack/react-query";
import { bookingService } from "@/services/bookingService";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { TableRowSkeleton } from "@/components/common/Skeleton";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate, formatDateTime } from "@/utils/formatDate";
import { CreditCard } from "lucide-react";

export default function MyPaymentsPage() {
  const { data: bookings, isLoading } = useQuery({
    queryKey: ["my-payments-bookings"],
    queryFn: () => bookingService.getMyBookings().then((r) => r.data),
  });

  // Chỉ lấy những booking ĐÃ THANH TOÁN (Trạng thái khác PENDING và CANCELLED)
  const paidBookings = bookings?.filter(
    (b) => b.status === "PAID_PENDING_CONFIRMATION" || b.status === "CONFIRMED" || b.status === "COMPLETED"
  ) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Lịch sử thanh toán</h1>
        <p className="text-muted-foreground text-sm mt-1">Danh sách các sân bạn đã thanh toán thành công</p>
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã Booking</TableHead>
              <TableHead>Thông tin sân</TableHead>
              <TableHead>Khung giờ chơi</TableHead>
              <TableHead>Số tiền đã trả</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày GD</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)
            ) : !paidBookings.length ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <EmptyState
                    icon={CreditCard}
                    title="Chưa có giao dịch nào"
                    description="Các sân đã thanh toán sẽ hiển thị ở đây"
                  />
                </TableCell>
              </TableRow>
            ) : (
              paidBookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">#{b.id}</TableCell>
                  <TableCell>
                    <p className="font-medium">{b.fieldName}</p>
                    <p className="text-xs text-muted-foreground">{b.locationName}</p>
                  </TableCell>
                  <TableCell>
                    <p>{formatDate(b.bookingDate)}</p>
                    <p className="text-xs text-muted-foreground">{b.startTime} - {b.endTime}</p>
                  </TableCell>
                  <TableCell className="font-bold text-primary">{formatCurrency(b.totalPrice)}</TableCell>
                  <TableCell>
                    <StatusBadge status={b.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDateTime(b.updatedAt || b.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
