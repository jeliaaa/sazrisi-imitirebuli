import React, { useEffect, useRef, useState } from "react";
import {
    type CanvasPath,
    ReactSketchCanvas,
    type ReactSketchCanvasRef,
} from "react-sketch-canvas";
import { Rnd } from "react-rnd";
import { Eraser, Trash, X } from "lucide-react";

const canvasStyle = {
    border: "1px solid #ccc",
    borderRadius: "8px",
    width: "100%",
    height: "100%",
};

interface Page {
    id: number;
    paths: CanvasPath[];
}

interface NoteCanvasProps {
    onClose: () => void;
}

export const NoteCanvas: React.FC<NoteCanvasProps> = ({ onClose }) => {
    const canvasRef = useRef<ReactSketchCanvasRef>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const [pages, setPages] = useState<Page[]>([{ id: 1, paths: [] }]);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [isLargeScreen, setIsLargeScreen] = useState(false);
    const [isEraser, setIsEraser] = useState(false);
    const [strokeWidth, setStrokeWidth] = useState(3);
    const [strokeColor, setStrokeColor] = useState("#000000"); // default blackzz

    // Resize detection
    useEffect(() => {
        const checkScreenSize = () => {
            setIsLargeScreen(window.innerWidth >= 1024); // 'lg' breakpoint
        };
        checkScreenSize();
        window.addEventListener("resize", checkScreenSize);
        return () => window.removeEventListener("resize", checkScreenSize);
    }, []);

    // Outside click handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                modalRef.current &&
                !modalRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    const saveCurrentPagePaths = async () => {
        const paths = await canvasRef.current?.exportPaths();
        if (paths) {
            const updated = [...pages];
            updated[currentPageIndex].paths = paths;
            setPages(updated);
        }
    };

    const switchPage = async (index: number) => {
        await saveCurrentPagePaths();
        setCurrentPageIndex(index);
        await canvasRef.current?.clearCanvas();
        const pathsToLoad = pages[index].paths;
        if (pathsToLoad?.length) {
            await canvasRef.current?.loadPaths(pathsToLoad);
        }
    };

    const handleNewPage = async () => {
        await saveCurrentPagePaths();
        const newPage: Page = { id: pages.length + 1, paths: [] };
        setPages([...pages, newPage]);
        setCurrentPageIndex(pages.length);
        await canvasRef.current?.clearCanvas();
    };

    const handleSave = async () => {
        if (!canvasRef.current) return;

        try {
            const imageData = await canvasRef.current.exportImage("png");

            const link = document.createElement("a");
            link.href = imageData;
            link.download = `drawing-page-${pages[currentPageIndex].id}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Failed to export PNG", error);
        }
    };

    const handleClear = async () => {
        if (!canvasRef.current) return;
        await canvasRef.current.clearCanvas();

        // Also update current page paths to empty since canvas is cleared
        const updated = [...pages];
        updated[currentPageIndex].paths = [];
        setPages(updated);
    };

    const toggleEraser = () => {
        setIsEraser((prev) => !prev);
    };

    const handleStrokeWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setStrokeWidth(Number(e.target.value));
    };

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setStrokeColor(e.target.value);
    };

    const content = (
        <div
            ref={modalRef}
            className=" relative p-4 w-full h-full bg-white rounded-md shadow-lg flex flex-col"
        >
            <div className="handle w-full cursor-grab active:cursor-grabbing bg-gray-200 text-main-color title p-4">
                შავი ფურცელი
            </div>
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-2 right-2 px-2 py-1 bg-red-500 cursor-pointer text-white rounded"
            >
                <X className="h-5 w-5" />
            </button>

            {/* Canvas */}
            <div className="mb-4 flex-1">
                <ReactSketchCanvas
                    ref={canvasRef}
                    style={canvasStyle}
                    strokeWidth={strokeWidth}
                    strokeColor={isEraser ? "#FFFFFF" : strokeColor} // eraser white color
                    withTimestamp={false}
                />
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-4">
                {/* Page buttons */}
                <div className="flex gap-2 overflow-x-scroll">
                    {pages.map((page, i) => (
                        <button
                            key={page.id}
                            onClick={() => switchPage(i)}
                            className={`px-3 py-1 rounded ${i === currentPageIndex
                                ? "text-main-color bg-dark-color"
                                : "bg-gray-200"
                                }`}
                        >
                            <span>{page.id}</span>
                        </button>
                    ))}
                    <button
                        onClick={handleNewPage}
                        className="px-3 py-1 bg- text-dark-color rounded"
                    >
                        +
                    </button>
                </div>

                {/* Drawing tools controls */}
                <div className="flex flex-wrap items-center gap-4">
                    <button
                        onClick={handleClear}
                        className="px-4 py-2 rounded"
                    >
                        <Trash className="w-5 h-5" />
                    </button>

                    <button
                        onClick={toggleEraser}
                        className={`px-4 py-2 rounded ${isEraser ? "bg-main-color" : "bg-gray-300"
                            }`}
                    >
                        <Eraser className="w-5 h-5" />
                    </button>

                    <label className="flex items-center gap-2">
                        <span className="whitespace-nowrap">სისქე:</span>
                        <input
                            type="range"
                            min={1}
                            max={20}
                            value={strokeWidth}
                            onChange={handleStrokeWidthChange}
                        />
                        <span>{strokeWidth}</span>
                    </label>

                    {!isEraser && (
                        <label className="flex items-center gap-2">
                            <input
                                type="color"
                                value={strokeColor}
                                onChange={handleColorChange}
                            />
                        </label>
                    )}

                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 text-white rounded"
                    >
                        შენახვა
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/30 z-200 flex justify-center items-end p-4">
            {isLargeScreen ? (
                <Rnd
                    default={{
                        x: window.innerWidth / 6,
                        y: window.innerHeight / 6,
                        width: window.innerWidth / 2,
                        height: window.innerHeight / 1.5,
                    }}
                    minWidth={300}
                    minHeight={500}
                    bounds="window"
                    dragHandleClassName="handle"
                    className="rounded-md shadow-lg bg-white"
                >
                    {content}
                </Rnd>
            ) : (
                <div
                    ref={modalRef}
                    className="w-full h-[60vh] rounded-t-md shadow-lg bg-white"
                >
                    {content}
                </div>
            )}
        </div>
    );
};
