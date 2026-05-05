import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { 
  Edit2, Plus, Trash2, UserPlus, User, X, 
  RefreshCw, ArrowRightLeft, CreditCard, ShieldAlert 
} from 'lucide-react';
import UserSearch from '../components/common/UserSearch';

const MANAGER_ROLES = ['ADMIN', 'SUPER', 'DISTRIBUTOR'];
const ROLE_OPTIONS_BY_MANAGER = {
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

const SERVICE_OPTIONS = [
  { value: 'PAYOUT', label: 'Payout', icon: ArrowRightLeft },
  { value: 'FUND_REQUEST', label: 'Fund Request', icon: CreditCard },
];

const SERVICE_LABELS = {
  PAYOUT: 'Payout',
  FUND_REQUEST: 'Fund Request',
};

const COMMISSION_TYPE_OPTIONS = [
  { value: 'FLAT', label: 'Flat (₹)' },
  { value: 'PERCENTAGE', label: 'Percentage (%)' },
];

function formatAmount(value) {
  return `Rs ${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatCharge(type, value) {
  if (type === 'PERCENTAGE') return `${Number(value || 0).toFixed(2)}%`;
  return formatAmount(value);
}

function formatRange(minAmount, maxAmount) {
  return `${formatAmount(minAmount)} - ${maxAmount === null || maxAmount === undefined ? 'Max' : formatAmount(maxAmount)}`;
}

const ChargeForm = ({ initialData, onCancel, onSaved, context, isAdmin }) => {
  const [formData, setFormData] = useState({
    minAmount: initialData?.minAmount ?? '',
    maxAmount: initialData?.maxAmount ?? '',
    commissionValue: initialData?.commissionValue ?? '',
    commissionType: initialData?.commissionType || 'FLAT',
    isActive: initialData?.isActive ?? true,
    ...context
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...formData,
        id: initialData?.id,
        maxAmount: formData.maxAmount === '' ? null : formData.maxAmount,
      };
      
      const endpoint = context.targetUserId ? '/commissions/overrides' : '/commissions/slabs';
      const method = initialData?.id ? 'put' : 'post';
      
      await api[method](endpoint, payload);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    }
    setSaving(false);
  };

  const isReadOnly = !isAdmin;

  return (
    <form onSubmit={handleSubmit} className="p-8 bg-white rounded-3xl border border-gray-100 shadow-xl space-y-8 animate-slide-down">
      <div className="flex justify-between items-center border-b border-gray-50 pb-4">
        <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">{initialData ? 'Update' : 'Initialize New'} Commission Slab</h4>
        <button type="button" onClick={onCancel} className="p-2 hover:bg-gray-50 rounded-full text-gray-400 transition-colors"><X size={20} /></button>
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-[10px] font-black uppercase rounded-xl flex items-center gap-3">
          <ShieldAlert size={14} /> {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="form-group mb-0">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 block">Minimum Amount (₹)</label>
          <input 
            type="text" value={formData.minAmount} 
            onChange={e => !isReadOnly && setFormData({...formData, minAmount: e.target.value})} 
            className={`form-input h-14 font-bold text-sm bg-gray-50/50 border-gray-200 focus:bg-white transition-all ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`} 
            placeholder="0.00" required 
            readOnly={isReadOnly}
          />
        </div>
        <div className="form-group mb-0">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 block">Maximum Amount (₹)</label>
          <input 
            type="text" value={formData.maxAmount} 
            onChange={e => !isReadOnly && setFormData({...formData, maxAmount: e.target.value})} 
            className={`form-input h-14 font-bold text-sm bg-gray-50/50 border-gray-200 focus:bg-white transition-all ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`} 
            placeholder="Leave empty for unlimited" 
            readOnly={isReadOnly}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="form-group mb-0">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 block">Charge Mechanism</label>
          <select 
            value={formData.commissionType} 
            onChange={e => !isReadOnly && setFormData({...formData, commissionType: e.target.value})} 
            className={`form-input h-14 text-xs font-black uppercase bg-gray-50/50 border-gray-200 ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
            disabled={isReadOnly}
          >
            {COMMISSION_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="form-group mb-0">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 block">Charge Value</label>
          <input 
            type="text" value={formData.commissionValue} 
            onChange={e => setFormData({...formData, commissionValue: e.target.value})} 
            className="form-input h-14 font-bold text-sm bg-gray-50/50 border-gray-200 focus:bg-white transition-all" 
            placeholder="0.00" required 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        <div className="flex items-center gap-4">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Slab Status:</label>
          <select 
            value={formData.isActive ? 'true' : 'false'} 
            onChange={e => setFormData({...formData, isActive: e.target.value === 'true'})} 
            className="form-input h-12 text-[10px] font-black uppercase w-32 bg-white"
          >
            <option value="true">ACTIVE</option>
            <option value="false">PAUSED</option>
          </select>
        </div>
        <button 
          type="submit" 
          disabled={saving} 
          className="btn-premium btn-premium-primary h-14 w-full text-xs font-black tracking-[0.2em] uppercase shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          {saving ? <RefreshCw className="animate-spin" size={18} /> : 'COMMIT CHANGES'}
        </button>
      </div>
    </form>
  );
};

export default function Commissions() {
  const { user } = useAuth();
  const isAdmin = user.role === 'ADMIN';
  const canManageRates = MANAGER_ROLES.includes(user.role);
  const allowedRoles = ROLE_OPTIONS_BY_MANAGER[user.role] || [];

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(canManageRates ? 'defaults' : 'myCharges');
  
  const [selService, setSelService] = useState(null);
  const [selRole, setSelRole] = useState(null);
  const [targetUser, setTargetUser] = useState(null);
  
  const [slabs, setSlabs] = useState([]);
  const [inheritedSlabs, setInheritedSlabs] = useState([]);
  const [overrides, setOverrides] = useState([]);
  const [effective, setEffective] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSlab, setEditingSlab] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoints = canManageRates 
        ? ['/commissions/slabs', '/commissions/overrides', '/commissions/effective']
        : ['/commissions/effective'];
        
      const results = await Promise.all(endpoints.map(e => api.get(e)));
      
      if (canManageRates) {
        setSlabs(results[0].data.slabs || []);
        setInheritedSlabs(results[0].data.inheritedSlabs || []);
        setOverrides(results[1].data.overrides || []);
        setEffective(results[2].data.slabs || []);
      } else {
        setEffective(results[0].data.slabs || []);
      }
    } catch (err) {
      setError('Failed to load charge settings');
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [canManageRates]);

  const handleDelete = async (id, isOverride = false) => {
    if (!isAdmin) return;
    if (!window.confirm('Delete this slab permanently?')) return;
    try {
      const endpoint = isOverride ? `/commissions/overrides/${id}` : `/commissions/slabs/${id}`;
      await api.delete(endpoint);
      fetchData();
    } catch (err) { alert(err.response?.data?.message || 'Delete failed'); }
  };

  const filteredSlabs = slabs.filter(s => s.serviceType === selService && s.applyOnRole === selRole);
  // Inherited charge is what the current user pays to their parent (base cost)
  const currentInherited = inheritedSlabs.filter(s => s.serviceType === selService && s.applyOnRole === user.role);
  const filteredOverrides = overrides.filter(o => o.targetUserId === targetUser?.id);

  const findInheritedForRange = (min, max) => {
    return currentInherited.find(s => 
      Number(s.minAmount).toFixed(2) === Number(min).toFixed(2) && 
      (s.maxAmount === null ? max === null : Number(s.maxAmount).toFixed(2) === Number(max).toFixed(2))
    );
  };

  const renderDefaultSelector = () => (
    <div className="space-y-8 animate-slide-up">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SERVICE_OPTIONS.map(opt => {
          const Icon = opt.icon;
          const isActive = selService === opt.value;
          return (
            <button 
              key={opt.value} onClick={() => { setSelService(opt.value); setSelRole(null); setIsFormOpen(false); }}
              className={`p-8 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 group ${isActive ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-primary/20 bg-white'}`}
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${isActive ? 'bg-primary text-white shadow-xl' : 'bg-gray-50 text-gray-400 group-hover:scale-110'}`}>
                <Icon size={32} />
              </div>
              <span className={`text-sm font-black uppercase tracking-widest ${isActive ? 'text-primary' : 'text-gray-400'}`}>{opt.label}</span>
            </button>
          );
        })}
      </div>

      {selService && (
        <div className="flex flex-wrap items-center gap-3 p-2 bg-gray-50 rounded-2xl border border-gray-100 animate-slide-up">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 mr-2">Target Role:</span>
          {allowedRoles.map(role => (
            <button 
              key={role} onClick={() => { setSelRole(role); setIsFormOpen(false); }}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selRole === role ? 'bg-primary text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-primary/10'}`}
            >
              {ROLE_LABELS[role] || role}
            </button>
          ))}
        </div>
      )}

      {selRole && (
        <div className="space-y-6 animate-slide-up">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Active Slabs for {selService} - {ROLE_LABELS[selRole]}</h3>
              {!isAdmin && <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 flex items-center gap-1"><ShieldAlert size={10} /> Inheritance and Deletion policy active</p>}
            </div>
            {isAdmin && (
              <button onClick={() => { setEditingSlab(null); setIsFormOpen(!isFormOpen); }} className="btn-premium btn-premium-secondary px-6 py-2.5 text-[10px]">
                {isFormOpen ? <X size={14} className="mr-2" /> : <Plus size={14} className="mr-2" />}
                {isFormOpen ? 'CANCEL' : 'ADD SLAB'}
              </button>
            )}
          </div>

          {isFormOpen && !editingSlab && (
            <ChargeForm 
              isAdmin={isAdmin}
              context={{ serviceType: selService, applyOnRole: selRole }}
              onCancel={() => setIsFormOpen(false)}
              onSaved={() => { fetchData(); setIsFormOpen(false); }}
            />
          )}

          <div className="glass-panel overflow-hidden border border-gray-100 shadow-sm rounded-3xl bg-white">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Range (Min - Max)</th>
                  {!isAdmin && <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Inherited Charge</th>}
                  <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">{isAdmin ? 'Default Charge' : 'New Charge'}</th>
                  <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                  <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredSlabs.length === 0 ? (
                  <tr><td colSpan="5" className="p-10 text-center text-gray-400 font-bold uppercase text-[10px]">No slabs configured</td></tr>
                ) : (
                  filteredSlabs.map(s => {
                    const inherited = findInheritedForRange(s.minAmount, s.maxAmount);
                    return (
                      <React.Fragment key={s.id}>
                        <tr className="hover:bg-gray-50/30 transition-all">
                          <td className="p-4 text-xs font-bold text-gray-600">{formatRange(s.minAmount, s.maxAmount)}</td>
                          {!isAdmin && (
                            <td className="p-4 text-right">
                              {inherited ? (
                                <div className="flex flex-col items-end">
                                  <span className="font-black text-gray-400 text-xs">{formatCharge(inherited.commissionType, inherited.commissionValue)}</span>
                                  <span className="text-[8px] font-black text-gray-300 uppercase tracking-tighter">By {inherited.setBy?.role}</span>
                                </div>
                              ) : (
                                <span className="text-[10px] font-black text-gray-300 uppercase">N/A</span>
                              )}
                            </td>
                          )}
                          <td className="p-4 text-right font-black text-emerald-600 text-sm">{formatCharge(s.commissionType, s.commissionValue)}</td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase ${s.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{s.isActive ? 'Active' : 'Paused'}</span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => setEditingSlab(editingSlab?.id === s.id ? null : s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={14} /></button>
                              {isAdmin && <button onClick={() => handleDelete(s.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>}
                            </div>
                          </td>
                        </tr>
                        {editingSlab?.id === s.id && (
                        <tr><td colSpan={isAdmin ? 5 : 5} className="p-4 bg-gray-50/30"><ChargeForm isAdmin={isAdmin} initialData={s} context={{ serviceType: selService, applyOnRole: selRole }} onCancel={() => setEditingSlab(null)} onSaved={() => { fetchData(); setEditingSlab(null); }} /></td></tr>
                      )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderOverrideSelector = () => (
    <div className="space-y-8 animate-slide-up">
      <div className="flex flex-col gap-4">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Search Managed User</label>
        <UserSearch onSelect={u => { setTargetUser(u); setIsFormOpen(false); }} placeholder="Search user by name or email..." className="h-14" />
      </div>

      {targetUser && (
        <div className="space-y-8 animate-slide-up">
          <div className="p-8 bg-primary/5 rounded-3xl border border-primary/10 flex flex-wrap justify-between items-center gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-white shadow-xl flex items-center justify-center text-primary text-3xl font-black">
                {targetUser.profile?.ownerName?.charAt(0) || 'U'}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                   <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">{targetUser.profile?.ownerName || 'User Profile'}</h2>
                   <span className="px-3 py-1 bg-white rounded-full text-[9px] font-black text-primary border border-primary/20">{targetUser.role}</span>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold text-gray-400 uppercase">
                  <span>{targetUser.email}</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  <span>{targetUser.profile?.mobileNumber}</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  <span className="text-emerald-600 font-black">₹{Number(targetUser.wallet?.balance || 0).toFixed(2)}</span>
                </div>
                <div className="text-[10px] text-gray-400 font-bold truncate max-w-[300px]">{targetUser.profile?.fullAddress}</div>
              </div>
            </div>
            <div className="flex gap-3">
               <button onClick={() => { setEditingSlab(null); setIsFormOpen(!isFormOpen); }} className="btn-premium btn-premium-primary px-8 h-12 shadow-lg">
                 {isFormOpen ? 'CANCEL' : 'ADD OVERRIDE'}
               </button>
               <button onClick={() => setTargetUser(null)} className="btn-premium btn-premium-secondary p-3 rounded-full hover:rotate-90 transition-all"><X size={20} /></button>
            </div>
          </div>

          {isFormOpen && !editingSlab && (
            <div className="animate-slide-up">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                 <select value={selService || 'PAYOUT'} onChange={e => setSelService(e.target.value)} className="form-input h-12 font-bold text-xs uppercase">
                    {SERVICE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label} Override</option>)}
                 </select>
              </div>
              <ChargeForm 
                isAdmin={isAdmin}
                context={{ targetUserId: targetUser.id, serviceType: selService || 'PAYOUT' }}
                onCancel={() => setIsFormOpen(false)}
                onSaved={() => { fetchData(); setIsFormOpen(false); }}
              />
            </div>
          )}

          <div className="glass-panel overflow-hidden border border-gray-100 shadow-sm rounded-3xl bg-white">
             <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Service</th>
                  <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Range (Min - Max)</th>
                  <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Charge</th>
                  <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                  <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredOverrides.length === 0 ? (
                  <tr><td colSpan="5" className="p-10 text-center text-gray-400 font-bold uppercase text-[10px]">No overrides set for this user</td></tr>
                ) : (
                  filteredOverrides.map(o => (
                    <React.Fragment key={o.id}>
                      <tr className="hover:bg-gray-50/30 transition-all">
                        <td className="p-4 font-black text-gray-900 text-[10px] uppercase">
                          <div className="flex flex-col">
                            <span className="font-black">{o.serviceType}</span>
                            {o.setBy && (
                              <span className="text-[8px] text-gray-400 font-black tracking-tighter">SET BY: {o.setBy?.profile?.ownerName || o.setBy?.email} ({o.setBy?.role})</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-xs font-bold text-gray-600">{formatRange(o.minAmount, o.maxAmount)}</td>
                        <td className="p-4 text-right font-black text-emerald-600 text-sm">{formatCharge(o.commissionType, o.commissionValue)}</td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase ${o.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{o.isActive ? 'Active' : 'Paused'}</span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingSlab(editingSlab?.id === o.id ? null : o)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={14} /></button>
                            {isAdmin && <button onClick={() => handleDelete(o.id, true)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>}
                          </div>
                        </td>
                      </tr>
                      {editingSlab?.id === o.id && (
                        <tr><td colSpan="5" className="p-4 bg-gray-50/30"><ChargeForm isAdmin={isAdmin} initialData={o} context={{ targetUserId: targetUser.id, serviceType: o.serviceType }} onCancel={() => setEditingSlab(null)} onSaved={() => { fetchData(); setEditingSlab(null); }} /></td></tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex-col gap-6 pb-20">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-10 animate-slide-up">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase">Charge Setting</h1>
          <p className="text-gray-400 font-bold mt-1 uppercase text-xs tracking-widest">
            {canManageRates ? 'Manage default slabs and user-specific overrides' : 'Your applicable transaction charges'}
          </p>
        </div>
        <button onClick={fetchData} className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <RefreshCw className={loading ? 'animate-spin' : ''} size={20} />
        </button>
      </div>

      <div className="flex gap-4 border-b border-gray-200 mb-10 animate-slide-up">
        {canManageRates && (
          <button onClick={() => {setActiveTab('defaults'); setEditingSlab(null); setIsFormOpen(false);}} className={`pb-4 px-8 text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'defaults' ? 'text-primary border-b-2 border-primary' : 'text-gray-400'}`}>Default Rates</button>
        )}
        {canManageRates && (
          <button onClick={() => {setActiveTab('overrides'); setEditingSlab(null); setIsFormOpen(false);}} className={`pb-4 px-8 text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'overrides' ? 'text-primary border-b-2 border-primary' : 'text-gray-400'}`}>User Overrides</button>
        )}
        {!canManageRates && (
          <button className="pb-4 px-8 text-[11px] font-black uppercase tracking-widest text-primary border-b-2 border-primary">My Effective Charges</button>
        )}
      </div>

      {loading ? (
        <div className="p-20 text-center"><RefreshCw className="animate-spin text-primary mx-auto" size={48} /></div>
      ) : (
        <>
          {activeTab === 'defaults' && renderDefaultSelector()}
          {activeTab === 'overrides' && renderOverrideSelector()}
          {activeTab === 'myCharges' && (
             <div className="glass-panel overflow-hidden border border-gray-100 shadow-sm rounded-3xl bg-white animate-slide-up">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Service</th>
                      <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Range</th>
                      <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">My Charge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {effective.length === 0 ? (
                      <tr><td colSpan="3" className="p-20 text-center text-gray-400 font-bold uppercase text-xs tracking-widest">No charges applicable to your account</td></tr>
                    ) : (
                      effective.map((r, i) => (
                        <tr key={i} className="hover:bg-gray-50/30 transition-all">
                          <td className="p-6 font-black text-gray-900 text-xs uppercase">{r.serviceType}</td>
                          <td className="p-6 text-xs font-bold text-gray-500">{formatRange(r.minAmount, r.maxAmount)}</td>
                          <td className="p-6 text-right font-black text-emerald-600 text-sm">{formatCharge(r.commissionType, r.commissionValue)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
             </div>
          )}
        </>
      )}
    </div>
  );
}
