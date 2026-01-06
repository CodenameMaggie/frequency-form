'use client';

/**
 * FF AI Style Studio - Design Canvas Component
 * Interactive Fabric.js canvas for custom clothing design
 */

import { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';

interface DesignCanvasProps {
  width?: number;
  height?: number;
  baseTemplate?: any; // Template to load
  onCanvasChange?: (canvasJson: any) => void;
  readonly?: boolean;
}

export default function DesignCanvas({
  width = 800,
  height = 600,
  baseTemplate,
  onCanvasChange,
  readonly = false
}: DesignCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [selectedTool, setSelectedTool] = useState<'select' | 'draw' | 'line' | 'circle' | 'rect'>('select');
  const [drawingMode, setDrawingMode] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#1a3a2f');

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#f8f6f3',
      selection: !readonly,
      isDrawingMode: false
    });

    // Load base template if provided
    if (baseTemplate?.template_svg) {
      fabric.loadSVGFromString(baseTemplate.template_svg, (objects, options) => {
        const obj = fabric.util.groupSVGElements(objects, options);
        fabricCanvas.add(obj);
        fabricCanvas.renderAll();
      });
    }

    // Canvas events
    fabricCanvas.on('object:modified', () => {
      if (onCanvasChange) {
        onCanvasChange(fabricCanvas.toJSON());
      }
    });

    fabricCanvas.on('path:created', () => {
      if (onCanvasChange) {
        onCanvasChange(fabricCanvas.toJSON());
      }
    });

    setCanvas(fabricCanvas);

    return () => {
      fabricCanvas.dispose();
    };
  }, []);

  // Update tool
  useEffect(() => {
    if (!canvas) return;

    canvas.isDrawingMode = selectedTool === 'draw';

    if (selectedTool === 'draw') {
      canvas.freeDrawingBrush.color = selectedColor;
      canvas.freeDrawingBrush.width = 3;
    }
  }, [selectedTool, selectedColor, canvas]);

  // Tool handlers
  const handleAddShape = (shapeType: 'circle' | 'rect' | 'line') => {
    if (!canvas) return;

    let shape: fabric.Object;

    switch (shapeType) {
      case 'circle':
        shape = new fabric.Circle({
          radius: 50,
          fill: selectedColor,
          left: 100,
          top: 100
        });
        break;
      case 'rect':
        shape = new fabric.Rect({
          width: 100,
          height: 100,
          fill: selectedColor,
          left: 100,
          top: 100
        });
        break;
      case 'line':
        shape = new fabric.Line([50, 100, 200, 200], {
          stroke: selectedColor,
          strokeWidth: 3
        });
        break;
    }

    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();

    if (onCanvasChange) {
      onCanvasChange(canvas.toJSON());
    }
  };

  const handleAddText = () => {
    if (!canvas) return;

    const text = new fabric.IText('Custom Text', {
      left: 100,
      top: 100,
      fontFamily: 'Arial',
      fill: selectedColor,
      fontSize: 24
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();

    if (onCanvasChange) {
      onCanvasChange(canvas.toJSON());
    }
  };

  const handleDelete = () => {
    if (!canvas) return;

    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length) {
      activeObjects.forEach((obj) => {
        canvas.remove(obj);
      });
      canvas.discardActiveObject();
      canvas.renderAll();

      if (onCanvasChange) {
        onCanvasChange(canvas.toJSON());
      }
    }
  };

  const handleClear = () => {
    if (!canvas || !confirm('Clear entire canvas?')) return;

    canvas.clear();
    canvas.backgroundColor = '#f8f6f3';
    canvas.renderAll();

    if (onCanvasChange) {
      onCanvasChange(canvas.toJSON());
    }
  };

  const handleExport = () => {
    if (!canvas) return;

    // Export as PNG
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1
    });

    // Download
    const link = document.createElement('a');
    link.download = 'ff-design.png';
    link.href = dataURL;
    link.click();
  };

  if (readonly) {
    return (
      <div className="design-canvas-readonly">
        <canvas ref={canvasRef} />
      </div>
    );
  }

  return (
    <div className="design-canvas-container">
      {/* Toolbar */}
      <div className="toolbar" style={{
        display: 'flex',
        gap: '1rem',
        padding: '1rem',
        backgroundColor: '#fff',
        borderRadius: '8px',
        marginBottom: '1rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        {/* Tool Selection */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setSelectedTool('select')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: selectedTool === 'select' ? '#1a3a2f' : '#fff',
              color: selectedTool === 'select' ? '#fff' : '#1a3a2f',
              border: '1px solid #1a3a2f',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Select
          </button>
          <button
            onClick={() => setSelectedTool('draw')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: selectedTool === 'draw' ? '#1a3a2f' : '#fff',
              color: selectedTool === 'draw' ? '#fff' : '#1a3a2f',
              border: '1px solid #1a3a2f',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Draw
          </button>
        </div>

        {/* Shape Tools */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => handleAddShape('circle')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#fff',
              color: '#1a3a2f',
              border: '1px solid #1a3a2f',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Circle
          </button>
          <button
            onClick={() => handleAddShape('rect')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#fff',
              color: '#1a3a2f',
              border: '1px solid #1a3a2f',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Rectangle
          </button>
          <button
            onClick={() => handleAddShape('line')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#fff',
              color: '#1a3a2f',
              border: '1px solid #1a3a2f',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Line
          </button>
          <button
            onClick={handleAddText}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#fff',
              color: '#1a3a2f',
              border: '1px solid #1a3a2f',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Text
          </button>
        </div>

        {/* Color Picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.9rem', color: '#1a3a2f' }}>Color:</label>
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            style={{
              width: '40px',
              height: '40px',
              border: '1px solid #1a3a2f',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
          <button
            onClick={handleDelete}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#fff',
              color: '#c41e3a',
              border: '1px solid #c41e3a',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Delete
          </button>
          <button
            onClick={handleClear}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#fff',
              color: '#666',
              border: '1px solid #666',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Clear
          </button>
          <button
            onClick={handleExport}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#c9a962',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Export PNG
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div style={{
        border: '2px solid #1a3a2f',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#fff'
      }}>
        <canvas ref={canvasRef} />
      </div>

      {/* Instructions */}
      <div style={{
        marginTop: '1rem',
        padding: '1rem',
        backgroundColor: '#f8f6f3',
        borderRadius: '8px',
        fontSize: '0.9rem',
        color: '#666'
      }}>
        <p><strong>Instructions:</strong></p>
        <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
          <li>Use <strong>Select</strong> tool to move and resize objects</li>
          <li>Use <strong>Draw</strong> tool to draw freehand</li>
          <li>Add shapes, lines, and text to customize your design</li>
          <li>Change colors using the color picker</li>
          <li>Export your design as PNG when finished</li>
        </ul>
      </div>
    </div>
  );
}
