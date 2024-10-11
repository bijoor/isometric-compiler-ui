import React from 'react';

// Import the DiagramComponent interface from App.tsx
import type { DiagramComponent } from './App';

interface DiagramComponentsDisplayProps {
  components: DiagramComponent[];
}

const DiagramComponentsDisplay: React.FC<DiagramComponentsDisplayProps> = ({ components }) => {
  return (
    <div className="mt-4">
      <h2 className="text-xl font-semibold mb-2">Current Diagram Components:</h2>
      {components.length === 0 ? (
        <p>No components added yet.</p>
      ) : (
        <ul className="list-disc pl-5">
          {components.map((component, index) => (
            <li key={index} className="mb-2">
              <strong>{component.shape}</strong> (Position: {component.position})
              <ul className="list-circle pl-5">
                <li>Attachment Points: {component.attachmentPoints.map(ap => ap.name).join(', ')}</li>
                {component.attached2DShapes.length > 0 && (
                  <li>
                    Attached 2D Shapes:
                    <ul className="list-square pl-5">
                      {component.attached2DShapes.map((shape, i) => (
                        <li key={i}>
                          {shape.name} (attached to {shape.attachedTo})
                        </li>
                      ))}
                    </ul>
                  </li>
                )}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DiagramComponentsDisplay;