import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Plus, Wallet, Landmark, Smartphone, CreditCard, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useCouple } from '../../settings/hooks/useCouple';
import { useAccounts } from '../hooks/useAccounts';
import { addAccount, updateAccount, deleteAccount } from '../services/accountService';
import { formatCurrency } from '../../../utils/format';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { useToast } from '../../../contexts/ToastContext';
import { ROUTES } from '../../../constants/routes';
import type { Account, AccountType } from '../../../types';

const ACCOUNT_TYPES: { value: AccountType; label: string; icon: React.ReactNode }[] = [
  { value: 'cash', label: 'Tunai (Cash)', icon: <Wallet size={16} /> },
  { value: 'bank', label: 'Bank', icon: <Landmark size={16} /> },
  { value: 'e-wallet', label: 'E-Wallet', icon: <Smartphone size={16} /> },
  { value: 'credit', label: 'Kartu Kredit', icon: <CreditCard size={16} /> },
  { value: 'investment', label: 'Investasi', icon: <CreditCard size={16} /> },
  { value: 'other', label: 'Lainnya', icon: <Wallet size={16} /> },
];

interface FormData {
  name: string;
  type: AccountType;
  balance: string;
  isShared: boolean;
}

const defaultForm: FormData = {
  name: '',
  type: 'bank',
  balance: '0',
  isShared: false,
};

export function AccountsPage() {
  const { user } = useAuth();
  const { coupleId } = useCouple();
  const { accounts, loading } = useAccounts(coupleId);
  const { success, error: showError } = useToast();

  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();

  const [showModal, setShowModal] = useState(false);
  const [editingAcc, setEditingAcc] = useState<Account | null>(null);
  const [deletingAcc, setDeletingAcc] = useState<Account | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    document.title = 'Accounts | OurBalance';
  }, []);

  // Handle URL sub-routes (/accounts/new, /accounts/:accountId/edit)
  useEffect(() => {
    if (location.pathname === ROUTES.ACCOUNTS_NEW) {
      setEditingAcc(null);
      setFormData(defaultForm);
      setFormErrors({});
      setShowModal(true);
    } else if (params.accountId && location.pathname.endsWith('/edit')) {
      const acc = accounts.find((a) => a.id === params.accountId);
      if (acc) {
        setEditingAcc(acc);
        setFormData({
          name: acc.name,
          type: acc.type,
          balance: String(acc.balance),
          isShared: acc.isShared,
        });
        setFormErrors({});
        setShowModal(true);
      }
    }
  }, [location.pathname, params.accountId, accounts]);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  function openAdd() {
    navigate(ROUTES.ACCOUNTS_NEW);
  }

  function openEdit(acc: Account) {
    navigate(ROUTES.ACCOUNT_EDIT(acc.id));
  }

  function closeModal() {
    setShowModal(false);
    if (location.pathname !== ROUTES.ACCOUNTS) {
      navigate(ROUTES.ACCOUNTS);
    }
  }

  function validate(): boolean {
    const errs: typeof formErrors = {};
    if (!formData.name.trim()) errs.name = 'Nama rekening wajib diisi';
    if (isNaN(Number(formData.balance))) errs.balance = 'Nominal saldo tidak valid';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate() || !coupleId || !user) return;
    setSaving(true);
    try {
      const data = {
        userId: user.uid,
        coupleId,
        name: formData.name.trim(),
        type: formData.type,
        balance: Number(formData.balance),
        currency: 'IDR',
        isShared: formData.isShared,
      };

      if (editingAcc) {
        await updateAccount(editingAcc.id, data);
        success('Rekening berhasil diperbarui');
      } else {
        await addAccount(data);
        success('Rekening berhasil ditambahkan');
      }
      closeModal();
    } catch {
      showError('Gagal menyimpan rekening');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingAcc) return;
    setDeleting(true);
    try {
      await deleteAccount(deletingAcc.id);
      success('Rekening berhasil dihapus');
      setDeletingAcc(null);
    } catch {
      showError('Gagal menghapus rekening');
    } finally {
      setDeleting(false);
    }
  }

  const typeIcon = (type: AccountType) =>
    ACCOUNT_TYPES.find((t) => t.value === type)?.icon || <Wallet size={16} />;
  const typeLabel = (type: AccountType) =>
    ACCOUNT_TYPES.find((t) => t.value === type)?.label || type;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Rekening Keuangan</h1>
          <p className="page-subtitle">Total saldo gabungan: {formatCurrency(totalBalance)}</p>
        </div>
        <Button variant="primary" size="sm" onClick={openAdd} leftIcon={<Plus size={15} />} id="add-account-btn">
          Tambah Rekening
        </Button>
      </div>

      {loading ? (
        <div className="grid-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card" style={{ padding: 20 }}>
              <div className="skeleton" style={{ width: 80, height: 22, marginBottom: 16 }} />
              <div className="skeleton" style={{ width: '60%', height: 14, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: '80%', height: 28 }} />
            </div>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <Wallet className="empty-state-icon" />
          <p className="empty-state-title">Belum ada rekening</p>
          <p className="empty-state-description">Tambahkan uang tunai, rekening bank, atau e-wallet untuk mulai mencatat keuangan</p>
          <Button variant="primary" size="sm" onClick={openAdd} style={{ marginTop: 8 }}>
            Tambah Rekening
          </Button>
        </div>
      ) : (
        <div className="grid-auto">
          {accounts.map((acc) => (
            <div key={acc.id} className="account-card animate-fade-in">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div className="account-type-badge">
                  {typeIcon(acc.type)}
                  <span>{typeLabel(acc.type)}</span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '4px 6px' }}
                    onClick={() => openEdit(acc)}
                    aria-label={`Edit ${acc.name}`}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '4px 6px', color: 'var(--color-danger)' }}
                    onClick={() => setDeletingAcc(acc)}
                    aria-label={`Hapus ${acc.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="account-name">{acc.name}</div>
              <div className="account-balance">{formatCurrency(acc.balance)}</div>
              {acc.isShared && (
                <div style={{ marginTop: 8 }}>
                  <span className="badge badge-blue">Tersedia untuk Pasangan</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingAcc ? 'Edit Rekening' : 'Tambah Rekening'}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={closeModal} disabled={saving}>Batal</Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>
              {editingAcc ? 'Simpan Perubahan' : 'Tambah Rekening'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Nama Rekening"
            placeholder="Contoh: BCA Tabungan Utama"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formErrors.name}
            required
          />
          <Select
            label="Tipe Rekening"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as AccountType })}
            options={ACCOUNT_TYPES.map((t) => ({ value: t.value, label: t.label }))}
            required
          />
          <Input
            type="number"
            label="Saldo Awal (IDR)"
            placeholder="0"
            value={formData.balance}
            onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
            error={formErrors.balance}
            required
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem' }}>
            <input
              type="checkbox"
              checked={formData.isShared}
              onChange={(e) => setFormData({ ...formData, isShared: e.target.checked })}
            />
            <span>Rekening Bersama (Terlihat oleh pasangan)</span>
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingAcc}
        onClose={() => setDeletingAcc(null)}
        onConfirm={handleDelete}
        title="Hapus Rekening"
        message={`Apakah Anda yakin ingin menghapus rekening "${deletingAcc?.name}"?`}
        confirmText="Hapus"
        loading={deleting}
      />
    </div>
  );
}
