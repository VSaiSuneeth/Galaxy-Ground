import { useEffect, useState } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  src: string;
  type: "image" | "video";
  open: boolean;
  onClose: () => void;
  alt?: string;
}

const MediaLightbox = ({ src, type, open, onClose, alt }: Props) => {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!open) return;
    setZoom(1);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(z + 0.25, 4));
      if (e.key === "-") setZoom((z) => Math.max(z - 0.25, 0.5));
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={onClose}
        >
          {/* Top toolbar */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            {type === "image" && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setZoom((z) => Math.max(z - 0.25, 0.5)); }}
                  className="h-10 w-10 rounded-full bg-muted/40 hover:bg-muted/60 flex items-center justify-center text-foreground transition-colors"
                  title="Zoom out"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="h-5 w-5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setZoom(1); }}
                  className="h-10 w-10 rounded-full bg-muted/40 hover:bg-muted/60 flex items-center justify-center text-foreground transition-colors"
                  title="Reset zoom"
                  aria-label="Reset zoom"
                >
                  <RotateCcw className="h-5 w-5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setZoom((z) => Math.min(z + 0.25, 4)); }}
                  className="h-10 w-10 rounded-full bg-muted/40 hover:bg-muted/60 flex items-center justify-center text-foreground transition-colors"
                  title="Zoom in"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="h-5 w-5" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="h-10 w-10 rounded-full bg-muted/40 hover:bg-destructive/40 flex items-center justify-center text-foreground transition-colors"
              title="Close"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="max-w-[95vw] max-h-[90vh] flex items-center justify-center overflow-auto scrollbar-thin"
            onClick={(e) => e.stopPropagation()}
          >
            {type === "image" ? (
              <img
                src={src}
                alt={alt || "Media"}
                style={{ transform: `scale(${zoom})`, transition: "transform 0.2s" }}
                className="max-h-[90vh] max-w-[95vw] origin-center rounded-lg object-contain"
              />
            ) : (
              <video
                src={src}
                controls
                autoPlay
                className="max-h-[90vh] max-w-[95vw] rounded-lg"
              />
            )}
          </motion.div>

          {type === "image" && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-muted/40 text-xs text-muted-foreground">
              {Math.round(zoom * 100)}%
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MediaLightbox;
