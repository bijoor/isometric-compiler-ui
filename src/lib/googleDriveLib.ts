import { config } from '../config';
import { Shape } from '../Types';

declare global {
    interface Window {
        google: any;
        gapi: any;
    }
}

const { CLIENT_ID, API_KEY, SCOPES } = config.googleKeys;

let tokenClient: any;
let accessToken: string | null = null;

const REQUIRED_HEADERS = ['name', 'type', 'attachTo', 'svgFile'];

const validateHeaders = (headers: string[]): string[] => {
    const missingHeaders = REQUIRED_HEADERS.filter(header => !headers.includes(header));
    return missingHeaders;
};

const loadGoogleApiScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Google API script'));
        document.body.appendChild(script);
    });
};

const initializeGoogleApi = async (): Promise<void> => {
    console.log(`API_KEY: ${API_KEY}`);
    await new Promise<void>((resolve, reject) => {
        window.gapi.load('client', { callback: resolve, onerror: reject });
    });

    await window.gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
    });
};

const loadGoogleAccountsScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Google Accounts script'));
        document.body.appendChild(script);
    });
};

const initializeTokenClient = () => {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response: any) => {
            if (response.error !== undefined) {
                throw (response);
            }
            accessToken = response.access_token;
        },
    });
};

const authenticateUser = async (): Promise<void> => {
    if (!tokenClient) {
        await loadGoogleAccountsScript();
        initializeTokenClient();
    }
    if (!accessToken) {
        return new Promise<void>((resolve, reject) => {
            try {
                tokenClient.callback = (response: any) => {
                    if (response.error !== undefined) {
                        reject(response);
                    } else {
                        accessToken = response.access_token;
                        resolve();
                    }
                };
                tokenClient.requestAccessToken({ prompt: 'consent' });
            } catch (err) {
                console.error(err);
                reject(new Error('Error during authentication'));
            }
        });
    }
};

const getSpreadsheetId = (spreadsheetUrl: string): string | null => {
    const match = spreadsheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
};

const getFolderId = (folderUrl: string): string | null => {
    const match = folderUrl.match(/\/folders\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
};

const getFileContent = async (fileId: string): Promise<string> => {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.text();
};

interface LoadProgress {
    currentFile: string;
    loadedFiles: number;
    totalFiles: number;
}

const loadShapesFromGoogleDrive = async (
    spreadsheetUrl: string,
    folderUrl: string,
    onProgress: (progress: LoadProgress) => void
): Promise<Shape[]> => {
    try {
        await loadGoogleApiScript();
        await initializeGoogleApi();
        await authenticateUser();

        const spreadsheetId = getSpreadsheetId(spreadsheetUrl);
        const folderId = getFolderId(folderUrl);

        console.log(`Spreadsheet URL: ${spreadsheetUrl} id: ${spreadsheetId}`);

        if (!spreadsheetId) {
            throw new Error('Invalid spreadsheet URL');
        }
        if (!folderId) {
            throw new Error('Invalid folder URL');
        }

        // Fetch spreadsheet metadata to get the first sheet's ID
        const metadataResponse = await window.gapi.client.sheets.spreadsheets.get({
            spreadsheetId: spreadsheetId,
        });

        if (!metadataResponse.result.sheets || metadataResponse.result.sheets.length === 0) {
            throw new Error('No sheets found in the spreadsheet');
        }

        const firstSheet = metadataResponse.result.sheets[0].properties;
        const firstSheetName = firstSheet.title;

        // Fetch data from the first sheet
        const response = await window.gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: firstSheetName,
        });

        const rows = response.result.values;
        if (!rows || rows.length === 0) {
            throw new Error('No data found in the spreadsheet');
        }

        const headers = rows[0].map((header: string) => header.trim());

        // Validate headers
        const missingHeaders = validateHeaders(headers);
        if (missingHeaders.length > 0) {
            throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
        }

        const shapes: Shape[] = [];
        const totalFiles = rows.length - 1; // Exclude header row

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const shapeData: any = {};
            headers.forEach((header: string, index: number) => {
                shapeData[header.trim()] = row[index] ? row[index].trim() : '';
            });

            onProgress({
                currentFile: shapeData.svgFile,
                loadedFiles: i,
                totalFiles: totalFiles
            });

            // Find SVG file in the folder
            const svgFileResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+name='${shapeData.svgFile}'&fields=files(id,name)`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            if (!svgFileResponse.ok) {
                throw new Error(`HTTP error! status: ${svgFileResponse.status}`);
            }
            const svgFileData = await svgFileResponse.json();

            if (svgFileData.files.length > 0) {
                const svgFileId = svgFileData.files[0].id;
                const svgContent = await getFileContent(svgFileId);

                shapes.push({
                    name: shapeData.name,
                    type: shapeData.type,
                    attachTo: shapeData.attachTo,
                    svgContent: svgContent,
                });
            } else {
                console.warn(`SVG file not found: ${shapeData.svgFile}`);
            }
        }

        return shapes;

    } catch (error) {
        console.error('Error loading shapes from Google Drive:', error);
        throw error;
    }
};

export { loadShapesFromGoogleDrive };