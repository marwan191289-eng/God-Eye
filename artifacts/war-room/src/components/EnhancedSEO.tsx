import { Helmet } from 'react-helmet-async';

interface EnhancedSEOProps {
  page: 'home' | 'trading' | 'signals' | 'dashboard' | 'admin' | 'subscriptions' | 'settings';
  customTitle?: string;
  customDescription?: string;
  customImage?: string;
  customKeywords?: string[];
}

export const EnhancedSEO = ({
  page,
  customTitle,
  customDescription,
  customImage,
  customKeywords = [],
}: EnhancedSEOProps) => {
  // Page-specific SEO data
  const seoData: Record<string, any> = {
    home: {
      title: 'TradeXRay AI — منصة التداول والتحليلات المدعومة بالذكاء الاصطناعي',
      description: 'منصة تداول متكاملة مع إشارات عالية الدقة، تحليلات متقدمة، وتداول فوري وعقود آجلة. تنافس Binance و Bybit مع ميزات AI متطورة.',
      keywords: [
        'منصة تداول', 'تحليلات العملات الرقمية', 'إشارات تداول', 'Binance بديل',
        'تداول Bitcoin', 'تداول Ethereum', 'التحليل الفني', 'الذكاء الاصطناعي',
        'تداول بدون رسوم', 'محفظة رقمية', 'Web3 trading', 'DeFi platform',
      ],
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'TradeXRay AI',
        description: 'منصة تداول وتحليلات متكاملة مدعومة بالذكاء الاصطناعي',
        applicationCategory: 'FinanceApplication',
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          ratingCount: '5000',
        },
      },
    },
    trading: {
      title: 'منصة التداول - TradeXRay AI | تداول Spot و Futures بدون رسوم',
      description: 'تداول العملات الرقمية مباشرة مع TradeXRay AI. دعم Spot و Futures، محافظ متعددة، وتنفيذ فوري. ربط MetaMask و WalletConnect.',
      keywords: [
        'تداول فوري', 'تداول العقود الآجلة', 'Spot trading', 'Futures trading',
        'MetaMask', 'WalletConnect', 'محفظة رقمية', 'تحويل العملات',
        'تداول بدون رسوم', 'رافعة مالية', 'إدارة المخاطر',
      ],
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: 'https://tradexray.vercel.app' },
          { '@type': 'ListItem', position: 2, name: 'التداول', item: 'https://tradexray.vercel.app/trading' },
        ],
      },
    },
    signals: {
      title: 'إشارات التداول الذكية - TradeXRay AI | دقة 90%+',
      description: 'احصل على إشارات تداول عالية الدقة (90%+) مدعومة بالذكاء الاصطناعي. تحليل فني متقدم، تحليل المشاعر السوقية، وتنبيهات فورية.',
      keywords: [
        'إشارات تداول', 'trading signals', 'إشارات شراء', 'إشارات بيع',
        'تحليل فني', 'technical analysis', 'مؤشرات فنية', 'الذكاء الاصطناعي',
        'تنبيهات الأسعار', 'تحليل المشاعر', 'sentiment analysis',
      ],
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'خدمة إشارات التداول',
        description: 'إشارات تداول ذكية مدعومة بالذكاء الاصطناعي',
        provider: {
          '@type': 'Organization',
          name: 'TradeXRay AI',
        },
      },
    },
    dashboard: {
      title: 'لوحة التحكم - TradeXRay AI | تتبع محفظتك وأداؤك',
      description: 'لوحة تحكم شاملة لتتبع محفظتك، الأرباح والخسائر، سجل الصفقات، والإحصائيات المتقدمة.',
      keywords: [
        'لوحة التحكم', 'dashboard', 'تتبع المحفظة', 'portfolio tracking',
        'الأرباح والخسائر', 'P&L', 'إحصائيات التداول', 'سجل الصفقات',
      ],
    },
    admin: {
      title: 'لوحة تحكم المطور - TradeXRay AI | إدارة المنصة',
      description: 'لوحة تحكم إدارية متقدمة للمطورين والمسؤولين. إدارة المستخدمين، المحافظ، الصفقات، والصلاحيات.',
      keywords: [
        'لوحة الإدارة', 'admin panel', 'إدارة المستخدمين', 'user management',
        'إدارة المحافظ', 'wallet management', 'صلاحيات المطور',
      ],
    },
    subscriptions: {
      title: 'الاشتراكات والباقات - TradeXRay AI | اختر خطتك',
      description: 'اختر من بين باقات الاشتراك المختلفة (مجاني، Pro، Elite) والاستمتع بميزات متقدمة وأولويات دعم عالية.',
      keywords: [
        'الاشتراكات', 'subscriptions', 'باقات', 'pricing plans',
        'Pro plan', 'Elite plan', 'ميزات متقدمة', 'دعم عملاء',
      ],
    },
    settings: {
      title: 'الإعدادات - TradeXRay AI | تخصيص حسابك',
      description: 'إدارة إعدادات حسابك، التفضيلات، مفاتيح API، والإشعارات.',
      keywords: [
        'الإعدادات', 'settings', 'التفضيلات', 'preferences',
        'مفاتيح API', 'API keys', 'الإشعارات', 'notifications',
      ],
    },
  };

  const currentSEO = seoData[page] || seoData.home;
  const title = customTitle || currentSEO.title;
  const description = customDescription || currentSEO.description;
  const image = customImage || 'https://tradexray.vercel.app/og-viral-image.png';
  const keywords = [...currentSEO.keywords, ...customKeywords];

  // Comprehensive keyword list for all pages
  const allKeywords = [
    // Platform names
    'TradeXRay AI', 'TradeXRay', 'منصة تداول ذكية', 'smart trading platform',
    
    // Major exchanges (for comparison/SEO)
    'Binance', 'Bybit', 'OKX', 'Coinbase', 'Kraken', 'Kucoin',
    'Phantom', 'Solflare', 'Magic Eden', 'Raydium', 'Orca',
    
    // Trading types
    'spot trading', 'futures trading', 'margin trading', 'leverage trading',
    'تداول فوري', 'تداول العقود الآجلة', 'تداول الهامش',
    
    // Assets
    'Bitcoin', 'Ethereum', 'Solana', 'BNB', 'XRP', 'ADA', 'DOGE',
    'AVAX', 'MATIC', 'ARB', 'OP', 'BASE', 'memecoin', 'altcoin',
    'BTC', 'ETH', 'SOL', 'USDT', 'USDC',
    
    // Features
    'AI trading', 'automated trading', 'trading signals', 'price alerts',
    'technical analysis', 'market analysis', 'chart analysis',
    'multi-timeframe analysis', 'risk management', 'stop loss',
    'take profit', 'portfolio tracking', 'wallet integration',
    
    // Market-related
    'crypto market', 'cryptocurrency market', 'digital assets',
    'DeFi', 'Web3', 'blockchain', 'NFT', 'token trading',
    'coin trading', 'crypto exchange', 'DEX', 'CEX',
    
    // Performance
    '90% win rate', 'high accuracy signals', 'profitable trading',
    'crypto profits', 'trading profits', 'passive income crypto',
    
    // User actions
    'how to trade crypto', 'crypto trading guide', 'trading tutorial',
    'best trading platform', 'crypto signals free', 'trading signals bot',
    'crypto trading bot', 'automated crypto trading',
    
    // Arabic keywords
    'تداول العملات الرقمية', 'منصة تداول آمنة', 'إشارات تداول دقيقة',
    'تحليل فني متقدم', 'محفظة رقمية آمنة', 'تداول بدون رسوم',
    'أفضل منصة تداول', 'تداول آمن وموثوق', 'دعم عملاء 24/7',
  ];

  const finalKeywords = [...new Set([...keywords, ...allKeywords])].slice(0, 50).join(', ');

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={finalKeywords} />
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <meta name="language" content="en, ar" />
      <meta name="revisit-after" content="2 days" />
      <meta name="author" content="TradeXRay AI Team" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
      <meta name="theme-color" content="#00c87a" />

      {/* Canonical URL */}
      <link rel="canonical" href={`https://tradexray.vercel.app/${page === 'home' ? '' : page}`} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={`https://tradexray.vercel.app/${page === 'home' ? '' : page}`} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="TradeXRay AI" />
      <meta property="og:locale" content="en_US" />
      <meta property="og:locale:alternate" content="ar_SA" />

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@TradeXRayAI" />
      <meta name="twitter:creator" content="@TradeXRayAI" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* LinkedIn */}
      <meta property="linkedin:title" content={title} />
      <meta property="linkedin:description" content={description} />

      {/* WhatsApp */}
      <meta property="whatsapp:title" content={title} />
      <meta property="whatsapp:description" content={description} />

      {/* Instagram */}
      <meta property="instagram:title" content={title} />
      <meta property="instagram:description" content={description} />

      {/* Telegram */}
      <meta property="telegram:title" content={title} />
      <meta property="telegram:description" content={description} />

      {/* Structured Data (JSON-LD) */}
      {currentSEO.structuredData && (
        <script type="application/ld+json">{JSON.stringify(currentSEO.structuredData)}</script>
      )}

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

      {/* Apple */}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="TradeXRay AI" />

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
    </Helmet>
  );
};

export default EnhancedSEO;
