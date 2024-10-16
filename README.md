# SVG Isometric Shapes Compiler

## Description

The SVG Isometric Shapes Compiler is a powerful web application that allows users to create complex isometric diagrams by combining 3D and 2D SVG shapes. This tool is perfect for designers, architects, and anyone who needs to create detailed isometric illustrations for presentations, documentation, or visual aids.

[Try the demo online](https://bijoor.github.io/isometric-diagram-builder/)

## Features

- Drag-and-drop interface for easy shape placement
- Library of pre-defined 3D and 2D SVG shapes
- Ability to combine shapes to create complex isometric diagrams
- Google Drive integration for loading custom shape libraries
- Save and load diagram compositions
- Export diagrams as SVG files
- Customizable canvas size
- Zoom and pan functionality for detailed editing

## Getting Started

### Creating a Library of SVG Shapes

The application uses two types of shapes:

1. **3D Shapes**: These are the base shapes that form the main structure of your isometric diagram. They typically have three faces: top, front, and side.

2. **2D Shapes**: These are flat shapes that can be attached to the faces of 3D shapes to add details or decorations.

To create a library of shapes:

1. Create SVG files for each shape you want to include in your library.
2. For 3D shapes, ensure that the SVG includes elements with IDs "top-face", "front-face", and "side-face".
3. For 2D shapes, include an element with ID "attach-point" to specify where it should connect to a 3D shape.
4. Create a CSV file with columns: name, svgFile, type (3D or 2D), and attachTo (for 2D shapes, specifying which face they can attach to).
5. Upload your SVG files and CSV to a Google Drive folder.

### Using the Application

![Screenshot of the main application interface](./images/ui-shapes.png)

The application interface is divided into three main sections:

1. **Left Panel**: Contains tabs for Shapes, Composition, and Settings.
2. **Main Canvas**: Displays the current diagram composition.
3. **Top Bar**: Provides options for saving, loading, and exporting diagrams.

#### Steps to Create a Diagram:

1. Load your shape library using the Settings tab.
2. Switch to the Shapes tab and add 3D shapes to your canvas.
3. Select a 3D shape and add 2D shapes to its faces as desired.
4. Use the Composition tab to adjust the positioning and layering of shapes.
5. Fine-tune your diagram using the zoom and pan controls on the canvas.
6. Save your work or export the final SVG using the options in the Settings tab.

![Screenshot of a sample diagram creation process](./images/ui-composition.png)

## Outcomes

Users can achieve the following outcomes:

- Create complex isometric diagrams for architectural layouts, network diagrams, or infographics.
- Design custom shape libraries for specific project needs.
- Collaborate on diagram designs by sharing composition files.
- Export high-quality SVG diagrams for use in presentations or publications.

## Settings Panel

![Settings Panel](./images/ui-settings.png)

The Settings panel allows you to configure various aspects of your diagram and the application. Here's a breakdown of the options:

### Canvas Size
- **Width**: Set the width of your canvas in pixels. Default is 1000.
- **Height**: Set the height of your canvas in pixels. Default is 1000.

### Diagram Settings
- **File Name**: Enter the name for your SVG file when saving or downloading. In the example, it's set to "bricks.svg".
- **Folder Path**: Specify the folder path where diagrams will be saved and loaded from. In this case, it's set to "My Diagrams".
- **Clip SVG to contents**: When checked, this option will trim the SVG to the content's boundaries, removing any excess blank space.

### Diagram Actions
- **Save Diagram**: Click to save your current diagram composition.
- **Load Diagram**: Click to load a previously saved diagram.
- **Download SVG**: Click to download your diagram as an SVG file.

### Shapes Library Settings
- **Spreadsheet URL**: Enter the URL of the Google Sheets document containing your shapes library index.
- **Folder URL**: Enter the URL of the Google Drive folder containing your SVG shape files.
- **Load Shapes from Google Drive**: Click this button to load your custom shape library from the specified Google Drive locations.

The Settings panel provides crucial functionality for managing your diagrams and customizing the application to suit your needs. It allows you to control the canvas size, manage file operations, and set up your custom shape library, making it an essential part of the SVG Isometric Shapes Compiler workflow.

## Contributing

We welcome contributions to improve the SVG Isometric Shapes Compiler! Here's how you can contribute:

1. Fork the repository on GitHub.
2. Clone your forked repository to your local machine.
3. Create a new branch for your feature or bug fix.
4. Make your changes and commit them with clear, descriptive messages.
5. Push your changes to your fork on GitHub.
6. Create a pull request from your fork to the main repository.

## Code Structure

The project structure is as follows:

```
.
├── src/
│   ├── components/
│   │   └── ui/
│   │       ├── Accordion.tsx
│   │       ├── Button.tsx
│   │       ├── Checkbox.tsx
│   │       ├── Dialog.tsx
│   │       ├── Input.tsx
│   │       ├── Select.tsx
│   │       └── ToggleGroup.tsx
│   ├── lib/
│   │   ├── diagramComponentsLib.ts
│   │   ├── googleDriveLib.ts
│   │   ├── svgUtils.ts
│   │   └── utils.ts
│   ├── panels/
│   │   ├── CompositionPanel.tsx
│   │   ├── SettingsPanel.tsx
│   │   └── ShapesPanel.tsx
│   ├── App.tsx
│   ├── App.css
│   ├── ImprovedLayout.tsx
│   ├── SVGDisplay.tsx
│   ├── DiagramComponentsDisplay.tsx
│   ├── Types.ts
│   ├── config.ts
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── public/
├── dist/
├── index.html
└── various configuration files
```

Key files and their roles:

- `src/App.tsx`: The main application component that manages the overall state and composition of the application.
- `src/ImprovedLayout.tsx`: Defines the layout of the application, including the panel structure and SVG display area.
- `src/SVGDisplay.tsx`: Handles the rendering and interaction with the SVG canvas where the isometric diagram is displayed.
- `src/DiagramComponentsDisplay.tsx`: Displays the current components in the diagram.
- `src/Types.ts`: Contains TypeScript type definitions used throughout the application.
- `src/config.ts`: Holds configuration settings for the application.

- `src/components/ui/`: Contains reusable UI components like buttons, dialogs, and form elements.

- `src/lib/`:
  - `diagramComponentsLib.ts`: Contains functions for manipulating diagram components.
  - `googleDriveLib.ts`: Handles integration with Google Drive API for loading and saving diagrams.
  - `svgUtils.ts`: Utility functions for SVG manipulation and processing.
  - `utils.ts`: General utility functions used across the application.

- `src/panels/`:
  - `CompositionPanel.tsx`: Manages the composition of 3D and 2D shapes in the diagram.
  - `SettingsPanel.tsx`: Handles application settings and diagram export options.
  - `ShapesPanel.tsx`: Displays available shapes and allows adding them to the diagram.

- `index.html`: The main HTML file that serves as the entry point for the application.
- `vite.config.ts`, `tsconfig.json`, etc.: Configuration files for the build process and TypeScript compilation.

This structure follows a modular approach, separating concerns into different components and utility files. The `src/components/ui/` directory contains reusable UI components, while `src/panels/` contains the main functional areas of the application. The `src/lib/` directory houses utility functions and core logic for diagram manipulation and integration with external services.

### Development Workflow

1. Choose an issue to work on or create a new one for your proposed feature/fix.
2. Create a new branch for your work.
3. Develop and test your changes locally.
4. Ensure your code follows the project's coding standards and practices.
5. Update documentation as necessary.
6. Create a pull request with a clear description of your changes.

## Acknowledgements

This project was made possible through the innovation engineering expertise provided by Accion Labs. Their commitment to pushing the boundaries of technology and fostering creative solutions has been instrumental in the development of the SVG Isometric Shapes Compiler.

We extend our sincere gratitude to the team at Accion Labs for their support, guidance, and contributions to this project.