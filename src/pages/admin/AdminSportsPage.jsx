import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { sportService } from "@/services/sportService";
import { fieldService } from "@/services/fieldService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { TableRowSkeleton } from "@/components/common/Skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Trophy, Layers, ChevronDown, Users } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Schemas ──────────────────────────────────────────────────────────────────

const sportSchema = z.object({
  name: z.string().min(1, "Tên môn thể thao bắt buộc"),
  slug: z.string().min(1, "Slug bắt buộc").regex(/^[a-z0-9-]+$/, "Slug chỉ chứa chữ thường, số và dấu -"),
});

const fieldTypeSchema = z.object({
  name: z.string().min(1, "Tên loại sân bắt buộc"),
  sportId: z.coerce.number().min(1, "Vui lòng chọn môn thể thao"),
  playerCapacity: z.coerce.number().min(1, "Sức chứa phải lớn hơn 0"),
});

// ── Sport Modal ──────────────────────────────────────────────────────────────

function SportModal({ open, onClose, editData }) {
  const queryClient = useQueryClient();
  const isEdit = !!editData;
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(sportSchema),
    defaultValues: editData || {},
  });

  const { data: detailData, isLoading } = useQuery({
    queryKey: ["sport-detail", editData?.id],
    queryFn: () => sportService.getSportById(editData.id).then(r => r.data),
    enabled: !!editData?.id && open,
  });

  useEffect(() => {
    if (detailData) {
      reset(detailData);
    } else if (!editData) {
      reset({});
    }
  }, [detailData, editData, reset, open]);

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit ? sportService.updateSport(editData.id, data) : sportService.createSport(data),
    onSuccess: () => {
      toast.success(isEdit ? "Cập nhật thành công" : "Thêm môn thể thao thành công");
      queryClient.invalidateQueries({ queryKey: ["sports"] });
      reset();
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.message || "Có lỗi xảy ra"),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent onClose={onClose} className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Sửa môn thể thao" : "Thêm môn thể thao"}
            {isLoading && <span className="ml-2 text-xs text-muted-foreground animate-pulse">(Đang tải chi tiết...)</span>}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tên môn thể thao</Label>
              <Input placeholder="Vd: Bóng đá" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input placeholder="Vd: bong-da" {...register("slug")} />
              {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
            </div>
          </div>
          <DialogFooter className="gap-2 pt-4 border-t sticky bottom-0 bg-background z-10 mt-4">
            <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo mới"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── FieldType Modal ──────────────────────────────────────────────────────────

function FieldTypeModal({ open, onClose, editData, sport }) {
  const queryClient = useQueryClient();
  const isEdit = !!editData;

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(fieldTypeSchema),
    defaultValues: editData
      ? { ...editData, sportId: editData.sportId || sport?.id }
      : { playerCapacity: 10, sportId: sport?.id || "" },
  });

  const { data: detailData, isLoading } = useQuery({
    queryKey: ["field-type-detail", editData?.id],
    queryFn: () => fieldService.getFieldTypeById(editData.id).then(r => r.data),
    enabled: !!editData?.id && open,
  });

  useEffect(() => {
    if (detailData) {
      reset({
        ...detailData,
        sportId: detailData.sport?.id || detailData.sportId || sport?.id || "",
      });
    } else if (!editData) {
      reset({ playerCapacity: 10, sportId: sport?.id || "" });
    }
  }, [detailData, editData, reset, open, sport]);

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit ? fieldService.updateFieldType(editData.id, data) : fieldService.createFieldType(data),
    onSuccess: () => {
      toast.success(isEdit ? "Cập nhật thành công" : "Thêm loại sân thành công");
      queryClient.invalidateQueries({ queryKey: ["field-types"] });
      queryClient.invalidateQueries({ queryKey: ["sports"] });
      reset();
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.message || "Có lỗi xảy ra"),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent onClose={onClose} className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Sửa loại sân" : "Thêm loại sân"}
            {sport && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {"—"} {sport.name}
              </span>
            )}
            {isLoading && <span className="ml-2 text-xs text-muted-foreground animate-pulse">(Đang tải...)</span>}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4 py-2">
          <input type="hidden" {...register("sportId")} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tên loại sân</Label>
              <Input placeholder="Vd: Sân 5 người" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Sức chứa (số người)</Label>
              <Input type="number" placeholder="Vd: 10" {...register("playerCapacity")} />
              {errors.playerCapacity && <p className="text-xs text-destructive">{errors.playerCapacity.message}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
            <Trophy className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Môn thể thao:</span>
            <span className="font-medium">{sport?.name || "—"}</span>
            <code className="ml-auto rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{sport?.slug}</code>
          </div>

          <DialogFooter className="gap-2 pt-4 border-t sticky bottom-0 bg-background z-10 mt-4">
            <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo mới"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── FieldType Table (inside accordion) ───────────────────────────────────────

function FieldTypeList({ sport }) {
  const queryClient = useQueryClient();
  const [ftModalOpen, setFtModalOpen] = useState(false);
  const [ftEditData, setFtEditData] = useState(null);
  const [ftDeleteId, setFtDeleteId] = useState(null);

  const { data: fieldTypesData, isLoading } = useQuery({
    queryKey: ["field-types", sport.id],
    queryFn: () => fieldService.getFieldTypes({ sportId: sport.id }).then(r => r.data),
  });

  const fieldTypes = fieldTypesData?.items || fieldTypesData || [];

  const deleteMutation = useMutation({
    mutationFn: (id) => fieldService.deleteFieldType(id),
    onSuccess: () => {
      toast.success("Xóa loại sân thành công");
      queryClient.invalidateQueries({ queryKey: ["field-types", sport.id] });
      queryClient.invalidateQueries({ queryKey: ["sports"] });
      setFtDeleteId(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || "Không thể xóa loại sân này"),
  });

  return (
    <div className="pt-1 pb-2">
      <div className="flex items-center justify-between mb-3 px-1">
        <p className="text-sm text-muted-foreground">
          Loại sân thuộc <span className="font-semibold text-foreground">"{sport.name}"</span>
        </p>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 h-8"
          onClick={() => { setFtEditData(null); setFtModalOpen(true); }}
        >
          <Plus className="h-3.5 w-3.5" /> Thêm loại sân
        </Button>
      </div>

      <div className="rounded-lg border border-border overflow-hidden bg-background">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Tên loại sân</TableHead>
              <TableHead className="w-32">Sức chứa</TableHead>
              <TableHead className="w-28 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => <TableRowSkeleton key={i} cols={4} />)
            ) : !fieldTypes?.length ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Layers className="h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">Chưa có loại sân nào</p>
                    <Button
                      size="sm"
                      variant="link"
                      className="mt-1 gap-1 text-xs"
                      onClick={() => { setFtEditData(null); setFtModalOpen(true); }}
                    >
                      <Plus className="h-3 w-3" /> Thêm loại sân đầu tiên
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              fieldTypes.map((ft) => (
                <TableRow key={ft.id}>
                  <TableCell className="text-muted-foreground font-mono text-xs">#{ft.id}</TableCell>
                  <TableCell className="font-medium">{ft.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      {ft.playerCapacity} người
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                        onClick={() => { setFtEditData(ft); setFtModalOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>

                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => setFtDeleteId(ft.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {ftModalOpen && (
        <FieldTypeModal
          open={ftModalOpen}
          onClose={() => setFtModalOpen(false)}
          editData={ftEditData}
          sport={sport}
        />
      )}

      <ConfirmDialog
        open={!!ftDeleteId}
        onOpenChange={(o) => !o && setFtDeleteId(null)}
        title="Xóa loại sân"
        description="Bạn có chắc muốn xóa loại sân này? Chỉ xóa được nếu không còn sân nào thuộc loại này."
        confirmText="Xóa"
        onConfirm={() => deleteMutation.mutate(ftDeleteId)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

// ── Sport Accordion Item ─────────────────────────────────────────────────────

function SportAccordionItem({ sport, isOpen, onToggle, onEdit, onDelete }) {
  const contentRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [isOpen]);

  const { data: fieldTypesData } = useQuery({
    queryKey: ["field-types", sport.id],
    queryFn: () => fieldService.getFieldTypes({ sportId: sport.id }).then(r => r.data),
    staleTime: 30000,
  });
  const fieldTypeCount = (fieldTypesData?.items || fieldTypesData || []).length;

  return (
    <div className={cn(
      "rounded-xl border bg-card transition-all duration-200",
      isOpen ? "border-primary/30 shadow-sm ring-1 ring-primary/10" : "border-border hover:border-border/80"
    )}>
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 cursor-pointer select-none transition-colors",
          isOpen ? "bg-primary/5" : "hover:bg-muted/50"
        )}
        onClick={onToggle}
      >
        <ChevronDown className={cn(
          "h-4 w-4 text-muted-foreground transition-transform duration-200 flex-shrink-0",
          isOpen && "rotate-180"
        )} />

        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
          <Trophy className="h-4 w-4 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{sport.name}</span>
            <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">{sport.slug}</code>
          </div>
        </div>

        <Badge variant="secondary" className="text-[11px] gap-1 flex-shrink-0">
          <Layers className="h-3 w-3" />
          {fieldTypeCount} loại sân
        </Badge>

        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
            onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: isOpen ? `${contentHeight + 32}px` : "0px" }}
      >
        <div ref={contentRef} className="px-4 pb-4 border-t border-border/50">
          <FieldTypeList sport={sport} />
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AdminSportsPage() {
  const queryClient = useQueryClient();
  const [sportModalOpen, setSportModalOpen] = useState(false);
  const [sportEditData, setSportEditData] = useState(null);
  const [sportDeleteId, setSportDeleteId] = useState(null);
  const [openSportId, setOpenSportId] = useState(null);

  const { data: sportsData, isLoading } = useQuery({
    queryKey: ["sports"],
    queryFn: () => sportService.getSports().then((r) => r.data),
  });

  const sports = sportsData?.items || sportsData || [];

  const deleteSportMutation = useMutation({
    mutationFn: (id) => sportService.deleteSport(id),
    onSuccess: () => {
      toast.success("Xóa môn thể thao thành công");
      queryClient.invalidateQueries({ queryKey: ["sports"] });
      setSportDeleteId(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || "Không thể xóa môn thể thao này"),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Môn thể thao & Loại sân
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Quản lý môn thể thao và các loại sân tương ứng
          </p>
        </div>
        <Button onClick={() => { setSportEditData(null); setSportModalOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Thêm môn thể thao
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded bg-muted" />
                </div>
                <div className="h-5 w-20 rounded-full bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : !sports?.length ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            icon={Trophy}
            title="Chưa có môn thể thao nào"
            description="Thêm môn thể thao đầu tiên để bắt đầu quản lý loại sân"
            action={
              <Button onClick={() => { setSportEditData(null); setSportModalOpen(true); }} className="gap-2">
                <Plus className="h-4 w-4" /> Thêm môn thể thao
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {sports.map((sport) => (
            <SportAccordionItem
              key={sport.id}
              sport={sport}
              isOpen={openSportId === sport.id}
              onToggle={() => setOpenSportId(openSportId === sport.id ? null : sport.id)}
              onEdit={() => { setSportEditData(sport); setSportModalOpen(true); }}
              onDelete={() => setSportDeleteId(sport.id)}
            />
          ))}
        </div>
      )}

      <SportModal open={sportModalOpen} onClose={() => setSportModalOpen(false)} editData={sportEditData} />

      <ConfirmDialog
        open={!!sportDeleteId}
        onOpenChange={(o) => !o && setSportDeleteId(null)}
        title="Xóa môn thể thao"
        description="Chỉ xóa được nếu không còn loại sân nào thuộc môn này."
        confirmText="Xóa"
        onConfirm={() => deleteSportMutation.mutate(sportDeleteId)}
        isLoading={deleteSportMutation.isPending}
      />
    </div>
  );
}