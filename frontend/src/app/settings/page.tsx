"use client";

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsPage() {
  const { user, loading, hasRole } = useAuth();
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [jsonVal, setJsonVal] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setIsLoading(true);
      try {
        const res = await api.get('/auth/roles/');
        setRoles(res.data);
      } catch (e) {
        console.error('Failed to load roles', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [user]);

  if (loading || isLoading) return <div className="p-8">Loading settings...</div>;
  if (!hasRole(['Fleet Manager'])) return <div className="p-8">Access denied.</div>;

  const startEdit = (role: any) => {
    setEditing(role);
    setJsonVal(JSON.stringify(role.permission_matrix || {}, null, 2));
  };

  const save = async () => {
    try {
      const matrix = JSON.parse(jsonVal);
      await api.patch(`/auth/roles/${editing.id}/permissions/`, { permission_matrix: matrix });
      const res = await api.get('/auth/roles/');
      setRoles(res.data);
      setEditing(null);
    } catch (e) {
      alert('Failed to save permissions: ' + (e as any)?.response?.data?.detail || e);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Settings — Role Permissions</h1>
      <div className="bg-white dark:bg-slate-800 p-4 rounded shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900">
            <tr>
              <th className="text-left px-4 py-2">Role</th>
              <th className="text-left px-4 py-2">Permissions (summary)</th>
              <th className="text-left px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {roles.map(r => (
              <tr key={r.id} className="border-t border-slate-100 dark:border-slate-700">
                <td className="px-4 py-2">{r.name}</td>
                <td className="px-4 py-2"><pre className="text-xs max-w-xl truncate">{JSON.stringify(r.permission_matrix || {}, null, 2)}</pre></td>
                <td className="px-4 py-2"><button onClick={() => startEdit(r)} className="px-3 py-1 bg-blue-600 text-white rounded">Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-800 p-6 rounded shadow-lg">
            <h2 className="text-lg font-medium mb-3">Edit Permissions — {editing.name}</h2>
            <textarea value={jsonVal} onChange={(e) => setJsonVal(e.target.value)} className="w-full h-64 p-2 rounded border bg-slate-50 dark:bg-slate-900 text-xs font-mono" />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="px-3 py-1 rounded border">Cancel</button>
              <button onClick={save} className="px-3 py-1 bg-green-600 text-white rounded">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
