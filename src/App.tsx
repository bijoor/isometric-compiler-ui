import React, { useState, useEffect, useCallback } from 'react';
import { config } from './config';
import { Shape, DiagramComponent } from './Types';
import ImprovedLayout from './ImprovedLayout';
import { calculateBoundingBox, clipSVGToContents } from './lib/svgUtils';
import { loadShapesFromGoogleDrive } from './lib/googleDriveLib';
import * as diagramComponentsLib from './lib/diagramComponentsLib';

const App: React.FC = () => {
    const [svgLibrary, setSvgLibrary] = useState<Shape[]>([]);
    const [diagramComponents, setDiagramComponents] = useState<DiagramComponent[]>([]);
    const [canvasSize, setCanvasSize] = useState({ width: 1000, height: 1000 });
    const [composedSVG, setComposedSVG] = useState<string>('');
    const [selected3DShape, setSelected3DShape] = useState<string | null>(null);
    const [newPosition, setNewPosition] = useState<'top' | 'front-right' | 'front-left' | 'back-right' | 'back-left'>('top');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [boundingBox, setBoundingBox] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
    const [fileName, setFileName] = useState(() => {
        return localStorage.getItem('fileName') || 'diagram.svg';
    });
    const [clipToContents, setClipToContents] = useState(() => {
        return localStorage.getItem('clipToContents') === 'true';
    });
    const [spreadsheetUrl, setSpreadsheetUrl] = useState(() => {
        return localStorage.getItem('spreadsheetUrl') || '';
    });
    const [folderUrl, setFolderUrl] = useState(() => {
        return localStorage.getItem('folderUrl') || '';
    });
    const [availableAttachmentPoints, setAvailableAttachmentPoints] = useState<string[]>([]);

    useEffect(() => {
        fetchSvgLibrary();
    }, []);

    useEffect(() => {
        const compiledSVG = diagramComponentsLib.compileDiagram(diagramComponents, canvasSize, svgLibrary);
        setComposedSVG(compiledSVG);
    }, [diagramComponents, canvasSize, svgLibrary]);

    useEffect(() => {
        localStorage.setItem('canvasSize', JSON.stringify(canvasSize));
    }, [canvasSize]);

    useEffect(() => {
        localStorage.setItem('fileName', fileName);
    }, [fileName]);

    useEffect(() => {
        localStorage.setItem('clipToContents', clipToContents.toString());
    }, [clipToContents]);

    useEffect(() => {
        localStorage.setItem('spreadsheetUrl', spreadsheetUrl);
    }, [spreadsheetUrl]);

    useEffect(() => {
        localStorage.setItem('folderUrl', folderUrl);
    }, [folderUrl]);

    const fetchSvgLibrary = async () => {
        try {
            const response = await fetch(`${config.serverUrl}/shapes`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data: Shape[] = await response.json();
            setSvgLibrary(data);
        } catch (error) {
            console.error('Error fetching SVG library:', error);
            setErrorMessage('Failed to fetch SVG library. Please try again later.');
        }
    };

    // handle select 3D shape from Composition panel or SVG diagram
    const handleSelect3DShape = useCallback((id: string | null) => {
        setSelected3DShape(id);
        if (id) {
            const selectedComponent = diagramComponentsLib.getSelected3DShape(diagramComponents, id);
            if (selectedComponent) {
                const updatedAttachmentPoints = diagramComponentsLib.updateAvailableAttachmentPoints(selectedComponent);
                setAvailableAttachmentPoints(updatedAttachmentPoints);
            }
        } else {
            setAvailableAttachmentPoints([]);
        }
    }, [diagramComponents]);

    const add3DShape = useCallback((shapeName: string, position: string, attachmentPoint: string | null) => {
        const result = diagramComponentsLib.add3DShape(diagramComponents, svgLibrary, shapeName, position, attachmentPoint, selected3DShape);
        
        if (result.newComponent) {
            setDiagramComponents(result.updatedComponents);
            setSelected3DShape(result.newComponent.id);
            const updatedAttachmentPoints = diagramComponentsLib.updateAvailableAttachmentPoints(result.newComponent);
            setAvailableAttachmentPoints(updatedAttachmentPoints);
        } else {
            console.error('Failed to add new 3D shape');
        }
    }, [diagramComponents, svgLibrary, selected3DShape]);

    const add2DShape = useCallback((shapeName: string, attachTo: string) => {
        const updatedComponents = diagramComponentsLib.add2DShape(diagramComponents, selected3DShape, shapeName, attachTo);
        setDiagramComponents(updatedComponents);
    }, [diagramComponents, selected3DShape]);

    const remove3DShape = useCallback((id: string) => {
        const updatedComponents = diagramComponentsLib.remove3DShape(diagramComponents, id);
        setDiagramComponents(updatedComponents);

        if (selected3DShape === id) {
            if (updatedComponents.length > 0) {
                handleSelect3DShape(updatedComponents[0].id);
            } else {
                handleSelect3DShape(null);
            }
        }
    }, [diagramComponents, selected3DShape, handleSelect3DShape]);

    const remove2DShape = useCallback((parentId: string, shapeIndex: number) => {
        const updatedComponents = diagramComponentsLib.remove2DShape(diagramComponents, parentId, shapeIndex);
        setDiagramComponents(updatedComponents);
    }, [diagramComponents]);

    const handleSetCanvasSize = useCallback((newSize: { width: number; height: number }) => {
        setCanvasSize(newSize);
        localStorage.setItem('canvasSize', JSON.stringify(newSize));
    }, []);

    const handleSetFileName = useCallback((newFileName: string) => {
        setFileName(newFileName);
        localStorage.setItem('fileName', newFileName);
    }, []);

    const handleSetClipToContents = useCallback((newClipToContents: boolean) => {
        setClipToContents(newClipToContents);
        localStorage.setItem('clipToContents', newClipToContents.toString());
    }, []);

    const handleSetSpreadsheetUrl = useCallback((newUrl: string) => {
        setSpreadsheetUrl(newUrl);
        localStorage.setItem('spreadsheetUrl', newUrl);
    }, []);

    const handleSetFolderUrl = useCallback((newUrl: string) => {
        setFolderUrl(newUrl);
        localStorage.setItem('folderUrl', newUrl);
    }, []);

    const handleDownloadSVG = useCallback(() => {
        let svgToDownload: string;
        if (clipToContents && boundingBox) {
            svgToDownload = clipSVGToContents(composedSVG, boundingBox);
        } else {
            svgToDownload = `<svg xmlns="http://www.w3.org/2000/svg">${composedSVG}</svg>`;
        }

        const blob = new Blob([svgToDownload], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [composedSVG, fileName, clipToContents, boundingBox]);

    const handleGetBoundingBox = useCallback((newBoundingBox: { x: number, y: number, width: number, height: number } | null) => {
        setBoundingBox(newBoundingBox);
    }, []);

    const handleLoadFromGoogleDrive = async () => {
        if (!spreadsheetUrl || !folderUrl) {
            setErrorMessage('Please provide both Spreadsheet URL and Folder URL in the settings.');
            return;
        }

        try {
            const newLibrary = await loadShapesFromGoogleDrive(spreadsheetUrl, folderUrl, (progress) => {
                // Handle progress updates if needed
            });
            setSvgLibrary(newLibrary);
        } catch (err) {
            if (err instanceof Error) {
                setErrorMessage(`Error loading shapes: ${err.message}`);
            } else {
                setErrorMessage('An unknown error occurred while loading shapes.');
            }
        }
    };

    return (
        <ImprovedLayout
            svgLibrary={svgLibrary}
            diagramComponents={diagramComponents}
            selected3DShape={selected3DShape}
            canvasSize={canvasSize}
            composedSVG={composedSVG}
            onAdd3DShape={add3DShape}
            onAdd2DShape={add2DShape}
            onRemove3DShape={remove3DShape}
            onRemove2DShape={remove2DShape}
            onSelect3DShape={handleSelect3DShape}
            onSetCanvasSize={handleSetCanvasSize}
            onUpdateSvgLibrary={setSvgLibrary}
            onDownloadSVG={handleDownloadSVG}
            fileName={fileName}
            setFileName={handleSetFileName}
            clipToContents={clipToContents}
            setClipToContents={handleSetClipToContents}
            onGetBoundingBox={handleGetBoundingBox}
            spreadsheetUrl={spreadsheetUrl}
            setSpreadsheetUrl={handleSetSpreadsheetUrl}
            folderUrl={folderUrl}
            setFolderUrl={handleSetFolderUrl}
            availableAttachmentPoints={availableAttachmentPoints}
            onLoadShapesFromGoogleDrive={handleLoadFromGoogleDrive}
            errorMessage={errorMessage}
            setErrorMessage={setErrorMessage}
        />
    );
};

export default App;