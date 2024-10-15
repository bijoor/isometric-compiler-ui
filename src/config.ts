// src/config.ts

const getGoogleKeys = () => {
    console.log(`API_KEY:${import.meta.env.VITE_GOOGLE_API_KEY}`);
    return {
        CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        API_KEY: import.meta.env.VITE_GOOGLE_API_KEY,
        DISCOVERY_DOCS: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
        SCOPES: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/spreadsheets.readonly',
    };
}

const getServerUrl = () => {
    if (import.meta.env.MODE === 'production') {
        // For GitHub Pages (production) environment
        return 'https://isometric-diagram-server-ff5b4054a66c.herokuapp.com';
    } else if (import.meta.env.VITE_SERVER_URL) {
        // For local development with a custom server URL
        return import.meta.env.VITE_SERVER_URL;
    } else {
        // Default local development server
        return 'http://localhost:3000';
    }
};

export const config = {
    serverUrl: getServerUrl(),
    googleKeys: getGoogleKeys()
};