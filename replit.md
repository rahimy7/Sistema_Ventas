# Business Management System - Replit Guide

## Overview

This is a comprehensive business management system built with React, Express.js, and PostgreSQL. The application provides financial tracking, inventory management, and employee payroll functionality for small to medium businesses. It features a modern web interface with real-time data visualization and comprehensive CRUD operations for all business entities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation
- **Charts**: Chart.js for data visualization

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Neon serverless connection
- **ORM**: Drizzle ORM for type-safe database operations
- **API Pattern**: RESTful API with JSON responses
- **Session Management**: Express sessions with PostgreSQL storage

## Key Components

### Database Schema
The system manages six main entities:
- **Incomes**: Revenue tracking with client, product/service, quantity, and payment details
- **Expenses**: Cost management with categories, descriptions, and payment methods
- **Purchases**: Supplier purchase tracking with product details and totals
- **Inventory**: Product catalog with pricing, stock levels, and reorder points
- **Employees**: Staff information with positions and status
- **Payroll Records**: Employee payment tracking with salaries, advances, and bonuses

### API Endpoints
- Dashboard statistics aggregation (`/api/dashboard/stats`)
- Full CRUD operations for all entities (`/api/[entity]`)
- Specialized queries like expense categories and date-range filtering
- Real-time data synchronization with React Query

### UI Components
- **Dashboard**: KPI cards with trend indicators and interactive charts
- **Forms**: Validated input forms for all business operations
- **Tables**: Data display with sorting, filtering, and export capabilities
- **Charts**: Revenue/expense trends and categorical breakdowns
- **Sidebar Navigation**: Section-based routing with visual indicators

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

The application follows a standard full-stack architecture with clear separation between client and server concerns, type safety throughout the stack, and modern development practices for maintainability and scalability.