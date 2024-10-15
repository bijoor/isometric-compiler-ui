import React, { useState, useCallback } from 'react';
import { Button } from './components/ui/Button';
import SVGDisplay from './SVGDisplay';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './components/ui/Dialog';
import { Input } from './components/ui/Input';
import { ToggleGroup, ToggleGroupOption } from './components/ui/ToggleGroup';
import { Checkbox } from './components/ui/Checkbox';
import { DiagramComponent, Shape } from './Types';
import { loadShapesFromGoogleDrive } from './GoogleDriveUtils';

interface ImprovedLayoutProps {
    svgLibrary: Shape[];
    diagramComponents: DiagramComponent[];
    selected3DShape: string | null;
    canvasSize: { width: number; height: number };
    composedSVG: string;
    onAdd3DShape: (shapeName: string, position: 'top' | 'front-right' | 'front-left') => void;
    onAdd2DShape: (shapeName: string, attachTo: string) => void;
    onRemove3DShape: (id: string) => void;
    onRemove2DShape: (parentId: string, shapeIndex: number) => void;
    onSelect3DShape: (id: string | null) => void;
    onSetCanvasSize: (size: { width: number; height: number }) => void;
    onUpdateSvgLibrary: (newLibrary: Shape[]) => void;
    onDownloadSVG: () => void;
    fileName: string;
    setFileName: (name: string) => void;
    clipToContents: boolean;
    setClipToContents: (clip: boolean) => void;
    onGetBoundingBox: (boundingBox: { x: number, y: number, width: number, height: number } | null) => void;
    spreadsheetUrl: string;
    setSpreadsheetUrl: (url: string) => void;
    folderUrl: string;
    setFolderUrl: (url: string) => void;
}

const ImprovedLayout: React.FC<ImprovedLayoutProps> = ({
    svgLibrary,
    diagramComponents,
    selected3DShape,
    canvasSize,
    composedSVG,
    onAdd3DShape,
    onAdd2DShape,
    onRemove3DShape,
    onRemove2DShape,
    onSelect3DShape,
    onSetCanvasSize,
    onUpdateSvgLibrary,
    onDownloadSVG,
    fileName,
    setFileName,
    clipToContents,
    setClipToContents,
    onGetBoundingBox,
    spreadsheetUrl,
    setSpreadsheetUrl,
    folderUrl,
    setFolderUrl,
}) => {
    const [activePanel, setActivePanel] = useState<'shapes' | 'composition' | 'settings'>('shapes');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingProgress, setLoadingProgress] = useState<{ currentFile: string; loadedFiles: number; totalFiles: number } | null>(null);

    const handleSelect3DShape = useCallback((id: string | null) => {
        console.log('ImprovedLayout: Selecting 3D shape:', id);
        onSelect3DShape(id);
    }, [onSelect3DShape]);

    const handleLoadFromGoogleDrive = async () => {
        if (!spreadsheetUrl || !folderUrl) {
            setError('Please provide both Spreadsheet URL and Folder URL in the settings.');
            setIsDialogOpen(true);
            return;
        }

        setError(null);
        setLoadingProgress(null);
        setIsDialogOpen(true);

        try {
            const newLibrary = await loadShapesFromGoogleDrive(spreadsheetUrl, folderUrl, (progress) => {
                setLoadingProgress(progress);
            });
            onUpdateSvgLibrary(newLibrary);
            // Keep the dialog open for a moment to show completion
            setTimeout(() => setIsDialogOpen(false), 1000);
        } catch (err) {
            if (err instanceof Error) {
                setError(`Error loading shapes: ${err.message}`);
            } else {
                setError('An unknown error occurred while loading shapes.');
            }
        } finally {
            setLoadingProgress(null);
        }
    };

    return (
        <div className="flex flex-row h-screen w-screen bg-gray-900 text-white">
            {/* Left side control panels */}
            <div className="flex flex-col border-r border-gray-700 w-1/3">
                {/* Tab buttons */}
                <div className="flex flex-row h-14 border-b border-gray-700">
                    <button
                        className={`flex-col w-1/3 py-2 ${activePanel === 'shapes' ? 'bg-blue-600' : 'bg-gray-800'}`}
                        onClick={() => setActivePanel('shapes')}
                    >
                        Shapes
                    </button>
                    <button
                        className={`flex-col w-1/3 py-2 ${activePanel === 'composition' ? 'bg-blue-600' : 'bg-gray-800'}`}
                        onClick={() => setActivePanel('composition')}
                    >
                        Composition
                    </button>
                    <button
                        className={`flex-col w-1/3 py-2 ${activePanel === 'settings' ? 'bg-blue-600' : 'bg-gray-800'}`}
                        onClick={() => setActivePanel('settings')}
                    >
                        Settings
                    </button>
                </div>

                {/* Panel content */}
                <div className="flex-grow overflow-auto">
                    {activePanel === 'shapes' && (
                        <ShapesPanel
                            svgLibrary={svgLibrary}
                            onAdd3DShape={onAdd3DShape}
                            onAdd2DShape={onAdd2DShape}
                            selected3DShape={selected3DShape}
                            diagramComponents={diagramComponents}
                        />
                    )}
                    {activePanel === 'composition' && (
                        <CompositionPanel
                            diagramComponents={diagramComponents}
                            onRemove3DShape={onRemove3DShape}
                            onRemove2DShape={onRemove2DShape}
                            onSelect3DShape={handleSelect3DShape}
                            selected3DShape={selected3DShape}
                        />
                    )}
                    {activePanel === 'settings' && (
                        <SettingsPanel
                            canvasSize={canvasSize}
                            onSetCanvasSize={onSetCanvasSize}
                            onOpenGoogleDriveDialog={() => setIsDialogOpen(true)}
                            fileName={fileName}
                            setFileName={setFileName}
                            clipToContents={clipToContents}
                            setClipToContents={setClipToContents}
                            spreadsheetUrl={spreadsheetUrl}
                            setSpreadsheetUrl={setSpreadsheetUrl}
                            folderUrl={folderUrl}
                            setFolderUrl={setFolderUrl}
                            onLoadShapesFromGoogleDrive={handleLoadFromGoogleDrive}
                        />
                    )}
                </div>
            </div>

            {/* Right side SVG display */}
            <div className="flex flex-col flex-grow">
                <h2 className="text-xl h-14 font-semibold p-4">Composed SVG:</h2>
                <SVGDisplay
                    svgContent={composedSVG}
                    selected3DShape={selected3DShape}
                    onSelect3DShape={handleSelect3DShape}
                    onDownloadSVG={onDownloadSVG}
                    onGetBoundingBox={onGetBoundingBox}
                    canvasSize={canvasSize}
                />
            </div>

            {/* Google Drive Folder URL Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-gray-800 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-white">Loading Shapes from Google Drive</DialogTitle>
                        <DialogDescription className="text-gray-300">
                            Please wait while we load the shapes from your Google Drive.
                        </DialogDescription>
                    </DialogHeader>
                    {error && (
                        <div className="mt-4">
                            <p className="text-red-400">{error}</p>
                            <Button onClick={() => setIsDialogOpen(false)} className="mt-2">
                                Close
                            </Button>
                        </div>
                    )}
                    {loadingProgress && (
                        <div className="mt-4 text-white">
                            <p>Loading: {loadingProgress.currentFile}</p>
                            <p>Progress: {loadingProgress.loadedFiles} / {loadingProgress.totalFiles}</p>
                            <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                                <div
                                    className="bg-blue-500 h-2.5 rounded-full"
                                    style={{ width: `${(loadingProgress.loadedFiles / loadingProgress.totalFiles) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

interface ShapesPanelProps {
    svgLibrary: Shape[];
    onAdd3DShape: (shapeName: string, position: 'top' | 'front-right' | 'front-left') => void;
    onAdd2DShape: (shapeName: string, attachTo: string) => void;
    selected3DShape: string | null;
    diagramComponents: DiagramComponent[];
}

const ShapesPanel: React.FC<ShapesPanelProps> = ({ svgLibrary, onAdd3DShape, onAdd2DShape, selected3DShape, diagramComponents }) => {
    const [selectedPosition, setSelectedPosition] = useState<'top' | 'front-right' | 'front-left'>('top');

    const positionOptions: ToggleGroupOption[] = [
        { value: 'top', label: 'Top' },
        { value: 'front-left', label: 'Front Left' },
        { value: 'front-right', label: 'Front Right' },
    ];

    const shouldDisable3DShapeButtons = () => {
        return diagramComponents.length > 0 && selected3DShape === null;
    };

    return (
        <div className="flex flex-col h-full">
            <div className="h-1/2 overflow-auto">
                <h2 className="text-xl font-semibold mb-4 p-4">3D Shapes</h2>
                <div className="mb-4 px-4">
                    <label className="block mb-2">Position for next 3D shape:</label>
                    <ToggleGroup
                        options={positionOptions}
                        value={selectedPosition}
                        onValueChange={(value) => setSelectedPosition(value as 'top' | 'front-right' | 'front-left')}
                    />
                </div>
                <div className="px-4">
                    <table className="w-full mb-8">
                        <thead>
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
                                            onClick={() => onAdd3DShape(shape.name, selectedPosition)}
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

            <div className="h-1/2 overflow-auto">
                <h2 className="text-xl font-semibold mb-4 p-4">2D Shapes</h2>
                <div className="px-4">
                    <table className="w-full">
                        <thead>
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
            </div>
        </div>
    );
};

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
            <h2 className="text-xl font-semibold mb-4">Composition</h2>
            <div className="space-y-4">
                {diagramComponents.map((component) => (
                    <div
                        key={component.id}
                        className={`p-4 rounded-lg ${selected3DShape === component.id ? 'bg-blue-800' : 'bg-gray-800'}`}
                        onClick={() => onSelect3DShape(component.id)}
                    >
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-semibold">{component.shape}</h3>
                            <Button onClick={() => onRemove3DShape(component.id)}>Remove</Button>
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
                                            <Button onClick={() => onRemove2DShape(component.id, i)} className="ml-2 text-xs">Remove</Button>
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

interface SettingsPanelProps {
    canvasSize: { width: number; height: number };
    onSetCanvasSize: (size: { width: number; height: number }) => void;
    onOpenGoogleDriveDialog: () => void;
    fileName: string;
    setFileName: (name: string) => void;
    clipToContents: boolean;
    setClipToContents: (clip: boolean) => void;
    spreadsheetUrl: string;
    setSpreadsheetUrl: (url: string) => void;
    folderUrl: string;
    setFolderUrl: (url: string) => void;
    onLoadShapesFromGoogleDrive: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
    canvasSize,
    onSetCanvasSize,
    onOpenGoogleDriveDialog,
    fileName,
    setFileName,
    clipToContents,
    setClipToContents,
    spreadsheetUrl,
    setSpreadsheetUrl,
    folderUrl,
    setFolderUrl,
    onLoadShapesFromGoogleDrive,
}) => (
    <div className="flex flex-col h-full p-4">
        <h2 className="text-xl font-semibold mb-4">Settings</h2>

        <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Canvas Size</h3>
            <div className="flex space-x-4">
                <div className="flex-1">
                    <label className="block mb-2">Width:</label>
                    <input
                        type="number"
                        value={canvasSize.width}
                        onChange={(e) => onSetCanvasSize({ ...canvasSize, width: parseInt(e.target.value) })}
                        className="w-full bg-gray-700 text-white p-2 rounded"
                    />
                </div>
                <div className="flex-1">
                    <label className="block mb-2">Height:</label>
                    <input
                        type="number"
                        value={canvasSize.height}
                        onChange={(e) => onSetCanvasSize({ ...canvasSize, height: parseInt(e.target.value) })}
                        className="w-full bg-gray-700 text-white p-2 rounded"
                    />
                </div>
            </div>
        </div>

        <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Download Settings</h3>
            <label className="block mb-2">File Name:</label>
            <Input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-full bg-gray-700 text-white p-2 rounded"
                placeholder="diagram.svg"
            />
        </div>
        <div className="flex items-center mb-6">
            <Checkbox
                id="clip-to-contents"
                checked={clipToContents}
                onCheckedChange={(checked) => setClipToContents(checked as boolean)}
                className="mr-2"
            />
            <label htmlFor="clip-to-contents">Clip SVG to contents</label>
        </div>

        <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Shapes Library Settings</h3>
            <p className="my-2 text-slate-500">Add the share url for the Google Spreadsheet and Google Drive Folder where you have saved your shapes library</p>
            <label className="block mb-2">Spreadsheet URL:</label>
            <Input
                type="text"
                value={spreadsheetUrl}
                onChange={(e) => setSpreadsheetUrl(e.target.value)}
                className="w-full bg-gray-700 text-white p-2 rounded mb-2"
                placeholder="https://docs.google.com/spreadsheets/d/..."
            />
            <label className="block my-2">Folder URL:</label>
            <Input
                type="text"
                value={folderUrl}
                onChange={(e) => setFolderUrl(e.target.value)}
                className="w-full bg-gray-700 text-white p-2 rounded mb-2"
                placeholder="https://drive.google.com/drive/folders/..."
            />
            <Button onClick={onLoadShapesFromGoogleDrive} className="w-full my-4">
                Load Shapes from Google Drive
            </Button>
        </div>
    </div>
);

export default ImprovedLayout;