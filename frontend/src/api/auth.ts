import apiClient from './client';

export const loginApi = async (email: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const { data } = await apiClient.post('/auth/login', formData.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return data; // { access_token, token_type, user }
};

export const registerApi = async (payload: {
    email: string;
    password: string;
    full_name: string;
    role: string;
}) => {
    const { data } = await apiClient.post('/auth/register', payload);
    return data;
};

export const getMeApi = async () => {
    const { data } = await apiClient.get('/auth/me');
    return data;
};
