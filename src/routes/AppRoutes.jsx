import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { UserLayout } from "@/components/layout/UserLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { ProtectedRoute, AdminRoute, GuestRoute } from "./RouteGuards";

// Lazy load pages
const HomePage = lazy(() => import("@/pages/HomePage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/RegisterPage"));
const FieldListPage = lazy(() => import("@/pages/FieldListPage"));
const FieldDetailPage = lazy(() => import("@/pages/FieldDetailPage"));
const BookingCreatePage = lazy(() => import("@/pages/BookingCreatePage"));
const MyBookingsPage = lazy(() => import("@/pages/MyBookingsPage"));
const BookingDetailPage = lazy(() => import("@/pages/BookingDetailPage"));

const PaymentResultPage = lazy(() => import("@/pages/PaymentResultPage"));
const MyPaymentsPage = lazy(() => import("@/pages/MyPaymentsPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));

// Admin pages
const AdminDashboardPage = lazy(() => import("@/pages/admin/AdminDashboardPage"));
const AdminFieldsPage = lazy(() => import("@/pages/admin/AdminFieldsPage"));
const AdminLocationsPage = lazy(() => import("@/pages/admin/AdminLocationsPage"));
const AdminSportsPage = lazy(() => import("@/pages/admin/AdminSportsPage"));

const AdminPricesPage = lazy(() => import("@/pages/admin/AdminPricesPage"));
const AdminBookingsPage = lazy(() => import("@/pages/admin/AdminBookingsPage"));
const AdminUsersPage = lazy(() => import("@/pages/admin/AdminUsersPage"));
const AdminNotificationsPage = lazy(() => import("@/pages/admin/AdminNotificationsPage"));

function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* User routes */}
        <Route element={<UserLayout />}>
          <Route index element={<HomePage />} />
          <Route path="/fields" element={<FieldListPage />} />
          <Route path="/fields/:id" element={<FieldDetailPage />} />
          <Route
            path="/bookings"
            element={<ProtectedRoute><MyBookingsPage /></ProtectedRoute>}
          />
          <Route
            path="/bookings/create"
            element={<ProtectedRoute><BookingCreatePage /></ProtectedRoute>}
          />
          <Route
            path="/bookings/:id"
            element={<ProtectedRoute><BookingDetailPage /></ProtectedRoute>}
          />

          <Route
            path="/payment/vnpay-return"
            element={<ProtectedRoute><PaymentResultPage /></ProtectedRoute>}
          />
          <Route
            path="/payments"
            element={<ProtectedRoute><MyPaymentsPage /></ProtectedRoute>}
          />
          <Route
            path="/profile"
            element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
          />
          {/* Auth */}
          <Route
            path="/login"
            element={<GuestRoute><LoginPage /></GuestRoute>}
          />
          <Route
            path="/register"
            element={<GuestRoute><RegisterPage /></GuestRoute>}
          />
        </Route>

        {/* Admin routes */}
        <Route
          path="/admin"
          element={<AdminRoute><AdminLayout /></AdminRoute>}
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="fields" element={<AdminFieldsPage />} />
          <Route path="locations" element={<AdminLocationsPage />} />
          <Route path="sports" element={<AdminSportsPage />} />
          <Route path="prices" element={<AdminPricesPage />} />
          <Route path="bookings" element={<AdminBookingsPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="notifications" element={<AdminNotificationsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
