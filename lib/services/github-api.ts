interface GitHubFileResponse {
  content: string;
  encoding: string;
  sha: string;
}

interface FetchFromGitHubOptions {
  owner: string;
  repo: string;
  path: string;
  branch?: string;
  token?: string;
}

export type FetchFileResult =
  | { status: 'success'; data: string }
  | { status: 'not_found'; message: string }
  | { status: 'error'; message: string };

export const defaultGitHubConfig = {
  owner: process.env.GITHUB_CONTENT_OWNER || '',
  repo: process.env.GITHUB_CONTENT_REPO || '',
  token: process.env.GITHUB_API_TOKEN || '',
  branch: process.env.GITHUB_CONTENT_REPO_BRANCH || '',
};

export async function fetchFile({
  owner,
  repo,
  path,
  branch,
  token,
}: FetchFromGitHubOptions): Promise<FetchFileResult> {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  let url = `https://api.github.com/repos/${owner}/${repo}/contents/${cleanPath}`;

  if (branch) {
    url += `?ref=${encodeURIComponent(branch)}`;
  }

  const headers: HeadersInit = {
    Accept: 'application/vnd.github.object',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      headers,
      next: { revalidate: 3600 },
    });

    if (response.status === 404) {
      return {
        status: 'not_found',
        message: `File not found: ${path}`,
      };
    }

    if (!response.ok) {
      return {
        status: 'error',
        message: `GitHub API error: ${response.status} ${response.statusText}`,
      };
    }

    const data: GitHubFileResponse = await response.json();

    if (data.encoding !== 'base64') {
      return {
        status: 'error',
        message: `Unexpected encoding: ${data.encoding}`,
      };
    }

    const decoded = Buffer.from(data.content, 'base64').toString('utf-8');
    return {
      status: 'success',
      data: decoded,
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export interface FileUpdate {
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

export async function batchUpdateFiles({
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
