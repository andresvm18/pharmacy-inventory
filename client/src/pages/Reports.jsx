import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { reportService } from '../services/reportService';

const PRESETS = [
  { label: 'Today', days: 0 },
  { label: 'Last 7 days', days: 6 },
  { label: 'Last 30 days', days: 29 },
];

const toISODate = (date) => date.toISOString().split('T')[0];

export default function Reports() {
  const [revenue, setRevenue] = useState(null);
  const [dailyRevenue, setDailyRevenue] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [movements, setMovements] = useState([]);
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
      setMovements(movData.slice(0, 20));
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
      <h1 className="text-4xl font-bold">Reports & Analytics</h1>

      {/* Date Range Filter */}
      <div className="card">
        <div className="flex flex-wrap gap-2 mb-4">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => applyPreset(preset)}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                activePreset === preset.label ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
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
            className="btn-primary"
          >
            {loading ? 'Loading...' : 'Apply'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {revenue && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KpiCard label="Total Sales" value={revenue.totalSales} />
          <KpiCard
            label="Total Revenue"
            value={`₡${revenue.totalRevenue?.toLocaleString()}`}
          />
          <KpiCard label="Items Sold" value={revenue.totalItemsSold} />
          <KpiCard
            label="Avg Order Value"
            value={`₡${revenue.averageOrderValue?.toFixed(2)}`}
          />
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue trend */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `₡${v.toLocaleString()}`}
                width={80}
              />
              <Tooltip
                formatter={(value) => [`₡${value.toLocaleString()}`, 'Revenue']}
              />
              <Line
                type="monotone"
                dataKey="totalRevenue"
                stroke="#16a34a"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top products */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Top Selling Products</h2>
          {topProducts.length === 0 ? (
            <p className="text-gray-500 text-center py-20">
              No sales in this period
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="sku"
                  tick={{ fontSize: 12 }}
                  width={70}
                />
                <Tooltip
                  formatter={(value, name) =>
                    name === 'unitsSold' ? [value, 'Units'] : [value, name]
                  }
                  labelFormatter={(sku) =>
                    topProducts.find((p) => p.sku === sku)?.name ?? sku
                  }
                />
                <Bar dataKey="unitsSold" fill="#16a34a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Expiring Products */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">⚠️ Products Expiring Soon (30 days)</h2>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {expiring.length === 0 ? (
            <p className="text-gray-600">No products expiring soon</p>
          ) : (
            expiring.map((item) => (
              <div
                key={item.batchId}
                className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-600">
                    Batch: {item.lotNumber} | Qty: {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${item.daysUntilExpiry <= 7 ? 'text-red-600' : ''}`}>
                    {item.daysUntilExpiry} days
                  </p>
                  <p className="text-sm text-gray-600">
                    Value: ₡{item.totalValue?.toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Stock Movements */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">📊 Recent Stock Movements</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Product</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Qty</th>
                <th className="px-4 py-2 text-left">Reason</th>
                <th className="px-4 py-2 text-left">User</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((mov) => (
                <tr key={mov.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{mov.productName}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      mov.type === 'SALE' ? 'bg-red-100 text-red-800' :
                      mov.type === 'PURCHASE' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {mov.type}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-medium">{mov.quantity}</td>
                  <td className="px-4 py-2 text-gray-600">{mov.reason}</td>
                  <td className="px-4 py-2">{mov.username}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value }) {
  return (
    <div className="card">
      <p className="text-gray-600 text-sm">{label}</p>
      <p className="text-3xl font-bold text-pharmacy-600">{value}</p>
    </div>
  );
}