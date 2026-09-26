import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Plus, Search, Edit2, Trash2, CreditCard, X,
} from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '../../../contexts/AuthContext';
import { useCouple } from '../../settings/hooks/useCouple';
import { useTransactions } from '../hooks/useTransactions';
import { useAccounts } from '../../accounts/hooks/useAccounts';
import { useCategories } from '../../settings/hooks/useCategories';
import { addTransaction, updateTransaction, deleteTransaction } from '../services/transactionService';
import { formatCurrency, formatDate, getCurrentMonth } from '../../../utils/format';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { useToast } from '../../../contexts/ToastContext';
import { ROUTES } from '../../../constants/routes';
import type { Transaction, TransactionType } from '../../../types';

const TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: 'income', label: 'Pemasukan' },
  { value: 'expense', label: 'Pengeluaran' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'shared_expense', label: 'Shared Expense' },
];

interface TransactionFormData {
  type: TransactionType;
  amount: string;
  categoryId: string;
  accountId: string;
  toAccountId: string;
  date: string;
  description: string;
  notes: string;
}

const defaultFormData: TransactionFormData = {
  type: 'expense',
  amount: '',
  categoryId: '',
  accountId: '',
  toAccountId: '',
  date: new Date().toISOString().split('T')[0],
  description: '',
  notes: '',
};

export function TransactionsPage() {
  const { user } = useAuth();
  const { coupleId } = useCouple();
  const { transactions, loading } = useTransactions(coupleId);
  const { accounts } = useAccounts(coupleId);
  const { categories } = useCategories(coupleId);
  const { success, error: showError } = useToast();

  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();

  const [showModal, setShowModal] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState<TransactionFormData>(defaultFormData);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof TransactionFormData, string>>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState(getCurrentMonth());

  useEffect(() => {
    document.title = 'Transactions | OurBalance';
  }, []);

  // Handle URL sub-routes (/transactions/new or /transactions/:id/edit)
  useEffect(() => {
    if (location.pathname === ROUTES.TRANSACTIONS_NEW) {
      setEditingTx(null);
      setFormData(defaultFormData);
      setFormErrors({});
      setShowModal(true);
    } else if (params.transactionId && location.pathname.endsWith('/edit')) {
      const tx = transactions.find((t) => t.id === params.transactionId);
      if (tx) {
        setEditingTx(tx);
        const date = tx.date instanceof Timestamp ? tx.date.toDate() : new Date(tx.date as string | number | Date);
        setFormData({
          type: tx.type,
          amount: String(tx.amount),
          categoryId: tx.categoryId,
          accountId: tx.accountId,
          toAccountId: tx.toAccountId || '',
          date: date.toISOString().split('T')[0],
          description: tx.description,
          notes: tx.notes || '',
        });
        setFormErrors({});
        setShowModal(true);
      }
    }
  }, [location.pathname, params.transactionId, transactions]);

  const filtered = useMemo(() => {
    const [year, m] = filterMonth.split('-').map(Number);
    const start = new Date(year, m - 1, 1);
    const end = new Date(year, m, 0, 23, 59, 59);

    return transactions.filter((tx) => {
      const date = tx.date instanceof Timestamp ? tx.date.toDate() : new Date(tx.date as string | number | Date);
      const inMonth = date >= start && date <= end;
      const matchesType = filterType === 'all' || tx.type === filterType;
      const matchesSearch =
        !search ||
        tx.description.toLowerCase().includes(search.toLowerCase()) ||
        categories.find((c) => c.id === tx.categoryId)?.name?.toLowerCase().includes(search.toLowerCase());
      return inMonth && matchesType && matchesSearch;
    });
  }, [transactions, filterMonth, filterType, search, categories]);

  function openAdd() {
    navigate(ROUTES.TRANSACTIONS_NEW);
  }

  function openEdit(tx: Transaction) {
    navigate(ROUTES.TRANSACTION_EDIT(tx.id));
  }

  function closeModal() {
    setShowModal(false);
    if (location.pathname !== ROUTES.TRANSACTIONS) {
      navigate(ROUTES.TRANSACTIONS);
    }
  }

  function validate(): boolean {
    const errs: typeof formErrors = {};
    if (!formData.description.trim()) errs.description = 'Deskripsi transaksi wajib diisi';
    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0)
      errs.amount = 'Masukkan jumlah nominal yang valid';
    if (!formData.accountId) errs.accountId = 'Pilih rekening/akun';
    if (formData.type === 'transfer' && !formData.toAccountId)
      errs.toAccountId = 'Pilih rekening tujuan';
    if (!formData.date) errs.date = 'Tanggal wajib diisi';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate() || !coupleId || !user) return;
    setSaving(true);
    try {
      const amount = Number(formData.amount);
      const data: Record<string, any> = {
        userId: user.uid,
        coupleId,
        type: formData.type,
        amount,
        categoryId: formData.categoryId,
        accountId: formData.accountId,
        date: Timestamp.fromDate(new Date(formData.date)),
        description: formData.description.trim(),
      };

      if (formData.type === 'transfer' && formData.toAccountId) {
        data.toAccountId = formData.toAccountId;
      } else {
        data.toAccountId = '';
      }
      if (formData.notes && formData.notes.trim()) {
        data.notes = formData.notes.trim();
      } else {
        data.notes = '';
      }

      if (editingTx) {
        await updateTransaction(editingTx.id, data as any);
        success('Transaksi berhasil diperbarui');
      } else {
        await addTransaction(data as any);
        success('Transaksi berhasil ditambahkan');
      }
      closeModal();
    } catch (err) {
      console.error('Error saving transaction:', err);
      showError('Gagal menyimpan transaksi');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingTx) return;
    setDeleting(true);
    try {
      await deleteTransaction(deletingTx.id);
      success('Transaksi berhasil dihapus');
      setDeletingTx(null);
    } catch {
      showError('Gagal menghapus transaksi');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Daftar Transaksi</h1>
          <p className="page-subtitle">{filtered.length} transaksi ditemukan</p>
        </div>
        <Button variant="primary" size="sm" onClick={openAdd} leftIcon={<Plus size={15} />} id="add-transaction-btn">
          Tambah Transaksi
        </Button>
      </div>

      {/* Toolbar */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body" style={{ paddingTop: '16px', paddingBottom: '16px' }}>
          <div className="toolbar">
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" />
              <input
                className="input-field"
                style={{ paddingLeft: 36 }}
                placeholder="Cari transaksi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Cari transaksi"
              />
            </div>
            <select
              className="input-field"
              style={{ width: 'auto', minWidth: 140 }}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              aria-label="Filter berdasarkan tipe"
            >
              <option value="all">Semua Tipe</option>
              {TYPE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <input
              type="month"
              className="input-field"
              style={{ width: 'auto' }}
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              aria-label="Filter berdasarkan bulan"
            />
            {(search || filterType !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSearch(''); setFilterType('all'); }}
                leftIcon={<X size={14} />}
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '16px' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 0', borderBottom: i < 5 ? '1px solid var(--color-border-light)' : 'none' }}>
                <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ width: '50%', height: 14, marginBottom: 6 }} />
                  <div className="skeleton" style={{ width: '35%', height: 12 }} />
                </div>
                <div className="skeleton" style={{ width: 90, height: 16 }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <CreditCard className="empty-state-icon" />
            <p className="empty-state-title">Belum ada transaksi</p>
            <p className="empty-state-description">
              {search || filterType !== 'all' ? 'Coba ubah kata kunci atau filter Anda' : 'Mulai catat transaksi pertama Anda'}
            </p>
            {!search && filterType === 'all' && (
              <Button variant="primary" size="sm" onClick={openAdd} style={{ marginTop: 8 }}>
                Tambah Transaksi
              </Button>
            )}
          </div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Deskripsi</th>
                  <th>Kategori</th>
                  <th>Akun</th>
                  <th>Tanggal</th>
                  <th>Tipe</th>
                  <th style={{ textAlign: 'right' }}>Jumlah</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => {
                  const cat = categories.find((c) => c.id === tx.categoryId);
                  const acc = accounts.find((a) => a.id === tx.accountId);
                  const date = tx.date instanceof Timestamp ? tx.date.toDate() : new Date(tx.date as string | number | Date);
                  const isIncome = tx.type === 'income';
                  return (
                    <tr key={tx.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{tx.description}</div>
                        {tx.notes && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{tx.notes}</div>}
                      </td>
                      <td><span className="badge badge-gray">{cat?.name || '—'}</span></td>
                      <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>{acc?.name || '—'}</td>
                      <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>{formatDate(date)}</td>
                      <td>
                        <span className={`badge ${tx.type === 'income' ? 'badge-green' : tx.type === 'expense' ? 'badge-red' : tx.type === 'transfer' ? 'badge-blue' : 'badge-yellow'}`}>
                          {TYPE_OPTIONS.find((t) => t.value === tx.type)?.label}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: isIncome ? 'var(--color-success)' : 'var(--color-danger)', whiteSpace: 'nowrap' }}>
                        {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '4px 6px' }}
                            onClick={() => openEdit(tx)}
                            aria-label="Edit transaksi"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '4px 6px', color: 'var(--color-danger)' }}
                            onClick={() => setDeletingTx(tx)}
                            aria-label="Hapus transaksi"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingTx ? 'Edit Transaksi' : 'Tambah Transaksi'}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={closeModal} disabled={saving}>Batal</Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>
              {editingTx ? 'Simpan Perubahan' : 'Tambah Transaksi'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Select
            label="Tipe Transaksi"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as TransactionType, categoryId: '' })}
            options={TYPE_OPTIONS}
            required
          />

          <Input
            label="Deskripsi"
            placeholder="Contoh: Makan Siang Kantor"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            error={formErrors.description}
            required
          />

          <Input
            type="number"
            label="Jumlah Nominal (IDR)"
            placeholder="0"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            error={formErrors.amount}
            required
            min="0"
          />

          <Select
            label="Kategori"
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            error={formErrors.categoryId}
            options={[
              { value: '', label: 'Pilih Kategori' },
              ...(formData.type === 'income'
                ? categories.filter((c) => c.type === 'income')
                : categories.filter((c) => c.type === 'expense')
              ).map((c) => ({ value: c.id, label: c.name })),
            ]}
          />

          <Select
            label="Rekening / Akun"
            value={formData.accountId}
            onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
            error={formErrors.accountId}
            options={[
              { value: '', label: 'Pilih Akun' },
              ...accounts.map((a) => ({ value: a.id, label: `${a.name} (${formatCurrency(a.balance)})` })),
            ]}
            required
          />

          {formData.type === 'transfer' && (
            <Select
              label="Rekening Tujuan"
              value={formData.toAccountId}
              onChange={(e) => setFormData({ ...formData, toAccountId: e.target.value })}
              error={formErrors.toAccountId}
              options={[
                { value: '', label: 'Pilih Rekening Tujuan' },
                ...accounts.filter((a) => a.id !== formData.accountId).map((a) => ({
                  value: a.id,
                  label: `${a.name} (${formatCurrency(a.balance)})`,
                })),
              ]}
              required
            />
          )}

          <Input
            type="date"
            label="Tanggal"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            error={formErrors.date}
            required
          />

          <Input
            label="Catatan (Opsional)"
            placeholder="Keterangan tambahan..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deletingTx}
        onClose={() => setDeletingTx(null)}
        onConfirm={handleDelete}
        title="Hapus Transaksi"
        message={`Apakah Anda yakin ingin menghapus transaksi "${deletingTx?.description}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        loading={deleting}
      />
    </div>
  );
}
