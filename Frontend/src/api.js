const API_BASE =
  import.meta.env.VITE_API_URL || "/api";


export async function api(
  path,
  {
    token,
    method = "GET",
    body,
    headers = {},
    ...options
  } = {}
) {
  const requestHeaders = {
    ...headers,
  };


  if (body !== undefined) {
    requestHeaders["Content-Type"] =
      "application/json";
  }


  if (token) {
    requestHeaders.Authorization =
      `Bearer ${token}`;
  }


  const response = await fetch(
    `${API_BASE}${path}`,
    {
      method,
      headers: requestHeaders,
      body:
        body !== undefined
          ? JSON.stringify(body)
          : undefined,
      ...options,
    }
  );


  let result = null;

  const contentType =
    response.headers.get(
      "content-type"
    );


  if (
    contentType?.includes(
      "application/json"
    )
  ) {
    result = await response.json();
  } else {
    const text =
      await response.text();

    result = text || null;
  }


  if (!response.ok) {
    const errorMessage =
      result?.detail ||
      result?.error?.code ||
      result?.error?.message ||
      "Request failed";

    const error =
      new Error(errorMessage);

    error.status =
      response.status;

    error.data = result;

    throw error;
  }


  return result;
}


/* =========================================================
   AUTH
   ========================================================= */

export async function getCurrentUser(
  token
) {
  return api(
    "/v1/auth/me",
    {
      token,
    }
  );
}


export async function login(
  email,
  password
) {
  return api(
    "/v1/auth/token",
    {
      method: "POST",
      body: {
        email,
        password,
      },
    }
  );
}


export async function register(
  email,
  password
) {
  return api(
    "/v1/auth/register",
    {
      method: "POST",
      body: {
        email,
        password,
      },
    }
  );
}


/* =========================================================
   QUESTIONS
   ========================================================= */

export async function getQuestions(
  token,
  offset = 0,
  limit = 20
) {
  return api(
    `/v1/questions?offset=${offset}&limit=${limit}`,
    {
      token,
    }
  );
}


export async function getMyQuestions(
  token,
  offset = 0,
  limit = 100
) {
  return api(
    `/v1/questions/mine?offset=${offset}&limit=${limit}`,
    {
      token,
    }
  );
}


export async function createQuestion(
  token,
  text
) {
  return api(
    "/v1/questions",
    {
      token,
      method: "POST",
      body: {
        text,
      },
    }
  );
}


/* =========================================================
   ANSWERS
   ========================================================= */

export async function submitAnswer(
  token,
  questionId,
  content
) {
  return api(
    `/v1/questions/${questionId}/answer`,
    {
      token,
      method: "POST",
      body: {
        content,
      },
    }
  );
}


export async function updateAnswer(
  token,
  questionId,
  content
) {
  return api(
    `/v1/questions/${questionId}/answer`,
    {
      token,
      method: "PUT",
      body: {
        content,
      },
    }
  );
}


/* =========================================================
   CONTRIBUTOR REQUESTS
   ========================================================= */

export async function getMyContributorRequest(
  token
) {
  return api(
    "/v1/contributor-requests/me",
    {
      token,
    }
  );
}


export async function createContributorRequest(
  token,
  reason
) {
  return api(
    "/v1/contributor-requests",
    {
      token,
      method: "POST",
      body: {
        reason: reason || null,
      },
    }
  );
}


export async function getContributorRequests(
  token
) {
  return api(
    "/v1/admin/contributor-requests",
    {
      token,
    }
  );
}


export async function reviewContributorRequest(
  token,
  requestId,
  status
) {
  return api(
    `/v1/admin/contributor-requests/${requestId}`,
    {
      token,
      method: "PUT",
      body: {
        status,
      },
    }
  );
}


/* =========================================================
   ADMIN / USERS
   ========================================================= */

export async function getUsers(
  token
) {
  return api(
    "/v1/admin/users",
    {
      token,
    }
  );
}


export async function updateUserRole(
  token,
  userId,
  role
) {
  return api(
    `/v1/users/${userId}/role`,
    {
      token,
      method: "PUT",
      body: {
        role,
      },
    }
  );
}