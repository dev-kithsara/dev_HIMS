import { apiClient } from './axios';
import type { IncidentStatus } from '../types/incident';
export type StaffForm={title:string;description:string;severity:'LOW'|'MEDIUM'|'HIGH'|'CRITICAL';category:string;subcategory:string;location:string;departmentId:number;occurrenceAt:string};
export interface StaffIncident extends StaffForm{id:number;referenceId:string;status:IncidentStatus;reportedAt:string;createdAt:string;updatedAt:string;managerDecisionType?:string;managerDecisionComment?:string;managerDecisionAt?:string;revisionFields:string[];staffRevisionNumber:number;rejectionReason?:string;closedAt?:string;department:{id:number;name:string};attachments:Array<{id:number;fileName:string;fileType:string;uploadedAt:string}>;timeline:Array<{key:string;type:string;title:string;at:string;detail?:string}>;notifications:Array<{key:string;title:string;detail?:string;at:string}>;statusExplanation:string;staffVersions:Array<{id:number;version:number;createdAt:string;changeReason?:string}>;_count?:{attachments:number}}
export interface StaffList {items:StaffIncident[];summary:{total:number;open:number;inProgress:number;rejected:number;closed:number}}
export interface StaffAssist {modelVersion:string;category:{value:string;subcategories:string[];reason:string};severity:{value:StaffForm['severity'];reason:string};duplicates:{possible:boolean;count:number;highestSimilarity:number;notice:string};completeness:{score:number;missing:string[]};summary:{title:string;text:string};disclaimer:string}
const unwrap=<T>(r:{data:{data:T}})=>r.data.data;
export const staffApi={
  config:async()=>unwrap<{categories:Record<string,string[]>;departments:Array<{id:number;name:string;description?:string}>}>(await apiClient.get('/staff/reporting-config')),
  list:async(params:Record<string,string>)=>unwrap<StaffList>(await apiClient.get('/staff/incidents',{params})),
  detail:async(id:number)=>unwrap<StaffIncident>(await apiClient.get(`/staff/incidents/${id}`)),
  getDraft:async()=>unwrap<(Partial<StaffForm>&{id:number})|null>(await apiClient.get('/staff/draft')),
  saveDraft:async(body:Partial<StaffForm>)=>unwrap(await apiClient.put('/staff/draft',body)),
  deleteDraft:()=>apiClient.delete('/staff/draft'),
  submit:async(form:FormData)=>unwrap<StaffIncident>(await apiClient.post('/staff/incidents',form,{headers:{'Content-Type':'multipart/form-data'}})),
  resubmit:(id:number,body:unknown)=>apiClient.patch(`/staff/incidents/${id}/resubmit`,body),
  assist:async(body:Partial<StaffForm>)=>unwrap<StaffAssist>(await apiClient.post('/staff/assist',body)),
  feedback:(body:unknown)=>apiClient.post('/staff/ai-feedback',body),
  evidence:async(id:number,evidenceId:number)=>apiClient.get(`/incidents/${id}/evidence/${evidenceId}`,{responseType:'blob'}),
};
