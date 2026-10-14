import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fieldService } from "@/services/fieldService";
import { locationService } from "@/services/locationService";
import { sportService } from "@/services/sportService";
import { Button } from "@/components/ui/button";
import { FieldCardSkeleton } from "@/components/common/Skeleton";
import { MapPin, Search, Trophy, Zap, Shield, Clock, Users, CalendarCheck, Star, CheckCircle, CreditCard, ArrowRight } from "lucide-react";
import { useState } from "react";

function FieldCard({ field, onClick }) {
  const statusColors = {
    AVAILABLE: "text-emerald-400",
    MAINTENANCE: "text-amber-400",
  };
  return (
    <div
      className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      <div className="h-40 bg-gradient-to-br from-emerald-900/40 to-slate-900 flex items-center justify-center relative overflow-hidden">
        {field.imageUrl ? (
          <img src={field.imageUrl} alt={field.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <Trophy className="h-16 w-16 text-emerald-500/30 group-hover:scale-110 transition-transform duration-300" />
        )}
        <div className="absolute top-3 right-3">
          <span className={`text-xs font-medium ${statusColors[field.status] || "text-gray-400"}`}>
            ● {field.status === "AVAILABLE" ? "Có sẵn" : "Bảo trì"}
          </span>
        </div>
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
          {field.name}
        </h3>
        {field.location && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span className="line-clamp-1">{field.location.name}</span>
          </div>
        )}
        {field.fieldType && (
          <p className="text-xs text-muted-foreground">{field.fieldType.name}</p>
        )}
        <Button size="sm" className="w-full mt-3">Xem chi tiết</Button>
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedSport, setSelectedSport] = useState("");

  const { data: fieldsData, isLoading } = useQuery({
    queryKey: ["fields", { sportId: selectedSport }],
    queryFn: () => fieldService.getFields(selectedSport ? { sportId: selectedSport } : {}).then((r) => r.data),
  });

  const fields = fieldsData?.items || fieldsData || [];

  const { data: sports } = useQuery({
    queryKey: ["sports"],
    queryFn: () => sportService.getSports().then((r) => r.data),
  });

  const handleSearch = () => {
    const trimmed = search.trim();
    if (trimmed) {
      navigate(`/fields?name=${encodeURIComponent(trimmed)}`);
    } else {
      navigate("/fields");
    }
  };

  const features = [
    { icon: Zap, title: "Đặt sân nhanh chóng", desc: "Chỉ vài thao tác đơn giản, sân đã sẵn sàng cho bạn" },
    { icon: Shield, title: "Thanh toán an toàn", desc: "Hỗ trợ VNPAY và tiền mặt, bảo mật tuyệt đối" },
    { icon: Clock, title: "Kiểm tra lịch tức thì", desc: "Xem ngay lịch trống theo ngày và khung giờ" },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[520px] flex items-center">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="/images/bg-banner.png"
            alt="Sportify banner"
            className="w-full h-full object-cover object-center"
          />
          {/* Layer 1: dark base overlay */}
          <div className="absolute inset-0 bg-slate-950/60" />
          {/* Layer 2: gradient từ trái (đậm) sang phải (trong) để chữ bên trái dễ đọc */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/50 to-transparent" />
          {/* Layer 3: gradient từ trên xuống — đậm ở trên/dưới, trong ở giữa */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/70" />
          {/* Accent emerald glow ở góc trái trên */}
          <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-emerald-600/15 blur-3xl -translate-x-1/4 -translate-y-1/4" />
        </div>

        {/* Content */}
        <div className="relative container mx-auto px-4 py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/15 backdrop-blur-sm px-4 py-1.5 text-sm text-emerald-300 mb-6 shadow-lg shadow-emerald-900/30">
            <Trophy className="h-4 w-4" />
            <span>Nền tảng đặt sân thể thao #1 Việt Nam</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-2xl">
            Đặt sân thể thao
            <span className="block bg-gradient-to-r from-emerald-400 to-emerald-500 bg-clip-text text-transparent drop-shadow-none">
              Nhanh chóng &amp; Tiện lợi
            </span>
          </h1>

          <p className="text-lg text-slate-200 mb-10 max-w-2xl mx-auto drop-shadow-md">
            Tìm kiếm và đặt sân thể thao yêu thích của bạn chỉ trong vài giây. Hỗ trợ đa loại sân, đa địa điểm.
          </p>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto flex gap-3 bg-white/10 backdrop-blur-md border border-white/25 rounded-xl p-2 shadow-2xl shadow-slate-900/50">
            <div className="flex items-center gap-2 flex-1 bg-white/5 rounded-lg px-3">
              <Search className="h-4 w-4 text-slate-300 flex-shrink-0" />
              <input
                type="text"
                placeholder="Tìm kiếm sân theo tên hoặc địa điểm..."
                className="flex-1 bg-transparent text-white placeholder:text-slate-400 outline-none text-sm py-2"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button
              size="lg"
              onClick={handleSearch}
              className="bg-emerald-500 hover:bg-emerald-400 text-white shrink-0 shadow-lg shadow-emerald-900/40 transition-all"
            >
              Tìm kiếm
            </Button>
          </div>
        </div>
      </section>

      {/* Sport filters */}
      {sports && sports.length > 0 && (
        <section className="border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedSport("")}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  !selectedSport
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary hover:text-primary"
                }`}
              >
                Tất cả
              </button>
              {sports.map((sport) => (
                <button
                  key={sport.id}
                  onClick={() => setSelectedSport(sport.id)}
                  className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                    selectedSport === sport.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary hover:text-primary"
                  }`}
                >
                  {sport.name}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Fields Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Sân nổi bật</h2>
          <Button variant="outline" onClick={() => navigate("/fields")}>
            Xem tất cả
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <FieldCardSkeleton key={i} />
            ))}
          </div>
        ) : fields?.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Không tìm thấy sân nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {(fields || []).slice(0, 8).map((field) => (
              <FieldCard
                key={field.id}
                field={field}
                onClick={() => navigate(`/fields/${field.id}`)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── How It Works ────────────────────────────────────────── */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold mb-2">Đặt sân chỉ trong 3 bước</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Nhanh chóng, đơn giản — không cần gọi điện, không cần chờ đợi
          </p>
        </div>
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-[2.75rem] left-[calc(16.66%+1rem)] right-[calc(16.66%+1rem)] h-px bg-gradient-to-r from-emerald-500/40 via-emerald-500/60 to-emerald-500/40" />

          {[
            {
              step: "01",
              icon: Search,
              title: "Chọn sân",
              desc: "Tìm kiếm sân theo môn thể thao, địa điểm hoặc tên sân yêu thích",
            },
            {
              step: "02",
              icon: Clock,
              title: "Chọn khung giờ",
              desc: "Xem lịch trống theo ngày và đặt khung giờ phù hợp với bạn",
            },
            {
              step: "03",
              icon: CreditCard,
              title: "Thanh toán & Xác nhận",
              desc: "Thanh toán online qua VNPAY hoặc tiền mặt tại cơ sở — ngay lập tức có xác nhận",
            },
          ].map(({ step, icon: Icon, title, desc }) => (
            <div key={step} className="relative flex flex-col items-center text-center group">
              {/* Step circle */}
              <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 mb-5 group-hover:scale-110 transition-transform duration-300">
                <Icon className="h-6 w-6" />
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background text-[10px] font-bold">
                  {step}
                </span>
              </div>
              <h3 className="font-bold text-lg mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────────── */}
      <section className="mx-4 md:mx-8 mb-16 rounded-2xl overflow-hidden relative">
        <div
          className="relative min-h-[220px] flex items-center justify-center px-6 py-12"
          style={{
            backgroundImage: "url('/images/bg-banner.png')",
            backgroundSize: "cover",
            backgroundPosition: "center 30%",
          }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/85 via-slate-900/75 to-slate-900/85" />
          {/* Glow */}
          <div className="absolute left-0 top-0 w-96 h-full bg-emerald-500/10 blur-3xl" />

          <div className="relative z-10 text-center max-w-2xl mx-auto space-y-5">
            <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-medium">
              <CheckCircle className="h-4 w-4" />
              <span>Đăng ký miễn phí — Không mất phí ẩn</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-extrabold text-white leading-tight">
              Sẵn sàng tìm sân <span className="text-emerald-400">ngay hôm nay?</span>
            </h2>
            <p className="text-slate-300 text-sm md:text-base">
              Hàng trăm sân thể thao đang chờ bạn — đặt ngay trước khi hết khung giờ đẹp!
            </p>
            <Button
                size="lg"
                onClick={() => navigate("/fields")}
                className="bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-900/50 font-semibold gap-2"
              >
                Khám phá sân ngay
                <ArrowRight className="h-4 w-4" />
              </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/30 border-t border-border">
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-center mb-10">Tại sao chọn Sportify?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-card p-6 text-center hover:border-primary/40 transition-colors"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
