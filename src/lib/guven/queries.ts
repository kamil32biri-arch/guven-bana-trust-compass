import { queryOptions } from '@tanstack/react-query';
import { getPublicData, getWorkspace, getAdminData, getBusinessPage, getOwnedBusiness } from './data.functions';
export const publicOptions = queryOptions({ queryKey: ['public'], queryFn: () => getPublicData(), staleTime: 60000, retry: false });
export const workspaceOptions = queryOptions({ queryKey: ['workspace'], queryFn: () => getWorkspace(), retry: false });
export const adminOptions = queryOptions({ queryKey: ['admin'], queryFn: () => getAdminData(), retry: false });
export const businessOptions = (id:string) => queryOptions({ queryKey:['business',id], queryFn:()=>getBusinessPage({data:{id}}), retry:false });
export const ownerOptions = (id:string) => queryOptions({ queryKey:['owner',id], queryFn:()=>getOwnedBusiness({data:{id}}), retry:false });
