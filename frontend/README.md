# SecondBrain Frontend

Angular 18 frontend application for SecondBrain - AI-Powered Knowledge Decay Detector.

## Features

- User authentication (register, login, logout)
- Protected dashboard with user stats
- JWT token management
- Material Design UI
- Standalone components architecture
- Reactive forms with validation
- HTTP interceptors for auth and error handling

## Prerequisites

- Node.js 20+
- npm 10+

## Installation

```bash
# Install dependencies
npm install
```

## Development Server

```bash
# Start development server
npm start

# Or using Angular CLI
ng serve
```

Navigate to `http://localhost:4200/`. The application will automatically reload when you make changes to the source files.

## Build

```bash
# Production build
npm run build

# The build artifacts will be stored in the `dist/` directory
```

## Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── guards/              # Route guards
│   │   ├── interceptors/        # HTTP interceptors
│   │   ├── services/            # Core services
│   │   └── models/              # TypeScript interfaces
│   ├── features/
│   │   ├── auth/                # Authentication components
│   │   └── dashboard/           # Dashboard component
│   ├── shared/
│   │   └── components/          # Shared components
│   ├── app.routes.ts            # Application routing
│   ├── app.config.ts            # Application configuration
│   └── app.component.ts         # Root component
├── environments/                # Environment configurations
└── styles.scss                  # Global styles
```

## Configuration

Update the API URL in `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',  // Your backend URL
  wsUrl: 'http://localhost:3000',
};
```

## Authentication Flow

1. User registers or logs in
2. Backend returns JWT token
3. Token stored in localStorage
4. Auth interceptor automatically attaches token to all HTTP requests
5. Error interceptor handles 401 errors and redirects to login
6. Auth guard protects routes that require authentication

## Tech Stack

- **Angular 18** - Web framework
- **TypeScript** - Programming language
- **Angular Material** - UI components
- **RxJS** - Reactive programming
- **Standalone Components** - Modern Angular architecture
- **Functional Guards/Interceptors** - Latest Angular patterns

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run watch` - Build in watch mode
- `npm test` - Run unit tests

## Notes

- This project uses Angular 18+ standalone components (no NgModules)
- Functional guards (`CanActivateFn`) instead of class-based guards
- Functional HTTP interceptors (`HttpInterceptorFn`)
- BehaviorSubject for reactive state management
- Material Design theming with custom styles

## Next Steps (Week 2)

- Concept CRUD components
- Concept list with filtering
- Tag management
- Search functionality
- File upload for sources
