import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Plus, Target, Edit2, Trash2, PlusCircle, Calendar } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '../../../contexts/AuthContext';
import { useCouple } from '../../settings/hooks/useCouple';
import { useGoals } from '../hooks/useGoals';
import { addGoal, updateGoal, deleteGoal, addContribution, subscribeContributions } from '../services/goalService';
import { formatCurrency, formatDate, percentageOf } from '../../../utils/format';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { useToast } from '../../../contexts/ToastContext';
import { ROUTES } from '../../../constants/routes';
import type { Goal, GoalType, GoalStatus, GoalContribution } from '../../../types';

interface GoalFormData {
  name: string;
  description: string;
  targetAmount: string;
  currentAmount: string;
  deadline: string;
  type: GoalType;
  status: GoalStatus;
}

const defaultForm: GoalFormData = {
  name: '',
  description: '',
  targetAmount: '',
  currentAmount: '0',
  deadline: '',
  type: 'personal',
  status: 'active',
};

function ContributionPanel({ goal, userId }: { goal: Goal; userId: string; onClose: () => void }) {
  const { success, error: showError } = useToast();
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [contributions, setContributions] = useState<GoalContribution[]>([]);

  useEffect(() => {
    const unsub = subscribeContributions(goal.id, setContributions);
    return unsub;
  }, [goal.id]);

  async function handleAdd() {
    if (!amount || Number(amount) <= 0) return;
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        goalId: goal.id,
        userId,
        amount: Number(amount),
        date: Timestamp.now(),
      };
      if (notes && notes.trim()) {
        payload.notes = notes.trim();
      }

      await addContribution(goal.id, payload as any);
      success('Tabungan berhasil ditambahkan');
      setAmount('');
      setNotes('');
    } catch {
      showError('Gagal menambah tabungan');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Input
          type="number"
          label="Jumlah Nominal Tabungan (IDR)"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="1"
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <Input
          label="Catatan (Opsional)"
          placeholder="Contoh: Tabungan gaji bulan ini"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <Button variant="primary" onClick={handleAdd} loading={saving} fullWidth>
        Tambah Tabungan
      </Button>

      {contributions.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
            Riwayat Setoran Tabungan
          </div>
          <div>
            {contributions.slice(0, 5).map((c) => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border-light)', fontSize: '0.875rem' }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{formatCurrency(c.amount)}</div>
                  {c.notes && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{c.notes}</div>}
                </div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                  {c.date instanceof Timestamp ? formatDate(c.date.toDate()) : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function GoalsPage() {
  const { user } = useAuth();
  const { coupleId } = useCouple();
  const { goals, loading } = useGoals(coupleId);
  const { success, error: showError } = useToast();

  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();

  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null);
  const [contributionGoal, setContributionGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState<GoalFormData>(defaultForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof GoalFormData, string>>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    document.title = 'Goals | OurBalance';
  }, []);

  // Handle URL sub-routes (/goals/new, /goals/:goalId/edit)
  useEffect(() => {
    if (location.pathname === ROUTES.GOALS_NEW) {
      setEditingGoal(null);
      setFormData(defaultForm);
      setFormErrors({});
      setShowModal(true);
    } else if (params.goalId && location.pathname.endsWith('/edit')) {
      const g = goals.find((item) => item.id === params.goalId);
      if (g) {
        setEditingGoal(g);
        setFormData({
          name: g.name,
          description: g.description || '',
          targetAmount: String(g.targetAmount),
          currentAmount: String(g.currentAmount),
          deadline: g.deadline ? (g.deadline as Timestamp).toDate().toISOString().split('T')[0] : '',
          type: g.type,
          status: g.status,
        });
        setFormErrors({});
        setShowModal(true);
      }
    }
  }, [location.pathname, params.goalId, goals]);

  const filtered = goals.filter((g) => filter === 'all' || g.status === filter);
  const activeCount = goals.filter((g) => g.status === 'active').length;
  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);

  function openAdd() {
    navigate(ROUTES.GOALS_NEW);
  }

  function openEdit(g: Goal) {
    navigate(ROUTES.GOAL_EDIT(g.id));
  }

  function closeModal() {
    setShowModal(false);
    if (location.pathname !== ROUTES.GOALS) {
      navigate(ROUTES.GOALS);
    }
  }

  function validate() {
    const errs: typeof formErrors = {};
    if (!formData.name.trim()) errs.name = 'Nama target impian wajib diisi';
    if (!formData.targetAmount || Number(formData.targetAmount) <= 0) errs.targetAmount = 'Masukkan nominal target yang valid';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate() || !coupleId || !user) return;
    setSaving(true);
    try {
      const data: Record<string, any> = {
        coupleId,
        name: formData.name.trim(),
        targetAmount: Number(formData.targetAmount),
        currentAmount: Number(formData.currentAmount) || 0,
        type: formData.type,
        status: formData.status,
      };

      if (formData.type === 'personal') {
        data.ownerId = user.uid;
      }
      if (formData.description && formData.description.trim()) {
        data.description = formData.description.trim();
      }
      if (formData.deadline) {
        data.deadline = Timestamp.fromDate(new Date(formData.deadline));
      }

      if (editingGoal) {
        await updateGoal(editingGoal.id, data as any);
        success('Target impian berhasil diperbarui');
      } else {
        await addGoal(data as any);
        success('Target impian berhasil dibuat');
      }
      closeModal();
    } catch {
      showError('Gagal menyimpan target impian');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingGoal) return;
    setDeleting(true);
    try {
      await deleteGoal(deletingGoal.id);
      success('Target impian berhasil dihapus');
      setDeletingGoal(null);
    } catch {
      showError('Gagal menghapus target impian');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Financial Goals</h1>
          <p className="page-subtitle">{activeCount} target aktif · Total terkumpul {formatCurrency(totalSaved)}</p>
        </div>
        <Button variant="primary" size="sm" onClick={openAdd} leftIcon={<Plus size={15} />} id="add-goal-btn">
          Target Baru
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        {(['all', 'active', 'completed'] as const).map((f) => (
          <button key={f} className={`tab-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'Semua' : f === 'active' ? 'Aktif' : 'Selesai'}
            {f !== 'all' && <span style={{ marginLeft: 6, fontSize: '0.75rem', opacity: 0.7 }}>
              ({goals.filter((g) => g.status === f).length})
            </span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card" style={{ padding: 20 }}>
              <div className="skeleton" style={{ width: '60%', height: 18, marginBottom: 12 }} />
              <div className="skeleton" style={{ width: '80%', height: 24, marginBottom: 12 }} />
              <div className="skeleton" style={{ width: '100%', height: 8, borderRadius: 999 }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <Target className="empty-state-icon" />
          <p className="empty-state-title">Belum ada target impian</p>
          <p className="empty-state-description">
            {filter !== 'all' ? `Tidak ada target dengan status ${filter}` : 'Buat target tabungan finansial bersama pasangan Anda'}
          </p>
          {filter === 'all' && (
            <Button variant="primary" size="sm" onClick={openAdd} style={{ marginTop: 8 }}>
              Target Baru
            </Button>
          )}
        </div>
      ) : (
        <div className="grid-2">
          {filtered.map((goal) => {
            const pct = percentageOf(goal.currentAmount, goal.targetAmount);
            const isCompleted = goal.status === 'completed' || pct >= 100;
            const deadline = goal.deadline ? (goal.deadline as Timestamp).toDate() : null;

            return (
              <div key={goal.id} className="goal-card animate-fade-in">
                <div className="goal-card-header">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span className={`goal-type-badge ${goal.type}`}>{goal.type === 'shared' ? 'Bersama' : 'Pribadi'}</span>
                      {isCompleted && <span className="badge badge-green">Tercapai</span>}
                    </div>
                    <div className="goal-name">{goal.name}</div>
                    {goal.description && (
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                        {goal.description}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '4px 6px' }}
                      onClick={() => openEdit(goal)}
                      aria-label="Edit target"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '4px 6px', color: 'var(--color-danger)' }}
                      onClick={() => setDeletingGoal(goal)}
                      aria-label="Hapus target"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="goal-amounts">
                  <span className="goal-current">{formatCurrency(goal.currentAmount)}</span>
                  <span className="goal-target">dari {formatCurrency(goal.targetAmount)}</span>
                </div>

                <div style={{ marginBottom: 8 }}>
                  <div className="progress-bar">
                    <div
                      className={`progress-bar-fill ${isCompleted ? 'success' : ''}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {deadline && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={12} />
                        {formatDate(deadline)}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: isCompleted ? 'var(--color-success)' : 'var(--color-primary-600)' }}>
                      {pct}%
                    </span>
                    {!isCompleted && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setContributionGoal(goal)}
                        leftIcon={<PlusCircle size={13} />}
                        id={`add-contribution-${goal.id}`}
                      >
                        Setor
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Goal Form Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingGoal ? 'Edit Target Impian' : 'Target Impian Baru'}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={closeModal} disabled={saving}>Batal</Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>
              {editingGoal ? 'Simpan Perubahan' : 'Buat Target'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Nama Target"
            placeholder="Contoh: Dana Darurat, Tabungan Liburan, Renovasi Rumah"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formErrors.name}
            required
          />
          <Input
            label="Deskripsi Singkat (Opsional)"
            placeholder="Catatan tambahan target..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              type="number"
              label="Nominal Target (IDR)"
              placeholder="0"
              value={formData.targetAmount}
              onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
              error={formErrors.targetAmount}
              required
              min="1"
            />
            <Input
              type="number"
              label="Saldo Terkumpul Awal (IDR)"
              placeholder="0"
              value={formData.currentAmount}
              onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
              min="0"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Select
              label="Kategori Kepemilikan"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as GoalType })}
              options={[
                { value: 'personal', label: 'Pribadi' },
                { value: 'shared', label: 'Bersama Pasangan' },
              ]}
            />
            <Select
              label="Status Target"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as GoalStatus })}
              options={[
                { value: 'active', label: 'Aktif' },
                { value: 'paused', label: 'Ditunda' },
                { value: 'completed', label: 'Selesai' },
              ]}
            />
          </div>
          <Input
            type="date"
            label="Target Tanggal Selesai (Opsional)"
            value={formData.deadline}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
          />
        </div>
      </Modal>

      {/* Contribution Modal */}
      <Modal
        isOpen={!!contributionGoal}
        onClose={() => setContributionGoal(null)}
        title={`Setor Tabungan ke "${contributionGoal?.name}"`}
        size="sm"
      >
        {contributionGoal && user && (
          <ContributionPanel
            goal={contributionGoal}
            userId={user.uid}
            onClose={() => setContributionGoal(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingGoal}
        onClose={() => setDeletingGoal(null)}
        onConfirm={handleDelete}
        title="Hapus Target Impian"
        message={`Apakah Anda yakin ingin menghapus target "${deletingGoal?.name}"? Seluruh riwayat setoran akan ikut terhapus.`}
        confirmText="Hapus"
        loading={deleting}
      />
    </div>
  );
}
