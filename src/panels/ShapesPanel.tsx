import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { ToggleGroup, ToggleGroupOption } from '../components/ui/ToggleGroup';
import { RadixSelect } from '../components/ui/Select';
import { DiagramComponent, Shape } from '../Types';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/ui/Accordion';

interface ShapesPanelProps {
    svgLibrary: Shape[];
    onAdd3DShape: (shapeName: string, position: string, attachmentPoint: string | null) => void;
    onAdd2DShape: (shapeName: string, attachTo: string) => void;
    selected3DShape: string | null;
    diagramComponents: DiagramComponent[];
    availableAttachmentPoints: string[];
}

const ShapesPanel: React.FC<ShapesPanelProps> = ({
    svgLibrary,
    onAdd3DShape,
    onAdd2DShape,
    selected3DShape,
    diagramComponents,
    availableAttachmentPoints
}) => {
    const [selectedPosition, setSelectedPosition] = useState<'top' | 'front-right' | 'front-left' | string>('top');
    const [selectedAttachmentPoint, setSelectedAttachmentPoint] = useState<string>('none');
    const [openPanels, setOpenPanels] = useState<string[]>(['3d-shapes', '2d-shapes']);
    const [filteredAttachmentPoints, setFilteredAttachmentPoints] = useState<string[]>([]);

    const positionOptions: ToggleGroupOption[] = [
        { value: 'top', label: 'Top' },
        { value: 'front-left', label: 'Front Left' },
        { value: 'front-right', label: 'Front Right' },
    ];

    //const filteredAttachmentPoints = useMemo(() => {
    //    const prefix = `${selectedPosition}-`;
    //    return availableAttachmentPoints.filter(point => point.startsWith(prefix));
    //}, [availableAttachmentPoints, selectedPosition]);

    useEffect(() => {
        const updateFilteredAttachmentPoints = () => {
            const prefix = `${selectedPosition}-`;
            const newFilteredPoints = availableAttachmentPoints.filter(point => point.startsWith(prefix));
            setFilteredAttachmentPoints(newFilteredPoints);
    
            // Reset selectedAttachmentPoint if it's no longer valid
            if (newFilteredPoints.length === 0 || !newFilteredPoints.includes(selectedAttachmentPoint)) {
                setSelectedAttachmentPoint('none');
            }
            console.log("ShapesPanel: Updating filtered points");
            console.log(newFilteredPoints);
            };
        updateFilteredAttachmentPoints();
    }, [availableAttachmentPoints, selectedPosition]);

    const attachmentPointOptions = useMemo(() => [
        { value: 'none', label: 'Default' },
        ...filteredAttachmentPoints.map(point => ({ value: point, label: point }))
    ], [filteredAttachmentPoints]);

    const shouldDisable3DShapeButtons = () => {
        return diagramComponents.length > 0 && selected3DShape === null;
    };

    const handlePositionChange = (value: string) => {
        setSelectedPosition(value);
        setSelectedAttachmentPoint('none');
    };

    const handleAttachmentPointChange = (value: string) => {
        setSelectedAttachmentPoint(value);
    };

    const handleAccordionChange = (value: string[]) => {
        setOpenPanels(value);
    };

    const render3DShapesContent = () => (
        <div className="space-y-2">
            <div className="sticky top-0 bg-slate-800 z-10">
                <div className="mb-2">
                    <label className="block mb-2">Position for next 3D shape:</label>
                    <ToggleGroup
                        options={positionOptions}
                        value={selectedPosition}
                        onValueChange={handlePositionChange}
                    />
                </div>
                {filteredAttachmentPoints.length > 0 && (
                    <div className="mb-2">
                        <label className="mb-2 mr-2">Optional Attachment Point:</label>
                        <RadixSelect
                            options={attachmentPointOptions}
                            onChange={handleAttachmentPointChange}
                            placeholder="Select an attachment point"
                            value={selectedAttachmentPoint}
                        />
                    </div>
                )}
            </div>
            <div className="overflow-auto">
                <table className="w-full">
                    <thead className="sticky top-0 bg-gray-800">
                        <tr>
                            <th className="text-left">Name</th>
                            <th className="w-20 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {svgLibrary.filter(shape => shape.type === '3D').map(shape => (
                            <tr key={shape.name}>
                                <td>{shape.name}</td>
                                <td className="text-right">
                                    <Button
                                        onClick={() => onAdd3DShape(shape.name, selectedPosition, selectedAttachmentPoint === 'none' ? null : selectedAttachmentPoint)}
                                        disabled={shouldDisable3DShapeButtons()}
                                    >
                                        Add
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const render2DShapesContent = () => (
        <div className="overflow-auto">
            <table className="w-full">
                <thead className="sticky top-0 bg-gray-800">
                    <tr>
                        <th className="text-left">Name</th>
                        <th className="text-left">Attach To</th>
                        <th className="w-20 text-right">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {svgLibrary.filter(shape => shape.type === '2D').map(shape => (
                        <tr key={shape.name}>
                            <td>{shape.name}</td>
                            <td>{shape.attachTo}</td>
                            <td className="text-right">
                                <Button
                                    onClick={() => onAdd2DShape(shape.name, shape.attachTo || '')}
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
    );

    return (
        <div className="flex flex-col h-full">
            <Accordion
                type="multiple"
                value={openPanels}
                onValueChange={setOpenPanels}
                className="flex flex-col h-full"
            >
                <div className="flex flex-col h-full">
                    <AccordionItem value="3d-shapes" className="flex flex-col min-h-0 border-b border-gray-700">
                        <AccordionTrigger className="p-2 text-xl font-semibold">3D Shapes</AccordionTrigger>
                        <AccordionContent className="flex-grow overflow-auto" fixedHeight="calc(60vh - 2rem)">
                            <div className="p-2">
                                {render3DShapesContent()}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="2d-shapes" className="flex flex-col min-h-0 border-b border-gray-700">
                        <AccordionTrigger className="p-2 text-xl font-semibold">2D Shapes</AccordionTrigger>
                        <AccordionContent className="flex-grow overflow-auto" fixedHeight="calc(40vh - 2rem)">
                            <div className="p-2">
                                {render2DShapesContent()}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </div>
            </Accordion>
        </div>
    );
};

export default ShapesPanel;