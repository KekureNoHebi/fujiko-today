import * as path from 'path';
import {
  FileUpdate,
  fetchFile,
  batchUpdateFiles,
  defaultGitHubConfig,
} from '@/lib/services/github-api';
import { LANGUAGE_CODES, type LanguageCode } from '@/lib/types/term';
import type { TranslateContentPayload } from '@/lib/schemas/translate-content';
import client from '@/lib/api/client';
import type { components } from '@/lib/api/v1';
import {
  fetchPosts,
  WordPressBlogPost,
  convertPostContentToMarkdown,
} from '@/lib/services/fujiko-museum';

interface UpdateFujikoMuseumResult {
  processedCount: number;
  changedCount: number;
  rawFilesUpdated: number;
  contentFilesUpdated: number;
  translationPayloads: TranslateContentPayload[];
  changedContentIds: number[];
  directusCreated: number;
  directusUpdated: number;
}

const RAW_REPO = {
  owner: process.env.GITHUB_CONTENT_OWNER || '',
  repo: process.env.GITHUB_RAW_REPO || '',
  token: process.env.GITHUB_API_TOKEN || '',
  branch: process.env.GITHUB_RAW_REPO_BRANCH || '',
};

const TARGET_LANGUAGES = LANGUAGE_CODES.filter(
  (lang) => lang !== 'ja',
) as LanguageCode[];

type DirectusContent = components['schemas']['ItemsFujikoMuseumContents'];

function convertJSTtoUTC(jstTime: string): string {
  const date = new Date(jstTime + '+09:00');
  return date.toISOString();
}

const hasContentChanged = async (
  uploadSourcePath: string,
  content: string,
  repoConfig: { owner: string; repo: string; token: string; branch?: string },
) => {
  const result = await fetchFile({
    path: uploadSourcePath,
    ...repoConfig,
  });

  if (result.status === 'not_found') {
    return true;
  }
  if (result.status === 'success' && result.data !== content) {
    return true;
  }
  return false;
};

async function processPost(post: WordPressBlogPost): Promise<{
  json: FileUpdate;
  jsonChanged: boolean;
  markdown?: FileUpdate;
  markdownChanged: boolean;
  postId: number;
}> {
  const postId = post.id;

  const jsonPath = path.join(
    '/fujiko-museum/blog',
    postId.toString(),
    'content.json',
  );
  const jsonContent = JSON.stringify(post, null, 2);
  const jsonOutput: FileUpdate = {
    path: jsonPath,
    content: jsonContent,
  };

  const jsonChanged = await hasContentChanged(jsonPath, jsonContent, RAW_REPO);

  let markdownOutput: FileUpdate | undefined;
  let markdownChanged = false;

  const htmlContent = post.content.rendered;
  if (htmlContent) {
    const markdown = convertPostContentToMarkdown(htmlContent);

    const markdownPath = path.join(
      '/fujiko-museum/blog',
      postId.toString(),
      'ja',
      'content.md',
    );
    markdownOutput = {
      path: markdownPath,
      content: markdown,
    };

    markdownChanged = await hasContentChanged(
      markdownPath,
      markdown,
      defaultGitHubConfig,
    );
  }

  return {
    json: jsonOutput,
    jsonChanged,
    markdown: markdownOutput,
    markdownChanged,
    postId,
  };
}

async function createContent(
  post: WordPressBlogPost,
): Promise<{ success: boolean; error?: unknown }> {
  try {
    const postId = post.id.toString();
    const title = post.title.rendered;
    const link = post.link;
    const thumbnail = post.thumbnail?.url;
    const datePublished = post.date;
    const dateModified = post.modified;

    const payload: DirectusContent = {
      id: postId,
      status: 'published',
      link: link || '',
      thumbnail: thumbnail || null,
      date_published: convertJSTtoUTC(datePublished),
      date_created: convertJSTtoUTC(dateModified),
      date_updated: convertJSTtoUTC(dateModified),
      translations: [
        {
          languages_code: 'ja',
          title: title,
        },
      ],
    };

    const { error } = await client.POST('/items/fujiko_museum_contents', {
      body: payload,
    });

    if (error) {
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

async function updateContent(
  post: WordPressBlogPost,
): Promise<{ success: boolean; error?: unknown }> {
  try {
    const postId = post.id.toString();
    const title = post.title.rendered;
    const link = post.link;
    const thumbnail = post.thumbnail?.url;
    const datePublished = post.date;
    const dateModified = post.modified;

    const contentPayload: DirectusContent = {
      id: postId,
      status: 'published',
      link: link || '',
      thumbnail: thumbnail || null,
      date_published: convertJSTtoUTC(datePublished),
      date_created: convertJSTtoUTC(dateModified),
      date_updated: convertJSTtoUTC(dateModified),
    };

    const { error: contentError } = await client.PATCH(
      '/items/fujiko_museum_contents/{id}',
      {
        params: {
          path: { id: postId },
        },
        body: contentPayload,
      },
    );

    if (contentError) {
      return { success: false, error: contentError };
    }

    const filterQuery = JSON.stringify({
      _and: [
        { fujiko_museum_contents_id: { _eq: postId } },
        { languages_code: { _eq: 'ja' } },
      ],
    });

    const { data: translationsData } = await client.GET(
      '/items/fujiko_museum_contents_translations',
      {
        params: {
          query: {
            filter: filterQuery,
          },
        },
      },
    );

    const existingTranslation = translationsData?.data?.[0];

    if (existingTranslation?.id) {
      await client.PATCH('/items/fujiko_museum_contents_translations/{id}', {
        params: {
          path: { id: existingTranslation.id },
        },
        body: {
          fujiko_museum_contents_id: postId,
          languages_code: 'ja',
          title: title,
        },
      });
    } else {
      await client.POST('/items/fujiko_museum_contents_translations', {
        body: {
          fujiko_museum_contents_id: postId,
          languages_code: 'ja',
          title: title,
        },
      });
    }

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

async function main(): Promise<UpdateFujikoMuseumResult> {
  const { posts, totalPosts } = await fetchPosts({ page: 1 });

  if (!posts || posts.length === 0) {
    console.log('⚠️  No posts found.');
    return {
      processedCount: 0,
      changedCount: 0,
      rawFilesUpdated: 0,
      contentFilesUpdated: 0,
      translationPayloads: [],
      changedContentIds: [],
      directusCreated: 0,
      directusUpdated: 0,
    };
  }

  console.log(
    `Processing ${posts.length} posts (total: ${totalPosts || 'unknown'})...\n`,
  );

  const rawRepoFiles: FileUpdate[] = [];
  const contentsRepoFiles: FileUpdate[] = [];
  const changedContentIds: number[] = [];
  const translationPayloads: TranslateContentPayload[] = [];
  let directusCreated = 0;
  let directusUpdated = 0;

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const progress = `[${i + 1}/${posts.length}]`;

    try {
      console.log(`${progress} Processing post ${post.id}...`);
      const result = await processPost(post);

      const updateResult = await updateContent(post);
      if (updateResult.success) {
        directusUpdated++;
        console.log(`  ✓ Updated in Directus: ${post.id}`);
      } else {
        const createResult = await createContent(post);
        if (createResult.success) {
          directusCreated++;
          console.log(`  ✓ Created in Directus: ${post.id}`);
        } else {
          console.error(
            `  ⚠️  Failed to update/create in Directus for post ${post.id}:`,
            createResult.error,
          );
        }
      }

      if (result.jsonChanged) {
        rawRepoFiles.push(result.json);
        console.log(`  ✓ JSON changed for post ${post.id}`);
      }

      if (result.markdownChanged && result.markdown) {
        contentsRepoFiles.push(result.markdown);
        console.log(`  ✓ Markdown changed for post ${post.id}`);

        for (const targetLang of TARGET_LANGUAGES) {
          const uploadPath = path.join(
            '/fujiko-museum/blog',
            result.postId.toString(),
            targetLang,
            'content.md',
          );

          translationPayloads.push({
            text: result.markdown.content,
            sourceLanguage: 'ja',
            targetLanguage: targetLang,
            uploadPath,
            uploadSourcePath: result.markdown.path,
            revalidatePath: `/${targetLang}/fujiko-museum/blog/${result.postId}`,
          });
        }
      }

      if (result.jsonChanged || result.markdownChanged) {
        changedContentIds.push(result.postId);
      }

      if (i < posts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`${progress} ❌ Failed to process ${post.id}:`, error);
    }
  }

  console.log(`  Total processed: ${posts.length}`);
  console.log(`  Changed posts: ${changedContentIds.length}`);
  console.log(`  RAW repo files to update: ${rawRepoFiles.length}`);
  console.log(`  CONTENTS repo files to update: ${contentsRepoFiles.length}`);
  console.log(
    `  Translation payloads to create: ${translationPayloads.length}`,
  );
  console.log(`  Directus created: ${directusCreated}`);
  console.log(`  Directus updated: ${directusUpdated}`);

  if (changedContentIds.length > 0) {
    console.log(`  Changed post IDs: ${changedContentIds.join(', ')}`);
  }

  if (rawRepoFiles.length > 0) {
    try {
      const rawCommit = await batchUpdateFiles({
        ...RAW_REPO,
        files: rawRepoFiles,
        message: `Update ${rawRepoFiles.length} fujiko-museum posts\n\nPost IDs: ${changedContentIds.join(', ')}`,
      });
      console.log(`  ✓ RAW repo committed: ${rawCommit.sha}`);
    } catch (error) {
      console.error('  ❌ Failed to commit to RAW repo:', error);
    }
  }

  if (contentsRepoFiles.length > 0) {
    try {
      const contentsCommit = await batchUpdateFiles({
        ...defaultGitHubConfig,
        files: contentsRepoFiles,
        message: `Update ${contentsRepoFiles.length} fujiko-museum posts\n\nPost IDs: ${changedContentIds.join(', ')}`,
      });
      console.log(`  ✓ CONTENTS repo committed: ${contentsCommit.sha}`);
    } catch (error) {
      console.error('  ❌ Failed to commit to CONTENTS repo:', error);
    }
  }

  return {
    processedCount: posts.length,
    changedCount: changedContentIds.length,
    rawFilesUpdated: rawRepoFiles.length,
    contentFilesUpdated: contentsRepoFiles.length,
    translationPayloads,
    changedContentIds,
    directusCreated,
    directusUpdated,
  };
}

export { main };
export type { UpdateFujikoMuseumResult };
