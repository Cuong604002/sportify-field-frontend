import { Link } from "react-router-dom";
import { Trophy, Github, Facebook } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 font-bold text-lg mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Trophy className="h-4 w-4" />
              </div>
              <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                Sportify
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Nền tảng đặt sân thể thao trực tuyến hàng đầu. Nhanh chóng, tiện lợi, uy tín.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-3">Liên kết nhanh</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link></li>
              <li><Link to="/fields" className="hover:text-primary transition-colors">Sân thể thao</Link></li>
              <li><Link to="/bookings" className="hover:text-primary transition-colors">Đặt sân của tôi</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-3">Liên hệ</h4>
            <p className="text-sm text-muted-foreground">Email: support@sportify.vn</p>
            <p className="text-sm text-muted-foreground">Hotline: 1900 xxxx</p>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>© 2026 Sportify Booking. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
