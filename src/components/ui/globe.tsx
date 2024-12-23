"use client";
import React, { useEffect, useRef } from "react";
import createGlobe from "cobe";
import { cn } from "@/lib/util";
interface EarthProps {
  className?: string;
  theta?: number;
  dark?: number;
  scale?: number;
  diffuse?: number;
  mapSamples?: number;
  mapBrightness?: number;
  baseColor?: [number, number, number];
  markerColor?: [number, number, number];
  glowColor?: [number, number, number];
}
const Earth: React.FC<EarthProps> = ({
  className,
  theta = 0.25,
  dark = 1,
  scale = 1.1,
  diffuse = 1.2,
  mapSamples = 40000,
  mapBrightness = 6,
  baseColor = [0.4157, 0.051, 0.6784],
  markerColor = [6, 0, 0],
  glowColor = [0.4157, 0.051, 0.6784],
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let width = 0;
    const onResize = () =>
      canvasRef.current && (width = canvasRef.current.offsetWidth);
    window.addEventListener("resize", onResize);
    onResize();
    let phi = 0;

    onResize();
    const globe = createGlobe(canvasRef.current!, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: theta,
      dark: dark,
      scale: scale,
      diffuse: diffuse,
      mapSamples: mapSamples,
      mapBrightness: mapBrightness,
      baseColor: baseColor,
      markerColor: markerColor,
      glowColor: glowColor,
      opacity: 1,
      offset: [0, 0],
      markers: [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onRender: (state: Record<string, any>) => {
        state.phi = phi;
        phi += 0.003;
      },
    });

    return () => {
      globe.destroy();
    };
  }, [
    baseColor,
    dark,
    diffuse,
    glowColor,
    mapBrightness,
    mapSamples,
    markerColor,
    scale,
    theta,
  ]);

  return (
    <div
      className={cn(
        "flex items-center justify-center z-[10] w-full max-w-[350px] mx-auto",
        className
      )}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          maxWidth: "100%",
          aspectRatio: "1",
        }}
      />
    </div>
  );
};

export default Earth;
