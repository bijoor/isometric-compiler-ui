import React, { useState, useEffect } from 'react';
import { Button } from './components/ui/Button';
import { RadixSelect } from './components/ui/Select';
import { config } from './config';

interface Shape {
  name: string;
  type: string;
  face?: string;
  svgContent: string;
}

interface DiagramComponent {
  shape: string;
  position: 'center' | 'top' | 'front-right' | 'front-left' | 'back-right' | 'back-left';
  top: string[];
  front: string[];
  side: string[];
}

const App: React.FC = () => {
  const [svgLibrary, setSvgLibrary] = useState<Shape[]>([]);
  const [diagramComponents, setDiagramComponents] = useState<DiagramComponent[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 1000, height: 1000 });
  const [composedSVG, setComposedSVG] = useState<string>('');
  const [selected3DShape, setSelected3DShape] = useState<number | null>(null);
  const [newPosition, setNewPosition] = useState<'top' | 'front-right' | 'front-left' | 'back-right' | 'back-left'>('top');

  useEffect(() => {
    fetchSvgLibrary();
  }, []);

  useEffect(() => {
    compileDiagram();
  }, [diagramComponents, canvasSize]);

  const fetchSvgLibrary = async () => {
    try {
      const response = await fetch(`${config.serverUrl}/shapes`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Shape[] = await response.json();
      setSvgLibrary(data);
    } catch (error) {
      console.error('Error fetching SVG library:', error);
    }
  };

  const add3DShape = (shapeName: string) => {
    const newComponent: DiagramComponent = {
      shape: shapeName,
      position: diagramComponents.length === 0 ? 'center' : newPosition,
      top: [],
      front: [],
      side: []
    };
    setDiagramComponents(prevComponents => [...prevComponents, newComponent]);
    setSelected3DShape(diagramComponents.length);
  };

  const add2DShape = (shapeName: string, face: 'top' | 'front' | 'side') => {
    if (selected3DShape !== null) {
      setDiagramComponents(prevComponents => {
        return prevComponents.map((component, index) => {
          if (index === selected3DShape) {
            return {
              ...component,
              [face]: [...component[face], shapeName]
            };
          }
          return component;
        });
      });
    }
  };

  const remove3DShape = (index: number) => {
    setDiagramComponents(prevComponents => prevComponents.filter((_, i) => i !== index));
    if (selected3DShape === index) {
      setSelected3DShape(null);
    } else if (selected3DShape !== null && selected3DShape > index) {
      setSelected3DShape(selected3DShape - 1);
    }
  };

  const remove2DShape = (shapeIndex: number, face: 'top' | 'front' | 'side') => {
    if (selected3DShape !== null) {
      setDiagramComponents(prevComponents => {
        return prevComponents.map((component, index) => {
          if (index === selected3DShape) {
            return {
              ...component,
              [face]: component[face].filter((_, i) => i !== shapeIndex)
            };
          }
          return component;
        });
      });
    }
  };

  const compileDiagram = () => {
    console.log('Compiling diagram...');
    const svgNamespace = "http://www.w3.org/2000/svg";
    
    // Create a hidden SVG element for temporary rendering
    const hiddenSvg = document.createElementNS(svgNamespace, "svg");
    hiddenSvg.style.position = "absolute";
    //hiddenSvg.style.width = "0";
    //hiddenSvg.style.height = "0";
    //hiddenSvg.style.overflow = "hidden";
    document.body.appendChild(hiddenSvg);
  
    // Function to get bounding box of an SVG element
    const getBoundingBox = (svgComponent) => {
      const tempContainer = document.createElementNS(svgNamespace, "g");
      tempContainer.appendChild(svgComponent.cloneNode(true));
      hiddenSvg.appendChild(tempContainer);
      const bbox = tempContainer.getBBox();
      hiddenSvg.removeChild(tempContainer);
      return bbox;
    };
  
    const svgElement = document.createElementNS(svgNamespace, "svg");
    svgElement.setAttribute("width", canvasSize.width.toString());
    svgElement.setAttribute("height", canvasSize.height.toString());
    svgElement.setAttribute("viewBox", `0 0 ${canvasSize.width} ${canvasSize.height}`);
  
    diagramComponents.forEach((component, index) => {
      console.log(`Processing component:`, component);
      const shape3D = svgLibrary.find(shape => shape.name === component.shape);
      if (shape3D) {
        console.log(`Found 3D shape:`, shape3D);
        const parser = new DOMParser();
        const doc = parser.parseFromString(shape3D.svgContent, "image/svg+xml");
        const shape3DElement = doc.documentElement;
        
        let transform = '';
        if (index === 0) {
          const centerX = canvasSize.width / 2;
          const centerY = canvasSize.height / 2;
          transform = `translate(${centerX}, ${centerY})`;
        } else {
          transform = `translate(${100 * index}, ${100 * index})`;
        }
  
        shape3DElement.setAttribute('transform', transform);
        console.log(`Appending 3D shape with transform:`, transform);
  
        // Attach 2D shapes to faces
        ['top', 'front', 'side'].forEach(face => {
          const faceElement = shape3DElement.querySelector(`#${face}-face`);
          //console.log(`Face element for ${face}:`, faceElement);
          if (faceElement) {
            const faceBBox = getBoundingBox(faceElement);
            console.log(`Face BBox for ${face}:`, faceBBox);
  
            component[face].forEach(shape2DName => {
              console.log(`Processing 2D shape: ${shape2DName} for face: ${face}`);
              const shape2D = svgLibrary.find(shape => shape.name === shape2DName);
              if (shape2D) {
                // Create and transform 2D shape element
                const shape2DElement = parser.parseFromString(shape2D.svgContent, "image/svg+xml").documentElement;
                // Create a group for the 2D shape and set its ID
                const shape2DGroup = document.createElementNS(svgNamespace, "g");
                shape2DGroup.setAttribute("id", `${face}-${shape2DName}`);
                // Move all child nodes of shape2DElement to shape2DGroup
                while (shape2DElement.firstChild) {
                  shape2DGroup.appendChild(shape2DElement.firstChild);
                }
                

                console.log(`Found 2D shape:`, shape2D);
                const shape2DBBox = getBoundingBox(shape2DGroup);
                console.log(`2D Shape BBox:`, shape2DBBox);
  
                // Calculate scaling to fit the shape within the face
                const scaleX = faceBBox.width / shape2DBBox.width;
                const scaleY = faceBBox.height / shape2DBBox.height;
                const scale = Math.min(scaleX, scaleY, 1); // Prevent enlarging if shape is bigger than face
                //console.log(`Calculated scale:`, scale);
  
                // Calculate translation
                const dx = faceBBox.x + (faceBBox.width - shape2DBBox.width * scale) / 2;
                const dy = faceBBox.y + (faceBBox.height - shape2DBBox.height * scale) / 2;
                console.log(`Calculated translation: dx=${dx}, dy=${dy}`);
  
                // Transform 2D shape element
                const transform = `translate(${dx}, ${dy}) scale(${scale})`;
                //const transform = `translate(${dx}, ${dy}) scale(1)`;
                //console.log(`Applying transform to 2D shape:`, transform);
                //shape2DElement.setAttribute('transform', transform);
  
                                
                // Apply the transform to the group
                shape2DGroup.setAttribute('transform', transform);
  
                // Append 2D shape group to the 3D shape element
                shape3DElement.appendChild(shape2DGroup);
              } else {
                console.warn(`2D shape not found in library:`, shape2DName);
              }
            });
          } else {
            console.warn(`Face element not found for ${face}`);
          }
        });
  
        svgElement.appendChild(shape3DElement);
      } else {
        console.warn(`3D shape not found in library:`, component.shape);
      }
    });
  
    // Clean up the hidden SVG
    document.body.removeChild(hiddenSvg);
  
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    //console.log('Composed SVG:', svgString);
    setComposedSVG(svgString);
  };

  return (
    <div className="p-4 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Isometric Compiler UI</h1>
      
      <div className="mb-4">
        <label className="block mb-2">Canvas Size:</label>
        <input
          type="number"
          value={canvasSize.width}
          onChange={(e) => setCanvasSize({ ...canvasSize, width: parseInt(e.target.value) })}
          className="mr-2 bg-gray-700 text-white p-2 rounded"
        />
        <input
          type="number"
          value={canvasSize.height}
          onChange={(e) => setCanvasSize({ ...canvasSize, height: parseInt(e.target.value) })}
          className="bg-gray-700 text-white p-2 rounded"
        />
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">3D Shapes</h2>
          <table className="w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {svgLibrary.filter(shape => shape.type === '3D').map(shape => (
                <tr key={shape.name}>
                  <td>{shape.name}</td>
                  <td>
                    <Button onClick={() => add3DShape(shape.name)}>Add</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-2">2D Shapes</h2>
          <table className="w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Face</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {svgLibrary.filter(shape => shape.type === '2D').map(shape => (
                <tr key={shape.name}>
                  <td>{shape.name}</td>
                  <td>{shape.face}</td>
                  <td>
                    <Button 
                      onClick={() => add2DShape(shape.name, shape.face as 'top' | 'front' | 'side')}
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
        
        <div>
          <h2 className="text-xl font-semibold mb-2">Composition</h2>
          {diagramComponents.length > 0 && (
            <div className="mb-4">
              <label className="block mb-2">Position for next 3D shape:</label>
              <RadixSelect
                options={[
                  { value: 'top', label: 'Top' },
                  { value: 'front-right', label: 'Front Right' },
                  { value: 'front-left', label: 'Front Left' },
                  { value: 'back-right', label: 'Back Right' },
                  { value: 'back-left', label: 'Back Left' },
                ]}
                onChange={(value) => setNewPosition(value as 'top' | 'front-right' | 'front-left' | 'back-right' | 'back-left')}
                placeholder="Select position"
              />
            </div>
          )}
          <table className="w-full">
            <thead>
              <tr>
                <th>Select</th>
                <th>Shape</th>
                <th>Position</th>
                <th>2D Shapes</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {diagramComponents.map((component, index) => (
                <tr 
                  key={index} 
                  className={selected3DShape === index ? 'bg-blue-900' : ''}
                >
                  <td>
                    <input
                      type="radio"
                      checked={selected3DShape === index}
                      onChange={() => setSelected3DShape(index)}
                    />
                  </td>
                  <td>{component.shape}</td>
                  <td>{component.position}</td>
                  <td>
                    Top: {component.top.map((shape, i) => (
                      <span key={i}>
                        {shape}
                        <Button onClick={() => remove2DShape(i, 'top')} className="ml-1 text-xs">X</Button>
                        {i < component.top.length - 1 ? ', ' : ''}
                      </span>
                    ))}<br/>
                    Front: {component.front.map((shape, i) => (
                      <span key={i}>
                        {shape}
                        <Button onClick={() => remove2DShape(i, 'front')} className="ml-1 text-xs">X</Button>
                        {i < component.front.length - 1 ? ', ' : ''}
                      </span>
                    ))}<br/>
                    Side: {component.side.map((shape, i) => (
                      <span key={i}>
                        {shape}
                        <Button onClick={() => remove2DShape(i, 'side')} className="ml-1 text-xs">X</Button>
                        {i < component.side.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </td>
                  <td>
                    <Button onClick={() => remove3DShape(index)}>Remove</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {composedSVG && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Composed SVG:</h2>
          <div dangerouslySetInnerHTML={{ __html: composedSVG }} className="bg-white p-4 rounded" style={{minHeight: '200px'}} />
        </div>
      )}
    </div>
  );
};

export default App;