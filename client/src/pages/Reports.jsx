import { useState, useEffect } from 'react';
import { reportService } from '../services/reportService';

export default function Reports() {
  const [revenue, setRevenue] = useState(null);
  const [expiring, setExpiring] = useState([]);
  const [movements, setMovements] = useState([]);
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [revData, expData, movData] = await Promise.all([
        reportService.getRevenue(startDate, endDate),
        reportService.getExpiringProducts(30),
        reportService.getStockMovements(),
      ]);
      setRevenue(revData);
      setExpiring(expData.slice(0, 10));
      setMovements(movData.slice(0, 20));
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold">Reports & Analytics</h1>

      {/* Date Range Filter */}
      <div className="card flex gap-4 items-end">
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
        <button onClick={fetchReports} disabled={loading} className="btn-primary">
          {loading ? 'Loading...' : 'Filter'}
        </button>
      </div>

      {/* Revenue Summary */}
      {revenue && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <p className="text-gray-600 text-sm">Total Sales</p>
            <p className="text-3xl font-bold text-pharmacy-600">{revenue.totalSales}</p>
          </div>
          <div className="card">
            <p className="text-gray-600 text-sm">Total Revenue</p>
            <p className="text-3xl font-bold text-pharmacy-600">
              ₡{revenue.totalRevenue?.toLocaleString()}
            </p>
          </div>
          <div className="card">
            <p className="text-gray-600 text-sm">Items Sold</p>
            <p className="text-3xl font-bold text-pharmacy-600">{revenue.totalItemsSold}</p>
          </div>
          <div className="card">
            <p className="text-gray-600 text-sm">Avg Order Value</p>
            <p className="text-3xl font-bold text-pharmacy-600">
              ₡{revenue.averageOrderValue?.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Expiring Products */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">⚠️ Products Expiring Soon (30 days)</h2>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {expiring.length === 0 ? (
            <p className="text-gray-600">No products expiring soon</p>
          ) : (
            expiring.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-600">
                    Batch: {item.lotNumber} | Qty: {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{item.daysUntilExpiry} days</p>
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
              {movements.map((mov, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
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