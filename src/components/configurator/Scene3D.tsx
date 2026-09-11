import React, { Suspense, useMemo, forwardRef, useImperativeHandle, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Text, ContactShadows } from '@react-three/drei';
import { EffectComposer, SSAO, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { PergolaModel } from './models/PergolaModel';
import { DeckModel } from './models/DeckModel';
import { DimensionLabels } from './models/DimensionLabels';
import { GarageDoor } from './models/CarModel';
import { ConfiguratorState, FloorFinish } from '@/types/configurator';

interface Scene3DProps {
  config: ConfiguratorState;
}

// Floor finish rendering — updates live from the selected floor option
const FloorSurface = ({ length, width, finish }: { length: number; width: number; finish: FloorFinish }) => {
  const boardCount = Math.floor(width / 0.15);
  const boards = useMemo(() => {
    const isComposite = finish === 'composite';
    const colors = isComposite ? ['#6E6A63', '#63605A'] : ['#C9A66B', '#B8956A'];
    const result = [];
    for (let i = 0; i < boardCount; i++) {
      const zPos = -width / 2 + (i + 0.5) * (width / boardCount);
      result.push(
        <mesh key={`board-${i}`} position={[0, 0.02, zPos]} receiveShadow castShadow>
          <boxGeometry args={[length - 0.1, 0.025, 0.12]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? colors[0] : colors[1]}
            roughness={isComposite ? 0.7 : 0.8}
            metalness={0}
          />
        </mesh>
      );
    }
    return result;
  }, [length, width, boardCount, finish]);

  const tiles = useMemo(() => {
    if (finish !== 'tiling') return [];
    const tileSize = 0.6;
    const cols = Math.max(1, Math.floor(length / tileSize));
    const rows = Math.max(1, Math.floor(width / tileSize));
    const tw = length / cols;
    const td = width / rows;
    const result = [];
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        result.push(
          <mesh
            key={`tile-${c}-${r}`}
            position={[-length / 2 + (c + 0.5) * tw, 0.022, -width / 2 + (r + 0.5) * td]}
            receiveShadow
          >
            <boxGeometry args={[tw - 0.02, 0.02, td - 0.02]} />
            <meshStandardMaterial color="#D8D3CB" roughness={0.35} metalness={0.05} />
          </mesh>
        );
      }
    }
    return result;
  }, [length, width, finish]);

  if (finish === 'concrete') {
    return (
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[length, 0.04, width]} />
        <meshStandardMaterial color="#B5B2AC" roughness={0.85} metalness={0.02} />
      </mesh>
    );
  }

  if (finish === 'tiling') {
    return (
      <group>
        <mesh position={[0, 0.008, 0]} receiveShadow>
          <boxGeometry args={[length, 0.016, width]} />
          <meshStandardMaterial color="#8F8B85" roughness={0.9} />
        </mesh>
        {tiles}
      </group>
    );
  }

  return (
    <group>
      <mesh position={[0, 0.005, 0]} receiveShadow>
        <boxGeometry args={[length, 0.01, width]} />
        <meshStandardMaterial color={finish === 'composite' ? '#55524D' : '#8B7355'} roughness={0.9} />
      </mesh>
      {boards}
    </group>
  );
};

// Ground plane with realistic appearance
const Ground = () => {
  return (
    <group>
      {/* Natural ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#C8BDB0" roughness={0.95} metalness={0} />
      </mesh>
      {/* Subtle grass patches */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-8, 0.001, -5]} receiveShadow>
        <circleGeometry args={[3, 32]} />
        <meshStandardMaterial color="#D4DBC8" roughness={0.9} transparent opacity={0.5} />
      </mesh>
    </group>
  );
};

// House structure for context (when freestanding)
const HouseContext = ({ show, offsetX = 8, offsetZ = -5 }: { show: boolean; offsetX?: number; offsetZ?: number }) => {
  if (!show) return null;
  
  return (
    <group position={[offsetX, 0, offsetZ]}>
      {/* Main house body */}
      <mesh position={[0, 3, 0]} receiveShadow castShadow>
        <boxGeometry args={[8, 6, 10]} />
        <meshStandardMaterial color="#FAFAFA" roughness={0.9} metalness={0} />
      </mesh>
      {/* Chimney */}
      <mesh position={[2, 6.5, 2]} castShadow>
        <boxGeometry args={[0.8, 1.5, 0.8]} />
        <meshStandardMaterial color="#E8E8E8" roughness={0.9} />
      </mesh>
    </group>
  );
};

// Grid with subtle styling
const GridLines = React.forwardRef<THREE.Group>((_, ref) => {
  const lines = useMemo(() => {
    const result = [];
    const size = 15;
    const step = 1;
    
    for (let i = -size; i <= size; i += step) {
      result.push(
        <group key={`grid-${i}`}>
          <mesh position={[i, 0.002, 0]}>
            <boxGeometry args={[0.01, 0.001, size * 2]} />
            <meshBasicMaterial color="#CCC" transparent opacity={0.2} />
          </mesh>
          <mesh position={[0, 0.002, i]}>
            <boxGeometry args={[size * 2, 0.001, 0.01]} />
            <meshBasicMaterial color="#CCC" transparent opacity={0.2} />
          </mesh>
        </group>
      );
    }
    return result;
  }, []);
  
  return <group ref={ref}>{lines}</group>;
});

GridLines.displayName = 'GridLines';

// Directional labels (Front, Back, Left, Right) rendered on the floor
const DirectionLabels = React.forwardRef<THREE.Group, { length: number; width: number }>((
  { length, width }, ref
) => {
  const textProps = {
    fontSize: 0.18,
    color: '#1a1a1a',
    anchorX: 'center' as const,
    anchorY: 'middle' as const,
    font: undefined,
    letterSpacing: 0.15,
    fillOpacity: 0.6,
  };

  const offset = 0.35;

  return (
    <group ref={ref}>
      {/* Front (positive Z) */}
      <Text
        position={[0, 0.035, width / 2 + offset]}
        rotation={[-Math.PI / 2, 0, 0]}
        {...textProps}
      >
        FRONT
      </Text>
      {/* Back (negative Z) */}
      <Text
        position={[0, 0.035, -width / 2 - offset]}
        rotation={[-Math.PI / 2, 0, Math.PI]}
        {...textProps}
      >
        BACK
      </Text>
      {/* Right (positive X) */}
      <Text
        position={[length / 2 + offset, 0.035, 0]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        {...textProps}
      >
        RIGHT
      </Text>
      {/* Left (negative X) */}
      <Text
        position={[-length / 2 - offset, 0.035, 0]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        {...textProps}
      >
        LEFT
      </Text>
    </group>
  );
});

DirectionLabels.displayName = 'DirectionLabels';

// Lighter post-processing for quality without killing performance
const Effects = () => {
  return (
    <EffectComposer enableNormalPass>
      <SSAO 
        samples={16}
        radius={0.1}
        intensity={15}
        luminanceInfluence={0.6}
        color={new THREE.Color('#000000')}
        worldDistanceThreshold={1}
        worldDistanceFalloff={0.5}
        worldProximityThreshold={0.5}
        worldProximityFalloff={0.5}
      />
      <Bloom 
        intensity={0.1}
        luminanceThreshold={0.9}
        luminanceSmoothing={0.9}
      />
    </EffectComposer>
  );
};


const SceneContent = ({ config }: Scene3DProps) => {
  const showPergola = config.structureType === 'pergola' || config.structureType === 'combo';
  const showDeck = config.structureType === 'deck' || config.includeDeck;
  const isAttached = showPergola && config.pergola.mounting !== 'freestanding';
  
  // Get dimensions for flooring - swap when shorter side is mounted
  const isShortMounted = showPergola && config.pergola.mounting === 'wall-mounted' && config.pergola.mountedSide === 'shorter';
  const rawFlooringLength = showPergola ? config.pergola.dimensions.length / 1000 : config.deck.dimensions.length / 1000;
  const rawFlooringWidth = showPergola ? config.pergola.dimensions.width / 1000 : config.deck.dimensions.width / 1000;
  const flooringLength = isShortMounted ? rawFlooringWidth : rawFlooringLength;
  const flooringWidth = isShortMounted ? rawFlooringLength : rawFlooringWidth;
  const deckHeight = showDeck ? (config.deck.height === 'elevated' ? config.deck.dimensions.height / 1000 : 0.15) : 0;

  // Get primary dimensions for labels
  const primaryDimensions = showPergola 
    ? config.pergola.dimensions 
    : config.deck.dimensions;

  return (
    <>
      {/* HDR Environment for realistic reflections and ambient lighting */}
      <Environment preset="city" background={false} />

      {/* Main directional light (sun) with soft shadows */}
      <directionalLight
        position={[10, 20, 10]}
        intensity={3}
        color="#fffdf2"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0002}
      />

      {/* Fill light */}
      <directionalLight 
        position={[-10, 15, -10]} 
        intensity={0.4} 
        color="#E8F0FF"
      />

      {/* Ambient fill */}
      <ambientLight intensity={0.3} color="#ffffff" />

      {/* Hemisphere light for natural sky/ground lighting */}
      <hemisphereLight args={['#87CEEB', '#DEB887', 0.4]} />

      {/* Ground */}
      <Ground />
      
      {/* Grid */}
      <GridLines />

      {/* Direction Labels */}
      <DirectionLabels length={flooringLength} width={flooringWidth} />

      {/* House context (only when freestanding) */}
      <HouseContext show={!isAttached} offsetX={flooringLength / 2 + 6} offsetZ={-flooringWidth / 2 - 3} />

      {/* Contact Shadows for high-end grounding */}
      <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={20} blur={2.5} far={4} color="#000000" />

      {/* Floor finish under pergola */}
      <FloorSurface
        length={flooringLength + 0.5}
        width={flooringWidth + 0.5}
        finish={showPergola ? config.pergola.floorFinish ?? 'as-is' : 'as-is'}
      />

      {/* Dimension Labels */}
      <DimensionLabels
        length={primaryDimensions.length / 1000}
        width={primaryDimensions.width / 1000}
        height={primaryDimensions.height / 1000}
        position={[0, deckHeight, 0]}
      />

      {/* Models */}
      {showDeck && (
        <DeckModel 
          config={config.deck} 
          position={[0, 0, 0]}
        />
      )}
      
      {showPergola && (
        <PergolaModel 
          config={config.pergola} 
          position={[0, deckHeight, 0]}
        />
      )}

      {/* Carport cars + garage door (Polycarbonate Roof Pergola) */}
      {showPergola && config.pergola.type === 'luxe' && (
        <>
          <GarageDoor
            type={config.pergola.garageDoor ?? 'none'}
            length={flooringLength}
            width={flooringWidth}
            height={config.pergola.dimensions.height / 1000}
            color={config.pergola.frameColor}
            openness={config.pergola.garageDoorOpenness ?? 0}
            y={deckHeight}
          />
        </>
      )}

      {/* Post-processing effects */}
      <Effects />

      {/* Camera Controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        enableDamping={true}
        dampingFactor={0.05}
        rotateSpeed={0.7}
        minDistance={2}
        maxDistance={30}
        minPolarAngle={0}
        maxPolarAngle={Math.PI}
        target={[0, 1.5, 0]}
      />

    </>
  );
};

const LoadingFallback = () => (
  <mesh>
    <boxGeometry args={[1, 1, 1]} />
    <meshBasicMaterial color="#ccc" wireframe />
  </mesh>
);

export interface Scene3DHandle {
  captureScreenshot: () => string | null;
}

export const Scene3D = forwardRef<Scene3DHandle, Scene3DProps>(({ config }, ref) => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    captureScreenshot: () => {
      const canvas = canvasContainerRef.current?.querySelector('canvas');
      if (!canvas) return null;
      try {
        return canvas.toDataURL('image/png');
      } catch {
        return null;
      }
    },
  }));

  return (
    <div ref={canvasContainerRef} className="w-full h-full" style={{ background: 'linear-gradient(to bottom, #E8F4FF, #F5F9FF)' }}>
      <Canvas
        shadows
        camera={{ position: [0, 3.5, 10], fov: 35 }}
        dpr={Math.min(window.devicePixelRatio, 2)}
        gl={{ 
          antialias: true, 
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
          preserveDrawingBuffer: true,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor('#E8F4FF');
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <SceneContent config={config} />
        </Suspense>
      </Canvas>
    </div>
  );
});