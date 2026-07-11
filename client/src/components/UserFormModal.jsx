import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { userService } from '../services/userService';

const ROLES = ['ADMIN', 'PHARMACIST', 'CASHIER'];

const emptyForm = { username: '', fullName: '', password: '', role: 'CASHIER' };

export default function UserFormModal({ user, onClose, onSaved }) {
  const isEdit = Boolean(user);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ username: user.username, fullName: user.fullName, password: '', role: user.role });
    } else {
      setForm(emptyForm);
    }
  }, [user]);

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.fullName.trim()) {
      toast.error('Full name is required');
      return;
    }
    if (!isEdit && (!form.username.trim() || form.password.length < 8)) {
      toast.error('Username is required and password must be at least 8 characters');
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await userService.update(user.id, { fullName: form.fullName.trim(), role: form.role });
        toast.success('User updated');
      } else {
        await userService.create({
          username: form.username.trim(),
          fullName: form.fullName.trim(),
          password: form.password,
          role: form.role,
        });
        toast.success('User created');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving user');
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
        className="bg-white rounded-lg border border-stone-200 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-stone-200">
          <h2 className="font-display text-lg font-semibold text-stone-900">
            {isEdit ? 'Edit user' : 'Add user'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!isEdit && (
            <div>
              <label className="block text-xs font-medium text-stone-600 uppercase tracking-wide mb-2">
                Username
              </label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => update('username', e.target.value)}
                className="input-field"
                placeholder="jsmith"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-stone-600 uppercase tracking-wide mb-2">
              Full name
            </label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => update('fullName', e.target.value)}
              className="input-field"
              placeholder="Jane Smith"
              required
            />
          </div>

          {!isEdit && (
            <div>
              <label className="block text-xs font-medium text-stone-600 uppercase tracking-wide mb-2">
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                className="input-field"
                placeholder="At least 8 characters"
                minLength={8}
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-stone-600 uppercase tracking-wide mb-2">
              Role
            </label>
            <select
              value={form.role}
              onChange={(e) => update('role', e.target.value)}
              className="input-field"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5 disabled:opacity-50">
              {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create user'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}