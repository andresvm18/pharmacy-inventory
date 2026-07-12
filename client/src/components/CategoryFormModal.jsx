import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { categoryService } from '../services/categoryService';

export default function CategoryFormModal({ category, onClose, onSaved }) {
  const isEdit = Boolean(category);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(category?.name || '');
  }, [category]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await categoryService.update(category.id, { name: name.trim() });
        toast.success('Category updated');
      } else {
        await categoryService.create({ name: name.trim() });
        toast.success('Category created');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving category');
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
            {isEdit ? 'Edit category' : 'Add category'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-600 uppercase tracking-wide mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="Pain Relief"
              autoFocus
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5 disabled:opacity-50">
              {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}