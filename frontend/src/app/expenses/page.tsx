"use client";

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function ExpensesList() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setIsLoading(true);
      try {
        const res = await api.get('/expenses/');
        setItems(res.data);
      } catch (e) {
        console.error('Failed to load expenses', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [user]);

  if (loading || isLoading) return <div className="p-8">Loading expenses...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Expenses</h2>
        <Link href="/expenses/new" className="text-sm text-blue-600">Add Expense</Link>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900">
            <tr>
              <th className="text-left px-4 py-3">Vehicle</th>
              <th className="text-left px-4 py-3">Category</th>
              <th className="text-left px-4 py-3">Amount</th>
              <th className="text-left px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {items.map(i => (
              <tr key={i.id} className="border-t border-slate-100 dark:border-slate-700">
                <td className="px-4 py-3">{i.vehicle?.registration_number || '—'}</td>
                <td className="px-4 py-3">{i.category}</td>
                <td className="px-4 py-3">{i.amount}</td>
                <td className="px-4 py-3">{i.incured_at?.slice(0,10) || i.created_at?.slice(0,10)}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-500">No expenses recorded.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
