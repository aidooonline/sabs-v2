# Story 1.2: Implement Defined Directory Structure - Sabs v2 Frontend

## 📋 Story Overview

**Epic**: Phase 1 - Project Setup & Core Services  
**Story ID**: FRONTEND-1.2  
**Story Title**: Implement Defined Directory Structure  
**Story Points**: 3  
**Priority**: High  
**Status**: Ready for Development

---

## 👤 User Story

**As a** Frontend Developer  
**I want to** implement the comprehensive directory structure following Atomic Design principles  
**So that** the codebase is organized, scalable, and maintainable according to the architecture specifications

---

## 🎯 Acceptance Criteria

### ✅ **AC 1: Atomic Design Component Structure**
- [ ] Create `components/atoms/` directory with base UI elements
- [ ] Create `components/molecules/` directory for component combinations
- [ ] Create `components/organisms/` directory for complex components
- [ ] Set up proper TypeScript interfaces for each component level
- [ ] Create index files for clean imports

### ✅ **AC 2: Services Layer Implementation**
- [ ] Create `services/` directory for API interaction layer
- [ ] Set up `services/types/` for TypeScript interfaces
- [ ] Create feature-based service organization structure
- [ ] Implement proper error handling types
- [ ] Set up API response type definitions

### ✅ **AC 3: State Management Structure**
- [ ] Create `store/` directory for Redux Toolkit setup
- [ ] Set up `store/slices/` directory for feature slices
- [ ] Create `hooks/` directory for custom React hooks
- [ ] Implement proper type definitions for store
- [ ] Set up middleware configuration structure

### ✅ **AC 4: Utility and Configuration Files**
- [ ] Create `utils/` directory for helper functions
- [ ] Set up `styles/` directory for global styles and Tailwind config
- [ ] Create `__tests__/` directory with proper test organization
- [ ] Set up `constants/` directory for application constants
- [ ] Create `lib/` directory for third-party integrations

### ✅ **AC 5: Route and Layout Structure**
- [ ] Organize App Router structure with proper route groups
- [ ] Create layout components in appropriate directories
- [ ] Set up protected route structure
- [ ] Implement proper error boundaries structure
- [ ] Create loading and not-found page templates

---

## 🏗️ Technical Implementation Guidelines

### **Complete Directory Structure**

```
frontend/
├── app/                           # Next.js App Router
│   ├── (auth)/                   # Authentication route group
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── customers/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── transactions/
│   │   │   └── page.tsx
│   │   ├── users/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── api/                      # API routes (if needed)
│   ├── globals.css
│   ├── layout.tsx               # Root layout
│   ├── loading.tsx              # Global loading UI
│   ├── error.tsx                # Global error UI
│   ├── not-found.tsx            # 404 page
│   └── page.tsx                 # Home page
├── components/                   # Atomic Design Structure
│   ├── atoms/                   # Basic UI elements
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   └── index.ts
│   │   ├── Input/
│   │   │   ├── Input.tsx
│   │   │   ├── Input.test.tsx
│   │   │   └── index.ts
│   │   ├── Card/
│   │   │   ├── Card.tsx
│   │   │   ├── Card.test.tsx
│   │   │   └── index.ts
│   │   └── index.ts             # Barrel exports
│   ├── molecules/               # Component combinations
│   │   ├── SearchBar/
│   │   │   ├── SearchBar.tsx
│   │   │   ├── SearchBar.test.tsx
│   │   │   └── index.ts
│   │   ├── FormField/
│   │   │   ├── FormField.tsx
│   │   │   ├── FormField.test.tsx
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── organisms/               # Complex components
│   │   ├── Header/
│   │   │   ├── Header.tsx
│   │   │   ├── Header.test.tsx
│   │   │   └── index.ts
│   │   ├── BottomTabBar/
│   │   │   ├── BottomTabBar.tsx
│   │   │   ├── BottomTabBar.test.tsx
│   │   │   └── index.ts
│   │   ├── CustomerList/
│   │   │   ├── CustomerList.tsx
│   │   │   ├── CustomerList.test.tsx
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── templates/               # Page-level templates
│   │   ├── DashboardTemplate/
│   │   │   ├── DashboardTemplate.tsx
│   │   │   └── index.ts
│   │   └── index.ts
│   └── ui/                      # Shared UI components
│       ├── Modal/
│       ├── Dialog/
│       ├── Toast/
│       └── index.ts
├── services/                    # API interaction layer
│   ├── api/
│   │   ├── customerService.ts
│   │   ├── userService.ts
│   │   ├── transactionService.ts
│   │   ├── authService.ts
│   │   └── index.ts
│   ├── types/                   # TypeScript interfaces
│   │   ├── api.types.ts
│   │   ├── customer.types.ts
│   │   ├── user.types.ts
│   │   ├── transaction.types.ts
│   │   ├── auth.types.ts
│   │   └── index.ts
│   ├── apiClient.ts            # Centralized Axios instance
│   └── index.ts
├── store/                      # Redux Toolkit setup
│   ├── slices/
│   │   ├── authSlice.ts
│   │   ├── userSlice.ts
│   │   ├── customerSlice.ts
│   │   └── index.ts
│   ├── middleware/
│   │   ├── apiMiddleware.ts
│   │   └── index.ts
│   ├── types/
│   │   ├── store.types.ts
│   │   └── index.ts
│   ├── index.ts                # Store configuration
│   └── provider.tsx            # Redux Provider component
├── hooks/                      # Custom React hooks
│   ├── useAuth.ts
│   ├── useCustomers.ts
│   ├── useLocalStorage.ts
│   ├── useDebounce.ts
│   └── index.ts
├── utils/                      # Utility functions
│   ├── formatters/
│   │   ├── currency.ts
│   │   ├── date.ts
│   │   └── index.ts
│   ├── validators/
│   │   ├── forms.ts
│   │   ├── api.ts
│   │   └── index.ts
│   ├── constants.ts
│   ├── helpers.ts
│   └── index.ts
├── styles/                     # Global styles and Tailwind
│   ├── globals.css
│   ├── components.css
│   └── tailwind.css
├── lib/                        # Third-party integrations
│   ├── queryClient.ts          # TanStack Query setup
│   ├── axios.ts                # Axios configuration
│   └── utils.ts                # Utility functions
├── constants/                  # Application constants
│   ├── routes.ts
│   ├── api.ts
│   ├── ui.ts
│   └── index.ts
├── __tests__/                  # Test files
│   ├── __mocks__/
│   │   ├── axios.ts
│   │   └── next-router.ts
│   ├── utils/
│   │   ├── test-utils.tsx
│   │   └── setup.ts
│   └── fixtures/
│       ├── customers.ts
│       └── users.ts
├── public/                     # Static assets
│   ├── icons/
│   ├── images/
│   └── favicon.ico
├── docs/                       # Component documentation
│   └── components/
│       ├── atoms.md
│       ├── molecules.md
│       └── organisms.md
├── .env.local                  # Environment variables
├── .env.example                # Environment template
├── next.config.js              # Next.js configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
├── jest.config.js              # Jest configuration
├── playwright.config.ts        # Playwright configuration
├── .eslintrc.json             # ESLint configuration
├── .prettierrc                 # Prettier configuration
├── package.json                # Package configuration
└── README.md                   # Frontend documentation
```

### **Index File Templates**

#### **Component Index Files**
```typescript
// components/atoms/index.ts
export { Button } from './Button';
export { Input } from './Input';
export { Card } from './Card';
export type { ButtonProps, InputProps, CardProps } from './types';
```

#### **Service Index Files**
```typescript
// services/index.ts
export * from './api';
export * from './types';
export { apiClient } from './apiClient';
```

#### **Type Definition Structure**
```typescript
// services/types/api.types.ts
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, any>;
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

---

## 📝 Implementation Tasks

### **Phase 1: Core Structure Setup**
- [ ] Create all directory structures as specified
- [ ] Set up index files for barrel exports
- [ ] Create basic TypeScript interfaces
- [ ] Set up proper import/export patterns

### **Phase 2: Component Organization**
- [ ] Create component directories with proper structure
- [ ] Set up test file templates for each component
- [ ] Implement TypeScript prop interfaces
- [ ] Create documentation templates

### **Phase 3: Service Layer Structure**
- [ ] Organize API services by feature
- [ ] Set up comprehensive type definitions
- [ ] Create error handling structures
- [ ] Implement service interfaces

### **Phase 4: State Management Organization**
- [ ] Create Redux slice templates
- [ ] Set up custom hooks structure
- [ ] Implement middleware organization
- [ ] Create store type definitions

---

## 🧪 Testing Structure

### **Test Organization**
```
__tests__/
├── __mocks__/          # Mock implementations
├── utils/              # Test utilities
├── fixtures/           # Test data
└── components/         # Component tests (mirrors component structure)
    ├── atoms/
    ├── molecules/
    └── organisms/
```

### **Test Utilities Setup**
```typescript
// __tests__/utils/test-utils.tsx
import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from '@/store';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </Provider>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

---

## 📊 Definition of Done

### **Structure Requirements**
- [ ] All directories created with proper naming conventions
- [ ] Index files set up for clean imports
- [ ] TypeScript interfaces defined for all major types
- [ ] Barrel exports working correctly
- [ ] No circular dependencies

### **Organization Requirements**
- [ ] Components organized by Atomic Design principles
- [ ] Services organized by feature domains
- [ ] Proper separation of concerns
- [ ] Consistent file naming patterns
- [ ] Clear import/export patterns

### **Documentation Requirements**
- [ ] README.md updated with directory structure explanation
- [ ] Component documentation templates created
- [ ] Architecture decision records for structure choices
- [ ] Import/export guidelines documented

### **Quality Requirements**
- [ ] ESLint passes with no errors
- [ ] TypeScript compilation successful
- [ ] All index files properly export components/functions
- [ ] No unused files or directories
- [ ] Proper git ignore patterns for generated files

---

## 🔗 Dependencies

**Previous Stories:**
- ✅ Story 1.1: Initialize Next.js Project

**Next Stories:**
- Story 1.3: Configure Global State (Redux) with sessionSlice
- Story 1.4: Implement Central API Client (Axios)

---

## 📈 Success Metrics

- [ ] **Import Performance**: All imports resolve in <100ms
- [ ] **Build Performance**: TypeScript compilation with no errors
- [ ] **Developer Experience**: Clear and intuitive file organization
- [ ] **Scalability**: Easy to add new components/services
- [ ] **Maintainability**: Clear separation of concerns

---

**Story Status**: ✅ **READY FOR DEVELOPMENT**

*This story establishes the comprehensive directory structure that will support the entire Sabs v2 frontend development, ensuring scalability, maintainability, and clear organization following industry best practices.*