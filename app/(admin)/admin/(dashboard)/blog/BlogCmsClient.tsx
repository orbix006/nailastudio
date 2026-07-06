'use client';

import * as React from 'react';
import Image from 'next/image';
import { 
  FileText, Plus, Trash2, Save, FileEdit, Globe, 
  User, Search, AlertCircle, CheckCircle2, Clock, Eye 
} from 'lucide-react';
import { BlogPost, saveBlogPostAction, deleteBlogPostAction } from '@/lib/blog-actions';
import { Button } from '@/components/ui/Button';

interface BlogCmsClientProps {
  initialPosts: BlogPost[];
}

const CATEGORY_PRESETS = [
  'Design Trends',
  'Color Theory',
  'Spatial Planning',
  'Technical Styling',
  'Wellness',
];

const DEFAULT_NEW_POST = (): BlogPost => ({
  id: `blog-${Date.now()}`,
  title: 'New Styling Article',
  slug: 'new-styling-article',
  excerpt: 'A short introduction excerpt summarizing the core theme.',
  content: '# Styling Narrative\n\nWrite your luxury styling details here...',
  author: {
    name: 'Nailaa Curator',
    bio: 'Lead Space Designer and Stylist.',
    avatarUrl: '/images/about_mission.png',
  },
  category: 'Design Trends',
  tags: ['Styling', 'Luxury'],
  status: 'draft',
  publishedAt: new Date().toISOString(),
  featuredImage: '/images/about_intro.png',
  seo: {
    metaTitle: 'New Styling Article | The Nailaa Studio',
    metaDescription: 'A brief description matching client searches.',
    metaKeywords: 'nails, styling, design',
  },
  createdAt: new Date().toISOString(),
});

export function BlogCmsClient({ initialPosts }: BlogCmsClientProps) {
  const [posts, setPosts] = React.useState<BlogPost[]>(initialPosts);
  const [selectedPost, setSelectedPost] = React.useState<BlogPost | null>(null);
  
  // Search and filter queries
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all'); // all, draft, published, scheduled

  // Form tab control: content, publish, seo, preview
  const [activeFormTab, setActiveFormTab] = React.useState<string>('content');
  
  // Visual notifications
  const [loading, setLoading] = React.useState(false);
  const [toast, setToast] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New tag addition input
  const [newTagInput, setNewTagInput] = React.useState('');

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Filter posts list
  const filteredPosts = React.useMemo(() => {
    const query = searchQuery.toLowerCase();
    return posts.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(query) || 
                            p.excerpt.toLowerCase().includes(query) ||
                            p.category.toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [posts, searchQuery, statusFilter]);

  // Handle post selections
  const handleSelectPost = (post: BlogPost) => {
    setSelectedPost({ ...post });
    setActiveFormTab('content');
  };

  // Handle local form input updates
  const updateFormValue = (updater: (prev: BlogPost) => BlogPost) => {
    if (!selectedPost) return;
    setSelectedPost(prev => prev ? updater(prev) : null);
  };

  // Save changes
  const handleSavePost = async () => {
    if (!selectedPost) return;
    setLoading(true);

    // Auto-generate slug if blank
    const activePost = { ...selectedPost };
    if (!activePost.slug.trim()) {
      activePost.slug = activePost.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }

    const res = await saveBlogPostAction(activePost);
    setLoading(false);
    
    if (res.success) {
      showToast('success', 'Blog article successfully saved.');
      // Update local state list
      setPosts(prev => {
        const idx = prev.findIndex(p => p.id === activePost.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = activePost;
          return next;
        }
        return [activePost, ...prev];
      });
    } else {
      showToast('error', res.error || 'Failed to save blog post.');
    }
  };

  // Delete article
  const handleDeletePost = async () => {
    if (!selectedPost) return;
    if (!window.confirm(`Are you sure you want to delete "${selectedPost.title}"?`)) return;

    setLoading(true);
    const res = await deleteBlogPostAction(selectedPost.id);
    setLoading(false);

    if (res.success) {
      showToast('success', 'Article deleted.');
      setPosts(prev => prev.filter(p => p.id !== selectedPost.id));
      setSelectedPost(null);
    } else {
      showToast('error', res.error || 'Failed to delete blog post.');
    }
  };

  // Add tag helper
  const handleAddTag = () => {
    const trimmed = newTagInput.trim();
    if (!trimmed || !selectedPost) return;
    if (selectedPost.tags.includes(trimmed)) return;
    
    updateFormValue(prev => ({
      ...prev,
      tags: [...prev.tags, trimmed],
    }));
    setNewTagInput('');
  };

  // Remove tag helper
  const handleRemoveTag = (tag: string) => {
    updateFormValue(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  // Safe parsing for dates in input
  const getLocalDateTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      // Format to YYYY-MM-DDTHH:MM
      const offset = d.getTimezoneOffset();
      const localDate = new Date(d.getTime() - (offset * 60 * 1000));
      return localDate.toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-6 font-sans text-white">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg border shadow-xl animate-fade-in ${
          toast.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-500 text-emerald-400'
            : 'bg-rose-950/90 border-rose-500 text-rose-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="h-4.5 w-4.5" /> : <AlertCircle className="h-4.5 w-4.5" />}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-800 pb-5">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-white flex items-center gap-2">
            <FileText className="h-6 w-6 text-[#C9A86A]" /> Blog CMS Console
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Write styling articles, configure tags, schedule releases, and optimize SEO meta variables.
          </p>
        </div>
        
        <Button
          variant="accent"
          size="sm"
          className="flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
          onClick={() => setSelectedPost(DEFAULT_NEW_POST())}
        >
          <Plus className="h-4 w-4" /> Add New Post
        </Button>
      </div>

      {/* Layout Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Posts List (4 columns) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-4 space-y-4 shadow-xl">
            
            {/* Search Query */}
            <div className="relative flex items-center bg-gray-900 border border-gray-800 rounded-lg focus-within:border-[#C9A86A]">
              <Search className="h-4 w-4 text-gray-550 ml-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 bg-transparent text-xs text-white placeholder-gray-600 outline-none"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-1">
              {['all', 'draft', 'published', 'scheduled'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`flex-1 py-1 rounded text-[9px] uppercase tracking-wider font-bold transition-all border cursor-pointer ${
                    statusFilter === status
                      ? 'bg-[#C9A86A]/10 border-[#C9A86A] text-[#C9A86A]'
                      : 'bg-transparent border-gray-850 text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Articles list */}
            <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
              {filteredPosts.length === 0 ? (
                <p className="text-center text-xs text-gray-550 italic py-8">No articles found.</p>
              ) : (
                filteredPosts.map(post => {
                  const isSelected = selectedPost?.id === post.id;
                  
                  // Status badge helper
                  let badgeColor = 'bg-gray-800 text-gray-400';
                  if (post.status === 'published') badgeColor = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15';
                  if (post.status === 'scheduled') badgeColor = 'bg-amber-500/10 text-amber-400 border border-amber-500/15';

                  return (
                    <button
                      key={post.id}
                      onClick={() => handleSelectPost(post)}
                      className={`w-full text-left p-3.5 rounded-lg border transition-all flex flex-col gap-1.5 cursor-pointer ${
                        isSelected 
                          ? 'bg-[#252525] border-[#C9A86A]/30 shadow-md'
                          : 'bg-[#111111] border-gray-850 hover:border-gray-800'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-gray-500">{post.category}</span>
                        <span className={`text-[8px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded ${badgeColor}`}>
                          {post.status}
                        </span>
                      </div>
                      
                      <h4 className="text-xs font-semibold text-white truncate max-w-full">
                        {post.title}
                      </h4>
                      
                      <span className="text-[8px] text-gray-500 font-mono mt-0.5">
                        {new Date(post.publishedAt).toLocaleDateString()}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

          </div>
        </div>

        {/* Right Side: Form Editor (8 columns) */}
        <div className="lg:col-span-8">
          {!selectedPost ? (
            <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-12 text-center space-y-4 shadow-xl">
              <FileEdit className="h-10 w-10 text-gray-650 mx-auto" />
              <h3 className="text-sm font-semibold text-white">No article selected</h3>
              <p className="text-xs text-gray-555 max-w-xs mx-auto">
                Select an article from the left sidebar or click &ldquo;+ Add New Post&rdquo; to start crafting a design story.
              </p>
            </div>
          ) : (
            <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl shadow-xl overflow-hidden">
              
              {/* Form header tabs selector */}
              <div className="flex border-b border-gray-800 bg-[#151515]">
                {[
                  { key: 'content', label: 'Article Details', icon: FileEdit },
                  { key: 'publishing', label: 'Publish & Author', icon: User },
                  { key: 'seo', label: 'SEO Settings', icon: Globe },
                  { key: 'preview', label: 'Live Preview', icon: Eye },
                ].map(tab => {
                  const TabIcon = tab.icon;
                  const isActive = activeFormTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveFormTab(tab.key)}
                      className={`flex-1 py-3 text-[10px] uppercase tracking-wider font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
                        isActive
                          ? 'border-[#C9A86A] text-[#C9A86A] bg-[#1A1A1A]'
                          : 'border-transparent text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      <TabIcon className="h-3.5 w-3.5" /> {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Form parameters */}
              <div className="p-6 space-y-6">
                
                {/* Form fields: Tab 1: Content */}
                {activeFormTab === 'content' && (
                  <div className="space-y-4">
                    
                    {/* Title */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Article Title</label>
                      <input
                        type="text"
                        value={selectedPost.title}
                        onChange={(e) => updateFormValue(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full bg-[#111111] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#C9A86A]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Slug */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Article Slug (URL path)</label>
                        <input
                          type="text"
                          value={selectedPost.slug}
                          placeholder="auto-generated-from-title"
                          onChange={(e) => updateFormValue(prev => ({ ...prev, slug: e.target.value }))}
                          className="w-full bg-[#111111] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#C9A86A]"
                        />
                      </div>

                      {/* Category */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Category</label>
                        <select
                          value={selectedPost.category}
                          onChange={(e) => updateFormValue(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full bg-[#111111] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#C9A86A] cursor-pointer"
                        >
                          {CATEGORY_PRESETS.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Excerpt summary */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Excerpt Summary</label>
                      <textarea
                        rows={2}
                        value={selectedPost.excerpt}
                        onChange={(e) => updateFormValue(prev => ({ ...prev, excerpt: e.target.value }))}
                        className="w-full bg-[#111111] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#C9A86A] resize-y"
                      />
                    </div>

                    {/* Tags block manager */}
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Tags</label>
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {selectedPost.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded bg-gray-900 border border-gray-800 text-[10px] uppercase tracking-wider text-[#C9A86A] font-bold flex items-center gap-1"
                          >
                            {tag}
                            <button
                              onClick={() => handleRemoveTag(tag)}
                              className="text-gray-500 hover:text-red-400 text-[9px] cursor-pointer"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        
                        {/* New Tag Input */}
                        <div className="flex items-center gap-1 ml-2">
                          <input
                            type="text"
                            placeholder="Add tag..."
                            value={newTagInput}
                            onChange={(e) => setNewTagInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                            className="bg-transparent border-b border-gray-800 text-xs text-white placeholder-gray-700 outline-none w-16 focus:border-[#C9A86A]"
                          />
                          <button
                            onClick={handleAddTag}
                            className="text-[9px] uppercase tracking-wider text-[#C9A86A] font-bold cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Rich text markdown editor */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Article Content (Markdown Rich Text)</label>
                      <textarea
                        rows={10}
                        value={selectedPost.content}
                        onChange={(e) => updateFormValue(prev => ({ ...prev, content: e.target.value }))}
                        className="w-full bg-[#111111] border border-gray-800 rounded-lg px-3.5 py-3 text-xs font-mono text-gray-300 outline-none focus:border-[#C9A86A] resize-y"
                      />
                    </div>

                  </div>
                )}

                {/* Form fields: Tab 2: Publishing & Author */}
                {activeFormTab === 'publishing' && (
                  <div className="space-y-4">
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Status */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Publish Status</label>
                        <select
                          value={selectedPost.status}
                          onChange={(e) => updateFormValue(prev => ({ 
                            ...prev, 
                            status: e.target.value as 'draft' | 'published' | 'scheduled' 
                          }))}
                          className="w-full bg-[#111111] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#C9A86A] cursor-pointer"
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                          <option value="scheduled">Scheduled Release</option>
                        </select>
                      </div>

                      {/* Scheduled Date/Time picker */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-[#C9A86A]" /> Schedule Release Date / Time
                        </label>
                        <input
                          type="datetime-local"
                          value={getLocalDateTime(selectedPost.publishedAt)}
                          disabled={selectedPost.status !== 'scheduled'}
                          onChange={(e) => {
                            const d = new Date(e.target.value);
                            updateFormValue(prev => ({
                              ...prev,
                              publishedAt: d.toISOString(),
                            }));
                          }}
                          className="w-full bg-[#111111] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#C9A86A] disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>

                    {/* Featured Image */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Featured Image (public URL path)</label>
                      <input
                        type="text"
                        value={selectedPost.featuredImage || ''}
                        placeholder="/images/about_intro.png"
                        onChange={(e) => updateFormValue(prev => ({ ...prev, featuredImage: e.target.value || null }))}
                        className="w-full bg-[#111111] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#C9A86A]"
                      />
                    </div>

                    <div className="border-t border-gray-850 pt-4">
                      <h4 className="text-xs font-semibold text-[#C9A86A] mb-3">Author Information</h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Author Name */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Author Name</label>
                          <input
                            type="text"
                            value={selectedPost.author.name}
                            onChange={(e) => updateFormValue(prev => ({
                              ...prev,
                              author: { ...prev.author, name: e.target.value }
                            }))}
                            className="w-full bg-[#111111] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#C9A86A]"
                          />
                        </div>

                        {/* Author Avatar */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Author Avatar URL</label>
                          <input
                            type="text"
                            value={selectedPost.author.avatarUrl}
                            onChange={(e) => updateFormValue(prev => ({
                              ...prev,
                              author: { ...prev.author, avatarUrl: e.target.value }
                            }))}
                            className="w-full bg-[#111111] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#C9A86A]"
                          />
                        </div>
                      </div>

                      {/* Author Bio */}
                      <div className="space-y-1.5 mt-4">
                        <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Author Short Bio</label>
                        <textarea
                          rows={2}
                          value={selectedPost.author.bio}
                          onChange={(e) => updateFormValue(prev => ({
                            ...prev,
                            author: { ...prev.author, bio: e.target.value }
                          }))}
                          className="w-full bg-[#111111] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#C9A86A] resize-y"
                        />
                      </div>
                    </div>

                  </div>
                )}

                {/* Form fields: Tab 3: SEO */}
                {activeFormTab === 'seo' && (
                  <div className="space-y-4">
                    
                    {/* Meta Title */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Meta Search Title</label>
                      <input
                        type="text"
                        value={selectedPost.seo.metaTitle}
                        onChange={(e) => updateFormValue(prev => ({
                          ...prev,
                          seo: { ...prev.seo, metaTitle: e.target.value }
                        }))}
                        className="w-full bg-[#111111] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#C9A86A]"
                      />
                    </div>

                    {/* Meta Description */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Meta Description Excerpt</label>
                      <textarea
                        rows={3}
                        value={selectedPost.seo.metaDescription}
                        onChange={(e) => updateFormValue(prev => ({
                          ...prev,
                          seo: { ...prev.seo, metaDescription: e.target.value }
                        }))}
                        className="w-full bg-[#111111] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#C9A86A] resize-y"
                      />
                    </div>

                    {/* Meta Keywords */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Meta Keywords (comma-separated)</label>
                      <input
                        type="text"
                        value={selectedPost.seo.metaKeywords}
                        onChange={(e) => updateFormValue(prev => ({
                          ...prev,
                          seo: { ...prev.seo, metaKeywords: e.target.value }
                        }))}
                        className="w-full bg-[#111111] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#C9A86A]"
                      />
                    </div>

                  </div>
                )}

                {/* Form fields: Tab 4: Markdown Preview */}
                {activeFormTab === 'preview' && (
                  <div className="bg-gray-900 border border-gray-850 p-6 rounded-lg max-h-[400px] overflow-y-auto space-y-4">
                    <h2 className="text-xl font-serif font-semibold border-b border-gray-800 pb-2">{selectedPost.title}</h2>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>By {selectedPost.author.name}</span>
                      <span>•</span>
                      <span>Category: {selectedPost.category}</span>
                    </div>
                    {/* Render featured image placeholder */}
                    {selectedPost.featuredImage && (
                      <div className="relative w-full aspect-video rounded overflow-hidden border border-gray-800">
                        <Image
                          src={selectedPost.featuredImage}
                          alt={selectedPost.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 800px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    
                    {/* Mini markdown parser output */}
                    <div className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap pt-2">
                      {selectedPost.content}
                    </div>
                  </div>
                )}

              </div>

              {/* Form Footer Action Buttons */}
              <div className="bg-[#151515] px-6 py-4 flex items-center justify-between border-t border-gray-800">
                <button
                  onClick={handleDeletePost}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-red-400 transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" /> Delete Article
                </button>

                <Button
                  variant="accent"
                  size="sm"
                  disabled={loading}
                  className="flex items-center gap-1.5 cursor-pointer"
                  onClick={handleSavePost}
                >
                  <Save className="h-4 w-4" /> {loading ? 'Saving...' : 'Save Post'}
                </Button>
              </div>

            </div>
          )}
        </div>

      </div>

    </div>
  );
}
