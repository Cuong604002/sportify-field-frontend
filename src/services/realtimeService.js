/**
 * SportifyRealtimeClient — Utility service quản lý tất cả SSE connections
 *
 * Hỗ trợ 4 tính năng real-time:
 *  1. Payment status   → subscribePaymentStatus(bookingId, onEvent)
 *  2. Admin dashboard  → subscribeDashboard(onEvent)
 *  3. Slot updates     → subscribeSlotUpdates(fieldId, onEvent)
 *  4. Owner alerts     → subscribeOwnerNotifications(onEvent)
 *
 * Cách dùng:
 *  import { realtimeService } from '@/services/realtimeService';
 *
 *  // Subscribe
 *  const sub = realtimeService.subscribePaymentStatus(bookingId, (data) => {
 *    if (data.status === 'PAID_PENDING_CONFIRMATION') { ... }
 *  });
 *
 *  // Unsubscribe khi unmount
 *  realtimeService.disconnect(sub);
 */

const API_GATEWAY_URL =
  import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:8080";
const BOOKING_SERVICE_URL =
  import.meta.env.VITE_BOOKING_SERVICE_URL || "http://localhost:8083";
const PAYMENT_SERVICE_URL =
  import.meta.env.VITE_PAYMENT_SERVICE_URL || "http://localhost:8084";

// Retry backoff config
const INITIAL_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 30000;
const MAX_RETRIES = 10;

/**
 * Tạo một SSE subscription với auto-reconnect.
 *
 * @param {string} url            - URL của SSE endpoint
 * @param {Function} onEvent      - Callback nhận parsed JSON data
 * @param {Function} [onError]    - Callback khi có lỗi kết nối
 * @param {Function} [onConnected]- Callback khi kết nối thành công
 * @returns {{ close: Function }} - Object có method close() để dừng subscription
 */
function createSseSubscription(url, onEvent, onError, onConnected) {
  let eventSource = null;
  let retryCount = 0;
  let retryDelay = INITIAL_RETRY_DELAY_MS;
  let retryTimer = null;
  let isClosed = false;

  function connect() {
    if (isClosed) return;

    try {
      eventSource = new EventSource(url);

      eventSource.onopen = () => {
        retryCount = 0;
        retryDelay = INITIAL_RETRY_DELAY_MS;
        if (onConnected) onConnected(url);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Bỏ qua heartbeat "connected" events
          if (data.event === "connected") return;
          onEvent(data);
        } catch (e) {
          // Nếu không parse được JSON, gửi raw string
          onEvent(event.data);
        }
      };

      eventSource.onerror = (error) => {
        if (isClosed) return;

        eventSource.close();
        eventSource = null;

        if (onError) onError(error);

        if (retryCount < MAX_RETRIES) {
          retryCount++;
          retryTimer = setTimeout(() => {
            retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY_MS);
            connect();
          }, retryDelay);
        }
      };
    } catch (e) {
      if (onError) onError(e);
    }
  }

  connect();

  return {
    close() {
      isClosed = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    },
    get readyState() {
      return eventSource ? eventSource.readyState : EventSource.CLOSED;
    },
  };
}

// ── Tính năng 1: Payment Status ───────────────────────────────────────────────

/**
 * Subscribe real-time payment status theo bookingId.
 *
 * Event payload: { event: "payment-status", bookingId, status, txnRef }
 * Possible status: "PAID_PENDING_CONFIRMATION" | "SUCCESS" | "FAILED" | "CANCELLED"
 *
 * @param {number|string} bookingId
 * @param {Function} onEvent   - Callback nhận event data
 * @param {Function} [onError] - Callback khi lỗi kết nối
 * @returns {{ close: Function }}
 *
 * @example
 * const sub = realtimeService.subscribePaymentStatus(42, (data) => {
 *   if (data.status === 'PAID_PENDING_CONFIRMATION') {
 *     navigate('/payment/success');
 *   }
 * });
 * // Dừng khi unmount
 * return () => sub.close();
 */
function subscribePaymentStatus(bookingId, onEvent, onError) {
  const url = `${PAYMENT_SERVICE_URL}/api/v1/payments/events/${bookingId}`;
  return createSseSubscription(url, onEvent, onError);
}

// ── Tính năng 2: Admin Dashboard ─────────────────────────────────────────────

/**
 * Subscribe real-time dashboard updates cho admin.
 *
 * Event payload: { event: "dashboard-update", type: "new_booking"|"payment_success", data: {...} }
 *
 * @param {Function} onEvent
 * @param {Function} [onError]
 * @returns {{ close: Function }}
 *
 * @example
 * const sub = realtimeService.subscribeDashboard((data) => {
 *   if (data.type === 'new_booking') refetchBookings();
 *   if (data.type === 'payment_success') refetchRevenue();
 * });
 */
function subscribeDashboard(onEvent, onError) {
  const url = `${API_GATEWAY_URL}/api/v1/events/dashboard`;
  return createSseSubscription(url, onEvent, onError);
}

// ── Tính năng 3: Slot Updates (Lịch Sân) ────────────────────────────────────

/**
 * Subscribe real-time slot updates theo fieldId.
 * Dùng cho trang xem lịch sân — tự động cập nhật khi có booking mới hoặc huỷ.
 *
 * Event payload: { event: "slot-update", fieldId, date, startTime, endTime, status }
 * Possible status: "PENDING" | "CONFIRMED" | "CANCELLED"
 *
 * @param {number|string} fieldId
 * @param {Function} onEvent
 * @param {Function} [onError]
 * @returns {{ close: Function }}
 *
 * @example
 * const sub = realtimeService.subscribeSlotUpdates(fieldId, (data) => {
 *   // Cập nhật lại lịch hiển thị
 *   if (data.date === selectedDate) refetchSchedule();
 * });
 */
function subscribeSlotUpdates(fieldId, onEvent, onError) {
  const url = `${BOOKING_SERVICE_URL}/api/v1/bookings/events/field/${fieldId}`;
  return createSseSubscription(url, onEvent, onError);
}

// ── Tính năng 4: Owner Notifications (Thông Báo Chủ Sân) ────────────────────

/**
 * Subscribe real-time booking notifications cho chủ sân.
 * Admin panel nhận thông báo ngay khi có booking PENDING mới.
 *
 * Event payload: { event: "new-booking-notification", booking: { BookingResponse } }
 *
 * @param {Function} onEvent
 * @param {Function} [onError]
 * @returns {{ close: Function }}
 *
 * @example
 * const sub = realtimeService.subscribeOwnerNotifications((data) => {
 *   const { booking } = data;
 *   showToast(`Booking mới: ${booking.fieldName} lúc ${booking.startTime}`);
 * });
 */
function subscribeOwnerNotifications(onEvent, onError) {
  let ws = null;
  let isClosed = false;
  
  function connect() {
    if (isClosed) return;
    try {
      const authStoreStr = localStorage.getItem("auth-storage");
      let token = "";
      if (authStoreStr) {
        const parsed = JSON.parse(authStoreStr);
        token = parsed.state?.token || "";
      }
      
      const wsUrl = `${API_GATEWAY_URL.replace("http", "ws")}/api/v1/ws/admin?token=${token}`;
      ws = new WebSocket(wsUrl);
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Fake SSE event structure just in case consumers expect data.event
          if (!data.event) {
             data.event = "new-booking-notification";
          }
          onEvent(data);
        } catch(e) {}
      };
      
      ws.onerror = (err) => {
        if (onError) onError(err);
      };
      
      ws.onclose = () => {
        if (!isClosed) {
          setTimeout(connect, 5000);
        }
      };
    } catch(e) {
      if (onError) onError(e);
    }
  }
  
  connect();
  
  return {
    close() {
      isClosed = true;
      if (ws) {
        ws.close();
      }
    }
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export const realtimeService = {
  subscribePaymentStatus,
  subscribeDashboard,
  subscribeSlotUpdates,
  subscribeOwnerNotifications,
  /**
   * Đóng một subscription cụ thể.
   * @param {{ close: Function }} subscription
   */
  disconnect(subscription) {
    if (subscription && typeof subscription.close === "function") {
      subscription.close();
    }
  },
};

export default realtimeService;
