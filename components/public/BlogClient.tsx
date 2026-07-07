'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, Clock, ArrowRight, Loader2, CheckCircle2, AlertTriangle, ChevronDown } from 'lucide-react';
import { BlogPost } from '@/lib/blog-actions';
import { subscribeNewsletterAction } from '@/lib/newsletter-actions';
import { Button } from '@/components/ui/Button';

interface BlogClientProps {
  initialPosts: BlogPost[];
}

export function BlogClient({ initialPosts }: BlogClientProps) {
  // States for search, filtering, and sorting
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('All');
  const [sortBy, setSortBy] = React.useState<'newest' | 'oldest'>('newest');

  // Newsletter form states
  const [newsletterEmail, setNewsletterEmail] = React.useState('');
  const [newsletterLoading, setNewsletterLoading] = React.useState(false);
  const [newsletterStatus, setNewsletterStatus] = React.useState<'idle' | 'success' | 'error'>('idle');
  const [newsletterMessage, setNewsletterMessage] = React.useState('');

  // Extract all categories dynamically and add "All"
  const categories = React.useMemo(() => {
    const list = new Set<string>();
    initialPosts.forEach((post) => {
      if (post.status === 'published') {
        list.add(post.category);
      }
    });
    return ['All', ...Array.from(list)];
  }, [initialPosts]);

  // Featured article is the most recently published article
  const featuredPost = React.useMemo(() => {
    const published = initialPosts.filter((p) => p.status === 'published');
    if (published.length === 0) return null;
    return published.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())[0];
  }, [initialPosts]);

  // Filtered and sorted blog posts (excluding the featured one so it doesn't repeat immediately if list is long,
  // but if list is small or user searches, we can include it. Let's include all matching posts in listing to keep it simple.)
  const filteredPosts = React.useMemo(() => {
    let posts = initialPosts.filter((p) => p.status === 'published');

    // Filter by category
    if (selectedCategory !== 'All') {
      posts = posts.filter((p) => p.category === selectedCategory);
    }

    // Filter by keyword search
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      posts = posts.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Sort
    return posts.sort((a, b) => {
      const timeA = new Date(a.publishedAt).getTime();
      const timeB = new Date(b.publishedAt).getTime();
      return sortBy === 'newest' ? timeB - timeA : timeA - timeB;
    });
  }, [initialPosts, selectedCategory, searchQuery, sortBy]);

  // Calculate reading time dynamically if not stored (e.g. 200 words per minute)
  const getReadingTime = (content: string) => {
    const words = content.split(/\s+/).length;
    const time = Math.ceil(words / 200);
    return `${time} min read`;
  };

  // Format date helper
  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Handle Newsletter Submission
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
        setNewsletterMessage('Verification email dispatched! Please click the activation link in your inbox.');
        setNewsletterEmail('');
      } else {
        setNewsletterStatus('error');
        setNewsletterMessage(res.error || 'Failed to register your subscription.');
      }
    } catch {
      setNewsletterStatus('error');
      setNewsletterMessage('An unexpected network error occurred.');
    } finally {
      setNewsletterLoading(false);
    }
  };

  return (
    <div className="w-full bg-stone-50 dark:bg-[#111111] text-stone-900 dark:text-white transition-colors duration-300">
      
      {/* 1. Hero Section */}
      <section className="relative w-full py-16 sm:py-24 overflow-hidden border-b border-stone-200 dark:border-[#C9A86A]/10 bg-gradient-to-b from-stone-100 to-stone-50 dark:from-[#151515] dark:to-[#111111]">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px] pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs uppercase tracking-[0.35em] text-[#C9A86A] font-bold">
              Bespoke Design Journal
            </span>
            <h1 className="font-serif text-4xl sm:text-6xl font-semibold tracking-tight text-stone-900 dark:text-white leading-tight">
              Atelier Curations
            </h1>
            <p className="text-stone-500 dark:text-gray-400 text-sm sm:text-base font-light max-w-xl mx-auto leading-relaxed">
              Timeless interior luxury, design blueprints, space harmony, and material psychology curated by our master stylists.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Featured Article Banner */}
      {featuredPost && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-left mb-6">
            <h2 className="text-xs uppercase tracking-[0.25em] text-[#C9A86A] font-bold">
              Featured Insight
            </h2>
          </div>
          <div className="relative rounded-2xl overflow-hidden border border-stone-200 dark:border-white/5 bg-stone-100/50 dark:bg-[#171717]/60 backdrop-blur-md grid grid-cols-1 lg:grid-cols-12 gap-0 group">
            {/* Featured Image */}
            <div className="relative aspect-[16/10] lg:aspect-auto lg:col-span-7 w-full overflow-hidden min-h-[300px]">
              {featuredPost.featuredImage && (
                <Image
                  src={featuredPost.featuredImage}
                  alt={featuredPost.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover transform duration-700 group-hover:scale-105 origin-center"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-black/80 lg:from-transparent to-transparent z-10" />
            </div>

            {/* Featured Details */}
            <div className="lg:col-span-5 p-8 sm:p-12 flex flex-col justify-center space-y-6 z-20">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest bg-[#C9A86A]/10 text-[#C9A86A] border border-[#C9A86A]/20">
                  {featuredPost.category}
                </span>
                <span className="text-[10px] text-stone-500 dark:text-gray-400 font-medium">
                  • {getReadingTime(featuredPost.content)}
                </span>
              </div>

              <h3 className="font-serif text-2xl sm:text-3xl font-semibold leading-tight tracking-wide text-stone-900 dark:text-white group-hover:text-[#C9A86A] transition-colors duration-300">
                <Link href={`/blog/${featuredPost.slug}`}>{featuredPost.title}</Link>
              </h3>

              <p className="text-stone-600 dark:text-gray-400 text-xs sm:text-sm font-light leading-relaxed">
                {featuredPost.excerpt}
              </p>

              {/* Author Row */}
              <div className="flex items-center justify-between pt-4 border-t border-stone-200 dark:border-white/5">
                <div className="flex items-center space-x-3">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border border-stone-300 dark:border-white/10">
                    <Image
                      src={featuredPost.author.avatarUrl}
                      alt={featuredPost.author.name}
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-stone-800 dark:text-gray-200">{featuredPost.author.name}</p>
                    <p className="text-[9px] text-stone-500 dark:text-gray-500">{formatDate(featuredPost.publishedAt)}</p>
                  </div>
                </div>

                <Link
                  href={`/blog/${featuredPost.slug}`}
                  className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-[#C9A86A] hover:text-[#C9A86A]/80 transition-colors"
                >
                  <span>Read Article</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. Search, Category Tabs, Sorting Filter Row */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 border-t border-stone-200 dark:border-white/5">
        <div className="flex flex-col lg:flex-row gap-6 justify-between items-stretch lg:items-center">
          
          {/* Categories Horizontal Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none max-w-full">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-300 border cursor-pointer select-none whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-[#C9A86A] text-[#111111] border-[#C9A86A] shadow-md shadow-[#C9A86A]/10 font-bold'
                    : 'bg-white dark:bg-[#1A1A1A] border-stone-200 dark:border-white/5 text-stone-600 dark:text-gray-400 hover:text-stone-900 dark:hover:text-white hover:border-stone-300 dark:hover:border-white/20'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input & Sorting Toggle */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            {/* Search Box */}
            <div className="relative min-w-[220px]">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-stone-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stone-200 dark:border-white/5 bg-white dark:bg-[#1A1A1A] text-xs outline-none focus:border-[#C9A86A] focus-visible:ring-1 focus-visible:ring-[#C9A86A] text-stone-900 dark:text-white"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
                className="appearance-none bg-white dark:bg-[#1A1A1A] border border-stone-200 dark:border-white/5 pl-4 pr-10 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-gray-300 outline-none cursor-pointer focus:border-[#C9A86A] w-full sm:w-auto"
              >
                <option value="newest">Sort: Newest</option>
                <option value="oldest">Sort: Oldest</option>
              </select>
              <ChevronDown className="absolute right-3.5 top-3.5 h-3 w-3 pointer-events-none text-stone-500" />
            </div>
          </div>

        </div>
      </section>

      {/* 4. Latest Articles Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 min-h-[400px]">
        {filteredPosts.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-stone-200 dark:border-[#C9A86A]/20 rounded-2xl bg-white dark:bg-[#161616]/30">
            <Search className="h-12 w-12 text-[#C9A86A]/40 mx-auto mb-4" />
            <h3 className="font-serif text-xl font-semibold mb-2">No Articles Found</h3>
            <p className="text-stone-500 dark:text-gray-400 text-xs sm:text-sm max-w-md mx-auto">
              We couldn&apos;t find any design articles matching &ldquo;{searchQuery}&rdquo; in the category &ldquo;{selectedCategory}&rdquo;. Try another search term.
            </p>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            <AnimatePresence mode="popLayout">
              {filteredPosts.map((post) => (
                <motion.article
                  key={post.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col bg-white dark:bg-[#161616]/60 border border-stone-200 dark:border-white/5 rounded-xl overflow-hidden group hover:border-[#C9A86A]/20 transition-all duration-500"
                >
                  {/* Card Cover Image */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-100 dark:bg-stone-900">
                    {post.featuredImage && (
                      <Image
                        src={post.featuredImage}
                        alt={`${post.title} cover`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transform duration-700 group-hover:scale-103 origin-center"
                      />
                    )}
                    <div className="absolute top-4 left-4 z-10">
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-widest bg-black/70 backdrop-blur-md text-[#C9A86A] border border-[#C9A86A]/25">
                        {post.category}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="flex-1 p-6 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-[10px] text-stone-500 dark:text-gray-400">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(post.publishedAt)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {getReadingTime(post.content)}
                        </span>
                      </div>

                      <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-white leading-snug group-hover:text-[#C9A86A] transition-colors duration-300 line-clamp-2">
                        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                      </h3>

                      <p className="text-stone-500 dark:text-gray-400 text-xs font-light leading-relaxed line-clamp-3">
                        {post.excerpt}
                      </p>
                    </div>

                    {/* Author Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-stone-150 dark:border-white/5">
                      <div className="flex items-center space-x-2.5">
                        <div className="relative w-6 h-6 rounded-full overflow-hidden border border-stone-300 dark:border-white/10">
                          <Image
                            src={post.author.avatarUrl}
                            alt={post.author.name}
                            fill
                            sizes="24px"
                            className="object-cover"
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-stone-700 dark:text-gray-300">
                          {post.author.name}
                        </span>
                      </div>

                      <Link
                        href={`/blog/${post.slug}`}
                        className="inline-flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-widest text-[#C9A86A] hover:text-[#C9A86A]/80 transition-colors"
                      >
                        <span>Read</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>

      {/* 5. Premium Newsletter Subscription Card Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative rounded-3xl overflow-hidden border border-[#C9A86A]/10 bg-stone-100 dark:bg-[#161616] p-8 sm:p-12 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 shadow-2xl">
          {/* Subtle gold line accent */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#C9A86A]/60 to-transparent" />
          
          <div className="space-y-4 max-w-xl text-center md:text-left">
            <h2 className="font-serif text-2xl sm:text-4xl font-bold tracking-wide text-stone-900 dark:text-white leading-tight">
              Stay Inspired with Interior Design Insights
            </h2>
            <p className="text-stone-500 dark:text-gray-400 text-xs sm:text-sm font-light leading-relaxed">
              Receive the latest interior design trends, styling ideas, and expert tips directly in your inbox.
            </p>
          </div>

          <div className="w-full max-w-md">
            <AnimatePresence mode="wait">
              {newsletterStatus === 'success' ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-6 rounded-xl border border-emerald-500/10 bg-emerald-500/5 text-center space-y-2.5"
                >
                  <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
                  <h4 className="font-serif text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Subscription Initiated</h4>
                  <p className="text-xs text-stone-600 dark:text-gray-400 leading-relaxed font-light">{newsletterMessage}</p>
                </motion.div>
              ) : (
                <motion.form
                  onSubmit={handleNewsletterSubmit}
                  className="space-y-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="Enter your email address..."
                      value={newsletterEmail}
                      disabled={newsletterLoading}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-stone-200 dark:border-white/5 bg-white dark:bg-[#111111] text-xs sm:text-sm outline-none focus:border-[#C9A86A] focus-visible:ring-1 focus-visible:ring-[#C9A86A] text-stone-900 dark:text-white disabled:opacity-50"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="accent"
                    disabled={newsletterLoading}
                    className="w-full py-3 font-bold uppercase tracking-wider text-xs flex items-center justify-center space-x-2 shadow-lg cursor-pointer"
                  >
                    {newsletterLoading ? (
                      <>
                        <Loader2 className="h-4.5 w-4.5 animate-spin" />
                        <span>Subscribing...</span>
                      </>
                    ) : (
                      <span>Subscribe</span>
                    )}
                  </Button>

                  {newsletterStatus === 'error' && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center space-x-2 text-xs text-rose-500 bg-rose-500/5 border border-rose-500/10 p-2.5 rounded-lg"
                    >
                      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                      <span>{newsletterMessage}</span>
                    </motion.div>
                  )}
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* 6. CTA Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 border-t border-stone-200 dark:border-white/5">
        <div className="text-center max-w-2xl mx-auto space-y-6">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-wide">
            Ready to Elevate Your Space?
          </h2>
          <p className="text-stone-500 dark:text-gray-400 text-xs sm:text-sm font-light max-w-md mx-auto leading-relaxed">
            Let&apos;s align to craft your custom sanctuary. Schedule a design consultation with our interior curators today.
          </p>
          <Button
            variant="accent"
            size="lg"
            className="px-8 py-4 font-bold uppercase tracking-wider text-xs shadow-xl cursor-pointer"
            onClick={() => {
              const event = new CustomEvent('open-inquiry-modal', {
                detail: { source: 'blog_cta' },
              });
              window.dispatchEvent(event);
            }}
          >
            Book Consultation
          </Button>
        </div>
      </section>

    </div>
  );
}
