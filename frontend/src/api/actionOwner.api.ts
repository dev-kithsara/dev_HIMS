import { apiClient } from './axios';

export type ActionStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type ReviewStatus = 'ACTIVE' | 'RETURNED_FOR_REVISION' | 'COMPLETED_PENDING_VERIFICATION' | 'VERIFIED';
export interface ActionItem {
  id:number; title:string; description:string; type:'IMMEDIATE'|'CORRECTIVE'|'PREVENTIVE'; priority:'LOW'|'MEDIUM'|'HIGH'|'CRITICAL';
  status:ActionStatus; reviewStatus:ReviewStatus; dueDate:string; completedAt?:string; progressNote?:string; verificationNotes?:string;
  managerReviewComment?:string; effectiveness:string; effectivenessScore?:number; overdue:boolean; dueInDays:number;
  completionRisk:{score:number;level:string;factors:string[];modelVersion:string};
  incident:{id:number;title:string;description?:string;severity:string;category:string;status:string;location?:string;department:{name:string};investigator?:{id:number;name:string}};
  evidence?:Array<{id:number;fileName:string;fileType:string;fileSize:number;uploadedAt:string}>;
  history?:Array<{id:number;eventType:string;fromStatus?:string;toStatus?:string;note?:string;createdAt:string;actor?:{name:string}}>;
}
export interface ActionDashboard { items:ActionItem[]; summary:{total:number;open:number;inProgress:number;overdue:number;revisions:number}; notifications:Array<{id:number;actionId:number;type:string;title:string;message:string;readAt?:string;createdAt:string}> }
export interface ActionInsights { modelVersion:string; completionRisk:ActionItem['completionRisk']; similarActions:Array<ActionItem & {similarityScore:number}>; recurringLowEffectiveness:Array<ActionItem & {similarityScore:number}>; recommendations:Array<{key:string;title:string;description:string;effectiveness:string;effectivenessScore?:number;sourceIncident:{id:number;title:string}}> }
const unwrap=<T>(response:{data:{data:T}})=>response.data.data;
export const actionOwnerApi={
  dashboard:async(params:Record<string,string>)=>unwrap<ActionDashboard>(await apiClient.get('/action-owner/dashboard',{params})),
  detail:async(id:number)=>unwrap<ActionItem>(await apiClient.get(`/action-owner/actions/${id}`)),
  progress:(id:number,body:unknown)=>apiClient.patch(`/action-owner/actions/${id}/progress`,body),
  resubmit:(id:number,body:unknown)=>apiClient.post(`/action-owner/actions/${id}/resubmit`,body),
  evidence:(id:number,file:File)=>{const form=new FormData();form.append('evidence',file);return apiClient.post(`/action-owner/actions/${id}/evidence`,form)},
  viewEvidence:async(id:number,evidenceId:number)=>apiClient.get(`/action-owner/actions/${id}/evidence/${evidenceId}`,{responseType:'blob'}),
  insights:async(id:number)=>unwrap<ActionInsights>(await apiClient.get(`/action-owner/actions/${id}/ai-insights`)),
  feedback:(id:number,body:unknown)=>apiClient.post(`/action-owner/actions/${id}/ai-feedback`,body),
};
