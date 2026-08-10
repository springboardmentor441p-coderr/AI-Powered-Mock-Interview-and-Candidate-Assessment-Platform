import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { api } from '../../services/api';

export default function AdminML({ navigate }) {
  const [status, setStatus] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [trainMsg, setTrainMsg] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [st, ml] = await Promise.all([api.mlStatus(), api.mlStats()]);
      setStatus(st);
      setStats(ml);
    } catch (err) {
      if (err.message.includes('401')) navigate('auth');
    } finally { setLoading(false); }
  };

  const handleTrain = async () => {
    setTraining(true);
    setTrainMsg('');
    try {
      const res = await api.mlTrain();
      setTrainMsg(res.message || 'Training started in background.');
    } catch (err) {
      setTrainMsg(`Error: ${err.message}`);
    } finally { setTraining(false); }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.mlExport();
      setExportResult(res);
    } catch (err) {
      setExportResult({ error: err.message });
    } finally { setExporting(false); }
  };

  const modelEntries = status?.model_status ? Object.entries(status.model_status) : [];

  return (
    <AdminLayout navigate={navigate} active="admin-ml">
      <div className="page">
        <div className="page-header flex-between">
          <div>
            <h1>ML Engine Control</h1>
            <p>Manage machine learning models for AI scoring</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={loadData}>
            <span className="material-symbols-outlined">refresh</span>
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex-center" style={{ height: 300 }}>
            <span className="material-symbols-outlined spin" style={{ fontSize: 36, color: 'var(--violet-bright)' }}>progress_activity</span>
          </div>
        ) : (
          <>
            {/* Training Data Stats */}
            <div className="grid-4 mb-6">
              {[
                { label: 'Training Samples', value: stats?.total_samples ?? 0, icon: 'dataset', color: 'var(--cyan)' },
                { label: 'Avg Comm Score', value: `${stats?.avg_communication ?? 0}`, icon: 'chat', color: 'var(--violet-bright)' },
                { label: 'Avg Technical Score', value: `${stats?.avg_technical ?? 0}`, icon: 'code', color: 'var(--yellow)' },
                { label: 'Avg Confidence Score', value: `${stats?.avg_confidence ?? 0}`, icon: 'psychology', color: 'var(--green)' },
              ].map(k => (
                <div className="stat-card" key={k.label}>
                  <div className="flex-between mb-3">
                    <span className="text-xs text-muted uppercase tracking-wide font-semibold">{k.label}</span>
                    <span className="material-symbols-outlined" style={{ color: k.color, fontSize: 20 }}>{k.icon}</span>
                  </div>
                  <div className="font-display font-bold" style={{ fontSize: 28 }}>{k.value}</div>
                </div>
              ))}
            </div>

            <div className="grid-2 gap-6">
              {/* Model Status */}
              <div>
                <h2 className="font-display font-bold mb-4" style={{ fontSize: 16 }}>Model Status</h2>
                <div className="card">
                  {modelEntries.length === 0 ? (
                    <div className="flex-center" style={{ flexDirection: 'column', gap: 10, padding: '24px 0' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'var(--yellow)' }}>warning</span>
                      <p className="text-muted text-sm">No models trained yet. Train to enable ML predictions.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {modelEntries.map(([name, ready]) => (
                        <div key={name} className="flex-between" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 20, color: ready ? 'var(--green)' : 'var(--text-muted)' }}>
                              {ready ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                            <span className="font-semibold text-sm" style={{ textTransform: 'capitalize' }}>{name.replace(/_/g, ' ')}</span>
                          </div>
                          <span className={`badge ${ready ? 'badge-green' : 'badge-yellow'}`}>{ready ? 'Ready' : 'Not Trained'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Train */}
                <div>
                  <h2 className="font-display font-bold mb-4" style={{ fontSize: 16 }}>Train Models</h2>
                  <div className="card" style={{ background: 'rgba(168,85,247,0.05)', borderColor: 'rgba(168,85,247,0.15)' }}>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 24, color: 'var(--violet-bright)', marginTop: 2 }}>model_training</span>
                      <div>
                        <p className="font-bold" style={{ marginBottom: 4 }}>Retrain Scoring Models</p>
                        <p className="text-sm text-muted">Runs training pipeline in background using collected interview data. Requires {'>'}10 samples.</p>
                      </div>
                    </div>
                    {trainMsg && (
                      <div className={`alert ${trainMsg.startsWith('Error') ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: 12 }}>
                        {trainMsg}
                      </div>
                    )}
                    <button className="btn btn-primary btn-sm" onClick={handleTrain} disabled={training} style={{ gap: 8 }}>
                      {training
                        ? <><span className="material-symbols-outlined spin">progress_activity</span>Training...</>
                        : <><span className="material-symbols-outlined">play_arrow</span>Start Training</>
                      }
                    </button>
                  </div>
                </div>

                {/* Export */}
                <div>
                  <h2 className="font-display font-bold mb-4" style={{ fontSize: 16 }}>Export Training Data</h2>
                  <div className="card" style={{ background: 'rgba(0,240,255,0.03)', borderColor: 'rgba(0,240,255,0.1)' }}>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 24, color: 'var(--cyan)', marginTop: 2 }}>download</span>
                      <div>
                        <p className="font-bold" style={{ marginBottom: 4 }}>Export to CSV</p>
                        <p className="text-sm text-muted">Export all collected interview answer data as CSV for external analysis.</p>
                      </div>
                    </div>
                    {exportResult && (
                      <div className={`alert ${exportResult.error ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: 12 }}>
                        {exportResult.error
                          ? exportResult.error
                          : `Exported to: ${exportResult.csv_path} (${exportResult.stats?.total_samples ?? 0} rows)`
                        }
                      </div>
                    )}
                    <button className="btn btn-secondary btn-sm" onClick={handleExport} disabled={exporting} style={{ gap: 8 }}>
                      {exporting
                        ? <><span className="material-symbols-outlined spin">progress_activity</span>Exporting...</>
                        : <><span className="material-symbols-outlined">table_view</span>Export CSV</>
                      }
                    </button>
                  </div>
                </div>

                {/* Docs */}
                <div className="card" style={{ background: 'rgba(245,158,11,0.05)', borderColor: 'rgba(245,158,11,0.15)' }}>
                  <div className="flex gap-3" style={{ alignItems: 'flex-start' }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--yellow)', fontSize: 22, marginTop: 2 }}>lightbulb</span>
                    <div>
                      <p className="font-bold text-sm mb-1">How it works</p>
                      <p className="text-xs text-muted" style={{ lineHeight: 1.6 }}>
                        Every completed interview session is automatically collected as training data. Once you have 10+ samples, you can trigger training. Models predict communication, technical, confidence, and professionalism scores.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
