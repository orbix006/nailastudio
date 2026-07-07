import { createPublicClient } from './server';

export interface WebsiteSettings {
  company_name: string;
  company_description: string | null;
  contact_phone: string;
  contact_email: string;
  business_hours_text: string;
  business_address: string | null;
  whatsapp_number: string | null;
  whatsapp_default_message: string | null;
  google_maps_embed_url: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  seo_image_url: string | null;
  google_analytics_id: string | null;
  facebook_pixel_id: string | null;
}

export interface ThemeSettings {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  default_theme: 'light' | 'dark';
  theme_switch_enabled: boolean;
  heading_font: string;
  body_font: string;
  button_border_radius_px: number;
}

const DEFAULT_WEBSITE_SETTINGS: WebsiteSettings = {
  company_name: 'The Nailaa Studio',
  company_description: 'Bespoke interior architectures, spatial curation, and high-end residential interior designs by The Nailaa Studio.',
  contact_phone: '+91 93194 41282',
  contact_email: 'naila.support@gmail.com',
  business_hours_text: 'Monday – Saturday, 9:00 AM – 7:00 PM',
  business_address: '123 Atelier Boulevard, Colaba, Mumbai, India',
  whatsapp_number: '+919319441282',
  whatsapp_default_message: "Hello, I'm interested in discussing an interior design project with The Nailaa Studio.",
  google_maps_embed_url: null,
  logo_url: null,
  favicon_url: null,
  seo_image_url: null,
  google_analytics_id: null,
  facebook_pixel_id: null,
};

const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  primary_color: '#111111',
  secondary_color: '#8A7052',
  accent_color: '#C9A86A',
  default_theme: 'dark',
  theme_switch_enabled: true,
  heading_font: 'Playfair Display',
  body_font: 'Inter',
  button_border_radius_px: 8,
};

export async function getWebsiteSettings(): Promise<WebsiteSettings> {
  try {
    const supabase = await createPublicClient();
    
    // Fetch website settings
    const { data: settings, error } = await supabase
      .from('website_settings')
      .select('*')
      .eq('id', true)
      .maybeSingle();

    if (error || !settings) {
      return DEFAULT_WEBSITE_SETTINGS;
    }

    let logoUrl: string | null = null;
    let faviconUrl: string | null = null;

    // Fetch logo public URL if set
    if (settings.logo_media_id) {
      const { data: logoMedia } = await supabase
        .from('media_library')
        .select('public_url')
        .eq('id', settings.logo_media_id)
        .maybeSingle();
      if (logoMedia) {
        logoUrl = logoMedia.public_url;
      }
    }

    // Fetch favicon public URL if set
    if (settings.favicon_media_id) {
      const { data: faviconMedia } = await supabase
        .from('media_library')
        .select('public_url')
        .eq('id', settings.favicon_media_id)
        .maybeSingle();
      if (faviconMedia) {
        faviconUrl = faviconMedia.public_url;
      }
    }

    let seoImageUrl: string | null = null;
    // Fetch SEO public URL if set
    if (settings.default_seo_image_id) {
      const { data: seoMedia } = await supabase
        .from('media_library')
        .select('public_url')
        .eq('id', settings.default_seo_image_id)
        .maybeSingle();
      if (seoMedia) {
        seoImageUrl = seoMedia.public_url;
      }
    }

    return {
      company_name: settings.company_name,
      company_description: settings.company_description,
      contact_phone: '+91 93194 41282',
      contact_email: 'naila.support@gmail.com',
      business_hours_text: settings.business_hours_text || DEFAULT_WEBSITE_SETTINGS.business_hours_text,
      business_address: settings.business_address || DEFAULT_WEBSITE_SETTINGS.business_address,
      whatsapp_number: '+919319441282',
      whatsapp_default_message: settings.whatsapp_default_message || DEFAULT_WEBSITE_SETTINGS.whatsapp_default_message,
      google_maps_embed_url: settings.google_maps_embed_url,
      logo_url: logoUrl,
      favicon_url: faviconUrl,
      seo_image_url: seoImageUrl,
      google_analytics_id: settings.google_analytics_id || null,
      facebook_pixel_id: settings.facebook_pixel_id || null,
    };
  } catch (err) {
    console.error('Error fetching website settings from Supabase:', err);
    return DEFAULT_WEBSITE_SETTINGS;
  }
}

export async function getThemeSettings(): Promise<ThemeSettings> {
  try {
    const supabase = await createPublicClient();
    
    const { data: theme, error } = await supabase
      .from('theme_settings')
      .select('*')
      .eq('id', true)
      .maybeSingle();

    if (error || !theme) {
      return DEFAULT_THEME_SETTINGS;
    }

    return {
      primary_color: theme.primary_color,
      secondary_color: theme.secondary_color,
      accent_color: theme.accent_color,
      default_theme: theme.default_theme as 'light' | 'dark',
      theme_switch_enabled: theme.theme_switch_enabled,
      heading_font: theme.heading_font || DEFAULT_THEME_SETTINGS.heading_font,
      body_font: theme.body_font || DEFAULT_THEME_SETTINGS.body_font,
      button_border_radius_px: theme.button_border_radius_px,
    };
  } catch (err) {
    console.error('Error fetching theme settings from Supabase:', err);
    return DEFAULT_THEME_SETTINGS;
  }
}

export interface SocialLink {
  platform: 'instagram' | 'facebook' | 'pinterest' | 'linkedin' | 'whatsapp' | 'youtube';
  url: string;
}

export async function getSocialLinks(): Promise<SocialLink[]> {
  try {
    const supabase = await createPublicClient();
    const { data, error } = await supabase
      .from('social_links')
      .select('platform, url')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return [
        { platform: 'instagram', url: 'https://www.instagram.com/the_nailaa_studio?igsh=Z253YmJqNG1nOTIx' },
        { platform: 'whatsapp', url: 'https://wa.me/919319441282' }
      ];
    }

    const mappedSocials = (data as SocialLink[]).map((social) => {
      if (social.platform === 'instagram') {
        return {
          ...social,
          url: 'https://www.instagram.com/the_nailaa_studio?igsh=Z253YmJqNG1nOTIx',
        };
      }
      if (social.platform === 'whatsapp') {
        return {
          ...social,
          url: 'https://wa.me/919319441282',
        };
      }
      return social;
    });

    return mappedSocials;
  } catch (err) {
    console.error('Error fetching social links from Supabase:', err);
    return [];
  }
}

export interface HeroSettings {
  title: string;
  subtitle: string | null;
  background_type: 'image' | 'video';
  background_image_url: string | null;
  background_video_url: string | null;
  logo_url: string | null;
  cta1_text: string | null;
  cta1_target_section: string | null;
  cta2_text: string | null;
  cta2_target_section: string | null;
}

const DEFAULT_HERO_SETTINGS: HeroSettings = {
  title: 'Designing Spaces That Inspire Everyday Living',
  subtitle: 'At The Nailaa Studio, we create elegant interiors that blend functionality, comfort, and timeless aesthetics. From luxurious homes to inspiring commercial spaces, we transform ideas into beautiful realities.',
  background_type: 'image',
  background_image_url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1920&q=80',
  background_video_url: null,
  logo_url: null,
  cta1_text: 'Book a Consultation',
  cta1_target_section: 'contact',
  cta2_text: 'Explore Our Portfolio',
  cta2_target_section: 'portfolio',
};

export async function getHeroSettings(): Promise<HeroSettings> {
  try {
    const supabase = await createPublicClient();
    const { data: hero, error } = await supabase
      .from('hero_section')
      .select('*')
      .eq('id', true)
      .maybeSingle();

    if (error || !hero) {
      return DEFAULT_HERO_SETTINGS;
    }

    let bgImageUrl = DEFAULT_HERO_SETTINGS.background_image_url;
    let bgVideoUrl: string | null = null;
    let logoUrl: string | null = null;

    if (hero.background_image_id) {
      const { data: media } = await supabase
        .from('media_library')
        .select('public_url')
        .eq('id', hero.background_image_id)
        .maybeSingle();
      if (media) {
        bgImageUrl = media.public_url;
      }
    }

    if (hero.background_video_id) {
      const { data: media } = await supabase
        .from('media_library')
        .select('public_url')
        .eq('id', hero.background_video_id)
        .maybeSingle();
      if (media) {
        bgVideoUrl = media.public_url;
      }
    }

    if (hero.logo_media_id) {
      const { data: media } = await supabase
        .from('media_library')
        .select('public_url')
        .eq('id', hero.logo_media_id)
        .maybeSingle();
      if (media) {
        logoUrl = media.public_url;
      }
    }

    return {
      title: hero.title || DEFAULT_HERO_SETTINGS.title,
      subtitle: hero.subtitle,
      background_type: (hero.background_type || 'image') as 'image' | 'video',
      background_image_url: bgImageUrl,
      background_video_url: bgVideoUrl,
      logo_url: logoUrl,
      cta1_text: hero.cta1_text || DEFAULT_HERO_SETTINGS.cta1_text,
      cta1_target_section: hero.cta1_target_section,
      cta2_text: hero.cta2_text || DEFAULT_HERO_SETTINGS.cta2_text,
      cta2_target_section: hero.cta2_target_section,
    };
  } catch (err) {
    console.error('Error fetching hero settings from Supabase:', err);
    return DEFAULT_HERO_SETTINGS;
  }
}

export interface AboutContent {
  intro_text: string;
  vision_text: string;
  mission_text: string;
  intro_image_url: string;
  vision_image_url: string;
  mission_image_url: string;
}

const DEFAULT_ABOUT_CONTENT: AboutContent = {
  intro_text: 'At The Nailaa Studio, we believe luxury interior design is a narrative of geometry, texture, and light. Sourcing high-grade natural stone, hand-selected finishes, and custom modular solutions, we curate private spaces that reflect personal stories. Our studio balances modern warmth with architectural restraint to create elegant sanctuaries.',
  vision_text: 'Our vision is to shape inspiring environments that enhance everyday living. We value timeless refinement and spatial precision, planning details meticulously to bring balance, functional comfort, and aesthetic integrity to every luxury home or boutique commercial space.',
  mission_text: 'Our mission is to lead a seamless, turnkey design journey. From our initial consultations and 2D zoning layouts to realistic 3D visualizations, sourcing, and on-site styling, we coordinate the entire execution to bring bespoke interiors to life without stress.',
  intro_image_url: 'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=800&q=80',
  vision_image_url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80',
  mission_image_url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
};

export async function getAboutContent(): Promise<AboutContent> {
  try {
    const supabase = await createPublicClient();
    const { data: about, error } = await supabase
      .from('about_content')
      .select('*')
      .eq('id', true)
      .maybeSingle();

    if (error || !about) {
      return DEFAULT_ABOUT_CONTENT;
    }

    let introImageUrl = DEFAULT_ABOUT_CONTENT.intro_image_url;
    let visionImageUrl = DEFAULT_ABOUT_CONTENT.vision_image_url;
    let missionImageUrl = DEFAULT_ABOUT_CONTENT.mission_image_url;

    if (about.intro_image_id) {
      const { data: media } = await supabase
        .from('media_library')
        .select('public_url')
        .eq('id', about.intro_image_id)
        .maybeSingle();
      if (media) {
        introImageUrl = media.public_url;
      }
    }

    if (about.vision_image_id) {
      const { data: media } = await supabase
        .from('media_library')
        .select('public_url')
        .eq('id', about.vision_image_id)
        .maybeSingle();
      if (media) {
        visionImageUrl = media.public_url;
      }
    }

    if (about.mission_image_id) {
      const { data: media } = await supabase
        .from('media_library')
        .select('public_url')
        .eq('id', about.mission_image_id)
        .maybeSingle();
      if (media) {
        missionImageUrl = media.public_url;
      }
    }

    return {
      intro_text: about.intro_text || DEFAULT_ABOUT_CONTENT.intro_text,
      vision_text: about.vision_text || DEFAULT_ABOUT_CONTENT.vision_text,
      mission_text: about.mission_text || DEFAULT_ABOUT_CONTENT.mission_text,
      intro_image_url: introImageUrl,
      vision_image_url: visionImageUrl,
      mission_image_url: missionImageUrl,
    };
  } catch (err) {
    console.error('Error fetching about content from Supabase:', err);
    return DEFAULT_ABOUT_CONTENT;
  }
}

export interface Service {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  detailed_overview: string | null;
  design_approach: string | null;
  materials_finishes: string | null;
  cover_image_url: string | null;
  icon_image_url: string | null;
  features: string[];
  gallery_urls: string[];
}

export const DEFAULT_SERVICES: Service[] = [
  {
    id: 'service-1',
    title: 'Residential Interiors',
    slug: 'residential-interiors',
    short_description: 'Create elegant, functional, and personalized living spaces that reflect your lifestyle and elevate everyday comfort.',
    detailed_overview: 'We craft hyper-personalized residential properties that reflect your lifestyle, combining architectural rigor with bespoke craftsmanship. From private libraries to grand master suites, each room is designed as an elegant sanctuary of quiet luxury.',
    design_approach: 'Meticulous structural alignment, bespoke lighting design, and material balance to curate timeless living environments.',
    materials_finishes: 'Premium natural stone, custom walnut paneling, hand-cast bronze hardware, and soft boucle textures.',
    cover_image_url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80',
    icon_image_url: null,
    features: [
      'Tailored spatial blueprinting mapping everyday rituals',
      'Curated furniture and art commissions from global designers',
      'Custom wall paneling and architectural lighting schemes'
    ],
    gallery_urls: [
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'service-2',
    title: 'Commercial Interiors',
    slug: 'commercial-interiors',
    short_description: 'Design inspiring offices, retail stores, cafés, and commercial environments that enhance productivity and customer experience.',
    detailed_overview: 'Elevate your brand presence with immersive, premium spaces that foster connection and engagement. We translate brand identity into physical structures, ensuring optimal utility and aesthetic excellence.',
    design_approach: 'Dynamic traffic flow analysis, acoustic control, and seamless brand-aligned palette integration.',
    materials_finishes: 'Fluted glass facades, matte black steel framing, micro-cement floor systems, and premium leather finishes.',
    cover_image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    icon_image_url: null,
    features: [
      'Interactive customer flow mapping and space zoning',
      'Bespoke custom-milled reception and hospitality counters',
      'Advanced acoustic treatments and lighting design integrations'
    ],
    gallery_urls: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'service-3',
    title: 'Turnkey Interiors',
    slug: 'turnkey-interiors',
    short_description: 'End-to-end interior solutions from concept to execution, delivering beautifully finished spaces without the hassle.',
    detailed_overview: 'A complete hassle-free luxury design experience. We manage everything—from licensing and material imports to builder supervision and site styling—handing over your keys when your home is fully completed.',
    design_approach: 'Unified project management, strict schedule control, and detail supervision.',
    materials_finishes: 'Comprehensive architectural fit-outs, imported custom accents, and fully styled installations.',
    cover_image_url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
    icon_image_url: null,
    features: [
      'Comprehensive project management and vendor coordination',
      'Rigorous material quality check and factory inspection',
      'Final styling down to curated bookshelf art and accent florals'
    ],
    gallery_urls: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'service-4',
    title: '3D Design & Visualization',
    slug: '3d-design-visualization',
    short_description: 'Visualize your dream space before execution with realistic 3D renders, layouts, and design presentations.',
    detailed_overview: 'See your dream space before a single brick is laid. We create high-fidelity, photorealistic 3D renders with exact material textures, lighting states, and furniture layouts for complete clarity.',
    design_approach: 'Accurate architectural scale rendering, light bounce calculations, and detail texturing.',
    materials_finishes: 'High-resolution digital renders, VR panoramic exports, and video walkthrough animations.',
    cover_image_url: 'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=800&q=80',
    icon_image_url: null,
    features: [
      'High-resolution multi-angle 3D interior renders',
      'Virtual reality walkthrough files for immersive reviews',
      'Accurate lighting simulation matching dawn, noon, and night'
    ],
    gallery_urls: [
      'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'service-5',
    title: 'Space Planning',
    slug: 'space-planning',
    short_description: 'Optimize every square foot with intelligent layouts that maximize functionality, circulation, and aesthetics.',
    detailed_overview: 'A great space starts with a perfect layout. We draft precision architectural zoning layouts that maximize utility, view vectors, and movement paths before selecting any colors or furniture.',
    design_approach: 'Scale analysis, dynamic movement simulations, and sight-line balancing.',
    materials_finishes: 'Drafted architectural sheets, 2D vector layouts, and scaled material mood boards.',
    cover_image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    icon_image_url: null,
    features: [
      'Multiple 2D scaled spatial layout options for review',
      'Sight-line analysis mapping exterior and interior views',
      'Zoning layouts ensuring proper flow and ergonomic clearance'
    ],
    gallery_urls: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'service-6',
    title: 'Site Execution & Supervision',
    slug: 'site-execution-supervision',
    short_description: 'Ensure flawless execution through professional project management, quality checks, vendor coordination, and on-site supervision.',
    detailed_overview: 'We translate design blueprints into physically flawless realities. From core brickwork, electrical integration, custom carpentry fittings to final paint styling, we supervise on-site teams to ensure absolute precision.',
    design_approach: 'Daily vendor progress checklists, on-site tolerance gap inspections, and strict timeline adherence.',
    materials_finishes: 'Architectural structural checks, quality-controlled paint layerings, and custom millwork alignments.',
    cover_image_url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
    icon_image_url: null,
    features: [
      'On-site project managers supervising construction milestones',
      'Vendor coordination and material delivery gate check gates',
      'Snagging review inspections prior to final key handover'
    ],
    gallery_urls: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80'
    ]
  }
];

export async function getServices(): Promise<Service[]> {
  try {
    const supabase = await createPublicClient();
    const { data: services, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_visible', true)
      .is('deleted_at', null)
      .order('display_order', { ascending: true });

    if (error || !services || services.length === 0) {
      return DEFAULT_SERVICES;
    }

    // Batch-collect all media IDs needed across all services
    const allMediaIds = new Set<string>();
    services.forEach((s) => {
      if (s.cover_image_id) allMediaIds.add(s.cover_image_id);
      if (s.icon_media_id) allMediaIds.add(s.icon_media_id);
    });

    // Fetch all service images pivot rows in one query
    const { data: allServiceImages } = await supabase
      .from('service_images')
      .select('service_id, media_id, display_order')
      .in('service_id', services.map((s) => s.id))
      .order('display_order', { ascending: true });

    (allServiceImages || []).forEach((si) => {
      if (si.media_id) allMediaIds.add(si.media_id);
    });

    // Single batched media lookup
    const mediaMap = new Map<string, string>();
    if (allMediaIds.size > 0) {
      const { data: mediaItems } = await supabase
        .from('media_library')
        .select('id, public_url')
        .in('id', Array.from(allMediaIds));
      (mediaItems || []).forEach((m) => mediaMap.set(m.id, m.public_url));
    }

    // Fetch all service features in one query
    const { data: allFeatures } = await supabase
      .from('service_features')
      .select('service_id, feature, display_order')
      .in('service_id', services.map((s) => s.id))
      .order('display_order', { ascending: true });

    const featuresMap = new Map<string, string[]>();
    (allFeatures || []).forEach((f) => {
      if (!featuresMap.has(f.service_id)) featuresMap.set(f.service_id, []);
      featuresMap.get(f.service_id)!.push(f.feature);
    });

    const serviceImagesMap = new Map<string, string[]>();
    (allServiceImages || []).forEach((si) => {
      if (!serviceImagesMap.has(si.service_id)) serviceImagesMap.set(si.service_id, []);
      const url = mediaMap.get(si.media_id);
      if (url) serviceImagesMap.get(si.service_id)!.push(url);
    });

    return services.map((service) => ({
      id: service.id,
      title: service.title,
      slug: service.slug,
      short_description: service.short_description,
      detailed_overview: service.detailed_overview,
      design_approach: service.design_approach,
      materials_finishes: service.materials_finishes,
      cover_image_url: service.cover_image_id ? (mediaMap.get(service.cover_image_id) ?? null) : null,
      icon_image_url: service.icon_media_id ? (mediaMap.get(service.icon_media_id) ?? null) : null,
      features: featuresMap.get(service.id) || [],
      gallery_urls: serviceImagesMap.get(service.id) || [],
    }));
  } catch (err) {
    console.error('Error fetching services from Supabase:', err);
    return DEFAULT_SERVICES;
  }
}

export interface PortfolioCategory {
  id: string;
  name: string;
  slug: string;
}

export interface PortfolioProject {
  id: string;
  category_id: string;
  category_name: string;
  category_slug: string;
  name: string;
  slug: string;
  description: string | null;
  location: string | null;
  completion_year: number | null;
  cover_image_url: string;
  tags: string[];
  gallery_urls: string[];
}

const DEFAULT_CATEGORIES: PortfolioCategory[] = [
  { id: 'cat-1', name: 'Residential Estates', slug: 'residential' },
  { id: 'cat-2', name: 'Commercial Spaces', slug: 'commercial' },
  { id: 'cat-3', name: 'Turnkey Solutions', slug: 'turnkey' },
];

export const DEFAULT_PROJECTS: PortfolioProject[] = [
  {
    id: 'proj-1',
    category_id: 'cat-1',
    category_name: 'Residential Estates',
    category_slug: 'residential',
    name: 'Luxury Villa Interior',
    slug: 'luxury-villa-interior',
    description: 'An architectural private villa featuring custom travertine marble hearths, solid walnut wood paneling, and brushed brass details.',
    location: 'Worli, Mumbai',
    completion_year: 2025,
    cover_image_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
    tags: ['Luxury', 'Villa', 'Modern Classic'],
    gallery_urls: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'proj-2',
    category_id: 'cat-1',
    category_name: 'Residential Estates',
    category_slug: 'residential',
    name: 'Modern Apartment',
    slug: 'modern-apartment',
    description: 'A premium apartment layout utilizing space optimization, custom storage, fluted glass screens, and designer Italian light fixtures.',
    location: 'Bandra, Mumbai',
    completion_year: 2025,
    cover_image_url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
    tags: ['Apartment', 'Modern', 'Sleek'],
    gallery_urls: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'proj-3',
    category_id: 'cat-1',
    category_name: 'Residential Estates',
    category_slug: 'residential',
    name: 'Scandinavian Living Room',
    slug: 'scandinavian-living-room',
    description: 'A cozy, light-filled gathering room prioritizing neutral boucle fabrics, light oak floors, raw plaster textures, and warm fireplaces.',
    location: 'Alibaug, Maharashtra',
    completion_year: 2026,
    cover_image_url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
    tags: ['Scandinavian', 'Minimalist', 'Living Room'],
    gallery_urls: ['https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'proj-4',
    category_id: 'cat-1',
    category_name: 'Residential Estates',
    category_slug: 'residential',
    name: 'Elegant Bedroom',
    slug: 'elegant-bedroom',
    description: 'A master bedroom suite designed with customized sound-dampening panels, walk-in dressing areas, and automated warm ambient lights.',
    location: 'Juhu, Mumbai',
    completion_year: 2026,
    cover_image_url: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80',
    tags: ['Bedroom', 'Elegant', 'Cozy'],
    gallery_urls: ['https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'proj-5',
    category_id: 'cat-2',
    category_name: 'Commercial Spaces',
    category_slug: 'commercial',
    name: 'Premium Office',
    slug: 'premium-office',
    description: 'A corporate headquarters combining acoustic glass paneling, smart wire routing, ergonomic layouts, and custom walnut conference tables.',
    location: 'BKC, Mumbai',
    completion_year: 2025,
    cover_image_url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80',
    tags: ['Office', 'Corporate', 'Executive'],
    gallery_urls: ['https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'proj-6',
    category_id: 'cat-1',
    category_name: 'Residential Estates',
    category_slug: 'residential',
    name: 'Contemporary Kitchen',
    slug: 'contemporary-kitchen',
    description: 'A state-of-the-art modular culinary hub with calacatta marble surfaces, integrated task lighting, and concealed handle-less cabinetry.',
    location: 'Lokhandwala, Mumbai',
    completion_year: 2026,
    cover_image_url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
    tags: ['Kitchen', 'Contemporary', 'Modular'],
    gallery_urls: ['https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'proj-7',
    category_id: 'cat-2',
    category_name: 'Commercial Spaces',
    category_slug: 'commercial',
    name: 'Boutique Café',
    slug: 'boutique-cafe',
    description: 'A chic coffee atelier styling fluted oak bars, micro-cement floor overlays, green wall segments, and custom pendant installations.',
    location: 'Kala Ghoda, Mumbai',
    completion_year: 2026,
    cover_image_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
    tags: ['Cafe', 'Boutique', 'Hospitality'],
    gallery_urls: ['https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'proj-8',
    category_id: 'cat-3',
    category_name: 'Turnkey Solutions',
    category_slug: 'turnkey',
    name: 'Luxury Penthouse',
    slug: 'luxury-penthouse',
    description: 'A double-height skyline property styled with bronze metal railings, custom linen curtains, and fully integrated automated systems.',
    location: 'Cuffe Parade, Mumbai',
    completion_year: 2025,
    cover_image_url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
    tags: ['Penthouse', 'Turnkey', 'Estates'],
    gallery_urls: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80']
  }
];

export async function getPortfolioCategories(): Promise<PortfolioCategory[]> {
  try {
    const supabase = await createPublicClient();
    const { data: categories, error } = await supabase
      .from('portfolio_categories')
      .select('id, name, slug')
      .order('display_order', { ascending: true });

    if (error || !categories || categories.length === 0) {
      return DEFAULT_CATEGORIES;
    }

    return categories;
  } catch (err) {
    console.error('Error fetching categories from Supabase:', err);
    return DEFAULT_CATEGORIES;
  }
}

export async function getPortfolioProjects(): Promise<PortfolioProject[]> {
  try {
    const supabase = await createPublicClient();
    const { data: projects, error } = await supabase
      .from('portfolio_projects')
      .select('*, portfolio_categories(name, slug)')
      .eq('is_published', true)
      .order('display_order', { ascending: true });

    if (error || !projects || projects.length === 0) {
      return DEFAULT_PROJECTS;
    }

    const projectIds = projects.map((p) => p.id);

    // Batch collect all cover_image_ids
    const allMediaIds = new Set<string>();
    projects.forEach((p) => { if (p.cover_image_id) allMediaIds.add(p.cover_image_id); });

    // Batch-fetch all project images pivot rows
    const { data: allProjectImages } = await supabase
      .from('portfolio_project_images')
      .select('project_id, media_id, display_order')
      .in('project_id', projectIds)
      .order('display_order', { ascending: true });
    (allProjectImages || []).forEach((pi) => { if (pi.media_id) allMediaIds.add(pi.media_id); });

    // Batch-fetch all project tags pivot rows
    const { data: allProjectTags } = await supabase
      .from('portfolio_project_tags')
      .select('project_id, project_tags(name)')
      .in('project_id', projectIds);

    // Single batched media lookup
    const mediaMap = new Map<string, string>();
    if (allMediaIds.size > 0) {
      const { data: mediaItems } = await supabase
        .from('media_library')
        .select('id, public_url')
        .in('id', Array.from(allMediaIds));
      (mediaItems || []).forEach((m) => mediaMap.set(m.id, m.public_url));
    }

    // Build gallery maps
    const galleryMap = new Map<string, string[]>();
    (allProjectImages || []).forEach((pi) => {
      if (!galleryMap.has(pi.project_id)) galleryMap.set(pi.project_id, []);
      const url = mediaMap.get(pi.media_id);
      if (url) galleryMap.get(pi.project_id)!.push(url);
    });

    // Build tags maps
    const tagsMap = new Map<string, string[]>();
    (allProjectTags || []).forEach((pt) => {
      const pid = (pt as { project_id: string }).project_id;
      if (!tagsMap.has(pid)) tagsMap.set(pid, []);
      const t = pt.project_tags as unknown as { name: string } | null;
      if (t?.name) tagsMap.get(pid)!.push(t.name);
    });

    return projects.map((project) => {
      const catInfo = project.portfolio_categories as unknown as { name: string; slug: string } | null;
      return {
        id: project.id,
        category_id: project.category_id,
        category_name: catInfo?.name || '',
        category_slug: catInfo?.slug || '',
        name: project.name,
        slug: project.slug,
        description: project.description,
        location: project.location,
        completion_year: project.completion_year,
        cover_image_url: project.cover_image_id ? (mediaMap.get(project.cover_image_id) ?? '') : '',
        tags: tagsMap.get(project.id) || [],
        gallery_urls: galleryMap.get(project.id) || [],
      };
    });
  } catch (err) {
    console.error('Error fetching portfolio projects from Supabase:', err);
    return DEFAULT_PROJECTS;
  }
}

export interface DesignProcessStep {
  step_number: number;
  title: string;
  description: string;
}

export interface WhyChooseUsItem {
  title: string;
  description: string;
  icon_name: string | null;
}

export interface CoreValueItem {
  title: string;
  description: string;
  icon_name: string | null;
}

export interface DesignPhilosophy {
  title: string;
  description: string;
  quote: string | null;
  author: string | null;
}

export interface Testimonial {
  client_name: string;
  client_title: string | null;
  quote: string;
  rating: number;
  is_featured?: boolean;
  video_url?: string | null;
}

const DEFAULT_DESIGN_PROCESS: DesignProcessStep[] = [
  { step_number: 1, title: 'Discovery & Consultation', description: 'We conduct an in-depth spatial consult, understanding your aesthetic preferences, style directives, and functional requirements.' },
  { step_number: 2, title: 'Concept Development', description: 'We develop custom conceptual layouts, selecting primary textures, accent finishes, and bespoke furniture frameworks.' },
  { step_number: 3, title: 'Space Planning', description: 'We outline precise spatial blueprints, dynamic movement vectors, and floor layout configurations.' },
  { step_number: 4, title: '3D Visualization', description: 'We generate photorealistic 3D visual renderings, simulating daylight variations and material intersections.' },
  { step_number: 5, title: 'Execution & Supervision', description: 'We supervise on-site construction fit-outs, millwork milling, material check gates, and fittings.' },
  { step_number: 6, title: 'Final Styling & Handover', description: 'We place final styling accessories, curate rugs and decorative objects, and hand over your ready keys.' }
];

const DEFAULT_WHY_CHOOSE_US: WhyChooseUsItem[] = [
  { title: 'Experienced Designers', description: 'Our award-winning team of luxury interior designers and decorators brings years of high-end experience.', icon_name: 'Sparkles' },
  { title: 'Personalized Solutions', description: 'We design bespoke solutions tailored specifically to your lifestyle, habits, and spatial vision.', icon_name: 'Compass' },
  { title: 'Premium Materials', description: 'We source authentic, top-grade marble stone, sustainably-milled oak/walnut, and premium fittings.', icon_name: 'PenTool' },
  { title: 'Transparent Process', description: 'Complete billing milestone transparency, itemized material checks, and regular scheduling logs.', icon_name: 'Shield' },
  { title: 'Timely Delivery', description: 'We follow strict project timelines and checkpoint milestones to guarantee on-time key handovers.', icon_name: 'TrendingUp' },
  { title: 'End-to-End Execution', description: 'From initial space plans to final styling details, we manage the entire turnkey project for you.', icon_name: 'Heart' }
];

const DEFAULT_CORE_VALUES: CoreValueItem[] = [
  { title: 'Impeccable Craftsmanship', description: 'We believe structure is defined by its execution. All millwork and fittings are completed with surgical care.', icon_name: 'PenTool' },
  { title: 'Attention to Detail', description: 'From shadow gaps to stone vein alignment, we align every component with visual harmony in mind.', icon_name: 'Sparkles' },
  { title: 'Personalized Design', description: 'We reject copy-paste layouts, creating structures that are custom tailored to the client\'s identity.', icon_name: 'Compass' }
];

const DEFAULT_PHILOSOPHY: DesignPhilosophy = {
  title: 'Our Design Philosophy',
  description: 'At The Nailaa Studio, we view interior architecture not as simple decorating, but as a silent art form. We reject noisy, loud trends in favor of quiet luxury—structures that are clean, materials that are authentic, and details that are deliberate. True elegance is found in the restraint between architecture and styling.',
  quote: 'Luxury is in the space between. We design for the quiet harmony of structure, light, and material.',
  author: 'The Nailaa Studio'
};

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  { client_name: 'Aishwarya Sen', client_title: 'Villa Owner', quote: 'The attention to shadow gaps and material alignment in my minimal Scandinavian villa is exceptional. The Nailaa Studio respects craftsmanship.', rating: 5 },
  { client_name: 'Rohan Malhotra', client_title: 'Managing Partner', quote: 'An outstanding execution for our corporate office. They managed dynamic flow and acoustic setups with complete professional transparency.', rating: 5 },
  { client_name: 'Devika Roy', client_title: 'Boutique Café Owner', quote: 'They transformed our café into an inviting urban sanctuary. The fluted counter and micro-cement floors receive endless compliments.', rating: 5 },
  { client_name: 'Meera Merchant', client_title: 'Luxury Retailer', quote: 'Our luxury showroom requires sophisticated layouts. The custom bronze accents and glass details they designed are masterfully executed.', rating: 5 },
  { client_name: 'Kabir Kapoor', client_title: 'Penthouse Resident', quote: 'The turnkey handover of my Worli penthouse was effortless. They styled everything down to the bookshelf books. Absolutely premium service.', rating: 5 }
];

export async function getDesignProcess(): Promise<DesignProcessStep[]> {
  try {
    const supabase = await createPublicClient();
    const { data, error } = await supabase
      .from('design_process_steps')
      .select('display_order, title, description')
      .eq('is_visible', true)
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return DEFAULT_DESIGN_PROCESS;
    }

    return data.map((d) => ({
      step_number: d.display_order || 1,
      title: d.title,
      description: d.description,
    }));
  } catch (err) {
    console.error('Error fetching design process from Supabase:', err);
    return DEFAULT_DESIGN_PROCESS;
  }
}

export async function getWhyChooseUs(): Promise<WhyChooseUsItem[]> {
  try {
    const supabase = await createPublicClient();
    const { data, error } = await supabase
      .from('why_choose_features')
      .select('title, description, icon_name')
      .eq('is_visible', true)
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return DEFAULT_WHY_CHOOSE_US;
    }

    return data;
  } catch (err) {
    console.error('Error fetching why choose us from Supabase:', err);
    return DEFAULT_WHY_CHOOSE_US;
  }
}

export async function getCoreValues(): Promise<CoreValueItem[]> {
  try {
    const supabase = await createPublicClient();
    const { data, error } = await supabase
      .from('core_values')
      .select('title, description, icon_name')
      .eq('is_visible', true)
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return DEFAULT_CORE_VALUES;
    }

    return data;
  } catch (err) {
    console.error('Error fetching core values from Supabase:', err);
    return DEFAULT_CORE_VALUES;
  }
}

export async function getDesignPhilosophy(): Promise<DesignPhilosophy> {
  try {
    const supabase = await createPublicClient();
    const { data, error } = await supabase
      .from('design_philosophy')
      .select('title, description, quote, author')
      .eq('id', true)
      .maybeSingle();

    if (error || !data) {
      return DEFAULT_PHILOSOPHY;
    }

    return {
      title: data.title || DEFAULT_PHILOSOPHY.title,
      description: data.description || DEFAULT_PHILOSOPHY.description,
      quote: data.quote,
      author: data.author,
    };
  } catch (err) {
    console.error('Error fetching design philosophy from Supabase:', err);
    return DEFAULT_PHILOSOPHY;
  }
}

export async function getTestimonials(): Promise<Testimonial[]> {
  try {
    const supabase = await createPublicClient();
    const { data, error } = await supabase
      .from('testimonials')
      .select('client_name, designation, review_text, rating, is_featured, video_url')
      .is('deleted_at', null)
      .eq('is_visible', true)
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return DEFAULT_TESTIMONIALS;
    }

    return data.map((t) => ({
      client_name: t.client_name,
      client_title: t.designation || 'Client',
      quote: t.review_text,
      rating: t.rating,
      is_featured: t.is_featured,
      video_url: t.video_url,
    }));
  } catch (err) {
    console.error('Error fetching testimonials from Supabase:', err);
    return DEFAULT_TESTIMONIALS;
  }
}

export interface ProjectType {
  id: string;
  name: string;
}

export interface ConsultationPopupSettings {
  enabled: boolean;
  title: string;
  subtitle: string | null;
  delay_seconds: number;
  show_once_per_session: boolean;
  primary_button_text: string | null;
  secondary_button_text: string | null;
}

const DEFAULT_POPUP_SETTINGS: ConsultationPopupSettings = {
  enabled: true,
  title: "Let's Discuss Your Dream Space",
  subtitle: "Ready to transform your home or workspace? Share your project details with us, and our design experts will get in touch to schedule your consultation.",
  delay_seconds: 3,
  show_once_per_session: true,
  primary_button_text: "Book Consultation",
  secondary_button_text: "Maybe Later",
};

export async function getProjectTypes(): Promise<ProjectType[]> {
  try {
    const supabase = await createPublicClient();
    const { data, error } = await supabase
      .from('project_types')
      .select('id, name')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return [
        { id: 'dev-1', name: 'Residential' },
        { id: 'dev-2', name: 'Commercial' },
        { id: 'dev-3', name: 'Renovation' },
        { id: 'dev-4', name: 'Other' },
      ];
    }

    return data;
  } catch (err) {
    console.error('Error fetching project types from Supabase:', err);
    return [
      { id: 'dev-1', name: 'Residential' },
      { id: 'dev-2', name: 'Commercial' },
      { id: 'dev-3', name: 'Renovation' },
      { id: 'dev-4', name: 'Other' },
    ];
  }
}

export async function getConsultationPopupSettings(): Promise<ConsultationPopupSettings> {
  try {
    const supabase = await createPublicClient();
    const { data, error } = await supabase
      .from('consultation_popup_settings')
      .select('*')
      .eq('id', true)
      .maybeSingle();

    if (error || !data) {
      return DEFAULT_POPUP_SETTINGS;
    }

    return {
      enabled: data.enabled,
      title: data.title || DEFAULT_POPUP_SETTINGS.title,
      subtitle: data.subtitle || DEFAULT_POPUP_SETTINGS.subtitle,
      delay_seconds: data.delay_seconds,
      show_once_per_session: data.show_once_per_session,
      primary_button_text: data.primary_button_text,
      secondary_button_text: data.secondary_button_text,
    };
  } catch (err) {
    console.error('Error fetching popup settings from Supabase:', err);
    return DEFAULT_POPUP_SETTINGS;
  }
}

/**
 * Retrieve the current cache version number from site_cache_version table.
 * Used for dynamic cache key rotation on CMS updates.
 */
export async function getSiteCacheVersion(): Promise<number> {
  try {
    const supabase = await createPublicClient();
    const { data, error } = await supabase
      .from('site_cache_version')
      .select('version')
      .eq('id', true)
      .maybeSingle();

    if (error || !data) {
      return 1;
    }
    return Number(data.version);
  } catch (err) {
    console.error('Error fetching cache version:', err);
    return 1;
  }
}
