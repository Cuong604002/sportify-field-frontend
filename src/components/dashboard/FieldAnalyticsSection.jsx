import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboardService";
import { formatCurrency } from "@/utils/formatCurrency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Clock, TrendingUp, Activity } from "lucide-react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const COLORS = [
  "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#ec4899", "#14b8a6", "#f97316", "#6366f1",
];

const VIEW_MODES = {
  REVENUE: "revenue",
  USAGE: "usage",
};

function CustomTooltip({ active, payload, label, viewMode }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-popover text-popover-foreground border border-border shadow-lg rounded-lg p-3 text-sm">
      <p className="font-semibold mb-1">{data.fieldName}</p>
      {viewMode === VIEW_MODES.REVENUE ? (
        <p className="text-emerald-600">Doanh thu: {formatCurrency(data.totalRevenue)}</p>
      ) : (
        <p className="text-blue-600">Giờ sử dụng: {data.totalUsageHours}h</p>
      )}
      <p className="text-muted-foreground">{data.totalBookings} lượt đặt</p>
      <p className="text-muted-foreground">Công suất: {data.occupancyRate}%</p>
    </div>
  );
}

export default function FieldAnalyticsSection({ startDate, endDate }) {
  const [viewMode, setViewMode] = useState(VIEW_MODES.REVENUE);
  const [selectedFieldId, setSelectedFieldId] = useState("all");

  const { data: fieldData, isLoading } = useQuery({
    queryKey: ["field-performance", startDate, endDate],
    queryFn: async () => {
      const res = await dashboardService.getFieldPerformance({ startDate, endDate });
      const raw = res?.data !== undefined ? res.data : res;
      return Array.isArray(raw) ? raw : (raw?.data || []);
    },
    enabled: !!startDate && !!endDate,
  });

  const fields = useMemo(() => fieldData || [], [fieldData]);

  const chartData = useMemo(() => {
    if (selectedFieldId === "all") return fields;
    return fields.filter((f) => String(f.fieldId) === String(selectedFieldId));
  }, [fields, selectedFieldId]);

  const summaryStats = useMemo(() => {
    const source = selectedFieldId === "all" ? fields : chartData;
    return {
      totalRevenue: source.reduce((sum, f) => sum + (f.totalRevenue || 0), 0),
      totalHours: source.reduce((sum, f) => sum + (f.totalUsageHours || 0), 0),
      totalBookings: source.reduce((sum, f) => sum + (f.totalBookings || 0), 0),
      avgOccupancy: source.length > 0
        ? Math.round((source.reduce((sum, f) => sum + (f.occupancyRate || 0), 0) / source.length) * 10) / 10
        : 0,
    };
  }, [fields, chartData, selectedFieldId]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="animate-pulse flex flex-col items-center gap-2">
              <Activity className="h-8 w-8" />
              <span>Đang tải thống kê sân...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header + Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className="font-semibold text-base flex items-center gap-2">
          <BarChart className="h-5 w-5 text-primary" />
          Phân tích hiệu suất theo từng sân
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Field filter */}
          <select
            value={selectedFieldId}
            onChange={(e) => setSelectedFieldId(e.target.value)}
            className="h-8 px-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">Tất cả sân</option>
            {fields.map((f) => (
              <option key={f.fieldId} value={f.fieldId}>
                {f.fieldName}
              </option>
            ))}
          </select>

          {/* View mode toggle */}
          <div className="flex rounded-md border border-border overflow-hidden">
            <button
              onClick={() => setViewMode(VIEW_MODES.REVENUE)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1 ${
                viewMode === VIEW_MODES.REVENUE
                  ? "bg-emerald-500 text-white"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              <TrendingUp className="h-3 w-3" />
              Doanh thu
            </button>
            <button
              onClick={() => setViewMode(VIEW_MODES.USAGE)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1 ${
                viewMode === VIEW_MODES.USAGE
                  ? "bg-blue-500 text-white"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              <Clock className="h-3 w-3" />
              Thời gian (Giờ)
            </button>
          </div>
        </div>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Tổng doanh thu</p>
            <p className="text-lg font-bold text-emerald-600 mt-1">
              {formatCurrency(summaryStats.totalRevenue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Tổng giờ sử dụng</p>
            <p className="text-lg font-bold text-blue-600 mt-1">
              {summaryStats.totalHours}h
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Tổng lượt đặt</p>
            <p className="text-lg font-bold text-violet-600 mt-1">
              {summaryStats.totalBookings}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Công suất TB</p>
            <p className="text-lg font-bold text-amber-600 mt-1">
              {summaryStats.avgOccupancy}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">
            {viewMode === VIEW_MODES.REVENUE
              ? "Doanh thu từng sân (VNĐ)"
              : "Thời gian sử dụng từng sân (Giờ)"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="text-center text-muted-foreground py-16">
              Không có dữ liệu trong khoảng thời gian đã chọn
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <RechartsBarChart
                data={chartData}
                margin={{ top: 5, right: 20, left: 10, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="fieldName"
                  tick={{ fontSize: 11 }}
                  angle={-30}
                  textAnchor="end"
                  height={70}
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) =>
                    viewMode === VIEW_MODES.REVENUE
                      ? val >= 1000000
                        ? `${(val / 1000000).toFixed(1)}M`
                        : val >= 1000
                        ? `${(val / 1000).toFixed(0)}K`
                        : val
                      : `${val}h`
                  }
                />
                <Tooltip content={<CustomTooltip viewMode={viewMode} />} />
                <Bar
                  dataKey={
                    viewMode === VIEW_MODES.REVENUE
                      ? "totalRevenue"
                      : "totalUsageHours"
                  }
                  radius={[4, 4, 0, 0]}
                  maxBarSize={60}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </RechartsBarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Detail table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chi tiết công suất khai thác</CardTitle>
        </CardHeader>
        <CardContent>
          {fields.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Không có dữ liệu
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-3 px-2 font-medium text-muted-foreground">#</th>
                    <th className="py-3 px-2 font-medium text-muted-foreground">Tên sân</th>
                    <th className="py-3 px-2 font-medium text-muted-foreground text-right">Lượt đặt</th>
                    <th className="py-3 px-2 font-medium text-muted-foreground text-right">Giờ sử dụng</th>
                    <th className="py-3 px-2 font-medium text-muted-foreground text-right">Công suất khai thác</th>
                    <th className="py-3 px-2 font-medium text-muted-foreground text-right">Doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedFieldId === "all" ? fields : chartData).map((field, i) => (
                    <tr
                      key={field.fieldId}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-2 text-muted-foreground">{i + 1}</td>
                      <td className="py-3 px-2 font-medium">{field.fieldName}</td>
                      <td className="py-3 px-2 text-right">{field.totalBookings}</td>
                      <td className="py-3 px-2 text-right text-blue-600">
                        {field.totalUsageHours}h
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-2 min-w-[140px]">
                          <div className="w-24 bg-muted rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                field.occupancyRate >= 75
                                  ? "bg-emerald-500"
                                  : field.occupancyRate >= 50
                                  ? "bg-amber-500"
                                  : field.occupancyRate >= 25
                                  ? "bg-orange-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${Math.min(field.occupancyRate || 0, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold w-10 text-right">
                            {field.occupancyRate || 0}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right text-emerald-600 font-medium">
                        {formatCurrency(field.totalRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
