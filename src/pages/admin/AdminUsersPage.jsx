import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminUserService } from "@/services/adminUserService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { TableRowSkeleton } from "@/components/common/Skeleton";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Users,
  Search,
  LockKeyhole,
  LockKeyholeOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const queryClient = useQueryClient();

  // ── Search & Pagination state ──────────────────────────────────────────────
  const [keyword, setKeyword] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [page, setPage] = useState(0);

  // ── Confirm dialog state ───────────────────────────────────────────────────
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    userId: null,
    newStatus: null,
    username: "",
  });

  // ── Data fetch ─────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", keyword, page],
    queryFn: () =>
      adminUserService
        .getUsers(keyword, page, PAGE_SIZE)
        .then((r) => r.data),
    keepPreviousData: true,
  });

  const users = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;

  // ── Status mutation ────────────────────────────────────────────────────────
  const statusMutation = useMutation({
    mutationFn: ({ userId, status }) =>
      adminUserService.updateUserStatus(userId, status),
    onSuccess: (_, { status }) => {
      toast.success(
        status === "INACTIVE"
          ? "Đã khóa tài khoản thành công"
          : "Đã kích hoạt tài khoản thành công"
      );
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setConfirmDialog({ open: false, userId: null, newStatus: null, username: "" });
    },
    onError: (e) =>
      toast.error(e.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại"),
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSearch = useCallback(() => {
    setKeyword(inputValue.trim());
    setPage(0);
  }, [inputValue]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const openConfirm = (user) => {
    const newStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setConfirmDialog({ open: true, userId: user.id, newStatus, username: user.username });
  };

  const handleConfirmStatus = () => {
    statusMutation.mutate({
      userId: confirmDialog.userId,
      status: confirmDialog.newStatus,
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Quản lý người dùng
          </h2>
          <p className="text-muted-foreground text-sm">
            Xem danh sách và khóa / kích hoạt tài khoản người dùng
          </p>
        </div>
        {!isLoading && (
          <span className="text-sm text-muted-foreground">
            Tổng: <span className="font-medium text-foreground">{totalElements}</span> người dùng
          </span>
        )}
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="admin-users-search"
            placeholder="Tìm theo username hoặc email..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch} className="gap-2 shrink-0">
          <Search className="h-4 w-4" />
          Tìm kiếm
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Họ tên</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Số điện thoại</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRowSkeleton key={i} cols={8} />
              ))
            ) : !users.length ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <EmptyState
                    icon={Users}
                    title={
                      keyword
                        ? `Không tìm thấy người dùng phù hợp với "${keyword}"`
                        : "Chưa có người dùng nào"
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="text-muted-foreground">#{u.id}</TableCell>
                  <TableCell className="font-medium">{u.username}</TableCell>
                  <TableCell>{u.fullName || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {u.email}
                  </TableCell>
                  <TableCell>{u.phone || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {u.createdAt ? u.createdAt.slice(0, 10) : "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={u.status} />
                  </TableCell>
                  <TableCell>
                    {u.status === "ACTIVE" ? (
                      <Button
                        id={`btn-lock-user-${u.id}`}
                        size="sm"
                        variant="outline"
                        className="gap-1 text-destructive border-destructive/40 hover:bg-destructive/10"
                        onClick={() => openConfirm(u)}
                        disabled={statusMutation.isPending}
                      >
                        <LockKeyhole className="h-3.5 w-3.5" />
                        Khóa
                      </Button>
                    ) : (
                      <Button
                        id={`btn-unlock-user-${u.id}`}
                        size="sm"
                        variant="outline"
                        className="gap-1 text-emerald-600 border-emerald-500/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                        onClick={() => openConfirm(u)}
                        disabled={statusMutation.isPending}
                      >
                        <LockKeyholeOpen className="h-3.5 w-3.5" />
                        Kích hoạt
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Trang {page + 1} / {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              id="admin-users-prev-page"
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || isLoading}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Trước
            </Button>
            <Button
              id="admin-users-next-page"
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1 || isLoading}
              className="gap-1"
            >
              Sau
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Confirm dialog khóa / kích hoạt */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(o) =>
          !o && setConfirmDialog({ open: false, userId: null, newStatus: null, username: "" })
        }
        title={
          confirmDialog.newStatus === "INACTIVE"
            ? "Khóa tài khoản"
            : "Kích hoạt tài khoản"
        }
        description={
          confirmDialog.newStatus === "INACTIVE"
            ? `Bạn có chắc chắn muốn khóa tài khoản "${confirmDialog.username}"? Người dùng sẽ không thể đăng nhập cho đến khi được kích hoạt lại.`
            : `Bạn có chắc chắn muốn kích hoạt lại tài khoản "${confirmDialog.username}"?`
        }
        confirmText={confirmDialog.newStatus === "INACTIVE" ? "Khóa" : "Kích hoạt"}
        onConfirm={handleConfirmStatus}
        isLoading={statusMutation.isPending}
      />
    </div>
  );
}
