import React from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Checkbox } from '../components/ui/Checkbox';

interface SettingsPanelProps {
    canvasSize: { width: number; height: number };
    onSetCanvasSize: (size: { width: number; height: number }) => void;
    fileName: string;
    setFileName: (name: string) => void;
    clipToContents: boolean;
    setClipToContents: (clip: boolean) => void;
    spreadsheetUrl: string;
    setSpreadsheetUrl: (url: string) => void;
    folderUrl: string;
    setFolderUrl: (url: string) => void;
    onLoadShapesFromGoogleDrive: () => void;
    onSaveDiagram: () => void;
    onLoadDiagram: () => void;
    folderPath: string;
    setFolderPath: (path: string) => void;
    onDownloadSVG: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
    canvasSize,
    onSetCanvasSize,
    fileName,
    setFileName,
    clipToContents,
    setClipToContents,
    spreadsheetUrl,
    setSpreadsheetUrl,
    folderUrl,
    setFolderUrl,
    onLoadShapesFromGoogleDrive,
    onSaveDiagram,
    onLoadDiagram,
    folderPath,
    setFolderPath,
    onDownloadSVG,
}) => (
    <div className="flex flex-col h-full p-4 overflow-y-auto">
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
            <h3 className="text-lg font-semibold mb-2">Diagram Settings</h3>
            <label className="block mb-2">File Name:</label>
            <Input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-full bg-gray-700 text-white p-2 rounded mb-2"
                placeholder="diagram.svg"
            />
            <label className="block mb-2">Folder Path:</label>
            <Input
                type="text"
                value={folderPath}
                onChange={(e) => setFolderPath(e.target.value)}
                className="w-full bg-gray-700 text-white p-2 rounded mb-2"
                placeholder="My Diagrams"
            />
            <p className="text-sm text-gray-400 mb-2">
                Note: This folder path will be used for both saving and loading diagrams.
            </p>
            <div className="flex items-center mb-4">
                <Checkbox
                    id="clip-to-contents"
                    checked={clipToContents}
                    onCheckedChange={(checked) => setClipToContents(checked as boolean)}
                    className="mr-2"
                />
                <label htmlFor="clip-to-contents">Clip SVG to contents</label>
            </div>
            <div className="flex space-x-2">
                <Button onClick={onSaveDiagram} className="flex-1">
                    Save Diagram
                </Button>
                <Button onClick={onLoadDiagram} className="flex-1">
                    Load Diagram
                </Button>
                <Button onClick={onDownloadSVG} className="flex-1">
                    Download SVG
                </Button>
            </div>
        </div>

        <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Shapes Library Settings</h3>
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
            <Button onClick={onLoadShapesFromGoogleDrive} className="w-full mt-2">
                Load Shapes from Google Drive
            </Button>
        </div>
    </div>
);

export default SettingsPanel;