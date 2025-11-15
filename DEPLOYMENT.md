# PWA and GitHub Pages Setup

This repository is configured as a Progressive Web App (PWA) with automatic deployment to GitHub Pages.

## PWA Features

The app now includes:
- **Web App Manifest**: Allows users to install the app on their devices
- **Service Worker**: Provides offline functionality and caching
- **App Icons**: Multiple sizes for different devices (64x64, 192x192, 512x512)
- **Installable**: Users can add the app to their home screen on mobile devices

## GitHub Pages Deployment

### Enabling GitHub Pages

To enable GitHub Pages deployment:

1. Go to your repository settings on GitHub
2. Navigate to **Pages** in the left sidebar
3. Under **Build and deployment**, select:
   - **Source**: GitHub Actions
4. Save the settings

Once enabled, the workflow will automatically deploy to GitHub Pages whenever you push to the `main` branch.

### Accessing Your Deployed App

After the workflow completes, your app will be available at:
```
https://pelle72.github.io/Creator-Sniffer/
```

### Manual Deployment

You can also trigger a deployment manually:
1. Go to the **Actions** tab in your repository
2. Select the "Deploy to GitHub Pages" workflow
3. Click "Run workflow"

## Local Development

For local development, the app runs at the root path:
```bash
npm run dev
```

The build process automatically adjusts paths based on whether it's running in GitHub Actions or locally.

## Service Worker Caching

The PWA includes intelligent caching for:
- **Google Fonts**: Cached for 1 year
- **Tailwind CSS CDN**: Cached for 1 week with stale-while-revalidate
- **Static Assets**: All app files are precached for offline use

## Testing PWA Features

To test PWA features locally:

1. Build the app: `npm run build`
2. Preview the build: `npm run preview`
3. Open the preview URL in a browser
4. Check the browser's developer tools:
   - **Application** tab (Chrome/Edge) or **Storage** tab (Firefox)
   - Look for the manifest and service worker registration
   - Test offline functionality by disabling network in DevTools
