import { apiClient } from './axios';
import type { Incident, User } from '../types/incident';

export type InvestigationStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REVISION_REQUESTED';
export type InvestigationMethod = 'FIVE_WHYS' | 'FISHBONE' | 'FAULT_TREE' | 'TIMELINE_ANALYSIS' | 'OTHER';
export interface InvestigationRecord {
  id:number; incidentId:number; leadInvestigatorId:number; status:InvestigationStatus; startDate?:string; endDate?:string;
  method?:InvestigationMethod; methodOther?:string; findingsSummary?:string; rootCauseCategory?:string; rootCauseSubcategory?:string;
  rootCauseDescription?:string; rootCauseMethod?:InvestigationMethod; rootCauseDetail?:string; systemicIssue:boolean; revisionNumber:number;
  submittedAt?:string; approvedAt?:string; lockedAt?:string; incident:Incident;
  leadInvestigator:User; teamMembers:Array<{userId:number;role:string;user:User}>;
  contributingFactors:Array<{id:number;category:string;description:string}>;
  witnesses:Array<{id:number;name:string;roleOrContact?:string;statement?:string;interviewedAt?:string}>;
  timeline:Array<{id:number;occurredAt:string;title:string;description:string;source?:string}>;
  evidence:Array<{id:number;attachmentId?:number;label:string;reference?:string;notes?:string}>;
  aiFeedback:Array<{id:number;feature:string;resultKey:string;action:string;reason?:string;modelVersion:string}>;
}
export interface InvestigationDashboard {
  summary:{total:number;drafts:number;revision:number;submitted:number;overdue:number};
  items:Array<InvestigationRecord & {priority:number;overdue:boolean;_count:{teamMembers:number;evidence:number;timeline:number;contributingFactors:number}}>;
}
export interface AiInsights {
  modelVersion:string; disclaimer:string;
  similarIncidents:Array<{id:number;title:string;category:string;location:string;severity:string;rootCauseCategory?:string;rootCause?:string;matchedFields:string[];similarity:number}>;
  clusters:Array<{name:string;count:number;incidentIds:number[]}>;
  methodSuggestions:Array<{method:InvestigationMethod;reason:string}>;
  summaries:{timeline:string;evidence:string};
}
const unwrap=<T>(response:{data:{data:T}})=>response.data.data;
export const investigationApi={
  dashboard:async(params:Record<string,string>)=>unwrap<InvestigationDashboard>(await apiClient.get('/investigations/dashboard',{params})),
  workspace:async(id:number)=>unwrap<InvestigationRecord>(await apiClient.get(`/investigations/${id}`)),
  candidates:async(id:number)=>unwrap<User[]>(await apiClient.get(`/investigations/${id}/candidates`)),
  saveDraft:(id:number,body:unknown)=>apiClient.put(`/investigations/${id}/draft`,body),
  addTeam:(id:number,body:unknown)=>apiClient.post(`/investigations/${id}/team`,body),
  removeTeam:(id:number,userId:number)=>apiClient.delete(`/investigations/${id}/team/${userId}`),
  addWitness:(id:number,body:unknown)=>apiClient.post(`/investigations/${id}/witnesses`,body),
  addTimeline:(id:number,body:unknown)=>apiClient.post(`/investigations/${id}/timeline`,body),
  addEvidence:(id:number,body:unknown)=>apiClient.post(`/investigations/${id}/evidence`,body),
  linkIncident:(id:number,body:unknown)=>apiClient.post(`/investigations/${id}/links`,body),
  submit:(id:number)=>apiClient.post(`/investigations/${id}/submit`),
  aiInsights:async(id:number)=>unwrap<AiInsights>(await apiClient.get(`/investigations/${id}/ai-insights`)),
  feedback:(id:number,body:unknown)=>apiClient.post(`/investigations/${id}/ai-feedback`,body),
};
