import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { bookingService } from "@/services/bookingService";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

const DAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const DAY_FULL = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];

const STATUS_STYLES = {
  PENDING:   "bg-amber-500/20 text-amber-600 border border-amber-500/30",
  PAID_PENDING_CONFIRMATION: "bg-amber-500/20 text-amber-600 border border-amber-500/30",
  CONFIRMED: "bg-emerald-500/20 text-emerald-600 border border-emerald-500/30",
  COMPLETED: "bg-blue-500/20 text-blue-600 border border-blue-500/30",
  CANCELLED: "bg-muted text-muted-foreground border border-border line-through",
};

/** Lấy ngày đầu tuần (Thứ 2) từ một Date */
function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = CN
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Format Date thành "YYYY-MM-DD" theo múi giờ local (VN) */
function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Format Date thành "DD/MM" */
function formatDMY(date) {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function WeeklyCalendar({ fieldId }) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [weekStart, setWeekStart] = useState(() => getMonday(today));

  // Tạo mảng 7 ngày trong tuần
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const weekEnd = weekDays[6];

  const bookingQueries = useQuery({
    queryKey: ["field-bookings-week", fieldId, toISO(weekStart)],
    queryFn: async () => {
      // Gọi song song 7 ngày bằng endpoint mới (không cần user đăng nhập)
      const promises = weekDays.map((day) =>
        bookingService
          .getBookingsByField(fieldId, toISO(day))
          .then((r) => r.data ?? [])
          .catch(() => [])
      );
      const results = await Promise.all(promises);
      
      // Map mỗi ngày => danh sách booking
      const map = {};
      weekDays.forEach((day, i) => {
        map[toISO(day)] = results[i];
      });
      return map;
    },
    staleTime: 1000 * 30,
  });

  const bookingMap = bookingQueries.data ?? {};
  const isLoading = bookingQueries.isLoading;

  const isPrevDisabled = weekStart <= getMonday(today);

  const goToPrev = () => {
    if (isPrevDisabled) return;
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const goToNext = () => {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const goToCurrentWeek = () => setWeekStart(getMonday(today));

  return (
    <div className="space-y-3">
      {/* Header điều hướng tuần */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {formatDMY(weekStart)} – {formatDMY(weekEnd)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2"
            onClick={goToCurrentWeek}
            disabled={isPrevDisabled}
          >
            Hôm nay
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={goToPrev}
            disabled={isPrevDisabled}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={goToNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Bảng lịch tuần */}
      <div className="grid grid-cols-7 gap-1.5 overflow-x-auto">
        {weekDays.map((day, i) => {
          const iso = toISO(day);
          const isToday = iso === toISO(today);
          const isPast = day < today;
          const dayBookings = bookingMap[iso] ?? [];

          return (
            <div
              key={iso}
              className={`min-h-[120px] rounded-xl border p-2 flex flex-col gap-1.5 transition-colors ${
                isToday
                  ? "border-primary bg-primary/5"
                  : isPast
                  ? "border-border bg-muted/30 opacity-60"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              {/* Header ngày */}
              <div className="text-center">
                <p
                  className={`text-[10px] font-medium uppercase tracking-wide ${
                    isToday ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {DAY_LABELS[i]}
                </p>
                <p
                  className={`text-base font-bold leading-tight ${
                    isToday ? "text-primary" : isPast ? "text-muted-foreground" : ""
                  }`}
                >
                  {day.getDate()}
                </p>
              </div>

              {/* Danh sách bookings */}
              {isLoading ? (
                <div className="flex-1 space-y-1">
                  <div className="h-5 rounded-md bg-muted animate-pulse" />
                  <div className="h-5 rounded-md bg-muted animate-pulse w-3/4" />
                </div>
              ) : dayBookings.length === 0 ? (
                <p className="text-[9px] text-center text-muted-foreground mt-auto mb-auto">
                  Trống
                </p>
              ) : (
                <div className="flex flex-col gap-1 overflow-y-auto max-h-[140px] scrollbar-hide">
                  {[...dayBookings]
                    .sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""))
                    .map((b) => (
                      <div
                        key={b.id}
                        className={`rounded-md px-1.5 py-1 text-[9px] leading-tight cursor-default ${
                          STATUS_STYLES[b.status] || STATUS_STYLES.PENDING
                        }`}
                        title={`${b.fieldName} · ${b.startTime?.slice(0, 5)}–${b.endTime?.slice(0, 5)} · ${b.status}`}
                      >
                        {/* Tên sân */}
                        <p className="font-bold truncate text-[10px]">{b.fieldName}</p>
                        {/* Khung giờ */}
                        <p className="font-semibold truncate">
                          {b.startTime?.slice(0, 5)}–{b.endTime?.slice(0, 5)}
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Chú thích */}
      <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
        {[
          { label: "Chờ xác nhận", cls: "bg-amber-500/20 border border-amber-500/30" },
          { label: "Đã xác nhận", cls: "bg-emerald-500/20 border border-emerald-500/30" },
          { label: "Hoàn thành", cls: "bg-blue-500/20 border border-blue-500/30" },
          { label: "Đã hủy", cls: "bg-muted border border-border" },
        ].map(({ label, cls }) => (
          <span key={label} className="flex items-center gap-1">
            <span className={`inline-block h-2.5 w-2.5 rounded-sm ${cls}`} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
