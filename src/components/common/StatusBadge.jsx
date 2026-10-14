import { Badge } from "@/components/ui/badge";

const STATUS_MAP = {
  // Field statuses
  AVAILABLE: { label: "Có sẵn", variant: "success" },
  MAINTENANCE: { label: "Bảo trì", variant: "warning" },
  // Booking statuses
  PENDING: { label: "Chờ xử lý", variant: "warning" },
  PAID_PENDING_CONFIRMATION: { label: "Đã TT - Chờ XN", variant: "warning" },
  CASH_PENDING_PAYMENT: { label: "Tiền mặt - Chờ TT", variant: "warning" },
  CONFIRMED: { label: "Đã xác nhận", variant: "info" },
  CANCELLED: { label: "Đã hủy", variant: "destructive" },
  COMPLETED: { label: "Hoàn thành", variant: "success" },
  // Payment statuses
  SUCCESS: { label: "Thành công", variant: "success" },
  FAILED: { label: "Thất bại", variant: "destructive" },
  // Day types
  WEEKDAY: { label: "Ngày thường", variant: "secondary" },
  WEEKEND: { label: "Cuối tuần", variant: "info" },
  // Payment methods
  VNPAY: { label: "VNPAY", variant: "info" },
  CASH: { label: "Tiền mặt", variant: "secondary" },
  // User statuses
  ACTIVE: { label: "Hoạt động", variant: "success" },
  INACTIVE: { label: "Đã khóa", variant: "destructive" },
};

export function StatusBadge({ status }) {
  const config = STATUS_MAP[status] || { label: status, variant: "outline" };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
