import { Header } from "./Header";
import { Footer } from "./Footer";
import { Outlet } from "react-router-dom";
import ChatWidget from "@/components/chat/ChatWidget";

export function UserLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      {/* AI Chat Widget — nổi ở góc phải dưới tất cả trang user */}
      <ChatWidget />
    </div>
  );
}

