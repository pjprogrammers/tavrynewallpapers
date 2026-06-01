import './styles.css';
import { Inter, Montserrat, Poppins } from 'next/font/google';
import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import { categories, getAllWallpapers, getFeaturedWallpapers } from './lib/wallpapers';

// ----------------------
// Fonts Setup
// ----------------------
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

// ----------------------
// Configuration
// ----------------------
const SITE_URL = 'https://tavrynewallpapers.vercel.app';
const SITE_NAME = 'Tavryne Wallpapers';
const SITE_DESCRIPTION = 'Discover and download stunning high-quality 4K, HD, and 8K anime, gaming, cyberpunk, and aesthetic wallpapers. Free wallpapers for desktop and mobile.';
const OG_IMAGE = `${SITE_URL}/og-image.png`;

// ----------------------
// Viewport
// ----------------------
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0a0a',
};

// ----------------------
// Global Metadata (SEO + Social Sharing)
// ----------------------
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  applicationName: SITE_NAME,

  title: {
    default: `${SITE_NAME} — 4K Anime, Gaming & Cyberpunk Wallpapers`,
    template: '%s | Tavryne Wallpapers',
  },

  description: SITE_DESCRIPTION,
  verification: {
  google: 'yD0EuT3GHCroc_8sUd70Nt-puSwrlKEdsar7YRDcx_M',
},

  keywords: [
    'Tavryne Wallpapers',
    'wallpapers',
    '4K wallpapers',
    '8K wallpapers',
    'HD wallpapers',
    'anime wallpapers',
    'gaming wallpapers',
    'cyberpunk wallpapers',
    'aesthetic wallpapers',
    'desktop wallpapers',
    'mobile wallpapers',
    'free wallpapers',
    'download wallpapers',
    'high resolution wallpapers',
    'premium wallpapers',
  ],

  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'technology',

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  alternates: {
    canonical: SITE_URL,
    languages: {
      'en': SITE_URL,
    },
  },

  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,

    title: `${SITE_NAME} — 4K Anime, Gaming & Cyberpunk Wallpapers`,
    description: SITE_DESCRIPTION,

    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'Tavryne Wallpapers - Premium HD & 4K Wallpapers',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — 4K Anime, Gaming & Cyberpunk Wallpapers`,
    description: SITE_DESCRIPTION,
    creator: '@tavrynewallpapers',
    site: '@tavrynewallpapers',
    images: [OG_IMAGE],
  },
};

// ----------------------
// JSON-LD Structured Data
// ----------------------
export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: SITE_DESCRIPTION,
    sameAs: [
      'https://twitter.com/tavrynewallpapers',
      'https://instagram.com/tavrynewallpapers',
      'https://github.com/tavryne',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'contact@tavrynewallpapers.vercel.app',
      availableLanguage: 'English',
    },
    areaServed: {
      '@type': 'Place',
      '@id': 'https://en.wikipedia.org/wiki/Internet',
    },
    serviceType: 'Wallpaper Download Service',
  };
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function generateCollectionPageSchema(name: string, description: string, url: string, itemCount?: number) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url,
    ...(itemCount && { numberOfItems: itemCount }),
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

// ----------------------
// Root Layout
// ----------------------
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${montserrat.variable} ${inter.variable} ${poppins.variable}`}
    >
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
