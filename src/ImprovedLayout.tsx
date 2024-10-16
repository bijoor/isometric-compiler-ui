import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './components/ui/Dialog';
import { Button } from './components/ui/Button';
import SVGDisplay from './SVGDisplay';
import ShapesPanel from './panels/ShapesPanel';
import CompositionPanel from './panels/CompositionPanel';
import SettingsPanel from './panels/SettingsPanel';
import { DiagramComponent, Shape } from './Types';

interface ImprovedLayoutProps {
    svgLibrary: Shape[];
    diagramComponents: DiagramComponent[];
    selected3DShape: string | null;
    canvasSize: { width: number; height: number };
    composedSVG: string;
    onAdd3DShape: (shapeName: string, position: string, attachmentPoint: string | null) => void;
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
    availableAttachmentPoints: string[];
    onLoadShapesFromGoogleDrive: () => void;
    errorMessage: string | null;
    setErrorMessage: (message: string | null) => void;
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
    availableAttachmentPoints,
    onLoadShapesFromGoogleDrive,
    errorMessage,
    setErrorMessage,
}) => {
    const [activePanel, setActivePanel] = useState<'shapes' | 'composition' | 'settings'>('shapes');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState<{ currentFile: string; loadedFiles: number; totalFiles: number } | null>(null);

    const handleSelect3DShape = useCallback((id: string | null) => {
        console.log('ImprovedLayout: Selecting 3D shape:', id);
        onSelect3DShape(id);
    }, [onSelect3DShape]);

    const handleLoadFromGoogleDrive = async () => {
        if (!spreadsheetUrl || !folderUrl) {
            setErrorMessage('Please provide both Spreadsheet URL and Folder URL in the settings.');
            setIsDialogOpen(true);
            return;
        }

        setErrorMessage(null);
        setLoadingProgress(null);
        setIsDialogOpen(true);

        try {
            await onLoadShapesFromGoogleDrive();
            setTimeout(() => setIsDialogOpen(false), 1000);
        } catch (err) {
            if (err instanceof Error) {
                setErrorMessage(`Error loading shapes: ${err.message}`);
            } else {
                setErrorMessage('An unknown error occurred while loading shapes.');
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
                <div className="flex flex-row h-14 px-2 pt-2 space-x-2 border-b border-gray-700">
                    <button
                        className={`flex-col h-12 w-1/3 py-2 ${activePanel === 'shapes' ? 'bg-blue-600' : 'bg-gray-800'}`}
                        onClick={() => setActivePanel('shapes')}
                    >
                        Shapes
                    </button>
                    <button
                        className={`flex-col h-12 w-1/3 py-2 ${activePanel === 'composition' ? 'bg-blue-600' : 'bg-gray-800'}`}
                        onClick={() => setActivePanel('composition')}
                    >
                        Composition
                    </button>
                    <button
                        className={`flex-col h-12 w-1/3 py-2 ${activePanel === 'settings' ? 'bg-blue-600' : 'bg-gray-800'}`}
                        onClick={() => setActivePanel('settings')}
                    >
                        Settings
                    </button>
                </div>

                {/* Panel content */}
                <div className="flex-grow overflow-hidden">
                    {activePanel === 'shapes' && (
                        <ShapesPanel
                            svgLibrary={svgLibrary}
                            onAdd3DShape={onAdd3DShape}
                            onAdd2DShape={onAdd2DShape}
                            selected3DShape={selected3DShape}
                            diagramComponents={diagramComponents}
                            availableAttachmentPoints={availableAttachmentPoints}
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
                    {errorMessage && (
                        <div className="mt-4">
                            <p className="text-red-400">{errorMessage}</p>
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

export default ImprovedLayout;