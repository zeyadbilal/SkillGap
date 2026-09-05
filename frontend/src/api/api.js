const API_URL = import.meta.env.VITE_API_URL || "/api";

/* ======================================================
   FRIENDLY ERROR HANDLING
====================================================== */

function createFriendlyError(message, status = null) {
  const error = new Error(message);

  error.status = status;
  error.isFriendly = true;

  return error;
}

function getServerErrorMessage(data, status) {
  const backendMessage =
    data?.error?.message ||
    data?.message ||
    (typeof data?.error === "string" ? data.error : "");

  /* ================= AUTH ERRORS ================= */

  if (status === 401) {
    return "Your session has expired or your login details are incorrect. Please log in again.";
  }

  if (status === 403) {
    return "You do not have permission to perform this action.";
  }

  /* ================= FILE ERRORS ================= */

  if (status === 413) {
    return "The selected file is too large. Please upload a file smaller than 10 MB.";
  }

  if (status === 415) {
    return "This file type is not supported. Please upload a PDF, DOCX or TXT file.";
  }

  if (status === 422) {
    if (data?.errorCode === "NO_SKILLS_DETECTED") {
      return "We couldn't detect any skills in this document. It doesn't look like a resume — please upload your CV.";
    }

    if (backendMessage.toLowerCase().includes("cv")) {
      return "We couldn't read this CV properly. Please try another PDF, DOCX or TXT file.";
    }

    return (
      backendMessage ||
      "Some of the information provided could not be processed. Please check it and try again."
    );
  }

  /* ================= SERVER ERRORS ================= */

  if (status === 500) {
    return "Something went wrong on our server. Please try again shortly.";
  }

  if (status === 502) {
    return "One of our services is temporarily unavailable. Please try again shortly.";
  }

  if (status === 503) {
    return "The service is temporarily unavailable. Please try again shortly.";
  }

  if (status === 504) {
    return "The request took too long to complete. Please try again.";
  }

  /* ================= OTHER BACKEND ERRORS ================= */

  if (backendMessage) {
    const lowerMessage = backendMessage.toLowerCase();

    if (
      lowerMessage.includes("invalid credentials") ||
      lowerMessage.includes("incorrect password")
    ) {
      return "The email or password you entered is incorrect.";
    }

    if (
      lowerMessage.includes("already exists") ||
      lowerMessage.includes("email already")
    ) {
      return "An account with this email already exists.";
    }

    if (lowerMessage.includes("not found")) {
      return "We couldn't find what you were looking for.";
    }

    if (lowerMessage.includes("file too large")) {
      return "The selected file is too large. Please upload a file smaller than 10 MB.";
    }

    if (
      lowerMessage.includes("unsupported file") ||
      lowerMessage.includes("invalid file type")
    ) {
      return "This file type is not supported. Please upload a PDF, DOCX or TXT file.";
    }

    if (
      lowerMessage.includes("could not be parsed") ||
      lowerMessage.includes("no readable text")
    ) {
      return "We couldn't read this CV properly. Please try another PDF, DOCX or TXT file.";
    }

    /*
      Safe backend validation messages can still
      be shown to the user.
    */

    if (status >= 400 && status < 500) {
      return backendMessage;
    }
  }

  return "Something went wrong. Please try again.";
}

/* ======================================================
   SESSION HELPERS
===================================================== */

function clearAuthStorage() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
}

function handleSessionExpired() {
  clearAuthStorage();

  const { pathname } = window.location;

  if (pathname !== "/login" && pathname !== "/register") {
    window.location.assign("/login");
  }
}

/* ======================================================
   MAIN REQUEST FUNCTION
===================================================== */

async function request(endpoint, options = {}, retried = false) {
  const { skipAuthRefresh, ...fetchOptions } = options;

  const token = localStorage.getItem("accessToken");

  const isFormData = fetchOptions.body instanceof FormData;

  let response;

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...fetchOptions,

      headers: {
        ...(isFormData
          ? {}
          : {
              "Content-Type": "application/json",
            }),

        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),

        ...(fetchOptions.headers || {}),
      },
    });
  } catch (error) {
    console.error("Network request failed:", error);

    throw createFriendlyError(
      "We couldn't connect to the server. Please try again in a moment.",
    );
  }

  /* ======================================================
     SAFELY READ RESPONSE
  ====================================================== */

  let data = null;

  const contentType = response.headers.get("content-type");

  try {
    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();

      data = text
        ? {
            message: text,
          }
        : null;
    }
  } catch (error) {
    console.error("Could not read server response:", error);

    if (!response.ok) {
      throw createFriendlyError(
        "The server could not complete your request. Please try again.",
        response.status,
      );
    }

    throw createFriendlyError(
      "We received an unexpected response from the server. Please try again.",
      response.status,
    );
  }

  /* ======================================================
     HANDLE UNSUCCESSFUL RESPONSES
  ====================================================== */

  if (!response.ok) {
    if (
      response.status === 401 &&
      !retried &&
      !skipAuthRefresh &&
      token
    ) {
      try {
        await refreshAccessToken();

        return request(endpoint, fetchOptions, true);
      } catch (refreshError) {
        handleSessionExpired();
        throw refreshError;
      }
    }

    if (response.status === 401 && !skipAuthRefresh && token) {
      handleSessionExpired();
    }

    const friendlyMessage = getServerErrorMessage(data, response.status);

    throw createFriendlyError(friendlyMessage, response.status);
  }

  return data;
}

/* ======================================================
   AUTH
====================================================== */

// Register
export const registerUser = (userData) => {
  return request("/auth/register", {
    method: "POST",
    skipAuthRefresh: true,
    body: JSON.stringify(userData),
  });
};

// Login
export const loginUser = (userData) => {
  return request("/auth/login", {
    method: "POST",
    skipAuthRefresh: true,
    body: JSON.stringify(userData),
  });
};

// Get current user
export const getCurrentUser = () => {
  return request("/auth/me");
};

/* ======================================================
   REFRESH TOKEN
====================================================== */

export const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) {
    throw createFriendlyError(
      "Your session has expired. Please log in again.",
      401,
    );
  }

  const data = await request("/auth/refresh", {
    method: "POST",
    skipAuthRefresh: true,
    body: JSON.stringify({
      refreshToken,
    }),
  });

  /*
      Support either of these backend response shapes:

      data.data.tokens.accessToken

      OR

      data.data.accessToken
    */

  const newAccessToken =
    data?.data?.tokens?.accessToken || data?.data?.accessToken;

  const newRefreshToken =
    data?.data?.tokens?.refreshToken || data?.data?.refreshToken;

  if (!newAccessToken) {
    throw createFriendlyError(
      "Your session could not be refreshed. Please log in again.",
      401,
    );
  }

  localStorage.setItem("accessToken", newAccessToken);

  if (newRefreshToken) {
    localStorage.setItem("refreshToken", newRefreshToken);
  }

  return data;
};

/* ======================================================
   LOGOUT
====================================================== */

export const logoutUser = () => {
  const refreshToken = localStorage.getItem("refreshToken");

  return request("/auth/logout", {
    method: "POST",
    skipAuthRefresh: true,
    body: JSON.stringify({
      refreshToken,
    }),
  });
};

/* ======================================================
   CV ANALYSIS
====================================================== */

// Analyze CV file
export const analyzeCv = (file) => {
  const formData = new FormData();

  formData.append("file", file);

  return request("/recommendations/analyze", {
    method: "POST",
    body: formData,
  });
};

// Analyze pasted CV text
export const analyzeCvText = (cvText) => {
  return request("/recommendations/analyze", {
    method: "POST",

    body: JSON.stringify({
      cvText,
    }),
  });
};
