interface OpenListAuthResponse {
  code: number;
  message: string;
  data: {
    token: string;
  };
}

interface OpenListUploadResponse {
  code: number;
  message: string;
}

interface OpenListConfig {
  baseUrl: string;
  username: string;
  password: string;
}

let cachedToken: string | null = null;

async function authenticate(config: OpenListConfig): Promise<string> {
  const response = await fetch(`${config.baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: config.username,
      password: config.password,
    }),
  });

  if (!response.ok) {
    throw new Error(`Authentication failed: ${response.statusText}`);
  }

  const data: OpenListAuthResponse = await response.json();

  if (data.code !== 200) {
    throw new Error(`Authentication failed: ${data.message}`);
  }

  const token = data.data.token;
  cachedToken = token;
  return token;
}

async function getToken(config: OpenListConfig): Promise<string> {
  if (cachedToken) {
    return cachedToken;
  }
  return authenticate(config);
}

export async function uploadMarkdown(
  content: string,
  filePath: string,
  config: OpenListConfig,
): Promise<OpenListUploadResponse> {
  const buffer = Buffer.from(content, 'utf-8');

  const encodedPath = encodeURIComponent(filePath);

  let token = await getToken(config);

  const uploadRequest = async (authToken: string) => {
    return fetch(`${config.baseUrl}/api/fs/put`, {
      method: 'PUT',
      headers: {
        Authorization: authToken,
        'File-Path': encodedPath,
      },
      body: buffer,
    });
  };

  let response = await uploadRequest(token);

  if (!response.ok || response.status === 401) {
    cachedToken = null;
    token = await authenticate(config);
    response = await uploadRequest(token);
  }

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  const data: OpenListUploadResponse = await response.json();

  if (data.code !== 200) {
    throw new Error(`Upload failed: ${data.message}`);
  }

  return data;
}

export async function uploadMarkdownWithEnv(
  content: string,
  filePath: string,
): Promise<OpenListUploadResponse> {
  const config: OpenListConfig = {
    baseUrl: process.env.CONTENTS_URL || '',
    username: process.env.OPENLIST_USERNAME || '',
    password: process.env.OPENLIST_PASSWORD || '',
  };

  if (!config.baseUrl || !config.username || !config.password) {
    throw new Error(
      'Missing OpenList configuration. Please set CONTENTS_URL, OPENLIST_USERNAME, and OPENLIST_PASSWORD environment variables.',
    );
  }

  return uploadMarkdown(content, filePath, config);
}
