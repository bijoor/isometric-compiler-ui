import { DiagramComponent, Point, AttachmentPoint, Shape } from '../Types';

declare global {
    interface Window {
        SVGElement: typeof SVGElement;
    }
}

export const add3DShape = (
    diagramComponents: DiagramComponent[],
    svgLibrary: Shape[],
    shapeName: string,
    position: string,
    attachmentPoint: string | null,
    selected3DShape: string | null
): { updatedComponents: DiagramComponent[], newComponent: DiagramComponent | null } => {
    const newId = `shape-${Date.now()}`;
    
    if (diagramComponents.length === 0 || selected3DShape !== null) {
        const shape = svgLibrary.find(s => s.name === shapeName);
        if (!shape) {
            console.error(`Shape ${shapeName} not found in library`);
            return { updatedComponents: diagramComponents, newComponent: null };
        }

        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(shape.svgContent, 'image/svg+xml');
        const svgElement = svgDoc.documentElement;

        if (!(svgElement instanceof SVGElement)) {
            console.error('Failed to parse SVG content');
            return { updatedComponents: diagramComponents, newComponent: null };
        }

        const attachmentPoints = extractAttachmentPoints(svgElement);

        const newComponent: DiagramComponent = {
            id: newId,
            shape: shapeName,
            position: (attachmentPoint || position) as DiagramComponent['position'],
            relativeToId: diagramComponents.length === 0 ? null : selected3DShape,
            attached2DShapes: [],
            attachmentPoints: attachmentPoints,
            absolutePosition: { x: 0, y: 0 }
        };

        const updatedComponents = [...diagramComponents, newComponent];

        return { 
            updatedComponents,
            newComponent
        };
    } else {
        console.error('Please select a 3D shape before adding a new one.');
        return { updatedComponents: diagramComponents, newComponent: null };
    }
};

export const add2DShape = (
    diagramComponents: DiagramComponent[],
    selected3DShape: string | null,
    shapeName: string,
    attachTo: string
): DiagramComponent[] => {
    if (selected3DShape !== null) {
        return diagramComponents.map(component => {
            if (component.id === selected3DShape) {
                return {
                    ...component,
                    attached2DShapes: [...component.attached2DShapes, { name: shapeName, attachedTo: attachTo }]
                };
            }
            return component;
        });
    } else {
        console.error('Please select a 3D shape to attach this 2D shape to.');
        return diagramComponents;
    }
};

export const remove3DShape = (
    diagramComponents: DiagramComponent[],
    id: string
): DiagramComponent[] => {
    return diagramComponents.filter(component => component.id !== id);
};

export const remove2DShape = (
    diagramComponents: DiagramComponent[],
    parentId: string,
    shapeIndex: number
): DiagramComponent[] => {
    return diagramComponents.map(component => {
        if (component.id === parentId) {
            return {
                ...component,
                attached2DShapes: component.attached2DShapes.filter((_, i) => i !== shapeIndex)
            };
        }
        return component;
    });
};

export const getSelected3DShape = (
    diagramComponents: DiagramComponent[],
    selected3DShape: string | null
): DiagramComponent | null => {
    if (selected3DShape === null) {
        return null;
    }
    return diagramComponents.find(component => component.id === selected3DShape) || null;
};

export const getAvailableAttachmentPoints = (
    diagramComponents: DiagramComponent[],
    selected3DShape: string | null
): string[] => {
    const selectedComponent = getSelected3DShape(diagramComponents, selected3DShape);
    if (selectedComponent) {
        return updateAvailableAttachmentPoints(selectedComponent);
    }
    return [];
};

// Functions from DiagramUtils

export const extractAttachmentPoints = (svgElement: SVGElement): AttachmentPoint[] => {
    const attachmentPoints: AttachmentPoint[] = [];
    const circles = svgElement.querySelectorAll('circle[id^="attach-"]');

    circles.forEach((circle) => {
        const id = circle.getAttribute('id');
        const cx = circle.getAttribute('cx');
        const cy = circle.getAttribute('cy');

        if (id && cx && cy) {
            attachmentPoints.push({
                name: id,
                x: parseFloat(cx),
                y: parseFloat(cy)
            });
        }
    });

    return attachmentPoints;
};

export const getAttachmentPoint = (component: DiagramComponent, pointName: string): Point | null => {
    const point = component.attachmentPoints.find(p => p.name === pointName);
    return point ? { x: point.x, y: point.y } : null;
};

export const calculateAbsolutePosition = (
    component: DiagramComponent,
    referenceComponent: DiagramComponent | null,
    canvasSize: { width: number; height: number }
): Point => {
    if (!referenceComponent) {
        return { x: canvasSize.width / 2, y: canvasSize.height / 2 };
    }

    const [positionType, attachmentPoint] = component.position.split('-');
    const refAttachPoint = getAttachmentPoint(referenceComponent, `attach-${component.position}`);
    const newPoint = (
        positionType === 'top' ? 'bottom' : (
            positionType === 'front' ? (
                attachmentPoint === 'left' ? 'back-right' : 'back-left'
            ) : (
                attachmentPoint === 'left' ? 'front-right' : 'front-left'
            )
        )
    );

    const newShapeAttachPoint = getAttachmentPoint(component, `attach-${newPoint}`);

    if (!refAttachPoint || !newShapeAttachPoint) {
        console.warn(`Attachment points not found for ${component.id} or ${referenceComponent.id}`);
        return referenceComponent.absolutePosition;
    }

    return {
        x: referenceComponent.absolutePosition.x + refAttachPoint.x - newShapeAttachPoint.x,
        y: referenceComponent.absolutePosition.y + refAttachPoint.y - newShapeAttachPoint.y
    };
};

export const getSvgFromLibrary = (shapeName: string, svgLibrary: Shape[]): SVGGElement | null => {
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

export const compileDiagram = (
    diagramComponents: DiagramComponent[],
    canvasSize: { width: number; height: number },
    svgLibrary: Shape[]
): string => {
    console.log('Compiling diagram...');

    let svgContent = '';
    const processedComponents: DiagramComponent[] = [];

    diagramComponents.forEach((component) => {
        const shape3DElement = getSvgFromLibrary(component.shape, svgLibrary);
        if (!shape3DElement) {
            console.warn(`3D shape not found in library:`, component.shape);
            processedComponents.push(component);
            return;
        }

        shape3DElement.setAttribute('id', component.id);

        const referenceComponent = component.relativeToId
            ? processedComponents.find(c => c.id === component.relativeToId) || null
            : null;

        const absolutePosition = calculateAbsolutePosition(component, referenceComponent, canvasSize);
        component.absolutePosition = absolutePosition;

        shape3DElement.setAttribute('transform', `translate(${absolutePosition.x}, ${absolutePosition.y})`);

        // Attach 2D shapes
        component.attached2DShapes.forEach((attached2DShape) => {
            const shape2DElement = getSvgFromLibrary(attached2DShape.name, svgLibrary);
            if (shape2DElement) {
                shape2DElement.setAttribute("id", `${attached2DShape.attachedTo}-${attached2DShape.name}`);

                const shape2DAttachPoint = shape2DElement.querySelector('#attach-point');
                const shape3DAttachPoint = shape3DElement.querySelector(`#attach-${attached2DShape.attachedTo}`);

                if (shape2DAttachPoint && shape3DAttachPoint) {
                    const dx = parseFloat(shape3DAttachPoint.getAttribute("cx") || "0") - parseFloat(shape2DAttachPoint.getAttribute("cx") || "0");
                    const dy = parseFloat(shape3DAttachPoint.getAttribute("cy") || "0") - parseFloat(shape2DAttachPoint.getAttribute("cy") || "0");

                    const transform = `translate(${dx}, ${dy})`;
                    shape2DElement.setAttribute('transform', transform);
                    shape3DElement.appendChild(shape2DElement);
                } else {
                    console.warn(`Attachment points not found for 2D shape ${attached2DShape.name} or 3D shape ${component.shape}`);
                }
            }
        });

        svgContent += shape3DElement.outerHTML;
        processedComponents.push(component);
    });

    return svgContent;
};

export const updateAvailableAttachmentPoints = (
    shape: DiagramComponent | null | undefined
): string[] => {
    if (!shape || !shape.attachmentPoints || !Array.isArray(shape.attachmentPoints)) {
        return ['none'];
    }

    const points = shape.attachmentPoints
        .filter(point => point.name.startsWith('attach-'))
        .map(point => {
            const parts = point.name.split('-');
            return parts.length > 2 ? `${parts[1]}-${parts[2]}` : parts[1];
        });

    return ['none', ...new Set(points)];
};

// Functions to Save and Load a composition in Diagram Components


export const serializeDiagramComponents = (
    diagramComponents: DiagramComponent[]
): string => {
    return JSON.stringify(diagramComponents, null, 2);
};

export const deserializeDiagramComponents = (
    serializedData: string
): DiagramComponent[] => {
    const parsedData = JSON.parse(serializedData);
    
    if (!validateLoadedFile(parsedData)) {
        throw new Error('Invalid diagram components structure');
    }

    return parsedData as DiagramComponent[];
};

// Function to validate the structure of a loaded file
export const validateLoadedFile = (
    data: any
): boolean => {
    if (!Array.isArray(data)) return false;

    // Check if diagramComponents have the correct structure
    for (const component of data) {
        if (!component.id || !component.shape || !component.position) return false;
        if (!Array.isArray(component.attached2DShapes)) return false;
        if (!Array.isArray(component.attachmentPoints)) return false;
        
        // Validate attached2DShapes
        for (const shape of component.attached2DShapes) {
            if (typeof shape.name !== 'string' || typeof shape.attachedTo !== 'string') return false;
        }
        
        // Validate attachmentPoints
        for (const point of component.attachmentPoints) {
            if (typeof point.name !== 'string' || typeof point.x !== 'number' || typeof point.y !== 'number') return false;
        }
        
        // Validate absolutePosition
        if (typeof component.absolutePosition !== 'object' || 
            typeof component.absolutePosition.x !== 'number' || 
            typeof component.absolutePosition.y !== 'number') return false;
    }

    return true;
};