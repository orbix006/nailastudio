import type { Metadata } from 'next';
import { getBlogPostsAction } from '@/lib/blog-actions';
import { BlogClient } from '@/components/public/BlogClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Luxury Interior Design Blog & Insights | The Nailaa Studio',
  description: 'Explore curated interior design tips, luxury home styling guides, color psychology, and bespoke lighting inspirations from The Nailaa Studio.',
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    title: 'Luxury Interior Design Blog & Insights | The Nailaa Studio',
    description: 'Explore curated interior design tips, luxury home styling guides, color psychology, and bespoke lighting inspirations from The Nailaa Studio.',
    url: '/blog',
    siteName: 'The Nailaa Studio',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Luxury Interior Design Blog & Insights | The Nailaa Studio',
    description: 'Explore curated interior design tips, luxury home styling guides, color psychology, and bespoke lighting inspirations from The Nailaa Studio.',
  },
};

export default async function BlogPage() {
  const posts = await getBlogPostsAction();
  
  // Structured Data (JSON-LD) for Blog
  const blogJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    'name': 'The Nailaa Studio Blog',
    'description': 'Explore curated interior design tips, luxury home styling guides, color psychology, and bespoke lighting inspirations from The Nailaa Studio.',
    'url': 'https://www.thenailaastudio.com/blog',
    'publisher': {
      '@type': 'Organization',
      'name': 'The Nailaa Studio',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://www.thenailaastudio.com/images/hero_background.png'
      }
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      <BlogClient initialPosts={posts} />
    </>
  );
}
