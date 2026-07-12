import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { categoryService } from '../services/categoryService';
import { supplierService } from '../services/supplierService';
import CategoryFormModal from '../components/CategoryFormModal';
import SupplierFormModal from '../components/SupplierFormModal';
import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';

export default function Catalog() {
  const [tab, setTab] = useState('categories');
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editingCategory, setEditingCategory] = useState(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [showSupplierForm, setShowSupplierForm] = useState(false);

  const categoriesPagination = usePagination(categories, 10);
  const suppliersPagination = usePagination(suppliers, 10);

  const fetchAll = async () => {
    try {
      const [categoriesData, suppliersData] = await Promise.all([
        categoryService.getAll(),
        supplierService.getAll(),
      ]);
      setCategories(categoriesData);
      setSuppliers(suppliersData);
    } catch {
      toast.error('Error loading catalog data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleDeleteCategory = async (category) => {
    if (category.productCount > 0) {
      toast.error(`Cannot delete: ${category.productCount} product(s) use this category`);
      return;
    }
    if (!confirm(`Delete category "${category.name}"?`)) return;

    try {
      await categoryService.remove(category.id);
      toast.success('Category deleted');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting category');
    }
  };

  const handleDeleteSupplier = async (supplier) => {
    if (supplier.productCount > 0) {
      toast.error(`Cannot delete: ${supplier.productCount} product(s) use this supplier`);
      return;
    }
    if (!confirm(`Delete supplier "${supplier.name}"?`)) return;

    try {
      await supplierService.remove(supplier.id);
      toast.success('Supplier deleted');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting supplier');
    }
  };

  if (loading) return <CatalogSkeleton />;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold text-stone-900">Catalog</h1>

      <div className="flex gap-1 border-b border-stone-200">
        <button
          onClick={() => setTab('categories')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            tab === 'categories'
              ? 'text-clinical-700 border-clinical-600'
              : 'text-stone-500 border-transparent hover:text-stone-900'
          }`}
        >
          Categories
        </button>
        <button
          onClick={() => setTab('suppliers')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            tab === 'suppliers'
              ? 'text-clinical-700 border-clinical-600'
              : 'text-stone-500 border-transparent hover:text-stone-900'
          }`}
        >
          Suppliers
        </button>
      </div>

      {tab === 'categories' ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => { setEditingCategory(null); setShowCategoryForm(true); }}
              className="btn-primary text-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" strokeWidth={2} />
              Add category
            </button>
          </div>

          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-stone-500 text-xs uppercase tracking-wide">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500 text-xs uppercase tracking-wide">Products</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {categoriesPagination.paginated.map((cat) => (
                  <tr key={cat.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                    <td className="px-4 py-3 font-medium text-stone-900">{cat.name}</td>
                    <td className="px-4 py-3 text-stone-600 data-num">{cat.productCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => { setEditingCategory(cat); setShowCategoryForm(true); }}
                          className="text-stone-400 hover:text-clinical-700 transition"
                          aria-label={`Edit ${cat.name}`}
                        >
                          <Pencil className="w-4 h-4" strokeWidth={2} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat)}
                          className="text-stone-400 hover:text-red-600 transition"
                          aria-label={`Delete ${cat.name}`}
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              page={categoriesPagination.page}
              totalPages={categoriesPagination.totalPages}
              onPageChange={categoriesPagination.setPage}
              totalItems={categories.length}
              pageSize={10}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => { setEditingSupplier(null); setShowSupplierForm(true); }}
              className="btn-primary text-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" strokeWidth={2} />
              Add supplier
            </button>
          </div>

          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-stone-500 text-xs uppercase tracking-wide">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500 text-xs uppercase tracking-wide">Phone</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500 text-xs uppercase tracking-wide">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500 text-xs uppercase tracking-wide">Products</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {suppliersPagination.paginated.map((sup) => (
                  <tr key={sup.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                    <td className="px-4 py-3 font-medium text-stone-900">{sup.name}</td>
                    <td className="px-4 py-3 text-stone-600 data-num">{sup.phone || '—'}</td>
                    <td className="px-4 py-3 text-stone-600">{sup.email || '—'}</td>
                    <td className="px-4 py-3 text-stone-600 data-num">{sup.productCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => { setEditingSupplier(sup); setShowSupplierForm(true); }}
                          className="text-stone-400 hover:text-clinical-700 transition"
                          aria-label={`Edit ${sup.name}`}
                        >
                          <Pencil className="w-4 h-4" strokeWidth={2} />
                        </button>
                        <button
                          onClick={() => handleDeleteSupplier(sup)}
                          className="text-stone-400 hover:text-red-600 transition"
                          aria-label={`Delete ${sup.name}`}
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              page={suppliersPagination.page}
              totalPages={suppliersPagination.totalPages}
              onPageChange={suppliersPagination.setPage}
              totalItems={suppliers.length}
              pageSize={10}
            />
          </div>
        </div>
      )}

      {showCategoryForm && (
        <CategoryFormModal
          category={editingCategory}
          onClose={() => setShowCategoryForm(false)}
          onSaved={fetchAll}
        />
      )}

      {showSupplierForm && (
        <SupplierFormModal
          supplier={editingSupplier}
          onClose={() => setShowSupplierForm(false)}
          onSaved={fetchAll}
        />
      )}
    </div>
  );
}

function CatalogSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-9 bg-stone-200 rounded w-32"></div>
      <div className="h-8 bg-stone-100 rounded w-64"></div>
      <div className="card">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-stone-100 rounded-md mb-2"></div>
        ))}
      </div>
    </div>
  );
}