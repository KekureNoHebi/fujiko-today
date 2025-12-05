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

interface FileUpdate {
  path: string;
  content: string;
}

interface BatchUpdateOptions {
  owner: string;
  repo: string;
  files: FileUpdate[];
  message: string;
  branch?: string;
  token: string;
}

interface GitHubCommitResponse {
  sha: string;
  url: string;
}

interface GitHubTreeResponse {
  sha: string;
}

interface GitHubRefResponse {
  object: {
    sha: string;
  };
}

export async function batchUpdateFilesOnGitHub({
  owner,
  repo,
  files,
  message,
  branch = 'main',
  token,
}: BatchUpdateOptions): Promise<GitHubCommitResponse> {
  const baseUrl = `https://api.github.com/repos/${owner}/${repo}`;
  const headers = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
  };

  const refResponse = await fetch(`${baseUrl}/git/refs/heads/${branch}`, {
    headers,
  });

  if (!refResponse.ok) {
    throw new Error(
      `Failed to get branch ref: ${refResponse.status} ${refResponse.statusText}`,
    );
  }

  const refData: GitHubRefResponse = await refResponse.json();
  const currentCommitSha = refData.object.sha;

  const tree = files.map((file) => {
    const cleanPath = file.path.startsWith('/')
      ? file.path.slice(1)
      : file.path;

    return {
      path: cleanPath,
      mode: '100644' as const,
      type: 'blob' as const,
      content: file.content,
    };
  });

  const treeResponse = await fetch(`${baseUrl}/git/trees`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      base_tree: currentCommitSha,
      tree,
    }),
  });

  if (!treeResponse.ok) {
    const errorText = await treeResponse.text();
    throw new Error(
      `Failed to create tree: ${treeResponse.status} ${treeResponse.statusText} - ${errorText}`,
    );
  }

  const treeData: GitHubTreeResponse = await treeResponse.json();

  const commitResponse = await fetch(`${baseUrl}/git/commits`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message,
      tree: treeData.sha,
      parents: [currentCommitSha],
    }),
  });

  if (!commitResponse.ok) {
    const errorText = await commitResponse.text();
    throw new Error(
      `Failed to create commit: ${commitResponse.status} ${commitResponse.statusText} - ${errorText}`,
    );
  }

  const commitData: GitHubCommitResponse = await commitResponse.json();

  const updateRefResponse = await fetch(`${baseUrl}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      sha: commitData.sha,
    }),
  });

  if (!updateRefResponse.ok) {
    const errorText = await updateRefResponse.text();
    throw new Error(
      `Failed to update branch ref: ${updateRefResponse.status} ${updateRefResponse.statusText} - ${errorText}`,
    );
  }

  return commitData;
}

export async function batchUpdateFilesOnConfiguredRepo(
  files: FileUpdate[],
  message: string,
  branch = 'main',
): Promise<GitHubCommitResponse> {
  return batchUpdateFilesOnGitHub({
    owner: githubConfig.owner,
    repo: githubConfig.repo,
    files,
    message,
    branch,
    token: githubConfig.token,
  });
}
