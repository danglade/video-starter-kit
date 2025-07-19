"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { MediaItem } from "@/data/schema";
import { resolveMediaUrl } from "@/lib/utils";
import { useVideoProjectStore } from "@/data/store";
import { X, Maximize2, Minimize2, Columns2, SplitSquareHorizontal, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";

interface ImageComparerProps {
  leftImage: MediaItem;
  rightImage: MediaItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImageComparer({ leftImage, rightImage, open, onOpenChange }: ImageComparerProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<"slider" | "side-by-side">("slider");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const leftImageRef = useRef<HTMLDivElement>(null);
  const rightImageRef = useRef<HTMLDivElement>(null);
  
  const leftImageUrl = resolveMediaUrl(leftImage);
  const rightImageUrl = resolveMediaUrl(rightImage);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = (x / rect.width) * 100;
      setSliderPosition(Math.max(0, Math.min(100, percentage)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Handle panning for side-by-side view
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isPanning) return;
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
    };

    const handleMouseUp = () => {
      setIsPanning(false);
    };

    if (isPanning) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning, startPan]);

  if (!leftImageUrl || !rightImageUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-w-6xl ${isFullscreen ? 'w-screen h-screen max-w-none' : ''}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Image Comparison</span>
            <div className="flex items-center gap-2">
              <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as "slider" | "side-by-side")}>
                <ToggleGroupItem value="slider" aria-label="Slider view">
                  <SplitSquareHorizontal className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="side-by-side" aria-label="Side by side view">
                  <Columns2 className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        {viewMode === "slider" ? (
          <div className="relative w-full" style={{ paddingBottom: '56.25%' /* 16:9 aspect ratio */ }}>
            <div 
              ref={containerRef}
              className="absolute inset-0 overflow-hidden cursor-ew-resize select-none"
              onMouseDown={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
            >
              {/* Right image (full width) */}
              <img
                src={rightImageUrl}
                alt="Right comparison"
                className="absolute inset-0 w-full h-full object-contain"
                draggable={false}
              />
              
              {/* Left image (clipped) */}
              <div 
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderPosition}%` }}
              >
                <img
                  src={leftImageUrl}
                  alt="Left comparison"
                  className="absolute inset-0 w-full h-full object-contain"
                  style={{ maxWidth: `${(100 / sliderPosition) * 100}%` }}
                  draggable={false}
                />
              </div>
              
              {/* Slider handle */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                  <div className="w-4 h-0.5 bg-gray-400" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div 
                ref={leftImageRef}
                className="relative aspect-video bg-black/20 rounded-lg overflow-hidden cursor-move"
                onMouseDown={(e) => {
                  setIsPanning(true);
                  setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
                }}
                onMouseMove={(e) => {
                  if (isPanning) {
                    setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
                  }
                }}
                onMouseUp={() => setIsPanning(false)}
                onMouseLeave={() => setIsPanning(false)}
                onWheel={(e) => {
                  e.preventDefault();
                  const delta = e.deltaY * -0.01;
                  const newZoom = Math.min(Math.max(0.5, zoom + delta), 5);
                  setZoom(newZoom);
                }}
              >
                <img
                  src={leftImageUrl}
                  alt="Left comparison"
                  className="absolute inset-0 w-full h-full object-contain"
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transition: isPanning ? 'none' : 'transform 0.1s',
                  }}
                  draggable={false}
                />
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-xs text-white flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  Left
                </div>
              </div>
              <div 
                ref={rightImageRef}
                className="relative aspect-video bg-black/20 rounded-lg overflow-hidden cursor-move"
                onMouseDown={(e) => {
                  setIsPanning(true);
                  setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
                }}
                onMouseMove={(e) => {
                  if (isPanning) {
                    setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
                  }
                }}
                onMouseUp={() => setIsPanning(false)}
                onMouseLeave={() => setIsPanning(false)}
                onWheel={(e) => {
                  e.preventDefault();
                  const delta = e.deltaY * -0.01;
                  const newZoom = Math.min(Math.max(0.5, zoom + delta), 5);
                  setZoom(newZoom);
                }}
              >
                <img
                  src={rightImageUrl}
                  alt="Right comparison"
                  className="absolute inset-0 w-full h-full object-contain"
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transition: isPanning ? 'none' : 'transform 0.1s',
                  }}
                  draggable={false}
                />
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 rounded text-xs text-white flex items-center gap-1">
                  Right
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                </div>
              </div>
            </div>
            
            {/* Zoom controls for side-by-side view */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                disabled={zoom <= 0.5}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground w-16 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.min(5, zoom + 0.25))}
                disabled={zoom >= 5}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
        
        {/* Labels */}
        <div className="flex justify-between mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <span>{leftImage.input?.prompt || 'Left Image'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>{rightImage.input?.prompt || 'Right Image'}</span>
            <div className="w-3 h-3 bg-green-500 rounded-full" />
          </div>
        </div>
        
        {/* Slider control - only show in slider mode */}
        {viewMode === "slider" && (
          <div className="mt-4">
            <Slider
              value={[sliderPosition]}
              onValueChange={([value]) => setSliderPosition(value)}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 