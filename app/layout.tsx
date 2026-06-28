import './globals.css';
import './styles.css';
import { Inter, Montserrat, Poppins } from 'next/font/google';
import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import Providers from './providers';
import { categories } from './lib/wallpapers';

// ----------------------
// Fonts Setup
// ----------------------
// Only the weights that are actually applied in the app's CSS are
// requested. Inter is loaded as a variable font (covers 100-900)
// so body text and headings share a single woff2 download.
// Heading/UI fonts are loaded with explicit weight arrays so the
// @font-face rules only emit the exact files we need.
//
// All three fonts use `preload: false` to avoid Chrome's
// "preloaded but not used within a few seconds" warning when a
// particular weight is not visible above the fold on a given
// page. The woff2 files are still downloaded on demand via the
// generated @font-face rules. The first page load of any
// in-page heading is still effectively instant because the
// @font-face matches and the browser caches the woff2.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: false,
});

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  weight: ['500', '600', '700'],
  display: 'swap',
  preload: false,
});

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  weight: ['500', '600', '700', '800'],
  display: 'swap',
  preload: false,
});

// ----------------------
// Configuration
// ----------------------
const SITE_URL = 'https://tavrynewallpapers.vercel.app';
const SITE_NAME = 'Tavryne Wallpapers';
const SITE_ALTERNATE_NAME = 'Tavryne';
const SITE_DESCRIPTION =
  'Tavryne Wallpapers is a wallpaper download website offering 4K, HD, and 8K anime, gaming, cyberpunk, nature, and aesthetic wallpapers for desktop and mobile devices.';
const SITE_SHORT_DESCRIPTION =
  'Tavryne Wallpapers - Free 4K, HD, and 8K anime, gaming, cyberpunk, and aesthetic wallpapers for desktop and mobile.';
const OG_IMAGE = `${SITE_URL}/og-image.png`;
const LOGO_URL = `${SITE_URL}/icon-192.svg`;

// Bump this whenever the icon set changes so browsers / link-preview bots
// are forced to re-fetch instead of reusing the cached older icon.
const ICON_VERSION = "v4";

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
  appLinks: {},

  title: {
    default: `${SITE_NAME} — 4K Anime, Gaming & Cyberpunk Wallpapers`,
    template: '%s | Tavryne Wallpapers',
  },

  description: SITE_DESCRIPTION,
  verification: {
  google: 'yD0EuT3GHCroc_8sUd70Nt-puSwrlKEdsar7YRDcx_M',
},

  keywords: [
    SITE_NAME,
    SITE_ALTERNATE_NAME,
    'Tavryne',
    'tavryne wallpapers',
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

  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'technology',
  classification: 'Wallpaper Download Service',
  formatDetection: { telephone: false, address: false, email: false },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'noimageindex': false,
    },
  },

  alternates: {
    canonical: SITE_URL,
    languages: {
      'en': SITE_URL,
      'x-default': SITE_URL,
    },
  },

  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — 4K Anime, Gaming & Cyberpunk Wallpapers`,
    description: SITE_SHORT_DESCRIPTION,
    determiner: '',
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — Free 4K Anime, Gaming & Cyberpunk Wallpapers`,
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — 4K Anime, Gaming & Cyberpunk Wallpapers`,
    description: SITE_SHORT_DESCRIPTION,
    creator: '@tavrynewallpapers',
    site: '@tavrynewallpapers',
    images: [OG_IMAGE],
  },

  // The .ico is auto-injected by Next.js from `app/favicon.ico` (served
  // at /favicon.ico). We only declare the SVG + PNG fallbacks + apple
  // touch icon explicitly here.
  icons: {
    icon: [
      // Modern browsers (Chrome, Firefox, Edge, Safari) prefer SVG.
      { url: `/icon-192.svg?${ICON_VERSION}`, type: 'image/svg+xml', sizes: 'any' },
      // Raster fallbacks for clients that don't read SVG icons.
      { url: `/icon-32.png?${ICON_VERSION}`, sizes: '32x32', type: 'image/png' },
      { url: `/icon-48.png?${ICON_VERSION}`, sizes: '48x48', type: 'image/png' },
      { url: `/icon-96.png?${ICON_VERSION}`, sizes: '96x96', type: 'image/png' },
      { url: `/icon-192.png?${ICON_VERSION}`, sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: `/icon-180.png?${ICON_VERSION}`, sizes: '180x180', type: 'image/png' },
      { url: `/icon-192.png?${ICON_VERSION}`, sizes: '192x192', type: 'image/png' },
    ],
  },

  manifest: '/site.webmanifest',

  other: {
    'application-name': SITE_NAME,
    'apple-mobile-web-app-title': SITE_ALTERNATE_NAME,
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'mobile-web-app-capable': 'yes',
    'color-scheme': 'dark',
    // Windows tile (used by Bing and Windows Start menu)
    'msapplication-TileColor': '#0a0a0a',
    'msapplication-TileImage': `${SITE_URL}/icon-256.png?${ICON_VERSION}`,
    'msapplication-config': '/site.webmanifest',
    'twitter:label1': 'Wallpaper count',
    'twitter:data1': '500+',
    'twitter:label2': 'Resolution range',
    'twitter:data2': 'HD, 4K, 8K',
  },
};

// ----------------------
// JSON-LD Schema Generators
// ----------------------

/**
 * Organization schema (used for Knowledge Panel / brand disambiguation)
 *  - `name`: full brand name
 *  - `alternateName`: short brand name (helps Google associate "Tavryne" with brand)
 *  - `disambiguatingDescription`: explicitly clarify what the brand is
 *  - `knowsAbout`: domain topics to disambiguate from unrelated topics
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    alternateName: [SITE_ALTERNATE_NAME, 'Tavryne Wallpaper', 'TavryneWallpapers'],
    legalName: SITE_NAME,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: LOGO_URL,
      width: 192,
      height: 192,
      caption: `${SITE_NAME} logo`,
    },
    image: OG_IMAGE,
    description:
      'Tavryne Wallpapers is an online wallpaper download service that provides high-quality 4K, HD, and 8K wallpapers for desktop and mobile devices.',
    disambiguatingDescription:
      'Tavryne Wallpapers is a wallpaper download website. It is not related to the amino acid, supplement, energy drink, or any other use of the similarly-spelled word "taurine".',
    foundingDate: '2023',
    slogan: '4K Anime, Gaming & Cyberpunk Wallpapers',
    knowsAbout: [
      'Wallpapers',
      '4K Wallpapers',
      'HD Wallpapers',
      '8K Wallpapers',
      'Anime Wallpapers',
      'Gaming Wallpapers',
      'Cyberpunk Wallpapers',
      'Aesthetic Wallpapers',
      'Desktop Wallpapers',
      'Mobile Wallpapers',
    ],
    inLanguage: 'en',
    areaServed: 'Worldwide',
    about: {
      '@type': 'Thing',
      name: 'Wallpaper Downloads',
      description: 'High-quality 4K, HD, and 8K wallpapers for desktop and mobile devices.',
    },
    sameAs: [
      'https://twitter.com/tavrynewallpapers',
      'https://instagram.com/tavrynewallpapers',
      'https://github.com/tavryne',
      'https://www.pinterest.com/tavrynewallpapers',
    ],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'contact@tavrynewallpapers.vercel.app',
        availableLanguage: ['English'],
      },
    ],
  };
}

/**
 * WebSite schema (used for Sitelinks Search Box and brand site name)
 */
export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    alternateName: SITE_ALTERNATE_NAME,
    url: SITE_URL,
    description: SITE_SHORT_DESCRIPTION,
    inLanguage: 'en',
    publisher: { '@id': `${SITE_URL}/#organization` },
    copyrightHolder: { '@id': `${SITE_URL}/#organization` },
    copyrightYear: new Date().getFullYear(),
    potentialAction: {
      '@type': 'SearchAction',
      target: [
        {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
        },
      ],
      'query-input': 'required name=search_term_string',
    },
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
    publisher: { '@id': `${SITE_URL}/#organization` },
    isPartOf: { '@id': `${SITE_URL}/#website` },
  };
}

export function generateItemListSchema(
  name: string,
  url: string,
  items: Array<{ name: string; url: string; image?: string; position: number }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    url,
    numberOfItems: items.length,
    itemListElement: items.map(item => ({
      '@type': 'ListItem',
      position: item.position,
      name: item.name,
      url: item.url,
      ...(item.image && { image: item.image }),
    })),
    publisher: { '@id': `${SITE_URL}/#organization` },
    isPartOf: { '@id': `${SITE_URL}/#website` },
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
  // Global JSON-LD: Organization + WebSite (injected on every page)
  const organizationLd = generateOrganizationSchema();
  const websiteLd = generateWebSiteSchema();

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${montserrat.variable} ${inter.variable} ${poppins.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
        />
      </head>
      <body>
        <AuthProvider>
          <Providers>{children}</Providers>
        </AuthProvider>
      </body>
    </html>
  );
}
