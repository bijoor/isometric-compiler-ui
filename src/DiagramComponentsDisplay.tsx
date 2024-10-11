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
                {component.top.length > 0 && (
                  <li>Top: {component.top.join(', ')}</li>
                )}
                {component.left.length > 0 && (
                  <li>Left: {component.left.join(', ')}</li>
                )}
                {component.right.length > 0 && (
                  <li>Side: {component.right.join(', ')}</li>
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