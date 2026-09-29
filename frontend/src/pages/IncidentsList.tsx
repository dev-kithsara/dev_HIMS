import React, { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { managerApi, type IncidentQuery } from '../api/manager.api';

const BORDER='#D8DCE8', TEXT='#1A2447', MUTED='#6B7494';
const badge = (value:string, kind:'status'|'severity') => {
  void kind;
  const colors:Record<string,string>={OPEN:'#2563EB',ACCEPTED:'#16A34A',REJECTED:'#DC2626',INVESTIGATING:'#7C3AED',PENDING_ACTION:'#D97706',UNDER_REVIEW:'#0EA5E9',CLOSED:'#15803D',LOW:'#16A34A',MEDIUM:'#CA8A04',HIGH:'#EA580C',CRITICAL:'#DC2626'};
  return <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase" style={{color:colors[value]??MUTED,background:'#F8FAFC',border:`1px solid ${colors[value]??BORDER}55`}}>{value.replaceAll('_',' ')}</span>;
};
export const IncidentsList:React.FC=()=>{
  const navigate=useNavigate(); const [page,setPage]=useState(1); const [searchInput,setSearchInput]=useState(''); const [search,setSearch]=useState('');
  const [status,setStatus]=useState(''); const [severity,setSeverity]=useState(''); const [category,setCategory]=useState(''); const [sortBy,setSortBy]=useState('createdAt'); const [sortOrder,setSortOrder]=useState('desc');
  useEffect(()=>{const timer=setTimeout(()=>{setSearch(searchInput);setPage(1)},350);return()=>clearTimeout(timer)},[searchInput]);
  const params:IncidentQuery={page,pageSize:10,search:search||undefined,status:status||undefined,severity:severity||undefined,category:category||undefined,sortBy,sortOrder};
  const {data,isLoading,isError}=useQuery({queryKey:['manager-incidents',params],queryFn:()=>managerApi.incidents(params),placeholderData:keepPreviousData});
  const exportCsv=async()=>{const blob=await managerApi.export(params);const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`department-incidents-${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(url)};
  return <div className="space-y-6 pb-5">
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4"><div><h1 className="text-3xl font-extrabold" style={{color:TEXT}}>Incident Register</h1><p style={{color:MUTED}}>Server-side search, filtering, sorting and pagination • <b>{data?.total??0}</b> department records</p></div><button onClick={exportCsv} className="px-5 py-3 rounded-xl text-white font-bold" style={{background:'#1E2B5E'}}>↓ Export authorized CSV</button></div>
    <div className="rounded-2xl p-5 grid md:grid-cols-2 xl:grid-cols-5 gap-3 bg-white" style={{border:`1.5px solid ${BORDER}`}}>
      <input value={searchInput} onChange={e=>setSearchInput(e.target.value)} placeholder="ID, title, location or reporter…" className="xl:col-span-2 px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 outline-blue-600"/>
      <select value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}} className="px-3 py-3 rounded-xl bg-slate-50 border border-slate-300"><option value="">All statuses</option>{['OPEN','ACCEPTED','REJECTED','INVESTIGATING','PENDING_ACTION','UNDER_REVIEW','CLOSED'].map(v=><option key={v}>{v}</option>)}</select>
      <select value={severity} onChange={e=>{setSeverity(e.target.value);setPage(1)}} className="px-3 py-3 rounded-xl bg-slate-50 border border-slate-300"><option value="">All severities</option>{['LOW','MEDIUM','HIGH','CRITICAL'].map(v=><option key={v}>{v}</option>)}</select>
      <input value={category} onChange={e=>{setCategory(e.target.value);setPage(1)}} placeholder="Category" className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-300"/>
      <select value={sortBy} onChange={e=>setSortBy(e.target.value)} className="px-3 py-3 rounded-xl bg-slate-50 border border-slate-300"><option value="createdAt">Reported date</option><option value="updatedAt">Last updated</option><option value="severity">Severity</option><option value="status">Status</option><option value="title">Title</option></select>
      <select value={sortOrder} onChange={e=>setSortOrder(e.target.value)} className="px-3 py-3 rounded-xl bg-slate-50 border border-slate-300"><option value="desc">Descending</option><option value="asc">Ascending</option></select>
    </div>
    <div className="rounded-2xl overflow-hidden bg-white" style={{border:`1.5px solid ${BORDER}`}}><div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-slate-100 text-xs uppercase" style={{color:MUTED}}><tr>{['ID / Incident','Severity','Status','Category','Location','Reporter','Owner','Reported'].map(x=><th key={x} className="px-5 py-4">{x}</th>)}</tr></thead><tbody>{isLoading?<tr><td colSpan={8} className="p-14 text-center">Loading…</td></tr>:isError?<tr><td colSpan={8} className="p-14 text-center text-red-600">Could not load incident register.</td></tr>:data?.items.length===0?<tr><td colSpan={8} className="p-14 text-center text-slate-500">No matching incidents.</td></tr>:data?.items.map((i,index)=><tr key={i.id} onClick={()=>navigate(`/incidents/${i.id}`)} className="cursor-pointer hover:bg-blue-50" style={{background:index%2?'#F8FAFC':'white',borderTop:'1px solid #E8EAF0'}}><td className="px-5 py-4"><b>#{i.id} {i.title}</b></td><td className="px-5 py-4">{badge(i.severity,'severity')}</td><td className="px-5 py-4">{badge(i.status,'status')}</td><td className="px-5 py-4">{i.category}</td><td className="px-5 py-4">{i.location}</td><td className="px-5 py-4">{i.reporter?.name}</td><td className="px-5 py-4">{i.investigator?.name||i.actionOwner?.name||'—'}</td><td className="px-5 py-4 whitespace-nowrap">{new Date(i.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div>
      <div className="p-4 flex justify-between items-center border-t border-slate-200"><span className="text-sm" style={{color:MUTED}}>Page {data?.page??1} of {data?.totalPages??1}</span><div className="flex gap-2"><button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="px-4 py-2 rounded-lg border disabled:opacity-40">Previous</button><button disabled={page>=(data?.totalPages??1)} onClick={()=>setPage(p=>p+1)} className="px-4 py-2 rounded-lg text-white disabled:opacity-40" style={{background:'#2952C4'}}>Next</button></div></div>
    </div>
  </div>;
};
