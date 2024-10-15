import React, { useState, useEffect, useCallback } from 'react';
import { config } from './config';
import { Shape, Point, AttachmentPoint, Attached2DShape, DiagramComponent } from './Types';
import ImprovedLayout from './ImprovedLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './components/ui/Dialog';
import { Button } from './components/ui/Button';
import { cleanupSVG, clipSVGToContents } from './lib/svgUtils';

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

    useEffect(() => {
        fetchSvgLibrary();
    }, []);

    useEffect(() => {
        compileDiagram();
    }, [diagramComponents, canvasSize]);

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

    const handleSelect3DShape = useCallback((id: string | null) => {
        console.log('App: Selecting 3D shape:', id);
        setSelected3DShape(id);
    }, []);

    const add3DShape = useCallback((shapeName: string, position: 'top' | 'front-right' | 'front-left') => {
        setDiagramComponents(prevComponents => {
            // Check if this is the first shape or if there's a selected shape
            if (prevComponents.length === 0 || selected3DShape !== null) {
                const newId = `shape-${Date.now()}`;
                const newComponent: DiagramComponent = {
                    id: newId,
                    shape: shapeName,
                    position: position,
                    relativeToId: prevComponents.length === 0 ? null : selected3DShape,
                    attached2DShapes: [],
                    attachmentPoints: [],
                    absolutePosition: { x: 0, y: 0 }
                };
                handleSelect3DShape(newId);
                return [...prevComponents, newComponent];
            } else {
                // If it's not the first shape and no shape is selected, don't add the new shape
                setErrorMessage('Please select a 3D shape before adding a new one.');
                return prevComponents;
            }
        });
    }, [selected3DShape, handleSelect3DShape]);

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

            // If we're removing the currently selected shape, select the first remaining shape (if any)
            if (selected3DShape === id) {
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


    const calculateAbsolutePosition = (component: DiagramComponent, processedComponents: DiagramComponent[]): Point => {
        if (component.position === 'center' || !component.relativeToId) {
            return { x: canvasSize.width / 2, y: canvasSize.height / 2 };
        }

        const referenceComponent = processedComponents.find(c => c.id === component.relativeToId);
        if (!referenceComponent) {
            console.warn(`Reference component not found for ${component.id}`);
            return { x: canvasSize.width / 2, y: canvasSize.height / 2 };
        }

        const getAttachmentPoint = (comp: DiagramComponent, pointName: string): Point => {
            const point = comp.attachmentPoints.find(p => p.name === pointName);
            if (point) {
                return { x: Math.abs(point.x), y: Math.abs(point.y) };
            }
            console.warn(`Attachment point ${pointName} not found for component ${comp.id}`);
            return { x: 0, y: 0 };
        };

        let newShapePoint: Point;
        let refShapePoint: Point;

        switch (component.position) {
            case 'top':
                newShapePoint = getAttachmentPoint(component, 'bottom');
                refShapePoint = getAttachmentPoint(referenceComponent, 'top');
                break;
            case 'front-left':
                newShapePoint = getAttachmentPoint(component, 'back-right');
                refShapePoint = getAttachmentPoint(referenceComponent, 'front-left');
                break;
            case 'front-right':
                newShapePoint = getAttachmentPoint(component, 'back-left');
                refShapePoint = getAttachmentPoint(referenceComponent, 'front-right');
                break;
            case 'back-left':
                newShapePoint = getAttachmentPoint(component, 'front-right');
                refShapePoint = getAttachmentPoint(referenceComponent, 'back-left');
                break;
            case 'back-right':
                newShapePoint = getAttachmentPoint(component, 'front-left');
                refShapePoint = getAttachmentPoint(referenceComponent, 'back-right');
                break;
            default:
                console.warn(`Invalid position: ${component.position}`);
                return { x: canvasSize.width / 2, y: canvasSize.height / 2 };
        }

        return {
            x: referenceComponent.absolutePosition.x + refShapePoint.x - newShapePoint.x,
            y: referenceComponent.absolutePosition.y + refShapePoint.y - newShapePoint.y
        };
    };

    const getSvgFromLibrary = (shapeName: string): SVGGElement | null => {
        const shape = svgLibrary.find(s => s.name === shapeName);
        if (!shape) {
            console.warn(`Shape ${shapeName} not found in library`);
            return null;
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(shape.svgContent, "image/svg+xml");
        const svgElement = doc.documentElement;

        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

        while (svgElement.firstChild) {
            group.appendChild(svgElement.firstChild);
        }

        return group;
    };

    const compileDiagram = useCallback(() => {
        console.log('Compiling diagram...');

        let svgContent = '';

        const processedComponents: DiagramComponent[] = [];

        diagramComponents.forEach((component) => {
            const shape3DElement = getSvgFromLibrary(component.shape);
            if (!shape3DElement) {
                console.warn(`3D shape not found in library:`, component.shape);
                processedComponents.push(component);
                return;
            }

            shape3DElement.setAttribute('id', component.id);

            const attachmentPoints: AttachmentPoint[] = [];
            shape3DElement.querySelectorAll('[id^="attach-"]').forEach(pointElement => {
                const point = pointElement as SVGElement;
                const attachPoint: AttachmentPoint = {
                    name: point.id.replace('attach-', ''),
                    x: Math.abs(parseFloat(point.getAttribute("cx") || "0")),
                    y: Math.abs(parseFloat(point.getAttribute("cy") || "0"))
                };
                attachmentPoints.push(attachPoint);
            });

            const updatedComponent = { ...component, attachmentPoints };
            const absolutePosition = calculateAbsolutePosition(updatedComponent, processedComponents);
            updatedComponent.absolutePosition = absolutePosition;

            shape3DElement.setAttribute('transform', `translate(${absolutePosition.x}, ${absolutePosition.y})`);

            // Attach 2D shapes
            component.attached2DShapes.forEach((attached2DShape) => {
                const shape2DElement = getSvgFromLibrary(attached2DShape.name);
                if (shape2DElement) {
                    shape2DElement.setAttribute("id", `${attached2DShape.attachedTo}-${attached2DShape.name}`);

                    const shape2DAttachPoint = shape2DElement.querySelector('#attach-point');
                    const shape3DAttachPoint = shape3DElement.querySelector(`#attach-${attached2DShape.attachedTo}`);
                    console.log(` 2D attach point ${shape2DAttachPoint} attached to ${attached2DShape.attachedTo} `);

                    if (shape2DAttachPoint && shape3DAttachPoint) {
                        const dx = Math.abs(parseFloat(shape3DAttachPoint.getAttribute("cx") || "0")) - Math.abs(parseFloat(shape2DAttachPoint.getAttribute("cx") || "0"));
                        const dy = Math.abs(parseFloat(shape3DAttachPoint.getAttribute("cy") || "0")) - Math.abs(parseFloat(shape2DAttachPoint.getAttribute("cy") || "0"));

                        const transform = `translate(${dx}, ${dy})`;
                        shape2DElement.setAttribute('transform', transform);
                        shape3DElement.appendChild(shape2DElement);
                    } else {
                        console.warn(`Attachment points not found for 2D shape ${attached2DShape.name} or 3D shape ${component.shape}`);
                    }
                }
            });

            svgContent += shape3DElement.outerHTML;
            processedComponents.push(updatedComponent);
        });

        setComposedSVG(svgContent);

    }, [diagramComponents, canvasSize, svgLibrary]);

    const handleDownloadSVG = useCallback(() => {
        let svgToDownload: string;
        if (clipToContents && boundingBox) {
            svgToDownload = clipSVGToContents(composedSVG, boundingBox);
        } else {
            svgToDownload = cleanupSVG(`<svg xmlns="http://www.w3.org/2000/svg">${composedSVG}</svg>`);
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

    useEffect(() => {
        compileDiagram();
    }, [compileDiagram]);

    const updateSvgLibrary = (newLibrary: Shape[]) => {
        setSvgLibrary(newLibrary);
    };

    // Effect to log selected3DShape changes
    useEffect(() => {
        console.log('App: selected3DShape updated:', selected3DShape);
    }, [selected3DShape]);

    interface ErrorDialogProps {
        isOpen: boolean;
        onClose: () => void;
        message: string;
    }

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

    const ErrorDialog: React.FC<ErrorDialogProps> = ({ isOpen, onClose, message }) => {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Error</DialogTitle>
                        <DialogDescription className="text-gray-300">
                            Enter the URL of the Google Drive folder containing your SVG files and index.csv
                        </DialogDescription>
                    </DialogHeader>
                    <p className="text-white">{message}</p>
                    <DialogFooter>
                        <Button onClick={onClose}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    };

    return (
        <>
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
                onUpdateSvgLibrary={updateSvgLibrary}
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
            />
            <ErrorDialog
                isOpen={errorMessage !== null}
                onClose={() => setErrorMessage(null)}
                message={errorMessage || ''}
            />
        </>
    );
};

export default App;
