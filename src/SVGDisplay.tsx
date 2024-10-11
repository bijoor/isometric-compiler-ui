import React, { useState, useRef, useEffect } from 'react';
import { Button } from './components/ui/Button';

interface SVGDisplayProps {
  svgContent: string;
}

const SVGDisplay: React.FC<SVGDisplayProps> = ({ svgContent }) => {
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
          // Container is wider than SVG
          newHeight = containerHeight;
          newWidth = newHeight * svgAspectRatio;
        } else {
          // Container is taller than SVG or same aspect ratio
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

  // Parse the SVG content to extract viewBox
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
  const svgElement = svgDoc.documentElement;
  const originalViewBox = svgElement.getAttribute('viewBox') || '0 0 1000 1000';

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-gray-100 border border-gray-300">
      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute bg-white"
        dangerouslySetInnerHTML={{ __html: svgElement.innerHTML }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
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
    </div>
  );
};

export default SVGDisplay;