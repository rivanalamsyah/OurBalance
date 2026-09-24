import { useState, useMemo, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Wallet, ChevronLeft, ChevronRight } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { format, addMonths, subMonths } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { useCouple } from '../../settings/hooks/useCouple';
import { useTransactions } from '../../transactions/hooks/useTransactions';
import { useAccounts } from '../../accounts/hooks/useAccounts';
import { useCategories } from '../../settings/hooks/useCategories';
import { useBudgets } from '../../budgets/hooks/useBudgets';
import { formatCurrency, percentageOf } from '../../../utils/format';

const CHART_COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];

export function ReportsPage() {
  const { coupleId } = useCouple();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const currentMonth = format(selectedDate, 'yyyy-MM');

  const { transactions } = useTransactions(coupleId);
  const { accounts } = useAccounts(coupleId);
  const { categories } = useCategories(coupleId);
  const { budgets } = useBudgets(coupleId, currentMonth);

  useEffect(() => {
    document.title = 'Reports | OurBalance';
  }, []);

  const monthData = useMemo(() => {
    const [year, m] = currentMonth.split('-').map(Number);
    const start = new Date(year, m - 1, 1);
    const end = new Date(year, m, 0, 23, 59, 59);

    let income = 0;
    let expense = 0;
    const catSpend: Record<string, number> = {};

    transactions.forEach((tx) => {
      const date = tx.date instanceof Timestamp ? tx.date.toDate() : new Date(tx.date as string | number | Date);
      if (date < start || date > end) return;
      if (tx.type === 'income') income += tx.amount;
      else if (tx.type === 'expense' || tx.type === 'shared_expense') {
        expense += tx.amount;
        catSpend[tx.categoryId] = (catSpend[tx.categoryId] || 0) + tx.amount;
      }
    });

    const categoryData = Object.entries(catSpend)
      .map(([catId, amount]) => ({
        name: categories.find((c) => c.id === catId)?.name || 'Lainnya',
        value: amount,
        percentage: percentageOf(amount, expense),
      }))
      .sort((a, b) => b.value - a.value);

    return { income, expense, cashFlow: income - expense, categoryData };
  }, [transactions, categories, currentMonth]);

  const trendData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(selectedDate, 5 - i);
      const [year, m] = format(d, 'yyyy-MM').split('-').map(Number);
      const start = new Date(year, m - 1, 1);
      const end = new Date(year, m, 0, 23, 59, 59);

      let income = 0;
      let expense = 0;
      transactions.forEach((tx) => {
        const date = tx.date instanceof Timestamp ? tx.date.toDate() : new Date(tx.date as string | number | Date);
        if (date < start || date > end) return;
        if (tx.type === 'income') income += tx.amount;
        else if (tx.type === 'expense' || tx.type === 'shared_expense') expense += tx.amount;
      });

      return { month: format(d, 'MMM'), income, expense };
    });
  }, [transactions, selectedDate]);

  const budgetVsActual = useMemo(() => {
    const [year, m] = currentMonth.split('-').map(Number);
    const start = new Date(year, m - 1, 1);
    const end = new Date(year, m, 0, 23, 59, 59);

    const catSpend: Record<string, number> = {};
    transactions.forEach((tx) => {
      if (tx.type !== 'expense' && tx.type !== 'shared_expense') return;
      const date = tx.date instanceof Timestamp ? tx.date.toDate() : new Date(tx.date as string | number | Date);
      if (date < start || date > end) return;
      catSpend[tx.categoryId] = (catSpend[tx.categoryId] || 0) + tx.amount;
    });

    return budgets.map((b) => ({
      name: categories.find((c) => c.id === b.categoryId)?.name || 'Kategori',
      budget: b.amount,
      actual: catSpend[b.categoryId] || 0,
    }));
  }, [budgets, transactions, categories, currentMonth]);

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Laporan Keuangan</h1>
          <p className="page-subtitle">Analisis tren & pengeluaran bulanan</p>
        </div>
      </div>

      {/* Month Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => setSelectedDate(subMonths(selectedDate, 1))}
          aria-label="Bulan sebelumnya"
        >
          <ChevronLeft size={16} />
        </button>
        <span style={{ fontSize: '0.9375rem', fontWeight: 600, minWidth: 120, textAlign: 'center' }}>
          {format(selectedDate, 'MMMM yyyy')}
        </span>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => setSelectedDate(addMonths(selectedDate, 1))}
          aria-label="Bulan selanjutnya"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="grid-kpi" style={{ marginBottom: 24 }}>
        <div className="kpi-card">
          <div className="kpi-icon green"><TrendingUp size={20} /></div>
          <div className="kpi-label">Pemasukan</div>
          <div className="kpi-value positive">{formatCurrency(monthData.income)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon red"><TrendingDown size={20} /></div>
          <div className="kpi-label">Pengeluaran</div>
          <div className="kpi-value negative">{formatCurrency(monthData.expense)}</div>
        </div>
        <div className="kpi-card">
          <div className={`kpi-icon ${monthData.cashFlow >= 0 ? 'green' : 'red'}`}>
            <Wallet size={20} />
          </div>
          <div className="kpi-label">Arus Kas</div>
          <div className={`kpi-value ${monthData.cashFlow >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(monthData.cashFlow)}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon blue"><Wallet size={20} /></div>
          <div className="kpi-label">Total Saldo Rekening</div>
          <div className="kpi-value">{formatCurrency(totalBalance)}</div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Income vs Expense Trend */}
        <div className="card">
          <div className="card-header">
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Tren 6 Bulan Terakhir</h2>
          </div>
          <div className="card-body">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                  <Tooltip
                    formatter={(value: unknown) => formatCurrency(Number(value) || 0)}
                    contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)', fontSize: '0.8125rem' }}
                  />
                  <Bar dataKey="income" fill="var(--color-success)" radius={[4, 4, 0, 0]} name="Pemasukan" />
                  <Bar dataKey="expense" fill="var(--color-danger)" radius={[4, 4, 0, 0]} name="Pengeluaran" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--color-success)' }} />
                Pemasukan
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--color-danger)' }} />
                Pengeluaran
              </div>
            </div>
          </div>
        </div>

        {/* Spending by Category */}
        {monthData.categoryData.length > 0 ? (
          <div className="card">
            <div className="card-header">
              <h2 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Pengeluaran per Kategori</h2>
            </div>
            <div className="card-body">
              <div style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={monthData.categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {monthData.categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: unknown) => formatCurrency(Number(value) || 0)} contentStyle={{ borderRadius: 8, fontSize: '0.8125rem' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                {monthData.categoryData.slice(0, 5).map((item, i) => (
                  <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                      <span style={{ color: 'var(--color-text-secondary)' }}>{item.name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>{item.percentage}%</span>
                      <span style={{ fontWeight: 600 }}>{formatCurrency(item.value)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-header">
              <h2 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Pengeluaran per Kategori</h2>
            </div>
            <div className="empty-state">
              <BarChart3 className="empty-state-icon" />
              <p className="empty-state-title">Belum ada data pengeluaran</p>
              <p className="empty-state-description">Tambah transaksi untuk melihat grafik pengeluaran</p>
            </div>
          </div>
        )}

        {/* Budget vs Actual */}
        {budgetVsActual.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h2 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Anggaran vs Realisasi</h2>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {budgetVsActual.map((item) => {
                  const pct = percentageOf(item.actual, item.budget);
                  return (
                    <div key={item.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.875rem' }}>
                        <span style={{ fontWeight: 500 }}>{item.name}</span>
                        <span style={{ color: 'var(--color-text-secondary)' }}>
                          {formatCurrency(item.actual)} / {formatCurrency(item.budget)}
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className={`progress-bar-fill ${pct >= 100 ? 'danger' : pct >= 80 ? 'warning' : ''}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Account Balances */}
        <div className="card">
          <div className="card-header">
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Saldo Rekening</h2>
          </div>
          <div className="card-body">
            {accounts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                Belum ada rekening
              </div>
            ) : (
              <div>
                {accounts.map((acc) => (
                  <div key={acc.id} className="report-summary-row">
                    <span className="report-summary-label">{acc.name}</span>
                    <span className={`report-summary-value ${acc.balance < 0 ? 'text-danger' : ''}`}>
                      {formatCurrency(acc.balance)}
                    </span>
                  </div>
                ))}
                <div className="report-summary-row" style={{ borderTop: '2px solid var(--color-border)', marginTop: 8, paddingTop: 16 }}>
                  <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Total Saldo</span>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-primary-600)' }}>
                    {formatCurrency(totalBalance)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
