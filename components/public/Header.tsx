'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Sun, Moon, PhoneCall } from 'lucide-react';
import { useTheme } from '@/components/ui/ThemeProvider';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

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

  // Monitor page scroll to toggle glassmorphism style
  React.useEffect(() => {
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

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/services', label: 'Services' },
    { href: '/portfolio', label: 'Portfolio' },
    { href: '/testimonials', label: 'Testimonials' },
    { href: '/contact', label: 'Contact' },
  ];

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 font-sans border-b',
          isScrolled
            ? 'bg-[#111111]/85 dark:bg-[#111111]/85 bg-white/85 backdrop-blur-md border-[#C9A86A]/20 dark:border-[#C9A86A]/10 py-3 shadow-lg'
            : 'bg-transparent border-transparent py-5'
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo / Branding */}
          <Link href="/" className="flex items-center space-x-2 select-none group">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={companyName} className="h-9 w-auto object-contain" />
            ) : (
              <span className="font-serif text-2xl font-bold tracking-wide text-[#C9A86A] transition-colors group-hover:text-[#C9A86A]/80">
                {companyName}
              </span>
            )}
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'text-sm font-semibold tracking-wide transition-colors duration-200 relative py-1 hover:text-[#C9A86A]',
                    isActive ? 'text-[#C9A86A]' : 'text-gray-400 dark:text-gray-400 text-gray-500'
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
              className="rounded-full p-2 text-gray-400 hover:bg-gray-800/10 dark:hover:bg-gray-800 hover:text-[#C9A86A] transition-colors cursor-pointer"
              aria-label="Toggle theme mode"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
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
              <PhoneCall className="h-4 w-4" />
              <span>Book Consultation</span>
            </Button>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden rounded-full p-2 text-gray-400 hover:bg-gray-800/10 dark:hover:bg-gray-800 hover:text-white transition-colors cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="h-6 w-6" />
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
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={handleLinkClick}
                className={cn(
                  'text-lg font-bold tracking-wide transition-colors py-2 border-b border-gray-800/30 hover:text-[#C9A86A]',
                  isActive ? 'text-[#C9A86A]' : 'text-gray-400'
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
