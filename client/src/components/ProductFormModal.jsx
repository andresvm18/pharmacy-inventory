import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { productService } from '../services/productService';
import { useModalA11y } from '../hooks/useModalA11y';

const emptyForm = {
  sku: '',
  name: '',
  description: '',
  categoryId: '',
  supplierId: '',
  unitPrice: '',
  minStock: 10,
  requiresRx: false,
};

export default function ProductFormModal({ product, categories, suppliers, onClose, onSaved }) {
  const isEdit = Boolean(product);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const containerRef = useModalA11y(onClose);

  useEffect(() => {
    if (product) {
      setForm({
        sku: product.sku,
        name: product.name,
        description: product.description || '',
        categoryId: product.categoryId,
        supplierId: product.supplierId,
        unitPrice: product.unitPrice,
        minStock: product.minStock,
        requiresRx: product.requiresRx,
      });
    } else {
      setForm(emptyForm);
    }
  }, [product]);

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.sku.trim() || !form.name.trim()) {
      toast.error('SKU and name are required');
      return;
    }
    if (!form.categoryId || !form.supplierId) {
      toast.error('Select a category and supplier');
      return;
    }

    const payload = {
      sku: form.sku.trim(),
      name: form.name.trim(),
      description: form.description.trim() || null,
      categoryId: Number(form.categoryId),
      supplierId: Number(form.supplierId),
      unitPrice: Number(form.unitPrice),
      minStock: Number(form.minStock),
      requiresRx: form.requiresRx,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await productService.update(product.id, payload);
        toast.success('Product updated');
      } else {
        await productService.create(payload);
        toast.success('Product created');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-stone-900/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
        className="bg-white rounded-lg border border-stone-200 w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-stone-200">
          <h2 className="font-display text-lg font-semibold text-stone-900" id="product-modal-title">
            {isEdit ? 'Edit product' : 'Add product'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-600 uppercase tracking-wide mb-2">
                SKU
              </label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => update('sku', e.target.value)}
                className="input-field data-num"
                placeholder="ANL-001"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 uppercase tracking-wide mb-2">
                Unit price
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.unitPrice}
                onChange={(e) => update('unitPrice', e.target.value)}
                className="input-field data-num"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-600 uppercase tracking-wide mb-2">
              Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className="input-field"
              placeholder="Acetaminophen 500mg (10 tablets)"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-600 uppercase tracking-wide mb-2">
              Description
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              className="input-field"
              placeholder="Analgesic and antipyretic"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-600 uppercase tracking-wide mb-2">
                Category
              </label>
              <select
                value={form.categoryId}
                onChange={(e) => update('categoryId', e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 uppercase tracking-wide mb-2">
                Supplier
              </label>
              <select
                value={form.supplierId}
                onChange={(e) => update('supplierId', e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select...</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-stone-600 uppercase tracking-wide mb-2">
                Min stock threshold
              </label>
              <input
                type="number"
                min="0"
                value={form.minStock}
                onChange={(e) => update('minStock', e.target.value)}
                className="input-field data-num"
                required
              />
            </div>
            <label className="flex items-center gap-2 pb-2.5 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={form.requiresRx}
                onChange={(e) => update('requiresRx', e.target.checked)}
                className="rounded border-stone-300 text-clinical-600 focus:ring-clinical-600"
              />
              Requires prescription
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 py-2.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1 py-2.5 disabled:opacity-50"
            >
              {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}