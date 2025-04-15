const API_URL = import.meta.env.VITE_API_URL;

// No need for BASE_URL with proxy
export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const fullUrl = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

  const config: RequestInit = {
    ...options,
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {})
    },
  };

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
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    return response.json();
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
};
