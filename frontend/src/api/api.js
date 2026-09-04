const API_URL = import.meta.env.VITE_API_URL || "/api";
async function request(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error?.message || data.error || "Something went wrong",
    );
  }

  return data;
}

// Register
export const registerUser = (userData) => {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
};

// Login
export const loginUser = (userData) => {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(userData),
  });
};

// Get current user
export const getCurrentUser = () => {
  const token = localStorage.getItem("accessToken");

  return request("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// Refresh token
export const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");

  const data = await request("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });

  localStorage.setItem("accessToken", data.data.tokens.accessToken);
  localStorage.setItem("refreshToken", data.data.tokens.refreshToken);

  return data;
};
// Logout
export const logoutUser = () => {
  const refreshToken = localStorage.getItem("refreshToken");

  return request("/auth/logout", {
    method: "POST",
    body: JSON.stringify({
      refreshToken,
    }),
  });
};
