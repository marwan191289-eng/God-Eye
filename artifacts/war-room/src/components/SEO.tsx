import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
}

export const SEO = ({
  title = 'TradeXRay AI — Dominate Crypto Markets with Viral AI Signals',
  description = 'Unlock viral trading success with TradeXRay AI. Get real-time signals for Binance, Bybit, TradingView, OKX, and more. 90%+ accuracy AI-powered trading intelligence.',
  keywords = [
    'TradeXRay AI', 'Binance signals', 'Bybit trading', 'TradingView', 'OKX crypto',
    'crypto signals', 'Bitcoin trading', 'Ethereum signals', 'viral trading',
    'AI trading', 'automated trading', 'crypto intelligence', 'trading bot',
    'market signals', 'technical analysis', 'crypto analysis', 'Solana trading',
    'memecoin signals', 'whale tracker', 'DeFi signals', 'trading platform'
  ],
  image = 'https://tradexray.vercel.app/og-viral-image.png',
  url = 'https://tradexray.vercel.app',
  type = 'website',
}: SEOProps) => {
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta name="author" content="TradeXRay AI Team" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="TradeXRay AI" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@TradeXRayAI" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:creator" content="@TradeXRayAI" />
      
      {/* LinkedIn */}
      <meta property="linkedin:title" content={title} />
      <meta property="linkedin:description" content={description} />
      <meta property="linkedin:image" content={image} />
      
      {/* Theme & Branding */}
      <meta name="theme-color" content="#00c87a" />
      <meta name="msapplication-TileColor" content="#00c87a" />
      <link rel="icon" href="/favicon-viral.png" />
      <link rel="apple-touch-icon" href="/apple-touch-icon-viral.png" />
      
      {/* Preconnect to external resources */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      
      {/* Additional SEO */}
      <meta name="google-site-verification" content="your-google-verification-code" />
      <meta name="msvalidate.01" content="your-bing-verification-code" />
    </Helmet>
  );
};

export default SEO;
