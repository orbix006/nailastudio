'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, ChevronLeft, ChevronRight, Twitter, 
  Facebook, MessageSquare, Link2, ArrowRight, Loader2
} from 'lucide-react';
import { BlogPost } from '@/lib/blog-actions';
import { subscribeNewsletterAction } from '@/lib/newsletter-actions';
import { Button } from '@/components/ui/Button';

interface BlogDetailClientProps {
  post: BlogPost;
  allPosts: BlogPost[];
}

export function BlogDetailClient({ post, allPosts }: BlogDetailClientProps) {
  // Sort posts by date to evaluate sequence
  const publishedPosts = React.useMemo(() => {
    return allPosts
      .filter((p) => p.status === 'published')
      .sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
  }, [allPosts]);

  // Find index of current post
  const currentIndex = React.useMemo(() => {
    return publishedPosts.findIndex((p) => p.id === post.id);
  }, [publishedPosts, post.id]);

  // Previous and Next articles
  const prevPost = currentIndex > 0 ? publishedPosts[currentIndex - 1] : null;
  const nextPost = currentIndex < publishedPosts.length - 1 ? publishedPosts[currentIndex + 1] : null;

  // Related articles (matching same category, max 3)
  const relatedPosts = React.useMemo(() => {
    return publishedPosts
      .filter((p) => p.id !== post.id && p.category === post.category)
      .slice(0, 3);
  }, [publishedPosts, post.id, post.category]);

  // Share handler
  const [copied, setCopied] = React.useState(false);
  const getPageUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return '';
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getPageUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Newsletter states
  const [newsletterEmail, setNewsletterEmail] = React.useState('');
  const [newsletterLoading, setNewsletterLoading] = React.useState(false);
  const [newsletterStatus, setNewsletterStatus] = React.useState<'idle' | 'success' | 'error'>('idle');
  const [newsletterMessage, setNewsletterMessage] = React.useState('');

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailVal = newsletterEmail.trim();
    if (!emailVal) return;

    setNewsletterLoading(true);
    setNewsletterStatus('idle');
    setNewsletterMessage('');

    try {
      const res = await subscribeNewsletterAction(emailVal);
      if (res.success) {
        setNewsletterStatus('success');
        setNewsletterMessage('Opt-in link sent! Verify in your inbox.');
        setNewsletterEmail('');
      } else {
        setNewsletterStatus('error');
        setNewsletterMessage(res.error || 'Failed to subscribe.');
      }
    } catch {
      setNewsletterStatus('error');
      setNewsletterMessage('Network error occurred.');
    } finally {
      setNewsletterLoading(false);
    }
  };

  // Table of Contents (TOC) extraction
  const headings = React.useMemo(() => {
    const list: { text: string; id: string; level: number }[] = [];
    const lines = post.content.split('\n');
    lines.forEach((line) => {
      const match = line.match(/^(#{1,3})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        list.push({ text, id, level });
      }
    });
    return list;
  }, [post.content]);

  // Markdown inline formatting helper
  const formatInlineMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-stone-900 dark:text-white">$1</strong>')
      .replace(/`(.*?)`/g, '<code class="font-mono text-[11px] bg-stone-200 dark:bg-white/10 px-1.5 py-0.5 rounded text-[#C9A86A]">$1</code>');
  };

  // Custom JSX renderer for rich text content
  const renderContent = (content: string) => {
    const blocks = content.split('\n\n');
    return blocks.map((block, bIdx) => {
      const trimmed = block.trim();
      if (!trimmed) return null;

      // Check for Headings
      const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const text = headingMatch[2].trim();
        const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        
        if (level === 1) {
          return (
            <h2 key={bIdx} id={id} className="font-serif text-3xl font-bold tracking-wide mt-10 mb-4 scroll-mt-24 border-b border-stone-200 dark:border-white/5 pb-3">
              {text}
            </h2>
          );
        } else if (level === 2) {
          return (
            <h3 key={bIdx} id={id} className="font-serif text-xl sm:text-2xl font-semibold tracking-wide mt-8 mb-3 scroll-mt-24">
              {text}
            </h3>
          );
        } else {
          return (
            <h4 key={bIdx} id={id} className="font-serif text-lg font-semibold tracking-wide mt-6 mb-2 scroll-mt-24 text-[#C9A86A]">
              {text}
            </h4>
          );
        }
      }

      // Check for bullet lists
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const items = trimmed.split('\n').map((item) => item.replace(/^[-*]\s+/, ''));
        return (
          <ul key={bIdx} className="list-disc pl-6 space-y-2 text-stone-600 dark:text-gray-300 text-sm sm:text-base font-light my-4">
            {items.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(item) }} />
            ))}
          </ul>
        );
      }

      // Check for numbered lists
      if (/^\d+\.\s+/.test(trimmed)) {
        const items = trimmed.split('\n').map((item) => item.replace(/^\d+\.\s+/, ''));
        return (
          <ol key={bIdx} className="list-decimal pl-6 space-y-2 text-stone-600 dark:text-gray-300 text-sm sm:text-base font-light my-4">
            {items.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(item) }} />
            ))}
          </ol>
        );
      }

      // Default to plain paragraph
      return (
        <p
          key={bIdx}
          className="text-stone-600 dark:text-gray-300 text-sm sm:text-base font-light leading-relaxed mb-6"
          dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmed) }}
        />
      );
    });
  };

  const getReadingTime = (content: string) => {
    const words = content.split(/\s+/).length;
    return `${Math.ceil(words / 200)} min read`;
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="w-full bg-stone-50 dark:bg-[#111111] text-stone-900 dark:text-white transition-colors duration-300">
      
      {/* Back Button Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        <Link
          href="/blog"
          className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-gray-400 hover:text-[#C9A86A] transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to insights</span>
        </Link>
      </div>

      {/* Main Layout Content */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left Column: Heading and Main Article */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Article Metadata */}
          <div className="space-y-4">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest bg-[#C9A86A]/10 text-[#C9A86A] border border-[#C9A86A]/20">
              {post.category}
            </span>
            
            <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-wide leading-tight">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 dark:text-gray-400 font-light border-b border-stone-200 dark:border-white/5 pb-4">
              <span className="flex items-center">
                <Calendar className="h-3.5 w-3.5 mr-1 text-[#C9A86A]" />
                {formatDate(post.publishedAt)}
              </span>
              <span>•</span>
              <span className="flex items-center">
                <Clock className="h-3.5 w-3.5 mr-1 text-[#C9A86A]" />
                {getReadingTime(post.content)}
              </span>
            </div>
          </div>

          {/* Hero Banner Image */}
          {post.featuredImage && (
            <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-stone-200 dark:border-white/5 bg-stone-100 dark:bg-stone-900 shadow-xl">
              <Image
                src={post.featuredImage}
                alt={post.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 80vw"
                className="object-cover"
              />
            </div>
          )}

          {/* Table of Contents for Mobile View (TOC) */}
          {headings.length > 0 && (
            <div className="lg:hidden p-6 rounded-xl border border-stone-200 dark:border-white/5 bg-stone-100/50 dark:bg-[#161616]/50">
              <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-[#C9A86A] mb-3">
                Table of Contents
              </h3>
              <ul className="space-y-2">
                {headings.map((h, idx) => (
                  <li key={idx} className={h.level === 3 ? 'pl-4' : ''}>
                    <a
                      href={`#${h.id}`}
                      className="text-xs text-stone-500 dark:text-gray-400 hover:text-[#C9A86A] transition-colors"
                    >
                      {h.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Content Body */}
          <article className="prose prose-stone dark:prose-invert max-w-none text-left">
            {renderContent(post.content)}
          </article>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-6 border-t border-stone-200 dark:border-white/5">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded bg-stone-200/50 dark:bg-white/5 text-[10px] uppercase font-semibold text-stone-600 dark:text-gray-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

        </div>

        {/* Right Column: Sticky Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <div className="lg:sticky lg:top-28 space-y-8">
            
            {/* Sticky TOC (Desktop) */}
            {headings.length > 0 && (
              <div className="hidden lg:block p-6 rounded-xl border border-stone-200 dark:border-white/5 bg-white dark:bg-[#161616]/50 backdrop-blur-md">
                <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-[#C9A86A] border-b border-stone-100 dark:border-white/5 pb-2.5 mb-4">
                  Table of Contents
                </h3>
                <ul className="space-y-3">
                  {headings.map((h, idx) => (
                    <li key={idx} style={{ paddingLeft: `${(h.level - 1) * 8}px` }}>
                      <a
                        href={`#${h.id}`}
                        className="text-xs text-stone-500 dark:text-gray-400 hover:text-[#C9A86A] transition-colors block border-l border-transparent pl-2 hover:border-[#C9A86A]/40"
                      >
                        {h.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Author Card */}
            <div className="p-6 rounded-xl border border-stone-200 dark:border-white/5 bg-white dark:bg-[#161616]/50 backdrop-blur-md text-center space-y-4">
              <div className="relative w-16 h-16 rounded-full overflow-hidden border border-[#C9A86A]/20 mx-auto">
                <Image
                  src={post.author.avatarUrl}
                  alt={post.author.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif text-sm font-bold text-stone-800 dark:text-gray-200">
                  {post.author.name}
                </h4>
                <p className="text-[10px] uppercase font-bold tracking-widest text-[#C9A86A]">
                  Design Stylist
                </p>
              </div>
              <p className="text-stone-500 dark:text-gray-400 text-xs font-light leading-relaxed">
                {post.author.bio}
              </p>
            </div>

            {/* Social Share Buttons */}
            <div className="p-6 rounded-xl border border-stone-200 dark:border-white/5 bg-white dark:bg-[#161616]/50 backdrop-blur-md space-y-4">
              <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-[#C9A86A] border-b border-stone-100 dark:border-white/5 pb-2.5">
                Share Article
              </h4>
              <div className="grid grid-cols-4 gap-3">
                {/* Twitter */}
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(getPageUrl())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex justify-center items-center p-3 rounded-lg border border-stone-200 dark:border-white/5 hover:border-sky-500/30 hover:bg-sky-500/5 text-stone-500 hover:text-sky-400 transition-colors focus:outline-none"
                  aria-label="Share on X"
                >
                  <Twitter className="h-4.5 w-4.5" />
                </a>

                {/* Facebook */}
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getPageUrl())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex justify-center items-center p-3 rounded-lg border border-stone-200 dark:border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 text-stone-500 hover:text-blue-400 transition-colors focus:outline-none"
                  aria-label="Share on Facebook"
                >
                  <Facebook className="h-4.5 w-4.5" />
                </a>

                {/* WhatsApp */}
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(post.title + ' - ' + getPageUrl())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex justify-center items-center p-3 rounded-lg border border-stone-200 dark:border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5 text-stone-500 hover:text-emerald-400 transition-colors focus:outline-none"
                  aria-label="Share on WhatsApp"
                >
                  <MessageSquare className="h-4.5 w-4.5" />
                </a>

                {/* Copy Link */}
                <button
                  onClick={handleCopyLink}
                  className="flex justify-center items-center p-3 rounded-lg border border-stone-200 dark:border-white/5 hover:border-[#C9A86A]/40 hover:bg-[#C9A86A]/5 text-stone-500 hover:text-[#C9A86A] transition-colors cursor-pointer focus:outline-none"
                  aria-label="Copy Link"
                >
                  {copied ? (
                    <span className="text-[9px] font-bold text-[#C9A86A]">Copied!</span>
                  ) : (
                    <Link2 className="h-4.5 w-4.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Newsletter widget */}
            <div className="p-6 rounded-xl border border-[#C9A86A]/10 bg-stone-100 dark:bg-[#161616] space-y-4">
              <h4 className="font-serif text-sm font-bold text-stone-900 dark:text-white">
                Design Insights
              </h4>
              <p className="text-stone-500 dark:text-gray-400 text-xs font-light leading-relaxed">
                Stay inspired with styling layouts directly in your inbox.
              </p>
              
              <AnimatePresence mode="wait">
                {newsletterStatus === 'success' ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="p-3 text-center rounded border border-emerald-500/10 bg-emerald-500/5 text-emerald-400 text-xs"
                  >
                    {newsletterMessage || 'Verification link sent!'}
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleNewsletterSubmit}
                    className="space-y-2"
                  >
                    <input
                      type="email"
                      required
                      placeholder="Email address..."
                      value={newsletterEmail}
                      disabled={newsletterLoading}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded border border-stone-200 dark:border-white/5 bg-white dark:bg-[#111111] text-xs outline-none focus:border-[#C9A86A]"
                    />
                    <Button type="submit" variant="accent" disabled={newsletterLoading} className="w-full py-2.5 font-bold uppercase tracking-wider text-[10px] flex items-center justify-center space-x-1 cursor-pointer">
                      {newsletterLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <span>Subscribe</span>}
                    </Button>
                    {newsletterStatus === 'error' && (
                      <div className="text-[10px] text-rose-500 bg-rose-500/5 p-2 rounded">
                        {newsletterMessage}
                      </div>
                    )}
                  </motion.form>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </section>

      {/* 7. Previous / Next Article Navigation */}
      {(prevPost || nextPost) && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 border-t border-stone-200 dark:border-white/5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Previous Post */}
            {prevPost ? (
              <Link
                href={`/blog/${prevPost.slug}`}
                className="flex items-center space-x-4 p-4 rounded-xl border border-stone-200 dark:border-white/5 bg-white dark:bg-[#161616]/30 hover:border-[#C9A86A]/20 transition-all duration-300 group"
              >
                <ChevronLeft className="h-6 w-6 text-stone-400 group-hover:text-[#C9A86A] transition-colors" />
                <div className="flex-1 space-y-1">
                  <p className="text-[9px] uppercase tracking-widest text-[#C9A86A] font-bold">
                    Previous Article
                  </p>
                  <h4 className="text-xs sm:text-sm font-semibold leading-snug line-clamp-1 group-hover:text-[#C9A86A] transition-colors">
                    {prevPost.title}
                  </h4>
                </div>
              </Link>
            ) : (
              <div className="hidden sm:block" />
            )}

            {/* Next Post */}
            {nextPost ? (
              <Link
                href={`/blog/${nextPost.slug}`}
                className="flex items-center justify-between p-4 rounded-xl border border-stone-200 dark:border-white/5 bg-white dark:bg-[#161616]/30 hover:border-[#C9A86A]/20 transition-all duration-300 group text-right"
              >
                <div className="flex-1 space-y-1">
                  <p className="text-[9px] uppercase tracking-widest text-[#C9A86A] font-bold">
                    Next Article
                  </p>
                  <h4 className="text-xs sm:text-sm font-semibold leading-snug line-clamp-1 group-hover:text-[#C9A86A] transition-colors">
                    {nextPost.title}
                  </h4>
                </div>
                <ChevronRight className="h-6 w-6 text-stone-400 group-hover:text-[#C9A86A] transition-colors ml-4" />
              </Link>
            ) : (
              <div className="hidden sm:block" />
            )}

          </div>
        </section>
      )}

      {/* 8. Related Articles Section */}
      {relatedPosts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 border-t border-stone-200 dark:border-white/5">
          <div className="text-left mb-8">
            <span className="text-xs uppercase tracking-[0.3em] text-[#C9A86A] font-bold">
              Related Insights
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-wide mt-1">
              Design Curations
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {relatedPosts.map((rPost) => (
              <article
                key={rPost.id}
                className="flex flex-col bg-white dark:bg-[#161616]/60 border border-stone-200 dark:border-white/5 rounded-xl overflow-hidden group hover:border-[#C9A86A]/20 transition-all duration-500"
              >
                {/* Related Cover */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-100 dark:bg-stone-900">
                  {rPost.featuredImage && (
                    <Image
                      src={rPost.featuredImage}
                      alt={rPost.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transform duration-700 group-hover:scale-103 origin-center"
                    />
                  )}
                </div>

                {/* Related Body */}
                <div className="flex-grow p-6 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <span className="text-[9px] uppercase tracking-widest text-[#C9A86A] font-bold">
                      {rPost.category}
                    </span>
                    <h4 className="font-serif text-sm font-bold leading-snug line-clamp-2 group-hover:text-[#C9A86A] transition-colors">
                      <Link href={`/blog/${rPost.slug}`}>{rPost.title}</Link>
                    </h4>
                  </div>
                  <Link
                    href={`/blog/${rPost.slug}`}
                    className="inline-flex items-center space-x-1 text-[9px] font-bold uppercase tracking-widest text-[#C9A86A] hover:text-[#C9A86A]/80 pt-2 transition-colors border-t border-stone-100 dark:border-white/5"
                  >
                    <span>Read Article</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
