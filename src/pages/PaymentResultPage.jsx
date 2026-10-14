import { useEffect, useState, useRef } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import apiClient from "@/api/axiosClient"

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState("processing") // 'processing', 'success', 'failed'
  const processedRef = useRef(false)

  const handleNavigateBookings = () => {
    queryClient.invalidateQueries(["my-bookings"])
    navigate("/bookings")
  }

  useEffect(() => {
    // Ngăn chặn chạy 2 lần do React Strict Mode hoặc searchParams thay đổi
    if (processedRef.current) return
    processedRef.current = true

    // Đọc status từ URL TRƯỚC khi xóa (tránh đọc lại sau replaceState)
    const urlStatus = new URLSearchParams(window.location.search).get("status")
    console.log("urlStatus", urlStatus)

    if (!urlStatus) {
      setStatus("failed")
    } else if (urlStatus === "success" || urlStatus === "00") { // Accept "00" as success just in case vnpay sends raw code
      setStatus("success")
    } else {
      setStatus("failed")
    }

    // Xóa các tham số trên URL cho sạch đẹp (sau khi đã đọc xong)
    window.history.replaceState(null, "", window.location.pathname)

  }, []) // ← dependency rỗng: chỉ chạy 1 lần khi mount

  return (
    <div className="container mx-auto px-4 py-16 max-w-lg text-center">
      {status === "processing" && (
        <div className="space-y-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h2 className="text-xl font-semibold">Đang xử lý thanh toán...</h2>
          <p className="text-muted-foreground">Vui lòng không đóng trình duyệt.</p>
        </div>
      )}

      {status === "success" && (
        <div className="space-y-4 animate-in zoom-in duration-300">
          <div className="rounded-full bg-emerald-500/10 p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-emerald-600 mb-3">Thanh toán thành công!</h2>
          <p className="text-muted-foreground mb-8">
            Đơn đặt sân của bạn đã được thanh toán và xác nhận. Cảm ơn bạn đã sử dụng dịch vụ.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={handleNavigateBookings}>
              Quản lý đặt sân
            </Button>
            <Button onClick={() => navigate("/")}>Về trang chủ</Button>
          </div>
        </div>
      )}

      {status === "failed" && (
        <div className="space-y-4 animate-in zoom-in duration-300">
          <div className="rounded-full bg-destructive/10 p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <XCircle className="h-12 w-12 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold text-destructive mb-3">Thanh toán thất bại</h2>
          <p className="text-muted-foreground mb-8">
            Giao dịch đã bị hủy hoặc có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại sau.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={handleNavigateBookings}>
              Quản lý đặt sân
            </Button>
            <Button onClick={() => navigate("/")}>Về trang chủ</Button>
          </div>
        </div>
      )}
    </div>
  )
}
