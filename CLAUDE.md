# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React-based risk management frontend application (rm-fe) built with TypeScript. The application provides trading account management, portfolio tracking, risk assessment, and reporting capabilities. It integrates with a Strapi backend for data management and uses various trading APIs.

## Development Commands

```bash
# Start development server
yarn start

# Build for production
yarn build

# Run tests
yarn test

# Build Tailwind CSS (watch mode)
yarn build:tailwind
```

## Architecture Overview

### Core Technologies
- **React 18** with TypeScript
- **React Router** for navigation with protected routes
- **TanStack Query** (React Query) for server state management
- **Tailwind CSS** with custom theme and shadcn/ui components
- **Axios** for API communication with interceptors for authentication
- **React Hook Form** with Zod validation
- **Socket.io** for real-time data

### Project Structure
- `src/components/` - React components organized by feature
  - `ui/` - Reusable UI components (shadcn/ui based)
  - `dashboard/` - Main dashboard with trading layout and strike prices
  - `account/` - Account management components
  - `risk-profile/` - Risk assessment and configuration
  - `widgets/` - Shared widget components
- `src/hooks/` - Custom React hooks including Strapi API hooks
- `src/lib/` - Utility libraries (React Query config, utils)
- `src/utils/` - Axios configuration with auth interceptors
- `src/types/` - TypeScript type definitions for Strapi entities
- `src/interfaces/` - Interface definitions for API payloads

### Authentication & Routing
- Token-based authentication stored in localStorage
- Protected routes using `ProtectedRoute` wrapper component in `App.tsx:22`
- Automatic token injection via Axios interceptors in `src/utils/axiosConfig.ts:12`
- Authentication error handling with automatic redirect to login

### API Integration
- Strapi CMS backend integration via custom hooks in `src/hooks/strapiHooks.ts`
- Comprehensive error handling with toast notifications
- React Query for caching, background updates, and optimistic updates
- Two base URLs configured: `REACT_APP_BASE_URL` and `REACT_APP_ST_BASE_URL`

### State Management
- Server state managed by TanStack Query with 60s stale time
- Local component state via React hooks
- Global providers in `src/providers.tsx` for React Query

### Styling System
- Tailwind CSS with custom configuration
- Custom gray scale palette and design tokens
- Responsive breakpoints with mobile-first approach
- CSS custom properties for theming support
- Animation utilities via tailwindcss-animate

## Key Features

### Trading Account Management
- Multi-account support with live/demo account types
- Account linking with broker accounts
- Trading credentials management
- Account status toggling

### Risk Management
- Portfolio risk assessment
- Risk settings configuration per trading account
- Real-time risk monitoring
- Strike price analysis

### Data Visualization
- Market data display with real-time updates
- Portfolio performance tracking
- P&L reporting and analysis
- Strategy performance views

## Development Patterns

### Component Architecture
- Functional components with TypeScript
- Custom hooks for business logic separation
- Compound component patterns for complex UI
- Prop drilling minimized via context where appropriate

### API Data Flow
- Custom hooks in `strapiHooks.ts` handle all API interactions
- Consistent error handling across all API calls
- Optimistic updates for better UX
- Query invalidation for data consistency

### Error Handling
- Centralized error handling via `useApiErrorHandler` hook
- Toast notifications for user feedback
- Axios interceptors for global request/response handling
- 401/403 specific handling with appropriate user actions

## Build Configuration

- **CRACO** for Create React App customization
- Path aliases configured (`@/` points to `src/`)
- PostCSS with Tailwind CSS processing
- TypeScript strict mode enabled