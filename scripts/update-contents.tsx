import * as path from 'path';
import {
  fetchBuildId,
  fetchContents,
  processContentHtmlToMarkdown,
} from '../lib/services/dora-world';
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

interface UpdateContentsResult {
  processedCount: number;
  changedCount: number;
  rawFilesUpdated: number;
  contentFilesUpdated: number;
  translationPayloads: TranslateContentPayload[];
  changedContentIds: number[];
  directusCreated: number;
  directusUpdated: number;
}

const BASE_URL = 'https://www.dora-world.com';
const LATEST_COUNT = 30;

const RAW_REPO = {
  owner: process.env.GITHUB_CONTENT_OWNER || '',
  repo: process.env.GITHUB_RAW_REPO || '',
  token: process.env.GITHUB_API_TOKEN || '',
  branch: process.env.GITHUB_RAW_REPO_BRANCH || '',
};

const TARGET_LANGUAGES = LANGUAGE_CODES.filter(
  (lang) => lang !== 'ja',
) as LanguageCode[];

const PROPERTIES_TO_REMOVE = [
  'flg_hot',
  'flg_pr',
  'flg_new',
  'flg_window',
  'flg_terminated',
] as const;

type DirectusContent = components['schemas']['ItemsDoraWorldContents'];

function convertJSTtoUTC(jstTime: string): string {
  const date = new Date(jstTime + '+09:00');
  return date.toISOString();
}

interface ContentMetadata {
  id: number;
  title: string;
  flg_hot?: boolean;
  flg_pr?: boolean;
  flg_new?: boolean;
  flg_window?: boolean;
  flg_terminated?: boolean;
  publish_at?: string;
  page_url?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
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

function removeProperties(obj: ContentMetadata): Record<string, unknown> {
  const cleaned = { ...obj };
  for (const prop of PROPERTIES_TO_REMOVE) {
    delete cleaned[prop];
  }
  return cleaned;
}

async function fetchContentDetail(nextBuildId: string, contentId: number) {
  const response = await fetch(
    `${BASE_URL}/_next/data/${nextBuildId}/contents/${contentId}.json`,
  );
  return await response.json();
}

async function processContent(
  buildId: string,
  metadata: ContentMetadata,
): Promise<{
  json: FileUpdate;
  jsonChanged: boolean;
  markdown?: FileUpdate;
  markdownChanged: boolean;
  contentId: number;
}> {
  const contentId = metadata.id;

  const cleanedMetadata = removeProperties(metadata);

  let merged: Record<string, unknown>;
  let detail;

  try {
    detail = await fetchContentDetail(buildId, contentId);

    merged = {
      ...cleanedMetadata,
      pageProps: {
        content: detail.pageProps.content,
      },
    };
  } catch {
    console.log(
      `  ⚠️  Failed to fetch detail for ${contentId}, saving without pageProps`,
    );
    merged = cleanedMetadata;
  }

  const jsonPath = path.join(
    '/dora-world/contents',
    contentId.toString(),
    'content.json',
  );
  const jsonContent = JSON.stringify(merged, null, 2);
  const jsonOutput: FileUpdate = {
    path: jsonPath,
    content: jsonContent,
  };

  const jsonChanged = await hasContentChanged(jsonPath, jsonContent, RAW_REPO);

  let markdownOutput: FileUpdate | undefined;
  let markdownChanged = false;

  if (detail) {
    const htmlContent = detail.pageProps?.content?.content;
    if (htmlContent) {
      const markdown = processContentHtmlToMarkdown(htmlContent);

      const markdownPath = path.join(
        '/dora-world/contents',
        contentId.toString(),
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
  }

  return {
    json: jsonOutput,
    jsonChanged,
    markdown: markdownOutput,
    markdownChanged,
    contentId,
  };
}

async function createContent(
  metadata: ContentMetadata,
): Promise<{ success: boolean; error?: unknown }> {
  try {
    const contentId = metadata.id.toString();
    const title = metadata.title;
    const publishAt = metadata.publish_at;
    const pageUrl = metadata.page_url;
    const imageUrl = metadata.image_url;
    const createdAt = metadata.created_at;
    const updatedAt = metadata.updated_at;

    const payload: DirectusContent = {
      id: contentId,
      status: 'published',
      page_url: pageUrl || '',
      image_url: imageUrl || '',
      date_published: publishAt ? convertJSTtoUTC(publishAt) : undefined,
      date_created: createdAt,
      date_updated: updatedAt,
      translations: [
        {
          languages_code: 'ja',
          title: title,
        },
      ],
    };

    const { error } = await client.POST('/items/dora_world_contents', {
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
  metadata: ContentMetadata,
): Promise<{ success: boolean; error?: unknown }> {
  try {
    const contentId = metadata.id.toString();
    const title = metadata.title;
    const publishAt = metadata.publish_at;
    const pageUrl = metadata.page_url;
    const imageUrl = metadata.image_url;
    const createdAt = metadata.created_at;
    const updatedAt = metadata.updated_at;

    const contentPayload: DirectusContent = {
      id: contentId,
      status: 'published',
      page_url: pageUrl || '',
      image_url: imageUrl || '',
      date_published: publishAt ? convertJSTtoUTC(publishAt) : undefined,
      date_created: createdAt,
      date_updated: updatedAt,
    };

    const { error: contentError } = await client.PATCH(
      '/items/dora_world_contents/{id}',
      {
        params: {
          path: { id: contentId },
        },
        body: contentPayload,
      },
    );

    if (contentError) {
      return { success: false, error: contentError };
    }

    const filterQuery = JSON.stringify({
      _and: [
        { dora_world_contents_id: { _eq: contentId } },
        { languages_code: { _eq: 'ja' } },
      ],
    });

    const { data: translationsData } = await client.GET(
      '/items/dora_world_contents_translations',
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
      await client.PATCH('/items/dora_world_contents_translations/{id}', {
        params: {
          path: { id: existingTranslation.id },
        },
        body: {
          dora_world_contents_id: contentId,
          languages_code: 'ja',
          title: title,
        },
      });
    } else {
      await client.POST('/items/dora_world_contents_translations', {
        body: {
          dora_world_contents_id: contentId,
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

async function main(): Promise<UpdateContentsResult> {
  const buildId = await fetchBuildId();
  const data = await fetchContents({
    nextBuildId: buildId,
    topic: 'contents',
    page: 1,
  });

  const contents = data.contents;

  if (!contents || contents.length === 0) {
    console.log('⚠️  No contents found.');
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

  const latestContents = contents.slice(0, LATEST_COUNT);

  console.log(`Processing ${latestContents.length} contents...\n`);

  const rawRepoFiles: FileUpdate[] = [];
  const contentsRepoFiles: FileUpdate[] = [];
  const changedContentIds: number[] = [];
  const translationPayloads: TranslateContentPayload[] = [];
  let directusCreated = 0;
  let directusUpdated = 0;

  for (let i = 0; i < latestContents.length; i++) {
    const content = latestContents[i];
    const progress = `[${i + 1}/${latestContents.length}]`;

    try {
      console.log(`${progress} Processing content ${content.id}...`);
      const result = await processContent(buildId, content);

      const createResult = await createContent(content);
      if (createResult.success) {
        directusCreated++;
        console.log(`  ✓ Created in Directus: ${content.id}`);
      } else {
        const updateResult = await updateContent(content);
        if (updateResult.success) {
          directusUpdated++;
          console.log(`  ✓ Updated in Directus: ${content.id}`);
        } else {
          console.error(
            `  ⚠️  Failed to create/update in Directus for content ${content.id}:`,
            updateResult.error,
          );
        }
      }

      if (result.jsonChanged) {
        rawRepoFiles.push(result.json);
        console.log(`  ✓ JSON changed for content ${content.id}`);
      }

      if (result.markdownChanged && result.markdown) {
        contentsRepoFiles.push(result.markdown);
        console.log(`  ✓ Markdown changed for content ${content.id}`);

        for (const targetLang of TARGET_LANGUAGES) {
          const uploadPath = path.join(
            '/dora-world/contents',
            result.contentId.toString(),
            targetLang,
            'content.md',
          );

          translationPayloads.push({
            text: result.markdown.content,
            sourceLanguage: 'ja',
            targetLanguage: targetLang,
            uploadPath,
            uploadSourcePath: result.markdown.path,
            revalidatePath: `/${targetLang}/dora-world/contents/${result.contentId}`,
          });
        }
      }

      if (result.jsonChanged || result.markdownChanged) {
        changedContentIds.push(result.contentId);
      }

      if (i < latestContents.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`${progress} ❌ Failed to process ${content.id}:`, error);
    }
  }

  console.log(`  Total processed: ${latestContents.length}`);
  console.log(`  Changed contents: ${changedContentIds.length}`);
  console.log(`  RAW repo files to update: ${rawRepoFiles.length}`);
  console.log(`  CONTENTS repo files to update: ${contentsRepoFiles.length}`);
  console.log(
    `  Translation payloads to create: ${translationPayloads.length}`,
  );
  console.log(`  Directus created: ${directusCreated}`);
  console.log(`  Directus updated: ${directusUpdated}`);

  if (changedContentIds.length > 0) {
    console.log(`  Changed content IDs: ${changedContentIds.join(', ')}`);
  }

  if (rawRepoFiles.length > 0) {
    try {
      const rawCommit = await batchUpdateFiles({
        ...RAW_REPO,
        files: rawRepoFiles,
        message: `Update ${rawRepoFiles.length} dora-world contents\n\nContent IDs: ${changedContentIds.join(', ')}`,
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
        message: `Update ${contentsRepoFiles.length} dora-world contents\n\nContent IDs: ${changedContentIds.join(', ')}`,
      });
      console.log(`  ✓ CONTENTS repo committed: ${contentsCommit.sha}`);
    } catch (error) {
      console.error('  ❌ Failed to commit to CONTENTS repo:', error);
    }
  }

  return {
    processedCount: latestContents.length,
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
export type { UpdateContentsResult };
