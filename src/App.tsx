import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './components/ui/Button';
import { RadixSelect } from './components/ui/Select';
import { config } from './config';

interface Shape {
    name: string;
    type: string;
    face?: string;
    svgContent: string;
}

interface Point {
    x: number;
    y: number;
}

interface AttachmentPoint extends Point {
    name: string;
}

interface DiagramComponent {
    id: string;
    shape: string;
    position: 'center' | 'top' | 'front-right' | 'front-left' | 'back-right' | 'back-left';
    relativeToId: string | null;
    top: string[];
    front: string[];
    side: string[];
    attachmentPoints: AttachmentPoint[];
    absolutePosition: Point; // New property to store absolute position
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
            top: [],
            front: [],
            side: [],
            attachmentPoints: [],
            transform: ''
        };
        setDiagramComponents(prevComponents => [...prevComponents, newComponent]);
        setSelected3DShape(newId);
    };

    const add2DShape = (shapeName: string, face: 'top' | 'front' | 'side') => {
        if (selected3DShape !== null) {
            setDiagramComponents(prevComponents => {
                return prevComponents.map(component => {
                    if (component.id === selected3DShape) {
                        return {
                            ...component,
                            [face]: [...component[face], shapeName]
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

    const remove2DShape = (shapeIndex: number, face: 'top' | 'front' | 'side') => {
        if (selected3DShape !== null) {
            setDiagramComponents(prevComponents => {
                return prevComponents.map(component => {
                    if (component.id === selected3DShape) {
                        return {
                            ...component,
                            [face]: component[face].filter((_, i) => i !== shapeIndex)
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
        console.log(`absolute position calculation`);
        console.log(component);

        const getAttachmentPoint = (comp: DiagramComponent, pointName: string): Point => {
            const point = comp.attachmentPoints.find(p => p.name === pointName);
            console.log(`attachment point ${pointName} found at ${point}`);
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
        const ax: number = referenceComponent.absolutePosition.x + refShapePoint.x - newShapePoint.x;
        const ay: number = referenceComponent.absolutePosition.y + refShapePoint.y - newShapePoint.y;

        console.log(`${referenceComponent.absolutePosition.x} + ${refShapePoint.x} - ${newShapePoint.x} = ${ax}`);
        console.log(`${referenceComponent.absolutePosition.y} + ${refShapePoint.y} - ${newShapePoint.y} = ${ay}`);
        return {
            x: ax,
            y: ay
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

        // Copy attributes from SVG to group, except for svg-specific attributes
        //for (const attr of svgElement.attributes) {
        //    if (!['xmlns', 'version', 'width', 'height', 'viewBox'].includes(attr.name)) {
        //        group.setAttribute(attr.name, attr.value);
        //    }
        //}

        // Move all child nodes from SVG to group
        while (svgElement.firstChild) {
            group.appendChild(svgElement.firstChild);
        }

        return group;
    };

    const compileDiagram = useCallback(() => {
        console.log('Compiling diagram...');
        const svgNamespace = "http://www.w3.org/2000/svg";

        // Create a hidden SVG element for temporary rendering
        const hiddenSvg = document.createElementNS(svgNamespace, "svg");
        hiddenSvg.style.position = "absolute";
        document.body.appendChild(hiddenSvg);

        // Function to get bounding box of an SVG element
        const getBoundingBox = (svgComponent) => {
            const tempContainer = document.createElementNS(svgNamespace, "g");
            tempContainer.appendChild(svgComponent.cloneNode(true));
            hiddenSvg.appendChild(tempContainer);
            const bbox = tempContainer.getBBox();
            hiddenSvg.removeChild(tempContainer);
            return bbox;
        };

        // Create an SVG element for the final rendering of the composition
        const svgElement = document.createElementNS(svgNamespace, "svg");
        svgElement.setAttribute("width", canvasSize.width.toString());
        svgElement.setAttribute("height", canvasSize.height.toString());
        svgElement.setAttribute("viewBox", `0 0 ${canvasSize.width} ${canvasSize.height}`);

        // Process all components: Calculate attachment points, position, and render components
        const processedComponents: DiagramComponent[] = [];
        console.log('Starting composition');

        diagramComponents.forEach((component, index) => {
            const shape3DElement = getSvgFromLibrary(component.shape);
            if (!shape3DElement) {
                console.warn(`3D shape not found in library:`, component.shape);
                processedComponents.push(component);
                return;
            }
            console.log(`Processing 3D shape ${component.shape} ${component.id}`);

            shape3DElement.setAttribute('id', component.id);

            // Calculate attachment points
            const attachmentPoints: AttachmentPoint[] = [];
            ['top', 'bottom', 'front-left', 'front-right', 'back-left', 'back-right'].forEach(point => {
                const pointElement = shape3DElement.querySelector(`#attach-${point}`);
                if (pointElement) {
                    const attachPoint: AttachmentPoint = {
                        name: point,
                        x: parseFloat(pointElement.getAttribute("cx") || "0"),
                        y: parseFloat(pointElement.getAttribute("cy") || "0")
                    };
                    attachmentPoints.push(attachPoint);
                } else {
                    console.log(`No attach point: ${point}`);
                }
            });

            // Update the component with the new attachment points and absoloute position
            const updatedComponent = { ...component, attachmentPoints };

            // Calculate absolute position
            const absolutePosition = calculateAbsolutePosition(updatedComponent, processedComponents);

            // Update the component with the new attachment points and absoloute position
            updatedComponent.absolutePosition = absolutePosition;

            // Set the transform attribute based on the absolute position
            shape3DElement.setAttribute('transform', `translate(${absolutePosition.x}, ${absolutePosition.y})`);

            // Attach 2D shapes to faces
            ['top', 'front', 'side'].forEach(face => {
                const faceElement = shape3DElement.querySelector(`#${face}-face`);
                if (faceElement) {
                    const faceBBox = getBoundingBox(faceElement);

                    component[face].forEach(shape2DName => {
                        const shape2DElement = getSvgFromLibrary(shape2DName);
                        if (shape2DElement) {
                            shape2DElement.setAttribute("id", `${face}-${shape2DName}`);

                            console.log(`Found 2D shape:`, shape2DName);
                            const shape2DBBox = getBoundingBox(shape2DElement);
                            console.log(`2D Shape BBox:`, shape2DBBox);

                            // Calculate scaling to fit the shape within the face
                            const scaleX = faceBBox.width / shape2DBBox.width;
                            const scaleY = faceBBox.height / shape2DBBox.height;
                            const scale = Math.min(scaleX, scaleY, 1); // Prevent enlarging if shape is bigger than face

                            // Calculate translation
                            const dx = faceBBox.x + (faceBBox.width - shape2DBBox.width * scale) / 2;
                            const dy = faceBBox.y + (faceBBox.height - shape2DBBox.height * scale) / 2;
                            console.log(`Calculated translation: dx=${dx}, dy=${dy}`);

                            // Transform 2D shape element
                            const transform = `translate(${dx}, ${dy}) scale(${scale})`;

                            // Apply the transform to the group
                            shape2DElement.setAttribute('transform', transform);
                            shape3DElement.appendChild(shape2DElement);
                        }
                    });
                }
            });

            svgElement.appendChild(shape3DElement);

            // Add the fully updated component to the processedComponents array
            processedComponents.push(updatedComponent);
            console.log(processedComponents);
        });

        // Clean up the hidden SVG
        document.body.removeChild(hiddenSvg);

        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgElement);
        setComposedSVG(svgString);

        // Update the diagramComponents state with the new data
        //setDiagramComponents(processedComponents);
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

            <div className="grid grid-cols-3 gap-4">
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
                                        <Button onClick={() => add3DShape(shape.name)}>Add</Button>
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
                                <th>Face</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {svgLibrary.filter(shape => shape.type === '2D').map(shape => (
                                <tr key={shape.name}>
                                    <td>{shape.name}</td>
                                    <td>{shape.face}</td>
                                    <td>
                                        <Button
                                            onClick={() => add2DShape(shape.name, shape.face as 'top' | 'front' | 'side')}
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
                                <th>2D Shapes</th>
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
                                    <td>
                                        Top: {component.top.map((shape, i) => (
                                            <span key={i}>
                                                {shape}
                                                <Button onClick={() => remove2DShape(i, 'top')} className="ml-1 text-xs">X</Button>
                                                {i < component.top.length - 1 ? ', ' : ''}
                                            </span>
                                        ))}<br />
                                        Front: {component.front.map((shape, i) => (
                                            <span key={i}>
                                                {shape}
                                                <Button onClick={() => remove2DShape(i, 'front')} className="ml-1 text-xs">X</Button>
                                                {i < component.front.length - 1 ? ', ' : ''}
                                            </span>
                                        ))}<br />
                                        Side: {component.side.map((shape, i) => (
                                            <span key={i}>
                                                {shape}
                                                <Button onClick={() => remove2DShape(i, 'side')} className="ml-1 text-xs">X</Button>
                                                {i < component.side.length - 1 ? ', ' : ''}
                                            </span>
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