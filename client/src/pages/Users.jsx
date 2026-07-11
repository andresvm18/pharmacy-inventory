import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, KeyRound } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { userService } from '../services/userService';
import UserFormModal from '../components/UserFormModal';
import ResetPasswordModal from '../components/ResetPasswordModal';

function formatRole(role) {
  if (!role) return '';
  return role.charAt(0) + role.slice(1).toLowerCase();
}

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [resettingUser, setResettingUser] = useState(null);

  const fetchUsers = async () => {
    try {
      const data = await userService.getAll();
      setUsers(data);
    } catch {
      toast.error('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreate = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleToggleActive = async (user) => {
    if (user.id === currentUser.userId) {
      toast.error('You cannot deactivate your own account');
      return;
    }
    try {
      await userService.toggleActive(user.id);
      toast.success(`${user.fullName} ${user.isActive ? 'deactivated' : 'activated'}`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating user status');
    }
  };

  if (loading) return <UsersSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-stone-900">Users</h1>
        <button onClick={openCreate} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" strokeWidth={2} />
          Add user
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-stone-500 text-xs uppercase tracking-wide">Username</th>
                <th className="px-4 py-3 text-left font-medium text-stone-500 text-xs uppercase tracking-wide">Full name</th>
                <th className="px-4 py-3 text-left font-medium text-stone-500 text-xs uppercase tracking-wide">Role</th>
                <th className="px-4 py-3 text-left font-medium text-stone-500 text-xs uppercase tracking-wide">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                  <td className="px-4 py-3 text-stone-600 data-num text-xs">{user.username}</td>
                  <td className="px-4 py-3 font-medium text-stone-900">
                    {user.fullName}
                    {user.id === currentUser.userId && (
                      <span className="text-xs text-stone-400 ml-1">(you)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-stone-600">{formatRole(user.role)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(user)}
                      disabled={user.id === currentUser.userId}
                      className={`text-xs px-2 py-0.5 rounded font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        user.isActive
                          ? 'bg-clinical-50 text-clinical-700 hover:bg-clinical-100'
                          : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                      }`}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => setResettingUser(user)}
                        className="text-stone-400 hover:text-clinical-700 transition"
                        aria-label={`Reset password for ${user.fullName}`}
                      >
                        <KeyRound className="w-4 h-4" strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => openEdit(user)}
                        className="text-stone-400 hover:text-clinical-700 transition"
                        aria-label={`Edit ${user.fullName}`}
                      >
                        <Pencil className="w-4 h-4" strokeWidth={2} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <UserFormModal
          user={editingUser}
          onClose={() => setShowForm(false)}
          onSaved={fetchUsers}
        />
      )}

      {resettingUser && (
        <ResetPasswordModal
          user={resettingUser}
          onClose={() => setResettingUser(null)}
          onSaved={fetchUsers}
        />
      )}
    </div>
  );
}

function UsersSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-9 bg-stone-200 rounded w-32"></div>
      <div className="card">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-stone-100 rounded-md mb-2"></div>
        ))}
      </div>
    </div>
  );
}