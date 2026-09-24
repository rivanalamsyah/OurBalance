import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, Users, Tag, Plus, Edit2, Trash2, LogOut, Link2 } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useCouple } from '../hooks/useCouple';
import { useCategories } from '../hooks/useCategories';
import { updateUserProfile, findUserByEmail, createCouple } from '../services/userService';
import { addCategory, updateCategory, deleteCategory } from '../services/categoryService';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { useToast } from '../../../contexts/ToastContext';
import { ROUTES } from '../../../constants/routes';
import type { Category, CategoryType, CategoryScope } from '../../../types';

type TabKey = 'profile' | 'partner' | 'categories';

export function SettingsPage() {
  const { user, userProfile, logout, refreshProfile } = useAuth();
  const { coupleId, partnerProfile, refresh } = useCouple();
  const { categories } = useCategories(coupleId);
  const { success, error: showError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<TabKey>('profile');

  // Handle subroutes
  useEffect(() => {
    document.title = 'Settings | OurBalance';

    if (location.pathname === ROUTES.SETTINGS_COUPLE) {
      setActiveTab('partner');
    } else if (location.pathname === ROUTES.SETTINGS_CATEGORIES) {
      setActiveTab('categories');
    } else if (location.pathname === ROUTES.SETTINGS_PROFILE) {
      setActiveTab('profile');
    }
  }, [location.pathname]);

  const [profileForm, setProfileForm] = useState({
    displayName: userProfile?.displayName || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [partnerEmail, setPartnerEmail] = useState('');
  const [linkingPartner, setLinkingPartner] = useState(false);

  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [deletingCat, setDeletingCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState({
    name: '',
    type: 'expense' as CategoryType,
    scope: 'both' as CategoryScope,
  });
  const [catErrors, setCatErrors] = useState<{ name?: string }>({});
  const [savingCat, setSavingCat] = useState(false);
  const [deletingCatLoading, setDeletingCatLoading] = useState(false);

  function handleTabChange(tab: TabKey) {
    setActiveTab(tab);
    if (tab === 'partner') navigate(ROUTES.SETTINGS_COUPLE);
    else if (tab === 'categories') navigate(ROUTES.SETTINGS_CATEGORIES);
    else navigate(ROUTES.SETTINGS_PROFILE);
  }

  async function handleSaveProfile() {
    if (!user) return;
    setSavingProfile(true);
    try {
      await updateUserProfile(user.uid, { displayName: profileForm.displayName.trim() });
      await refreshProfile();
      success('Profil berhasil diperbarui');
    } catch {
      showError('Gagal memperbarui profil');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleLinkPartner() {
    if (!partnerEmail.trim() || !user || !coupleId) return;
    setLinkingPartner(true);
    try {
      const partner = await findUserByEmail(partnerEmail.trim());
      if (!partner) {
        showError('Pengguna dengan email tersebut tidak ditemukan');
        return;
      }
      if (partner.uid === user.uid) {
        showError('Anda tidak bisa menghubungkan diri sendiri sebagai pasangan');
        return;
      }
      await createCouple(user.uid, partner.uid);
      await refresh();
      success(`Berhasil terhubung dengan ${partner.displayName || partner.email}`);
      setPartnerEmail('');
    } catch {
      showError('Gagal menghubungkan akun pasangan');
    } finally {
      setLinkingPartner(false);
    }
  }

  function openAddCat() {
    setEditingCat(null);
    setCatForm({ name: '', type: 'expense', scope: 'both' });
    setCatErrors({});
    setShowCatModal(true);
  }

  function openEditCat(cat: Category) {
    setEditingCat(cat);
    setCatForm({ name: cat.name, type: cat.type, scope: cat.scope });
    setCatErrors({});
    setShowCatModal(true);
  }

  async function handleSaveCat() {
    if (!catForm.name.trim()) {
      setCatErrors({ name: 'Nama kategori wajib diisi' });
      return;
    }
    if (!coupleId) return;
    setSavingCat(true);
    try {
      if (editingCat) {
        await updateCategory(editingCat.id, { name: catForm.name.trim(), type: catForm.type, scope: catForm.scope });
        success('Kategori berhasil diperbarui');
      } else {
        await addCategory({ coupleId, name: catForm.name.trim(), type: catForm.type, scope: catForm.scope, isDefault: false });
        success('Kategori berhasil ditambahkan');
      }
      setShowCatModal(false);
    } catch {
      showError('Gagal menyimpan kategori');
    } finally {
      setSavingCat(false);
    }
  }

  async function handleDeleteCat() {
    if (!deletingCat) return;
    setDeletingCatLoading(true);
    try {
      await deleteCategory(deletingCat.id);
      success('Kategori berhasil dihapus');
      setDeletingCat(null);
    } catch {
      showError('Gagal menghapus kategori');
    } finally {
      setDeletingCatLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await logout();
      navigate(ROUTES.LOGIN);
    } catch {
      showError('Gagal keluar akun');
    }
  }

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const incomeCategories = categories.filter((c) => c.type === 'income');

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pengaturan Aplikasi</h1>
          <p className="page-subtitle">Kelola profil, koneksi pasangan, dan kategori transaksi</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 24 }}>
        {([
          { key: 'profile', label: 'Profil Saya', icon: <User size={15} /> },
          { key: 'partner', label: 'Pasangan', icon: <Users size={15} /> },
          { key: 'categories', label: 'Kategori', icon: <Tag size={15} /> },
        ] as const).map(({ key, label, icon }) => (
          <button
            key={key}
            className={`tab-btn ${activeTab === key ? 'active' : ''}`}
            onClick={() => handleTabChange(key)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div style={{ maxWidth: 480 }}>
          <div className="card">
            <div className="card-header">
              <h2 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Profil Pengguna</h2>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--color-primary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary-700)', overflow: 'hidden', flexShrink: 0 }}>
                  {(userProfile?.photoURL || user?.photoURL) ? (
                    <img src={userProfile?.photoURL || user?.photoURL || ''} alt={profileForm.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    (profileForm.displayName || user?.email || 'U')[0].toUpperCase()
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {profileForm.displayName || '—'}
                    {user?.providerData.some((p) => p.providerId === 'google.com') ? (
                      <span className="badge badge-blue">Google</span>
                    ) : (
                      <span className="badge badge-gray">Email & Password</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{user?.email}</div>
                </div>
              </div>
              <Input
                label="Nama Lengkap"
                value={profileForm.displayName}
                onChange={(e) => setProfileForm({ displayName: e.target.value })}
                placeholder="Nama Anda"
              />
              <Input
                label="Alamat Email"
                value={user?.email || ''}
                disabled
                helperText="Email utama tidak dapat diubah"
              />
              <Button variant="primary" onClick={handleSaveProfile} loading={savingProfile}>
                Simpan Perubahan
              </Button>
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-header">
              <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-danger)' }}>Keluar Akun</h2>
            </div>
            <div className="card-body">
              <Button variant="danger" onClick={handleLogout} leftIcon={<LogOut size={15} />}>
                Keluar dari OurBalance
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Partner Tab */}
      {activeTab === 'partner' && (
        <div style={{ maxWidth: 480 }}>
          {partnerProfile ? (
            <div className="card">
              <div className="card-header">
                <h2 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Pasangan Anda</h2>
                <span className="badge badge-green">Terhubung</span>
              </div>
              <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--color-primary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-primary-700)' }}>
                  {(partnerProfile.displayName || partnerProfile.email || 'P')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{partnerProfile.displayName}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{partnerProfile.email}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-header">
                <h2 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Hubungkan dengan Pasangan</h2>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                  Hubungkan akun pasangan untuk berbagi pencatatan pengeluaran, membuat target impian bersama, dan menghitung arus kas pasangan secara otomatis.
                </p>
                <Input
                  label="Alamat Email Pasangan"
                  type="email"
                  placeholder="pasangan@email.com"
                  value={partnerEmail}
                  onChange={(e) => setPartnerEmail(e.target.value)}
                />
                <Button
                  variant="primary"
                  onClick={handleLinkPartner}
                  loading={linkingPartner}
                  leftIcon={<Link2 size={15} />}
                >
                  Hubungkan Pasangan
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Button variant="primary" size="sm" onClick={openAddCat} leftIcon={<Plus size={15} />}>
              Tambah Kategori
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Expense Categories */}
            <div className="card">
              <div className="card-header">
                <h2 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Kategori Pengeluaran</h2>
              </div>
              <div>
                {expenseCategories.map((cat) => (
                  <div key={cat.id} className="transaction-item">
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{cat.name}</span>
                      <span className="badge badge-gray" style={{ marginLeft: 8 }}>{cat.scope === 'both' ? 'Semua' : cat.scope === 'shared' ? 'Shared' : 'Pribadi'}</span>
                      {cat.isDefault && <span className="badge badge-blue" style={{ marginLeft: 4 }}>Bawaan</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '4px 6px' }} onClick={() => openEditCat(cat)} aria-label="Edit kategori">
                        <Edit2 size={13} />
                      </button>
                      {!cat.isDefault && (
                        <button className="btn btn-ghost btn-sm" style={{ padding: '4px 6px', color: 'var(--color-danger)' }} onClick={() => setDeletingCat(cat)} aria-label="Hapus kategori">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {expenseCategories.length === 0 && (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    Belum ada kategori pengeluaran
                  </div>
                )}
              </div>
            </div>

            {/* Income Categories */}
            <div className="card">
              <div className="card-header">
                <h2 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Kategori Pemasukan</h2>
              </div>
              <div>
                {incomeCategories.map((cat) => (
                  <div key={cat.id} className="transaction-item">
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{cat.name}</span>
                      <span className="badge badge-gray" style={{ marginLeft: 8 }}>{cat.scope === 'both' ? 'Semua' : cat.scope === 'shared' ? 'Shared' : 'Pribadi'}</span>
                      {cat.isDefault && <span className="badge badge-blue" style={{ marginLeft: 4 }}>Bawaan</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '4px 6px' }} onClick={() => openEditCat(cat)} aria-label="Edit kategori">
                        <Edit2 size={13} />
                      </button>
                      {!cat.isDefault && (
                        <button className="btn btn-ghost btn-sm" style={{ padding: '4px 6px', color: 'var(--color-danger)' }} onClick={() => setDeletingCat(cat)} aria-label="Hapus kategori">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {incomeCategories.length === 0 && (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    Belum ada kategori pemasukan
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      <Modal
        isOpen={showCatModal}
        onClose={() => setShowCatModal(false)}
        title={editingCat ? 'Edit Kategori' : 'Tambah Kategori'}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCatModal(false)} disabled={savingCat}>Batal</Button>
            <Button variant="primary" onClick={handleSaveCat} loading={savingCat}>
              {editingCat ? 'Simpan' : 'Tambah Kategori'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Nama Kategori"
            value={catForm.name}
            onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
            error={catErrors.name}
            required
          />
          <Select
            label="Tipe Kategori"
            value={catForm.type}
            onChange={(e) => setCatForm({ ...catForm, type: e.target.value as CategoryType })}
            options={[
              { value: 'expense', label: 'Pengeluaran' },
              { value: 'income', label: 'Pemasukan' },
            ]}
          />
          <Select
            label="Cakupan (Scope)"
            value={catForm.scope}
            onChange={(e) => setCatForm({ ...catForm, scope: e.target.value as CategoryScope })}
            options={[
              { value: 'both', label: 'Semua (Pribadi & Bersama)' },
              { value: 'personal', label: 'Khusus Pribadi' },
              { value: 'shared', label: 'Khusus Pengeluaran Bersama' },
            ]}
          />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingCat}
        onClose={() => setDeletingCat(null)}
        onConfirm={handleDeleteCat}
        title="Hapus Kategori"
        message={`Apakah Anda yakin ingin menghapus kategori "${deletingCat?.name}"? Transaksi yang sudah ada tidak akan terpengaruh.`}
        confirmText="Hapus"
        loading={deletingCatLoading}
      />
    </div>
  );
}
