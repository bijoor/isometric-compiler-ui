import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './components/ui/Button';
import { RadixSelect } from './components/ui/Select';
import { config } from './config';

interface Shape {
    name: string;
    type: string;
    attachTo?: string;
    svgContent: string;
}

interface Point {
    x: number;
    y: number;
}

interface AttachmentPoint extends Point {
    name: string;
}

interface Attached2DShape {
    name: string;
    attachedTo: string;
}

interface DiagramComponent {
    id: string;
    shape: string;
    position: 'center' | 'top' | 'front-right' | 'front-left' | 'back-right' | 'back-left';
    relativeToId: string | null;
    attached2DShapes: Attached2DShape[];
    attachmentPoints: AttachmentPoint[];
    absolutePosition: Point;
}

const App: React.FC = () => {
    const [svgLibrary, setSvgLibrary] = useState<Shape[]>([]);
    const [diagramComponents, setDiagramComponents] = useState<DiagramComponent[]>([]);
    const [canvasSize, setCanvasSize] = useState({ width: 1000, height: 1000 });
    const [composedSVG, setComposedSVG] = useState<string>('');
    const [selected3DShape, setSelected3DShape] = useState<string | null>(null);
    const [newPosition, setNewPosition] = useState<'top' | 'front-right' | 'front-left' | 'back-right' | 'back-left'>('top');

    useEffect(() => {
        fetchSvgLibrary();
    }, []);

    useEffect(() => {
        compileDiagram();
    }, [diagramComponents, canvasSize]);

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
        }
    };

    const add3DShape = (shapeName: string) => {
        const newId = `shape-${Date.now()}`;
        const newComponent: DiagramComponent = {
            id: newId,
            shape: shapeName,
            position: diagramComponents.length === 0 ? 'center' : newPosition,
            relativeToId: diagramComponents.length === 0 ? null : selected3DShape,
            attached2DShapes: [],
            attachmentPoints: [],
            absolutePosition: { x: 0, y: 0 }
        };
        setDiagramComponents(prevComponents => [...prevComponents, newComponent]);
        setSelected3DShape(newId);
    };

    const add2DShape = (shapeName: string, attachTo: string) => {
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
        }
    };

    const remove3DShape = (id: string) => {
        setDiagramComponents(prevComponents => prevComponents.filter(component => component.id !== id));
        if (selected3DShape === id) {
            setSelected3DShape(null);
        }
    };

    const remove2DShape = (shapeIndex: number) => {
        if (selected3DShape !== null) {
            setDiagramComponents(prevComponents => {
                return prevComponents.map(component => {
                    if (component.id === selected3DShape) {
                        return {
                            ...component,
                            attached2DShapes: component.attached2DShapes.filter((_, i) => i !== shapeIndex)
                        };
                    }
                    return component;
                });
            });
        }
    };

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
        const svgNamespace = "http://www.w3.org/2000/svg";

        const svgElement = document.createElementNS(svgNamespace, "svg");
        svgElement.setAttribute("width", canvasSize.width.toString());
        svgElement.setAttribute("height", canvasSize.height.toString());
        svgElement.setAttribute("viewBox", `0 0 ${canvasSize.width} ${canvasSize.height}`);

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

            svgElement.appendChild(shape3DElement);
            processedComponents.push(updatedComponent);
        });

        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgElement);
        setComposedSVG(svgString);
    }, [diagramComponents, canvasSize, svgLibrary]);

    useEffect(() => {
        compileDiagram();
    }, [compileDiagram]);

    return (
        <div className="p-4 bg-gray-900 text-white min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Isometric Compiler UI</h1>

            <div className="mb-4">
                <label className="block mb-2">Canvas Size:</label>
                <input
                    type="number"
                    value={canvasSize.width}
                    onChange={(e) => setCanvasSize({ ...canvasSize, width: parseInt(e.target.value) })}
                    className="mr-2 bg-gray-700 text-white p-2 rounded"
                />
                <input
                    type="number"
                    value={canvasSize.height}
                    onChange={(e) => setCanvasSize({ ...canvasSize, height: parseInt(e.target.value) })}
                    className="bg-gray-700 text-white p-2 rounded"
                />
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-2">3D Shapes</h2>
                <table className="w-full">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {svgLibrary.filter(shape => shape.type === '3D').map(shape => (
                            <tr key={shape.name}>
                                <td>{shape.name}</td>
                                <td>
                                    <Button onClick={() => add3DShape(shape.name)}>
                                        Add
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-2">2D Shapes</h2>
                <table className="w-full">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Attach To</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {svgLibrary.filter(shape => shape.type === '2D').map(shape => (
                            <tr key={shape.name}>
                                <td>{shape.name}</td>
                                <td>{shape.attachTo}</td>
                                <td>
                                    <Button
                                        onClick={() => add2DShape(shape.name, shape.attachTo || '')}
                                        disabled={selected3DShape === null}
                                    >
                                        Add
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-2">Composition</h2>
                {diagramComponents.length > 0 && (
                    <div className="mb-4">
                        <label className="block mb-2">Position for next 3D shape:</label>
                        <RadixSelect
                            options={[
                                { value: 'top', label: 'Top' },
                                { value: 'front-right', label: 'Front Right' },
                                { value: 'front-left', label: 'Front Left' },
                                { value: 'back-right', label: 'Back Right' },
                                { value: 'back-left', label: 'Back Left' },
                            ]}
                            onChange={(value) => setNewPosition(value as 'top' | 'front-right' | 'front-left' | 'back-right' | 'back-left')}
                            placeholder="Select position"
                        />
                    </div>
                )}
                <table className="w-full">
                    <thead>
                        <tr>
                            <th>Select</th>
                            <th>Shape</th>
                            <th>Position</th>
                            <th>Relative To</th>
                            <th>Attachment Points</th>
                            <th>Attached 2D Shapes</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {diagramComponents.map((component) => (
                            <tr
                                key={component.id}
                                className={selected3DShape === component.id ? 'bg-blue-900' : ''}
                            >
                                <td>
                                    <input
                                        type="radio"
                                        checked={selected3DShape === component.id}
                                        onChange={() => setSelected3DShape(component.id)}
                                    />
                                </td>
                                <td>{component.shape}</td>
                                <td>{component.position}</td>
                                <td>{component.relativeToId ? diagramComponents.find(c => c.id === component.relativeToId)?.shape : 'None'}</td>
                                <td>{component.attachmentPoints.map(ap => ap.name).join(', ')}</td>
                                <td>
                                    {component.attached2DShapes.map((shape, i) => (
                                        <div key={i}>
                                            {shape.name} (attached to {shape.attachedTo})
                                            <Button onClick={() => remove2DShape(i)} className="ml-1 text-xs">X</Button>
                                            {i < component.attached2DShapes.length - 1 ? ', ' : ''}
                                        </div>
                                    ))}
                                </td>
                                <td>
                                    <Button onClick={() => remove3DShape(component.id)}>Remove</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {composedSVG && (
                <div className="mt-4">
                    <h2 className="text-xl font-semibold mb-2">Composed SVG:</h2>
                    <div dangerouslySetInnerHTML={{ __html: composedSVG }} className="bg-white p-4 rounded" style={{ minHeight: '200px' }} />
                </div>
            )}
        </div>
    );
};

export default App;
export type { DiagramComponent };                            