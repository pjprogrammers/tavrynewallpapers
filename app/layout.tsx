import './styles.css';
import { Inter, Montserrat, Poppins } from 'next/font/google';
import type { Metadata, Viewport } from 'next';

// Define fonts
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
});

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  weight: ['400', '500', '600', '700'],
  display: 'swap'
});

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap'
});

// Viewport settings
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0a0a',
};

// Metadata
export const metadata: Metadata = {
  title: 'Tavryne Wallpapers | Premium HD & 4K Wallpapers',
  description: 'Discover and download stunning high-quality wallpapers for your desktop, mobile, and tablet. Free HD, 4K, and 8K wallpapers for all your devices.',
  keywords: 'wallpapers, HD wallpapers, 4K wallpapers, 8K wallpapers, desktop wallpapers, mobile wallpapers, free wallpapers, download wallpapers',
  authors: [{ name: 'Tavryne Wallpapers' }],
  creator: 'Tavryne Wallpapers',
  publisher: 'Tavryne Wallpapers',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://tavrynewallpapers.vercel.app',
    title: 'Tavryne Wallpapers | Premium HD & 4K Wallpapers',
    description: 'Discover and download stunning high-quality wallpapers for your desktop, mobile, and tablet.',
    siteName: 'Tavryne Wallpapers',
    images: [
      {
        url: 'https://tavrynewallpapers.vercel.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Tavryne Wallpapers Preview Image',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tavryne Wallpapers | Premium HD & 4K Wallpapers',
    description: 'Discover and download stunning high-quality wallpapers for your desktop, mobile, and tablet.',
    creator: '@tavrynewallpapers',
    images: ['https://tavrynewallpapers.vercel.app/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${montserrat.variable} ${inter.variable} ${poppins.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
}
