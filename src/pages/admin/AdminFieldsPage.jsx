import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { fieldService } from "@/services/fieldService"
import { locationService } from "@/services/locationService"
import { sportService } from "@/services/sportService"
import { fieldTypeService } from "@/services/fieldTypeService"
import { uploadService } from "@/services/uploadService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// import { NativeSelect } from "@/components/ui/select"
import { StatusBadge } from "@/components/common/StatusBadge"
import { PaginationBar } from "@/components/common/PaginationBar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { TableRowSkeleton } from "@/components/common/Skeleton"
import { EmptyState } from "@/components/common/EmptyState"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { toast } from "sonner"
import { Plus, Pencil, Search, Dumbbell, Trash2, Upload as UploadIcon, MapPin, Building2, Layers, CheckCircle2, XCircle, FilterX, ArrowUpDown, X } from "lucide-react"
import { Upload, Select as AntSelect } from "antd"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const fieldSchema = z.object({
  name: z.string().min(1, "Tên sân bắt buộc"),
  locationId: z.string().min(1, "Vui lòng chọn địa điểm"),
  fieldTypeId: z.string().min(1, "Vui lòng chọn loại sân"),
  description: z.string().optional(),
})

function FieldModal({ open, onClose, editData, locations, fieldTypes }) {
  const queryClient = useQueryClient()
  const isEdit = !!editData
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(fieldSchema),
    defaultValues: {},
  })

  const { data: detailData, isLoading } = useQuery({
    queryKey: ["field-detail", editData?.id],
    queryFn: () => fieldService.getFieldById(editData.id).then((r) => r.data),
    enabled: !!editData?.id && open,
  })

  useEffect(() => {
    if (detailData) {
      reset({
        name: detailData.name,
        locationId: String(detailData.location?.id || detailData.locationId || ""),
        fieldTypeId: String(detailData.fieldType?.id || detailData.fieldTypeId || ""),
        description: detailData.description || "",
      })
      setFile(null)
    } else if (!editData) {
      reset({})
      setFile(null)
    }
  }, [detailData, editData, reset, open])

  const mutation = useMutation({
    mutationFn: async (data) => {
      let finalImageUrl = detailData?.imageUrl || null
      if (file) {
        setUploading(true)
        try {
          const res = await uploadService.uploadImage(file)
          finalImageUrl = res.data?.data?.imageUrl || res.data?.imageUrl || res.data
          // depending on how interceptor handles it, might be just the url string if data is primitive
          if (typeof finalImageUrl === "object") {
             finalImageUrl = finalImageUrl.imageUrl;
          }
        } catch (e) {
          throw new Error("Lỗi tải ảnh lên")
        } finally {
          setUploading(false)
        }
      }

      const payload = {
        ...data,
        locationId: Number(data.locationId),
        fieldTypeId: Number(data.fieldTypeId),
        imageUrl: finalImageUrl,
      }

      if (isEdit) {
        return fieldService.updateField(editData.id, payload)
      } else {
        return fieldService.createField(payload)
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? "Cập nhật sân thành công" : "Tạo sân thành công")
      queryClient.invalidateQueries({ queryKey: ["admin-fields"] })
      reset()
      onClose()
    },
    onError: (e) => toast.error(e.message || e.response?.data?.message || "Có lỗi xảy ra"),
  })

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent onClose={onClose} className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Sửa sân" : "Thêm sân mới"}
            {isLoading && (
              <span className="ml-2 text-xs text-muted-foreground animate-pulse">
                (Đang tải chi tiết...)
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tên sân</Label>
                <Input placeholder="Nhập tên sân" {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Địa điểm</Label>
                <Controller
                  name="locationId"
                  control={control}
                  render={({ field }) => (
                    <AntSelect
                      {...field}
                      className="w-full h-10"
                      placeholder="-- Chọn địa điểm --"
                      options={locations?.map(l => ({ value: String(l.id), label: l.name }))}
                    />
                  )}
                />
                {errors.locationId && (
                  <p className="text-xs text-destructive">{errors.locationId.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Loại sân (Field Type ID)</Label>
                <Controller
                  name="fieldTypeId"
                  control={control}
                  render={({ field }) => (
                    <AntSelect
                      {...field}
                      className="w-full h-10"
                      placeholder="-- Chọn loại sân --"
                      options={fieldTypes?.map(ft => ({ value: String(ft.id), label: ft.name }))}
                    />
                  )}
                />
                {errors.fieldTypeId && (
                  <p className="text-xs text-destructive">{errors.fieldTypeId.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Ảnh đại diện (tùy chọn)</Label>
                <Upload
                  listType="picture-card"
                  maxCount={1}
                  beforeUpload={(f) => {
                    setFile(f)
                    return false
                  }}
                  onRemove={() => setFile(null)}
                >
                  <div>
                    <UploadIcon className="h-5 w-5 mx-auto text-muted-foreground" />
                    <div className="mt-2 text-xs">Tải ảnh lên</div>
                  </div>
                </Upload>
                {detailData?.imageUrl && !file && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">Ảnh hiện tại:</p>
                    <img src={detailData.imageUrl} alt="Current" className="h-20 object-cover rounded-md border" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Mô tả (tùy chọn)</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Mô tả về sân..."
                  {...register("description")}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={mutation.isPending || uploading}>
              {mutation.isPending || uploading ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo mới"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminFieldsPage() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  // Filters & Pagination state
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [name, setName] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [locationId, setLocationId] = useState("")
  const [sportId, setSportId] = useState("")
  const [status, setStatus] = useState("")
  const [sortBy, setSortBy] = useState("id")
  const [sortDir, setSortDir] = useState("desc")

  const { data: fieldsData, isLoading } = useQuery({
    queryKey: ["admin-fields", page, size, name, locationId, sportId, status, sortBy, sortDir],
    queryFn: () => fieldService.getFields({
      page, size,
      ...(name && { name }),
      ...(locationId && { locationId }),
      ...(sportId && { sportId }),
      ...(status && { status }),
      sortBy, sortDir
    }).then((r) => r.data),
  })

  const fields = fieldsData?.items || []
  const totalItems = fieldsData?.totalItems || 0
  const totalPages = fieldsData?.totalPages || 0

  const { data: locationsData } = useQuery({
    queryKey: ["locations-all"],
    queryFn: () => locationService.getLocations({ size: 100 }).then((r) => r.data),
  })
  const locations = locationsData?.items || locationsData || []

  const { data: sports } = useQuery({
    queryKey: ["sports"],
    queryFn: () => sportService.getSports().then((r) => r.data),
  })

  const { data: fieldTypes } = useQuery({
    queryKey: ["fieldTypes"],
    queryFn: () => fieldTypeService.getFieldTypes().then((r) => r.data),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, newStatus }) => fieldService.updateFieldStatus(id, newStatus),
    onSuccess: () => {
      toast.success("Cập nhật trạng thái thành công")
      queryClient.invalidateQueries({ queryKey: ["admin-fields"] })
    },
    onError: (e) => toast.error(e.response?.data?.message || "Lỗi cập nhật"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => fieldService.deleteField(id),
    onSuccess: () => {
      toast.success("Xóa sân thành công")
      queryClient.invalidateQueries({ queryKey: ["admin-fields"] })
      setDeleteId(null)
    },
    onError: (e) => toast.error(e.response?.data?.message || "Không thể xóa sân này"),
  })

  const handleEdit = (field) => {
    setEditData(field)
    setModalOpen(true)
  }
  const handleNew = () => {
    setEditData(null)
    setModalOpen(true)
  }
  const handleClose = () => {
    setModalOpen(false)
    setEditData(null)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setName(searchInput)
    setPage(0)
  }

  const handleClearFilters = () => {
    setSearchInput("")
    setName("")
    setLocationId("")
    setSportId("")
    setStatus("")
    setSortBy("id")
    setSortDir("desc")
    setPage(0)
  }

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortDir("asc")
    }
    setPage(0)
  }

  const SortableHead = ({ field, children }) => (
    <TableHead onClick={() => handleSort(field)} className="cursor-pointer hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={`h-3 w-3 ${sortBy === field ? "text-primary" : "text-muted-foreground/50"}`} />
      </div>
    </TableHead>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Quản lý Sân Thể Thao
            {totalItems > 0 && (
              <span className="ml-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold border border-primary/20">
                Tổng: {totalItems} sân
              </span>
            )}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Bảng dữ liệu nâng cao với bộ lọc trực quan</p>
        </div>
        <Button onClick={handleNew} className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" /> Thêm sân mới
        </Button>
      </div>

      {/* FILTER DASHBOARD */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4" /> Bộ lọc truy vấn
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên sân..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 pr-10"
              />
              {searchInput && (
                <button 
                  type="button" 
                  onClick={() => { setSearchInput(""); setName(""); setPage(0); }} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </form>
            
            {/* Location Select */}
            <div className="w-full md:w-64 ant-select-wrapper">
              <AntSelect
                value={locationId || undefined}
                onChange={(val) => { setLocationId(val || ""); setPage(0); }}
                className="w-full h-10"
                placeholder="Tất cả khu vực / Cơ sở"
                allowClear
                options={locations?.map(l => ({ value: String(l.id), label: `${l.name} - ${l.region}` }))}
              />
            </div>

            {/* Status Select */}
            <div className="w-full md:w-48 ant-select-wrapper">
              <AntSelect
                value={status || undefined}
                onChange={(val) => { setStatus(val || ""); setPage(0); }}
                className="w-full h-10"
                placeholder="Tất cả trạng thái"
                allowClear
                options={[
                  { value: "AVAILABLE", label: "Hoạt động" },
                  { value: "MAINTENANCE", label: "Bảo trì" }
                ]}
              />
            </div>
          </div>

          {/* Sports Filter Toggle Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
            <span className="text-sm font-medium text-muted-foreground mr-2">Môn thể thao:</span>
            <Button 
              variant={sportId === "" ? "default" : "outline"} 
              size="sm" 
              onClick={() => { setSportId(""); setPage(0); }}
              className="rounded-full"
            >
              Tất cả
            </Button>
            {sports?.map(s => (
              <Button 
                key={s.id}
                variant={sportId === String(s.id) ? "default" : "outline"} 
                size="sm" 
                onClick={() => { setSportId(String(s.id)); setPage(0); }}
                className="rounded-full gap-1.5"
              >
                <Dumbbell className="h-3.5 w-3.5" />
                {s.name}
              </Button>
            ))}

            <div className="flex-1" />
            <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-muted-foreground hover:text-foreground gap-1">
              <FilterX className="h-4 w-4" /> Xóa bộ lọc
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* DATA TABLE */}
      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <SortableHead field="id">ID</SortableHead>
              <SortableHead field="name">Tên sân</SortableHead>
              <SortableHead field="locationId">Cơ sở / Khu vực</SortableHead>
              <SortableHead field="fieldTypeId">Loại sân</SortableHead>
              <SortableHead field="status">Trạng thái</SortableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: size }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)
            ) : !fields?.length ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <EmptyState
                    icon={Dumbbell}
                    title="Không tìm thấy sân nào"
                    description="Thử thay đổi bộ lọc hoặc thêm sân mới"
                    action={<Button onClick={handleClearFilters} variant="outline" className="gap-2"><FilterX className="h-4 w-4"/> Xóa bộ lọc</Button>}
                  />
                </TableCell>
              </TableRow>
            ) : (
              fields.map((field) => (
                <TableRow key={field.id} className="group hover:bg-muted/20">
                  <TableCell className="text-muted-foreground font-medium">#{field.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {field.imageUrl ? (
                        <img src={field.imageUrl} alt={field.name} className="h-10 w-10 object-cover rounded-md border" />
                      ) : (
                        <div className="h-10 w-10 bg-muted rounded-md flex items-center justify-center border border-border/50">
                          <Dumbbell className="h-4 w-4 text-muted-foreground/50" />
                        </div>
                      )}
                      <div className="font-semibold">{field.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      {field.locationName || field.location?.name || "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                      {field.fieldTypeName || field.fieldType?.name || field.fieldTypeId || "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={field.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(field)}
                        className="h-8 px-2 gap-1"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Sửa
                      </Button>
                      {field.status === "AVAILABLE" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-100/50"
                          onClick={() =>
                            statusMutation.mutate({ id: field.id, newStatus: "MAINTENANCE" })
                          }
                        >
                          Bảo trì
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100/50"
                          onClick={() =>
                            statusMutation.mutate({ id: field.id, newStatus: "AVAILABLE" })
                          }
                        >
                          Mở lại
                        </Button>
                      )}

                      {field.status === "MAINTENANCE" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteId(field.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {totalPages > 0 && (
          <div className="p-1 border-t border-border">
            <PaginationBar
              page={page}
              pageSize={size}
              totalItems={totalItems}
              totalPages={totalPages}
              onPageChange={setPage}
              onPageSizeChange={(s) => {
                setSize(s);
                setPage(0);
              }}
            />
          </div>
        )}
      </div>

      <FieldModal
        open={modalOpen}
        onClose={handleClose}
        editData={editData}
        locations={locations}
        fieldTypes={fieldTypes}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Xóa sân"
        description="Bạn có chắc chắn muốn xóa sân này? Chỉ có thể xóa nếu không có booking nào."
        confirmText="Xóa"
        onConfirm={() => deleteMutation.mutate(deleteId)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
