login: async (email: string, password: string) => {
  try {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });

    if (!response.ok) {
      const err = await response.json();
      return { success: false, message: err.detail || 'Invalid email or password' };
    }

    const data = await response.json(); // get token from backend

    // Fetch user profile using token
    const profileRes = await fetch(`${apiUrl}/auth/me`, {
      headers: { 'Authorization': `Bearer ${data.access_token}` }
    });

    if (!profileRes.ok) {
      return { success: false, message: 'Could not fetch user profile' };
    }

    const userData = await profileRes.json();

    const user: User = {
      id: String(userData.id),
      uniqueId: String(userData.id),
      email: userData.email,
      name: userData.full_name || userData.email,
      role: userData.role.toLowerCase() as UserRole,
      isActive: userData.is_active,
      agreements: [],
      createdAt: new Date(userData.created_at),
      updatedAt: new Date(userData.created_at),
    };

    set({ currentUser: user, isAuthenticated: true });
    return { success: true, message: 'Login successful!' };

  } catch (error) {
    console.error('Backend connection error:', error);
    return { success: false, message: 'Could not connect to backend API' };
  }
},