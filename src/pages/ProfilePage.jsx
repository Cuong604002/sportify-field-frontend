import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/authService";
import { useAuth } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/common/StatusBadge";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  Shield,
  Clock,
  Pencil,
  Loader2,
  UserCircle2,
} from "lucide-react";

// ── Validation schema ──────────────────────────────────────────────────────────
const profileSchema = z.object({
  fullName: z
    .string()
    .max(100, "Họ tên tối đa 100 ký tự")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .regex(/^(\+84|0)[0-9]{9,10}$/, "Số điện thoại không hợp lệ (VD: 0901234567)")
    .optional()
    .or(z.literal("")),
});

// ── Info row component ─────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-border last:border-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <div className="text-sm font-medium">{children}</div>
      </div>
    </div>
  );
}

// ── Edit modal ─────────────────────────────────────────────────────────────────
function EditProfileModal({ open, onClose, profile }) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: "", phone: "" },
  });

  // Điền form mỗi lần modal mở
  useEffect(() => {
    if (open && profile) {
      reset({
        fullName: profile.fullName ?? "",
        phone: profile.phone ?? "",
      });
    }
  }, [open, profile, reset]);

  const mutation = useMutation({
    mutationFn: (data) => authService.updateMe(data),
    onSuccess: () => {
      toast.success("Cập nhật thông tin thành công!");
      queryClient.invalidateQueries({ queryKey: ["me"] });
      onClose();
    },
    onError: (e) =>
      toast.error(e.response?.data?.message || "Cập nhật thất bại, vui lòng thử lại"),
  });

  const onSubmit = (data) => {
    const payload = {};
    if (data.fullName) payload.fullName = data.fullName;
    if (data.phone) payload.phone = data.phone;
    mutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent onClose={onClose}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-primary" />
            Chỉnh sửa thông tin
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Full name */}
          <div className="space-y-2">
            <Label htmlFor="edit-fullName">Họ và tên</Label>
            <Input
              id="edit-fullName"
              placeholder="Nhập họ và tên đầy đủ"
              {...register("fullName")}
              className={errors.fullName ? "border-destructive" : ""}
            />
            {errors.fullName && (
              <p className="text-xs text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="edit-phone">Số điện thoại</Label>
            <Input
              id="edit-phone"
              placeholder="0901234567"
              {...register("phone")}
              className={errors.phone ? "border-destructive" : ""}
            />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
              Hủy
            </Button>
            <Button type="submit" disabled={mutation.isPending} className="gap-2">
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                "Cập nhật"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user: cachedUser } = useAuth();
  const [editOpen, setEditOpen] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => authService.getMe().then((r) => r.data),
  });

  const displayUser = profile || cachedUser;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-muted/20 to-background py-12 px-4">
      <div className="container mx-auto max-w-xl space-y-6 animate-fade-in-up">
        {/* Page title */}
        <div>
          <h1 className="text-2xl font-bold">Hồ sơ cá nhân</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Thông tin tài khoản của bạn
          </p>
        </div>

        <Card className="border-border shadow-sm">
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground text-sm">
                <Loader2 className="h-5 w-5 animate-spin" />
                Đang tải thông tin...
              </div>
            ) : (
              <>
                {/* Avatar + tên + nút sửa */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <UserCircle2 className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="font-semibold text-base">
                        {displayUser?.fullName || displayUser?.username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        @{displayUser?.username}
                      </p>
                    </div>
                  </div>
                  <Button
                    id="btn-edit-profile"
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() => setEditOpen(true)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Chỉnh sửa
                  </Button>
                </div>

                <div className="mt-4">
                  <InfoRow icon={User} label="Họ và tên">
                    {displayUser?.fullName || <span className="text-muted-foreground italic">Chưa cập nhật</span>}
                  </InfoRow>

                  <InfoRow icon={Mail} label="Email">
                    {displayUser?.email || "—"}
                  </InfoRow>

                  <InfoRow icon={Phone} label="Số điện thoại">
                    {displayUser?.phone || <span className="text-muted-foreground italic">Chưa cập nhật</span>}
                  </InfoRow>

                  <InfoRow icon={Shield} label="Trạng thái">
                    <StatusBadge status={displayUser?.status} />
                  </InfoRow>

                  <InfoRow icon={Clock} label="Ngày tạo tài khoản">
                    {displayUser?.createdAt
                      ? new Date(displayUser.createdAt).toLocaleDateString("vi-VN", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "—"}
                  </InfoRow>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit modal */}
      <EditProfileModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        profile={displayUser}
      />
    </div>
  );
}
