"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { MediaItem } from "@/data/schema";
import { resolveMediaUrl } from "@/lib/utils";
import { useVideoProjectStore } from "@/data/store";
import { X, Maximize2, Minimize2 } from "lucide-react";

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
  const containerRef = useRef<HTMLDivElement>(null);
  
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

  if (!leftImageUrl || !rightImageUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-w-6xl ${isFullscreen ? 'w-screen h-screen max-w-none' : ''}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Image Comparison</span>
            <div className="flex items-center gap-2">
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
        
        {/* Slider control */}
        <div className="mt-4">
          <Slider
            value={[sliderPosition]}
            onValueChange={([value]) => setSliderPosition(value)}
            max={100}
            step={1}
            className="w-full"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
} 