import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { locationService } from "@/services/locationService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { PaginationBar } from "@/components/common/PaginationBar";
import { TableRowSkeleton } from "@/components/common/Skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";

const locationSchema = z.object({
  name: z.string().min(1, "Tên địa điểm bắt buộc"),
  address: z.string().min(1, "Địa chỉ bắt buộc"),
  region: z.string().optional(),
  hotline: z.string().optional(),
});

function LocationModal({ open, onClose, editData }) {
  const queryClient = useQueryClient();
  const isEdit = !!editData;
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(locationSchema),
    defaultValues: editData || {},
  });

  const { data: detailData, isLoading } = useQuery({
    queryKey: ["location-detail", editData?.id],
    queryFn: () => locationService.getLocationById(editData.id).then(r => r.data),
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
      isEdit
        ? locationService.updateLocation(editData.id, data)
        : locationService.createLocation(data),
    onSuccess: () => {
      toast.success(isEdit ? "Cập nhật thành công" : "Tạo địa điểm thành công");
      queryClient.invalidateQueries({ queryKey: ["locations"] });
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
            {isEdit ? "Sửa địa điểm" : "Thêm địa điểm"}
            {isLoading && <span className="ml-2 text-xs text-muted-foreground animate-pulse">(Đang tải chi tiết...)</span>}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tên địa điểm</Label>
              <Input placeholder="Vd: Sân vận động Mỹ Đình" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Địa chỉ</Label>
              <Input placeholder="123 Nguyễn Trãi, Quận 1" {...register("address")} />
              {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Khu vực</Label>
              <Input placeholder="TP.HCM" {...register("region")} />
            </div>
            <div className="space-y-2">
              <Label>Hotline</Label>
              <Input placeholder="0901234567" {...register("hotline")} />
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

export default function AdminLocationsPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState("");

  const { data: locationsData, isLoading } = useQuery({
    queryKey: ["locations", page, pageSize, keyword],
    queryFn: () => locationService.getLocations({ page, size: pageSize, keyword }).then((r) => r.data),
  });

  const locations = locationsData?.items || locationsData || [];
  const totalItems = locationsData?.totalItems || 0;
  const totalPages = locationsData?.totalPages || 0;

  const deleteMutation = useMutation({
    mutationFn: (id) => locationService.deleteLocation(id),
    onSuccess: () => {
      toast.success("Xóa địa điểm thành công");
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      setDeleteId(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || "Không thể xóa địa điểm này"),
  });

  const handleEdit = (loc) => { setEditData(loc); setModalOpen(true); };
  const handleNew = () => { setEditData(null); setModalOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Quản lý địa điểm</h2>
          <p className="text-muted-foreground text-sm">CRUD địa điểm sân thể thao</p>
        </div>
        <Button onClick={handleNew} className="gap-2">
          <Plus className="h-4 w-4" /> Thêm địa điểm
        </Button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Tên địa điểm</TableHead>
              <TableHead>Địa chỉ</TableHead>
              <TableHead>Khu vực</TableHead>
              <TableHead>Hotline</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)
            ) : !locations?.length ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <EmptyState icon={MapPin} title="Chưa có địa điểm nào" action={<Button onClick={handleNew}>Thêm địa điểm</Button>} />
                </TableCell>
              </TableRow>
            ) : (
              locations.map((loc) => (
                <TableRow key={loc.id}>
                  <TableCell className="text-muted-foreground">#{loc.id}</TableCell>
                  <TableCell className="font-medium">{loc.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{loc.address}</TableCell>
                  <TableCell>{loc.region || "—"}</TableCell>
                  <TableCell>{loc.hotline || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(loc)} className="gap-1">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive border-destructive/40"
                        onClick={() => setDeleteId(loc.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
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

      <LocationModal open={modalOpen} onClose={() => setModalOpen(false)} editData={editData} />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Xóa địa điểm"
        description="Bạn có chắc chắn muốn xóa địa điểm này? Chỉ xóa được nếu không còn sân nào thuộc địa điểm."
        confirmText="Xóa"
        onConfirm={() => deleteMutation.mutate(deleteId)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
