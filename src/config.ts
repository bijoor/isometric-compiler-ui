// src/config.ts

const getServerUrl = () => {
    if (import.meta.env.MODE === 'production') {
        // For GitHub Pages (production) environment
        return 'https://isometric-diagram-server-ff5b4054a66c.herokuapp.com/';
    } else if (import.meta.env.VITE_SERVER_URL) {
        // For local development with a custom server URL
        return import.meta.env.VITE_SERVER_URL;
    } else {
        // Default local development server
        return 'http://localhost:3000';
    }
};

export const config = {
    serverUrl: getServerUrl()
};