npm # Settings Store

This document explains how to use the Settings Store for managing user preferences, including theme settings.

## Overview

The Settings Store is built using Zustand and provides a centralized way to manage user settings with automatic backend synchronization.

## Features

- **Theme Management**: Light/Dark theme switching with backend sync
- **Optimistic Updates**: UI updates immediately, reverts on API failure
- **Local Storage**: Automatic localStorage synchronization
- **Error Handling**: Toast notifications for success/error states
- **Loading States**: Built-in loading indicators

## Usage

### Using the Hook

```typescript
import { useSettings } from '../hooks/useSettings';

const MyComponent = () => {
  const { 
    theme, 
    isLoading, 
    error, 
    setTheme, 
    toggleTheme 
  } = useSettings();

  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={toggleTheme} disabled={isLoading}>
        {isLoading ? 'Updating...' : 'Toggle Theme'}
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
};
```

### Using the Store Directly

```typescript
import { useSettingsStore } from '../store/useSettingsStore';

const MyComponent = () => {
  const theme = useSettingsStore.use.settings().theme;
  const setTheme = useSettingsStore.use.setTheme();
  
  const handleThemeChange = async () => {
    await setTheme('dark');
  };

  return (
    <button onClick={handleThemeChange}>
      Switch to Dark Theme
    </button>
  );
};
```

## API Endpoints

The store expects the following backend endpoints:

### GET /user/settings
Fetch user settings from the backend.

**Response:**
```json
{
  "theme": "light" | "dark"
}
```

### PATCH /user/settings
Update user settings on the backend.

**Request Body:**
```json
{
  "theme": "light" | "dark"
}
```

## Store Structure

### State
- `settings`: User settings object containing theme and other preferences
- `isLoading`: Boolean indicating if an API request is in progress
- `error`: Error message string or null
- `isInitialized`: Boolean indicating if settings have been loaded

### Actions
- `setTheme(theme)`: Update theme with backend sync
- `updateThemeLocally(theme)`: Update theme locally only (no API call)
- `fetchSettings()`: Fetch settings from backend
- `updateSettings(settings)`: Update multiple settings
- `initialize()`: Initialize the store (fetch settings if not already done)

## Components

### ThemeToggle Component

A ready-to-use theme toggle button:

```typescript
import { ThemeToggle } from '../components/ui/ThemeToggle';

const Header = () => {
  return (
    <div className="header">
      <ThemeToggle 
        size="md" 
        showLabel={true} 
        className="ml-auto" 
      />
    </div>
  );
};
```

## Error Handling

The store automatically handles errors and provides user feedback:

- **Success**: Shows success toast when theme is updated
- **Error**: Shows error toast and reverts changes
- **Network Issues**: Gracefully handles API failures
- **Optimistic Updates**: UI updates immediately, reverts on failure

## Local Storage

The store automatically syncs with localStorage:

- Theme preference is saved to `localStorage.getItem('theme')`
- Changes trigger storage events for cross-tab synchronization
- Fallback to 'light' theme if localStorage is unavailable

## Best Practices

1. **Use the Hook**: Prefer `useSettings()` hook over direct store access
2. **Handle Loading States**: Always check `isLoading` for better UX
3. **Error Handling**: Display error messages to users when needed
4. **Initialization**: The hook auto-initializes, but you can manually call `initialize()` if needed

## Migration from Theme Context

If migrating from the old ThemeProvider context:

**Before:**
```typescript
import { useTheme } from '../context/ThemeProvider';

const { theme, setTheme, toggleTheme } = useTheme();
```

**After:**
```typescript
import { useSettings } from '../hooks/useSettings';

const { theme, setTheme, toggleTheme } = useSettings();
```

The API is mostly compatible, with added benefits of backend sync and better error handling.