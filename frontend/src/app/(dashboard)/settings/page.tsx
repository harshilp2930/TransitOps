'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Shield, Users, Save, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SettingsPage() {
  const { hasRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [permissionsList, setPermissionsList] = useState<string[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await api.get('/auth/roles/');
        const data = res.data.results || res.data;
        setRoles(data);
        
        // Extract all unique permissions from all roles to build the matrix rows
        const allPerms = new Set<string>();
        data.forEach((role: any) => {
          Object.keys(role.permission_matrix || {}).forEach(p => allPerms.add(p));
        });
        setPermissionsList(Array.from(allPerms).sort());
      } catch (err) {
        toast.error('Failed to load roles');
      } finally {
        setFetching(false);
      }
    };
    if (hasRole(['Fleet Manager'])) {
      fetchRoles();
    }
  }, [hasRole]);

  if (!hasRole(['Fleet Manager'])) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <Shield className="w-12 h-12 mb-4 text-slate-300" />
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Access Restricted</h2>
        <p>You do not have permission to view or edit system settings.</p>
      </div>
    );
  }

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Settings saved successfully (Simulated)!');
    }, 1000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">System Settings</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage global application settings and roles</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 px-4 py-2 rounded-lg font-medium transition-colors flex items-center disabled:opacity-50"
        >
          {loading ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
            <Users className="w-5 h-5 mr-2 text-blue-500" /> Role-Based Access Control (RBAC)
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Dynamically view what each role is allowed to do within TransitOps.</p>
        </div>
        
        {fetching ? (
          <div className="p-8 text-center text-slate-500">Loading roles...</div>
        ) : (
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4">Permission</th>
                  {roles.map(role => (
                    <th key={role.id} className="px-6 py-4 text-center">{role.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                {permissionsList.length === 0 ? (
                  <tr>
                    <td colSpan={roles.length + 1} className="px-6 py-4 text-center text-slate-500">
                      No permissions defined in the system.
                    </td>
                  </tr>
                ) : (
                  permissionsList.map((perm, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{perm}</td>
                      {roles.map(role => (
                        <td key={role.id} className="px-6 py-4 text-center">
                          <input 
                            type="checkbox" 
                            checked={!!role.permission_matrix?.[perm]} 
                            readOnly
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-default opacity-80" 
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border-t border-slate-200 dark:border-slate-800 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-400">
            <strong>Note:</strong> Currently RBAC is in View-Only mode. 
          </p>
        </div>
      </div>
    </div>
  );
}
