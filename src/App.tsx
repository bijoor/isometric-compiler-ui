import React, { useState, useEffect, useCallback } from 'react';
import { config } from './config';
import { Shape, DiagramComponent } from './Types';
import ImprovedLayout from './ImprovedLayout';
import { calculateBoundingBox, clipSVGToContents } from './lib/svgUtils';
import { extractAttachmentPoints, compileDiagram, updateAvailableAttachmentPoints } from './DiagramUtils';
import { loadShapesFromGoogleDrive } from './GoogleDriveUtils';

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
        const compiledSVG = compileDiagram(diagramComponents, canvasSize, svgLibrary);
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
        console.log(`handleSelect3DShape ${id}`);
        if (id === null) {
            setAvailableAttachmentPoints([]);
        } else {
            const selectedComponents = diagramComponents.filter(component => component.id === id);
            if (selectedComponents.length>0) {
                const updatedAttachmentPoints = updateAvailableAttachmentPoints(selectedComponents[0])
                setAvailableAttachmentPoints(updatedAttachmentPoints);
            }
        }
    }, [diagramComponents]);

    const add3DShape = useCallback((shapeName: string, position: string, attachmentPoint: string | null) => {
        const newId = `shape-${Date.now()}`;
        setDiagramComponents(prevComponents => {
            if (prevComponents.length === 0 || selected3DShape !== null) {
                const shape = svgLibrary.find(s => s.name === shapeName);
                if (!shape) {
                    console.error(`Shape ${shapeName} not found in library`);
                    return prevComponents;
                }

                const parser = new DOMParser();
                const svgDoc = parser.parseFromString(shape.svgContent, 'image/svg+xml');
                const svgElement = svgDoc.documentElement;

                // Ensure svgElement is of type SVGElement
                if (!(svgElement instanceof SVGElement)) {
                    console.error('Failed to parse SVG content');
                    return prevComponents;
                }

                const attachmentPoints = extractAttachmentPoints(svgElement);

                const newComponent: DiagramComponent = {
                    id: newId,
                    shape: shapeName,
                    position: (attachmentPoint || position) as DiagramComponent['position'], // Type assertion
                    relativeToId: prevComponents.length === 0 ? null : selected3DShape,
                    attached2DShapes: [],
                    attachmentPoints: attachmentPoints,
                    absolutePosition: { x: 0, y: 0 }
                };

                setSelected3DShape(newId);

                const updatedAttachmentPoints = updateAvailableAttachmentPoints(newComponent);
                setAvailableAttachmentPoints(updatedAttachmentPoints);
                console.log('App: Selecting 3D shape:', newId);
                console.log(updatedAttachmentPoints);
        
                return [...prevComponents, newComponent];
            } else {
                setErrorMessage('Please select a 3D shape before adding a new one.');
                return prevComponents;
            }
        });


    }, [selected3DShape, handleSelect3DShape, svgLibrary]);

    const add2DShape = useCallback((shapeName: string, attachTo: string) => {
        if (selected3DShape !== null) {
            setDiagramComponents(prevComponents => {
                return prevComponents.map(component => {
                    if (component.id === selected3DShape) {
                        return {
                            ...component,
                            attached2DShapes: [...component.attached2DShapes, { name: shapeName, attachedTo: attachTo }]
                        };
                    }
                    return component;
                });
            });
        } else {
            setErrorMessage('Please select a 3D shape to attach this 2D shape to.');
        }
    }, [selected3DShape]);

    const remove3DShape = useCallback((id: string) => {
        setDiagramComponents(prevComponents => {
            const updatedComponents = prevComponents.filter(component => component.id !== id);

            if (selected3DShape === id) {
                console.log("App: Removing currently selected 3D shape");
                if (updatedComponents.length > 0) {
                    handleSelect3DShape(updatedComponents[0].id);
                } else {
                    handleSelect3DShape(null);
                }
            }

            return updatedComponents;
        });

    }, [selected3DShape, handleSelect3DShape]);

    const remove2DShape = useCallback((parentId: string, shapeIndex: number) => {
        setDiagramComponents(prevComponents => {
            return prevComponents.map(component => {
                if (component.id === parentId) {
                    return {
                        ...component,
                        attached2DShapes: component.attached2DShapes.filter((_, i) => i !== shapeIndex)
                    };
                }
                return component;
            });
        });
    }, []);

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