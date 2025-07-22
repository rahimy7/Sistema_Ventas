# Business Management System - Replit Guide

## Overview

This is a comprehensive business management system built with React, Express.js, and PostgreSQL. The application provides financial tracking, inventory management, and employee payroll functionality for small to medium businesses. It features a modern web interface with real-time data visualization and comprehensive CRUD operations for all business entities.

## User Preferences

Preferred communication style: Simple, everyday language.
Interface language: Spanish for all user-facing text and forms.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing with dedicated pages
- **Forms**: React Hook Form with Zod validation
- **Charts**: Chart.js for data visualization
- **Navigation**: Integrated sidebar with route-based navigation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Neon serverless connection
- **ORM**: Drizzle ORM for type-safe database operations
- **API Pattern**: RESTful API with JSON responses
- **Session Management**: Express sessions with PostgreSQL storage
- **Stock Tracking**: Automated stock movement logging system

## Key Components

### Database Schema
The system manages seven main entities:
- **Incomes**: Revenue tracking with client, product/service, quantity, and payment details
- **Expenses**: Cost management with categories, descriptions, and payment methods
- **Purchases**: Supplier purchase tracking with product details and totals
- **Inventory**: Product catalog with pricing, stock levels, and reorder points
- **Stock Movements**: Complete audit trail for all inventory changes with reasons and references
- **Employees**: Staff information with positions and status
- **Payroll Records**: Employee payment tracking with salaries, advances, and bonuses

### API Endpoints
- Dashboard statistics aggregation (`/api/dashboard/stats`)
- Full CRUD operations for all entities (`/api/[entity]`)
- Stock management endpoints (`/api/inventory/:id/adjust-stock`)
- Stock movements tracking (`/api/stock-movements`, `/api/inventory/:id/movements`)
- Inventory with movement history (`/api/inventory/:id/with-movements`)
- Specialized queries like expense categories and date-range filtering
- Real-time data synchronization with React Query

### UI Components
- **Dashboard**: KPI cards with trend indicators and interactive charts
- **Inventory Management**: Complete inventory page with product listing, stock status indicators, and movement history
- **Stock Adjustment Forms**: Intuitive forms for increasing, decreasing, or setting stock levels with reason tracking
- **Forms**: Validated input forms for all business operations
- **Tables**: Data display with sorting, filtering, and export capabilities
- **Charts**: Revenue/expense trends and categorical breakdowns
- **Sidebar Navigation**: Route-based navigation with dedicated pages for major features

## Data Flow

1. **User Input**: Forms collect business data with client-side validation
2. **API Requests**: React Query manages server communication and caching
3. **Database Operations**: Drizzle ORM handles PostgreSQL interactions
4. **Real-time Updates**: Optimistic updates with automatic cache invalidation
5. **Data Visualization**: Chart.js renders financial trends and analytics

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database
- **Connection**: WebSocket-based connection with connection pooling
- **Migration**: Drizzle Kit for schema management

### UI Framework
- **Radix UI**: Headless component primitives
- **shadcn/ui**: Pre-built component library
- **Tailwind CSS**: Utility-first styling
- **Chart.js**: Canvas-based charting library

### Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across the stack
- **ESBuild**: Production bundling for server code
- **Replit Integration**: Development environment optimization

## Deployment Strategy

### Development
- Vite development server with hot module replacement
- Express middleware integration for API routes
- Real-time error overlay for debugging
- TypeScript compilation with strict mode

### Production
- Vite builds optimized client bundle to `dist/public`
- ESBuild bundles server code to `dist/index.js`
- Static file serving from Express
- Environment-based configuration

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (required)
- `NODE_ENV`: Environment detection (development/production)
- Session configuration for authentication persistence

## Recent Changes (January 2025)

### Multi-Product Purchase System (July 2025)
- ✓ Created enhanced purchase form supporting multiple products in single transaction
- ✓ Implemented purchase header and items structure with database transactions
- ✓ Added automatic inventory management for new and existing products
- ✓ Integrated stock movement tracking for all purchase operations
- ✓ Created dual purchase interface: simple (single product) and enhanced (multiple products)
- ✓ Added inventory selection with real-time stock display
- ✓ Implemented automatic price and reorder point configuration
- ✓ Fixed API call issues using direct fetch instead of apiRequest wrapper
- ✓ Resolved purchaseItems import error in storage.ts
- ✓ Both simple and multiple purchase systems working correctly with automatic stock adjustments

### Chart.js Production Fix (July 2025)
- ✓ Fixed "line controller not registered" errors in production deployment
- ✓ Standardized all chart components to use react-chartjs-2 exclusively
- ✓ Created centralized chart setup with registerables for all Chart.js components
- ✓ Removed conflicting individual Chart.js registrations from components
- ✓ Implemented global Chart.js configuration in main.tsx entry point
- ✓ Resolved deployment errors affecting revenue and monthly profitability charts

### Enhanced Purchase Management System (July 2025)
- ✓ Improved purchase form to allow selection between existing and new products
- ✓ Added inventory integration for existing product selection with stock display
- ✓ Implemented automatic inventory creation for new products during purchase
- ✓ Added automatic stock adjustment for existing products when purchased
- ✓ Enhanced UI with product selection toggle and inventory item details
- ✓ Integrated price and sale price management for new products
- ✓ Added reorder point configuration for new inventory items

### Previous Updates - Navigation System Fix
- ✓ Fixed reports page navigation by adding missing "/reportes" path to sidebar
- ✓ Created missing monthly-report-pdf component for PDF generation
- ✓ Resolved import errors preventing reports page from loading
- ✓ Fixed database connection issues with proper Neon WebSocket configuration

## Previous Changes (January 2025)

### Enhanced Navigation System Implementation
- ✓ Added HomeButton component to all pages for direct access to dashboard
- ✓ Created comprehensive sidebar navigation with route-based highlighting
- ✓ Implemented MainLayout component with responsive mobile sidebar
- ✓ Enhanced navigation with direct home access from all views
- ✓ Redesigned dashboard with quick action buttons and activity feed
- ✓ Added professional navigation icons and consistent styling
- ✓ Implemented mobile-responsive navigation with overlay support

### Previous Updates - Inventory Management System Completion
- ✓ Created complete inventory management page (`/inventario`) with tabbed interface
- ✓ Implemented stock movements tracking with full audit trail 
- ✓ Added stock adjustment functionality with reason tracking and previews
- ✓ Enhanced database schema with `stock_movements` table for inventory history
- ✓ Integrated route-based navigation in sidebar for dedicated inventory page
- ✓ Added comprehensive stock status indicators (In Stock, Low Stock, Out of Stock)
- ✓ Implemented real-time stock statistics and alerts
- ✓ Created specialized API endpoints for stock adjustments and movement history

### Navigation Architecture Changes
- Created `MainLayout` component with integrated sidebar navigation
- Added `SidebarNavigation` component with active route highlighting
- Integrated `HomeButton` component across all pages for improved UX
- Updated App.tsx to use new layout system with proper routing
- Simplified dashboard component to focus on executive summary and quick actions
- Enhanced mobile responsiveness with collapsible sidebar and overlay

The application follows a standard full-stack architecture with clear separation between client and server concerns, type safety throughout the stack, comprehensive inventory management capabilities, and modern development practices for maintainability and scalability.