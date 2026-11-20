import { queryOptions } from '@tanstack/react-query';
import { getPublicData, getWorkspace, getAdminData } from './data.functions';
export const publicOptions = queryOptions({ queryKey: ['public'], queryFn: () => getPublicData(), staleTime: 60000, retry: false });
export const workspaceOptions = queryOptions({ queryKey: ['workspace'], queryFn: () => getWorkspace(), retry: false });
export const adminOptions = queryOptions({ queryKey: ['admin'], queryFn: () => getAdminData(), retry: false });
