# Mock Interview Platform - Frontend

A modern, responsive React + TypeScript frontend for the Mock Interview Platform.

## Tech Stack

- **React** 18+ - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Axios** - HTTP client
- **Vite** - Build tool

## Project Structure

```
src/
├── components/       # Reusable React components (Button, Card, Input, etc.)
├── layouts/          # Layout components (AuthLayout, DashboardLayout, etc.)
├── pages/            # Page components (Login, Dashboard, etc.)
├── services/         # API services and utilities
├── assets/           # Static assets (images, icons, etc.)
├── App.tsx           # Main app component with routing
├── main.tsx          # Entry point
└── index.css         # Global styles and Tailwind configuration
```

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your backend API URL:
   ```
   VITE_API_URL=http://localhost:8000/api
   ```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Building

Build for production:

```bash
npm run build
```

### Pages

- **User Login** - `/login/user` - Candidate login page
- **Admin Login** - `/login/admin` - Administrator login page
- **Dashboard** - `/dashboard` - Candidate dashboard (after login)
- **Placeholder Pages**:
  - `/interview` - Interview session (coming soon)
  - `/coding-test` - Coding test (coming soon)
  - `/history` - Interview history (coming soon)

## Authentication Flow

1. User visits `/login/user` or `/login/admin`
2. Enters credentials
3. Frontend calls `POST /api/auth/login`
4. Backend returns JWT token and user info
5. Token stored in `localStorage`
6. User redirected to dashboard

## Components

### Button
Reusable button component with primary/secondary variants
```tsx
<Button variant="primary">Sign In</Button>
```

### Card
Container component for content sections
```tsx
<Card>Content here</Card>
```

### Input
Form input component with label and error handling
```tsx
<Input label="Email" type="email" placeholder="you@example.com" />
```

## API Integration

All API calls are made through the `authService` in `src/services/auth.ts`

```tsx
const response = await authService.login(email, password);
localStorage.setItem('accessToken', response.data.access_token);
```

## Environment Variables

- `VITE_API_URL` - Backend API URL (default: http://localhost:8000/api)

## Contributing

Follow these guidelines:
- Use TypeScript for type safety
- Create reusable components
- Add proper comments and documentation
- Follow the existing code structure
- Use Tailwind CSS for styling (no custom CSS unless necessary)

## Notes

- All authentication endpoints require a running backend
- JWT token is stored in localStorage and sent with every API request
- Role-based routing is enforced (admin vs candidate)
