import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Users, Trash2, CheckCircle } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '../../../contexts/AuthContext';
import { useCouple } from '../../settings/hooks/useCouple';
import { useCategories } from '../../settings/hooks/useCategories';
import { useSharedExpenses } from '../hooks/useSharedExpenses';
import {
  addSharedExpense,
  deleteSharedExpense,
  settleExpense,
  calculateBalance,
} from '../services/sharedExpenseService';
import { formatCurrency, formatDate, percentageOf } from '../../../utils/format';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { useToast } from '../../../contexts/ToastContext';
import { ROUTES } from '../../../constants/routes';
import type { SharedExpense, SplitType, Category } from '../../../types';

export function SharedPage() {
  const { user, userProfile } = useAuth();
  const { coupleId, partnerProfile } = useCouple();
  const { categories } = useCategories(coupleId);
  const { expenses, settlements, loading } = useSharedExpenses(coupleId);
  const { success, error: showError } = useToast();

  const location = useLocation();
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [deletingExp, setDeletingExp] = useState<SharedExpense | null>(null);
  const [showSettleModal, setShowSettleModal] = useState(false);

  const [saving, setSaving] = useState(false);
  const [settling, setSettling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    categoryId: '',
    paidBy: '',
    date: new Date().toISOString().split('T')[0],
    splitType: 'equal' as SplitType,
    myShare: '',
    partnerShare: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    document.title = 'Shared Finances | OurBalance';
  }, []);

  // Handle URL subroutes (/shared/expenses/new, /shared/settlements)
  useEffect(() => {
    if (location.pathname === ROUTES.SHARED_EXPENSES_NEW) {
      setShowModal(true);
    }
  }, [location.pathname]);

  const balance = useMemo(() => {
    if (!user || !userProfile?.partnerId) return { balance: 0, owes: null, amount: 0 };
    return calculateBalance(expenses, user.uid, userProfile.partnerId);
  }, [expenses, user, userProfile]);

  const unsettledExpenses = expenses.filter((e) => !e.isSettled);

  function openAddModal() {
    navigate(ROUTES.SHARED_EXPENSES_NEW);
  }

  function closeModal() {
    setShowModal(false);
    if (location.pathname !== ROUTES.SHARED) {
      navigate(ROUTES.SHARED);
    }
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!formData.description.trim()) errs.description = 'Deskripsi pengeluaran bersama wajib diisi';
    if (!formData.amount || Number(formData.amount) <= 0) errs.amount = 'Masukkan jumlah nominal yang valid';
    if (!formData.paidBy) errs.paidBy = 'Pilih pembayar';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleAdd() {
    if (!validate() || !coupleId || !user || !userProfile?.partnerId) return;
    setSaving(true);
    try {
      const amount = Number(formData.amount);
      const partnerId = userProfile.partnerId;

      let splits: SharedExpense['splits'] = [];
      if (formData.splitType === 'equal') {
        splits = [
          { userId: user.uid, amount: amount / 2, percentage: 50, isPaid: formData.paidBy === user.uid },
          { userId: partnerId, amount: amount / 2, percentage: 50, isPaid: formData.paidBy === partnerId },
        ];
      } else if (formData.splitType === 'custom') {
        const myAmt = Number(formData.myShare) || 0;
        const partnerAmt = Number(formData.partnerShare) || 0;
        splits = [
          { userId: user.uid, amount: myAmt, percentage: percentageOf(myAmt, amount), isPaid: formData.paidBy === user.uid },
          { userId: partnerId, amount: partnerAmt, percentage: percentageOf(partnerAmt, amount), isPaid: formData.paidBy === partnerId },
        ];
      } else {
        splits = [
          { userId: formData.paidBy, amount, percentage: 100, isPaid: true },
          { userId: formData.paidBy === user.uid ? partnerId : user.uid, amount: 0, percentage: 0, isPaid: false },
        ];
      }

      const payload: Record<string, any> = {
        coupleId,
        paidBy: formData.paidBy,
        categoryId: formData.categoryId,
        amount,
        description: formData.description.trim(),
        date: Timestamp.fromDate(new Date(formData.date)),
        splitType: formData.splitType,
        splits,
        isSettled: false,
      };
      if (formData.notes && formData.notes.trim()) {
        payload.notes = formData.notes.trim();
      }

      await addSharedExpense(payload as any);

      success('Pengeluaran bersama berhasil ditambahkan');
      closeModal();
      setFormData({
        description: '', amount: '', categoryId: '', paidBy: '',
        date: new Date().toISOString().split('T')[0], splitType: 'equal',
        myShare: '', partnerShare: '', notes: '',
      });
    } catch {
      showError('Gagal menambah pengeluaran bersama');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingExp) return;
    setDeleting(true);
    try {
      await deleteSharedExpense(deletingExp.id);
      success('Pengeluaran bersama berhasil dihapus');
      setDeletingExp(null);
    } catch {
      showError('Gagal menghapus pengeluaran');
    } finally {
      setDeleting(false);
    }
  }

  async function handleSettle() {
    if (!user || !userProfile?.partnerId || !coupleId) return;
    setSettling(true);
    try {
      const from = balance.owes === user.uid ? user.uid : userProfile.partnerId;
      const to = balance.owes === user.uid ? userProfile.partnerId : user.uid;
      await settleExpense(coupleId, from, to, balance.amount, 'Pelunasan Tagihan Bersama');
      success('Pelunasan berhasil dicatat');
      setShowSettleModal(false);
    } catch {
      showError('Gagal mencatat pelunasan');
    } finally {
      setSettling(false);
    }
  }

  const partnerName = partnerProfile?.displayName || 'Pasangan';
  const myName = userProfile?.displayName || 'Anda';
  const isPartnerLinked = !!userProfile?.partnerId;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Keuangan Pasangan (Shared)</h1>
          <p className="page-subtitle">Pengeluaran bersama & pelunasan tagihan</p>
        </div>
        {isPartnerLinked && (
          <Button variant="primary" size="sm" onClick={openAddModal} leftIcon={<Plus size={15} />} id="add-shared-expense-btn">
            Tambah Pengeluaran
          </Button>
        )}
      </div>

      {!isPartnerLinked ? (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <Users className="empty-state-icon" />
          <p className="empty-state-title">Belum terhubung dengan pasangan</p>
          <p className="empty-state-description">Hubungkan akun pasangan di menu Pengaturan untuk menggunakan fitur pengeluaran bersama ini</p>
          <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.SETTINGS_COUPLE)} style={{ marginTop: 8 }}>
            Ke Pengaturan Pasangan
          </Button>
        </div>
      ) : (
        <>
          {/* Balance Summary */}
          <div className="balance-summary" style={{ marginBottom: 20 }}>
            <div className="balance-summary-icon">
              <Users size={24} />
            </div>
            <div style={{ flex: 1 }}>
              {balance.amount === 0 ? (
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Semua tagihan telah lunas!</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                    Tidak ada tunggakan antara Anda dan {partnerName}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                    {balance.owes === user?.uid
                      ? `Anda memiliki hutang ke ${partnerName}`
                      : `${partnerName} memiliki hutang ke Anda`}
                    {' '}
                    <span style={{ color: 'var(--color-primary-600)' }}>{formatCurrency(balance.amount)}</span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                    Dihitung dari pengeluaran bersama yang belum dilunasi
                  </div>
                </div>
              )}
            </div>
            {balance.amount > 0 && (
              <Button variant="primary" size="sm" onClick={() => setShowSettleModal(true)}>
                Lunasi Tagihan
              </Button>
            )}
          </div>

          {/* Unsettled Expenses */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
              Belum Dilunasi ({unsettledExpenses.length})
            </div>
            {loading ? (
              <div className="card">
                {[1, 2].map((i) => (
                  <div key={i} style={{ padding: '16px', borderBottom: i < 2 ? '1px solid var(--color-border-light)' : 'none' }}>
                    <div className="skeleton" style={{ width: '60%', height: 14, marginBottom: 8 }} />
                    <div className="skeleton" style={{ width: '40%', height: 12 }} />
                  </div>
                ))}
              </div>
            ) : unsettledExpenses.length === 0 ? (
              <div className="card">
                <div className="empty-state" style={{ padding: '32px' }}>
                  <CheckCircle className="empty-state-icon" style={{ color: 'var(--color-success)' }} />
                  <p className="empty-state-title">Semua lunas!</p>
                  <p className="empty-state-description">Belum ada pengeluaran bersama baru yang perlu dilunasi</p>
                </div>
              </div>
            ) : (
              <div className="card">
                {unsettledExpenses.map((exp) => (
                  <SharedExpenseRow
                    key={exp.id}
                    expense={exp}
                    categories={categories}
                    userId={user!.uid}
                    partnerName={partnerName}
                    myName={myName}
                    onDelete={() => setDeletingExp(exp)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Recent Settlements */}
          {settlements.length > 0 && (
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
                Riwayat Pelunasan
              </div>
              <div className="card">
                {settlements.slice(0, 5).map((s) => (
                  <div key={s.id} className="transaction-item">
                    <div className="transaction-icon income">
                      <CheckCircle size={16} />
                    </div>
                    <div className="transaction-info">
                      <div className="transaction-desc">{s.description || 'Pelunasan Tagihan'}</div>
                      <div className="transaction-meta">
                        {s.settledAt instanceof Timestamp ? formatDate(s.settledAt.toDate()) : '—'}
                      </div>
                    </div>
                    <div className="transaction-amount amount-positive">
                      {formatCurrency(s.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Expense Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title="Tambah Pengeluaran Bersama"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={closeModal} disabled={saving}>Batal</Button>
            <Button variant="primary" onClick={handleAdd} loading={saving}>Simpan</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Deskripsi Transaksi"
            placeholder="Contoh: Belanja Bulanan, Tagihan Listrik, Makan Bersama"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            error={formErrors.description}
            required
          />
          <Input
            type="number"
            label="Total Nominal (IDR)"
            placeholder="0"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            error={formErrors.amount}
            required
          />
          <Select
            label="Kategori"
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            options={[
              { value: '', label: 'Pilih Kategori' },
              ...categories.filter((c) => c.type === 'expense').map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
          <Select
            label="Dibayar Oleh"
            value={formData.paidBy}
            onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })}
            error={formErrors.paidBy}
            options={[
              { value: '', label: 'Pilih Siapa yang Membayar' },
              { value: user?.uid || '', label: `${myName} (Saya)` },
              ...(userProfile?.partnerId ? [{ value: userProfile.partnerId, label: partnerName }] : []),
            ]}
            required
          />
          <Select
            label="Skema Pembagian"
            value={formData.splitType}
            onChange={(e) => setFormData({ ...formData, splitType: e.target.value as SplitType })}
            options={[
              { value: 'equal', label: 'Bagi Rata (50/50)' },
              { value: 'custom', label: 'Nominal Custom' },
              { value: 'full', label: 'Ditanggung Sepenuhnya oleh Pembayar' },
            ]}
          />
          {formData.splitType === 'custom' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input
                type="number"
                label={`Bagian ${myName} (IDR)`}
                value={formData.myShare}
                onChange={(e) => setFormData({ ...formData, myShare: e.target.value })}
                min="0"
              />
              <Input
                type="number"
                label={`Bagian ${partnerName} (IDR)`}
                value={formData.partnerShare}
                onChange={(e) => setFormData({ ...formData, partnerShare: e.target.value })}
                min="0"
              />
            </div>
          )}
          <Input
            type="date"
            label="Tanggal"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
          <Input
            label="Catatan (Opsional)"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Keterangan tambahan..."
          />
        </div>
      </Modal>

      {/* Settle Confirm */}
      <Modal
        isOpen={showSettleModal}
        onClose={() => setShowSettleModal(false)}
        title="Konfirmasi Pelunasan"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowSettleModal(false)} disabled={settling}>Batal</Button>
            <Button variant="primary" onClick={handleSettle} loading={settling}>Proses Pelunasan</Button>
          </>
        }
      >
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          Catat pelunasan tagihan sebesar <strong>{formatCurrency(balance.amount)}</strong>?
          Tindakan ini akan menandai tagihan berjalan sebagai lunas.
        </p>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingExp}
        onClose={() => setDeletingExp(null)}
        onConfirm={handleDelete}
        title="Hapus Pengeluaran Bersama"
        message={`Hapus pengeluaran "${deletingExp?.description}"?`}
        confirmText="Hapus"
        loading={deleting}
      />
    </div>
  );
}

function SharedExpenseRow({
  expense, categories, userId, partnerName, myName, onDelete
}: {
  expense: SharedExpense;
  categories: Category[];
  userId: string;
  partnerName: string;
  myName: string;
  onDelete: () => void;
}) {
  const cat = categories.find((c) => c.id === expense.categoryId);
  const date = expense.date instanceof Timestamp ? expense.date.toDate() : new Date();
  const mySplit = expense.splits.find((s) => s.userId === userId);
  const paidByMe = expense.paidBy === userId;

  return (
    <div className="transaction-item">
      <div className={`transaction-icon ${paidByMe ? 'income' : 'expense'}`}>
        <Users size={16} />
      </div>
      <div className="transaction-info">
        <div className="transaction-desc">{expense.description}</div>
        <div className="transaction-meta">
          {cat?.name || 'Umum'} · Dibayar oleh {paidByMe ? myName : partnerName} · {formatDate(date)}
        </div>
        {mySplit && (
          <div style={{ fontSize: '0.75rem', color: 'var(--color-primary-600)', marginTop: 2 }}>
            Bagian Anda: {formatCurrency(mySplit.amount)}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{formatCurrency(expense.amount)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {expense.splitType === 'equal' ? '50/50' : expense.splitType}
          </div>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          style={{ padding: '4px 6px', color: 'var(--color-danger)' }}
          onClick={onDelete}
          aria-label="Hapus pengeluaran"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
