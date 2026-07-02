import { createClient } from './server';

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
  company_description: 'Luxury nail styling and care',
  contact_phone: '+91 99999 99999',
  contact_email: 'hello@thenailaastudio.com',
  business_hours_text: 'Monday – Saturday, 9:00 AM – 7:00 PM',
  business_address: '123 Luxury Styling Rd, Mumbai, India',
  whatsapp_number: '+919999999999',
  whatsapp_default_message: "Hello, I'm interested in discussing my styling project with The Nailaa Studio.",
  google_maps_embed_url: null,
  logo_url: null,
  favicon_url: null,
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
    const supabase = await createClient();
    
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

    return {
      company_name: settings.company_name,
      company_description: settings.company_description,
      contact_phone: settings.contact_phone,
      contact_email: settings.contact_email,
      business_hours_text: settings.business_hours_text || DEFAULT_WEBSITE_SETTINGS.business_hours_text,
      business_address: settings.business_address,
      whatsapp_number: settings.whatsapp_number,
      whatsapp_default_message: settings.whatsapp_default_message,
      google_maps_embed_url: settings.google_maps_embed_url,
      logo_url: logoUrl,
      favicon_url: faviconUrl,
    };
  } catch (err) {
    console.error('Error fetching website settings from Supabase:', err);
    return DEFAULT_WEBSITE_SETTINGS;
  }
}

export async function getThemeSettings(): Promise<ThemeSettings> {
  try {
    const supabase = await createClient();
    
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
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('social_links')
      .select('platform, url')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error || !data) {
      return [];
    }

    return data as SocialLink[];
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
  title: 'Quietly Confident Interiors.',
  subtitle: 'Space is the breath of art. We design for the silence between objects.',
  background_type: 'image',
  background_image_url: '/images/hero_background.png',
  background_video_url: null,
  logo_url: null,
  cta1_text: 'Book Consultation',
  cta1_target_section: 'contact',
  cta2_text: 'View Portfolio',
  cta2_target_section: 'portfolio',
};

export async function getHeroSettings(): Promise<HeroSettings> {
  try {
    const supabase = await createClient();
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
  intro_text: 'Welcome to The Nailaa Studio, where luxury nail artistry meets modern sophistication. We believe your hands tell a story, and we are dedicated to making it beautiful through custom craftsmanship and premium care.',
  vision_text: 'Our vision is to redefine the nail styling experience by combining high-end design aesthetics with structural integrity and clean, artistic expression. We strive to be the ultimate benchmark of contemporary grooming.',
  mission_text: 'Our mission is to provide bespoke, hyper-individualized nail services using healthy, premium products and meticulous design approaches, delivering an unmatched experience in a serene, luxurious space.',
  intro_image_url: '/images/about_intro.png',
  vision_image_url: '/images/about_vision.png',
  mission_image_url: '/images/about_mission.png',
};

export async function getAboutContent(): Promise<AboutContent> {
  try {
    const supabase = await createClient();
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

const DEFAULT_SERVICES: Service[] = [
  {
    id: 'service-1',
    title: 'Bespoke Manicures',
    slug: 'bespoke-manicures',
    short_description: 'Precision shaping, clean cuticle care, and high-end polish selection.',
    detailed_overview: 'Indulge in our signature manicure treatment designed for clean elegance and long-lasting nail health.',
    design_approach: "We focus on the natural nail's structure and proportions, crafting custom shapes that flatters the hands.",
    materials_finishes: 'Premium non-toxic base coats, rich organic pigments, and diamond shine gel topcoats.',
    cover_image_url: '/images/about_intro.png',
    icon_image_url: null,
    features: ['Clean Cuticle Detailing', 'Precision File & Shape', 'Extended Nourishing Hand Massage'],
    gallery_urls: ['/images/about_mission.png'],
  },
  {
    id: 'service-2',
    title: 'Artistic Overlay Extensions',
    slug: 'artistic-overlay-extensions',
    short_description: 'Custom nail extensions and artistic details using premium gel sculpture.',
    detailed_overview: 'Enhance your length and strength with custom overlay sculpture, creating durable structures tailored for nail art.',
    design_approach: 'Tailored geometric overlays that align with your natural finger vectors for a slender, elongated profile.',
    materials_finishes: 'Hypoallergenic sculpting builder gels, gold leaf inclusions, and custom chrome dusts.',
    cover_image_url: '/images/hero_background.png',
    icon_image_url: null,
    features: ['Customized Tip Extension', 'Builder Gel Structure', 'Bespoke Nail Art Details'],
    gallery_urls: ['/images/about_vision.png'],
  },
  {
    id: 'service-3',
    title: 'Luxury Wellness Therapy',
    slug: 'luxury-wellness-therapy',
    short_description: 'Holistic hand skin care, thermal mask wraps, and nourishing massages.',
    detailed_overview: 'A deep skin restoration experience for hands exposed to daily elements. Restores softness and youthfulness.',
    design_approach: 'Soothing layout procedures, hot wraps, and rhythmic massages designed to stimulate blood flow and release tension.',
    materials_finishes: 'Cold-pressed argan oils, volcanic mud thermal wraps, and organic lavender exfoliators.',
    cover_image_url: '/images/about_mission.png',
    icon_image_url: null,
    features: ['Warm Volcanic Mud Wrap', 'Argan Cuticle Hydration', 'Aromatherapy Massage'],
    gallery_urls: ['/images/about_intro.png'],
  },
];

export async function getServices(): Promise<Service[]> {
  try {
    const supabase = await createClient();
    const { data: services, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_visible', true)
      .order('display_order', { ascending: true });

    if (error || !services || services.length === 0) {
      return DEFAULT_SERVICES;
    }

    const servicesList: Service[] = [];

    for (const service of services) {
      let coverImageUrl: string | null = null;
      let iconImageUrl: string | null = null;

      // 1. Fetch cover image public URL
      if (service.cover_image_id) {
        const { data: coverMedia } = await supabase
          .from('media_library')
          .select('public_url')
          .eq('id', service.cover_image_id)
          .maybeSingle();
        if (coverMedia) {
          coverImageUrl = coverMedia.public_url;
        }
      }

      // 2. Fetch icon image public URL
      if (service.icon_media_id) {
        const { data: iconMedia } = await supabase
          .from('media_library')
          .select('public_url')
          .eq('id', service.icon_media_id)
          .maybeSingle();
        if (iconMedia) {
          iconImageUrl = iconMedia.public_url;
        }
      }

      // 3. Fetch features list
      const { data: features } = await supabase
        .from('service_features')
        .select('feature')
        .eq('service_id', service.id)
        .order('display_order', { ascending: true });
      const featuresArray = features ? features.map((f) => f.feature) : [];

      // 4. Fetch extra gallery images
      const { data: serviceImages } = await supabase
        .from('service_images')
        .select('media_id')
        .eq('service_id', service.id)
        .order('display_order', { ascending: true });

      const galleryUrls: string[] = [];
      if (serviceImages && serviceImages.length > 0) {
        const mediaIds = serviceImages.map((si) => si.media_id);
        const { data: mediaItems } = await supabase
          .from('media_library')
          .select('public_url')
          .in('id', mediaIds);
        if (mediaItems) {
          galleryUrls.push(...mediaItems.map((m) => m.public_url));
        }
      }

      servicesList.push({
        id: service.id,
        title: service.title,
        slug: service.slug,
        short_description: service.short_description,
        detailed_overview: service.detailed_overview,
        design_approach: service.design_approach,
        materials_finishes: service.materials_finishes,
        cover_image_url: coverImageUrl,
        icon_image_url: iconImageUrl,
        features: featuresArray,
        gallery_urls: galleryUrls,
      });
    }

    return servicesList;
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
  { id: 'cat-1', name: 'Manicures', slug: 'manicures' },
  { id: 'cat-2', name: 'Artistic Extensions', slug: 'artistic-extensions' },
  { id: 'cat-3', name: 'Hand Wellness', slug: 'hand-wellness' },
];

const DEFAULT_PROJECTS: PortfolioProject[] = [
  {
    id: 'proj-1',
    category_id: 'cat-1',
    category_name: 'Manicures',
    category_slug: 'manicures',
    name: 'Chic Chrome Tips',
    slug: 'chic-chrome-tips',
    description: 'A sleek, contemporary chrome manicure reflecting high-contrast champagne gold shadows.',
    location: 'Mumbai Studio',
    completion_year: 2026,
    cover_image_url: '/images/about_intro.png',
    tags: ['Chrome', 'Minimalist', 'Artistry'],
    gallery_urls: ['/images/about_mission.png'],
  },
  {
    id: 'proj-2',
    category_id: 'cat-2',
    category_name: 'Artistic Extensions',
    category_slug: 'artistic-extensions',
    name: 'Golden Sculpted Overlays',
    slug: 'golden-sculpted-overlays',
    description: 'Bespoke builder gel sculpture integrated with gold leaf overlays and hand-painted lines.',
    location: 'Bandra Studio',
    completion_year: 2026,
    cover_image_url: '/images/hero_background.png',
    tags: ['Gel Extensions', 'Gold Leaf', 'Sculpture'],
    gallery_urls: ['/images/about_vision.png'],
  },
  {
    id: 'proj-3',
    category_id: 'cat-3',
    category_name: 'Hand Wellness',
    category_slug: 'hand-wellness',
    name: 'Hydrating Mud Spa',
    slug: 'hydrating-mud-spa',
    description: 'A complete hand wellness treatment wrap combining volcanic mud masks and cuticle repair massage oils.',
    location: 'Mumbai Studio',
    completion_year: 2026,
    cover_image_url: '/images/about_mission.png',
    tags: ['Treatment', 'Spa', 'Nourishing'],
    gallery_urls: ['/images/about_intro.png'],
  },
];

export async function getPortfolioCategories(): Promise<PortfolioCategory[]> {
  try {
    const supabase = await createClient();
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
    const supabase = await createClient();
    const { data: projects, error } = await supabase
      .from('portfolio_projects')
      .select('*, portfolio_categories(name, slug)')
      .eq('is_published', true)
      .order('display_order', { ascending: true });

    if (error || !projects || projects.length === 0) {
      return DEFAULT_PROJECTS;
    }

    const projectsList: PortfolioProject[] = [];

    for (const project of projects) {
      let coverImageUrl = '';

      // 1. Fetch cover image
      if (project.cover_image_id) {
        const { data: coverMedia } = await supabase
          .from('media_library')
          .select('public_url')
          .eq('id', project.cover_image_id)
          .maybeSingle();
        if (coverMedia) {
          coverImageUrl = coverMedia.public_url;
        }
      }

      // 2. Fetch tags
      const { data: projectTags } = await supabase
        .from('portfolio_project_tags')
        .select('project_tags(name)')
        .eq('project_id', project.id);
      
      const tagsArray: string[] = [];
      if (projectTags) {
        projectTags.forEach((pt) => {
          const t = pt.project_tags as unknown as { name: string } | null;
          if (t && t.name) {
            tagsArray.push(t.name);
          }
        });
      }

      // 3. Fetch gallery images
      const { data: galleryImages } = await supabase
        .from('portfolio_project_images')
        .select('media_id')
        .eq('project_id', project.id)
        .order('display_order', { ascending: true });
      
      const galleryUrls: string[] = [];
      if (galleryImages && galleryImages.length > 0) {
        const mediaIds = galleryImages.map((gi) => gi.media_id);
        const { data: mediaItems } = await supabase
          .from('media_library')
          .select('public_url')
          .in('id', mediaIds);
        if (mediaItems) {
          galleryUrls.push(...mediaItems.map((m) => m.public_url));
        }
      }

      const catInfo = project.portfolio_categories as unknown as { name: string; slug: string } | null;

      projectsList.push({
        id: project.id,
        category_id: project.category_id,
        category_name: catInfo?.name || '',
        category_slug: catInfo?.slug || '',
        name: project.name,
        slug: project.slug,
        description: project.description,
        location: project.location,
        completion_year: project.completion_year,
        cover_image_url: coverImageUrl,
        tags: tagsArray,
        gallery_urls: galleryUrls,
      });
    }

    return projectsList;
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
}

const DEFAULT_DESIGN_PROCESS: DesignProcessStep[] = [
  { step_number: 1, title: 'Bespoke Consultation', description: 'We analyze your natural nail shape, skin tone undertone, and lifestyle preference to craft a tailored manicure silhouette blueprint.' },
  { step_number: 2, title: 'Precision Prep', description: 'Our artist conducts clean cuticle sculpting and structure building using non-invasive tools to establish an immaculate paint canvas.' },
  { step_number: 3, title: 'Artistic Execution', description: 'Each layer is curated, using premium pigments, hand-painted detailing, gold leaf inserts, or custom chrome powders for a flawless luxury finish.' }
];

const DEFAULT_WHY_CHOOSE_US: WhyChooseUsItem[] = [
  { title: 'Bespoke Curation', description: 'Every treatment is custom-built, mapping specific color profiles to complement your personal style.', icon_name: 'Sparkles' },
  { title: 'Healthy Luxury', description: 'We use non-toxic, hypoallergenic builder gels and organic treatment oils prioritizing structural nail health.', icon_name: 'Shield' },
  { title: 'Serene Sanctuary', description: 'Our physical space is quiet and minimalist, designed to offer a peaceful escape from urban clutter.', icon_name: 'Compass' }
];

const DEFAULT_CORE_VALUES: CoreValueItem[] = [
  { title: 'Impeccable Craft', description: 'We believe detail is everything. Our alignment, linework, and finishes are executed with surgical care.', icon_name: 'PenTool' },
  { title: 'Total Wellness', description: 'True beauty starts from within. Hand health is nurtured at every phase of extension or manicure work.', icon_name: 'Heart' },
  { title: 'Modern Vision', description: 'We look ahead, sourcing international patterns and premium materials for a contemporary look.', icon_name: 'TrendingUp' }
];

const DEFAULT_PHILOSOPHY: DesignPhilosophy = {
  title: 'Our Design Philosophy',
  description: 'At The Nailaa Studio, we view nail care not as simple grooming, but as an intimate art form. We reject noisy trends in favor of quiet confidence—shapes that are clean, colors that are deliberate, and structures that are lasting. True luxury is not loud; it is the breath of space between object and expression.',
  quote: 'Simplicity is the ultimate sophistication. We design for the silence between elements.',
  author: 'Nailaa Studio Artistry'
};

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  { client_name: 'Aishwarya Sen', client_title: 'Regular Client', quote: 'The attention to structure is unlike any other studio. My builder gel overlays last 4+ weeks while keeping my natural nails healthy.', rating: 5 },
  { client_name: 'Meera Rajput', client_title: 'Creative Director', quote: 'Quiet luxury personified. The clean interior, personalized color advice, and surgical precision in cuticle prep are exceptional.', rating: 5 },
  { client_name: 'Rohan Mehra', client_title: 'Art Curator', quote: 'A serene sanctuary. The minimalist art on my nails feels contemporary and custom-crafted. The team understands design proportion.', rating: 5 }
];

export async function getDesignProcess(): Promise<DesignProcessStep[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('design_process')
      .select('step_number, title, description')
      .order('step_number', { ascending: true });

    if (error || !data || data.length === 0) {
      return DEFAULT_DESIGN_PROCESS;
    }

    return data;
  } catch (err) {
    console.error('Error fetching design process from Supabase:', err);
    return DEFAULT_DESIGN_PROCESS;
  }
}

export async function getWhyChooseUs(): Promise<WhyChooseUsItem[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('why_choose_us')
      .select('title, description, icon_name')
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
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('core_values')
      .select('title, description, icon_name')
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
    const supabase = await createClient();
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
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('testimonials')
      .select('client_name, client_title, quote, rating')
      .eq('is_visible', true)
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return DEFAULT_TESTIMONIALS;
    }

    return data;
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
    const supabase = await createClient();
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
    const supabase = await createClient();
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
