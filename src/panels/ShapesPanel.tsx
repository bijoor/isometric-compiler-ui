import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { DiagramComponent, Shape } from '../Types';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/ui/Accordion';

interface ShapesPanelProps {
    svgLibrary: Shape[];
    onAdd3DShape: (shapeName: string) => void;
    onAdd2DShape: (shapeName: string, attachTo: string) => void;
    selected3DShape: string | null;
    diagramComponents: DiagramComponent[];
}

const ShapesPanel: React.FC<ShapesPanelProps> = ({
    svgLibrary,
    onAdd3DShape,
    onAdd2DShape,
    selected3DShape,
    diagramComponents,
}) => {
    const [openPanels, setOpenPanels] = useState<string[]>(['3d-shapes', '2d-shapes']);

    const shouldDisable3DShapeButtons = () => {
        return diagramComponents.length > 0 && selected3DShape === null;
    };

    const handleAccordionChange = (value: string[]) => {
        setOpenPanels(value);
    };

    const render3DShapesContent = () => (
        <div className="space-y-2">
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
                                        onClick={() => onAdd3DShape(shape.name)}
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
                onValueChange={handleAccordionChange}
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