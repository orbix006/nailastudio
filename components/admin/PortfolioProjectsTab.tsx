'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { 
  Briefcase, Plus, ArrowUp, ArrowDown, Eye, EyeOff, Trash2, Edit3, 
  Loader2, ImageIcon, HelpCircle, Star, Search, Keyboard
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { logAdminAction } from '@/lib/supabase/audit';

interface ProjectItem {
  id: string;
  name: string;
  slug: string;
  category_id: string;
  portfolio_categories: { name: string } | null;
  project_types: { name: string } | null;
  cover_image_id: string;
  cover_media: { public_url: string } | null;
  is_featured: boolean;
  is_published: boolean;
  display_order: number;
  completion_year: number | null;
  location: string | null;
}

interface DbProjectItem {
  id: string;
  name: string;
  slug: string;
  category_id: string;
  portfolio_categories: { name: string } | { name: string }[] | null;
  project_types: { name: string } | { name: string }[] | null;
  cover_image_id: string;
  cover_media: { public_url: string } | { public_url: string }[] | null;
  is_featured: boolean;
  is_published: boolean;
  display_order: number;
  completion_year: number | null;
  location: string | null;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface SavedFilter {
  name: string;
  category: string;
  status: string;
  search: string;
}

export function PortfolioProjectsTab() {
  const supabase = createClient();
  const { toast } = useToast();

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all'); // all, published, unpublished, featured

  // Bulk Selection States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkPublishing, setBulkPublishing] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  // Column Visibility States
  const [visibleColumns, setVisibleColumns] = useState<string[]>(['order', 'cover', 'details', 'category', 'type', 'status', 'actions']);

  // Column Sorting States
  const [sortField, setSortField] = useState<'name' | 'category' | 'type' | 'status' | 'order' | null>('order');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Saved Filters States
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [newFilterName, setNewFilterName] = useState('');
  const [saveFilterOpen, setSaveFilterOpen] = useState(false);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Keyboard Shortcuts display toggle
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // Soft Delete states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('portfolio_categories')
        .select('id, name')
        .order('display_order', { ascending: true });
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, [supabase]);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('portfolio_projects')
        .select(`
          *,
          portfolio_categories(name),
          project_types(name),
          cover_media:media_library!portfolio_projects_cover_image_id_fkey(public_url)
        `)
        .is('deleted_at', null)
        .order('display_order', { ascending: true });

      if (error) throw error;

      const parsedData = ((data as unknown as DbProjectItem[]) || []).map((item) => {
        let categoryObj: { name: string } | null = null;
        if (item.portfolio_categories) {
          categoryObj = Array.isArray(item.portfolio_categories)
            ? item.portfolio_categories[0]
            : item.portfolio_categories;
        }

        let typeObj: { name: string } | null = null;
        if (item.project_types) {
          typeObj = Array.isArray(item.project_types)
            ? item.project_types[0]
            : item.project_types;
        }

        let coverMediaObj: { public_url: string } | null = null;
        if (item.cover_media) {
          coverMediaObj = Array.isArray(item.cover_media)
            ? item.cover_media[0]
            : item.cover_media;
        }

        return {
          id: item.id,
          name: item.name,
          slug: item.slug,
          category_id: item.category_id,
          portfolio_categories: categoryObj,
          project_types: typeObj,
          cover_image_id: item.cover_image_id,
          cover_media: coverMediaObj,
          is_featured: item.is_featured,
          is_published: item.is_published,
          display_order: item.display_order,
          completion_year: item.completion_year,
          location: item.location,
        };
      });

      setProjects(parsedData);
      setSelectedIds([]);
    } catch (err) {
      console.error('Error fetching projects:', err);
      toast('Failed to load portfolio projects database.', 'error');
    } finally {
      setLoading(false);
    }
  }, [supabase, toast]);

  useEffect(() => {
    fetchCategories();
    fetchProjects();
  }, [fetchCategories, fetchProjects]);

  // Load saved filters on start
  useEffect(() => {
    const stored = localStorage.getItem('portfolio_saved_filters');
    if (stored) {
      try {
        setSavedFilters(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleTogglePublish = async (project: ProjectItem) => {
    try {
      const nextPublish = !project.is_published;
      const { error } = await supabase
        .from('portfolio_projects')
        .update({ is_published: nextPublish })
        .eq('id', project.id);

      if (error) throw error;

      await logAdminAction(
        nextPublish ? 'publish' : 'unpublish',
        'portfolio_projects',
        project.id,
        { name: project.name }
      );

      toast(`Project "${project.name}" is now ${nextPublish ? 'published' : 'unpublished'}.`, 'success');
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, is_published: nextPublish } : p))
      );
    } catch (err) {
      console.error('Error toggling publish status:', err);
      toast('Failed to update publishing status.', 'error');
    }
  };

  const handleToggleFeatured = async (project: ProjectItem) => {
    try {
      const nextFeatured = !project.is_featured;
      const { error } = await supabase
        .from('portfolio_projects')
        .update({ is_featured: nextFeatured })
        .eq('id', project.id);

      if (error) throw error;

      toast(`Project "${project.name}" featured status updated.`, 'success');
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, is_featured: nextFeatured } : p))
      );
    } catch (err) {
      console.error('Error toggling featured status:', err);
      toast('Failed to update featured status.', 'error');
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= projects.length) return;

    const currentProject = projects[index];
    const targetProject = projects[targetIndex];

    try {
      const { error: err1 } = await supabase
        .from('portfolio_projects')
        .update({ display_order: targetProject.display_order })
        .eq('id', currentProject.id);

      const { error: err2 } = await supabase
        .from('portfolio_projects')
        .update({ display_order: currentProject.display_order })
        .eq('id', targetProject.id);

      if (err1 || err2) throw err1 || err2;

      toast('Order updated successfully.', 'success');
      fetchProjects();
    } catch (err) {
      console.error('Error updating order:', err);
      toast('Failed to change item order.', 'error');
    }
  };

  const confirmDelete = (project: ProjectItem) => {
    setProjectToDelete(project);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!projectToDelete) return;
    try {
      setDeleting(true);
      const { error } = await supabase
        .from('portfolio_projects')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', projectToDelete.id);

      if (error) throw error;

      toast(`Project "${projectToDelete.name}" has been soft-deleted.`, 'success');
      setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
      setSelectedIds(prev => prev.filter(x => x !== projectToDelete.id));
      setDeleteModalOpen(false);
      setProjectToDelete(null);
    } catch (err) {
      console.error('Error deleting project:', err);
      toast('Failed to delete project. Please try again.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Bulk Actions
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedIds(sortedProjects.map(p => p.id));
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const handleBulkPublish = async (publish: boolean) => {
    try {
      setBulkPublishing(true);
      const { error } = await supabase
        .from('portfolio_projects')
        .update({ is_published: publish })
        .in('id', selectedIds);

      if (error) throw error;

      // Log actions in audit trails
      for (const id of selectedIds) {
        const proj = projects.find(x => x.id === id);
        if (proj) {
          await logAdminAction(
            publish ? 'publish' : 'unpublish',
            'portfolio_projects',
            proj.id,
            { name: proj.name, bulk: true }
          );
        }
      }

      toast(`Bulk ${publish ? 'published' : 'unpublished'} ${selectedIds.length} project(s).`, 'success');
      setProjects(prev => prev.map(p => selectedIds.includes(p.id) ? { ...p, is_published: publish } : p));
      setSelectedIds([]);
    } catch (err) {
      console.error(err);
      toast('Bulk status update failed.', 'error');
    } finally {
      setBulkPublishing(false);
    }
  };

  const handleBulkDelete = async () => {
    try {
      setBulkDeleting(true);
      const { error } = await supabase
        .from('portfolio_projects')
        .update({ deleted_at: new Date().toISOString() })
        .in('id', selectedIds);

      if (error) throw error;

      toast(`Bulk soft-deleted ${selectedIds.length} project(s).`, 'success');
      setProjects(prev => prev.filter(p => !selectedIds.includes(p.id)));
      setSelectedIds([]);
      setBulkDeleteOpen(false);
    } catch (err) {
      console.error(err);
      toast('Bulk delete failed.', 'error');
    } finally {
      setBulkDeleting(false);
    }
  };

  // Saved Filters
  const handleSaveFilter = () => {
    if (!newFilterName.trim()) return;
    const filter: SavedFilter = {
      name: newFilterName.trim(),
      category: selectedCategory,
      status: selectedStatus,
      search: searchQuery
    };
    const updated = [...savedFilters, filter];
    setSavedFilters(updated);
    localStorage.setItem('portfolio_saved_filters', JSON.stringify(updated));
    setNewFilterName('');
    setSaveFilterOpen(false);
    toast(`Saved view "${filter.name}" created.`, 'success');
  };

  const handleRemoveFilter = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedFilters.filter(f => f.name !== name);
    setSavedFilters(updated);
    localStorage.setItem('portfolio_saved_filters', JSON.stringify(updated));
    toast('Saved view removed.', 'success');
  };

  const applySavedFilter = (filter: SavedFilter) => {
    setSelectedCategory(filter.category);
    setSelectedStatus(filter.status);
    setSearchQuery(filter.search);
    setCurrentPage(1);
    toast(`Applied filter preset: ${filter.name}`, 'info');
  };

  // Click sorting
  const toggleSort = (field: 'name' | 'category' | 'type' | 'status' | 'order') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Keyboard Shortcuts hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      // Alt + A: Select All
      if (e.altKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        selectAll();
      }
      // Alt + C: Clear Selection
      if (e.altKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        clearSelection();
      }
      // Alt + P: Bulk Publish
      if (e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        if (selectedIds.length > 0) handleBulkPublish(true);
      }
      // Alt + U: Bulk Unpublish
      if (e.altKey && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        if (selectedIds.length > 0) handleBulkPublish(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, projects, searchQuery, selectedCategory, selectedStatus]);

  // Filter calculation
  const filteredProjects = React.useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        project.slug.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || project.category_id === selectedCategory;
      
      let matchesStatus = true;
      if (selectedStatus === 'published') {
        matchesStatus = project.is_published;
      } else if (selectedStatus === 'unpublished') {
        matchesStatus = !project.is_published;
      } else if (selectedStatus === 'featured') {
        matchesStatus = project.is_featured;
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [projects, searchQuery, selectedCategory, selectedStatus]);

  // Sort calculation
  const sortedProjects = React.useMemo(() => {
    const result = [...filteredProjects];
    if (!sortField) return result;

    result.sort((a, b) => {
      let fieldA: string | number = '';
      let fieldB: string | number = '';

      if (sortField === 'order') {
        fieldA = a.display_order;
        fieldB = b.display_order;
      } else if (sortField === 'name') {
        fieldA = a.name.toLowerCase();
        fieldB = b.name.toLowerCase();
      } else if (sortField === 'category') {
        fieldA = (a.portfolio_categories?.name || '').toLowerCase();
        fieldB = (b.portfolio_categories?.name || '').toLowerCase();
      } else if (sortField === 'type') {
        fieldA = (a.project_types?.name || '').toLowerCase();
        fieldB = (b.project_types?.name || '').toLowerCase();
      } else if (sortField === 'status') {
        fieldA = a.is_published ? 1 : 0;
        fieldB = b.is_published ? 1 : 0;
      }

      if (fieldA < fieldB) return sortDirection === 'asc' ? -1 : 1;
      if (fieldA > fieldB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [filteredProjects, sortField, sortDirection]);

  // Paginate calculation
  const paginatedProjects = React.useMemo(() => {
    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage;
    return sortedProjects.slice(from, to);
  }, [sortedProjects, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedProjects.length / itemsPerPage);

  const toggleColumn = (col: string) => {
    setVisibleColumns(prev => 
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  return (
    <div className="space-y-6">
      {/* Controls: Search, Add, column selectors */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Saved views & Key info buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowShortcutsHelp(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-800 bg-[#1A1A1A] text-xs text-gray-400 hover:text-white cursor-pointer hover:border-gray-700 font-bold transition-all"
            title="Keyboard Shortcuts Guide"
          >
            <Keyboard className="h-4 w-4" />
            <span>Shortcuts</span>
          </button>
        </div>

        <Link href="/admin/portfolio/new">
          <Button variant="accent" size="sm" className="bg-[#C9A86A] text-[#111111] hover:bg-[#C9A86A]/95 font-bold cursor-pointer">
            <Plus className="h-4 w-4 mr-1.5" />
            <span>Add Showcase Project</span>
          </Button>
        </Link>
      </div>

      {/* Saved Views row */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg border border-gray-850 bg-[#141414]">
        <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Saved Presets:</span>
        {savedFilters.length === 0 ? (
          <span className="text-[10px] text-gray-600 italic">No saved views yet</span>
        ) : (
          savedFilters.map(f => (
            <button
              key={f.name}
              onClick={() => applySavedFilter(f)}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-gray-900 border border-gray-800 text-[10px] text-gray-400 hover:text-white cursor-pointer hover:border-gray-700 transition-colors"
            >
              <span>{f.name}</span>
              <span 
                onClick={(e) => handleRemoveFilter(f.name, e)}
                className="text-red-500 hover:text-red-400 font-bold ml-1 text-[10px] cursor-pointer"
                title="Remove view"
              >
                ×
              </span>
            </button>
          ))
        )}
        <button
          onClick={() => setSaveFilterOpen(true)}
          className="text-[10px] text-[#C9A86A] hover:underline font-bold cursor-pointer ml-3"
        >
          + Save current view
        </button>
      </div>

      {/* Advanced Filters toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-550" />
          <input
            type="text"
            placeholder="Search by project name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2.5 rounded-md border border-gray-800 bg-[#111111] text-xs text-white placeholder-gray-655 outline-none focus:border-[#C9A86A] focus-visible:ring-1 focus-visible:ring-[#C9A86A]"
          />
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={selectedCategory}
            aria-label="Filter projects by category"
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2.5 rounded-md border border-gray-800 bg-[#111111] text-xs text-white outline-none focus:border-[#C9A86A] focus-visible:ring-1 focus-visible:ring-[#C9A86A]"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={selectedStatus}
            aria-label="Filter projects by publication status"
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2.5 rounded-md border border-gray-800 bg-[#111111] text-xs text-white outline-none focus:border-[#C9A86A] focus-visible:ring-1 focus-visible:ring-[#C9A86A]"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published Only</option>
            <option value="unpublished">Draft Only</option>
            <option value="featured">Featured Only</option>
          </select>
        </div>
      </div>

      {/* Column Visibility controls */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
        <span className="font-semibold text-[10px] uppercase tracking-wider text-gray-500">Columns:</span>
        {['order', 'cover', 'category', 'type', 'status'].map(col => {
          const isVisible = visibleColumns.includes(col);
          return (
            <button
              key={col}
              onClick={() => toggleColumn(col)}
              className={`px-2 py-0.5 rounded border text-[10px] transition-colors cursor-pointer capitalize ${
                isVisible 
                  ? 'border-[#C9A86A]/40 bg-[#C9A86A]/10 text-white font-semibold' 
                  : 'border-gray-850 bg-[#111111] text-gray-500 hover:border-gray-700'
              }`}
            >
              {col}
            </button>
          );
        })}
      </div>

      {/* Bulk actions status panel */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 animate-fade-in text-xs text-white">
          <div className="flex items-center space-x-3.5">
            <span className="font-semibold text-[#C9A86A]">{selectedIds.length} item(s) selected</span>
            <button
              onClick={clearSelection}
              className="text-gray-400 hover:text-white cursor-pointer underline hover:no-underline font-semibold"
            >
              Clear Selection
            </button>
            <button
              onClick={selectAll}
              className="text-gray-400 hover:text-white cursor-pointer underline hover:no-underline font-semibold"
            >
              Select All Filtered ({sortedProjects.length})
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleBulkPublish(true)}
              disabled={bulkPublishing}
              className="bg-[#C9A86A] text-black hover:bg-[#e5c583] font-bold px-3 py-1.5 text-[10px] cursor-pointer"
              size="sm"
            >
              Publish Selected
            </Button>
            <Button
              onClick={() => handleBulkPublish(false)}
              disabled={bulkPublishing}
              className="bg-gray-800 text-white hover:bg-gray-700 font-bold px-3 py-1.5 text-[10px] cursor-pointer border border-gray-750"
              size="sm"
            >
              Unpublish Selected
            </Button>
            <Button
              onClick={() => setBulkDeleteOpen(true)}
              disabled={bulkDeleting}
              className="bg-red-650 hover:bg-red-750 text-white font-bold px-3 py-1.5 text-[10px] cursor-pointer"
              size="sm"
            >
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Projects Table */}
      <div className="rounded-xl border border-gray-800 bg-[#1A1A1A] overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4 text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin text-[#C9A86A]" />
            <span className="text-xs tracking-widest uppercase font-mono">Loading Projects Directory...</span>
          </div>
        ) : paginatedProjects.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4 text-center px-6">
            <div className="h-12 w-12 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-600 animate-pulse">
              <Briefcase className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-300">No Projects Found</p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">
                Try adjusting filters, searching, or click &quot;Add Showcase Project&quot; to index new entries.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#C9A86A]/10 bg-[#141414] text-[10px] font-bold uppercase tracking-wider text-gray-400 select-none">
                  {/* Selection Checkbox */}
                  <th scope="col" className="py-4 px-6 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === sortedProjects.length && sortedProjects.length > 0}
                      onChange={() => {
                        if (selectedIds.length === sortedProjects.length) {
                          clearSelection();
                        } else {
                          selectAll();
                        }
                      }}
                      className="h-4 w-4 rounded accent-[#C9A86A] border-gray-800 bg-[#111111] cursor-pointer"
                    />
                  </th>
                  
                  {visibleColumns.includes('order') && (
                    <th scope="col" onClick={() => toggleSort('order')} className="py-4 px-6 w-20 cursor-pointer hover:text-white transition-colors">
                      Order {sortField === 'order' && (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                    </th>
                  )}
                  {visibleColumns.includes('cover') && (
                    <th scope="col" className="py-4 px-6 w-24">Cover</th>
                  )}
                  
                  <th scope="col" onClick={() => toggleSort('name')} className="py-4 px-6 cursor-pointer hover:text-white transition-colors">
                    Project Details {sortField === 'name' && (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                  </th>
                  
                  {visibleColumns.includes('category') && (
                    <th scope="col" onClick={() => toggleSort('category')} className="py-4 px-6 cursor-pointer hover:text-white transition-colors">
                      Category {sortField === 'category' && (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                    </th>
                  )}
                  {visibleColumns.includes('type') && (
                    <th scope="col" onClick={() => toggleSort('type')} className="py-4 px-6 cursor-pointer hover:text-white transition-colors">
                      Type {sortField === 'type' && (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                    </th>
                  )}
                  {visibleColumns.includes('status') && (
                    <th scope="col" onClick={() => toggleSort('status')} className="py-4 px-6 w-36 text-center cursor-pointer hover:text-white transition-colors">
                      Status {sortField === 'status' && (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                    </th>
                  )}
                  
                  <th scope="col" className="py-4 px-6 w-32 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40 text-xs">
                {paginatedProjects.map((project, idx) => {
                  const coverUrl = project.cover_media?.public_url;
                  const isSelected = selectedIds.includes(project.id);
                  
                  return (
                    <tr 
                      key={project.id} 
                      className={`transition-colors group hover:bg-white/[0.01] ${
                        isSelected ? 'bg-[#C9A86A]/5' : ''
                      }`}
                    >
                      {/* Selection Box */}
                      <td className="py-4 px-6 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(project.id)}
                          className="h-3.5 w-3.5 rounded accent-[#C9A86A] border-gray-800 bg-[#111111] cursor-pointer"
                        />
                      </td>

                      {/* Display order arrows */}
                      {visibleColumns.includes('order') && (
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleMove(idx, 'up')}
                              disabled={idx === 0 && currentPage === 1}
                              title="Move Up"
                              className="p-1 rounded bg-[#111111] hover:bg-gray-850 border border-gray-800 disabled:opacity-20 transition-colors text-gray-400 hover:text-white cursor-pointer"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleMove(idx, 'down')}
                              disabled={idx === paginatedProjects.length - 1 && currentPage === totalPages}
                              title="Move Down"
                              className="p-1 rounded bg-[#111111] hover:bg-gray-850 border border-gray-800 disabled:opacity-20 transition-colors text-gray-400 hover:text-white cursor-pointer"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      )}

                      {/* Cover Photo */}
                      {visibleColumns.includes('cover') && (
                        <td className="py-4 px-6">
                          <div className="relative h-10 w-14 rounded overflow-hidden bg-gray-900 border border-gray-850 flex items-center justify-center">
                            {coverUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={coverUrl}
                                alt={`Cover preview`}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-4 w-4 text-gray-700" />
                            )}
                          </div>
                        </td>
                      )}

                      {/* Name slug detail specifications */}
                      <td className="py-4 px-6">
                        <div className="max-w-xs sm:max-w-md">
                          <p className="font-semibold text-white group-hover:text-[#C9A86A] transition-colors">
                            {project.name}
                          </p>
                          <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                            /{project.slug}
                          </p>
                          <div className="flex items-center space-x-3 text-[10px] text-gray-400 mt-1 font-light">
                            {project.location && <span>{project.location}</span>}
                            {project.completion_year && <span>• {project.completion_year}</span>}
                          </div>
                        </div>
                      </td>

                      {/* Category specifications */}
                      {visibleColumns.includes('category') && (
                        <td className="py-4 px-6 text-xs text-gray-300 font-medium">
                          {project.portfolio_categories?.name || (
                            <span className="text-gray-600 italic">None</span>
                          )}
                        </td>
                      )}

                      {/* Project types */}
                      {visibleColumns.includes('type') && (
                        <td className="py-4 px-6 text-xs text-gray-400">
                          {project.project_types?.name || (
                            <span className="text-gray-600 italic">-</span>
                          )}
                        </td>
                      )}

                      {/* Status Badges */}
                      {visibleColumns.includes('status') && (
                        <td className="py-4 px-6 text-center">
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                            <button
                              onClick={() => handleTogglePublish(project)}
                              title={`Click to toggle published status`}
                              className="focus:outline-none rounded cursor-pointer"
                            >
                              {project.is_published ? (
                                <Badge variant="accent" className="flex items-center text-[9px] hover:bg-[#C9A86A]/20 transition-all font-semibold">
                                  <Eye className="h-3 w-3 mr-1" />
                                  <span>Published</span>
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="flex items-center text-[9px] border-gray-600 text-gray-450 hover:bg-gray-800 transition-all font-semibold">
                                  <EyeOff className="h-3 w-3 mr-1" />
                                  <span>Draft</span>
                                </Badge>
                              )}
                            </button>

                            <button
                              onClick={() => handleToggleFeatured(project)}
                              title="Click to toggle featured status"
                              className="focus:outline-none rounded cursor-pointer"
                            >
                              {project.is_featured ? (
                                <Badge variant="accent" className="flex items-center text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all font-semibold">
                                  <Star className="h-3 w-3 mr-1 fill-amber-400" />
                                  <span>Featured</span>
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="flex items-center text-[9px] border-gray-750 text-gray-500 hover:bg-gray-800 transition-all font-semibold">
                                  <Star className="h-3 w-3 mr-1 text-gray-600" />
                                  <span>Regular</span>
                                </Badge>
                              )}
                            </button>
                          </div>
                        </td>
                      )}

                      {/* Table row action items */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={`/admin/portfolio/${project.id}`}
                            className="p-2 rounded bg-gray-900 border border-gray-800 hover:border-[#C9A86A]/30 hover:bg-[#252525] text-gray-300 hover:text-[#C9A86A] transition-all cursor-pointer focus:outline-none"
                            title="Edit Project"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => confirmDelete(project)}
                            className="p-2 rounded bg-gray-900 border border-gray-800 hover:border-red-500/30 hover:bg-red-500/5 text-gray-300 hover:text-red-400 transition-all cursor-pointer focus:outline-none"
                            title="Delete Project (Soft Delete)"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl border border-gray-800 bg-[#1A1A1A] text-xs text-gray-400">
          <div className="flex items-center gap-3">
            <span>
              Showing { (currentPage - 1) * itemsPerPage + 1 } to { Math.min(currentPage * itemsPerPage, sortedProjects.length) } of { sortedProjects.length } projects
            </span>
            
            {/* Items Per Page Selector */}
            <div className="flex items-center gap-1.5">
              <span>Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded border border-gray-800 bg-black text-xs text-white outline-none focus:border-[#C9A86A]"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              variant="outline"
              className="border-gray-800 text-xs px-2.5 py-1 text-gray-400 cursor-pointer"
            >
              Previous
            </Button>
            
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-7 h-7 text-xs rounded border transition-colors cursor-pointer ${
                  currentPage === i + 1 
                    ? 'border-[#C9A86A] bg-[#C9A86A]/10 text-white font-bold' 
                    : 'border-gray-800 bg-black hover:border-gray-700'
                }`}
              >
                {i + 1}
              </button>
            ))}

            <Button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              variant="outline"
              className="border-gray-800 text-xs px-2.5 py-1 text-gray-400 cursor-pointer"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help Dialog Modal */}
      <Modal
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
        title="Admin Shortcuts Panel"
        className="max-w-md text-white border-white/5 bg-[#111111]/95"
      >
        <div className="space-y-4 pt-2 font-sans text-xs">
          <p className="text-gray-400">
            Rapidly perform actions directly on the portfolio project tables:
          </p>
          
          <div className="divide-y divide-gray-850 border border-gray-850 rounded bg-black/60 p-2 font-mono">
            <div className="flex justify-between py-2 px-1">
              <span className="text-[#C9A86A] font-bold">Alt + A</span>
              <span className="text-gray-400">Select All Filtered Items</span>
            </div>
            <div className="flex justify-between py-2 px-1">
              <span className="text-[#C9A86A] font-bold">Alt + C</span>
              <span className="text-gray-400">Clear All Selections</span>
            </div>
            <div className="flex justify-between py-2 px-1">
              <span className="text-[#C9A86A] font-bold">Alt + P</span>
              <span className="text-gray-400">Publish Selected Items</span>
            </div>
            <div className="flex justify-between py-2 px-1">
              <span className="text-[#C9A86A] font-bold">Alt + U</span>
              <span className="text-gray-400">Unpublish Selected Items</span>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-gray-850/40 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowShortcutsHelp(false)}
              className="border-gray-800 text-gray-400 hover:text-white cursor-pointer"
            >
              Dismiss Help
            </Button>
          </div>
        </div>
      </Modal>

      {/* Save Filter Preset Modal */}
      <Modal
        isOpen={saveFilterOpen}
        onClose={() => setSaveFilterOpen(false)}
        title="Create Filter Preset"
        className="max-w-md text-white border-[#C9A86A]/20"
      >
        <div className="space-y-4 pt-2 font-sans text-xs">
          <p className="text-gray-400">
            Save current filter criteria (Search phrase, Category, and status) as a reusable view preset.
          </p>
          
          <div className="space-y-1.5">
            <label className="text-gray-450 block">Preset Name</label>
            <input
              type="text"
              placeholder="e.g. Draft Showcase, Wedding Highlights"
              value={newFilterName}
              onChange={(e) => setNewFilterName(e.target.value)}
              className="w-full px-3 py-2 rounded border border-gray-800 bg-black text-xs text-white outline-none focus:border-[#C9A86A]"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-800/40">
            <Button
              variant="outline"
              type="button"
              onClick={() => setSaveFilterOpen(false)}
              className="border-gray-800 text-gray-400 hover:text-white cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="accent"
              type="button"
              onClick={handleSaveFilter}
              className="bg-[#C9A86A] text-[#111111] hover:bg-[#C9A86A]/90 font-bold cursor-pointer"
            >
              Save View
            </Button>
          </div>
        </div>
      </Modal>

      {/* Single Soft Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => !deleting && setDeleteModalOpen(false)}
        title="Confirm Soft Delete"
        className="border-red-500/20 max-w-md text-white font-sans"
      >
        <div className="space-y-6 pt-3">
          <div className="flex items-start space-x-3.5">
            <div className="p-2 rounded bg-red-500/10 text-red-550 flex-shrink-0">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold">Delete Project?</p>
              <p className="text-xs text-gray-400 leading-relaxed mt-1">
                Are you sure you want to delete <span className="text-white font-medium">&quot;{projectToDelete?.name}&quot;</span>?
                This will soft delete the project, meaning it will immediately hide from the public selected showcase gallery but remains in database archives.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 border-t border-gray-800/40 pt-4">
            <Button
              variant="outline"
              disabled={deleting}
              onClick={() => setDeleteModalOpen(false)}
              className="border-gray-800 text-gray-400 hover:text-white cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="accent"
              disabled={deleting}
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer"
            >
              {deleting ? 'Deleting...' : 'Delete Project'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Delete Confirmation Modal */}
      <Modal
        isOpen={bulkDeleteOpen}
        onClose={() => !bulkDeleting && setBulkDeleteOpen(false)}
        title="Confirm Bulk Soft Delete"
        className="border-red-500/20 max-w-md text-white font-sans"
      >
        <div className="space-y-6 pt-3">
          <div className="flex items-start space-x-3.5">
            <div className="p-2 rounded bg-red-500/10 text-red-550 flex-shrink-0">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold">Delete Multiple Projects?</p>
              <p className="text-xs text-gray-400 leading-relaxed mt-1">
                Are you sure you want to soft-delete <span className="text-white font-semibold">{selectedIds.length} select project(s)</span>?
                They will immediately hide from all showcase components but persist in data archives.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 border-t border-gray-800/40 pt-4">
            <Button
              variant="outline"
              disabled={bulkDeleting}
              onClick={() => setBulkDeleteOpen(false)}
              className="border-gray-800 text-gray-450 hover:text-white cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="accent"
              disabled={bulkDeleting}
              onClick={handleBulkDelete}
              className="bg-red-650 hover:bg-red-750 text-white font-bold cursor-pointer"
            >
              {bulkDeleting ? 'Deleting Projects...' : 'Delete Selected Projects'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
