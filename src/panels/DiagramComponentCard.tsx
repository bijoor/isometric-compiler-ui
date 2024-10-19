import React from 'react';
import { Button } from '../components/ui/Button';
import { DiagramComponent } from '../Types';
import { handleWithStopPropagation } from '../lib/eventUtils';

interface DiagramComponentCardProps {
    component: DiagramComponent;
    index: number;
    parentIndex: number | null;
    isSelected: boolean;
    isCut: boolean;
    isCopied: boolean;
    isFirst: boolean;
    onSelect: (id: string) => void;
    onCut: (id: string) => void;
    onCopy: (id: string) => void;
    onRemove: (id: string) => void;
    onCancelCut: (id: string) => void;
    onPaste: (id: string) => void;
    onRemove2DShape: (parentId: string, shapeIndex: number) => void;
    onScrollToParent: (parentId: string) => void;
}

const DiagramComponentCard: React.FC<DiagramComponentCardProps> = ({
    component,
    index,
    parentIndex,
    isSelected,
    isCut,
    isCopied,
    isFirst,
    onSelect,
    onCut,
    onCopy,
    onRemove,
    onCancelCut,
    onPaste,
    onRemove2DShape,
    onScrollToParent,
}) => {
    return (
        <div
            className={`p-4 rounded-lg ${isSelected ? 'bg-blue-800' : 'bg-gray-800'}`}
            onClick={(e) => handleWithStopPropagation(e, () => onSelect(component.id))}
        >
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">{component.shape} (3D-{index + 1})</h3>
                <div>
                    {isCut ? (
                        isFirst && (
                            <>
                                <Button onClick={(e) => handleWithStopPropagation(e, () => onCancelCut(component.id))} className="mr-2">
                                    Cancel
                                </Button>
                                <Button onClick={(e) => handleWithStopPropagation(e, () => onPaste(component.id))} className="mr-2">
                                    Paste
                                </Button>
                                <Button onClick={(e) => handleWithStopPropagation(e, () => onRemove(component.id))}>
                                    Remove
                                </Button>
                            </>
                        )
                    ) : (
                        isCopied ? (
                            isFirst && (
                                <>
                                    <Button onClick={(e) => handleWithStopPropagation(e, () => onPaste(component.id))} className="mr-2">
                                        Paste
                                    </Button>
                                    <Button onClick={(e) => handleWithStopPropagation(e, () => onCancelCut(component.id))} className="mr-2">
                                        Cancel
                                    </Button>

                                </>
                            )
                        ) : (
                            <>
                                <Button
                                    onClick={(e) => handleWithStopPropagation(e, () => onCopy(component.id))}
                                    className="mr-2"
                                >
                                    Copy
                                </Button>
                                <Button
                                    onClick={(e) => handleWithStopPropagation(e, () => onCut(component.id))}
                                    className="mr-2"
                                    disabled={isFirst}
                                >
                                    Cut
                                </Button>
                                <Button onClick={(e) => handleWithStopPropagation(e, () => onRemove(component.id))}>
                                    Remove
                                </Button>
                            </>
                        ))}
                </div>
            </div>
            {!isCut && !isCopied && (
                <>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                            <span className="font-semibold">Position:</span> {component.position}
                        </div>
                        <div>
                            <span className="font-semibold">Relative To:</span> {
                                parentIndex !== null ? (
                                    <button
                                        className="text-blue-400 hover:underline"
                                        onClick={(e) => handleWithStopPropagation(e, () => onScrollToParent(component.relativeToId!))}
                                    >
                                        3D-{parentIndex + 1}
                                    </button>
                                ) : 'None'
                            }
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-1">Attached 2D Shapes:</h4>
                        {component.attached2DShapes.length > 0 ? (
                            <ul className="space-y-2">
                                {component.attached2DShapes.map((shape, i) => (
                                    <li key={i} className="flex justify-between items-center bg-gray-700 p-2 rounded">
                                        <span>{shape.name} (attached to {shape.attachedTo})</span>
                                        <Button
                                            className="ml-2 text-xs"
                                            onClick={(e) => handleWithStopPropagation(e, () => onRemove2DShape(component.id, i))}
                                        >
                                            Remove
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-400">No 2D shapes attached</p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default DiagramComponentCard;