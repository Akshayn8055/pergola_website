import { Html } from '@react-three/drei';
import { useMemo } from 'react';

interface DimensionLabelsProps {
  length: number; // in meters
  width: number;
  height: number;
  position?: [number, number, number];
}

export const DimensionLabels = ({ length, width, height, position = [0, 0, 0] }: DimensionLabelsProps) => {
  const formatDimension = (meters: number) => {
    return `${(meters).toFixed(2)}m`;
  };

  const labelStyle: React.CSSProperties = {
    background: 'rgba(0, 0, 0, 0.75)',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '9px',
    fontWeight: 600,
    fontFamily: 'system-ui, sans-serif',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    userSelect: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  };

  const arrowStyle: React.CSSProperties = {
    fontSize: '8px',
  };

  return (
    <group position={position}>
      {/* Length label (X-axis) - positioned at front */}
      <Html
        position={[0, 0.1, width / 2 + 0.3]}
        center
        distanceFactor={8}
        occlude={false}
        zIndexRange={[0, 0]}
      >
        <div style={labelStyle}>
          <span style={arrowStyle}>↔</span>
          <span>Length: {formatDimension(length)}</span>
        </div>
      </Html>

      {/* Width label (Z-axis) - positioned at side */}
      <Html
        position={[length / 2 + 0.3, 0.1, 0]}
        center
        distanceFactor={8}
        occlude={false}
        zIndexRange={[0, 0]}
      >
        <div style={labelStyle}>
          <span style={arrowStyle}>↔</span>
          <span>Width: {formatDimension(width)}</span>
        </div>
      </Html>

      {/* Height label (Y-axis) - positioned at corner */}
      <Html
        position={[length / 2 + 0.3, height / 2, width / 2 + 0.3]}
        center
        distanceFactor={8}
        occlude={false}
        zIndexRange={[0, 0]}
      >
        <div style={labelStyle}>
          <span style={arrowStyle}>↕</span>
          <span>Height: {formatDimension(height)}</span>
        </div>
      </Html>

      {/* Dimension lines */}
      {/* Length line */}
      <group position={[0, 0.05, width / 2 + 0.15]}>
        <mesh>
          <boxGeometry args={[length, 0.01, 0.01]} />
          <meshBasicMaterial color="#FFD700" />
        </mesh>
        {/* End caps */}
        <mesh position={[-length / 2, 0, 0]}>
          <boxGeometry args={[0.01, 0.08, 0.01]} />
          <meshBasicMaterial color="#FFD700" />
        </mesh>
        <mesh position={[length / 2, 0, 0]}>
          <boxGeometry args={[0.01, 0.08, 0.01]} />
          <meshBasicMaterial color="#FFD700" />
        </mesh>
      </group>

      {/* Width line */}
      <group position={[length / 2 + 0.15, 0.05, 0]}>
        <mesh>
          <boxGeometry args={[0.01, 0.01, width]} />
          <meshBasicMaterial color="#FFD700" />
        </mesh>
        {/* End caps */}
        <mesh position={[0, 0, -width / 2]}>
          <boxGeometry args={[0.01, 0.08, 0.01]} />
          <meshBasicMaterial color="#FFD700" />
        </mesh>
        <mesh position={[0, 0, width / 2]}>
          <boxGeometry args={[0.01, 0.08, 0.01]} />
          <meshBasicMaterial color="#FFD700" />
        </mesh>
      </group>

      {/* Height line */}
      <group position={[length / 2 + 0.15, height / 2, width / 2 + 0.15]}>
        <mesh>
          <boxGeometry args={[0.01, height, 0.01]} />
          <meshBasicMaterial color="#FFD700" />
        </mesh>
        {/* End caps */}
        <mesh position={[0, -height / 2, 0]}>
          <boxGeometry args={[0.08, 0.01, 0.01]} />
          <meshBasicMaterial color="#FFD700" />
        </mesh>
        <mesh position={[0, height / 2, 0]}>
          <boxGeometry args={[0.08, 0.01, 0.01]} />
          <meshBasicMaterial color="#FFD700" />
        </mesh>
      </group>
    </group>
  );
};
