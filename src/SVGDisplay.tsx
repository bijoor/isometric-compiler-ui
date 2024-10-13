import React, { useState, useRef, useEffect } from 'react';
import { Button } from './components/ui/Button';

interface SVGDisplayProps {
  svgContent: string;
  selected3DShape: string | null;
  onSelect3DShape: (id: string | null) => void;
}

const SVGDisplay: React.FC<SVGDisplayProps> = ({ svgContent, selected3DShape, onSelect3DShape }) => {
  const [scale, setScale] = useState(1);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 1000, height: 1000 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fitSvgToContainer = () => {
      if (svgRef.current && containerRef.current) {
        const svg = svgRef.current;
        const container = containerRef.current;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const svgAspectRatio = viewBox.width / viewBox.height;
        const containerAspectRatio = containerWidth / containerHeight;

        let newWidth, newHeight;
        if (containerAspectRatio > svgAspectRatio) {
          newHeight = containerHeight;
          newWidth = newHeight * svgAspectRatio;
        } else {
          newWidth = containerWidth;
          newHeight = newWidth / svgAspectRatio;
        }

        svg.setAttribute('width', `${containerWidth}px`);
        svg.setAttribute('height', `${containerHeight}px`);
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        
        setScale(newWidth / viewBox.width);
      }
    };

    fitSvgToContainer();
    window.addEventListener('resize', fitSvgToContainer);

    return () => {
      window.removeEventListener('resize', fitSvgToContainer);
    };
  }, [svgContent, viewBox]);

  useEffect(() => {
    if (svgRef.current && selected3DShape) {
      const svg = svgRef.current;
      const selectedElement = svg.getElementById(selected3DShape);
      
      // Remove highlight from all elements
      svg.querySelectorAll('.highlighted-shape').forEach(el => {
        el.classList.remove('highlighted-shape');
      });

      // Add highlight to the selected element
      if (selectedElement) {
        selectedElement.classList.add('highlighted-shape');
      }
    }
  }, [selected3DShape, svgContent]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragging && svgRef.current) {
      const dx = (e.clientX - dragStart.x) / scale;
      const dy = (e.clientY - dragStart.y) / scale;

      setViewBox(prevViewBox => ({
        ...prevViewBox,
        x: prevViewBox.x - dx,
        y: prevViewBox.y - dy
      }));

      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  const handleZoom = (factor: number) => {
    if (svgRef.current) {
      const newScale = Math.max(0.1, Math.min(scale * factor, 10));
      const scaleFactor = newScale / scale;

      setScale(newScale);
      setViewBox(prevViewBox => {
        const centerX = prevViewBox.x + prevViewBox.width / 2;
        const centerY = prevViewBox.y + prevViewBox.height / 2;
        const newWidth = prevViewBox.width / scaleFactor;
        const newHeight = prevViewBox.height / scaleFactor;
        return {
          x: centerX - newWidth / 2,
          y: centerY - newHeight / 2,
          width: newWidth,
          height: newHeight
        };
      });
    }
  };

  const resetZoom = () => {
    if (svgRef.current) {
      setScale(1);
      setViewBox({ x: 0, y: 0, width: 1000, height: 1000 });
    }
  };

  const handleShapeClick = (e: React.MouseEvent) => {
    const target = e.target as SVGElement;
    const shape3D = target.closest('[id^="shape-"]');
    if (shape3D) {
      onSelect3DShape(shape3D.id);
    } else {
      onSelect3DShape(null);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-gray-100 border border-gray-300">
      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute bg-white"
        dangerouslySetInnerHTML={{ __html: svgContent }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleShapeClick}
      />
      <div className="absolute bottom-4 right-4 flex space-x-2">
        <Button onClick={() => handleZoom(1.2)} className="bg-gray-800 text-white px-2 py-1 text-sm rounded">
          +
        </Button>
        <Button onClick={() => handleZoom(0.8)} className="bg-gray-800 text-white px-2 py-1 text-sm rounded">
          -
        </Button>
        <Button onClick={resetZoom} className="bg-gray-800 text-white px-2 py-1 text-sm rounded">
          Reset
        </Button>
      </div>
      <style>
        {`
          .highlighted-shape {
            outline: 1px dashed #007bff;
            outline-offset: 2px;
          }
        `}
      </style>
    </div>
  );
};

export default SVGDisplay;