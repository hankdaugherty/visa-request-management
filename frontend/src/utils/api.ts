const API_URL = import.meta.env.VITE_API_URL;

// No need for BASE_URL with proxy
export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  // Remove any leading slash from endpoint to prevent double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const fullUrl = endpoint.startsWith('http') ? endpoint : `${API_URL}/${cleanEndpoint}`;

  const config: RequestInit = {
    ...options,
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
  };

  // Only add the Authorization header if we have a token
  const token = localStorage.getItem('token');
  if (token && !endpoint.includes('auth/login')) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`
    };
  }

  // Ensure body is properly stringified for POST/PUT requests
  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    console.log('Making API request:', { 
      url: fullUrl, 
      method: config.method,
      headers: config.headers,
      body: config.body 
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

    // Only try to parse JSON if there's content
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
  }
};

// Applications endpoints
export const applications = {
  create: async (data: any) => {
    try {
      console.log('Creating application with data:', data);
      const response = await apiRequest('/api/applications', {
        method: 'POST',
        body: data
      });
      console.log('Application creation response:', response);
      return response;
    } catch (error) {
      console.error('Application creation error:', error);
      throw error;
    }
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

  getAllForAdmin: async () => {
    console.log('Fetching all applications as admin');
    return await apiRequest('/api/applications?admin=true');
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
        method: 'PATCH',
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
