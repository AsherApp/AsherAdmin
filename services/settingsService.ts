import api from '../config/api';

export type AdminProfile = {
  firstName?: string | null; lastName?: string | null; fullname?: string | null;
  title?: string | null; profileUrl?: string | null;
  users?: { email?: string }; user?: { email?: string };
};
export type NotificationPreference = {
  category: string;
  channels: Array<'EMAIL' | 'SMS' | 'IN_APP' | 'PUSH'>;
  [key: string]: unknown;
};
const unwrap = (value: any): any => value?.data?.data ?? value?.data ?? value;

export const getMyProfile = async (): Promise<AdminProfile> => unwrap(await api.get('/profile'));
export const updateMyProfile = async (data: Pick<AdminProfile, 'firstName' | 'lastName' | 'title'>): Promise<AdminProfile> => {
  const form = new FormData();
  Object.entries(data).forEach(([key, value]) => { if (typeof value === 'string') form.append(key, value); });
  return unwrap(await api.postFormData('/profile/update', form));
};
export const updateMyPassword = async (oldPassword: string, newPassword: string): Promise<void> => {
  await api.post('/auth/update-password', { oldPassword, newPassword });
};
export const getMyNotificationPreferences = async (): Promise<NotificationPreference[]> => {
  const response = unwrap(await api.get('/notification/preferences/mine'));
  return Array.isArray(response) ? response : [];
};
export const saveMyNotificationPreferences = async (preferences: NotificationPreference[]): Promise<void> => {
  await api.post('/notification/preferences', { preferences });
};
