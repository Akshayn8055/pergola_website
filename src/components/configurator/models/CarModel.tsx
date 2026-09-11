import { GarageDoorType } from '@/types/configurator';

const BODY_COLOR = '#6E7C8C';
const GLASS_COLOR = '#2A3138';
const TYRE_COLOR = '#1B1B1D';

// Simple stylised car (length runs along Z, width along X)
export const CarModel = ({ position = [0, 0, 0] as [number, number, number] }) => {
  const wheel = (x: number, z: number) => (
    <mesh
      key={`w-${x}-${z}`}
      position={[x, 0.32, z]}
      rotation={[0, 0, Math.PI / 2]}
      castShadow
    >
      <cylinderGeometry args={[0.32, 0.32, 0.22, 20]} />
      <meshStandardMaterial color={TYRE_COLOR} roughness={0.9} metalness={0.05} />
    </mesh>
  );

  return (
    <group position={position}>
      {/* Lower body */}
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.75, 0.55, 4.3]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.35} metalness={0.5} />
      </mesh>
      {/* Bonnet / boot taper */}
      <mesh position={[0, 0.92, 0.15]} castShadow>
        <boxGeometry args={[1.62, 0.12, 3.9]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.35} metalness={0.5} />
      </mesh>
      {/* Cabin */}
      <mesh position={[0, 1.16, -0.15]} castShadow>
        <boxGeometry args={[1.5, 0.52, 2.1]} />
        <meshStandardMaterial color={GLASS_COLOR} roughness={0.15} metalness={0.3} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 1.44, -0.15]} castShadow>
        <boxGeometry args={[1.5, 0.08, 2.0]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.35} metalness={0.5} />
      </mesh>
      {/* Wheels */}
      {wheel(0.88, 1.35)}
      {wheel(-0.88, 1.35)}
      {wheel(0.88, -1.35)}
      {wheel(-0.88, -1.35)}
    </group>
  );
};

interface CarsProps {
  count: number;
  bayLength: number; // X span available (m)
  y?: number;
}

export const Cars = ({ count, bayLength, y = 0 }: CarsProps) => {
  const cars = [];
  const spacing = bayLength / count;
  for (let i = 0; i < count; i++) {
    const x = -bayLength / 2 + (i + 0.5) * spacing;
    cars.push(<CarModel key={`car-${i}`} position={[x, y, 0]} />);
  }
  return <group>{cars}</group>;
};

interface GarageDoorProps {
  type: GarageDoorType;
  length: number; // X span (m)
  width: number; // Z span (m)
  height: number; // clear height (m)
  color: string;
  openness?: number;
  y?: number;
}

// Garage door rendered across the front opening (positive Z)
export const GarageDoor = ({ type, length, width, height, color, openness = 0, y = 0 }: GarageDoorProps) => {
  if (type === 'none') return null;

  const doorWidth = Math.max(1, length - 0.25);
  // The closed door reaches the exact underside of the front roof beam.
  const doorHeight = Math.max(1, height);
  const visibleHeight = doorHeight * (1 - Math.min(100, Math.max(0, openness)) / 100);
  const z = width / 2 - 0.08;

  // Panel-lift: wide horizontal panels. Garage door: narrower ribbed slats.
  const panelHeight = type === 'panel-lift' ? 0.55 : 0.22;
  const rows = Math.max(1, Math.ceil(doorHeight / panelHeight));
  const rowHeight = doorHeight / rows;
  const visibleRows = Math.ceil(rows * (1 - Math.min(100, Math.max(0, openness)) / 100));

  const panels = [];
  for (let i = 0; i < visibleRows; i++) {
    const panelY = y + height - (i + 0.5) * rowHeight;
    panels.push(
      <mesh key={`panel-${i}`} position={[0, panelY, z]} castShadow receiveShadow>
        <boxGeometry args={[doorWidth, rowHeight + 0.004, 0.06]} />
        <meshStandardMaterial color={color} roughness={0.45} metalness={0.55} />
      </mesh>
    );
  }

  return (
    <group>
      {panels}
      {/* Full-height side guides connect directly into the roof beam. */}
      <mesh position={[doorWidth / 2 + 0.05, y + doorHeight / 2, z]} castShadow>
        <boxGeometry args={[0.08, doorHeight, 0.12]} />
        <meshStandardMaterial color="#4A4A4A" roughness={0.5} metalness={0.6} />
      </mesh>
      <mesh position={[-doorWidth / 2 - 0.05, y + doorHeight / 2, z]} castShadow>
        <boxGeometry args={[0.08, doorHeight, 0.12]} />
        <meshStandardMaterial color="#4A4A4A" roughness={0.5} metalness={0.6} />
      </mesh>
      {visibleHeight > 0 && (
        <mesh position={[0, y + height - 0.025, z]} castShadow>
          <boxGeometry args={[doorWidth + 0.16, 0.05, 0.12]} />
          <meshStandardMaterial color="#4A4A4A" roughness={0.5} metalness={0.6} />
        </mesh>
      )}
    </group>
  );
};
