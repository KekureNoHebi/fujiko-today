interface GitHubFileResponse {
  content: string;
  encoding: string;
  sha: string;
}

interface FetchFromGitHubOptions {
  owner: string;
  repo: string;
  path: string;
  token?: string;
}

export const githubConfig = {
  owner: process.env.GITHUB_CONTENT_OWNER || '',
  repo: process.env.GITHUB_CONTENT_REPO || '',
  token: process.env.GITHUB_API_TOKEN || '',
} as const;

async function fetchFileMetadata({
  owner,
  repo,
  path,
  token,
}: FetchFromGitHubOptions): Promise<GitHubFileResponse> {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${cleanPath}`;

  const headers: HeadersInit = {
    Accept: 'application/vnd.github.object',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions: RequestInit = { headers };

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch file from GitHub: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

export async function fetchFromGitHub({
  owner,
  repo,
  path,
  token,
}: FetchFromGitHubOptions): Promise<string> {
  const data = await fetchFileMetadata({ owner, repo, path, token });

  if (data.encoding !== 'base64') {
    throw new Error(`Unexpected encoding: ${data.encoding}`);
  }

  const decoded = Buffer.from(data.content, 'base64').toString('utf-8');
  return decoded;
}

export async function fetchMarkdownFromGitHub(
  options: FetchFromGitHubOptions,
): Promise<string> {
  return fetchFromGitHub(options);
}

export async function fetchMarkdownFromConfiguredRepo(
  path: string,
): Promise<string> {
  return fetchFromGitHub({
    owner: githubConfig.owner,
    repo: githubConfig.repo,
    path,
    token: githubConfig.token,
  });
}

interface UpdateFileOptions {
  owner: string;
  repo: string;
  path: string;
  content: string;
  message: string;
  sha?: string;
  token: string;
}

export async function updateFileOnGitHub({
  owner,
  repo,
  path,
  content,
  message,
  sha,
  token,
}: UpdateFileOptions) {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${cleanPath}`;

  const encodedContent = Buffer.from(content, 'utf-8').toString('base64');

  const body: {
    message: string;
    content: string;
    sha?: string;
  } = {
    message,
    content: encodedContent,
  };

  if (sha) {
    body.sha = sha;
  }

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to update file on GitHub: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  return response.json();
}

export async function updateFileOnConfiguredRepo(
  path: string,
  content: string,
  message: string,
) {
  let currentSha: string | undefined;

  try {
    const data = await fetchFileMetadata({
      owner: githubConfig.owner,
      repo: githubConfig.repo,
      path,
      token: githubConfig.token,
    });
    currentSha = data.sha;
  } catch {
    // File doesn't exist, will create new file
  }

  return updateFileOnGitHub({
    owner: githubConfig.owner,
    repo: githubConfig.repo,
    path,
    content,
    message,
    sha: currentSha,
    token: githubConfig.token,
  });
}
