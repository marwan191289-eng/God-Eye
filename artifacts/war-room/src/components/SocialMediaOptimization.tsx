import { Helmet } from 'react-helmet-async';

interface SocialMediaOptimizationProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  twitterHandle?: string;
  facebookAppId?: string;
}

export const SocialMediaOptimization = ({
  title = 'TradeXRay AI — The Ultimate Crypto Trading & Analytics Platform',
  description = 'Trade crypto like a pro with TradeXRay AI. Real-time signals, spot & futures trading, wallet integration, and AI-powered analytics. Compete with Binance, Bybit, and OKX.',
  image = 'https://tradexray.vercel.app/og-viral-image.png',
  url = 'https://tradexray.vercel.app',
  twitterHandle = '@TradeXRayAI',
  facebookAppId = '1234567890',
}: SocialMediaOptimizationProps) => {
  // Comprehensive keyword list for SEO
  const keywords = [
    // Main brand
    'TradeXRay AI', 'TradeXRay', 'trading platform', 'crypto trading',
    
    // Major exchanges
    'Binance', 'Bybit', 'OKX', 'Coinbase', 'Kraken', 'Kucoin', 'Huobi',
    'Phantom', 'Solflare', 'Magic Eden', 'Raydium', 'Orca',
    
    // Trading types
    'spot trading', 'futures trading', 'margin trading', 'leverage trading',
    'crypto signals', 'trading signals', 'buy signals', 'sell signals',
    
    // Assets
    'Bitcoin', 'Ethereum', 'Solana', 'BNB', 'XRP', 'ADA', 'DOGE',
    'AVAX', 'MATIC', 'ARB', 'OP', 'BASE', 'memecoin', 'altcoin',
    'BTC', 'ETH', 'SOL', 'USDT', 'USDC',
    
    // Features
    'AI trading', 'automated trading', 'trading bot', 'price alerts',
    'technical analysis', 'market analysis', 'chart analysis',
    'multi-timeframe analysis', 'risk management', 'stop loss',
    'take profit', 'portfolio tracking', 'wallet integration',
    
    // User actions
    'how to trade crypto', 'crypto trading guide', 'trading tutorial',
    'best trading platform', 'crypto signals free', 'trading signals bot',
    'crypto trading bot', 'automated crypto trading',
    
    // Market-related
    'crypto market', 'cryptocurrency market', 'digital assets',
    'DeFi', 'Web3', 'blockchain', 'NFT', 'token trading',
    'coin trading', 'crypto exchange', 'DEX', 'CEX',
    
    // Performance-related
    '90% win rate', 'high accuracy signals', 'profitable trading',
    'crypto profits', 'trading profits', 'passive income crypto',
    
    // Comparison
    'better than Binance', 'Binance alternative', 'OKX alternative',
    'Bybit alternative', 'crypto trading alternative',
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'TradeXRay AI',
    description,
    url,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free trading signals and analytics',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '5000',
      bestRating: '5',
      worstRating: '1',
    },
    author: {
      '@type': 'Organization',
      name: 'TradeXRay AI Team',
      url: 'https://tradexray.vercel.app',
    },
    creator: {
      '@type': 'Person',
      name: 'Marwan Negm',
    },
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="3 days" />
      <meta name="author" content="TradeXRay AI Team" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#00c87a" />
      <meta name="msapplication-TileColor" content="#00c87a" />

      {/* Canonical URL */}
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="TradeXRay AI" />
      <meta property="og:locale" content="en_US" />
      <meta property="og:locale:alternate" content="ar_SA" />
      <meta property="og:locale:alternate" content="es_ES" />
      <meta property="og:locale:alternate" content="fr_FR" />
      <meta property="og:locale:alternate" content="de_DE" />
      <meta property="og:locale:alternate" content="ru_RU" />
      <meta property="og:locale:alternate" content="tr_TR" />
      <meta property="og:locale:alternate" content="zh_CN" />

      {/* Facebook App ID */}
      <meta property="fb:app_id" content={facebookAppId} />

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={twitterHandle} />
      <meta name="twitter:creator" content={twitterHandle} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={title} />
      <meta name="twitter:domain" content="tradexray.vercel.app" />

      {/* LinkedIn */}
      <meta property="linkedin:title" content={title} />
      <meta property="linkedin:description" content={description} />
      <meta property="linkedin:image" content={image} />

      {/* WhatsApp */}
      <meta property="whatsapp:title" content={title} />
      <meta property="whatsapp:description" content={description} />
      <meta property="whatsapp:image" content={image} />

      {/* Pinterest */}
      <meta property="pinterest:title" content={title} />
      <meta property="pinterest:description" content={description} />
      <meta property="pinterest:media" content={image} />

      {/* Instagram */}
      <meta property="instagram:title" content={title} />
      <meta property="instagram:description" content={description} />

      {/* Telegram */}
      <meta property="telegram:title" content={title} />
      <meta property="telegram:description" content={description} />

      {/* Structured Data (JSON-LD) */}
      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>

      {/* Preconnect to external resources */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://api.coingecko.com" />
      <link rel="preconnect" href="https://api.binance.com" />

      {/* DNS Prefetch */}
      <link rel="dns-prefetch" href="https://api.coingecko.com" />
      <link rel="dns-prefetch" href="https://api.binance.com" />

      {/* Verification Tags */}
      <meta name="google-site-verification" content="your-google-verification-code" />
      <meta name="msvalidate.01" content="your-bing-verification-code" />
      <meta name="yandex-verification" content="your-yandex-verification-code" />

      {/* Apple */}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="TradeXRay AI" />
      <link rel="apple-touch-icon" href="/apple-touch-icon-viral.png" />

      {/* Icons */}
      <link rel="icon" href="/favicon-viral.png" />
      <link rel="shortcut icon" href="/favicon-viral.png" />

      {/* Manifest */}
      <link rel="manifest" href="/manifest.json" />

      {/* Additional SEO */}
      <meta name="rating" content="general" />
      <meta name="target" content="all" />
      <meta name="distribution" content="global" />
      <meta name="coverage" content="Worldwide" />
      <meta name="doc_type" content="WebPage" />
      <meta name="page-type" content="homepage" />
      <meta name="audience" content="Traders, Investors, Crypto Enthusiasts" />
    </Helmet>
  );
};

export default SocialMediaOptimization;
