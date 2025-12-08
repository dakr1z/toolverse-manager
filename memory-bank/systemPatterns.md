# System Patterns

## Architecture
The application follows a standard Single Page Application (SPA) architecture using React. It relies heavily on client-side state and browser storage.

```mermaid
flowchart TD
    User[User] --> UI[React UI]
    UI --> AppState[App.tsx State]
    
    subgraph Services
        Storage[storageService]
        Firebase[firebaseService]
        Gemini[geminiService]
    end
    
    AppState --> Storage
    AppState --> Firebase
    AppState --> Gemini
    
    Storage --> LocalStore[LocalStorage]
    Firebase --> CloudStore[Firebase Firestore]
    Gemini --> AI[Google Gemini API]
```

## Key Technical Decisions

### 1. Offline-First Data Strategy
- **Decision**: Primary data source is `LocalStorage`.
- **Reason**: Ensures the app works instantly and without internet. Privacy by default.
- **Pattern**: `storageService.ts` abstracts `localStorage` calls. `App.tsx` loads data on mount and saves on change.

### 2. Centralized State (App.tsx)
- **Decision**: Managing global state (`tools`, `workflows`, `user`, `settings`) in the root `App` component.
- **Reason**: Simplifies prop drilling for a medium-sized app.
- **Trade-off**: `App.tsx` is large and handles many concerns (routing, auth, sync). This is a known refactoring candidate.

### 3. Manual Cloud Sync
- **Decision**: Cloud sync is triggered manually (Upload/Download) rather than real-time.
- **Reason**: Simplifies conflict resolution and gives user explicit control over when data leaves the device.
- **Implementation**: Full state object is serialized and pushed to a Firestore document keyed by User ID.

### 4. Security Layer
- **Decision**: Application-level PIN lock.
- **Implementation**: A simple boolean flag `isLocked` in `App.tsx` conditionally renders the `LockScreen` component before the main app interface.

## Component Structure
- **Pages**: `Dashboard`, `ToolLibrary`, `SubscriptionManager`, `WorkflowBuilder`. Handle specific feature views.
- **Components**: `Sidebar` (Navigation), `ToolForm` (Modal for editing), `ToolCard`.
- **Services**: Encapsulate external API logic.

## Data Models (from types.ts)
- **Tool**: Core entity. Contains pricing, status, links.
- **Workflow**: Composed of Steps.
- **WorkflowStep**: Links to Tools with specific `WorkflowToolConfig` (quantity/usage).
