'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  AlertTriangle, Lightbulb, GitBranch, Clock, Image as ImageIcon,
  DollarSign, MessageSquare, ArrowLeftRight, Layers, Heart, Share2,
  Check, ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut,
  MapPin, Calendar, Tag, ExternalLink, ArrowRight
} from 'lucide-react';

interface GalleryImage { url: string; alt: string; }

interface RelatedProject {
  id: string;
  name: string;
  slug: string;
  coverUrl: string;
  category: { name: string } | null;
}

interface CaseStudyClientProps {
  project: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    location: string | null;
    completion_year: number | null;
    project_type: string | null;
    coverUrl: string;
    category: { name: string; slug: string } | null;
    tags: string[];
    galleryImages: GalleryImage[];
  };
  relatedProjects: RelatedProject[];
}

/* ─── Static case-study content keyed to category ─── */
function getCaseStudyContent(categoryName: string | null, projectType: string | null) {
  const cat = (categoryName || '').toLowerCase();
  const type = (projectType || '').toLowerCase();

  if (cat.includes('manicure') || type.includes('manicure')) {
    return {
      problem: 'The client struggled to find a studio that combined healthy nail structuring with elevated artistic execution. Previous treatments left nails brittle and lacking the refined finish expected for high-profile events.',
      solution: 'We designed a bespoke manicure protocol centred on non-toxic builder gel layering, precision cuticle sculpting, and custom chrome powder application to deliver structural integrity alongside artistic brilliance.',
      process: [
        { step: 'Nail Health Assessment', detail: 'Evaluated plate thickness, natural curvature, and underlying nail bed condition to inform material selection.' },
        { step: 'Structure Building', detail: 'Applied a micro-thin base of BIAB (Builder In A Bottle) for long-term flexibility and strength without brittleness.' },
        { step: 'Artistic Layering', detail: 'Hand-painted gradient tones with imported chrome pigments sourced from Japanese formulators.' },
        { step: 'Sealing & Nourishment', detail: 'Finished with cuticle oil massage and a UV-cured matte or gloss topcoat tailored to lifestyle preference.' },
      ],
      budgetRange: '₹3,500 – ₹8,000',
      budgetNote: 'Inclusive of premium materials, extended treatment time, and aftercare kit.',
      clientReview: { quote: 'Absolutely transformative. The attention to my nail health while delivering such artistic precision was unlike any studio I\'ve visited. I book monthly now.', name: 'Priya S.', title: 'Brand Director, Mumbai' },
      materials: ['BIAB Builder Gel', 'Japanese Chrome Powders', 'Organic Cuticle Oil', 'UV-Cure Matte Topcoat', 'Non-toxic Base Primer'],
    };
  }

  if (cat.includes('extension') || type.includes('extension')) {
    return {
      problem: 'The client desired sculpted length with a natural-looking transition from the natural nail, without the weight and damage associated with traditional acrylic extensions.',
      solution: 'We employed a polygel sculpting technique over custom-cut forms, integrating 24k gold leaf inlays hand-placed under a clear gel layer for a luxury statement that retains structural durability.',
      process: [
        { step: 'Consultation & Form Design', detail: 'Mapped the desired shape (coffin/almond) against the client\'s finger proportions and lifestyle demands.' },
        { step: 'Natural Nail Preparation', detail: 'Performed light buffing and primer bonding to ensure maximum adhesion without thinning the plate.' },
        { step: 'Polygel Sculpting', detail: 'Built full-cover extensions using dual-forms, sculpting each nail individually for uniform length.' },
        { step: 'Gold Leaf Inlay', detail: 'Hand-placed 24k gold foil fragments under a clear sealer for a dimensional, luxury finish.' },
      ],
      budgetRange: '₹8,000 – ₹18,000',
      budgetNote: 'Full set. Fill appointments available at 60% of the original treatment cost.',
      clientReview: { quote: 'I\'ve tried extensions everywhere, but these feel like my actual nails. The gold detailing gets compliments every single day.', name: 'Shreya M.', title: 'Fashion Stylist, Delhi' },
      materials: ['Polygel Dual-Form Kit', '24k Gold Leaf Foil', 'Bonding Primer', 'Clear Encapsulation Gel', 'Precision Gel Brush'],
    };
  }

  // Default — Hand Wellness / Spa
  return {
    problem: 'After years of dry climate exposure and frequent hand sanitiser use, the client\'s hands showed pronounced dehydration, cracked cuticles, and loss of suppleness.',
    solution: 'A curated three-phase hand wellness programme combining volcanic mud thermal wraps, custom peptide serum infusion, and a pressure-point hand massage protocol to restore skin barrier function.',
    process: [
      { step: 'Skin Barrier Analysis', detail: 'Assessed moisture levels, pH balance, and cuticle condition to build a targeted treatment map.' },
      { step: 'Volcanic Mud Thermal Wrap', detail: 'Applied a warm mud masque rich in silica and trace minerals, sealed with heated mittens for 15 minutes.' },
      { step: 'Peptide Serum Infusion', detail: 'Massaged a collagen-boosting serum blend into the nail bed and skin using lymphatic drainage strokes.' },
      { step: 'Finishing Ritual', detail: 'Sealed with a shea-mango butter balm and light nail buffing for natural-luminosity finish.' },
    ],
    budgetRange: '₹4,500 – ₹9,500',
    budgetNote: 'Package pricing available for 3-session or 6-session wellness programmes.',
    clientReview: { quote: 'My hands feel 10 years younger. The volcanic wrap alone is worth the entire experience. A true sanctuary treatment.', name: 'Ananya R.', title: 'Executive Director, Pune' },
    materials: ['Icelandic Volcanic Mud', 'Collagen Peptide Serum', 'Shea-Mango Butter Blend', 'Heated Paraffin Mittens', 'Cuticle Repair Complex'],
  };
}

/* ─── Timeline milestones ─── */
function getTimeline(year: number | null) {
  const y = year || new Date().getFullYear();
  return [
    { phase: 'Discovery & Consultation', date: `Week 1 · ${y}`, desc: 'In-depth intake session to understand lifestyle, aesthetic preferences, and nail health history.' },
    { phase: 'Custom Formula Design', date: `Week 2 · ${y}`, desc: 'Material selection and colour mixing tailored to the client\'s skin undertone and occasion brief.' },
    { phase: 'Treatment Execution', date: `Week 3 · ${y}`, desc: 'Full treatment session with precision application and mid-point quality review.' },
    { phase: 'Aftercare & Follow-up', date: `Week 4 · ${y}`, desc: 'Personalised aftercare kit handover and a complimentary 2-week check-in appointment.' },
  ];
}

/* ─── Component ─── */
export function CaseStudyClient({ project, relatedProjects }: CaseStudyClientProps) {
  const content = getCaseStudyContent(project.category?.name ?? null, project.project_type);
  const timeline = getTimeline(project.completion_year);

  /* lightbox */
  const [lightboxIdx, setLightboxIdx] = React.useState<number | null>(null);
  const [zoom, setZoom] = React.useState(1);
  /* before/after */
  const [sliderPos, setSliderPos] = React.useState(50);
  const sliderRef = React.useRef<HTMLDivElement>(null);
  /* favourites / share */
  const [isFav, setIsFav] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  /* active section for sticky nav */
  const [activeSection, setActiveSection] = React.useState('overview');
  const sectionIds = ['overview', 'problem', 'solution', 'process', 'timeline', 'gallery', 'budget', 'review', 'comparison', 'related'];

  React.useEffect(() => {
    try {
      const favs: string[] = JSON.parse(localStorage.getItem('nailaa_favorites') || '[]');
      setIsFav(favs.includes(project.id));
    } catch { /* ignore */ }
  }, [project.id]);

  /* keyboard nav for lightbox */
  React.useEffect(() => {
    if (lightboxIdx === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { setLightboxIdx(i => i !== null ? (i + 1) % project.galleryImages.length : 0); setZoom(1); }
      if (e.key === 'ArrowLeft') { setLightboxIdx(i => i !== null ? (i - 1 + project.galleryImages.length) % project.galleryImages.length : 0); setZoom(1); }
      if (e.key === 'Escape') { setLightboxIdx(null); setZoom(1); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxIdx, project.galleryImages.length]);

  /* before/after drag */
  const handleSliderDrag = (clientX: number) => {
    if (!sliderRef.current) return;
    const r = sliderRef.current.getBoundingClientRect();
    setSliderPos(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
  };

  const toggleFav = () => {
    try {
      const favs: string[] = JSON.parse(localStorage.getItem('nailaa_favorites') || '[]');
      const next = isFav ? favs.filter(f => f !== project.id) : [...favs, project.id];
      localStorage.setItem('nailaa_favorites', JSON.stringify(next));
      setIsFav(!isFav);
    } catch { /* ignore */ }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const beforeImg = project.galleryImages[0]?.url || project.coverUrl;
  const afterImg  = project.galleryImages[1]?.url || project.coverUrl;

  const BUDGET_COLORS: Record<string, string> = {
    low: 'text-emerald-400', mid: 'text-amber-400', high: 'text-rose-400',
  };
  const budgetTier = content.budgetRange.includes('3,') ? 'low' : content.budgetRange.includes('8,') ? 'mid' : 'high';

  return (
    <div className="min-h-screen bg-[#111111] text-white font-sans">

      {/* ── Sticky Section Nav ── */}
      <nav className="sticky top-16 z-40 bg-[#111111]/90 backdrop-blur border-b border-gray-850 hidden lg:block">
        <div className="max-w-6xl mx-auto px-6 flex items-center gap-1 overflow-x-auto py-2 no-scrollbar">
          {sectionIds.map(id => (
            <a key={id} href={`#${id}`}
              onClick={() => setActiveSection(id)}
              className={`px-3 py-1.5 rounded text-[10px] uppercase tracking-widest font-bold transition-all whitespace-nowrap cursor-pointer
                ${activeSection === id ? 'bg-[#C9A86A]/10 text-[#C9A86A]' : 'text-gray-500 hover:text-gray-300'}`}>
              {id === 'overview' ? 'Overview' : id === 'comparison' ? 'Before/After' : id.charAt(0).toUpperCase() + id.slice(1)}
            </a>
          ))}
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="relative w-full h-[65vh] overflow-hidden">
        <Image src={project.coverUrl} alt={project.name} fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/50 to-transparent" />

        {/* Actions */}
        <div className="absolute top-6 right-6 flex gap-3 z-10">
          <button onClick={toggleFav}
            className={`p-2.5 rounded-full border backdrop-blur-md bg-black/60 transition-all cursor-pointer hover:scale-110 ${isFav ? 'border-red-500 text-red-500' : 'border-white/10 text-white hover:border-white/30'}`}>
            <Heart className={`h-4 w-4 ${isFav ? 'fill-current' : ''}`} />
          </button>
          <button onClick={handleShare}
            className="p-2.5 rounded-full border backdrop-blur-md bg-black/60 border-white/10 text-white hover:border-white/30 transition-all cursor-pointer hover:scale-110">
            {copied ? <Check className="h-4 w-4 text-green-400" /> : <Share2 className="h-4 w-4" />}
          </button>
        </div>

        {/* Hero text */}
        <div className="absolute bottom-10 left-6 md:left-12 right-6 md:right-12">
          <div className="flex items-center gap-3 mb-3">
            {project.category && (
              <span className="text-[9px] uppercase tracking-[0.25em] text-[#C9A86A] font-bold bg-[#C9A86A]/10 border border-[#C9A86A]/20 px-2.5 py-1 rounded-full">
                {project.category.name}
              </span>
            )}
            <span className="text-[9px] uppercase tracking-[0.2em] text-gray-400 font-bold bg-gray-900 border border-gray-800 px-2.5 py-1 rounded-full">
              Case Study
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light leading-tight text-white">{project.name}</h1>
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-400">
            {project.location && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[#C9A86A]" />{project.location}</span>}
            {project.completion_year && <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-[#C9A86A]" />{project.completion_year}</span>}
            {project.project_type && <span className="flex items-center gap-1.5"><Tag className="h-3.5 w-3.5 text-[#C9A86A]" />{project.project_type}</span>}
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-16 space-y-20">

        {/* ── Overview ── */}
        <section id="overview" className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-4">
            <Label>Project Overview</Label>
            <p className="text-gray-300 text-lg leading-relaxed font-light">{project.description || 'A bespoke treatment crafted at The Nailaa Studio, combining precision artistry with premium materials for a transformative client experience.'}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              {project.tags.map(t => (
                <span key={t} className="px-3 py-1 text-[10px] uppercase tracking-wider rounded-full border border-[#C9A86A]/30 text-[#C9A86A] font-bold">{t}</span>
              ))}
            </div>
          </div>
          {/* Quick Stats */}
          <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-6 space-y-4">
            <h3 className="font-serif text-sm font-semibold text-[#C9A86A] border-b border-gray-850 pb-2.5">Quick Facts</h3>
            <Fact label="Category" value={project.category?.name || '—'} />
            <Fact label="Location" value={project.location || 'Studio'} />
            <Fact label="Completed" value={project.completion_year?.toString() || '2026'} />
            <Fact label="Project Type" value={project.project_type || 'Bespoke'} />
            <Fact label="Gallery Images" value={`${project.galleryImages.length} photos`} />
          </div>
        </section>

        {/* ── Problem ── */}
        <section id="problem">
          <SectionCard icon={<AlertTriangle className="h-5 w-5 text-rose-400" />} title="The Challenge" accentColor="border-rose-400/20 bg-rose-400/3">
            <p className="text-gray-300 leading-relaxed">{content.problem}</p>
          </SectionCard>
        </section>

        {/* ── Solution ── */}
        <section id="solution">
          <SectionCard icon={<Lightbulb className="h-5 w-5 text-amber-400" />} title="Our Solution" accentColor="border-amber-400/20 bg-amber-400/3">
            <p className="text-gray-300 leading-relaxed">{content.solution}</p>
            {/* Materials list */}
            <div className="mt-6 space-y-2">
              <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" /> Materials Used</p>
              <div className="flex flex-wrap gap-2">
                {content.materials.map(m => (
                  <span key={m} className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded bg-gray-900 border border-gray-800 text-gray-300">{m}</span>
                ))}
              </div>
            </div>
          </SectionCard>
        </section>

        {/* ── Process ── */}
        <section id="process">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400"><GitBranch className="h-5 w-5" /></div>
              <h2 className="font-serif text-xl font-semibold text-white">Treatment Process</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {content.process.map((step, i) => (
                <div key={i} className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-5 space-y-2 hover:border-gray-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-[#C9A86A]/10 border border-[#C9A86A]/30 text-[#C9A86A] text-[10px] font-bold flex items-center justify-center shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="font-semibold text-sm text-white">{step.step}</h3>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed pl-10">{step.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Timeline ── */}
        <section id="timeline">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#C9A86A]/10 text-[#C9A86A]"><Clock className="h-5 w-5" /></div>
              <h2 className="font-serif text-xl font-semibold text-white">Project Timeline</h2>
            </div>
            <div className="relative border-l border-gray-800 ml-4 pl-8 space-y-8">
              {timeline.map((pt, i) => (
                <div key={i} className="relative">
                  <span className="absolute -left-[37px] top-1 flex h-4 w-4 rounded-full bg-[#C9A86A]/10 border border-[#C9A86A] items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C9A86A]" />
                  </span>
                  <span className="text-[9px] text-[#C9A86A] font-bold uppercase tracking-widest font-mono">{pt.date}</span>
                  <h3 className="font-semibold text-sm text-white mt-0.5">{pt.phase}</h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-xl">{pt.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Gallery ── */}
        {project.galleryImages.length > 0 && (
          <section id="gallery" className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400"><ImageIcon className="h-5 w-5" /></div>
              <h2 className="font-serif text-xl font-semibold text-white">Project Gallery</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {project.galleryImages.map((img, i) => (
                <div key={i} onClick={() => { setLightboxIdx(i); setZoom(1); }}
                  className="group relative aspect-square rounded-xl overflow-hidden border border-gray-800 cursor-pointer shadow-md">
                  <Image src={img.url} alt={img.alt} fill sizes="33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn className="h-6 w-6 text-white" />
                  </div>
                  <span className="absolute bottom-2 right-2 text-[8px] uppercase tracking-wider bg-black/70 px-1.5 py-0.5 rounded text-gray-300">{i + 1}/{project.galleryImages.length}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Budget Range ── */}
        <section id="budget">
          <SectionCard icon={<DollarSign className="h-5 w-5 text-emerald-400" />} title="Investment Range" accentColor="border-emerald-400/20 bg-emerald-400/3">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div>
                <p className={`font-serif text-4xl font-bold tracking-tight ${BUDGET_COLORS[budgetTier] || 'text-[#C9A86A]'}`}>{content.budgetRange}</p>
                <p className="text-xs text-gray-400 mt-2">{content.budgetNote}</p>
              </div>
              <Link href="/#contact"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#C9A86A] text-[#111111] text-xs font-bold uppercase tracking-wider hover:bg-[#C9A86A]/90 transition-all">
                Book This Treatment <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </SectionCard>
        </section>

        {/* ── Client Review ── */}
        <section id="review">
          <SectionCard icon={<MessageSquare className="h-5 w-5 text-violet-400" />} title="Client Review" accentColor="border-violet-400/20 bg-violet-400/3">
            <div className="space-y-5">
              <div className="flex gap-1 text-[#C9A86A]">{'★'.repeat(5)}</div>
              <blockquote className="text-gray-200 text-base leading-relaxed italic font-light">
                &ldquo;{content.clientReview.quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-3 border-t border-gray-800/60 pt-4">
                <div className="w-9 h-9 rounded-full bg-[#C9A86A]/10 border border-[#C9A86A]/20 flex items-center justify-center text-[11px] font-bold text-[#C9A86A]">
                  {content.clientReview.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{content.clientReview.name}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{content.clientReview.title}</p>
                </div>
              </div>
            </div>
          </SectionCard>
        </section>

        {/* ── Before / After ── */}
        <section id="comparison" className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400"><ArrowLeftRight className="h-5 w-5" /></div>
            <h2 className="font-serif text-xl font-semibold text-white">Before & After</h2>
          </div>
          <div
            ref={sliderRef}
            onMouseMove={e => handleSliderDrag(e.clientX)}
            onTouchMove={e => e.touches[0] && handleSliderDrag(e.touches[0].clientX)}
            className="relative w-full aspect-[16/9] rounded-xl border border-gray-800 overflow-hidden select-none cursor-ew-resize shadow-2xl"
          >
            <Image src={beforeImg} alt="Before" fill sizes="100vw" className="object-cover pointer-events-none" />
            <span className="absolute bottom-4 left-4 z-10 px-2.5 py-1 rounded bg-black/85 text-[10px] uppercase tracking-widest font-bold text-white">Before</span>

            <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}>
              <Image src={afterImg} alt="After" fill sizes="100vw" className="object-cover pointer-events-none" />
              <span className="absolute bottom-4 right-4 z-10 px-2.5 py-1 rounded bg-[#C9A86A] text-[#111111] text-[10px] uppercase tracking-widest font-bold">After</span>
            </div>

            <div className="absolute top-0 bottom-0 w-0.5 bg-[#C9A86A] pointer-events-none z-10" style={{ left: `${sliderPos}%` }}>
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-[#111111] border-2 border-[#C9A86A] flex items-center justify-center text-[#C9A86A] shadow-lg text-sm font-bold">↔</div>
            </div>
          </div>
        </section>

        {/* ── Related Projects ── */}
        {relatedProjects.length > 0 && (
          <section id="related" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-800 text-gray-400"><ExternalLink className="h-5 w-5" /></div>
                <h2 className="font-serif text-xl font-semibold text-white">Related Case Studies</h2>
              </div>
              <Link href="/portfolio" className="text-[10px] uppercase tracking-widest text-[#C9A86A] font-bold hover:underline flex items-center gap-1">
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {relatedProjects.map(rp => (
                <Link key={rp.id} href={`/case-study/${rp.slug}`}
                  className="group bg-[#1A1A1A] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-all hover:-translate-y-0.5 shadow-md">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image src={rp.coverUrl} alt={rp.name} fill sizes="33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    {rp.category && (
                      <span className="absolute top-3 left-3 text-[9px] uppercase tracking-wider font-bold text-[#C9A86A] bg-black/60 px-2 py-0.5 rounded">{rp.category.name}</span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-serif font-semibold text-white group-hover:text-[#C9A86A] transition-colors text-sm">{rp.name}</h3>
                    <p className="text-[10px] text-[#C9A86A] mt-1 uppercase tracking-wider font-bold flex items-center gap-1">View Case Study <ArrowRight className="h-3 w-3" /></p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightboxIdx !== null && (
        <div className="fixed inset-0 z-50 bg-black/96 backdrop-blur-md flex flex-col select-none">
          <div className="flex items-center justify-between px-6 py-4 text-xs text-gray-400 uppercase tracking-wider font-bold">
            <span>{lightboxIdx + 1} / {project.galleryImages.length}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setZoom(z => Math.min(z + 0.5, 3))} className="p-2 hover:bg-white/5 rounded cursor-pointer text-white"><ZoomIn className="h-5 w-5" /></button>
              <button onClick={() => setZoom(z => Math.max(z - 0.5, 1))} className="p-2 hover:bg-white/5 rounded cursor-pointer text-white"><ZoomOut className="h-5 w-5" /></button>
              <button onClick={() => { setLightboxIdx(null); setZoom(1); }} className="p-2 hover:bg-white/5 rounded cursor-pointer text-white"><X className="h-5 w-5" /></button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center relative px-4">
            <button onClick={() => { setLightboxIdx(i => i !== null ? (i - 1 + project.galleryImages.length) % project.galleryImages.length : 0); setZoom(1); }}
              className="absolute left-4 p-3 rounded-full bg-black/50 border border-white/5 hover:bg-black text-white cursor-pointer">
              <ChevronLeft className="h-6 w-6" />
            </button>

            <div className="relative w-full max-w-4xl aspect-[16/10] transition-transform duration-200" style={{ transform: `scale(${zoom})` }}>
              <Image src={project.galleryImages[lightboxIdx].url} alt={project.galleryImages[lightboxIdx].alt} fill sizes="1200px" className="object-contain" />
            </div>

            <button onClick={() => { setLightboxIdx(i => i !== null ? (i + 1) % project.galleryImages.length : 0); setZoom(1); }}
              className="absolute right-4 p-3 rounded-full bg-black/50 border border-white/5 hover:bg-black text-white cursor-pointer">
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          <div className="text-center py-4 text-xs text-gray-500">
            <p className="text-white font-semibold">{project.galleryImages[lightboxIdx].alt || project.name}</p>
            <p className="text-[9px] mt-0.5 uppercase tracking-widest">Use ← → arrow keys to navigate · Esc to close</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Small shared sub-components ─── */
function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] uppercase tracking-widest text-[#C9A86A] font-bold">{children}</p>;
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs py-1 border-b border-gray-850/50 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="text-white font-semibold">{value}</span>
    </div>
  );
}

function SectionCard({ icon, title, children, accentColor }: {
  icon: React.ReactNode; title: string; children: React.ReactNode; accentColor?: string;
}) {
  return (
    <div className={`bg-[#1A1A1A] border rounded-xl p-6 sm:p-8 space-y-4 ${accentColor || 'border-gray-800'}`}>
      <div className="flex items-center gap-3 border-b border-gray-800/60 pb-4">
        <div className="p-2 rounded-lg bg-white/5">{icon}</div>
        <h2 className="font-serif text-xl font-semibold text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}
