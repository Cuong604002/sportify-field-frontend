import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fieldService } from "@/services/fieldService";
import { locationService } from "@/services/locationService";
import { sportService } from "@/services/sportService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/common/StatusBadge";
import { FieldCardSkeleton } from "@/components/common/Skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import {
  MapPin,
  Search,
  Filter,
  Trophy,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const PAGE_SIZE = 9; // số sân mỗi trang

// ─── Search helpers ──────────────────────────────────────────────────────────

function removeAccents(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

/** Trim + thu gọn khoảng trắng: "  da   bong  " → "da bong" */
function normalizeKeyword(raw) {
  return raw.trim().replace(/\s+/g, " ");
}

/**
 * Client-side accent-insensitive AND filter.
 * Dùng để lọc thêm trên kết quả backend (backend chỉ LIKE không xóa dấu).
 */
function matchesSearch(field, keyword) {
  if (!keyword) return true;
  const tokens = keyword
    .split(" ")
    .map((t) => removeAccents(t.toLowerCase()))
    .filter(Boolean);
  if (tokens.length === 0) return true;

  const haystack = removeAccents(
    [
      field.name || "",
      field.locationName || field.location?.name || "",
      field.locationAddress || field.location?.address || "",
      field.sportName || "",
      field.fieldTypeName || field.fieldType?.name || "",
    ]
      .join(" ")
      .toLowerCase()
  );

  return tokens.every((token) => haystack.includes(token));
}

// ─── Pagination component ─────────────────────────────────────────────────────

function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  // Tạo danh sách trang hiển thị (window ±2 quanh trang hiện tại)
  const getPages = () => {
    const pages = [];
    const start = Math.max(0, page - 2);
    const end = Math.min(totalPages - 1, page + 2);
    if (start > 0) {
      pages.push(0);
      if (start > 1) pages.push("...");
    }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) {
      if (end < totalPages - 2) pages.push("...");
      pages.push(totalPages - 1);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      {/* Prev */}
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 0}
        className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="h-4 w-4" />
        Trước
      </button>

      {/* Page numbers */}
      {getPages().map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground select-none">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`min-w-[36px] rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              p === page
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-muted"
            }`}
          >
            {p + 1}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages - 1}
        className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Sau
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function FieldListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlName = searchParams.get("name") || "";
  const urlLocationId = searchParams.get("locationId") || "";
  const urlSportId = searchParams.get("sportId") || "";
  const urlPage = Number(searchParams.get("page") || "0");

  const [inputValue, setInputValue] = useState(urlName);
  const [search, setSearch] = useState(normalizeKeyword(urlName));
  const [selectedLocation, setSelectedLocation] = useState(
    urlLocationId ? Number(urlLocationId) : ""
  );
  const [selectedSport, setSelectedSport] = useState(
    urlSportId ? Number(urlSportId) : ""
  );
  const [currentPage, setCurrentPage] = useState(urlPage);

  // Sync URL → state khi navigate back/forward
  useEffect(() => {
    const name = searchParams.get("name") || "";
    const locId = searchParams.get("locationId") || "";
    const sportId = searchParams.get("sportId") || "";
    const pg = Number(searchParams.get("page") || "0");
    const normalized = normalizeKeyword(name);
    setSearch(normalized);
    setInputValue(normalized);
    setSelectedLocation(locId ? Number(locId) : "");
    setSelectedSport(sportId ? Number(sportId) : "");
    setCurrentPage(pg);
  }, [searchParams]);

  const updateUrl = useCallback(
    (name, locationId, sportId, pg = 0) => {
      const params = {};
      if (name) params.name = name;
      if (locationId) params.locationId = String(locationId);
      if (sportId) params.sportId = String(sportId);
      if (pg > 0) params.page = String(pg);
      setSearchParams(params, { replace: true });
    },
    [setSearchParams]
  );

  const handleSearch = () => {
    const normalized = normalizeKeyword(inputValue);
    setSearch(normalized);
    setCurrentPage(0);
    updateUrl(normalized, selectedLocation, selectedSport, 0);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleLocationChange = (locId) => {
    setSelectedLocation(locId);
    setCurrentPage(0);
    updateUrl(search, locId, selectedSport, 0);
  };

  const handleSportChange = (sportId) => {
    setSelectedSport(sportId);
    setCurrentPage(0);
    updateUrl(search, selectedLocation, sportId, 0);
  };

  const handlePageChange = (pg) => {
    setCurrentPage(pg);
    updateUrl(search, selectedLocation, selectedSport, pg);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearSearch = () => {
    setInputValue("");
    setSearch("");
    setCurrentPage(0);
    updateUrl("", selectedLocation, selectedSport, 0);
  };
  const clearLocation = () => {
    setSelectedLocation("");
    setCurrentPage(0);
    updateUrl(search, "", selectedSport, 0);
  };
  const clearSport = () => {
    setSelectedSport("");
    setCurrentPage(0);
    updateUrl(search, selectedLocation, "", 0);
  };
  const clearAll = () => {
    setInputValue("");
    setSearch("");
    setSelectedLocation("");
    setSelectedSport("");
    setCurrentPage(0);
    setSearchParams({}, { replace: true });
  };

  const hasFilters = search || selectedLocation || selectedSport;

  // ─── Data — server-side pagination ─────────────────────────────────────────
  const { data: pagedData, isLoading } = useQuery({
    queryKey: [
      "fields",
      { locationId: selectedLocation, sportId: selectedSport, page: currentPage, size: PAGE_SIZE },
    ],
    queryFn: () =>
      fieldService
        .getFields({
          ...(selectedLocation && { locationId: selectedLocation }),
          ...(selectedSport && { sportId: selectedSport }),
          page: currentPage,
          size: PAGE_SIZE,
        })
        .then((r) => r.data),
    keepPreviousData: true, // giữ data cũ khi đang tải trang mới
  });

  const { data: locations } = useQuery({
    queryKey: ["locations"],
    queryFn: () => locationService.getLocations().then((r) => r.data),
  });

  const { data: sports } = useQuery({
    queryKey: ["sports"],
    queryFn: () => sportService.getSports().then((r) => r.data),
  });

  // Backend trả PageResponse: { items, page, size, totalItems, totalPages }
  const rawItems = pagedData?.items || pagedData || [];
  const totalItems = pagedData?.totalItems ?? rawItems.length;
  const totalPages = pagedData?.totalPages ?? 1;

  // Client-side accent filter trên kết quả trang hiện tại
  const filteredFields = rawItems.filter((f) => matchesSearch(f, search));

  const locationLabel = locations?.find((l) => l.id === selectedLocation)?.name;
  const sportLabel = sports?.find((s) => s.id === selectedSport)?.name;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Danh sách sân thể thao</h1>
        <p className="text-muted-foreground text-sm">
          Tìm và đặt sân thể thao phù hợp với bạn
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">

        {/* ══ SIDEBAR ══════════════════════════════════════════════════════ */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="rounded-xl border border-border bg-card p-4 space-y-5 sticky top-20">

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-medium">
                <Filter className="h-4 w-4" />
                Bộ lọc
              </div>
              {hasFilters && (
                <button
                  onClick={clearAll}
                  className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
                >
                  <X className="h-3 w-3" />
                  Xóa lọc
                </button>
              )}
            </div>

            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tìm kiếm</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Tên sân, địa điểm, môn..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pl-9"
                  />
                </div>
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={handleSearch}
                  title="Tìm kiếm"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Location filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Địa điểm</label>
              <div className="space-y-1">
                <button
                  onClick={() => handleLocationChange("")}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                    !selectedLocation
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  Tất cả
                </button>
                {locations?.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => handleLocationChange(loc.id)}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      selectedLocation === loc.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{loc.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sport filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Môn thể thao</label>
              <div className="space-y-1">
                <button
                  onClick={() => handleSportChange("")}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                    !selectedSport
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  Tất cả
                </button>
                {sports?.map((sport) => (
                  <button
                    key={sport.id}
                    onClick={() => handleSportChange(sport.id)}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                      selectedSport === sport.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    {sport.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* ══ CỘT PHẢI: tags + kết quả + phân trang ═══════════════════════ */}
        <div className="flex-1 min-w-0">

          {/* ── Active filter tags ─────────────────────────────────────── */}
          {hasFilters && (
            <div className="flex flex-wrap gap-2 items-center mb-4 p-3 rounded-xl border border-border bg-card">
              <span className="text-xs text-muted-foreground font-medium shrink-0">
                Đang lọc:
              </span>

              {search && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary font-medium">
                  Từ khóa:&nbsp;<strong>&ldquo;{search}&rdquo;</strong>
                  <button
                    onClick={clearSearch}
                    className="hover:text-destructive transition-colors"
                    aria-label="Xóa từ khóa"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {selectedLocation && locationLabel && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1 text-xs text-blue-400 font-medium">
                  Địa điểm:&nbsp;<strong>{locationLabel}</strong>
                  <button
                    onClick={clearLocation}
                    className="hover:text-destructive transition-colors"
                    aria-label="Xóa địa điểm"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {selectedSport && sportLabel && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs text-amber-400 font-medium">
                  Môn thể thao:&nbsp;<strong>{sportLabel}</strong>
                  <button
                    onClick={clearSport}
                    className="hover:text-destructive transition-colors"
                    aria-label="Xóa môn thể thao"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {!isLoading && (
                <span className="ml-auto text-xs text-muted-foreground shrink-0">
                  {totalItems} kết quả
                </span>
              )}
            </div>
          )}

          {/* ── Danh sách sân ──────────────────────────────────────────── */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <FieldCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredFields.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title="Không tìm thấy sân"
              description={
                search
                  ? `Không có sân nào khớp với "${search}". Thử từ khóa khác hoặc xóa bộ lọc.`
                  : "Thử thay đổi bộ lọc để tìm sân phù hợp."
              }
              action={<Button onClick={clearAll}>Xóa bộ lọc</Button>}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredFields.map((field) => (
                  <div
                    key={field.id}
                    onClick={() => navigate(`/fields/${field.id}`)}
                    className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer"
                  >
                    <div className="h-40 bg-gradient-to-br from-emerald-900/40 to-slate-900 flex items-center justify-center relative overflow-hidden">
                      {field.imageUrl ? (
                        <img
                          src={field.imageUrl}
                          alt={field.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <Trophy className="h-14 w-14 text-emerald-500/30 group-hover:scale-110 transition-transform" />
                      )}
                      <div className="absolute top-3 right-3">
                        <StatusBadge status={field.status} />
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                        {field.name}
                      </h3>
                      {(field.locationName || field.location?.name) && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="line-clamp-1">
                            {field.locationName || field.location?.name}
                          </span>
                        </div>
                      )}
                      {(field.fieldTypeName || field.fieldType?.name) && (
                        <p className="text-xs text-muted-foreground">
                          {field.fieldTypeName || field.fieldType?.name}
                        </p>
                      )}
                      <Button size="sm" className="w-full mt-2">
                        Xem chi tiết
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Phân trang ──────────────────────────────────────────── */}
              <Pagination
                page={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />

              {/* Thông tin trang */}
              {totalPages > 1 && (
                <p className="text-center text-xs text-muted-foreground mt-3">
                  Trang {currentPage + 1} / {totalPages} &nbsp;·&nbsp; {totalItems} sân
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
