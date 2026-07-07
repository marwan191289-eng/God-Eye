# دليل النشر على Vercel لمنصة TradeXRay AI (الإصدار النهائي)

هذا الدليل يوفر تعليمات مفصلة لنشر منصة TradeXRay AI المتكاملة على Vercel، مع الأخذ في الاعتبار جميع التحسينات الأخيرة، بما في ذلك نظام التداول الشامل، ميزات الذكاء الاصطناعي، تحسينات SEO، ونظام إدارة المطور.

## 1. المتطلبات الأساسية (Prerequisites)

قبل البدء، تأكد من توفر المتطلبات التالية:

-   **حساب GitHub**: لربط مستودع الكود.
-   **حساب Vercel**: لعملية النشر والاستضافة.
-   **Node.js و npm/yarn**: مثبتة محلياً (للتطوير والاختبار المحلي).
-   **Clerk Account**: لإدارة مصادقة المستخدمين.
-   **Stripe Account**: لمعالجة المدفوعات والاشتراكات.
-   **PostgreSQL Database**: قاعدة بيانات (يمكن استخدام خدمات مثل Supabase أو Neon).
-   **MetaMask / WalletConnect**: (اختياري) لاختبار ربط المحافظ.
-   **AI API Key**: لميزات تحليل المشاعر السوقية المدعومة بالذكاء الاصطناعي.

## 2. إعداد المتغيرات البيئية (Environment Variables)

تتطلب المنصة مجموعة من المتغيرات البيئية الحساسة لتعمل بشكل صحيح. يجب إضافتها إلى مشروعك على Vercel (Settings -> Environment Variables).

| المتغير | الوصف | مثال القيمة |
|---|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | مفتاح Clerk العام للواجهة الأمامية | `pk_live_YOUR_CLERK_PUBLISHABLE_KEY` |
| `CLERK_SECRET_KEY` | مفتاح Clerk السري للواجهة الخلفية | `sk_live_YOUR_CLERK_SECRET_KEY` |
| `STRIPE_SECRET_KEY` | مفتاح Stripe السري لمعالجة الدفع | `sk_live_YOUR_STRIPE_SECRET_KEY` |
| `STRIPE_WEBHOOK_SECRET` | مفتاح الويب هوك الخاص بـ Stripe | `whsec_YOUR_STRIPE_WEBHOOK_SECRET` |
| `DATABASE_URL` | رابط اتصال قاعدة بيانات PostgreSQL | `postgresql://user:password@host:port/database` |
| `WEB3_PROVIDER_URL` | رابط مزود Web3 (مثل Infura أو Alchemy) | `https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID` |
| `DEVELOPER_ADMIN_USERNAME` | اسم مستخدم حساب المطور | `marwan191289@yahoo.com` |
| `DEVELOPER_ADMIN_PASSWORD` | كلمة مرور حساب المطور | `Aa010*+*+*` |
| `AI_API_KEY` | مفتاح API لخدمة الذكاء الاصطناعي (لتحليل المشاعر) | `YOUR_AI_SERVICE_API_KEY` |
| `TWITTER_API_KEY` | مفتاح API لتويتر (لتحليل المشاعر) | `YOUR_TWITTER_API_KEY` |
| `FACEBOOK_APP_ID` | معرف تطبيق فيسبوك (لتحسينات السوشيال ميديا) | `YOUR_FACEBOOK_APP_ID` |
| `GOOGLE_ANALYTICS_ID` | معرف تتبع Google Analytics | `UA-XXXXX-Y` |

**ملاحظة هامة**: تأكد من أن هذه المتغيرات مضبوطة بشكل صحيح لكل من بيئات التطوير (Development) والإنتاج (Production) على Vercel.

## 3. إعداد المشروع على Vercel (Vercel Project Setup)

1.  **ربط المستودع**: قم بتسجيل الدخول إلى Vercel، ثم انقر على `Add New...` -> `Project`. اختر مستودع GitHub الخاص بـ `tradexray`.
2.  **إعدادات البناء (Build Settings)**:
    *   **Framework Preset**: `Vite` (يجب أن يكتشفه Vercel تلقائياً).
    *   **Root Directory**: `artifacts/war-room` (هذا هو مجلد الواجهة الأمامية).
    *   **Build Command**: `npm run build` أو `yarn build`.
    *   **Output Directory**: `dist`.
3.  **إعدادات الوظائف (Functions Settings)**:
    *   **Root Directory**: `artifacts/api-server` (هذا هو مجلد الواجهة الخلفية).
    *   **Build Command**: `npm run build` أو `yarn build`.
    *   **Output Directory**: `dist`.
    *   **Entrypoint**: `src/index.ts` (أو حسب ملف نقطة الدخول الرئيسي للـ API).
4.  **المتغيرات البيئية**: أضف جميع المتغيرات البيئية المذكورة في القسم 2.
5.  **النشر (Deploy)**: انقر على `Deploy`. ستقوم Vercel ببناء ونشر مشروعك تلقائياً.

## 4. إعداد الـ Webhooks (Webhook Setup)

### 4.1 Stripe Webhook

لضمان تحديث حالة الاشتراكات بشكل صحيح، يجب إعداد Stripe Webhook:

1.  في لوحة تحكم Stripe، انتقل إلى `Developers` -> `Webhooks`.
2.  انقر على `Add endpoint`.
3.  أدخل رابط الـ Webhook الخاص بك على Vercel (مثال: `https://your-project-name.vercel.app/api/stripe-webhook`).
4.  اختر الأحداث التالية للاستماع إليها:
    *   `checkout.session.completed`
    *   `customer.subscription.updated`
    *   `customer.subscription.deleted`
5.  احفظ الـ Webhook وانسخ `Signing secret` الخاص به إلى متغير `STRIPE_WEBHOOK_SECRET` في Vercel.

### 4.2 Clerk Webhook

لضمان مزامنة بيانات المستخدمين مع الواجهة الخلفية:

1.  في لوحة تحكم Clerk، انتقل إلى `Webhooks`.
2.  انقر على `Add Endpoint`.
3.  أدخل رابط الـ Webhook الخاص بك على Vercel (مثال: `https://your-project-name.vercel.app/api/clerk-webhook`).
4.  اختر الأحداث المتعلقة بالمستخدمين (مثل `user.created`, `user.updated`, `user.deleted`).
5.  احفظ الـ Webhook.

## 5. إعداد قاعدة البيانات (Database Setup)

تأكد من أن قاعدة بيانات PostgreSQL الخاصة بك مستضافة وجاهزة للاستخدام. ستقوم الواجهة الخلفية (API Server) بالاتصال بها باستخدام `DATABASE_URL`.

**ملاحظة**: عند النشر لأول مرة، قد تحتاج إلى تشغيل عمليات ترحيل (migrations) لقاعدة البيانات إذا كانت الواجهة الخلفية تستخدم Drizzle ORM. يمكن القيام بذلك عبر Vercel Build Commands أو يدوياً بعد النشر.

## 6. اختبار ما بعد النشر (Post-Deployment Testing)

بعد النشر بنجاح، قم بإجراء الاختبارات التالية:

-   **الوصول إلى الواجهة الأمامية**: تأكد من أن الموقع يعمل بشكل صحيح.
-   **تسجيل الدخول/التسجيل**: اختبر جميع طرق المصادقة (Clerk).
-   **الاشتراكات والدفع**: قم بإجراء عملية اشتراك تجريبية عبر Stripe.
-   **ربط المحافظ**: اختبر ربط المحافظ الخارجية (MetaMask, WalletConnect).
-   **التداول**: قم بإجراء صفقات تجريبية (Spot, Futures).
-   **لوحة تحكم المطور**: قم بتسجيل الدخول إلى `/admin` باستخدام بيانات حساب المطور (`marwan191289@yahoo.com` / `Aa010*+*+*`) وتأكد من عمل جميع الصلاحيات.
-   **تحليلات الذكاء الاصطناعي**: تأكد من ظهور إشارات التداول وتحليلات المشاعر.
-   **SEO**: استخدم أدوات فحص SEO للتأكد من أن الميتاداتا وعلامات OpenGraph تعمل بشكل صحيح.

## 7. تحديثات المستودع (Repository Updates)

تم تحديث مستودع GitHub الخاص بك بجميع التغييرات الأخيرة، بما في ذلك:

-   **الواجهة الأمامية**: ميزات التداول، المحافظ، تحسينات UI/UX، SEO.
-   **الواجهة الخلفية**: API للتداول، المحافظ، Stripe Webhooks، Clerk Webhooks.
-   **خدمات جديدة**: `marketSentimentService.ts`, `developerPrivilegesService.ts`, `adminAuthService.ts`, `userManagementService.ts`.
-   **الوثائق**: `WHITEPAPER_AR.md`, `AUDIT_REPORT_AR.AR.md`, `ADMIN_DEVELOPER_GUIDE_AR.md`.

**لضمان أن Vercel ينشر أحدث إصدار دائمًا، تأكد من أن فرع `main` على GitHub محدث.**

## 8. نصائح إضافية (Additional Tips)

-   **المراقبة**: استخدم أدوات مراقبة Vercel و Clerk و Stripe لمراقبة أداء المنصة وأي أخطاء.
-   **النسخ الاحتياطي**: قم بإجراء نسخ احتياطي منتظم لقاعدة البيانات الخاصة بك.
-   **الأمان**: راجع سجلات الأمان بانتظام في لوحة تحكم المطور.
-   **التحديثات**: ابقَ على اطلاع دائم بأحدث إصدارات المكتبات والتبعيات لضمان الأمان والأداء.

**تهانينا! منصة TradeXRay AI جاهزة الآن للانطلاق وتحقيق الانتشار الفيروسي.** 🚀
