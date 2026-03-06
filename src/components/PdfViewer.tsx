import { useEffect, useRef, useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
    fileUrl: string | undefined;
    page?: number; // optional: if passed, lock to that page
}

const PDFViewer = ({ fileUrl, page }: PDFViewerProps) => {
    const [containerWidth, setContainerWidth] = useState<number>(0);
    const [numPages, setNumPages] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(page ?? 1);
    const containerRef = useRef<HTMLDivElement>(null);

    // handle resize
    useEffect(() => {
        const resizeObserver = new ResizeObserver(() => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth);
            }
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
            setContainerWidth(containerRef.current.offsetWidth);
        }

        return () => resizeObserver.disconnect();
    }, []);

    // keyboard navigation
    const handleKey = useCallback(
        (e: KeyboardEvent) => {
            if (page) return; // disable if fixed page prop is provided
            if (e.key === "ArrowRight") {
                setCurrentPage((prev) => Math.min(prev + 1, numPages));
            } else if (e.key === "ArrowLeft") {
                setCurrentPage((prev) => Math.max(prev - 1, 1));
            }
        },
        [numPages, page]
    );

    useEffect(() => {
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [handleKey]);

    return (
        <div
            className="flex flex-col items-center gap-4 h-screen relative"
            ref={containerRef}
        >
            <Document file={"https://api.sazrisi.ge/" + fileUrl} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
                <Page
                    pageNumber={page ?? currentPage}
                    width={containerWidth * 0.95}
                />
            </Document>

            {/* Only show controls if page prop is NOT provided */}
            {!page && (
                <>
                    {/* Left button */}
                    <button
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full p-3 hover:bg-black transition"
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage <= 1}
                    >
                        <ChevronLeft size={28} />
                    </button>

                    {/* Right button */}
                    <button
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full p-3 hover:bg-black transition"
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, numPages))}
                        disabled={currentPage >= numPages}
                    >
                        <ChevronRight size={28} />
                    </button>

                    {/* Page indicator */}
                    <div className="absolute bottom-3 bg-black/60 text-white px-3 py-1 rounded-md text-sm">
                        {currentPage} / {numPages}
                    </div>
                </>
            )}
        </div>
    );
};

export default PDFViewer;
