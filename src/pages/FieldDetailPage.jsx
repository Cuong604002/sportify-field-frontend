import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { fieldService } from "@/services/fieldService"
import { bookingService } from "@/services/bookingService"
import { priceService } from "@/services/priceService"
import { paymentService } from "@/services/paymentService"
import { realtimeService } from "@/services/realtimeService"
import { useAuth } from "@/store/authStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/common/StatusBadge"
import { Skeleton } from "@/components/common/Skeleton"
import { formatCurrency } from "@/utils/formatCurrency"
import { formatDateToISO } from "@/utils/formatDate"
import { WeeklyCalendar } from "@/components/field/WeeklyCalendar"
import { toast } from "sonner"
import {
  MapPin,
  Clock,
  Calendar as CalendarIcon,
  CheckCircle,
  AlertCircle,
  Trophy,
} from "lucide-react"
import { DatePicker, TimePicker } from "antd"
import dayjs from "dayjs"

const bookingSchema = z
  .object({
    bookingDate: z.string().min(1, "Vui lòng chọn ngày"),
    startTime: z.string().min(1, "Vui lòng chọn giờ bắt đầu"),
    endTime: z.string().min(1, "Vui lòng chọn giờ kết thúc"),
    note: z.string().optional(),
  })
  .refine((d) => d.endTime > d.startTime, {
    message: "Giờ kết thúc phải lớn hơn giờ bắt đầu",
    path: ["endTime"],
  })

export default function FieldDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()

  const [availability, setAvailability] = useState(null)
  const [price, setPrice] = useState(null)
  const [checkingAvail, setCheckingAvail] = useState(false)
  const [calcingPrice, setCalcingPrice] = useState(false)
  const [slotUpdated, setSlotUpdated] = useState(false) // badge "Đang cập nhật..."

  const { data: field, isLoading } = useQuery({
    queryKey: ["field", id],
    queryFn: () => fieldService.getFieldById(id).then((r) => r.data),
  })

  // SSE: Subscribe real-time slot updates khi người khác vừa đặt hoặc huỷ sân này
  useEffect(() => {
    if (!id) return
    const sub = realtimeService.subscribeSlotUpdates(
      id,
      (event) => {
        if (event.event === "slot-update") {
          // Invalidate WeeklyCalendar query → tự động load lại lịch
          queryClient.invalidateQueries({ queryKey: ["bookings-field", String(id)] })
          queryClient.invalidateQueries({ queryKey: ["bookings", String(id)] })
          queryClient.invalidateQueries({ queryKey: ["field-bookings-week"] })
          // Re-check availability nếu user đã chọn khung giờ
          setAvailability(null)
          // Hiển thị badge "cập nhật"
          setSlotUpdated(true)
          setTimeout(() => setSlotUpdated(false), 3000)
        }
      }
    )
    return () => sub.close()
  }, [id, queryClient])

  const locationId = field?.location?.id || field?.locationId
  const fieldTypeId = field?.fieldType?.id || field?.fieldTypeId

  const { data: priceTable, isLoading: loadingPriceTable } = useQuery({
    queryKey: ["price-table", locationId, fieldTypeId],
    queryFn: () => priceService.getPriceTable(locationId, fieldTypeId).then((r) => r.data),
    enabled: !!locationId && !!fieldTypeId,
  })

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm({ resolver: zodResolver(bookingSchema) })

  const watchedDate = watch("bookingDate")
  const watchedStart = watch("startTime")
  const watchedEnd = watch("endTime")

  useEffect(() => {
    if (watchedDate && watchedStart && watchedEnd && watchedEnd > watchedStart) {
      const fetchInfo = async () => {
        setCheckingAvail(true)
        setCalcingPrice(true)
        setAvailability(null)
        setPrice(null)

        try {
          const req = {
            date: watchedDate,
            startTime: watchedStart,
            endTime: watchedEnd,
          }

          const [availRes, priceRes] = await Promise.all([
            bookingService
              .checkAvailability(id, watchedDate, watchedStart, watchedEnd)
              .catch((e) => e.response?.data || { success: false, message: e.response?.data?.message || "Lỗi kiểm tra trống" }),
            fieldService.calculatePrice(id, req).catch(() => ({ data: null })),
          ])

          let isAvail = false
          let availMsg = "Khung giờ này đã có người đặt, vui lòng chọn giờ khác!"

          if (availRes?.status === 200 || availRes?.success === true || (availRes && availRes.data === null)) {
            isAvail = true
          } else {
            isAvail = false
            availMsg = availRes?.message || availRes?.data?.message || availMsg
          }

          setAvailability(isAvail ? true : availMsg)
          setPrice(priceRes?.data !== undefined ? priceRes.data : priceRes)

          if (!isAvail) {
            toast.error(availMsg, { id: "avail-toast" })
          }
        } catch (error) {
          console.error("Lỗi khi lấy thông tin đặt sân", error)
        } finally {
          setCheckingAvail(false)
          setCalcingPrice(false)
        }
      }

      // Debounce 500ms
      const timer = setTimeout(fetchInfo, 500)
      return () => clearTimeout(timer)
    } else {
      setAvailability(null)
      setPrice(null)
    }
  }, [id, watchedDate, watchedStart, watchedEnd])

  const getDisabledStartTime = () => {
    let disabledHours = [0, 1, 2, 3, 4, 5, 12, 23];
    const isToday = watchedDate === dayjs().format("YYYY-MM-DD");
    const currentHour = dayjs().hour();
    const currentMinute = dayjs().minute();

    if (isToday) {
      for (let i = 0; i < currentHour; i++) {
        if (!disabledHours.includes(i)) disabledHours.push(i);
      }
    }

    return {
      disabledHours: () => disabledHours,
      disabledMinutes: (selectedHour) => {
        if (isToday && selectedHour === currentHour) {
          return Array.from({ length: currentMinute + 1 }, (_, i) => i);
        }
        return [];
      }
    };
  };

  const getDisabledEndTime = () => {
    let disabledHours = [0, 1, 2, 3, 4, 5];
    const startHour = watchedStart ? parseInt(watchedStart.split(":")[0]) : null;
    const startMin = watchedStart ? parseInt(watchedStart.split(":")[1]) : null;

    if (startHour !== null) {
      for (let i = 0; i <= startHour; i++) {
        if (!disabledHours.includes(i)) disabledHours.push(i);
      }
    }

    if (startHour !== null && startHour < 12) {
      for (let i = 13; i <= 23; i++) {
        if (!disabledHours.includes(i)) disabledHours.push(i);
      }
    }

    const isToday = watchedDate === dayjs().format("YYYY-MM-DD");
    const currentHour = dayjs().hour();
    const currentMinute = dayjs().minute();

    if (isToday && startHour === null) {
      for (let i = 0; i < currentHour; i++) {
        if (!disabledHours.includes(i)) disabledHours.push(i);
      }
    }

    return {
      disabledHours: () => disabledHours,
      disabledMinutes: (selectedHour) => {
        let mins = [];
        if (selectedHour === 12 || selectedHour === 23) {
          mins = Array.from({ length: 59 }, (_, i) => i + 1);
        }

        if (startHour !== null && selectedHour === startHour) {
          const m = Array.from({ length: startMin + 1 }, (_, i) => i);
          mins = [...new Set([...mins, ...m])];
        } else if (isToday && startHour === null && selectedHour === currentHour) {
          const m = Array.from({ length: currentMinute + 1 }, (_, i) => i);
          mins = [...new Set([...mins, ...m])];
        }

        return mins;
      }
    };
  };

  const createBookingMutation = useMutation({
    mutationFn: async (data) => {
      const res = await bookingService.createBooking({ ...data, fieldId: Number(id) });
      const bookingData = res?.data !== undefined ? (res.data?.data || res.data) : res;
      const bookingId = bookingData?.id || (typeof bookingData === "number" ? bookingData : null);
      if (!bookingId) {
        throw new Error("Không lấy được mã đơn đặt sân (Booking ID). Vui lòng thử lại!");
      }
      const paymentRes = await paymentService.createPayment({ bookingId, paymentMethod: 'VNPAY' });
      return paymentRes?.data !== undefined ? (paymentRes.data?.data || paymentRes.data) : paymentRes;
    },
    onSuccess: (data) => {
      const paymentUrl = data?.paymentUrl || data?.data?.paymentUrl;
      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        toast.success("Đặt sân thành công!");
        navigate("/bookings");
      }
    },
    onError: (e) => {
      toast.error(e.response?.data?.message || e.message || "Đặt sân thất bại");
    },
  });

  const onSubmit = (data) => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để đặt sân")
      navigate("/login")
      return
    }
    if (checkingAvail) {
      toast.error("Đang kiểm tra lịch trống, vui lòng đợi giây lát...")
      return
    }
    if (availability !== true) {
      toast.error(
        typeof availability === "string"
          ? availability
          : "Khung giờ này đã có người đặt, vui lòng chọn khung giờ khác!"
      )
      return
    }
    createBookingMutation.mutate(data)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (!field) {
    return (
      <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">
        Không tìm thấy sân
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/fields")}
          className="mb-4 -ml-2"
        >
          ← Quay lại
        </Button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">{field.name}</h1>
            {field.location && (
              <div className="flex items-center gap-1.5 mt-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>
                  {field.location.name} — {field.location.address}
                </span>
              </div>
            )}
          </div>
          <StatusBadge status={field.status} />
        </div>
      </div>

      {/* Lịch tuần — hiển thị các booking theo ngày */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Lịch đặt sân trong tuần
            {/* SSE real-time badge */}
            {slotUpdated && (
              <span className="text-xs text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full animate-pulse">
                ↻ Lịch vừa cập nhật!
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <WeeklyCalendar fieldId={id} />
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Field Info */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-gradient-to-br from-emerald-900/20 to-slate-900/20 h-64 flex items-center justify-center overflow-hidden">
            {field.imageUrl ? (
              <img src={field.imageUrl} alt={field.name} className="w-full h-full object-cover" />
            ) : (
              <Trophy className="h-20 w-20 text-emerald-500/40" />
            )}
          </div>

          <Card>
            <CardContent className="pt-6 space-y-3">
              {field.fieldType && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Loại sân:</span>
                  <span className="font-medium">{field.fieldType.name}</span>
                </div>
              )}
              {field.location && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Địa điểm:</span>
                    <span className="font-medium">{field.location.name}</span>
                  </div>
                  {field.location.hotline && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Hotline:</span>
                      <span className="font-medium">{field.location.hotline}</span>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Trạng thái:</span>
                <StatusBadge status={field.status} />
              </div>
              {field.description && (
                <div className="pt-3 border-t border-border mt-3">
                  <span className="text-muted-foreground text-sm block mb-1">Mô tả:</span>
                  <p className="text-sm">{field.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Bảng giá tham khảo</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPriceTable ? (
                <Skeleton className="h-32 w-full" />
              ) : priceTable?.length > 0 ? (
                <div className="space-y-4">
                  {["WEEKDAY", "WEEKEND"].map((dayType) => {
                    const typePrices = priceTable.filter((p) => p.dayType === dayType)
                    if (typePrices.length === 0) return null
                    return (
                      <div key={dayType} className="space-y-2">
                        <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-1.5">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {dayType === "WEEKDAY" ? "Ngày thường (T2 - T6)" : "Cuối tuần (T7 - CN)"}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {typePrices.map((p, i) => (
                            <div
                              key={i}
                              className="flex justify-between items-center p-2.5 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors text-sm"
                            >
                              <span className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                {p.startTime.substring(0, 5)} - {p.endTime.substring(0, 5)}
                              </span>
                              <span className="font-semibold text-emerald-600">
                                {formatCurrency(p.price)}/h
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground py-4">
                  Chưa có thông tin bảng giá
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Booking Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Đặt sân</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2 flex flex-col">
                <Label htmlFor="bookingDate">
                  <CalendarIcon className="inline h-4 w-4 mr-1" />
                  Ngày đặt sân
                </Label>
                <Controller
                  name="bookingDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      size="large"
                      format="YYYY-MM-DD"
                      minDate={dayjs()} // Không cho chọn ngày quá khứ
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date) => field.onChange(date ? date.format("YYYY-MM-DD") : "")}
                      status={errors.bookingDate ? "error" : ""}
                      className="w-full font-sans"
                      placeholder="Chọn ngày"
                      allowClear={false}
                    />
                  )}
                />
                {errors.bookingDate && (
                  <p className="text-xs text-destructive">{errors.bookingDate.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2 flex flex-col">
                  <Label htmlFor="startTime">
                    <Clock className="inline h-4 w-4 mr-1" />
                    Giờ bắt đầu
                  </Label>
                  <Controller
                    name="startTime"
                    control={control}
                    render={({ field }) => (
                      <TimePicker
                        size="large"
                        format="HH:mm"
                        minuteStep={15}
                        disabledTime={getDisabledStartTime}
                        hideDisabledOptions={true}
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
                  {errors.startTime && (
                    <p className="text-xs text-destructive">{errors.startTime.message}</p>
                  )}
                </div>
                <div className="space-y-2 flex flex-col">
                  <Label htmlFor="endTime">Giờ kết thúc</Label>
                  <Controller
                    name="endTime"
                    control={control}
                    render={({ field }) => (
                      <TimePicker
                        size="large"
                        format="HH:mm"
                        minuteStep={15}
                        disabledTime={getDisabledEndTime}
                        hideDisabledOptions={true}
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
                  {errors.endTime && (
                    <p className="text-xs text-destructive">{errors.endTime.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Ghi chú (tùy chọn)</Label>
                <Input id="note" placeholder="Ghi chú thêm..." {...register("note")} />
              </div>

              {/* Bỏ các nút bấm tay */}

              {/* Availability result */}
              {availability !== null && (
                <div
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                    availability === true
                      ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                      : "bg-destructive/10 text-destructive border border-destructive/20"
                  }`}
                >
                  {availability === true ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Sân còn trống trong khung giờ này!
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span className="leading-snug">{availability}</span>
                    </>
                  )}
                </div>
              )}

              {/* Price result */}
              {(price !== null || availability !== null) && (
                <div
                  className={`flex items-center justify-between rounded-lg px-3 py-2 border ${
                    price !== null ? "bg-primary/10 border-primary/20" : "bg-muted/30 border-border"
                  }`}
                >
                  <span className="text-sm text-muted-foreground">Ước tính:</span>
                  <span
                    className={`font-bold ${price !== null ? "text-primary text-lg" : "text-muted-foreground text-sm"}`}
                  >
                    {price !== null
                      ? formatCurrency(price?.totalPrice || price?.price || price)
                      : "Không xác định"}
                  </span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={
                  createBookingMutation.isPending ||
                  checkingAvail ||
                  availability !== true ||
                  field?.status !== "AVAILABLE"
                }
              >
                {createBookingMutation.isPending
                  ? "Đang đặt sân..."
                  : checkingAvail
                  ? "Đang kiểm tra lịch..."
                  : availability !== true
                  ? "Khung giờ không khả dụng"
                  : "Đặt sân ngay"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
