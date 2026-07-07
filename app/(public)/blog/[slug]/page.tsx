import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBlogPostsAction } from '@/lib/blog-actions';
import { BlogDetailClient } from '@/components/public/BlogDetailClient';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const posts = await getBlogPostsAction();
  const post = posts.find((p) => p.slug === slug && p.status === 'published');
  
  if (!post) {
    return {
      title: 'Post Not Found | The Nailaa Studio',
    };
  }

  return {
    title: `${post.seo.metaTitle || post.title} | The Nailaa Studio`,
    description: post.seo.metaDescription || post.excerpt,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title: `${post.seo.metaTitle || post.title} | The Nailaa Studio`,
      description: post.seo.metaDescription || post.excerpt,
      url: `/blog/${post.slug}`,
      siteName: 'The Nailaa Studio',
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author.name],
      images: post.featuredImage ? [{ url: post.featuredImage }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${post.seo.metaTitle || post.title} | The Nailaa Studio`,
      description: post.seo.metaDescription || post.excerpt,
      images: post.featuredImage ? [post.featuredImage] : [],
    },
  };
}

export default async function BlogPostDetailPage({ params }: Props) {
  const { slug } = await params;
  const allPosts = await getBlogPostsAction();
  const post = allPosts.find((p) => p.slug === slug && p.status === 'published');

  if (!post) {
    notFound();
  }

  // Structured Data (JSON-LD) for BlogPosting
  const blogPostJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    'headline': post.title,
    'description': post.excerpt,
    'image': post.featuredImage || 'https://www.thenailaastudio.com/images/hero_background.png',
    'datePublished': post.publishedAt,
    'dateModified': post.publishedAt,
    'author': {
      '@type': 'Person',
      'name': post.author.name
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'The Nailaa Studio',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://www.thenailaastudio.com/images/hero_background.png'
      }
    },
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': `https://www.thenailaastudio.com/blog/${post.slug}`
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostJsonLd) }}
      />
      <BlogDetailClient post={post} allPosts={allPosts} />
    </>
  );
}
