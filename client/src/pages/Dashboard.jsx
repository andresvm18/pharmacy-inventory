import { useState, useEffect } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { reportService } from '../services/reportService';
import { productService } from '../services/productService';

export default function Dashboard() {
  const { user } = useAuth();
  const [revenue, setRevenue] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [loading, setLoading] = useState(true);

  const canViewReports = ['ADMIN', 'PHARMACIST'].includes(user?.role);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];

        const requests = [productService.getLowStock()];
        if (canViewReports) {
          requests.push(
            reportService.getRevenue(today, today),
            reportService.getExpiringProducts(30)
          );
        }

        const [lowStockData, revenueData, expiringData] =
          await Promise.all(requests);

        setLowStock(lowStockData.slice(0, 5));
        if (revenueData) setRevenue(revenueData);
        if (expiringData) setExpiring(expiringData.slice(0, 5));
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [canViewReports]);

  if (loading) return <DashboardSkeleton showKpis={canViewReports} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-baseline">
        <h1 className="text-3xl font-semibold text-stone-900">Dashboard</h1>
        <p className="text-sm text-stone-500">Welcome, {user?.fullName}</p>
      </div>

      {canViewReports && revenue && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard label="Today's sales" value={revenue.totalSales || 0} />
          <KpiCard
            label="Today's revenue"
            value={`₡${(revenue.totalRevenue || 0).toLocaleString()}`}
          />
          <KpiCard
            label="Avg order value"
            value={`₡${(revenue.averageOrderValue || 0).toFixed(2)}`}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-red-600" strokeWidth={2} />
            <h2 className="font-display text-lg font-semibold text-stone-900">
              Low stock
            </h2>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-sm text-stone-500">
              All products have sufficient stock.
            </p>
          ) : (
            <div className="space-y-2">
              {lowStock.map((product) => (
                <div
                  key={product.id}
                  className="flex justify-between items-center py-2 px-3 bg-red-50 rounded-md border border-red-100"
                >
                  <div>
                    <p className="text-sm font-medium text-stone-900">{product.name}</p>
                    <p className="text-xs text-stone-500 data-num">
                      {product.stockAvailable} / min {product.minStock}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-red-700 data-num">
                    {product.minStock - product.stockAvailable} needed
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {canViewReports && (
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-amber-600" strokeWidth={2} />
              <h2 className="font-display text-lg font-semibold text-stone-900">
                Expiring soon
              </h2>
              <span className="text-xs text-stone-400">30 days</span>
            </div>
            {expiring.length === 0 ? (
              <p className="text-sm text-stone-500">No batches expiring soon.</p>
            ) : (
              <div className="space-y-2">
                {expiring.map((item) => (
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
                    <span
                      className={`text-sm font-medium data-num ${
                        item.daysUntilExpiry <= 7 ? 'text-red-700' : 'text-amber-700'
                      }`}
                    >
                      {item.daysUntilExpiry}d
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value }) {
  return (
    <div className="card">
      <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-2xl font-semibold text-stone-900 data-num mt-1">
        {value}
      </p>
    </div>
  );
}

function DashboardSkeleton({ showKpis }) {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-9 bg-stone-200 rounded w-48"></div>
      {showKpis && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card">
              <div className="h-3 bg-stone-200 rounded w-24 mb-3"></div>
              <div className="h-7 bg-stone-200 rounded w-32"></div>
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="card">
            <div className="h-5 bg-stone-200 rounded w-32 mb-4"></div>
            <div className="space-y-2">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-12 bg-stone-100 rounded-md"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}