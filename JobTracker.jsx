import { useState, useEffect } from 'react';
import ExcelJS from 'exceljs';

const API_URL = 'http://localhost:3001/api';

const STATUS_CONFIG = {
  'Saved': { color: '#6B7280', bg: '#F3F4F6', excelBg: 'F3F4F6' },
  'Applied': { color: '#2563EB', bg: '#DBEAFE', excelBg: 'DBEAFE' },
  'Phone Screen': { color: '#7C3AED', bg: '#EDE9FE', excelBg: 'EDE9FE' },
  'Interview': { color: '#D97706', bg: '#FEF3C7', excelBg: 'FEF3C7' },
  'Offer': { color: '#059669', bg: '#D1FAE5', excelBg: 'D1FAE5' },
  'Rejected': { color: '#DC2626', bg: '#FEE2E2', excelBg: 'FEE2E2' },
  'Withdrawn': { color: '#9CA3AF', bg: '#F9FAFB', excelBg: 'F9FAFB' }
};

const TYPES = ['Job', 'Internship'];

export default function JobTracker() {
  const [applications, setApplications] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('All');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState(null);
  const [form, setForm] = useState({
    company: '',
    role: '',
    type: 'Job',
    status: 'Saved',
    location: '',
    salary: '',
    link: '',
    notes: ''
  });

  useEffect(() => {
    fetchApplications();
  }, []);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const fetchApplications = async () => {
    try {
      const res = await fetch(`${API_URL}/applications`);
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
        setConnected(true);
      }
    } catch (err) {
      showMessage('Could not connect to server', 'error');
      setConnected(false);
    }
  };

  const resetForm = () => {
    setForm({ company: '', role: '', type: 'Job', status: 'Saved', location: '', salary: '', link: '', notes: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.company || !form.role) return;
    
    setLoading(true);
    
    try {
      if (editingId) {
        const res = await fetch(`${API_URL}/applications/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
        if (res.ok) {
          const updated = await res.json();
          setApplications(apps => apps.map(app => app._id === editingId ? updated : app));
          showMessage('Application updated');
        }
      } else {
        const res = await fetch(`${API_URL}/applications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
        if (res.ok) {
          const newApp = await res.json();
          setApplications(apps => [newApp, ...apps]);
          showMessage('Application added');
        }
      }
    } catch (err) {
      showMessage('Failed to save', 'error');
    }
    
    setLoading(false);
    resetForm();
  };

  const handleEdit = (app) => {
    setForm({
      company: app.company,
      role: app.role,
      type: app.type,
      status: app.status,
      location: app.location || '',
      salary: app.salary || '',
      link: app.link || '',
      notes: app.notes || ''
    });
    setEditingId(app._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/applications/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setApplications(apps => apps.filter(app => app._id !== id));
        showMessage('Application deleted');
      }
    } catch (err) {
      showMessage('Failed to delete', 'error');
    }
  };

  // Export to Excel with color-coded status
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Applications');

    // Define columns (no deadline)
    worksheet.columns = [
      { header: 'Company', key: 'company', width: 22 },
      { header: 'Role', key: 'role', width: 28 },
      { header: 'Type', key: 'type', width: 12 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Location', key: 'location', width: 20 },
      { header: 'Salary', key: 'salary', width: 16 },
      { header: 'Link', key: 'link', width: 35 },
      { header: 'Notes', key: 'notes', width: 30 },
      { header: 'Date Added', key: 'createdAt', width: 14 },
      { header: 'Last Updated', key: 'updatedAt', width: 14 }
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1E293B' }
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Add data rows
    applications.forEach(app => {
      const row = worksheet.addRow({
        company: app.company,
        role: app.role,
        type: app.type,
        status: app.status,
        location: app.location || '',
        salary: app.salary || '',
        link: app.link || '',
        notes: app.notes || '',
        createdAt: new Date(app.createdAt).toLocaleDateString(),
        updatedAt: new Date(app.updatedAt).toLocaleDateString()
      });

      // Color code status cell
      const statusCell = row.getCell('status');
      const statusConfig = STATUS_CONFIG[app.status];
      if (statusConfig) {
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: statusConfig.excelBg }
        };
        statusCell.font = { color: { argb: statusConfig.color.replace('#', '') }, bold: true };
      }
      statusCell.alignment = { horizontal: 'center' };

      // Color code type cell
      const typeCell = row.getCell('type');
      typeCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: app.type === 'Internship' ? 'F3E8FF' : 'E0F2FE' }
      };
      typeCell.font = { color: { argb: app.type === 'Internship' ? '7C3AED' : '0284C7' } };
      typeCell.alignment = { horizontal: 'center' };
    });

    // Add borders to all cells
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'E2E8F0' } },
          left: { style: 'thin', color: { argb: 'E2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
          right: { style: 'thin', color: { argb: 'E2E8F0' } }
        };
      });
    });

    // Generate and download file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job_applications_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    
    showMessage('Exported to Excel');
  };

  const filteredApps = applications.filter(app => 
    filter === 'All' ? true : app.status === filter
  );

  const stats = {
    total: applications.length,
    active: applications.filter(a => !['Rejected', 'Withdrawn', 'Offer'].includes(a.status)).length,
    offers: applications.filter(a => a.status === 'Offer').length,
    interviews: applications.filter(a => a.status === 'Interview').length
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      padding: '40px 20px',
      color: '#F8FAFC'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');
        * { box-sizing: border-box; }
        input, select, textarea, button { font-family: inherit; }
        input:focus, select:focus, textarea:focus { outline: none; border-color: #3B82F6 !important; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2); }
        .app-row:hover { background: rgba(255,255,255,0.03); }
        .btn-primary:hover { background: #2563EB !important; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4); }
        .btn-secondary:hover { background: rgba(255,255,255,0.1) !important; }
        .status-pill { transition: all 0.2s ease; }
        .status-pill:hover { transform: scale(1.05); }
        .fade-in { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
      `}</style>
      
      {/* Toast Message */}
      {message && (
        <div className="fade-in" style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '14px 20px',
          borderRadius: '10px',
          background: message.type === 'error' ? '#DC2626' : '#059669',
          color: '#FFFFFF',
          fontSize: '14px',
          fontWeight: '500',
          zIndex: 2000,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}>
          {message.text}
        </div>
      )}
      
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '38px',
              fontWeight: '700',
              color: '#F8FAFC',
              margin: '0 0 8px 0',
              letterSpacing: '-0.5px'
            }}>
              Application Tracker
            </h1>
            <p style={{ color: '#94A3B8', fontSize: '16px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Track your job and internship applications
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: connected ? '#22C55E' : '#EF4444', fontSize: '13px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: connected ? '#22C55E' : '#EF4444' }}></span>
                {connected ? 'MongoDB Connected' : 'Disconnected'}
              </span>
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={fetchApplications}
              className="btn-secondary"
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.05)',
                color: '#CBD5E1',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              ↻ Refresh
            </button>
            <button
              onClick={exportToExcel}
              disabled={applications.length === 0}
              className="btn-secondary"
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                background: 'rgba(34, 197, 94, 0.1)',
                color: '#4ADE80',
                fontSize: '14px',
                fontWeight: '500',
                cursor: applications.length === 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: applications.length === 0 ? 0.5 : 1
              }}
            >
              📊 Export Excel
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '32px'
        }}>
          {[
            { label: 'Total', value: stats.total, accent: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.2)' },
            { label: 'Active', value: stats.active, accent: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.2)' },
            { label: 'Interviews', value: stats.interviews, accent: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)' },
            { label: 'Offers', value: stats.offers, accent: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.2)' }
          ].map(stat => (
            <div key={stat.label} style={{
              background: stat.bg,
              borderRadius: '14px',
              padding: '22px',
              border: `1px solid ${stat.border}`
            }}>
              <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>
                {stat.label}
              </div>
              <div style={{ fontSize: '36px', fontWeight: '700', color: stat.accent, fontFamily: "'Space Grotesk', sans-serif" }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Actions Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['All', ...Object.keys(STATUS_CONFIG)].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className="status-pill"
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  background: filter === status ? '#3B82F6' : 'rgba(255,255,255,0.08)',
                  color: filter === status ? '#FFFFFF' : '#94A3B8',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {status}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="btn-primary"
            style={{
              padding: '12px 24px',
              borderRadius: '10px',
              border: 'none',
              background: '#3B82F6',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <span style={{ fontSize: '18px' }}>+</span> Add Application
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }} onClick={() => resetForm()}>
            <form
              onClick={e => e.stopPropagation()}
              onSubmit={handleSubmit}
              className="fade-in"
              style={{
                background: '#1E293B',
                borderRadius: '20px',
                padding: '32px',
                width: '100%',
                maxWidth: '560px',
                maxHeight: '90vh',
                overflow: 'auto',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 25px 50px rgba(0,0,0,0.4)'
              }}
            >
              <h2 style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '24px',
                fontWeight: '600',
                margin: '0 0 24px 0',
                color: '#F8FAFC'
              }}>
                {editingId ? 'Edit Application' : 'New Application'}
              </h2>
              
              <div style={{ display: 'grid', gap: '18px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#CBD5E1', marginBottom: '6px' }}>Company *</label>
                    <input
                      type="text"
                      value={form.company}
                      onChange={e => setForm({...form, company: e.target.value})}
                      placeholder="Google"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.15)',
                        background: 'rgba(255,255,255,0.05)',
                        color: '#F8FAFC',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#CBD5E1', marginBottom: '6px' }}>Type</label>
                    <select
                      value={form.type}
                      onChange={e => setForm({...form, type: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.15)',
                        background: '#1E293B',
                        color: '#F8FAFC',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#CBD5E1', marginBottom: '6px' }}>Role *</label>
                  <input
                    type="text"
                    value={form.role}
                    onChange={e => setForm({...form, role: e.target.value})}
                    placeholder="Software Engineer"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.05)',
                      color: '#F8FAFC',
                      fontSize: '14px'
                    }}
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#CBD5E1', marginBottom: '6px' }}>Status</label>
                    <select
                      value={form.status}
                      onChange={e => setForm({...form, status: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.15)',
                        background: '#1E293B',
                        color: '#F8FAFC',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#CBD5E1', marginBottom: '6px' }}>Location</label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={e => setForm({...form, location: e.target.value})}
                      placeholder="San Francisco, CA"
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.15)',
                        background: 'rgba(255,255,255,0.05)',
                        color: '#F8FAFC',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#CBD5E1', marginBottom: '6px' }}>Salary</label>
                  <input
                    type="text"
                    value={form.salary}
                    onChange={e => setForm({...form, salary: e.target.value})}
                    placeholder="$120k - $150k"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.05)',
                      color: '#F8FAFC',
                      fontSize: '14px'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#CBD5E1', marginBottom: '6px' }}>Job Posting Link</label>
                  <input
                    type="url"
                    value={form.link}
                    onChange={e => setForm({...form, link: e.target.value})}
                    placeholder="https://careers.google.com/..."
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.05)',
                      color: '#F8FAFC',
                      fontSize: '14px'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#CBD5E1', marginBottom: '6px' }}>Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm({...form, notes: e.target.value})}
                    placeholder="Interview tips, contacts, referral info..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.05)',
                      color: '#F8FAFC',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary"
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'transparent',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    color: '#CBD5E1',
                    transition: 'background 0.2s'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#3B82F6',
                    color: '#FFFFFF',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: loading ? 'wait' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? 'Saving...' : editingId ? 'Save Changes' : 'Add Application'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Applications List */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.08)',
          overflow: 'hidden'
        }}>
          {filteredApps.length === 0 ? (
            <div style={{
              padding: '60px 20px',
              textAlign: 'center',
              color: '#64748B'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
              <div style={{ fontSize: '16px', fontWeight: '500' }}>
                {filter === 'All' ? 'No applications yet' : `No ${filter.toLowerCase()} applications`}
              </div>
              <div style={{ fontSize: '14px', marginTop: '4px', color: '#475569' }}>
                Click "Add Application" to get started
              </div>
            </div>
          ) : (
            filteredApps.map((app, idx) => (
              <div
                key={app._id}
                className="app-row"
                style={{
                  padding: '20px 24px',
                  borderBottom: idx < filteredApps.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto',
                  alignItems: 'center',
                  gap: '20px',
                  transition: 'background 0.15s'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '17px', fontWeight: '600', color: '#F8FAFC' }}>
                      {app.company}
                    </span>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: STATUS_CONFIG[app.status]?.bg || '#F3F4F6',
                      color: STATUS_CONFIG[app.status]?.color || '#6B7280'
                    }}>
                      {app.status}
                    </span>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      background: app.type === 'Internship' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(14, 165, 233, 0.15)',
                      color: app.type === 'Internship' ? '#C084FC' : '#38BDF8'
                    }}>
                      {app.type}
                    </span>
                  </div>
                  <div style={{ fontSize: '15px', color: '#94A3B8' }}>{app.role}</div>
                  <div style={{ fontSize: '13px', color: '#64748B', marginTop: '6px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {app.location && <span>📍 {app.location}</span>}
                    {app.salary && <span>💰 {app.salary}</span>}
                    {app.notes && (
                      <span style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        📝 {app.notes}
                      </span>
                    )}
                  </div>
                </div>
                
                {app.link && (
                  <a
                    href={app.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: '#60A5FA',
                      textDecoration: 'none',
                      background: 'rgba(59, 130, 246, 0.15)',
                      fontWeight: '500',
                      border: '1px solid rgba(59, 130, 246, 0.2)'
                    }}
                  >
                    View →
                  </a>
                )}
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleEdit(app)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'transparent',
                      fontSize: '13px',
                      cursor: 'pointer',
                      color: '#CBD5E1',
                      fontWeight: '500'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(app._id)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      background: 'rgba(239, 68, 68, 0.1)',
                      fontSize: '13px',
                      cursor: 'pointer',
                      color: '#F87171',
                      fontWeight: '500'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: '#64748B' }}>
          Connected to MongoDB Atlas (Cluster0)
        </div>
      </div>
    </div>
  );
}
