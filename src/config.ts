// src/config.ts

const getGoogleKeys = () => {
    console.log(`API_KEY:${import.meta.env.VITE_GOOGLE_API_KEY}`);
    return {
        CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        API_KEY: import.meta.env.VITE_GOOGLE_API_KEY,
        DISCOVERY_DOCS: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
        SCOPES: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets.readonly'
    };
}

export const config = {
    googleKeys: getGoogleKeys()
};