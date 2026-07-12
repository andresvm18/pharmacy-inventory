import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supplierService } from '../services/supplierService';

const emptyForm = { name: '', phone: '', email: '' };

export default function SupplierFormModal({ supplier, onClose, onSaved }) {
  const isEdit = Boolean(supplier);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (supplier) {
      setForm({ name: supplier.name, phone: supplier.phone || '', email: supplier.email || '' });
    } else {
      setForm(emptyForm);
    }
  }, [supplier]);

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Supplier name is required');
      return;
    }

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await supplierService.update(supplier.id, payload);
        toast.success('Supplier updated');
      } else {
        await supplierService.create(payload);
        toast.success('Supplier created');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving supplier');
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
        className="bg-white rounded-lg border border-stone-200 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-stone-200">
          <h2 className="font-display text-lg font-semibold text-stone-900">
            {isEdit ? 'Edit supplier' : 'Add supplier'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-600 uppercase tracking-wide mb-2">
              Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className="input-field"
              placeholder="Central Pharma Distribution"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-600 uppercase tracking-wide mb-2">
              Phone
            </label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              className="input-field data-num"
              placeholder="2222-1111"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-600 uppercase tracking-wide mb-2">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              className="input-field"
              placeholder="sales@supplier.example"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5 disabled:opacity-50">
              {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}