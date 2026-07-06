'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';

const getFilePath = () => path.join(process.cwd(), 'lib', 'blog-posts.json');

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: {
    name: string;
    bio: string;
    avatarUrl: string;
  };
  category: string;
  tags: string[];
  status: 'draft' | 'published' | 'scheduled';
  publishedAt: string; // ISO String
  featuredImage: string | null;
  seo: {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
  };
  createdAt: string; // ISO String
}

export async function getBlogPostsAction(): Promise<BlogPost[]> {
  try {
    const data = await fs.readFile(getFilePath(), 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading blog posts:', err);
    return [];
  }
}

export async function saveBlogPostAction(post: BlogPost): Promise<{ success: boolean; error?: string }> {
  try {
    const posts = await getBlogPostsAction();
    const idx = posts.findIndex(p => p.id === post.id);
    
    if (idx >= 0) {
      posts[idx] = post;
    } else {
      posts.push(post);
    }
    
    await fs.writeFile(getFilePath(), JSON.stringify(posts, null, 2), 'utf8');
    revalidatePath('/search');
    revalidatePath('/blog');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown write error';
    return { success: false, error: msg };
  }
}

export async function deleteBlogPostAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const posts = await getBlogPostsAction();
    const filtered = posts.filter(p => p.id !== id);
    await fs.writeFile(getFilePath(), JSON.stringify(filtered, null, 2), 'utf8');
    revalidatePath('/search');
    revalidatePath('/blog');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown delete error';
    return { success: false, error: msg };
  }
}
