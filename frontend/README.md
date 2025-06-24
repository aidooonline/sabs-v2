# Sabs v2 Frontend

## Overview

The Sabs v2 frontend is a Next.js 14 application built with TypeScript, Tailwind CSS, and Redux Toolkit. It provides a modern, responsive user interface for the micro-finance platform following atomic design principles.

## Tech Stack

- **Framework**: Next.js 14.x with App Router
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 3.x
- **State Management**: Redux Toolkit
- **Server State**: TanStack Query (React Query)
- **HTTP Client**: Axios
- **Testing**: Jest + React Testing Library + Playwright
- **Linting**: ESLint + Prettier

## Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Atomic Design Structure
│   ├── atoms/            # Basic UI elements (Button, Input, etc.)
│   ├── molecules/        # Component combinations
│   └── organisms/        # Complex components
├── services/             # API interaction layer
│   ├── apiClient.ts      # Centralized Axios instance
│   └── types/           # TypeScript interfaces
├── store/               # Redux Toolkit setup
│   ├── index.ts         # Store configuration
│   └── slices/          # Redux slices
├── hooks/               # Custom React hooks
├── utils/               # Utility functions
├── styles/              # Additional styles
├── __tests__/           # Unit tests
└── e2e/                # End-to-end tests
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

From the monorepo root:

```bash
# Install all dependencies
npm install

# Start frontend development server
npm run dev:frontend
```

Or from the frontend directory:

```bash
cd frontend
npm install
npm run dev
```

The application will be available at `http://localhost:3000`.

### Available Scripts

#### Development
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
```

#### Code Quality
```bash
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting
```

#### Testing
```bash
npm run test             # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
npm run test:e2e         # Run end-to-end tests
npm run test:e2e:ui      # Run E2E tests with UI
```

## Development Guidelines

### Component Structure

Follow the Atomic Design pattern:

- **Atoms**: Basic UI elements (Button, Input, Label)
- **Molecules**: Combinations of atoms (SearchBox, FormField)
- **Organisms**: Complex components (Header, Sidebar, DataTable)

### State Management

- **Local State**: Use React hooks (useState, useReducer)
- **Global State**: Use Redux Toolkit for app-wide state
- **Server State**: Use TanStack Query for data fetching and caching

### API Integration

All API calls should go through the centralized `apiClient`:

```typescript
import { apiClient } from '@/services/apiClient';

const fetchUsers = async () => {
  return apiClient.get<User[]>('/users');
};
```

### Styling Guidelines

- Use Tailwind CSS utility classes
- Define custom design tokens in `tailwind.config.js`
- Use the predefined component classes in `globals.css`

### Testing Strategy

- **Unit Tests**: Test individual components and utilities
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test critical user flows

## Environment Variables

Create a `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Deployment

### Production Build

```bash
npm run build
```

### Docker

Build and run with Docker:

```bash
# Build image
docker build -t sabs-v2-frontend .

# Run container
docker run -p 3000:3000 sabs-v2-frontend
```

## Architecture Decisions

### Why Next.js 14 with App Router?
- Server-side rendering for better SEO and performance
- File-based routing for better organization
- Built-in optimization features

### Why Redux Toolkit?
- Predictable state management
- DevTools integration
- Simplified Redux boilerplate

### Why Tailwind CSS?
- Utility-first approach for rapid development
- Consistent design system
- Small bundle size with purging

### Why TanStack Query?
- Powerful data fetching and caching
- Background updates and synchronization
- Optimistic updates support

## Performance Considerations

- Images are optimized using Next.js Image component
- Code splitting is handled automatically by Next.js
- Tailwind CSS is purged in production builds
- Bundle analysis available with `npm run build`

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Follow the established code style (ESLint + Prettier)
2. Write tests for new features
3. Update documentation as needed
4. Follow the atomic design pattern for components

## Related Documentation

- [Project Architecture](../docs/architecture.md)
- [API Documentation](../docs/api.md)
- [Design System](../docs/design-system.md)