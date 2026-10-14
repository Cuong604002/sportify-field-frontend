import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentService } from "@/services/paymentService";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { TableRowSkeleton } from "@/components/common/Skeleton";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDateTime } from "@/utils/formatDate";
import { CreditCard, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdminPaymentsPage() {
  const queryClient = useQueryClient();

  const { data: payments, isLoading } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: () => paymentService.getMyPayments().then((r) => r.data),
  });

  const confirmMutation = useMutation({
    mutationFn: (id) => paymentService.confirmCashPayment(id),
    onSuccess: () => {
      toast.success("Đã xác nhận thanh toán tiền mặt!");
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
    },
    onError: (e) => toast.error(e.response?.data?.message || "Xác nhận thất bại"),
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Quản lý thanh toán</h2>
        <p className="text-muted-foreground text-sm">Xem và xác nhận thanh toán tiền mặt</p>
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã GD</TableHead>
              <TableHead>Booking ID</TableHead>
              <TableHead>Phương thức</TableHead>
              <TableHead>Số tiền</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)
            ) : !payments?.length ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <EmptyState icon={CreditCard} title="Chưa có giao dịch nào" />
                </TableCell>
              </TableRow>
            ) : (
              payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">#{p.id}</TableCell>
                  <TableCell>#{p.bookingId}</TableCell>
                  <TableCell><StatusBadge status={p.paymentMethod} /></TableCell>
                  <TableCell className="font-semibold">{formatCurrency(p.amount)}</TableCell>
                  <TableCell><StatusBadge status={p.status} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDateTime(p.createdAt)}</TableCell>
                  <TableCell>
                    {p.paymentMethod === "CASH" && p.status !== "SUCCESS" && (
                      <Button
                        size="sm"
                        onClick={() => confirmMutation.mutate(p.id)}
                        disabled={confirmMutation.isPending}
                        className="gap-1.5"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Xác nhận CASH
                      </Button>
                    )}
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
