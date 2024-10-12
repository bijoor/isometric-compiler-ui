import { config } from './config';
import { Shape } from './Types';

declare global {
    interface Window {
        google: any;
    }
}

const { CLIENT_ID, SCOPES } = config.googleKeys;

let tokenClient: any;
let accessToken: string | null = null;

const loadGoogleApi = async (): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = () => {
            console.log('Google Identity Services script loaded');
            tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                callback: (response: any) => {
                    if (response.error !== undefined) {
                        console.error('Error during token client initialization:', response.error);
                    } else {
                        accessToken = response.access_token;
                        console.log('Access token acquired');
                    }
                },
            });
            resolve();
        };
        script.onerror = () => reject(new Error('Failed to load Google Identity Services script'));
        document.body.appendChild(script);
    });
};

const authenticateUser = async (): Promise<void> => {
    if (!tokenClient) {
        await loadGoogleApi();
    }
    if (!accessToken) {
        return new Promise<void>((resolve, reject) => {
            tokenClient.callback = (response: any) => {
                if (response.error !== undefined) {
                    reject(new Error(response.error));
                } else {
                    accessToken = response.access_token;
                    resolve();
                }
            };
            tokenClient.requestAccessToken({prompt: 'consent'});
        });
    }
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
    folderUrl: string,
    onProgress: (progress: LoadProgress) => void
): Promise<Shape[]> => {
    try {
        await authenticateUser();

        const folderId = getFolderId(folderUrl);
        if (!folderId) {
            throw new Error('Invalid folder URL');
        }

        // Find index.csv
        const indexFileResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+name='index.csv'&fields=files(id,name)`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        if (!indexFileResponse.ok) {
            throw new Error(`HTTP error! status: ${indexFileResponse.status}`);
        }
        const indexFileData = await indexFileResponse.json();

        if (indexFileData.files.length === 0) {
            throw new Error('index.csv not found in the specified folder');
        }

        const indexFileId = indexFileData.files[0].id;
        const indexContent = await getFileContent(indexFileId);

        // Parse index.csv
        const lines = indexContent.split('\n');
        const headers = lines[0].split(',');
        const shapes: Shape[] = [];
        const totalFiles = lines.length - 1; // Exclude header row

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length === headers.length) {
                const shapeData: any = {};
                headers.forEach((header, index) => {
                    shapeData[header.trim()] = values[index].trim();
                });

                onProgress({
                    currentFile: shapeData.svgFile,
                    loadedFiles: i,
                    totalFiles: totalFiles
                });

                // Find and load SVG file
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
                }
            }
        }

        return shapes;

    } catch (error) {
        console.error('Error loading shapes from Google Drive:', error);
        throw error;
    }
};

export { loadShapesFromGoogleDrive };