import React, { useState, useEffect, useCallback } from 'react';
import { Shape, DiagramComponent } from './Types';
import ImprovedLayout from './ImprovedLayout';
import { cleanupSVG, clipSVGToContents } from './lib/svgUtils';
import { loadShapesFromGoogleDrive, loadFileFromDrive, saveFileToDrive } from './lib/googleDriveLib';
import * as diagramComponentsLib from './lib/diagramComponentsLib';
import { defaultShapesLibrary } from './lib/defaultShapesLib';
import { createKeyboardShortcuts } from './KeyboardShortcuts';

const App: React.FC = () => {
    const [svgLibrary, setSvgLibrary] = useState<Shape[]>([]);
    const [diagramComponents, setDiagramComponents] = useState<DiagramComponent[]>([]);
    const [canvasSize, setCanvasSize] = useState({ width: 1000, height: 1000 });
    const [composedSVG, setComposedSVG] = useState<string>('');
    const [selected3DShape, setSelected3DShape] = useState<string | null>(null);
    const [selectedPosition, setSelectedPosition] = useState<string>('top');
    const [selectedAttachmentPoint, setSelectedAttachmentPoint] = useState<string | null>(null);
    const [availableAttachmentPoints, setAvailableAttachmentPoints] = useState<string[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [boundingBox, setBoundingBox] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
    const [fileName, setFileName] = useState(() => {
        return localStorage.getItem('fileName') || 'diagram.svg';
    });
    const [spreadsheetUrl, setSpreadsheetUrl] = useState(() => {
        return localStorage.getItem('spreadsheetUrl') || '';
    });
    const [folderUrl, setFolderUrl] = useState(() => {
        return localStorage.getItem('folderUrl') || '';
    });
    const [folderPath, setFolderPath] = useState(() => {
        return localStorage.getItem('folderPath') || 'My Diagrams';
    });
    const [showAttachmentPoints, setShowAttachmentPoints] = useState(() => {
        return localStorage.getItem('showAttachmentPoints') === 'true';
    });

    // handle select 3D shape from Composition panel or SVG diagram
    const handleSelect3DShape = useCallback((id: string | null) => {
        if (!id) {
            setSelected3DShape(null);
            setAvailableAttachmentPoints([]);
        } else {
            const selectedComponent = diagramComponentsLib.getSelected3DShape(diagramComponents, id);
            if (selectedComponent && !selectedComponent.cut) {
                    setSelected3DShape(selectedComponent.id);
                    const updatedAttachmentPoints = diagramComponentsLib.updateAvailableAttachmentPoints(selectedComponent);
                    setAvailableAttachmentPoints(updatedAttachmentPoints);
            }    
        }
    }, [diagramComponents]);

    const handleSelectedPosition = useCallback((position: string | null) => {
        if (position) {
            console.log(`App position: ${position}`);
            setSelectedPosition(position);    
        }
    }, [setSelectedPosition, selectedPosition]);

    const handleSelectedAttachmentPoint = useCallback((point: string | null) => {
        if (point) {
            console.log(`App point: ${point}`);
            setSelectedAttachmentPoint(point);    
        }
    }, [setSelectedAttachmentPoint, selectedAttachmentPoint]);

    const handleAdd3DShape = useCallback((shapeName: string) => {
        console.log(`App: add3DShape ${selectedPosition} ${selectedAttachmentPoint}`);
        const result = diagramComponentsLib.add3DShape(diagramComponents, svgLibrary, shapeName, selectedPosition, selectedAttachmentPoint, selected3DShape);

        if (result.newComponent) {
            setDiagramComponents(result.updatedComponents);
            setSelected3DShape(result.newComponent.id);
            const updatedAttachmentPoints = diagramComponentsLib.updateAvailableAttachmentPoints(result.newComponent);
            setAvailableAttachmentPoints(updatedAttachmentPoints);
        } else {
            console.error('Failed to add new 3D shape');
        }
    }, [diagramComponents, svgLibrary, selected3DShape, selectedPosition, selectedAttachmentPoint]);

    const handleAdd2DShape = useCallback((shapeName: string, attachTo: string) => {
        const updatedComponents = diagramComponentsLib.add2DShape(diagramComponents, selected3DShape, shapeName, attachTo);
        setDiagramComponents(updatedComponents);
    }, [diagramComponents, selected3DShape]);

    const handleRemove3DShape = useCallback((id: string | null) => {
        if (!id) {
            id = selected3DShape;
        }
        if (id) {
            const updatedComponents = diagramComponentsLib.remove3DShape(diagramComponents, id);
            setDiagramComponents(updatedComponents);
    
            if (selected3DShape === id) {
                if (updatedComponents.length > 0) {
                    handleSelect3DShape(updatedComponents[updatedComponents.length - 1].id);
                } else {
                    handleSelect3DShape(null);
                }
            }    
        }
    }, [diagramComponents, selected3DShape, handleSelect3DShape]);

    const handleRemove2DShape = useCallback((parentId: string, shapeIndex: number) => {
        const updatedComponents = diagramComponentsLib.remove2DShape(diagramComponents, parentId, shapeIndex);
        setDiagramComponents(updatedComponents);
    }, [diagramComponents]);

    const handleCut3DShape = useCallback((id: string | null) => {
        if (!id) {
            id = selected3DShape;
        }
        if (id) {
            setDiagramComponents(prev => diagramComponentsLib.cut3DShape(prev, id));
        }
    }, []);

    const handleCancelCut3DShape = useCallback((id: string | null) => {
        if (!id) {
            const firstCut =  diagramComponentsLib.getFirstCut3DShape(diagramComponents);
            if (firstCut) {
                id = firstCut.id;
            }
        }
        if (id) {
            setDiagramComponents(prev => diagramComponentsLib.cancelCut(prev, id));
        }
    }, []);

    const handlePaste3DShape = useCallback((id: string | null) => {
        if (selected3DShape) {
            if (!id) {
                const firstCut =  diagramComponentsLib.getFirstCut3DShape(diagramComponents);
                if (firstCut) {
                    id = firstCut.id;
                }
            }
            if (id) {
                const result = diagramComponentsLib.paste3DShape(diagramComponents, id, selected3DShape, selectedPosition, selectedAttachmentPoint);
                if (result.pastedComponent) {
                    setDiagramComponents(result.updatedComponents);
                    setSelected3DShape(result.pastedComponent.id);
                    const updatedAttachmentPoints = diagramComponentsLib.updateAvailableAttachmentPoints(result.pastedComponent);
                    setAvailableAttachmentPoints(updatedAttachmentPoints);
                } else {
                    console.error('Failed to paste new 3D shape');
                }    
            }
        }
    }, [selected3DShape, selectedPosition, selectedAttachmentPoint]);

    const getJsonFileName = useCallback((svgFileName: string) => {
        return svgFileName.replace(/\.svg$/, '.json');
    }, []);

    const handleSetFolderPath = useCallback((newPath: string) => {
        setFolderPath(newPath);
    }, []);

    const handleSaveDiagram = useCallback(async () => {
        try {
            const jsonFileName = getJsonFileName(fileName);
            const serializedData = diagramComponentsLib.serializeDiagramComponents(diagramComponents);
            await saveFileToDrive(jsonFileName, serializedData, folderPath);
            setErrorMessage(null);
        } catch (error) {
            console.error('Error saving diagram:', error);
            setErrorMessage('Failed to save diagram. Please try again.');
        }
    }, [diagramComponents, fileName, folderPath, getJsonFileName]);

    const handleLoadDiagram = useCallback(async () => {
        try {
            const jsonFileName = getJsonFileName(fileName);
            const loadedData = await loadFileFromDrive(jsonFileName, folderPath);
            const loadedComponents = diagramComponentsLib.deserializeDiagramComponents(loadedData);
            setDiagramComponents(loadedComponents);
            setErrorMessage(null);

            // Reset selection and update available attachment points
            setSelected3DShape(null);
            setAvailableAttachmentPoints([]);
        } catch (error) {
            console.error('Error loading diagram:', error);
            setErrorMessage('Failed to load diagram. Please check the file and folder path, then try again.');
        }
    }, [fileName, folderPath, getJsonFileName]);

    const handleSetCanvasSize = useCallback((newSize: { width: number; height: number }) => {
        setCanvasSize(newSize);
        localStorage.setItem('canvasSize', JSON.stringify(newSize));
    }, []);

    const handleSetFileName = useCallback((newFileName: string) => {
        setFileName(newFileName);
        localStorage.setItem('fileName', newFileName);
    }, []);

    const handleSetSpreadsheetUrl = useCallback((newUrl: string) => {
        setSpreadsheetUrl(newUrl);
        localStorage.setItem('spreadsheetUrl', newUrl);
    }, []);

    const handleSetFolderUrl = useCallback((newUrl: string) => {
        setFolderUrl(newUrl);
        localStorage.setItem('folderUrl', newUrl);
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

    // get the bounding box for clipping the SVG to the content
    const handleGetBoundingBox = useCallback((newBoundingBox: { x: number, y: number, width: number, height: number } | null) => {
        setBoundingBox(newBoundingBox);
    }, []);

    const handleDownloadSVG = useCallback(() => {
        let svgToDownload: string;
        if (boundingBox) {
            svgToDownload = clipSVGToContents(composedSVG, boundingBox);
        } else {
            svgToDownload = cleanupSVG(composedSVG);
            svgToDownload = `<svg xmlns="http://www.w3.org/2000/svg">${svgToDownload}</svg>`;
        }

        const blob = new Blob([svgToDownload], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        // Ensure fileName ends with .svg
        let adjustedFileName = fileName.trim();
        if (!adjustedFileName.toLowerCase().endsWith('.svg')) {
            adjustedFileName += '.svg';
        }

        link.download = adjustedFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [composedSVG, fileName, boundingBox]);

    const handleSetShowAttachmentPoints = useCallback((show: boolean) => {
        setShowAttachmentPoints(show);
    }, []);

    const handleKeyboardShortcuts = useCallback(() => {
        return createKeyboardShortcuts(
            handleSaveDiagram,
            handleRemove3DShape,
            handleCut3DShape,
            handlePaste3DShape,
            selected3DShape,
            diagramComponents,
            selectedPosition,
            selectedAttachmentPoint
        );
    }, [
        handleSaveDiagram,
        handleRemove3DShape,
        handleCut3DShape,
        handlePaste3DShape,
        selected3DShape,
        diagramComponents,
        selectedPosition,
        selectedAttachmentPoint
    ]);

    useEffect(() => {
        const { handleKeyDown } = handleKeyboardShortcuts();
        
        const keyDownListener = (event: KeyboardEvent) => {
            console.log('Key pressed:', event.key, 'Ctrl:', event.ctrlKey);
            handleKeyDown(event);
        };

        window.addEventListener('keydown', keyDownListener);
        
        return () => {
            window.removeEventListener('keydown', keyDownListener);
        };
    }, [handleKeyboardShortcuts]);

    useEffect(() => {
        const loadSvgContent = async () => {
            const loadedLibrary = await Promise.all(
                defaultShapesLibrary.map(async (shape) => {
                    const response = await fetch(`./shapes/${shape.svgFile}`);
                    const svgContent = await response.text();
                    return { ...shape, svgContent };
                })
            );
            setSvgLibrary(loadedLibrary);
        };

        loadSvgContent();
    }, []);

    useEffect(() => {
        const { svgContent } = diagramComponentsLib.compileDiagram(diagramComponents, canvasSize, svgLibrary, showAttachmentPoints);
        setComposedSVG(svgContent);
    }, [diagramComponents, canvasSize, svgLibrary, showAttachmentPoints]);

    useEffect(() => {
        localStorage.setItem('canvasSize', JSON.stringify(canvasSize));
    }, [canvasSize]);

    useEffect(() => {
        localStorage.setItem('fileName', fileName);
    }, [fileName]);

    useEffect(() => {
        localStorage.setItem('spreadsheetUrl', spreadsheetUrl);
    }, [spreadsheetUrl]);

    useEffect(() => {
        localStorage.setItem('folderUrl', folderUrl);
    }, [folderUrl]);

    useEffect(() => {
        localStorage.setItem('folderPath', folderPath);
    }, [folderPath]);

    useEffect(() => {
        localStorage.setItem('showAttachmentPoints', showAttachmentPoints.toString());
    }, [showAttachmentPoints]);

    return (
        <ImprovedLayout
            svgLibrary={svgLibrary}
            diagramComponents={diagramComponents}
            selected3DShape={selected3DShape}
            composedSVG={composedSVG}
            onAdd3DShape={handleAdd3DShape}
            onAdd2DShape={handleAdd2DShape}
            onRemove3DShape={handleRemove3DShape}
            onRemove2DShape={handleRemove2DShape}
            onSelect3DShape={handleSelect3DShape}
            selectedPosition={selectedPosition}
            onSelectedPosition={handleSelectedPosition}
            selectedAttachmentPoint={selectedAttachmentPoint}
            onSelectedAttachmentPoint={handleSelectedAttachmentPoint}
            onCut3DShape={handleCut3DShape}
            onCancelCut3DShape={handleCancelCut3DShape}
            onPaste3DShape={handlePaste3DShape}
            canvasSize={canvasSize}
            onSetCanvasSize={handleSetCanvasSize}
            onUpdateSvgLibrary={setSvgLibrary}
            onDownloadSVG={handleDownloadSVG}
            fileName={fileName}
            setFileName={handleSetFileName}
            onGetBoundingBox={handleGetBoundingBox}
            spreadsheetUrl={spreadsheetUrl}
            setSpreadsheetUrl={handleSetSpreadsheetUrl}
            folderUrl={folderUrl}
            setFolderUrl={handleSetFolderUrl}
            availableAttachmentPoints={availableAttachmentPoints}
            onLoadShapesFromGoogleDrive={handleLoadFromGoogleDrive}
            errorMessage={errorMessage}
            setErrorMessage={setErrorMessage}
            onSaveDiagram={handleSaveDiagram}
            onLoadDiagram={handleLoadDiagram}
            folderPath={folderPath}
            setFolderPath={handleSetFolderPath}
            showAttachmentPoints={showAttachmentPoints}
            setShowAttachmentPoints={handleSetShowAttachmentPoints}
        />
    );
};

export default App;