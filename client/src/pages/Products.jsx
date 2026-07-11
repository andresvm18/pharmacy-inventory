import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { List, LayoutGrid, Syringe, Plus, Pencil } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import { supplierService } from '../services/supplierService';
import ProductFormModal from '../components/ProductFormModal';

export default function Products() {
  const { user } = useAuth();
  const canManage = ['ADMIN', 'PHARMACIST'].includes(user?.role);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [view, setView] = useState('table');
  const [editingProduct, setEditingProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetchAll = async () => {
    try {
      const requests = [productService.getAll()];
      if (canManage) {
        requests.push(categoryService.getAll(), supplierService.getAll());
      }
      const [productsData, categoriesData, suppliersData] = await Promise.all(requests);
      setProducts(productsData);
      if (categoriesData) setCategories(categoriesData);
      if (suppliersData) setSuppliers(suppliersData);
    } catch {
      toast.error('Error loading products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const openCreate = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  if (loading) return <ProductsSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold text-stone-900">Products</h1>

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
            className={`px-3 py-2 rounded-md text-sm font-medium transition ${
              filter === 'all' ? 'btn-primary' : 'btn-secondary'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('low-stock')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition ${
              filter === 'low-stock' ? 'btn-primary' : 'btn-secondary'
            }`}
          >
            Low stock
          </button>

          <div className="flex bg-stone-100 rounded-md p-1">
            <button
              onClick={() => setView('table')}
              className={`p-1.5 rounded transition ${
                view === 'table' ? 'bg-white shadow-sm text-clinical-700' : 'text-stone-400'
              }`}
              aria-label="Table view"
            >
              <List className="w-4 h-4" strokeWidth={2} />
            </button>
            <button
              onClick={() => setView('cards')}
              className={`p-1.5 rounded transition ${
                view === 'cards' ? 'bg-white shadow-sm text-clinical-700' : 'text-stone-400'
              }`}
              aria-label="Card view"
            >
              <LayoutGrid className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>

          {canManage && (
            <button onClick={openCreate} className="btn-primary text-sm flex items-center gap-1.5">
              <Plus className="w-4 h-4" strokeWidth={2} />
              Add product
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-stone-400 data-num">
        {filteredProducts.length} of {products.length} products
      </p>

      {filteredProducts.length === 0 ? (
        <div className="card text-center py-12 text-sm text-stone-500">
          No products match your filters
        </div>
      ) : view === 'table' ? (
        <ProductsTable products={filteredProducts} canManage={canManage} onEdit={openEdit} />
      ) : (
        <ProductsCards products={filteredProducts} canManage={canManage} onEdit={openEdit} />
      )}

      {showForm && (
        <ProductFormModal
          product={editingProduct}
          categories={categories}
          suppliers={suppliers}
          onClose={() => setShowForm(false)}
          onSaved={fetchAll}
        />
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
      <div className="flex justify-between text-xs mb-1 data-num">
        <span className={isLow ? 'text-red-700 font-medium' : 'text-stone-600'}>
          {available}
        </span>
        <span className="text-stone-400">min {min}</span>
      </div>
      <div className="h-[3px] bg-stone-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isLow ? 'bg-red-600' : 'bg-clinical-600'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ProductsTable({ products, canManage, onEdit }) {
  return (
    <div className="card p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-stone-500 text-xs uppercase tracking-wide">SKU</th>
              <th className="px-4 py-3 text-left font-medium text-stone-500 text-xs uppercase tracking-wide">Name</th>
              <th className="px-4 py-3 text-left font-medium text-stone-500 text-xs uppercase tracking-wide">Category</th>
              <th className="px-4 py-3 text-left font-medium text-stone-500 text-xs uppercase tracking-wide">Price</th>
              <th className="px-4 py-3 text-left font-medium text-stone-500 text-xs uppercase tracking-wide w-40">Stock</th>
              <th className="px-4 py-3 text-left font-medium text-stone-500 text-xs uppercase tracking-wide">Status</th>
              {canManage && <th className="px-4 py-3"></th>}
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                <td className="px-4 py-3 text-xs text-stone-400 data-num">
                  {product.sku}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-stone-900">{product.name}</p>
                  {product.requiresRx && (
                    <span className="inline-flex items-center gap-1 text-xs text-clinical-700 mt-0.5">
                      <Syringe className="w-3 h-3" strokeWidth={2} /> Requires Rx
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-stone-600">{product.categoryName}</td>
                <td className="px-4 py-3 font-medium text-stone-900 data-num">
                  ₡{product.unitPrice.toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <StockBar available={product.stockAvailable} min={product.minStock} />
                </td>
                <td className="px-4 py-3">
                  {product.stockAvailable < product.minStock ? (
                    <span className="bg-red-50 text-red-700 text-xs px-2 py-0.5 rounded font-medium">
                      Low stock
                    </span>
                  ) : (
                    <span className="bg-clinical-50 text-clinical-700 text-xs px-2 py-0.5 rounded font-medium">
                      OK
                    </span>
                  )}
                  {product.stockExpired > 0 && (
                    <span className="block text-xs text-red-500 mt-1 data-num">
                      {product.stockExpired} expired
                    </span>
                  )}
                </td>
                {canManage && (
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onEdit(product)}
                      className="text-stone-400 hover:text-clinical-700 transition"
                      aria-label={`Edit ${product.name}`}
                    >
                      <Pencil className="w-4 h-4" strokeWidth={2} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductsCards({ products, canManage, onEdit }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <div key={product.id} className="card flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-medium text-stone-900">{product.name}</h3>
              <p className="text-xs text-stone-400 data-num">{product.sku}</p>
            </div>
            <div className="flex items-center gap-2">
              {product.stockAvailable < product.minStock && (
                <span className="bg-red-50 text-red-700 text-xs px-2 py-0.5 rounded font-medium whitespace-nowrap">
                  Low stock
                </span>
              )}
              {canManage && (
                <button
                  onClick={() => onEdit(product)}
                  className="text-stone-400 hover:text-clinical-700 transition"
                  aria-label={`Edit ${product.name}`}
                >
                  <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
                </button>
              )}
            </div>
          </div>

          <p className="text-sm text-stone-500 mb-3">{product.description}</p>

          <div className="space-y-1.5 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-stone-500">Category</span>
              <span className="font-medium text-stone-900">{product.categoryName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Supplier</span>
              <span className="font-medium text-stone-900">{product.supplierName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Price</span>
              <span className="font-medium text-stone-900 data-num">₡{product.unitPrice.toLocaleString()}</span>
            </div>
            {product.stockExpired > 0 && (
              <div className="flex justify-between">
                <span className="text-stone-500">Expired</span>
                <span className="font-medium text-red-600 data-num">{product.stockExpired}</span>
              </div>
            )}
          </div>

          <div className="mt-auto space-y-3">
            <StockBar available={product.stockAvailable} min={product.minStock} />

            {product.requiresRx && (
              <span className="flex items-center justify-center gap-1 bg-clinical-50 text-clinical-700 text-xs px-2 py-1 rounded">
                <Syringe className="w-3 h-3" strokeWidth={2} /> Requires Rx
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProductsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-9 bg-stone-200 rounded w-40"></div>
      <div className="card">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-stone-100 rounded-md mb-2"></div>
        ))}
      </div>
    </div>
  );
}