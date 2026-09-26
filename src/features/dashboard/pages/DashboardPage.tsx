import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Wallet, ArrowRight, Target,
  PieChart, CreditCard, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useCouple } from '../../settings/hooks/useCouple';
import { useTransactions } from '../../transactions/hooks/useTransactions';
import { useAccounts } from '../../accounts/hooks/useAccounts';
import { useCategories } from '../../settings/hooks/useCategories';
import { useBudgets } from '../../budgets/hooks/useBudgets';
import { useGoals } from '../../goals/hooks/useGoals';
import { useDashboardData } from '../hooks/useDashboardData';
import { TransactionRow } from '../components/TransactionRow';
import { formatCurrency, getCurrentMonth, percentageOf } from '../../../utils/format';
import { ROUTES } from '../../../constants/routes';

function SkeletonCard() {
  return (
    <div className="kpi-card">
      <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 8, marginBottom: 12 }} />
      <div className="skeleton" style={{ width: '60%', height: 14, marginBottom: 8 }} />
      <div className="skeleton" style={{ width: '80%', height: 24 }} />
    </div>
  );
}

export function DashboardPage() {
  const { userProfile } = useAuth();
  const { coupleId, partnerProfile } = useCouple();
  const { transactions, loading: txLoading } = useTransactions(coupleId);
  const { accounts, loading: accLoading } = useAccounts(coupleId);
  const { categories } = useCategories(coupleId);
  const currentMonth = getCurrentMonth();
  const { budgets } = useBudgets(coupleId, currentMonth);
  const { goals } = useGoals(coupleId);

  useEffect(() => {
    document.title = 'Dashboard | OurBalance';
  }, []);

  const { stats, recentTransactions, spendingByCategory, activeGoals, budgetsWithActualSpent } = useDashboardData(
    transactions,
    accounts,
    budgets,
    goals,
    categories,
    userProfile,
    partnerProfile
  );

  const isLoading = txLoading || accLoading;
  const firstName = userProfile?.displayName ? userProfile.displayName.split(' ')[0] : 'Pengguna';

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Selamat Datang, {firstName}</h1>
          <p className="page-subtitle">Ringkasan keuangan Anda untuk bulan ini</p>
        </div>
        <Link to={ROUTES.TRANSACTIONS_NEW} className="btn btn-primary btn-sm">
          <CreditCard size={15} />
          <span>Tambah Transaksi</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid-kpi" style={{ marginBottom: '24px' }}>
        {isLoading ? (
          <>
            <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
          </>
        ) : (
          <>
            <div className="kpi-card animate-fade-in">
              <div className="kpi-icon blue"><Wallet size={20} /></div>
              <div className="kpi-label">Total Saldo</div>
              <div className="kpi-value">{formatCurrency(stats.totalBalance)}</div>
              <div className="kpi-change">Gabungan seluruh rekening</div>
            </div>

            <div className="kpi-card animate-fade-in">
              <div className="kpi-icon green"><TrendingUp size={20} /></div>
              <div className="kpi-label">Pemasukan Bulan Ini</div>
              <div className="kpi-value positive">{formatCurrency(stats.monthlyIncome)}</div>
              <div className="kpi-change">Bulan ini</div>
            </div>

            <div className="kpi-card animate-fade-in">
              <div className="kpi-icon red"><TrendingDown size={20} /></div>
              <div className="kpi-label">Pengeluaran Bulan Ini</div>
              <div className="kpi-value negative">{formatCurrency(stats.monthlyExpense)}</div>
              <div className="kpi-change">Bulan ini</div>
            </div>

            <div className="kpi-card animate-fade-in">
              <div className={`kpi-icon ${stats.cashFlow >= 0 ? 'green' : 'red'}`}>
                {stats.cashFlow >= 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
              </div>
              <div className="kpi-label">Arus Kas (Cash Flow)</div>
              <div className={`kpi-value ${stats.cashFlow >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(stats.cashFlow)}
              </div>
              <div className="kpi-change">Pemasukan dikurangi pengeluaran</div>
            </div>
          </>
        )}
      </div>

      {/* Balance per person */}
      {partnerProfile && (
        <div className="grid-2" style={{ marginBottom: '24px' }}>
          <div className="kpi-card">
            <div className="kpi-label">Saldo Anda</div>
            <div className="kpi-value">{formatCurrency(stats.personalBalance)}</div>
            <div className="kpi-change">{userProfile?.displayName || 'Anda'}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Saldo Pasangan</div>
            <div className="kpi-value">{formatCurrency(stats.partnerBalance)}</div>
            <div className="kpi-change">{partnerProfile.displayName}</div>
          </div>
        </div>
      )}

      {/* Main content grid */}
      <div className="dashboard-grid">
        {/* Recent Transactions */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            <div>
              <h2 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Transaksi Terbaru</h2>
            </div>
            <Link to={ROUTES.TRANSACTIONS} className="btn btn-ghost btn-sm" style={{ gap: 4 }}>
              Lihat semua <ArrowRight size={14} />
            </Link>
          </div>
          {isLoading ? (
            <div style={{ padding: '16px' }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 0', borderBottom: i < 4 ? '1px solid var(--color-border-light)' : 'none' }}>
                  <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ width: '60%', height: 14, marginBottom: 6 }} />
                    <div className="skeleton" style={{ width: '40%', height: 12 }} />
                  </div>
                  <div className="skeleton" style={{ width: 80, height: 16 }} />
                </div>
              ))}
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="empty-state">
              <CreditCard className="empty-state-icon" />
              <p className="empty-state-title">Belum ada transaksi</p>
              <p className="empty-state-description">Mulai tambahkan transaksi pertama Anda untuk mencatat keuangan</p>
              <Link to={ROUTES.TRANSACTIONS_NEW} className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>
                Tambah Transaksi
              </Link>
            </div>
          ) : (
            recentTransactions.map((tx) => (
              <TransactionRow key={tx.id} transaction={tx} categories={categories} />
            ))
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Budget Overview */}
          <div className="card">
            <div className="card-header">
              <div>
                <h2 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Anggaran Bulan Ini</h2>
              </div>
              <Link to={ROUTES.BUDGET} className="btn btn-ghost btn-sm" style={{ gap: 4 }}>
                Kelola <ArrowRight size={14} />
              </Link>
            </div>
            <div className="card-body">
              {budgetsWithActualSpent.length === 0 ? (
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  <PieChart className="empty-state-icon" />
                  <p className="empty-state-title">Belum ada anggaran</p>
                  <Link to={ROUTES.BUDGET_NEW} className="btn btn-outline btn-sm">Buat Anggaran</Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {budgetsWithActualSpent.slice(0, 5).map((budget) => {
                    const cat = categories.find((c) => c.id === budget.categoryId);
                    const pct = percentageOf(budget.spent, budget.amount);
                    return (
                      <div key={budget.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{cat?.name || 'Kategori'}</span>
                          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                            {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
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
              )}
            </div>
          </div>

          {/* Goals */}
          <div className="card">
            <div className="card-header">
              <div>
                <h2 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Financial Goals</h2>
              </div>
              <Link to={ROUTES.GOALS} className="btn btn-ghost btn-sm" style={{ gap: 4 }}>
                Lihat semua <ArrowRight size={14} />
              </Link>
            </div>
            <div className="card-body">
              {activeGoals.length === 0 ? (
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  <Target className="empty-state-icon" />
                  <p className="empty-state-title">Belum ada target impian</p>
                  <Link to={ROUTES.GOALS_NEW} className="btn btn-outline btn-sm">Buat Target</Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {activeGoals.map((goal) => {
                    const pct = percentageOf(goal.currentAmount, goal.targetAmount);
                    return (
                      <div key={goal.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <div>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{goal.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                              {formatCurrency(goal.currentAmount)} dari {formatCurrency(goal.targetAmount)}
                            </div>
                          </div>
                          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-primary-600)' }}>
                            {pct}%
                          </span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className={`progress-bar-fill ${pct >= 100 ? 'success' : ''}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Top Spending */}
          {spendingByCategory.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Pengeluaran Terbesar</h2>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {spendingByCategory.map((item) => (
                    <div key={item.name} className="report-summary-row">
                      <span className="report-summary-label">{item.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {item.percentage}%
                        </span>
                        <span className="report-summary-value">{formatCurrency(item.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
