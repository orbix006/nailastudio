import { getBlogPostsAction } from '@/lib/blog-actions';
import { BlogCmsClient } from './BlogCmsClient';

export const dynamic = 'force-dynamic';

export default async function AdminBlogPage() {
  const posts = await getBlogPostsAction();
  return <BlogCmsClient initialPosts={posts} />;
}
