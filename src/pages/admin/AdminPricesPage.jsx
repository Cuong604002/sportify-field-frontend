import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { priceService } from "@/services/priceService";
import { locationService } from "@/services/locationService";
import { fieldTypeService } from "@/services/fieldTypeService";
import { PaginationBar } from "@/components/common/PaginationBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { TableRowSkeleton } from "@/components/common/Skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { formatCurrency } from "@/utils/formatCurrency";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { TimePicker } from "antd";
import dayjs from "dayjs";

const priceSchema = z
  .object({
    locationId: z.string().min(1, "Vui lòng chọn địa điểm"),
    fieldTypeId: z.string().min(1, "Vui lòng nhập loại sân"),
    startTime: z.string().min(1, "Giờ bắt đầu bắt buộc"),
    endTime: z.string().min(1, "Giờ kết thúc bắt buộc"),
    price: z.string().refine((v) => Number(v) > 0, "Giá phải lớn hơn 0"),
    dayType: z.enum(["WEEKDAY", "WEEKEND"]),
  })
  .refine((d) => d.endTime > d.startTime, {
    message: "Giờ kết thúc phải lớn hơn giờ bắt đầu",
    path: ["endTime"],
  });

function PriceModal({ open, onClose, editData, locations, fieldTypes }) {
  const queryClient = useQueryClient();
  const isEdit = !!editData;
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
    resolver: zodResolver(priceSchema),
    defaultValues: editData
      ? {
          ...editData,
          locationId: String(editData.locationId),
          fieldTypeId: String(editData.fieldTypeId),
          price: String(editData.price),
        }
      : { dayType: "WEEKDAY" },
  });

  const { data: detailData, isLoading } = useQuery({
    queryKey: ["price-detail", editData?.id],
    queryFn: () => priceService.getPriceById(editData.id).then(r => r.data),
    enabled: !!editData?.id && open,
  });

  useEffect(() => {
    if (detailData) {
      reset({
        ...detailData,
        locationId: String(detailData.location?.id || detailData.locationId || ""),
        fieldTypeId: String(detailData.fieldType?.id || detailData.fieldTypeId || ""),
        price: String(detailData.price),
      });
    } else if (!editData) {
      reset({ dayType: "WEEKDAY" });
    }
  }, [detailData, editData, reset, open]);

  const mutation = useMutation({
    mutationFn: (data) => {
      const payload = { ...data, locationId: Number(data.locationId), fieldTypeId: Number(data.fieldTypeId), price: Number(data.price) };
      return isEdit ? priceService.updatePrice(editData.id, payload) : priceService.createPrice(payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? "Cập nhật giá thành công" : "Thêm giá thành công");
      queryClient.invalidateQueries({ queryKey: ["admin-prices"] });
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
            {isEdit ? "Sửa giá" : "Thêm bảng giá"}
            {isLoading && <span className="ml-2 text-xs text-muted-foreground animate-pulse">(Đang tải chi tiết...)</span>}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Địa điểm</Label>
            <NativeSelect {...register("locationId")}>
              <option value="">-- Chọn địa điểm --</option>
              {locations?.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </NativeSelect>
            {errors.locationId && <p className="text-xs text-destructive">{errors.locationId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Loại sân</Label>
            <NativeSelect {...register("fieldTypeId")}>
              <option value="">-- Chọn loại sân --</option>
              {fieldTypes?.map((ft) => (
                <option key={ft.id} value={ft.id}>{ft.name}</option>
              ))}
            </NativeSelect>
            {errors.fieldTypeId && <p className="text-xs text-destructive">{errors.fieldTypeId.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2 flex flex-col">
              <Label>Giờ bắt đầu</Label>
              <Controller
                name="startTime"
                control={control}
                render={({ field }) => (
                  <TimePicker
                    size="large"
                    format="HH:mm"
                    minuteStep={30}
                    value={field.value ? dayjs(`2000-01-01T${field.value}`) : null}
                    onChange={(time) => field.onChange(time ? time.format("HH:mm") : "")}
                    status={errors.startTime ? "error" : ""}
                    className="w-full font-sans"
                    placeholder="Chọn giờ"
                    allowClear={false}
                    needConfirm={false}
                  />
                )}
              />
              {errors.startTime && <p className="text-xs text-destructive">{errors.startTime.message}</p>}
            </div>
            <div className="space-y-2 flex flex-col">
              <Label>Giờ kết thúc</Label>
              <Controller
                name="endTime"
                control={control}
                render={({ field }) => (
                  <TimePicker
                    size="large"
                    format="HH:mm"
                    minuteStep={30}
                    value={field.value ? dayjs(`2000-01-01T${field.value}`) : null}
                    onChange={(time) => field.onChange(time ? time.format("HH:mm") : "")}
                    status={errors.endTime ? "error" : ""}
                    className="w-full font-sans"
                    placeholder="Chọn giờ"
                    allowClear={false}
                    needConfirm={false}
                  />
                )}
              />
              {errors.endTime && <p className="text-xs text-destructive">{errors.endTime.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Giá (VNĐ)</Label>
              <Input type="number" placeholder="100000" {...register("price")} />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Loại ngày</Label>
              <NativeSelect {...register("dayType")}>
                <option value="WEEKDAY">Ngày thường</option>
                <option value="WEEKEND">Cuối tuần</option>
              </NativeSelect>
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

export default function AdminPricesPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [filterLocation, setFilterLocation] = useState("");
  const [filterFieldType, setFilterFieldType] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const { data: pricesData, isLoading } = useQuery({
    queryKey: ["admin-prices", filterLocation, filterFieldType, page, pageSize],
    queryFn: () => priceService.getPrices({
      page,
      size: pageSize,
      ...(filterLocation && { locationId: filterLocation }),
      ...(filterFieldType && { fieldTypeId: filterFieldType })
    }).then((r) => r.data),
  });

  const prices = pricesData?.items || pricesData || [];
  const totalItems = pricesData?.totalItems || 0;
  const totalPages = pricesData?.totalPages || 0;

  const { data: locations } = useQuery({
    queryKey: ["locations"],
    queryFn: () => locationService.getLocations().then((r) => r.data),
  });

  const { data: fieldTypes } = useQuery({
    queryKey: ["fieldTypes"],
    queryFn: () => fieldTypeService.getFieldTypes().then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => priceService.deletePrice(id),
    onSuccess: () => {
      toast.success("Xóa giá thành công");
      queryClient.invalidateQueries({ queryKey: ["admin-prices"] });
      setDeleteId(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || "Không thể xóa"),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">Quản lý bảng giá</h2>
          <p className="text-muted-foreground text-sm">Thiết lập giá theo khung giờ</p>
        </div>
        <div className="flex items-center gap-3">
          <NativeSelect
            value={filterLocation}
            onChange={(e) => { setFilterLocation(e.target.value); setPage(0); }}
            className="w-44"
          >
            <option value="">Tất cả địa điểm</option>
            {locations?.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </NativeSelect>
          <NativeSelect
            value={filterFieldType}
            onChange={(e) => { setFilterFieldType(e.target.value); setPage(0); }}
            className="w-44"
          >
            <option value="">Tất cả loại sân</option>
            {fieldTypes?.map((ft) => <option key={ft.id} value={ft.id}>{ft.name}</option>)}
          </NativeSelect>
          <Button onClick={() => { setEditData(null); setModalOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Thêm giá
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-card p-4 space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <TableRowSkeleton key={i} cols={1} />)}
          </div>
        ) : !prices?.length ? (
          <EmptyState icon={Tag} title="Chưa có quy tắc giá nào" />
        ) : (
          ["WEEKDAY", "WEEKEND", "HOLIDAY"].map((dayType) => {
            const groupPrices = prices.filter((p) => p.dayType === dayType);
            if (groupPrices.length === 0) return null;
            return (
              <div key={dayType} className="space-y-3">
                <h3 className="font-semibold text-primary flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  NHÓM: {dayType === "WEEKDAY" ? "NGÀY THƯỜNG (Thứ 2 - Thứ 6)" : dayType === "WEEKEND" ? "CUỐI TUẦN (Thứ 7 - CN)" : "NGÀY LỄ"}
                </h3>
                <div className="grid gap-2 pl-4 border-l-2 border-muted">
                  {groupPrices.map((price) => (
                    <div key={price.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border bg-background hover:border-primary/30 transition-colors gap-4">
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                        <div className="text-muted-foreground min-w-[120px]">
                          Khung giờ: <span className="font-medium text-foreground">{price.startTime.substring(0, 5)} - {price.endTime.substring(0, 5)}</span>
                        </div>
                        <div className="text-muted-foreground min-w-[120px]">
                          Đơn giá: <span className="font-medium text-emerald-600">{formatCurrency(price.price)} / giờ</span>
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {price.locationName || price.location?.name} • {price.fieldTypeName || price.fieldType?.name}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button size="sm" variant="outline" onClick={() => { setEditData(price); setModalOpen(true); }}>
                          <Pencil className="h-3.5 w-3.5 mr-1" /> Sửa
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive border-destructive/40" onClick={() => setDeleteId(price.id)}>
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Xóa
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}

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

      <PriceModal open={modalOpen} onClose={() => setModalOpen(false)} editData={editData} locations={locations} fieldTypes={fieldTypes} />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Xóa giá"
        description="Xóa khung giờ giá này?"
        confirmText="Xóa"
        onConfirm={() => deleteMutation.mutate(deleteId)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
