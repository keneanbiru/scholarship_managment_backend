const base = 'http://localhost:3000';
const email = `student_${Date.now()}@example.com`;
const password = 'password123';
const newPassword = 'newpass123';

const requestJson = async (method, url, body, token) => {
  const response = await fetch(`${base}${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  let parsed = {};
  try {
    parsed = await response.json();
  } catch (error) {
    parsed = { parseError: error.message };
  }

  return { status: response.status, body: parsed };
};

const run = async () => {
  const out = {};

  out.register = await requestJson('POST', '/api/auth/register', {
    email,
    password,
    role: 'STUDENT'
  });

  out.login = await requestJson('POST', '/api/auth/login', { email, password });
  const token = out.login.body?.data?.token;
  const refreshToken = out.login.body?.data?.refreshToken;

  out.me = await requestJson('GET', '/api/auth/me', null, token);
  out.refresh = await requestJson('POST', '/api/auth/refresh-token', { refreshToken });
  out.logout = await requestJson('POST', '/api/auth/logout', { refreshToken }, token);
  out.meAfterLogout = await requestJson('GET', '/api/auth/me', null, token);

  out.passwordResetRequest = await requestJson('POST', '/api/auth/password-reset-request', { email });
  const resetToken = out.passwordResetRequest.body?.data?.resetToken;
  out.passwordReset = await requestJson('POST', '/api/auth/password-reset', {
    token: resetToken,
    newPassword
  });
  out.loginAfterReset = await requestJson('POST', '/api/auth/login', { email, password: newPassword });

  out.oauthGoogle = await requestJson('GET', '/api/auth/oauth/google');
  out.oauthGoogleCallbackNoCode = await requestJson('GET', '/api/auth/oauth/google/callback');
  out.oauthLinkedIn = await requestJson('GET', '/api/auth/oauth/linkedin');
  out.oauthLinkedInCallbackNoCode = await requestJson('GET', '/api/auth/oauth/linkedin/callback');

  console.log(JSON.stringify(out, null, 2));
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

