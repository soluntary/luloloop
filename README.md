# LudoLoop Monorepo

A comprehensive board game community platform built with modern web technologies and a scalable monorepo architecture.

## 🏗️ Architecture

This project uses a monorepo structure with multiple applications and shared packages:

### Applications
- **`apps/web`** - Main Next.js web application
- **`apps/mobile`** - React Native mobile app (Expo)
- **`apps/admin`** - Admin dashboard for content management

### Packages
- **`packages/ui`** - Shared UI components and design system
- **`packages/database`** - Database schemas and utilities (Drizzle ORM)
- **`packages/auth`** - Authentication utilities and hooks
- **`packages/shared`** - Common types, utilities, and validation schemas

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm 8+
- PostgreSQL (or Supabase)

### Installation

\`\`\`bash
# Clone the repository
git clone <repository-url>
cd ludoloop-monorepo

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run database migrations
pnpm db:migrate

# Start development servers
pnpm dev
\`\`\`

This will start:
- Web app: http://localhost:3000
- Admin dashboard: http://localhost:3001

## 📦 Package Scripts

### Root Level
- `pnpm dev` - Start all development servers
- `pnpm build` - Build all applications and packages
- `pnpm lint` - Lint all code
- `pnpm test` - Run all tests
- `pnpm type-check` - Type check all TypeScript

### Individual Apps
- `pnpm dev --filter=@ludoloop/web` - Start web app only
- `pnpm build --filter=@ludoloop/admin` - Build admin app only

## 🗄️ Database

The project uses PostgreSQL with Drizzle ORM for type-safe database operations.

### Schema Management
\`\`\`bash
# Generate migrations
pnpm db:generate

# Run migrations
pnpm db:migrate

# Open Drizzle Studio
pnpm db:studio
\`\`\`

### Key Tables
- `users` - User accounts and profiles
- `games` - Board game information
- `events` - Gaming events and meetups
- `groups` - User groups and communities
- `messages` - User messaging system

## 🔐 Authentication

Authentication is handled through Supabase Auth with the following features:
- Email/password authentication
- Social login (Google, GitHub)
- Row Level Security (RLS)
- JWT token management

## 🎨 UI Components

The design system is built with:
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **shadcn/ui** - Pre-built component library
- **Lucide React** - Icon library

### Using Components
\`\`\`tsx
import { Button, Card } from '@ludoloop/ui';

export function MyComponent() {
  return (
    <Card>
      <Button variant="primary">Click me</Button>
    </Card>
  );
}
\`\`\`

## 📱 Mobile Development

The mobile app is built with Expo and React Native:

\`\`\`bash
# Start Expo development server
cd apps/mobile
pnpm start

# Run on iOS simulator
pnpm ios

# Run on Android emulator
pnpm android
\`\`\`

## 🐳 Docker Deployment

### Development
\`\`\`bash
docker-compose up -d
\`\`\`

### Production
\`\`\`bash
# Build production image
docker build -t ludoloop-web .

# Run with environment variables
docker run -p 3000:3000 --env-file .env ludoloop-web
\`\`\`

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
\`\`\`bash
# Build for production
pnpm build

# Start production server
pnpm start
\`\`\`

## 🧪 Testing

### Unit Tests
\`\`\`bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
\`\`\`

### E2E Tests
\`\`\`bash
# Run Playwright tests
pnpm test:e2e

# Run tests in UI mode
pnpm test:e2e:ui
\`\`\`

## 📊 Monitoring & Analytics

- **Vercel Analytics** - Web vitals and performance
- **Sentry** - Error tracking and monitoring
- **PostHog** - Product analytics and feature flags

## 🔧 Development Tools

- **Turbo** - Monorepo build system
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Type safety
- **Husky** - Git hooks
- **Changesets** - Version management

## 📝 API Documentation

API documentation is available at:
- Development: http://localhost:3000/api/docs
- Production: https://your-domain.com/api/docs

### Key Endpoints
- `GET /api/games` - List board games
- `POST /api/events` - Create gaming event
- `GET /api/users/profile` - Get user profile
- `POST /api/groups` - Create user group

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run linting and tests: `pnpm lint && pnpm test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style
- Use TypeScript for all new code
- Follow the existing code style (ESLint + Prettier)
- Write tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: support@ludoloop.com
- 💬 Discord: [Join our community](https://discord.gg/ludoloop)
- 📖 Documentation: [docs.ludoloop.com](https://docs.ludoloop.com)
- 🐛 Issues: [GitHub Issues](https://github.com/ludoloop/ludoloop/issues)

## 🗺️ Roadmap

- [ ] Real-time messaging system
- [ ] Advanced event matching algorithms
- [ ] Mobile app push notifications
- [ ] Integration with BoardGameGeek API
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Marketplace for buying/selling games
- [ ] Tournament management system

---

Built with ❤️ by the LudoLoop team
