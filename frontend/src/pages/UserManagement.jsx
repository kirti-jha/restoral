import React, { useEffect, useState, useCallback } from 'react';
import api from '../lib/api';
import UserSearch from '../components/common/UserSearch';
import { useAuth } from '../context/AuthContext';
import { Plus, Filter, RefreshCw, X, Edit2, Trash2, LogIn, MoreVertical, Settings, Banknote, CheckCircle2 } from 'lucide-react';

const ROLE_OPTIONS = {
  ADMIN: ['SUPER', 'DISTRIBUTOR', 'RETAILER'],
  SUPER: ['DISTRIBUTOR', 'RETAILER'],
  DISTRIBUTOR: ['RETAILER'],
};

const ROLE_LABELS = {
  ADMIN: 'Admin',
  SUPER: 'Super Distributor',
  DISTRIBUTOR: 'Distributor',
  RETAILER: 'Retailer',
};

const EMPTY_CREATE_FORM = {
  email: '',
  password: '',
  role: 'RETAILER',
  ownerName: '',
  shopName: '',
  mobileNumber: '',
  fullAddress: '',
  state: '',
  pinCode: '',
  aadhaarNumber: '',
  parentId: '',
};

const buildEditForm = (user) => ({
  email: user?.email || '',
  ownerName: user?.profile?.ownerName || '',
  shopName: user?.profile?.shopName || '',
  mobileNumber: user?.profile?.mobileNumber || '',
  fullAddress: user?.profile?.fullAddress || '',
  state: user?.profile?.state || '',
  pinCode: user?.profile?.pinCode || '',
  aadhaarNumber: user?.profile?.aadhaarNumber || '',
});

const getAvailableRoles = (role) => ROLE_OPTIONS[role] || [];

const getDefaultRole = (role) => {
  const roles = getAvailableRoles(role);
  if (roles.includes('RETAILER')) return 'RETAILER';
  return roles[0] || '';
};

const formatSummaryPrimary = (summary) => {
  if (!summary) return '-';
  return summary.ownerName || summary.shopName || summary.email;
};

const formatChargeValue = (type, value) => {
  if (type === 'PERCENTAGE') return `${Number(value || 0).toFixed(2)}%`;
  return `₹ ${Number(value || 0).toFixed(2)}`;
};

const HierarchyStack = ({ user }) => (
  <div className="space-y-1 text-xs text-gray-500">
    <div className="flex items-center gap-1">
      <span className="font-medium text-gray-700">Parent:</span> 
      <span className="truncate max-w-[120px]">{formatSummaryPrimary(user?.createdBy) || '-'}</span>
    </div>
  </div>
);

const CreateUserView = ({ onBack, onUserCreated }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    ...EMPTY_CREATE_FORM,
    role: getDefaultRole(user?.role),
    parentId: user?.id || '',
  });
  const [selectedParent, setSelectedParent] = useState(user);

  const availableRoles = getAvailableRoles(user?.role);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => data.append(key, value));

    try {
      const res = await api.post('/users', data);
      if (res.data.success) {
        onUserCreated();
        onBack();
      } else {
        setError(res.data.message || 'Failed to create user');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
      <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Create New User</h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Register a new partner in your network</p>
        </div>
        <button onClick={onBack} className="btn-premium btn-premium-secondary px-6">
          <X size={18} className="mr-2" /> Back to List
        </button>
      </div>

      <div className="p-10">
        <form id="create-user-form" onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-12">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700 animate-shake">
              <Plus size={20} className="rotate-45" />
              <span className="text-sm font-bold uppercase">{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div className="space-y-8">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-xs">01</div>
                <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Account Settings</h3>
              </div>
              
              <div className="form-group">
                <label className="form-label text-[10px]">ASSIGNED ROLE</label>
                <select 
                  name="role" value={formData.role} onChange={handleInputChange} 
                  className="form-input form-select h-12 font-bold" required
                >
                  {availableRoles.map(r => <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label text-[10px]">PARENT / UPLINE</label>
                {selectedParent ? (
                  <div className="flex items-center justify-between p-4 bg-primary-light/50 border border-primary/20 rounded-xl animate-fade-in">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-primary">
                        <LogIn size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{selectedParent.profile?.ownerName || selectedParent.email}</div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase">{selectedParent.role}</div>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => { setSelectedParent(null); setFormData({ ...formData, parentId: '' }); }} 
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <UserSearch 
                    onSelect={(u) => {
                      setSelectedParent(u);
                      setFormData({ ...formData, parentId: u?.id || '' });
                    }} 
                    placeholder="Search parent by name or email..."
                  />
                )}
                <p className="text-[10px] text-gray-400 mt-1">Search and select the partner this user will be under.</p>
              </div>

              <div className="form-group">
                <label className="form-label text-[10px]">EMAIL ADDRESS</label>
                <input 
                  type="email" name="email" required 
                  value={formData.email} onChange={handleInputChange} 
                  className="form-input h-12 font-bold" placeholder="user@example.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label text-[10px]">PASSWORD</label>
                <input 
                  type="password" name="password" required minLength="6"
                  value={formData.password} onChange={handleInputChange} 
                  className="form-input h-12 font-bold" placeholder="Min 6 characters"
                />
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-xs">02</div>
                <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Business Profile</h3>
              </div>

              <div className="form-group">
                <label className="form-label text-[10px]">OWNER FULL NAME</label>
                <input 
                  type="text" name="ownerName" required 
                  value={formData.ownerName} onChange={handleInputChange} 
                  className="form-input h-12 font-bold" placeholder="e.g. John Doe"
                />
              </div>

              <div className="form-group">
                <label className="form-label text-[10px]">SHOP / BUSINESS NAME</label>
                <input 
                  type="text" name="shopName" required 
                  value={formData.shopName} onChange={handleInputChange} 
                  className="form-input h-12 font-bold" placeholder="e.g. Abhee Enterprises"
                />
              </div>

              <div className="form-group">
                <label className="form-label text-[10px]">MOBILE NUMBER</label>
                <input 
                  type="tel" name="mobileNumber" required minLength="10" maxLength="10" 
                  value={formData.mobileNumber} onChange={handleInputChange} 
                  className="form-input h-12 font-bold" placeholder="10-digit number"
                />
              </div>
            </div>
          </div>

          <div className="space-y-8 pt-8">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-xs">03</div>
              <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Business Address</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="form-group md:col-span-1">
                <label className="form-label text-[10px]">FULL ADDRESS</label>
                <input 
                  type="text" name="fullAddress" required 
                  value={formData.fullAddress} onChange={handleInputChange} 
                  className="form-input h-12 font-bold" placeholder="House/Shop No, Area..."
                />
              </div>
              <div className="form-group">
                <label className="form-label text-[10px]">STATE</label>
                <input 
                  type="text" name="state" required 
                  value={formData.state} onChange={handleInputChange} 
                  className="form-input h-12 font-bold" placeholder="e.g. Delhi"
                />
              </div>
              <div className="form-group">
                <label className="form-label text-[10px]">PIN CODE</label>
                <input 
                  type="text" name="pinCode" required 
                  value={formData.pinCode} onChange={handleInputChange} 
                  className="form-input h-12 font-bold" placeholder="6-digit PIN"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-10 border-t border-gray-50">
            <button 
              type="button" onClick={onBack} 
              className="btn-premium btn-premium-secondary px-10 h-14" 
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="btn-premium btn-premium-primary min-w-[240px] h-14 shadow-xl" 
              disabled={loading}
            >
              {loading ? <RefreshCw className="animate-spin" size={20} /> : 'Create User Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditUserForm = ({ user, onCancel, onUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState(buildEditForm(user));

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.patch(`/users/${user.id}`, formData);
      if (res.data.success) {
        onUpdated();
        onCancel();
      } else {
        setError(res.data.message || 'Failed to update user');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-blue-50/30 rounded-2xl border border-blue-100 space-y-6 animate-slide-down">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-blue-900 uppercase tracking-widest">Edit User Profile: {user.email}</h3>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
      </div>
      
      {error && <div className="text-xs text-red-600 font-bold">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="form-group">
          <label className="form-label text-[10px]">OWNER FULL NAME</label>
          <input 
            type="text" name="ownerName" required 
            value={formData.ownerName} onChange={handleInputChange} 
            className="form-input h-10 font-bold"
          />
        </div>
        <div className="form-group">
          <label className="form-label text-[10px]">SHOP NAME</label>
          <input 
            type="text" name="shopName" required 
            value={formData.shopName} onChange={handleInputChange} 
            className="form-input h-10 font-bold"
          />
        </div>
        <div className="form-group">
          <label className="form-label text-[10px]">MOBILE NUMBER</label>
          <input 
            type="tel" name="mobileNumber" required 
            value={formData.mobileNumber} onChange={handleInputChange} 
            className="form-input h-10 font-bold"
          />
        </div>
        <div className="form-group">
          <label className="form-label text-[10px]">STATE</label>
          <input 
            type="text" name="state" required 
            value={formData.state} onChange={handleInputChange} 
            className="form-input h-10 font-bold"
          />
        </div>
      </div>
      
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="btn-premium btn-premium-secondary py-2 text-[10px]">Cancel</button>
        <button type="submit" disabled={loading} className="btn-premium btn-premium-primary py-2 px-6 text-[10px]">
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </div>
    </form>
  );
};

const UserChargesForm = ({ targetUser, onCancel }) => {
  const [overrides, setOverrides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    serviceType: 'PAYOUT',
    commissionType: 'FLAT',
    commissionValue: '',
    minAmount: '',
    maxAmount: '',
    isActive: true,
  });

  const fetchOverrides = async () => {
    if (!targetUser) return;
    setLoading(true);
    try {
      const { data } = await api.get('/commissions/overrides');
      if (data.success) {
        setOverrides(data.overrides.filter(o => o.targetUserId === targetUser.id));
      }
    } catch (err) {
      setError('Failed to load charges');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOverrides();
  }, [targetUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const payload = {
      ...formData,
      targetUserId: targetUser.id,
      id: editingId,
      maxAmount: formData.maxAmount === '' ? null : formData.maxAmount
    };

    try {
      if (editingId) {
        await api.put('/commissions/overrides', payload);
      } else {
        await api.post('/commissions/overrides', payload);
      }
      fetchOverrides();
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save charge');
    }
  };

  const resetForm = () => {
    setFormData({
      serviceType: 'PAYOUT',
      commissionType: 'FLAT',
      commissionValue: '',
      minAmount: '',
      maxAmount: '',
      isActive: true,
    });
    setEditingId(null);
  };

  return (
    <div className="p-6 bg-emerald-50/30 rounded-2xl border border-emerald-100 space-y-6 animate-slide-down">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-emerald-900 uppercase tracking-widest">Custom Charges: {targetUser.profile?.ownerName || targetUser.email}</h3>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active Overrides</p>
          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
            {overrides.length === 0 ? (
              <div className="text-[10px] text-gray-400 font-bold italic">No custom charges set.</div>
            ) : (
              overrides.map(ov => (
                <div key={ov.id} className="flex items-center justify-between p-3 bg-white border border-emerald-100 rounded-xl">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-gray-900">{ov.serviceType}</span>
                      <span className="text-[9px] text-gray-500 font-bold">₹{ov.minAmount}-{ov.maxAmount || 'Max'}</span>
                    </div>
                    {ov.setBy && (
                      <div className="flex items-center gap-1">
                        <span className="text-[7px] text-gray-400 font-black tracking-tighter uppercase">Last Set By:</span>
                        <span className={`px-1 py-0.5 rounded text-[6px] font-black uppercase ${ov.setBy.role === 'ADMIN' ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                          {ov.setBy?.profile?.ownerName || ov.setBy?.role}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-emerald-600">{formatChargeValue(ov.commissionType, ov.commissionValue)}</span>
                    <button onClick={() => {
                      setEditingId(ov.id);
                      setFormData({
                        serviceType: ov.serviceType,
                        commissionType: ov.commissionType,
                        commissionValue: ov.commissionValue,
                        minAmount: ov.minAmount,
                        maxAmount: ov.maxAmount || '',
                        isActive: ov.isActive
                      });
                    }} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={12} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded-2xl border border-emerald-50">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{editingId ? 'Update' : 'Add New'} Slab</p>
          <div className="grid grid-cols-2 gap-4">
            <select value={formData.serviceType} onChange={e => setFormData({...formData, serviceType: e.target.value})} className="form-input h-10 text-[10px] font-bold">
              <option value="PAYOUT">Payout</option>
              <option value="FUND_REQUEST">Fund Request</option>
            </select>
            <select value={formData.commissionType} onChange={e => setFormData({...formData, commissionType: e.target.value})} className="form-input h-10 text-[10px] font-bold">
              <option value="FLAT">Flat (₹)</option>
              <option value="PERCENTAGE">Percentage (%)</option>
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input type="text" placeholder="Min" value={formData.minAmount} onChange={e => setFormData({...formData, minAmount: e.target.value})} className="form-input h-10 text-[10px] font-bold" />
            <input type="text" placeholder="Max" value={formData.maxAmount} onChange={e => setFormData({...formData, maxAmount: e.target.value})} className="form-input h-10 text-[10px] font-bold" />
            <input type="text" placeholder="Value" value={formData.commissionValue} onChange={e => setFormData({...formData, commissionValue: e.target.value})} className="form-input h-10 text-[10px] font-bold" />
          </div>
          <button type="submit" className="btn-premium btn-premium-primary w-full py-2 text-[10px] tracking-widest">SAVE CHARGE</button>
        </form>
      </div>
    </div>
  );
};

const WalletHoldForm = ({ user, onCancel, onUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [minimumHold, setMinimumHold] = useState(user?.wallet?.minimumHold || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.patch(`/users/${user.id}/wallet-hold`, { minimumHold });
      if (res.data.success) {
        onUpdated();
        onCancel();
      } else {
        setError(res.data.message || 'Failed to update hold');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-orange-50/30 rounded-2xl border border-orange-100 space-y-6 animate-slide-down">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-orange-900 uppercase tracking-widest">Wallet Control: {user.profile?.ownerName || user.email}</h3>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-orange-50">
             <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
               <Banknote size={24} />
             </div>
             <div>
                <p className="text-[10px] font-black text-gray-400 uppercase">Current Balance</p>
                <p className="text-xl font-black text-gray-900">₹{Number(user.wallet?.balance || 0).toFixed(2)}</p>
             </div>
          </div>
          <div className="p-4 bg-white/50 rounded-2xl border border-orange-50 space-y-2">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">User Details</p>
            <div className="grid grid-cols-2 gap-4">
               <div><p className="text-[9px] font-bold text-gray-400">Mobile</p><p className="text-[11px] font-bold">{user.profile?.mobileNumber}</p></div>
               <div><p className="text-[9px] font-bold text-gray-400">Shop</p><p className="text-[11px] font-bold">{user.profile?.shopName}</p></div>
               <div className="col-span-2"><p className="text-[9px] font-bold text-gray-400">Address</p><p className="text-[11px] font-bold truncate">{user.profile?.fullAddress}</p></div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="form-group">
            <label className="form-label text-[10px]">MINIMUM HOLD AMOUNT (₹)</label>
            <input 
              type="text" value={minimumHold} 
              onChange={e => setMinimumHold(e.target.value)} 
              className="form-input h-14 text-2xl font-black text-orange-600 focus:ring-orange-500"
            />
            <p className="text-[10px] text-gray-500 font-bold mt-2 italic">User cannot use funds below this limit.</p>
          </div>
          <button type="submit" disabled={loading} className="btn-premium btn-premium-primary w-full py-4 tracking-widest text-[11px] font-black shadow-xl">
            {loading ? 'Processing...' : 'APPLY WALLET HOLD'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default function UserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState('list'); // 'list' or 'create'
  const [activeAction, setActiveAction] = useState(null); // { userId, type: 'edit' | 'charges' | 'hold' }

  const canManageUsers = ['ADMIN', 'SUPER', 'DISTRIBUTOR'].includes(user.role);
  const canImpersonate = ['ADMIN', 'SUPER', 'DISTRIBUTOR'].includes(user.role);
  const filterRoles = getAvailableRoles(user.role);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (filterRole) params.append('role', filterRole);
      if (filterStatus) params.append('status', filterStatus);
      if (searchQuery) params.append('search', searchQuery);

      const { data } = await api.get(`/users?${params.toString()}`);
      if (data.success) {
        setUsers(data.users);
        setTotalPages(Math.ceil(data.total / 10) || 1);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [page, filterRole, filterStatus, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 500); 
    return () => clearTimeout(timer);
  }, [page, filterRole, filterStatus, searchQuery]);

  const toggleStatus = useCallback(async (userId) => {
    if (!window.confirm('Toggle user status?')) return;
    try {
      const { data } = await api.patch(`/users/${userId}/toggle`);
      if (data.success) {
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  }, [fetchUsers]);

  const loginAsUser = useCallback(async (userId) => {
    try {
      const newTab = window.open('about:blank', '_blank');
      if (!newTab) {
        alert('Popup blocked by browser. Please allow popups for this site and try again.');
        return;
      }

      const res = await api.post(`/users/${userId}/login-as`);
      const data = res.data;
      
      if (data.success && data.token) {
        const loginAsUrl = `${window.location.origin}/?impersonationToken=${encodeURIComponent(data.token)}`;
        newTab.location.href = loginAsUrl;
      } else {
        newTab.close();
        alert('Failed to obtain impersonation token');
      }
    } catch (err) {
      alert('Login As failed');
    }
  }, []);

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'ADMIN': return 'bg-blue-50 text-blue-600 border border-blue-100';
      case 'SUPER': return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
      case 'DISTRIBUTOR': return 'bg-purple-50 text-purple-600 border border-purple-100';
      case 'RETAILER': return 'bg-gray-50 text-gray-600 border border-gray-100';
      default: return 'bg-gray-50 text-gray-400';
    }
  };

  if (view === 'create') {
    return (
      <div className="pb-20">
        <CreateUserView onBack={() => setView('list')} onUserCreated={fetchUsers} />
      </div>
    );
  }

  return (
    <div className="flex-col gap-6 pb-20">
      <div className="flex justify-between items-center mb-8 animate-slide-up">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">USER MANAGEMENT</h1>
          <p className="text-gray-400 font-bold mt-1 uppercase text-xs tracking-widest">Manage your full downline network</p>
        </div>
        {canManageUsers && (
          <button onClick={() => setView('create')} className="btn-premium btn-premium-primary flex items-center justify-center gap-3 px-8 py-4 shadow-xl">
            <Plus size={20} />
            <span className="tracking-widest">ADD NEW USER</span>
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-3xl shadow-sm border border-gray-100 mb-8 animate-slide-up">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-400 ml-2" />
          <select
            value={filterRole}
            onChange={(e) => { setFilterRole(e.target.value); setPage(1); }}
            className="form-input form-select py-2 h-12 min-w-[160px] font-bold text-xs"
          >
            <option value="">ALL ROLES</option>
            {filterRoles.map((role) => (
              <option key={role} value={role}>{ROLE_LABELS[role] || role}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="form-input form-select py-2 h-12 min-w-[160px] font-bold text-xs"
          >
            <option value="">ALL STATUS</option>
            <option value="active">ACTIVE ONLY</option>
            <option value="inactive">INACTIVE ONLY</option>
          </select>
        </div>
        
        <div className="flex-1 min-w-[300px]">
          <UserSearch 
            onSelect={(u) => { setSearchQuery(u ? u.email : ''); setPage(1); }}
            onQueryChange={(q) => { setSearchQuery(q); setPage(1); }}
            placeholder="Search by name, email or mobile..."
            className="w-full"
          />
        </div>

        <button onClick={fetchUsers} disabled={loading} className="btn-premium btn-premium-secondary h-12 px-6">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          <span className="hidden md:inline ml-2 tracking-widest text-[10px] font-black uppercase">Refresh</span>
        </button>
      </div>

      <div className="glass-panel overflow-hidden border border-gray-100 shadow-sm rounded-3xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">ID</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">User Details</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Hierarchy</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Wallet</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="7" className="p-20 text-center"><RefreshCw className="animate-spin text-primary mx-auto" size={32} /></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="7" className="p-20 text-center text-gray-400 font-bold uppercase text-xs tracking-widest">No users found</td></tr>
              ) : (
                users.map((managedUser, index) => {
                  const serialId = `abv${String((page - 1) * 10 + index + 1).padStart(3, '0')}`;
                  const isExpanding = activeAction?.userId === managedUser.id;

                  return (
                    <React.Fragment key={managedUser.id}>
                      <tr className={`${!managedUser.isActive ? 'opacity-60 bg-gray-50/50' : 'hover:bg-gray-50/30'} transition-all group`}>
                        <td className="p-6">
                          <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-1 rounded-lg border border-primary/10">
                            {serialId}
                          </span>
                        </td>
                        <td className="p-6">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-black text-gray-900 tracking-tight text-sm uppercase">{managedUser.profile?.ownerName || 'N/A'}</span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{managedUser.email}</span>
                            <span className="text-[10px] text-gray-500 font-black">{managedUser.profile?.mobileNumber || 'No Mobile'}</span>
                          </div>
                        </td>
                        <td className="p-6">
                          <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getRoleBadgeClass(managedUser.role)}`}>
                            {ROLE_LABELS[managedUser.role] || managedUser.role}
                          </span>
                        </td>
                        <td className="p-6">
                          <HierarchyStack user={managedUser} />
                        </td>
                        <td className="p-6">
                          <div className="flex flex-col">
                            <div className="text-sm font-black text-emerald-600 tracking-tight">₹{Number(managedUser.wallet?.balance || 0).toFixed(2)}</div>
                            {Number(managedUser.wallet?.minimumHold || 0) > 0 && (
                              <div className="text-[9px] font-black text-orange-600 flex items-center gap-0.5 mt-0.5">
                                <Banknote size={10} /> HOLD: ₹{Number(managedUser.wallet.minimumHold).toFixed(0)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-6 text-center">
                          <button 
                            onClick={() => toggleStatus(managedUser.id)}
                            className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ${
                              managedUser.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
                            }`}
                          >
                            {managedUser.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center justify-end gap-2">
                             <button 
                                onClick={() => setActiveAction(isExpanding && activeAction.type === 'edit' ? null : { userId: managedUser.id, type: 'edit' })}
                                className={`p-2 rounded-xl border transition-all ${isExpanding && activeAction.type === 'edit' ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white text-gray-400 hover:text-blue-600 hover:border-blue-100'}`}
                                title="Edit User"
                             >
                                <Edit2 size={16} />
                             </button>
                             <button 
                                onClick={() => setActiveAction(isExpanding && activeAction.type === 'charges' ? null : { userId: managedUser.id, type: 'charges' })}
                                className={`p-2 rounded-xl border transition-all ${isExpanding && activeAction.type === 'charges' ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg' : 'bg-white text-gray-400 hover:text-emerald-600 hover:border-emerald-100'}`}
                                title="Edit Charges"
                             >
                                <Settings size={16} />
                             </button>
                             <button 
                                onClick={() => setActiveAction(isExpanding && activeAction.type === 'hold' ? null : { userId: managedUser.id, type: 'hold' })}
                                className={`p-2 rounded-xl border transition-all ${isExpanding && activeAction.type === 'hold' ? 'bg-orange-600 text-white border-orange-600 shadow-lg' : 'bg-white text-gray-400 hover:text-orange-600 hover:border-orange-100'}`}
                                title="Wallet Hold"
                             >
                                <Banknote size={16} />
                             </button>
                             {canImpersonate && (
                               <button onClick={() => loginAsUser(managedUser.id)} className="p-2 bg-white text-gray-400 hover:text-indigo-600 hover:border-indigo-100 rounded-xl border transition-all" title="Login As">
                                 <LogIn size={16} />
                               </button>
                             )}
                          </div>
                        </td>
                      </tr>
                      {isExpanding && (
                        <tr>
                          <td colSpan="7" className="p-4 bg-gray-50/50">
                            <div className="animate-slide-down">
                               {activeAction.type === 'edit' && <EditUserForm user={managedUser} onCancel={() => setActiveAction(null)} onUpdated={fetchUsers} />}
                               {activeAction.type === 'charges' && <UserChargesForm targetUser={managedUser} onCancel={() => setActiveAction(null)} />}
                               {activeAction.type === 'hold' && <WalletHoldForm user={managedUser} onCancel={() => setActiveAction(null)} onUpdated={fetchUsers} />}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t border-gray-50 flex justify-between items-center text-[10px] font-black uppercase text-gray-400 tracking-widest">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-4">
            <button disabled={page === 1} onClick={() => setPage(v => v - 1)} className="px-6 py-2 border border-gray-100 rounded-xl disabled:opacity-30 hover:bg-gray-50 transition-all">PREV</button>
            <button disabled={page === totalPages} onClick={() => setPage(v => v + 1)} className="px-6 py-2 border border-gray-100 rounded-xl disabled:opacity-30 hover:bg-gray-50 transition-all">NEXT</button>
          </div>
        </div>
      </div>
    </div>
  );
}
