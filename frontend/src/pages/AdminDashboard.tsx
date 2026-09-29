import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Activity,
  BarChart3,
  Building2,
  Database,
  Download,
  FileWarning,
  ScrollText,
  Settings2,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {
  adminApi,
  type AdminDepartment,
  type AdminIncident,
  type AdminUser,
  type AuditLog,
  type Role,
} from '../api/admin.api';

type Tab = 'overview' | 'incidents' | 'users' | 'departments' | 'audit' | 'governance';

interface Overview {
  summary: Record<string, number>;
  charts: { byDepartment: Array<{ id: number; name: string; value: number }> };
  recentAudit: AuditLog[];
}

interface DataQuality {
  totalRecords: number;
  completenessRate: number;
  invalidValues: number;
  excludedFromTraining: number;
  missingFieldRates: Record<string, number>;
}

interface ConfigItem {
  id: number;
  key: string;
  category: string;
  value: unknown;
  description?: string;
  isActive: boolean;
}

interface ModelItem {
  id: number;
  modelName: string;
  version: string;
  datasetVersion: string;
  status: string;
  accuracy?: number | null;
  driftScore?: number | null;
  latencyMs?: number | null;
  health?: string;
}

const roles: Role[] = ['ADMIN', 'MANAGER', 'INVESTIGATOR', 'ACTION_OWNER', 'STAFF'];
const inputClass = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-700';
const buttonClass = 'rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50';

const Card = ({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between text-slate-500"><span className="text-sm font-semibold">{title}</span>{icon}</div>
    <div className="mt-3 text-3xl font-extrabold text-slate-900">{value}</div>
  </div>
);

export const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('overview');
  const [incidentFilters, setIncidentFilters] = useState<Record<string, string>>({});
  const [auditFilters, setAuditFilters] = useState<Record<string, string>>({});

  const overview = useQuery<Overview>({ queryKey: ['admin-overview'], queryFn: () => adminApi.overview() as Promise<Overview> });
  const incidents = useQuery<AdminIncident[]>({ queryKey: ['admin-incidents', incidentFilters], queryFn: () => adminApi.incidents(incidentFilters) });
  const users = useQuery<AdminUser[]>({ queryKey: ['admin-users'], queryFn: adminApi.users });
  const departments = useQuery<AdminDepartment[]>({ queryKey: ['admin-departments'], queryFn: adminApi.departments });
  const auditLogs = useQuery<AuditLog[]>({ queryKey: ['admin-audit', auditFilters], queryFn: () => adminApi.auditLogs(auditFilters) });
  const quality = useQuery<DataQuality>({ queryKey: ['admin-quality'], queryFn: () => adminApi.dataQuality() as Promise<DataQuality> });
  const configs = useQuery<ConfigItem[]>({ queryKey: ['admin-configs'], queryFn: () => adminApi.configs() as Promise<ConfigItem[]> });
  const models = useQuery<ModelItem[]>({ queryKey: ['admin-models'], queryFn: () => adminApi.models() as Promise<ModelItem[]> });
  const modelHealth = useQuery<ModelItem[]>({ queryKey: ['admin-model-health'], queryFn: () => adminApi.modelHealth() as Promise<ModelItem[]> });

  const refresh = (...keys: string[]) => keys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
  const mutation = useMutation({
    mutationFn: ({ run }: { run: () => Promise<unknown>; message: string; refresh: string[] }) => run(),
    onSuccess: (_data, variables) => {
      toast.success(variables.message);
      refresh(...variables.refresh, 'admin-overview', 'admin-audit');
    },
  });

  const createUser = () => {
    const name = window.prompt('Full name');
    const email = window.prompt('Email address');
    const password = window.prompt('Temporary password (minimum 8 characters)');
    const role = window.prompt(`Role: ${roles.join(', ')}`, 'STAFF') as Role | null;
    const departmentId = Number(window.prompt('Department ID'));
    if (!name || !email || !password || !role || !roles.includes(role) || !departmentId) return;
    mutation.mutate({ run: () => adminApi.createUser({ name, email, password, role, departmentId }), message: 'User created.', refresh: ['admin-users'] });
  };

  const editUser = (user: AdminUser) => {
    const role = window.prompt(`New role: ${roles.join(', ')}`, user.role) as Role | null;
    const departmentId = Number(window.prompt('Department ID', String(user.departmentId)));
    if (!role || !roles.includes(role) || !departmentId) return;
    mutation.mutate({ run: () => adminApi.updateUser(user.id, { role, departmentId }), message: 'User access updated.', refresh: ['admin-users'] });
  };

  const createDepartment = () => {
    const name = window.prompt('Department name');
    const description = window.prompt('Description (optional)') ?? undefined;
    if (!name) return;
    mutation.mutate({ run: () => adminApi.createDepartment({ name, description }), message: 'Department created.', refresh: ['admin-departments'] });
  };

  const correctIncident = (incident: AdminIncident) => {
    const reason = window.prompt('Mandatory correction reason (minimum 10 characters)');
    const severity = window.prompt('New severity (LOW, MEDIUM, HIGH, CRITICAL)', incident.severity);
    if (!reason || reason.trim().length < 10 || !severity || severity === incident.severity) return;
    mutation.mutate({ run: () => adminApi.correctIncident(incident.id, { reason, changes: { severity } }), message: 'Incident correction saved with before/after audit.', refresh: ['admin-incidents'] });
  };

  const saveConfig = (config: ConfigItem) => {
    const raw = window.prompt('Configuration value (valid JSON)', JSON.stringify(config.value));
    if (raw === null) return;
    try {
      const value = JSON.parse(raw);
      mutation.mutate({ run: () => adminApi.saveConfig(config.key, { category: config.category, value, description: config.description, isActive: config.isActive }), message: 'Configuration updated.', refresh: ['admin-configs'] });
    } catch { toast.error('Please enter valid JSON.'); }
  };

  const transitionModel = (model: ModelItem) => {
    const action = window.prompt('Action: SUBMIT, APPROVE, REJECT, DEPLOY, ROLLBACK, RETIRE', 'APPROVE');
    const reason = window.prompt('Reason (minimum 5 characters)');
    if (!action || !reason || reason.length < 5) return;
    mutation.mutate({ run: () => adminApi.transitionModel(model.id, action.toUpperCase(), reason), message: 'Model governance action recorded.', refresh: ['admin-models', 'admin-model-health'] });
  };

  const tabs = useMemo(() => [
    ['overview', 'Overview', BarChart3], ['incidents', 'Incidents', FileWarning], ['users', 'Users', Users],
    ['departments', 'Departments', Building2], ['audit', 'Audit Log', ScrollText], ['governance', 'AI & Config', Settings2],
  ] as const, []);

  const exportAudit = async () => {
    const response = await adminApi.exportAuditLogs(auditFilters);
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'admin-audit-log.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const summary = overview.data?.summary ?? {};

  return (
    <div className="min-h-full bg-slate-50 p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Enterprise governance</p><h1 className="mt-1 text-3xl font-extrabold text-slate-900">Admin Workspace</h1><p className="mt-1 text-sm text-slate-500">Cross-department oversight, security, data quality, and AI governance.</p></div>
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700"><ShieldCheck size={18}/> Admin controls active</div>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto border-b border-slate-200 pb-2">
        {tabs.map(([key, label, Icon]) => <button key={key} onClick={() => setTab(key)} className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${tab === key ? 'bg-blue-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}><Icon size={16}/>{label}</button>)}
      </div>

      {tab === 'overview' && <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Card title="Total Incidents" value={summary.totalIncidents ?? 0} icon={<FileWarning size={21}/>} />
          <Card title="Open" value={summary.openIncidents ?? 0} icon={<Activity size={21}/>} />
          <Card title="Critical" value={summary.criticalIncidents ?? 0} icon={<ShieldCheck size={21}/>} />
          <Card title="Active Users" value={summary.activeUsers ?? 0} icon={<Users size={21}/>} />
          <Card title="Departments" value={summary.activeDepartments ?? 0} icon={<Building2 size={21}/>} />
        </div>
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold text-slate-900">Incidents by department</h2><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{overview.data?.charts.byDepartment.map((item) => <div key={item.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3"><span className="font-medium text-slate-700">{item.name}</span><span className="rounded-full bg-blue-100 px-3 py-1 font-bold text-blue-800">{item.value}</span></div>)}</div></section>
      </div>}

      {tab === 'incidents' && <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="font-bold text-slate-900">Cross-department incidents</h2><div className="flex flex-wrap gap-2"><input className={inputClass} placeholder="Search" onChange={(e) => setIncidentFilters((f) => ({ ...f, search: e.target.value }))}/><select className={inputClass} onChange={(e) => setIncidentFilters((f) => ({ ...f, departmentId: e.target.value }))}><option value="">All departments</option>{departments.data?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select><select className={inputClass} onChange={(e) => setIncidentFilters((f) => ({ ...f, severity: e.target.value }))}><option value="">All severity</option>{['LOW','MEDIUM','HIGH','CRITICAL'].map((v) => <option key={v}>{v}</option>)}</select><select className={inputClass} onChange={(e) => setIncidentFilters((f) => ({ ...f, status: e.target.value }))}><option value="">All status</option>{['OPEN','ACCEPTED','REJECTED','INVESTIGATING','PENDING_ACTION','UNDER_REVIEW','CLOSED'].map((v) => <option key={v}>{v}</option>)}</select></div></div>
        <Table headers={['ID','Incident','Department','Severity','Status','Created','Action']} rows={(incidents.data ?? []).map((item) => [item.id, item.title, item.department.name, item.severity, item.status, new Date(item.createdAt).toLocaleDateString(), <button className="font-semibold text-blue-700" onClick={() => correctIncident(item)}>Correct</button>])}/>
      </section>}

      {tab === 'users' && <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex justify-between"><h2 className="font-bold text-slate-900">User access management</h2><button className={buttonClass} onClick={createUser}>Create user</button></div><Table headers={['Name','Email','Role','Department','Status','Actions']} rows={(users.data ?? []).map((user) => [user.name, user.email, user.role.replace('_',' '), user.department?.name ?? user.departmentId, user.isActive ? 'Active' : 'Inactive', <div className="flex gap-3"><button className="font-semibold text-blue-700" onClick={() => editUser(user)}>Edit access</button>{user.isActive && <button className="font-semibold text-red-600" onClick={() => mutation.mutate({ run: () => adminApi.deactivateUser(user.id), message: 'User deactivated.', refresh: ['admin-users'] })}>Deactivate</button>}</div>])}/></section>}

      {tab === 'departments' && <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex justify-between"><h2 className="font-bold text-slate-900">Department management</h2><button className={buttonClass} onClick={createDepartment}>Create department</button></div><Table headers={['Department','Description','Users','Incidents','Status','Action']} rows={(departments.data ?? []).map((d) => [d.name, d.description ?? '—', d._count?.users ?? 0, d._count?.incidents ?? 0, d.isActive ? 'Active' : 'Inactive', d.isActive ? <button className="font-semibold text-red-600" onClick={() => mutation.mutate({ run: () => adminApi.deactivateDepartment(d.id), message: 'Department deactivated; history preserved.', refresh: ['admin-departments'] })}>Deactivate</button> : '—'])}/></section>}

      {tab === 'audit' && <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex flex-wrap justify-between gap-3"><h2 className="font-bold text-slate-900">Immutable activity trail</h2><div className="flex gap-2"><input className={inputClass} placeholder="Event type" onChange={(e) => setAuditFilters((f) => ({ ...f, eventType: e.target.value }))}/><input className={inputClass} type="date" onChange={(e) => setAuditFilters((f) => ({ ...f, from: e.target.value }))}/><button className={`${buttonClass} flex items-center gap-2`} onClick={exportAudit}><Download size={16}/>Export CSV</button></div></div><Table headers={['Time','Actor','Role','Event','Action','Entity']} rows={(auditLogs.data ?? []).map((log) => [new Date(log.createdAt).toLocaleString(), log.actor?.email ?? 'System', log.actorRole ?? '—', log.eventType, log.action, `${log.entityType}${log.entityId ? ` #${log.entityId}` : ''}`])}/></section>}

      {tab === 'governance' && <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4"><Card title="Training records" value={quality.data?.totalRecords ?? 0} icon={<Database size={21}/>}/><Card title="Completeness" value={`${(quality.data?.completenessRate ?? 0).toFixed(1)}%`} icon={<ShieldCheck size={21}/>}/><Card title="Invalid values" value={quality.data?.invalidValues ?? 0} icon={<FileWarning size={21}/>}/><Card title="Excluded records" value={quality.data?.excludedFromTraining ?? 0} icon={<Activity size={21}/>}/></div>
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 font-bold text-slate-900">Governed system configuration</h2><Table headers={['Key','Category','Value','Status','Action']} rows={(configs.data ?? []).map((c) => [c.key, c.category, <code className="text-xs">{JSON.stringify(c.value)}</code>, c.isActive ? 'Active' : 'Inactive', <button className="font-semibold text-blue-700" onClick={() => saveConfig(c)}>Edit</button>])}/></section>
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 font-bold text-slate-900">AI model registry and health</h2><Table headers={['Model','Version','Dataset','Status','Accuracy','Drift','Health','Action']} rows={(models.data ?? []).map((m) => { const health = modelHealth.data?.find((h) => h.id === m.id)?.health ?? 'NOT DEPLOYED'; return [m.modelName, m.version, m.datasetVersion, m.status, m.accuracy ?? '—', m.driftScore ?? '—', health, <button className="font-semibold text-blue-700" onClick={() => transitionModel(m)}>Transition</button>]; })}/></section>
      </div>}
    </div>
  );
};

const Table = ({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) => (
  <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">{headers.map((header) => <th key={header} className="px-3 py-3">{header}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex} className="border-b border-slate-100 hover:bg-slate-50">{row.map((cell, cellIndex) => <td key={cellIndex} className="px-3 py-3 text-slate-700">{cell}</td>)}</tr>)}</tbody></table>{rows.length === 0 && <div className="py-10 text-center text-sm text-slate-500">No records found.</div>}</div>
);
