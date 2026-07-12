import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Receipt } from 'lucide-react';
import { salesService } from '../services/salesService';
import SaleResultModal from '../components/SaleResultModal';
import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';

const PRESETS = [
  { label: 'Today', days: 0 },
  { label: 'Last 7 days', days: 6 },
  { label: 'Last 30 days', days: 29 },
];

const toISODate = (date) => date.toISOString().split('T')[0];

export default function SalesHistory() {
  const [sales, setSales] = useState([]);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return toISODate(d);
  });
  const [endDate, setEndDate] = useState(() => toISODate(new Date()));
  const [activePreset, setActivePreset] = useState('Last 7 days');
  const [loading, setLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);

  const fetchSales = useCallback(async (start, end) => {
    setLoading(true);
    try {
      const data = await salesService.getByDateRange(start, end);
      setSales(data);
    } catch {
      toast.error('Error loading sales history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSales(startDate, endDate);
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
    fetchSales(s, e);
  };

  const applyCustomRange = () => {
    setActivePreset(null);
    fetchSales(startDate, endDate);
  };

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);

  const { page, setPage, totalPages, paginated } = usePagination(sales, 10);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold text-stone-900">Sales history</h1>

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
          <button onClick={applyCustomRange} disabled={loading} className="btn-primary py-2">
            {loading ? 'Loading...' : 'Apply'}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-stone-400 data-num">
          {sales.length} sale{sales.length !== 1 ? 's' : ''} in range
        </p>
        <p className="text-sm text-stone-600">
          Total: <span className="font-semibold text-stone-900 data-num">₡{totalRevenue.toLocaleString()}</span>
        </p>
      </div>

      {loading ? (
        <SalesHistorySkeleton />
      ) : sales.length === 0 ? (
        <div className="card text-center py-12">
          <Receipt className="w-8 h-8 text-stone-300 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm text-stone-500">No sales in this date range</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-stone-500 text-xs uppercase tracking-wide">Sale</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500 text-xs uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500 text-xs uppercase tracking-wide">Sold by</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500 text-xs uppercase tracking-wide">Items</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500 text-xs uppercase tracking-wide">Total</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((sale) => (
                  <tr key={sale.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                    <td className="px-4 py-3 font-medium text-stone-900 data-num">#{sale.id}</td>
                    <td className="px-4 py-3 text-stone-600 data-num text-xs">
                      {new Date(sale.createdAt).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3 text-stone-600">{sale.userFullName}</td>
                    <td className="px-4 py-3 text-stone-600 data-num">
                      {sale.items.reduce((s, i) => s + i.quantity, 0)}
                    </td>
                    <td className="px-4 py-3 font-medium text-stone-900 data-num">
                      ₡{sale.total.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedSale(sale)}
                        className="text-xs font-medium text-clinical-700 hover:text-clinical-800 transition"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={sales.length}
            pageSize={10}
          />
        </div>
      )}

      <SaleResultModal sale={selectedSale} onClose={() => setSelectedSale(null)} closeLabel="Close" />
    </div>
  );
}

function SalesHistorySkeleton() {
  return (
    <div className="card p-6 animate-pulse space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-10 bg-stone-100 rounded-md"></div>
      ))}
    </div>
  );
}