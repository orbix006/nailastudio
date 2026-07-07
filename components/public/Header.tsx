'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, Sun, Moon, PhoneCall } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface HeaderProps {
  companyName: string;
  logoUrl: string | null;
  contactPhone: string;
}

export function Header({ companyName, logoUrl, contactPhone }: HeaderProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  // Monitor page scroll to toggle glassmorphism style
  React.useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    const checkAdmin = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('admin_profiles')
            .select('is_active, role')
            .eq('id', user.id)
            .maybeSingle();
          if (profile?.is_active === true && (profile.role === 'admin' || profile.role === 'superadmin')) {
            setIsAdmin(true);
          }
        }
      } catch (err) {
        console.error('Error checking admin status in header:', err);
      }
    };
    checkAdmin();
  }, []);

  const navLinks = [
    { href: '/#hero', label: 'Home' },
    { href: '/#about', label: 'About' },
    { href: '/#services', label: 'Services' },
    { href: '/#portfolio', label: 'Portfolio' },
    { href: '/blog', label: 'Blog' },
    { href: '/#contact', label: 'Contact' },
    ...(isAdmin ? [{ href: '/admin', label: 'Admin Panel' }] : []),
  ];

  const [activeHash, setActiveHash] = React.useState('');

  React.useEffect(() => {
    const handleHashChange = () => {
      setActiveHash(window.location.hash);
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  React.useEffect(() => {
    if (pathname !== '/') {
      setActiveHash('');
      return;
    }

    const sections = ['hero', 'about', 'services', 'portfolio', 'contact'];
    const observerOptions = {
      root: null,
      rootMargin: '-30% 0px -45% 0px',
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          setActiveHash(id === 'hero' ? '' : '#' + id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      sections.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.unobserve(el);
      });
    };
  }, [pathname]);

  React.useEffect(() => {
    if (window.location.hash) {
      const hash = window.location.hash;
      const targetId = hash.substring(1);
      const timer = setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('/#') || href === '/') {
      const targetId = href === '/' ? 'hero' : href.substring(2);
      
      if (pathname === '/') {
        e.preventDefault();
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          window.history.pushState(null, '', href);
          setActiveHash(href === '/' ? '' : '#' + targetId);
        } else if (href === '/') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          window.history.pushState(null, '', '/');
          setActiveHash('');
        }
        setIsMobileMenuOpen(false);
      } else {
        setIsMobileMenuOpen(false);
      }
    } else {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500 font-sans border-b',
          isScrolled
            ? 'bg-white/75 dark:bg-[#111111]/70 backdrop-blur-xl border-stone-200 dark:border-[#C9A86A]/10 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]'
            : 'bg-transparent border-transparent py-5'
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo / Branding */}
          <Link 
            href="/" 
            onClick={(e) => handleNavClick(e, '/')}
            className="flex items-center space-x-2 select-none group"
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={companyName}
                width={180}
                height={36}
                priority
                className="h-9 w-auto object-contain"
              />
            ) : (
              <span className="font-serif text-2xl font-bold tracking-wide text-[#C9A86A] transition-colors group-hover:text-[#C9A86A]/80">
                {companyName}
              </span>
            )}
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => {
              const isBlog = link.href === '/blog';
              const isActive = isBlog
                ? (pathname === '/blog' || pathname.startsWith('/blog/'))
                : (pathname === '/' && (
                    link.href === '/#hero'
                      ? (activeHash === '' || activeHash === '#hero')
                      : activeHash === link.href.substring(1)
                  ));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={cn(
                    'text-sm font-semibold tracking-wide transition-colors duration-200 relative py-1 hover:text-[#C9A86A]',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A86A] rounded px-1.5 py-0.5',
                    isActive ? 'text-[#C9A86A]' : 'text-stone-600 dark:text-gray-400'
                  )}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C9A86A] rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Header Actions (Theme Switcher, Call CTA, Hamburger) */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="rounded-full p-2 text-stone-500 dark:text-gray-400 hover:bg-stone-100 dark:hover:bg-gray-800 hover:text-[#C9A86A] dark:hover:text-[#C9A86A] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A86A]"
              aria-label="Toggle theme mode"
            >
              {!mounted ? (
                <div className="h-5 w-5" />
              ) : theme === 'dark' ? (
                <Sun className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Moon className="h-5 w-5" aria-hidden="true" />
              )}
            </button>

            {/* Quick Consultation CTA Button (Desktop) */}
            <Button
              variant="accent"
              size="sm"
              className="hidden sm:flex items-center space-x-2 cursor-pointer"
              onClick={() => {
                const event = new CustomEvent('open-inquiry-modal', {
                  detail: { source: 'header_cta' },
                });
                window.dispatchEvent(event);
              }}
            >
              <PhoneCall className="h-4 w-4" aria-hidden="true" />
              <span>Book Consultation</span>
            </Button>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              aria-expanded={isMobileMenuOpen}
              className="md:hidden rounded-full p-2 text-stone-500 dark:text-gray-400 hover:bg-stone-100 dark:hover:bg-gray-800 hover:text-[#C9A86A] dark:hover:text-white transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A86A]"
              aria-label="Open navigation menu"
            >
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* Reusable Mobile Navigation Drawer */}
      <Drawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        title="Navigation"
      >
        <div className="flex flex-col space-y-6 pt-4">
          {navLinks.map((link) => {
            const isBlog = link.href === '/blog';
            const isActive = isBlog
              ? (pathname === '/blog' || pathname.startsWith('/blog/'))
              : (pathname === '/' && (
                  link.href === '/#hero'
                    ? (activeHash === '' || activeHash === '#hero')
                    : activeHash === link.href.substring(1)
                ));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={cn(
                  'text-lg font-bold tracking-wide transition-colors py-2 border-b border-stone-200 dark:border-gray-800/30 hover:text-[#C9A86A]',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A86A] rounded px-1',
                  isActive ? 'text-[#C9A86A]' : 'text-stone-500 dark:text-gray-400'
                )}
              >
                {link.label}
              </Link>
            );
          })}

          <div className="pt-6">
            <a href={`tel:${contactPhone.replace(/\s+/g, '')}`}>
              <Button variant="secondary" className="w-full flex items-center justify-center space-x-2 py-3.5">
                <PhoneCall className="h-5 w-5" />
                <span>Call {contactPhone}</span>
              </Button>
            </a>
          </div>
        </div>
      </Drawer>
    </>
  );
}
