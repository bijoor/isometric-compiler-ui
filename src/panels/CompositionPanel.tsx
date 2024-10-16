import React from 'react';
import { Button } from '../components/ui/Button';
import { DiagramComponent } from '../Types';

interface CompositionPanelProps {
    diagramComponents: DiagramComponent[];
    onRemove3DShape: (id: string) => void;
    onRemove2DShape: (parentId: string, shapeIndex: number) => void;
    onSelect3DShape: (id: string) => void;
    selected3DShape: string | null;
}

const CompositionPanel: React.FC<CompositionPanelProps> = ({
    diagramComponents,
    onRemove3DShape,
    onRemove2DShape,
    onSelect3DShape,
    selected3DShape,
}) => (
    <div className="flex flex-col h-full">
        <div className="flex-grow overflow-auto p-4">
            <div className="space-y-4">
                {diagramComponents.map((component) => (
                    <div
                        key={component.id}
                        className={`p-4 rounded-lg ${selected3DShape === component.id ? 'bg-blue-800' : 'bg-gray-800'}`}
                        onClick={() => onSelect3DShape(component.id)}
                    >
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-semibold">{component.shape}</h3>
                            <Button onClick={(e) => {
                                e.stopPropagation();
                                onRemove3DShape(component.id);
                            }}>
                                Remove
                            </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <div>
                                <span className="font-semibold">Position:</span> {component.position}
                            </div>
                            <div>
                                <span className="font-semibold">Relative To:</span> {component.relativeToId ? diagramComponents.find(c => c.id === component.relativeToId)?.shape : 'None'}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-1">Attached 2D Shapes:</h4>
                            {component.attached2DShapes.length > 0 ? (
                                <ul className="space-y-2">
                                    {component.attached2DShapes.map((shape, i) => (
                                        <li key={i} className="flex justify-between items-center bg-gray-700 p-2 rounded">
                                            <span>{shape.name} (attached to {shape.attachedTo})</span>
                                            <Button className="ml-2 text-xs" onClick={(e) => {
                                                e.stopPropagation();
                                                onRemove2DShape(component.id, i)
                                            }}>
                                                Remove
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-400">No 2D shapes attached</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export default CompositionPanel;