import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Plus, PieChart, AlertTriangle, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { format, addMonths, subMonths } from 'date-fns';
import { useAuth } from '../../../contexts/AuthContext';
import { useCouple } from '../../settings/hooks/useCouple';
import { useBudgets } from '../hooks/useBudgets';
import { useCategories } from '../../settings/hooks/useCategories';
import { useTransactions } from '../../transactions/hooks/useTransactions';
import { addBudget, updateBudget, deleteBudget } from '../services/budgetService';
import { formatCurrency, percentageOf } from '../../../utils/format';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { useToast } from '../../../contexts/ToastContext';
import { ROUTES } from '../../../constants/routes';
import type { Budget } from '../../../types';

export function BudgetPage() {
  const { user } = useAuth();
  const { coupleId } = useCouple();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const currentMonth = format(selectedDate, 'yyyy-MM');
  const { budgets, loading } = useBudgets(coupleId, currentMonth);
  const { categories } = useCategories(coupleId);
  const { transactions } = useTransactions(coupleId);
  const { success, error: showError } = useToast();

  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();

  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deletingBudget, setDeletingBudget] = useState<Budget | null>(null);
  const [formData, setFormData] = useState({ categoryId: '', amount: '' });
  const [formErrors, setFormErrors] = useState<{ categoryId?: string; amount?: string }>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    document.title = 'Budget | OurBalance';
  }, []);

  // Handle subroutes (/budget/new, /budget/:budgetId/edit)
  useEffect(() => {
    if (location.pathname === ROUTES.BUDGET_NEW) {
      setEditingBudget(null);
      setFormData({ categoryId: '', amount: '' });
      setFormErrors({});
      setShowModal(true);
    } else if (params.budgetId && location.pathname.endsWith('/edit')) {
      const b = budgets.find((item) => item.id === params.budgetId);
      if (b) {
        setEditingBudget(b);
        setFormData({ categoryId: b.categoryId, amount: String(b.amount) });
        setFormErrors({});
        setShowModal(true);
      }
    }
  }, [location.pathname, params.budgetId, budgets]);

  const spendingByCat = useMemo(() => {
    const [year, m] = currentMonth.split('-').map(Number);
    const start = new Date(year, m - 1, 1);
    const end = new Date(year, m, 0, 23, 59, 59);
    const map: Record<string, number> = {};

    transactions.forEach((tx) => {
      if (tx.type !== 'expense' && tx.type !== 'shared_expense') return;
      const date = tx.date instanceof Timestamp ? tx.date.toDate() : new Date(tx.date as string | number | Date);
      if (date < start || date > end) return;
      map[tx.categoryId] = (map[tx.categoryId] || 0) + tx.amount;
    });
    return map;
  }, [transactions, currentMonth]);

  const budgetsWithSpent = useMemo(() =>
    budgets.map((b) => ({
      ...b,
      spent: spendingByCat[b.categoryId] || 0,
    })),
    [budgets, spendingByCat]
  );

  const totalBudget = budgetsWithSpent.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgetsWithSpent.reduce((s, b) => s + b.spent, 0);
  const overallPct = percentageOf(totalSpent, totalBudget);

  const usedCategoryIds = budgets.map((b) => b.categoryId);
  const availableCategories = categories.filter(
    (c) => c.type === 'expense' && (!usedCategoryIds.includes(c.id) || (editingBudget && editingBudget.categoryId === c.id))
  );

  function openAdd() {
    navigate(ROUTES.BUDGET_NEW);
  }

  function openEdit(b: Budget) {
    navigate(ROUTES.BUDGET_EDIT(b.id));
  }

  function closeModal() {
    setShowModal(false);
    if (location.pathname !== ROUTES.BUDGET) {
      navigate(ROUTES.BUDGET);
    }
  }

  function validate() {
    const errs: typeof formErrors = {};
    if (!formData.categoryId) errs.categoryId = 'Pilih kategori anggaran';
    if (!formData.amount || Number(formData.amount) <= 0) errs.amount = 'Masukkan jumlah nominal yang valid';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate() || !coupleId || !user) return;
    setSaving(true);
    try {
      if (editingBudget) {
        await updateBudget(editingBudget.id, { amount: Number(formData.amount) });
        success('Anggaran berhasil diperbarui');
      } else {
        await addBudget({
          userId: user.uid,
          coupleId,
          categoryId: formData.categoryId,
          amount: Number(formData.amount),
          period: 'monthly',
          month: currentMonth,
          spent: 0,
        });
        success('Anggaran berhasil dibuat');
      }
      closeModal();
    } catch {
      showError('Gagal menyimpan anggaran');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingBudget) return;
    setDeleting(true);
    try {
      await deleteBudget(deletingBudget.id);
      success('Anggaran berhasil dihapus');
      setDeletingBudget(null);
    } catch {
      showError('Gagal menghapus anggaran');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Anggaran Bulanan</h1>
          <p className="page-subtitle">{budgetsWithSpent.length} anggaran aktif · {percentageOf(totalSpent, totalBudget)}% terpakai</p>
        </div>
        <Button variant="primary" size="sm" onClick={openAdd} leftIcon={<Plus size={15} />} id="add-budget-btn">
          Buat Anggaran
        </Button>
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

      {/* Overall Summary */}
      {budgetsWithSpent.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Total Penggunaan Anggaran</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: 2 }}>
                  {formatCurrency(totalSpent)} <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', fontWeight: 400 }}>dari {formatCurrency(totalBudget)}</span>
                </div>
              </div>
              <span style={{
                fontSize: '1.5rem', fontWeight: 700,
                color: overallPct >= 100 ? 'var(--color-danger)' : overallPct >= 80 ? 'var(--color-warning)' : 'var(--color-primary-600)'
              }}>
                {overallPct}%
              </span>
            </div>
            <div className="progress-bar" style={{ height: 12 }}>
              <div
                className={`progress-bar-fill ${overallPct >= 100 ? 'danger' : overallPct >= 80 ? 'warning' : ''}`}
                style={{ width: `${Math.min(overallPct, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Budget Cards */}
      {loading ? (
        <div className="grid-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card" style={{ padding: 20 }}>
              <div className="skeleton" style={{ width: '60%', height: 14, marginBottom: 12 }} />
              <div className="skeleton" style={{ width: '80%', height: 24, marginBottom: 12 }} />
              <div className="skeleton" style={{ width: '100%', height: 8, borderRadius: 999 }} />
            </div>
          ))}
        </div>
      ) : budgetsWithSpent.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <PieChart className="empty-state-icon" />
          <p className="empty-state-title">Belum ada anggaran untuk bulan ini</p>
          <p className="empty-state-description">Buat anggaran untuk mengontrol pengeluaran per kategori</p>
          <Button variant="primary" size="sm" onClick={openAdd} style={{ marginTop: 8 }}>
            Buat Anggaran
          </Button>
        </div>
      ) : (
        <div className="grid-2">
          {budgetsWithSpent.map((budget) => {
            const cat = categories.find((c) => c.id === budget.categoryId);
            const pct = percentageOf(budget.spent, budget.amount);
            const isOver = budget.spent > budget.amount;
            const isWarning = !isOver && pct >= 80;

            return (
              <div key={budget.id} className="progress-card animate-fade-in">
                <div className="progress-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {(isOver || isWarning) && (
                      <AlertTriangle size={16} color={isOver ? 'var(--color-danger)' : 'var(--color-warning)'} />
                    )}
                    <span className="progress-card-title">{cat?.name || 'Kategori'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '4px 6px' }}
                      onClick={() => openEdit(budget)}
                      aria-label="Edit anggaran"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '4px 6px', color: 'var(--color-danger)' }}
                      onClick={() => setDeletingBudget(budget)}
                      aria-label="Hapus anggaran"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <div className="progress-card-amount" style={{ marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: '1.125rem', color: isOver ? 'var(--color-danger)' : 'var(--color-text-primary)' }}>
                    {formatCurrency(budget.spent)}
                  </span>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}> / {formatCurrency(budget.amount)}</span>
                </div>
                <div className="progress-bar">
                  <div
                    className={`progress-bar-fill ${isOver ? 'danger' : isWarning ? 'warning' : ''}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <div className="progress-card-meta">
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {isOver ? `Melebihi budget ${formatCurrency(budget.spent - budget.amount)}` : `Tersisa ${formatCurrency(budget.amount - budget.spent)}`}
                  </span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: isOver ? 'var(--color-danger)' : isWarning ? 'var(--color-warning)' : 'var(--color-primary-600)' }}>
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingBudget ? 'Edit Anggaran' : 'Buat Anggaran'}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={closeModal} disabled={saving}>Batal</Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>
              {editingBudget ? 'Simpan Perubahan' : 'Buat Anggaran'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Select
            label="Kategori"
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            error={formErrors.categoryId}
            options={[
              { value: '', label: 'Pilih Kategori' },
              ...availableCategories.map((c) => ({ value: c.id, label: c.name })),
            ]}
            required
            disabled={!!editingBudget}
          />
          <Input
            type="number"
            label="Batas Anggaran Bulanan (IDR)"
            placeholder="0"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            error={formErrors.amount}
            required
            min="1"
          />
          <div style={{ padding: '10px 12px', background: 'var(--color-primary-50)', borderRadius: 8, fontSize: '0.8125rem', color: 'var(--color-primary-700)' }}>
            Anggaran untuk periode <strong>{format(selectedDate, 'MMMM yyyy')}</strong>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingBudget}
        onClose={() => setDeletingBudget(null)}
        onConfirm={handleDelete}
        title="Hapus Anggaran"
        message={`Hapus anggaran kategori "${categories.find((c) => c.id === deletingBudget?.categoryId)?.name || 'ini'}"?`}
        confirmText="Hapus"
        loading={deleting}
      />
    </div>
  );
}
