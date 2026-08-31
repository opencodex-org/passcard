# PassCard Project Structure

## 📁 Root Directory Structure

```
PassCard/
├── backend/                 # Node.js + Express Backend API
│   ├── src/
│   │   ├── models/         # MongoDB Schemas
│   │   ├── routes/         # API Routes
│   │   ├── controllers/    # Business Logic
│   │   ├── middleware/     # Express Middleware
│   │   ├── services/       # External Services Integration
│   │   ├── utils/          # Utility Functions
│   │   └── index.js        # Entry Point
│   ├── tests/              # Unit & Integration Tests
│   ├── scripts/            # Seed & Migration Scripts
│   ├── Dockerfile
│   └── package.json
│
├── web/                     # React Web Platform
│   ├── src/
│   │   ├── pages/          # Page Components
│   │   ├── components/     # Reusable Components
│   │   ├── layouts/        # Layout Components
│   │   ├── hooks/          # Custom Hooks
│   │   ├── services/       # API Services
│   │   ├── store/          # State Management (Zustand)
│   │   ├── styles/         # TailwindCSS
│   │   ├── i18n/           # Internationalization
│   │   └── App.js
│   ├── public/
│   ├── Dockerfile
│   └── package.json
│
├── admin/                   # React Admin Dashboard
│   ├── src/
│   │   ├── pages/          # Admin Pages
│   │   ├── components/     # Admin Components
│   │   ├── layouts/        # Admin Layouts
│   │   ├── services/       # API Services
│   │   ├── store/          # State Management
│   │   └── App.js
│   ├── public/
│   ├── Dockerfile
│   └── package.json
│
├── mobile/                  # React Native Mobile App
│   ├── src/
│   │   ├── screens/        # Screen Components
│   │   ├── components/     # UI Components
│   │   ├── navigation/     # Navigation Config
│   │   ├── services/       # API Services
│   │   └── App.js
│   └── package.json
│
├── docs/                    # Documentation
│   ├── ARCHITECTURE.md      # System Architecture
│   ├── API_SPECIFICATION.md # API Documentation
│   ├── INSTALLATION.md      # Installation Guide
│   └── PROJECT_STRUCTURE.md # This File
│
├── infrastructure/          # Infrastructure & Config
│   ├── kubernetes/          # K8s Configurations
│   ├── terraform/           # Infrastructure as Code
│   └── nginx/               # Nginx Configurations
│
├── docker-compose.yml       # Docker Compose Config
├── Makefile                 # Development Commands
├── .env.example            # Environment Template
├── .gitignore              # Git Ignore
└── README.md               # Project Overview
```

## 🗄️ Backend Structure Details

### Models (src/models/)
- `User.js` - User account
- `Account.js` - Financial account
- `Card.js` - Card information
- `Transfer.js` - Transfer transactions
- `Transaction.js` - All transactions
- `Beneficiary.js` - Transfer recipients
- `VerificationRequest.js` - KYC requests
- `AuditLog.js` - Admin action logs
- `Design.js` - Card designs
- `AccountLevel.js` - Account tiers

### Routes (src/routes/)
- `auth.js` - Authentication endpoints
- `users.js` - User management
- `cards.js` - Card operations
- `transfers.js` - Transfer endpoints
- `transactions.js` - Transaction history
- `beneficiaries.js` - Beneficiary management
- `admin.js` - Admin operations
- `notifications.js` - Notification endpoints

### Services (src/services/)
- `StripeService.js` - Payment processing
- `MadaService.js` - Mada payment network
- `ApplePayService.js` - Apple Pay integration
- `GooglePayService.js` - Google Wallet
- `EmailService.js` - Email notifications
- `SMSService.js` - SMS notifications (Twilio)
- `FileUploadService.js` - Image uploads
- `AuthService.js` - Authentication logic

### Middleware (src/middleware/)
- `auth.js` - JWT verification
- `errorHandler.js` - Error handling
- `validator.js` - Input validation
- `logger.js` - Request logging
- `rateLimit.js` - Rate limiting
- `rbac.js` - Role-based access control

## 🎨 Frontend Structure Details

### Web Pages (web/src/pages/)
- `Home.js` - Dashboard
- `Login.js` - Login page
- `Register.js` - Registration
- `Cards.js` - Card management
- `Transfers.js` - Money transfers
- `Transactions.js` - Transaction history
- `Profile.js` - User profile
- `Settings.js` - Settings page

### Admin Pages (admin/src/pages/)
- `Dashboard.js` - Admin dashboard
- `Users.js` - User management
- `VerificationRequests.js` - KYC requests
- `Cards.js` - Card management
- `Transfers.js` - Transfer monitoring
- `Reports.js` - Analytics & reports
- `AuditLog.js` - Activity logs
- `Settings.js` - Admin settings

## 🔒 Security Structure

```
src/
├── security/
│   ├── encryption.js    # Data encryption
│   ├── hashing.js       # Password hashing
│   ├── validation.js    # Input validation
│   └── sanitization.js  # XSS protection
└── middleware/
    ├── cors.js          # CORS headers
    ├── helmet.js        # Security headers
    └── rateLimit.js     # Rate limiting
```

## 📊 Database Structure

### Collections Overview

**Users Collection**
- ID
- Phone Number
- Email
- Full Name
- National ID
- Account Type
- Account Level
- Verification Status
- Created At

**Accounts Collection**
- User ID (Reference)
- Balance
- Account Limits
- Parent Info (for Kids)
- Status
- Created At

**Cards Collection**
- Account ID (Reference)
- Card Number (Encrypted)
- Card Type
- Design
- Status
- Balance
- Expiry Date

**Transfers Collection**
- Sender ID
- Receiver ID
- Amount
- Currency
- Status
- Timestamp

**Beneficiaries Collection**
- User ID
- Recipient Name
- Account Number
- Bank
- Status

**VerificationRequests Collection**
- User ID
- Documents
- Status
- Approver ID
- Comments
- Submitted At

**AuditLog Collection**
- Admin ID
- Action
- Target ID
- Details
- IP Address
- Timestamp

## 🔄 Data Flow

### User Registration Flow
```
1. User Registration
   ↓
2. Phone Verification
   ↓
3. ID Document Upload
   ↓
4. Create Verification Request
   ↓
5. Admin Review
   ↓
6. Approve/Reject
   ↓
7. Account Activation
```

### Transfer Flow
```
1. User Initiates Transfer
   ↓
2. Validate Amount & Beneficiary
   ↓
3. Generate OTP
   ↓
4. Verify OTP
   ↓
5. Process Transfer (via Stripe/Mada)
   ↓
6. Update Balances
   ↓
7. Send Notifications
   ↓
8. Log Transaction
```

## 🚀 Deployment Structure

### Docker Services
- MongoDB Container
- Redis Container
- API Container
- Admin Panel Container
- Web Platform Container

### Environment Tiers
- Development (docker-compose)
- Staging (Kubernetes)
- Production (Kubernetes + LoadBalancer)
