import Link from 'next/link';
import { Mail, Phone, MapPin, Clock, Instagram, Facebook, Linkedin, Youtube, MessageCircle } from 'lucide-react';

export interface FooterSocialLink {
  platform: 'instagram' | 'facebook' | 'pinterest' | 'linkedin' | 'whatsapp' | 'youtube';
  url: string;
}

interface FooterProps {
  companyName: string;
  logoUrl: string | null;
  description: string | null;
  address: string | null;
  phone: string;
  email: string;
  hours: string;
  socials: FooterSocialLink[];
}

export function Footer({
  companyName,
  logoUrl,
  description,
  address,
  phone,
  email,
  hours,
  socials,
}: FooterProps) {
  const currentYear = new Date().getFullYear();

  const socialIcons: Record<FooterSocialLink['platform'], React.ReactNode> = {
    instagram: <Instagram className="h-5 w-5" />,
    facebook: <Facebook className="h-5 w-5" />,
    pinterest: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="none"
      >
        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.965 1.406-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.62 0 11.988-5.367 11.988-11.987C24.005 5.367 18.636 0 12.017 0z" />
      </svg>
    ),
    linkedin: <Linkedin className="h-5 w-5" />,
    whatsapp: <MessageCircle className="h-5 w-5" />,
    youtube: <Youtube className="h-5 w-5" />,
  };

  const quickLinks = [
    { href: '/', label: 'Home' },
    { href: '/services', label: 'Services' },
    { href: '/portfolio', label: 'Portfolio' },
    { href: '/testimonials', label: 'Testimonials' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <footer className="bg-[#111111] text-gray-400 border-t border-[#C9A86A]/10 font-sans py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        {/* Column 1: Brand */}
        <div className="flex flex-col space-y-4">
          <Link href="/" className="flex items-center space-x-2 select-none">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={companyName} className="h-10 w-auto object-contain" />
            ) : (
              <span className="font-serif text-2xl font-bold tracking-wide text-[#C9A86A]">
                {companyName}
              </span>
            )}
          </Link>
          <p className="text-sm leading-relaxed text-gray-400">
            {description || 'Luxury nail styling, artistic designs, and premium care. Handcrafted beauty made for you.'}
          </p>
          {/* Social Links */}
          {socials.length > 0 && (
            <div className="flex items-center space-x-4 pt-2">
              {socials.map((social) => (
                <a
                  key={social.platform}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full p-2 bg-[#1A1A1A] hover:bg-[#8A7052]/20 hover:text-[#C9A86A] transition-all duration-300 text-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A86A]"
                  aria-label={`Follow us on ${social.platform}`}
                >
                  {socialIcons[social.platform]}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Column 2: Navigation Links */}
        <div className="flex flex-col space-y-4">
          <h3 className="font-serif text-lg font-semibold tracking-wider text-white">
            Quick Links
          </h3>
          <ul className="space-y-2 text-sm">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="hover:text-[#C9A86A] transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A86A] rounded px-1"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Business Hours */}
        <div className="flex flex-col space-y-4">
          <h3 className="font-serif text-lg font-semibold tracking-wider text-white">
            Business Hours
          </h3>
          <div className="flex items-start space-x-3 text-sm">
            <Clock className="h-5 w-5 text-[#8A7052] flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span className="leading-relaxed whitespace-pre-line">{hours}</span>
          </div>
        </div>

        {/* Column 4: Contact Info */}
        <div className="flex flex-col space-y-4">
          <h3 className="font-serif text-lg font-semibold tracking-wider text-white">
            Contact Us
          </h3>
          <div className="space-y-4 text-sm">
            {address && (
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-[#8A7052] flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span className="leading-relaxed">{address}</span>
              </div>
            )}
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-[#8A7052] flex-shrink-0" aria-hidden="true" />
              <a
                href={`tel:${phone.replace(/\s+/g, '')}`}
                className="hover:text-[#C9A86A] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A86A] rounded px-1"
              >
                {phone}
              </a>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-[#8A7052] flex-shrink-0" aria-hidden="true" />
              <a
                href={`mailto:${email}`}
                className="hover:text-[#C9A86A] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A86A] rounded px-1"
              >
                {email}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="mx-auto max-w-7xl border-t border-gray-800/60 mt-12 pt-8 text-center text-xs text-gray-500">
        <p>© {currentYear} {companyName}. All Rights Reserved. Crafted with care.</p>
      </div>
    </footer>
  );
}
