import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { reportService } from '../services/reportService';
import { productService } from '../services/productService';

export default function Dashboard() {
  const { user } = useAuth();
  const [revenue, setRevenue] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Revenue for today
        const today = new Date().toISOString().split('T')[0];
        const revenueData = await reportService.getRevenue(today, today);
        setRevenue(revenueData);

        // Low stock products
        const lowStockData = await productService.getLowStock();
        setLowStock(lowStockData.slice(0, 5)); // Top 5
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Welcome, {user?.username}!</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-gray-600 text-sm">Today's Sales</p>
          <p className="text-3xl font-bold text-pharmacy-600">
            {revenue?.totalSales || 0}
          </p>
        </div>

        <div className="card">
          <p className="text-gray-600 text-sm">Today's Revenue</p>
          <p className="text-3xl font-bold text-pharmacy-600">
            ₡{revenue?.totalRevenue?.toLocaleString() || 0}
          </p>
        </div>

        <div className="card">
          <p className="text-gray-600 text-sm">Avg Order Value</p>
          <p className="text-3xl font-bold text-pharmacy-600">
            ₡{revenue?.averageOrderValue?.toFixed(2) || 0}
          </p>
        </div>
      </div>

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
    </div>
  );
}