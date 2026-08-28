# PassCard

PassCard is a digital card platform for creating, managing, reviewing, and customizing digital cards.

## Project Status

Early development.

## Main Features

- Google authentication
- Email authentication
- Phone verification with OTP
- CAPTCHA protection
- User profiles
- Identity verification workflow
- Digital card creation
- Card customization
- Admin review and approval
- Multiple card levels
- Kids accounts
- Parental controls
- Internal wallet ledger
- Rewards
- Developer portal
- API keys
- Webhooks
- Sandbox payments
- Support tickets
- Notifications
- Audit logs
- Role-based access control

## Card Levels

1. Basic Card
2. Standard Card
3. Advanced Card
4. Premium Card
5. Elite Card
6. Ultra Elite Card
7. MAX Card

## Technology

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend

- NestJS
- TypeScript
- Prisma

### Database

- PostgreSQL

### Infrastructure

- Docker
- Redis
- GitHub Actions

## Security

PassCard is designed with security in mind.

The project must:

- Never store real card numbers.
- Never store CVV or PIN data.
- Never place API keys or passwords in source control.
- Use environment variables for secrets.
- Use secure authentication.
- Apply rate limiting.
- Apply input validation.
- Maintain audit logs.
- Protect children's data.
- Use role-based permissions.

## Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
