import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Calendar } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { reportService } from '../services/reportService';
import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';

const PRESETS = [
  { label: 'Today', days: 0 },
  { label: 'Last 7 days', days: 6 },
  { label: 'Last 30 days', days: 29 },
];

const toISODate = (date) => date.toISOString().split('T')[0];

function formatRole(role) {
  if (!role) return '';
  return role.charAt(0) + role.slice(1).toLowerCase();
}

export default function Reports() {
  const [revenue, setRevenue] = useState(null);
  const [dailyRevenue, setDailyRevenue] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [movements, setMovements] = useState([]);
  const { page: movementsPage, setPage: setMovementsPage, totalPages: movementsTotalPages, paginated: paginatedMovements } = usePagination(movements, 10);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return toISODate(d);
  });
  const [endDate, setEndDate] = useState(() => toISODate(new Date()));
  const [activePreset, setActivePreset] = useState('Last 7 days');
  const [loading, setLoading] = useState(false);

  const fetchReports = useCallback(async (start, end) => {
    setLoading(true);
    try {
      const [revData, dailyData, topData, expData, movData] = await Promise.all([
        reportService.getRevenue(start, end),
        reportService.getRevenueByDay(start, end),
        reportService.getTopProducts(start, end, 5),
        reportService.getExpiringProducts(30),
        reportService.getStockMovements(),
      ]);
      setRevenue(revData);
      setDailyRevenue(
        dailyData.map((d) => ({
          ...d,
          label: new Date(d.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
        }))
      );
      setTopProducts(topData);
      setExpiring(expData.slice(0, 10));
      setMovements(movData);
    } catch {
      toast.error('Error loading reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports(startDate, endDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyPreset = (preset) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - preset.days);
    const s = toISODate(start);
    const e = toISODate(end);
    setStartDate(s);
    setEndDate(e);
    setActivePreset(preset.label);
    fetchReports(s, e);
  };

  const applyCustomRange = () => {
    setActivePreset(null);
    fetchReports(startDate, endDate);
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold text-stone-900">Reports & analytics</h1>

      {/* Date Range Filter */}
      <div className="card">
        <div className="flex flex-wrap gap-2 mb-4">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => applyPreset(preset)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${activePreset === preset.label ? 'btn-primary' : 'btn-secondary'
                }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-stone-600 uppercase tracking-wide mb-2">
              Start date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 uppercase tracking-wide mb-2">
              End date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-field"
            />
          </div>
          <button
            onClick={applyCustomRange}
            disabled={loading}
            className="btn-primary py-2"
          >
            {loading ? 'Loading...' : 'Apply'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {revenue && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KpiCard label="Total sales" value={revenue.totalSales} />
          <KpiCard
            label="Total revenue"
            value={`₡${revenue.totalRevenue?.toLocaleString()}`}
          />
          <KpiCard label="Items sold" value={revenue.totalItemsSold} />
          <KpiCard
            label="Avg order value"
            value={`₡${revenue.averageOrderValue?.toFixed(2)}`}
          />
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-sm font-medium text-stone-900 mb-4">Revenue trend</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: '#78716C' }}
                axisLine={{ stroke: '#E7E5E4' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: '#78716C' }}
                tickFormatter={(v) => `₡${v.toLocaleString()}`}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip
                formatter={(value) => [`₡${value.toLocaleString()}`, 'Revenue']}
                contentStyle={{ fontSize: 12, borderRadius: 6, borderColor: '#E7E5E4' }}
              />
              <Line
                type="monotone"
                dataKey="totalRevenue"
                stroke="#0F5D52"
                strokeWidth={2}
                dot={{ r: 3, fill: '#0F5D52' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-sm font-medium text-stone-900 mb-4">Top selling products</h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-20">
              No sales in this period
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: '#78716C' }}
                  axisLine={{ stroke: '#E7E5E4' }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="sku"
                  tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: '#78716C' }}
                  axisLine={false}
                  tickLine={false}
                  width={70}
                />
                <Tooltip
                  formatter={(value, name) =>
                    name === 'unitsSold' ? [value, 'Units'] : [value, name]
                  }
                  labelFormatter={(sku) =>
                    topProducts.find((p) => p.sku === sku)?.name ?? sku
                  }
                  contentStyle={{ fontSize: 12, borderRadius: 6, borderColor: '#E7E5E4' }}
                />
                <Bar dataKey="unitsSold" fill="#0F5D52" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Expiring Products */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-amber-600" strokeWidth={2} />
          <h2 className="text-sm font-medium text-stone-900">Products expiring soon</h2>
          <span className="text-xs text-stone-400">30 days</span>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {expiring.length === 0 ? (
            <p className="text-sm text-stone-500">No products expiring soon</p>
          ) : (
            expiring.map((item) => (
              <div
                key={item.batchId}
                className="flex justify-between items-center py-2 px-3 bg-amber-50 rounded-md border border-amber-100"
              >
                <div>
                  <p className="text-sm font-medium text-stone-900">{item.name}</p>
                  <p className="text-xs text-stone-500 data-num">
                    {item.lotNumber} · qty {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium data-num ${item.daysUntilExpiry <= 7 ? 'text-red-700' : 'text-amber-700'}`}>
                    {item.daysUntilExpiry}d
                  </p>
                  <p className="text-xs text-stone-500 data-num">
                    ₡{item.totalValue?.toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Stock Movements */}
      <div className="card p-0 overflow-hidden">
        <h2 className="text-sm font-medium text-stone-900 px-6 py-4 border-b border-stone-200">
          Recent stock movements
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-stone-500 text-xs uppercase tracking-wide">Product</th>
                <th className="px-4 py-3 text-left font-medium text-stone-500 text-xs uppercase tracking-wide">Type</th>
                <th className="px-4 py-3 text-left font-medium text-stone-500 text-xs uppercase tracking-wide">Qty</th>
                <th className="px-4 py-3 text-left font-medium text-stone-500 text-xs uppercase tracking-wide">Reason</th>
                <th className="px-4 py-3 text-left font-medium text-stone-500 text-xs uppercase tracking-wide">User</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMovements.map((mov) => (
                <tr key={mov.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                  <td className="px-4 py-3 font-medium text-stone-900">{mov.productName}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${mov.type === 'SALE' ? 'bg-red-50 text-red-700' :
                        mov.type === 'PURCHASE' ? 'bg-clinical-50 text-clinical-700' :
                          'bg-stone-100 text-stone-700'
                      }`}>
                      {mov.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-stone-900 data-num">{mov.quantity}</td>
                  <td className="px-4 py-3 text-stone-500">{mov.reason}</td>
                  <td className="px-4 py-3 text-stone-600">
                    {mov.userFullName} <span className="text-stone-400 text-xs">({formatRole(mov.userRole)})</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          page={movementsPage}
          totalPages={movementsTotalPages}
          onPageChange={setMovementsPage}
          totalItems={movements.length}
          pageSize={10}
        />
      </div>
    </div>
  );
}

function KpiCard({ label, value }) {
  return (
    <div className="card">
      <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-semibold text-stone-900 data-num mt-1">{value}</p>
    </div>
  );
}