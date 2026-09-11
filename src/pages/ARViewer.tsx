import React, { Suspense, useRef, useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { PergolaModel } from '@/components/configurator/models/PergolaModel';
import { DEFAULT_PERGOLA_CONFIG, PergolaConfig } from '@/types/configurator';
import { Button } from '@/components/ui/button';
import { Camera, RotateCcw, Move, ZoomIn } from 'lucide-react';

const parseConfigFromParams = (params: URLSearchParams): PergolaConfig => {
  const config = { ...DEFAULT_PERGOLA_CONFIG };
  
  try {
    const encoded = params.get('config');
    if (encoded) {
      const decoded = JSON.parse(atob(encoded));
      return { ...config, ...decoded };
    }
  } catch (e) {
    console.warn('Failed to parse AR config, using defaults');
  }

  return config;
};

const ARScene = ({ config }: { config: PergolaConfig }) => {
  return (
    <>
      <Environment preset="city" background={false} />
      <directionalLight position={[10, 20, 10]} intensity={3} color="#fffdf2" castShadow />
      <directionalLight position={[-5, 10, -5]} intensity={0.4} color="#E8F0FF" />
      <ambientLight intensity={0.5} />
      <hemisphereLight args={['#87CEEB', '#DEB887', 0.3]} />

      {/* Shadow-catching ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <shadowMaterial transparent opacity={0.3} />
      </mesh>

      <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={20} blur={2.5} far={4} color="#000000" />

      <group scale={0.7}>
        <PergolaModel config={config} position={[0, 0, 0]} />
      </group>

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        enableDamping={true}
        dampingFactor={0.05}
        rotateSpeed={0.7}
        minDistance={2}
        maxDistance={20}
        maxPolarAngle={Math.PI / 2 - 0.05}
        target={[0, 1.2, 0]}
      />
    </>
  );
};

const ARViewer = () => {
  const [searchParams] = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  const config = useMemo(() => parseConfigFromParams(searchParams), [searchParams]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      setCameraError(true);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(t => t.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className="fixed inset-0 bg-black">
      {/* Camera feed background */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />

      {/* 3D overlay - transparent background */}
      <div className="absolute inset-0">
        <Canvas
          shadows
          camera={{ position: [0, 2.5, 8], fov: 40 }}
          dpr={Math.min(window.devicePixelRatio, 2)}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.2,
          }}
          onCreated={({ gl }) => {
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
          }}
          style={{ background: cameraActive ? 'transparent' : 'linear-gradient(to bottom, #E8F4FF, #F5F9FF)' }}
        >
          <Suspense fallback={null}>
            <ARScene config={config} />
          </Suspense>
        </Canvas>
      </div>

      {/* UI Controls */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 safe-area-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-black/60 backdrop-blur-md">
            <div className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-green-400' : 'bg-orange-400'} animate-pulse`} />
            <span className="text-xs font-medium text-white">
              {cameraActive ? 'AR Mode' : 'Preview Mode'}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-6 safe-area-bottom">
        <div className="max-w-md mx-auto space-y-3">
          {/* Tips */}
          <div className="flex items-center justify-center gap-4 text-white/70 text-xs">
            <span className="flex items-center gap-1"><Move className="w-3 h-3" /> Drag to move</span>
            <span className="flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Rotate</span>
            <span className="flex items-center gap-1"><ZoomIn className="w-3 h-3" /> Pinch to zoom</span>
          </div>

          {/* Camera toggle */}
          {!cameraError && (
            <Button
              onClick={cameraActive ? stopCamera : startCamera}
              className="w-full h-12 rounded-full text-sm font-semibold"
              variant={cameraActive ? 'outline' : 'default'}
              style={!cameraActive ? {
                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                border: 'none',
                color: 'white',
              } : {
                borderColor: 'rgba(255,255,255,0.3)',
                color: 'white',
                background: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <Camera className="w-4 h-4 mr-2" />
              {cameraActive ? 'Exit Camera' : 'View in Your Space'}
            </Button>
          )}

          {cameraError && (
            <div className="text-center text-white/60 text-xs bg-black/40 rounded-xl p-3 backdrop-blur-md">
              Camera access unavailable. You can still rotate and explore the 3D model above.
            </div>
          )}

          {/* Dimensions info */}
          <div className="text-center text-white/50 text-[10px]">
            {(config.dimensions.length / 1000).toFixed(1)}m × {(config.dimensions.width / 1000).toFixed(1)}m × {(config.dimensions.height / 1000).toFixed(1)}m
          </div>
        </div>
      </div>
    </div>
  );
};

export default ARViewer;
