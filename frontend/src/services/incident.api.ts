import { apiClient } from '../api/axios';

export const createIncident = async (formData: FormData) => {
  const response = await apiClient.post('/incidents', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};
