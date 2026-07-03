'use client';

import React, { useState } from 'react';
import { Briefcase } from 'lucide-react';
import { Tabs } from '@/components/ui/Tabs';
import { PortfolioProjectsTab } from '@/components/admin/PortfolioProjectsTab';
import { PortfolioCategoriesTab } from '@/components/admin/PortfolioCategoriesTab';
import { PortfolioTagsTab } from '@/components/admin/PortfolioTagsTab';
import { PortfolioProjectTypesTab } from '@/components/admin/PortfolioProjectTypesTab';

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState('projects');

  const tabs = [
    { id: 'projects', label: 'Projects' },
    { id: 'categories', label: 'Categories' },
    { id: 'tags', label: 'Tags' },
    { id: 'types', label: 'Project Types' },
  ];

  return (
    <div className="space-y-8 font-sans text-white">
      {/* Top Banner Header */}
      <div>
        <span className="text-[10px] tracking-[0.25em] text-[#C9A86A] uppercase font-bold flex items-center gap-1.5">
          <Briefcase className="h-3 w-3" /> Creative Portfolio
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-semibold mt-1">
          Portfolio Management
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm mt-1">
          Bespoke showcase directories, taxonomy categories, tag clouds, and project parameters.
        </p>
      </div>

      {/* Tabs sub-nav bar */}
      <Tabs
        tabs={tabs}
        activeTabId={activeTab}
        onChange={(id) => setActiveTab(id)}
        variant="underline"
        className="border-b border-gray-800"
      />

      {/* Active Tab Panel */}
      <div className="pt-2">
        {activeTab === 'projects' && <PortfolioProjectsTab />}
        {activeTab === 'categories' && <PortfolioCategoriesTab />}
        {activeTab === 'tags' && <PortfolioTagsTab />}
        {activeTab === 'types' && <PortfolioProjectTypesTab />}
      </div>
    </div>
  );
}
