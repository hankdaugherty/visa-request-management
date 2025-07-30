import { Application, User, Meeting } from '../types';

const API_URL = import.meta.env.VITE_API_URL;

// No need for BASE_URL with proxy
export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const fullUrl = endpoint.startsWith('http') ? endpoint : `${API_URL}/${cleanEndpoint}`;

  const config: RequestInit = {
    ...options,
    method: options.method || 'GET',
  };

  // Only set Content-Type if not FormData
  if (!(options.body instanceof FormData)) {
    config.headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
  } else {
    config.headers = {
      ...options.headers,
    };
  }

  // Add authorization header
  const token = localStorage.getItem('token');
  if (token && !endpoint.includes('auth/login')) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`
    };
  }

  // Only stringify body if not FormData
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  } else {
    config.body = options.body;
  }

  try {
    console.log('Making API request:', {
      url: fullUrl,
      method: config.method,
      headers: config.headers,
      body: config.body instanceof FormData ? '[FormData]' : config.body
    });

    const response = await fetch(fullUrl, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Response Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.message || 'Request failed');
      } catch (e) {
        throw new Error(`Request failed: ${response.status} - ${errorText}`);
      }
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    
    return response;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
}

// Auth endpoints
export const auth = {
  login: async (email: string, password: string) => {
    try {
      return await apiRequest('api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: { email, password }
      });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  register: async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    try {
      return await apiRequest('api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: userData
      });
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  createUser: async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    isAdmin: boolean;
  }) => {
    return await apiRequest('/api/users', {
      method: 'POST',
      body: userData
    });
  },

  getUsers: async () => {
    return await apiRequest('/api/users');
  },

  updateUserRole: async (userId: string, isAdmin: boolean) => {
    return await apiRequest(`/api/users/${userId}/role`, {
      method: 'PUT',
      body: { isAdmin }
    });
  },

  deleteUser: async (userId: string) => {
    return await apiRequest(`/api/users/${userId}`, {
      method: 'DELETE'
    });
  },

  requestPasswordReset: async (email: string) => {
    return await apiRequest('api/auth/forgot-password', {
      method: 'POST',
      body: { email }
    });
  },

  resetPassword: async (token: string, password: string) => {
    return await apiRequest(`api/auth/reset-password/${token}`, {
      method: 'POST',
      body: { password }
    });
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    return await apiRequest('api/auth/change-password', {
      method: 'POST',
      body: { currentPassword, newPassword }
    });
  },

  changeUserPassword: async (userId: string, newPassword: string) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${userId}/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ password: newPassword })
    });

    if (!response.ok) {
      throw new Error('Failed to change password');
    }

    return response.json();
  },

  updateUser: async (userId: string, userData: { firstName: string; lastName: string; email: string }) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      throw new Error('Failed to update user');
    }

    return response.json();
  }
};

// Applications endpoints
export const applications = {
  create: async (data: Partial<Application>): Promise<Application> => {
    return apiRequest('/api/applications', {
      method: 'POST',
      body: data
    });
  },
    
  getAll: () => 
    apiRequest('/api/applications'),
    
  uploadDocument: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest(`/api/upload/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': undefined, // Let the browser set the correct content type for FormData
      },
      body: formData,
    });
  },
  
  getById: (id: string) => 
    apiRequest(`/api/applications/${id}`),
  
  update: async (id: string, data: any) => {
    try {
      console.log('Updating application:', { id, data });
      const response = await apiRequest(`/api/applications/${id}`, {
        method: 'PUT',
        body: data
      });
      console.log('Application update response:', response);
      return response;
    } catch (error) {
      console.error('Application update error:', error);
      throw error;
    }
  },

  delete: async (id: string) => {
    return await apiRequest(`/api/applications/${id}`, {
      method: 'DELETE'
    });
  },

  getAllForAdmin: async (page = 1, meetingId?: string, sortBy?: string, sortDirection?: string) => {
    let url = `api/applications?admin=true&page=${page}&limit=10`;
    if (meetingId) url += `&meetingId=${meetingId}`;
    if (sortBy) url += `&sortBy=${sortBy}`;
    if (sortDirection) url += `&sortDirection=${sortDirection}`;
    const response = await apiRequest(url);
    return {
      applications: response.applications || [],
      pagination: response.pagination || { total: 0, page: 1, pages: 1 }
    };
  },

  getStats: async (meetingId?: string) => {
    let url = 'api/applications/stats';
    if (meetingId) url += `?meetingId=${meetingId}`;
    return await apiRequest(url);
  },

  import: async (file: File) => {
    console.log('Preparing to import file:', file.name);
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest('/api/applications/import', {
      method: 'POST',
      body: formData,
    });
  },
};

export const fetchMeetings = async () => {
  const response = await apiRequest('/api/meetings');
  return response;
};

export const meetings = {
  getAll: async () => {
    try {
      return await apiRequest('/api/meetings');
    } catch (error) {
      console.error('Error fetching meetings:', error);
      throw error;
    }
  },

  create: async (meetingData: {
    name: string;
    startDate: string;
    endDate: string;
    location: string;
    isActive: boolean;
  }) => {
    try {
      return await apiRequest('/api/meetings', {
        method: 'POST',
        body: meetingData
      });
    } catch (error) {
      console.error('Error creating meeting:', error);
      throw error;
    }
  },

  update: async (id: string, meetingData: {
    name?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
    isActive?: boolean;
  }) => {
    try {
      return await apiRequest(`/api/meetings/${id}`, {
        method: 'PUT',
        body: meetingData
      });
    } catch (error) {
      console.error('Error updating meeting:', error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      return await apiRequest(`/api/meetings/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting meeting:', error);
      throw error;
    }
  },

  getActive: async () => {
    return await apiRequest('/api/meetings/active', {
      method: 'GET'
    });
  }
};
