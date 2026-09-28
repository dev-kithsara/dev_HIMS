// frontend/src/hooks/useUsers.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as userApi from '../api/user.api';
import toast from 'react-hot-toast';

// Hook to fetch department users
export const useDepartmentUsers = () => {
  return useQuery({
    queryKey: ['users', 'department'],
    queryFn: userApi.getDepartmentUsers,
  });
};

// Hook to change user role
export const useChangeUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, newRole }: { userId: number; newRole: string }) =>
      userApi.changeUserRole(userId, newRole),
    onSuccess: () => {
      // Refresh the users list after a successful role change
      queryClient.invalidateQueries({ queryKey: ['users', 'department'] });
      toast.success('User role updated successfully!');
    },
  });
};
