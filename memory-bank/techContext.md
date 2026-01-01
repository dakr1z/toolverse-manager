# Tech Context

## Development Stack
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS, PostCSS, Autoprefixer
- **Icons**: Lucide React
- **Charts**: Recharts

## External Services
- **Firebase**:
  - Authentication (Google Sign-In)
  - Firestore (Cloud Data Storage)
  - *Note*: Config is dynamic, user can provide their own keys.
- **Google Gemini**:
  - ` @google/genai` SDK (v1.1.0+).
  - Uses `gemini-2.5-flash` model via Beta API.
  - Uses dynamic API Key from user settings.

## Development Environment
- **Node.js**: Required for local dev.
- **Commands**:
  - `npm run dev`: Start local server.
  - `npm run build`: Production build.
  - `npm run preview`: Preview build.

## Project Structure
```
/
├── components/       # Reusable UI components
├── pages/            # Main application views
├── services/         # API & Storage logic
├── workflows/        # CI/CD (GitHub Actions)
├── App.tsx           # Main Entry & State
├── types.ts          # TS Interfaces
├── vite.config.ts    # Vite Configuration
└── package.json      # Dependencies
```

## Configuration
- **Environment Variables**: Managed via `.env.local` (e.g., Gemini Key).
- **Firebase Config**: Stored in `localStorage` (`toolverse_firebase_config`) to allow user-specific backends without code changes.
