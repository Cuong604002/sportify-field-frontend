import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { notificationService } from "@/services/notificationService"
import { PaginationBar } from "@/components/common/PaginationBar"
import { Button } from "@/components/ui/button"
import { BellRing, Check, Clock, CheckCircle2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { toast } from "react-hot-toast"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { cn } from "@/lib/utils"

export default function AdminNotificationsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [search, setSearch] = useState("")
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["admin-notifications", page, size, search],
    queryFn: () => notificationService.getNotifications(page, size, search),
  })

  const markAsReadMutation = useMutation({
    mutationFn: (id) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] })
      queryClient.invalidateQueries({ queryKey: ["unread-notifications"] })
    }
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] })
      queryClient.invalidateQueries({ queryKey: ["unread-notifications"] })
      toast.success("Đã đánh dấu tất cả là đã đọc")
    }
  })

  const notifications = data?.items || []
  const totalItems = data?.totalItems || 0
  const totalPages = data?.totalPages || 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BellRing className="h-6 w-6 text-primary" />
            Lịch sử Thông báo
            {totalItems > 0 && (
              <span className="ml-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold border border-primary/20">
                Tổng: {totalItems}
              </span>
            )}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Quản lý và xem lại tất cả các thông báo hệ thống
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm theo mã đơn hoặc tên..."
              className="pl-9 bg-white"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(0)
              }}
            />
          </div>
          <Button 
          onClick={() => markAllAsReadMutation.mutate()}
          disabled={markAllAsReadMutation.isPending || notifications.every(n => n.read)}
          className="gap-2"
        >
          <CheckCircle2 className="h-4 w-4" />
          Đánh dấu tất cả đã đọc
        </Button>
      </div>
      </div>


      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Đang tải dữ liệu...</div>
          ) : notifications.length === 0 ? (
            <div className="p-16 text-center">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <BellRing className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Không có thông báo nào</h3>
              <p className="text-muted-foreground mt-1">Hệ thống chưa ghi nhận thông báo nào cho bạn.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div 
                key={notif.id}
                onClick={() => {
                  if (!notif.isRead) markAsReadMutation.mutate(notif.id);
                  if (notif.type?.startsWith("PAYMENT_SUCCESS")) {
                    const searchId = notif.bookingId || (notif.type.includes(":") ? notif.type.split(":")[1] : "");
                    navigate(searchId ? `/admin/bookings?search=${searchId}` : `/admin/bookings`);
                  } else {
                    navigate(`/admin/bookings`);
                  }
                }}
                className={cn(
                  "p-4 md:p-6 transition-colors flex flex-col md:flex-row gap-4 md:items-start justify-between cursor-pointer group",
                  !notif.isRead ? "bg-primary/5 hover:bg-primary/10" : "bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-muted/50"
                )}
              >
                <div className="flex gap-4 items-start">
                  <div className={cn(
                    "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                    !notif.isRead ? "bg-primary text-primary-foreground shadow-sm" : "bg-slate-100 text-slate-400 dark:bg-muted dark:text-muted-foreground"
                  )}>
                    <BellRing className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={cn("text-base", !notif.isRead ? "font-semibold text-slate-900" : "font-medium text-slate-500 dark:text-slate-400")}>
                      {notif.title}
                    </h4>
                    <p className={cn("text-sm mt-1.5 leading-relaxed", !notif.isRead ? "text-slate-700 dark:text-slate-300" : "text-slate-500 dark:text-muted-foreground")}>
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground font-medium">
                      <Clock className="h-3.5 w-3.5" />
                      {notif.createdAt && format(new Date(notif.createdAt), "HH:mm, dd 'tháng' MM, yyyy", { locale: vi })}
                    </div>
                  </div>
                </div>
                {notif.isRead ? (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    disabled
                    className="whitespace-nowrap self-start mt-2 md:mt-0 text-slate-400"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    Đã xem
                  </Button>
                ) : (
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsReadMutation.mutate(notif.id);
                    }}
                    className="whitespace-nowrap self-start mt-2 md:mt-0 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Check className="h-4 w-4 mr-1.5" />
                    Đánh dấu đã đọc
                  </Button>
                )}
              </div>
            ))
          )}
        </div>

        {totalItems > 0 && (
          <PaginationBar
            page={page}
            pageSize={size}
            totalItems={totalItems}
            totalPages={totalPages}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setSize(newSize)
              setPage(0)
            }}
          />
        )}
      </div>
    </div>
  )
}
