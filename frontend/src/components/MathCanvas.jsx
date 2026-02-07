// Interactive Mathematics Canvas Component
import React, { useRef, useState, useEffect } from 'react';

const MathCanvas = ({ lessonId, problemId, onSolutionSubmit }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState('pen'); // pen, eraser, text, shape
    const [color, setColor] = useState('#000000');
    const [lineWidth, setLineWidth] = useState(2);
    const [history, setHistory] = useState([]);
    const [historyStep, setHistoryStep] = useState(0);
    const [showGrid, setShowGrid] = useState(true);
    const [snapToGrid, setSnapToGrid] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        // Draw grid if enabled
        if (showGrid) {
            drawGrid(ctx);
        }
    }, [showGrid]);

    const drawGrid = (ctx) => {
        const gridSize = 20;
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 0.5;

        // Vertical lines
        for (let x = 0; x <= ctx.canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, ctx.canvas.height);
            ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y <= ctx.canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(ctx.canvas.width, y);
            ctx.stroke();
        }
    };

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setIsDrawing(true);
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;

        // Snap to grid if enabled
        if (snapToGrid) {
            const gridSize = 20;
            x = Math.round(x / gridSize) * gridSize;
            y = Math.round(y / gridSize) * gridSize;
        }

        const ctx = canvas.getContext('2d');
        
        if (tool === 'pen') {
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.lineTo(x, y);
            ctx.stroke();
        } else if (tool === 'eraser') {
            ctx.clearRect(x - 10, y - 10, 20, 20);
        }
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            saveToHistory();
        }
    };

    const saveToHistory = () => {
        const canvas = canvasRef.current;
        const imageData = canvas.toDataURL();
        const newHistory = history.slice(0, historyStep + 1);
        newHistory.push(imageData);
        setHistory(newHistory);
        setHistoryStep(newHistory.length - 1);
    };

    const undo = () => {
        if (historyStep > 0) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.src = history[historyStep - 1];
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                if (showGrid) drawGrid(ctx);
                ctx.drawImage(img, 0, 0);
            };
            setHistoryStep(historyStep - 1);
        }
    };

    const redo = () => {
        if (historyStep < history.length - 1) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.src = history[historyStep + 1];
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                if (showGrid) drawGrid(ctx);
                ctx.drawImage(img, 0, 0);
            };
            setHistoryStep(historyStep + 1);
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (showGrid) drawGrid(ctx);
        saveToHistory();
    };

    const saveWork = async () => {
        const canvas = canvasRef.current;
        const imageData = canvas.toDataURL('image/png');
        
        // Send to backend
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/math/save-work`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    lessonId,
                    problemId,
                    canvasData: imageData,
                    timestamp: new Date().toISOString()
                })
            });

            if (response.ok) {
                alert('Work saved successfully! ✅');
            }
        } catch (error) {
            console.error('Error saving work:', error);
            alert('Failed to save work. Please try again.');
        }
    };

    const submitSolution = () => {
        const canvas = canvasRef.current;
        const imageData = canvas.toDataURL('image/png');
        
        if (onSolutionSubmit) {
            onSolutionSubmit({
                type: 'canvas',
                data: imageData,
                timestamp: new Date().toISOString()
            });
        }
    };

    return (
        <div className="math-canvas-container">
            {/* Toolbar */}
            <div className="canvas-toolbar">
                <div className="tool-group">
                    <button
                        className={`tool-btn ${tool === 'pen' ? 'active' : ''}`}
                        onClick={() => setTool('pen')}
                        title="Pen"
                    >
                        ✏️ Pen
                    </button>
                    <button
                        className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`}
                        onClick={() => setTool('eraser')}
                        title="Eraser"
                    >
                        🧹 Eraser
                    </button>
                </div>

                <div className="tool-group">
                    <label className="tool-label">
                        Color:
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="color-picker"
                        />
                    </label>
                    <label className="tool-label">
                        Size:
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={lineWidth}
                            onChange={(e) => setLineWidth(e.target.value)}
                            className="size-slider"
                        />
                        <span className="size-value">{lineWidth}px</span>
                    </label>
                </div>

                <div className="tool-group">
                    <button
                        className="tool-btn"
                        onClick={undo}
                        disabled={historyStep === 0}
                        title="Undo"
                    >
                        ↶ Undo
                    </button>
                    <button
                        className="tool-btn"
                        onClick={redo}
                        disabled={historyStep === history.length - 1}
                        title="Redo"
                    >
                        ↷ Redo
                    </button>
                    <button
                        className="tool-btn"
                        onClick={clearCanvas}
                        title="Clear All"
                    >
                        🗑️ Clear
                    </button>
                </div>

                <div className="tool-group">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={showGrid}
                            onChange={(e) => setShowGrid(e.target.checked)}
                        />
                        Show Grid
                    </label>
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={snapToGrid}
                            onChange={(e) => setSnapToGrid(e.target.checked)}
                        />
                        Snap to Grid
                    </label>
                </div>

                <div className="tool-group ml-auto">
                    <button
                        className="btn btn-secondary"
                        onClick={saveWork}
                    >
                        💾 Save Work
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={submitSolution}
                    >
                        ✅ Submit Solution
                    </button>
                </div>
            </div>

            {/* Canvas */}
            <canvas
                ref={canvasRef}
                className="math-canvas"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
            />

            <style jsx>{`
                .math-canvas-container {
                    width: 100%;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                }

                .canvas-toolbar {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 12px 16px;
                    background: #f8f9fa;
                    border-bottom: 2px solid #e0e0e0;
                    flex-wrap: wrap;
                }

                .tool-group {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .tool-btn {
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    background: white;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s;
                }

                .tool-btn:hover:not(:disabled) {
                    background: #f0f0f0;
                    border-color: #6366f1;
                }

                .tool-btn.active {
                    background: #6366f1;
                    color: white;
                    border-color: #6366f1;
                }

                .tool-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .tool-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                    color: #555;
                }

                .color-picker {
                    width: 40px;
                    height: 30px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    cursor: pointer;
                }

                .size-slider {
                    width: 80px;
                }

                .size-value {
                    font-weight: 600;
                    color: #6366f1;
                    min-width: 35px;
                }

                .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 14px;
                    cursor: pointer;
                }

                .ml-auto {
                    margin-left: auto;
                }

                .math-canvas {
                    width: 100%;
                    height: 500px;
                    cursor: crosshair;
                    background: white;
                }

                @media (max-width: 768px) {
                    .canvas-toolbar {
                        gap: 8px;
                        padding: 8px;
                    }

                    .tool-btn {
                        padding: 6px 10px;
                        font-size: 12px;
                    }

                    .math-canvas {
                        height: 400px;
                    }
                }
            `}</style>
        </div>
    );
};

export default MathCanvas;
