import { useState, useEffect } from 'react';
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
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Welcome, {user?.fullName}!</p>
      </div>

      {/* KPIs — only for roles that can access reports */}
      {canViewReports && revenue && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card">
            <p className="text-gray-600 text-sm">Today's Sales</p>
            <p className="text-3xl font-bold text-pharmacy-600">
              {revenue.totalSales || 0}
            </p>
          </div>
          <div className="card">
            <p className="text-gray-600 text-sm">Today's Revenue</p>
            <p className="text-3xl font-bold text-pharmacy-600">
              ₡{revenue.totalRevenue?.toLocaleString() || 0}
            </p>
          </div>
          <div className="card">
            <p className="text-gray-600 text-sm">Avg Order Value</p>
            <p className="text-3xl font-bold text-pharmacy-600">
              ₡{revenue.averageOrderValue?.toFixed(2) || 0}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alert */}
        <div className="card">
          <h2 className="text-2xl font-bold mb-4">⚠️ Low Stock Alert</h2>
          {lowStock.length === 0 ? (
            <p className="text-gray-600">All products have sufficient stock!</p>
          ) : (
            <div className="space-y-2">
              {lowStock.map((product) => (
                <div
                  key={product.id}
                  className="flex justify-between items-center p-3 bg-red-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-600">
                      Stock: {product.stockAvailable} / Min: {product.minStock}
                    </p>
                  </div>
                  <span className="text-red-600 font-bold">
                    {product.minStock - product.stockAvailable} needed
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expiring Soon — only for reports-capable roles */}
        {canViewReports && (
          <div className="card">
            <h2 className="text-2xl font-bold mb-4">⏰ Expiring Soon (30 days)</h2>
            {expiring.length === 0 ? (
              <p className="text-gray-600">No batches expiring soon</p>
            ) : (
              <div className="space-y-2">
                {expiring.map((item) => (
                  <div
                    key={item.batchId}
                    className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        Batch: {item.lotNumber} · Qty: {item.quantity}
                      </p>
                    </div>
                    <span
                      className={`font-bold ${
                        item.daysUntilExpiry <= 7 ? 'text-red-600' : 'text-yellow-700'
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

function DashboardSkeleton({ showKpis }) {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 bg-gray-200 rounded w-56"></div>
      {showKpis && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-32"></div>
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="card">
            <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-14 bg-gray-100 rounded-lg"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}