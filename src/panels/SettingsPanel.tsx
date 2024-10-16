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
}) => (
    <div className="flex flex-col h-full p-2">
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

export default SettingsPanel;