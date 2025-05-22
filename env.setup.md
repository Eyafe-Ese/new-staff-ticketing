# Environment Setup

Create a file named `.env.local` in the root of your project with the following content:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api

# Auth Configuration
NEXT_PUBLIC_AUTH_ENABLED=true

# Feature Flags
NEXT_PUBLIC_FEATURE_CATEGORIES=true
NEXT_PUBLIC_FEATURE_USERS=true

# Application Settings
NEXT_PUBLIC_APP_NAME=RG Admin
```

## Usage in Code

These environment variables are already set up to be used in the codebase:

- In `utils/api.ts`, the `NEXT_PUBLIC_API_BASE_URL` is used to configure the Axios instance:
  ```javascript
  const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  ```

## Development vs Production

- For development: Use `.env.local` or `.env.development`
- For production: Use `.env.production`

## Important Notes

1. Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser (client-side).
2. For sensitive information that should only be available server-side, remove the `NEXT_PUBLIC_` prefix.
3. After changing environment variables, you may need to restart the development server. 