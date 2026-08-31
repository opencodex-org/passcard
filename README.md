# PassCard - منصة مالية رقمية متكاملة

## Digital Financial Platform

**PassCard** — كل أموالك في مكان واحد

### نظرة عامة

منصة مالية رقمية متكاملة توفر:
- إدارة الحسابات والبطاقات
- التحويلات المحلية والدولية
- سداد الفواتير
- حسابات Kids مع إشراف ولي الأمر
- نظام أمان شامل
- لوحة إدارة متقدمة

### المميزات الرئيسية

✅ تطبيق المستخدم المتكامل
✅ نظام التحقق والتسجيل
✅ إدارة البطاقات (أساسية، إضافية، افتراضية)
✅ تخصيص البطاقات برفع الصور
✅ دعم Mada و Apple Pay و Google Wallet
✅ نظام التحويلات
✅ إدارة المستفيدين
✅ سداد الفواتير
✅ حسابات Kids
✅ مستويات الحساب (Bronze/Silver/Gold/Platinum)
✅ لوحة إدارة شاملة
✅ RBAC مع 6 أدوار مختلفة
✅ Audit Log كامل
✅ دعم العربية والإنجليزية

### البنية المعمارية

```
PassCard/
├── backend/              # خادم Node.js/Express
├── mobile/              # تطبيق React Native
├── web/                 # منصة ويب React
├── admin/               # لوحة الإدارة
├── docs/                # التوثيق
└── infrastructure/      # الإعدادات والبيانات
```

### التقنيات المستخدمة

**Backend:**
- Node.js + Express.js
- MongoDB + Redis
- JWT Authentication
- Stripe/PayPal Integration
- Firebase Admin SDK

**Frontend:**
- React.js
- React Native
- TailwindCSS
- Internationalization (i18n)

**Infrastructure:**
- Docker
- Docker Compose
- GitHub Actions (CI/CD)

### التثبيت والتشغيل

```bash
# Clone the repository
git clone https://github.com/opencodex-org/PassCard.git
cd PassCard

# Setup development environment
make setup

# Start development servers
make dev
```

### الأوامر المتاحة

```bash
make setup     # إعداد بيئة التطوير
make dev       # تشغيل خوادم التطوير
make test      # تشغيل الاختبارات
make build     # البناء للإنتاج
make deploy    # النشر
make clean     # تنظيف الملفات
```

### الخدمات المتاحة

- **API**: http://localhost:3000
- **Admin Panel**: http://localhost:3001
- **Web Platform**: http://localhost:3002
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379

### التطوير

جميع الحقوق محفوظة © 2024 OpenCodex
