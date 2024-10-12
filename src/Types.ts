// Shape interface
export interface Shape {
    name: string;
    type: string;
    attachTo?: string;
    svgContent: string;
}

// DiagramComponent interface
export interface DiagramComponent {
    id: string;
    shape: string;
    position: 'center' | 'top' | 'front-right' | 'front-left' | 'back-right' | 'back-left';
    relativeToId: string | null;
    attached2DShapes: Attached2DShape[];
    attachmentPoints: AttachmentPoint[];
    absolutePosition: Point;
}

// Additional types used in DiagramComponent
export interface Attached2DShape {
    name: string;
    attachedTo: string;
}

export interface Point {
    x: number;
    y: number;
}

export interface AttachmentPoint extends Point {
    name: string;
}

// CanvasSize type
export interface CanvasSize {
    width: number;
    height: number;
}