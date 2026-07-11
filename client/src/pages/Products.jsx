import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { productService } from '../services/productService';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [view, setView] = useState('table'); // 'table' | 'cards'

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productService.getAll();
        setProducts(data);
      } catch {
        toast.error('Error loading products');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    let result = filter === 'low-stock'
      ? products.filter((p) => p.stockAvailable < p.minStock)
      : products;

    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q)
      );
    }

    return result;
  }, [products, filter, search]);

  if (loading) return <ProductsSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-4xl font-bold">Products</h1>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SKU, category..."
            className="input-field w-56"
          />

          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              filter === 'all' ? 'btn-primary' : 'btn-secondary'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('low-stock')}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              filter === 'low-stock' ? 'btn-primary' : 'btn-secondary'
            }`}
          >
            Low Stock
          </button>

          {/* View toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('table')}
              className={`px-3 py-1.5 rounded-md text-sm transition ${
                view === 'table' ? 'bg-white shadow text-pharmacy-700' : 'text-gray-500'
              }`}
              aria-label="Table view"
            >
              ☰
            </button>
            <button
              onClick={() => setView('cards')}
              className={`px-3 py-1.5 rounded-md text-sm transition ${
                view === 'cards' ? 'bg-white shadow text-pharmacy-700' : 'text-gray-500'
              }`}
              aria-label="Card view"
            >
              ▦
            </button>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        {filteredProducts.length} of {products.length} products
      </p>

      {filteredProducts.length === 0 ? (
        <div className="card text-center py-12 text-gray-600">
          No products match your filters
        </div>
      ) : view === 'table' ? (
        <ProductsTable products={filteredProducts} />
      ) : (
        <ProductsCards products={filteredProducts} />
      )}
    </div>
  );
}

function StockBar({ available, min }) {
  const ratio = min > 0 ? available / min : 1;
  const isLow = available < min;
  const pct = Math.min(ratio * 100, 100);

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span className={isLow ? 'text-red-600 font-medium' : 'text-gray-600'}>
          {available}
        </span>
        <span className="text-gray-400">min {min}</span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isLow ? 'bg-red-500' : 'bg-pharmacy-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ProductsTable({ products }) {
  return (
    <div className="card p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">SKU</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Category</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Price</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 w-40">Stock</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">
                  {product.sku}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{product.name}</p>
                  {product.requiresRx && (
                    <span className="text-xs text-blue-600">⚕️ Requires Rx</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">{product.categoryName}</td>
                <td className="px-4 py-3 font-medium">
                  ₡{product.unitPrice.toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <StockBar available={product.stockAvailable} min={product.minStock} />
                </td>
                <td className="px-4 py-3">
                  {product.stockAvailable < product.minStock ? (
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
                      Low Stock
                    </span>
                  ) : (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                      OK
                    </span>
                  )}
                  {product.stockExpired > 0 && (
                    <span className="block text-xs text-red-500 mt-1">
                      {product.stockExpired} expired
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductsCards({ products }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <div key={product.id} className="card">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-lg font-bold">{product.name}</h3>
              <p className="text-sm text-gray-600 font-mono">{product.sku}</p>
            </div>
            {product.stockAvailable < product.minStock && (
              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
                LOW STOCK
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600 mb-3">{product.description}</p>

          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Category:</span>
              <span className="font-medium">{product.categoryName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Supplier:</span>
              <span className="font-medium">{product.supplierName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Price:</span>
              <span className="font-medium">₡{product.unitPrice.toLocaleString()}</span>
            </div>
            {product.stockExpired > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Expired:</span>
                <span className="font-medium text-red-600">{product.stockExpired}</span>
              </div>
            )}
          </div>

          <StockBar available={product.stockAvailable} min={product.minStock} />

          {product.requiresRx && (
            <span className="mt-3 block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded text-center">
              ⚕️ Requires Rx
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function ProductsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 bg-gray-200 rounded w-40"></div>
      <div className="card">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 bg-gray-100 rounded-lg mb-2"></div>
        ))}
      </div>
    </div>
  );
}