import { forwardRef, useMemo } from 'react';
import * as THREE from 'three';
import { DeckConfig, DeckSide } from '@/types/configurator';
import { useDeckBoardMaterial } from './WoodTexture';

interface DeckModelProps {
  config: DeckConfig;
  position?: [number, number, number];
}

type Rect = { x: number; z: number; length: number; width: number };

const getFootprint = (shape: DeckConfig['shape'], length: number, width: number): Rect[] => {
  if (shape === 'notched') return [
    { x: 0, z: -width * 0.22, length, width: width * 0.56 },
    { x: -length * 0.22, z: width * 0.28, length: length * 0.56, width: width * 0.44 },
  ];
  if (shape === 'l-left') return [
    { x: 0, z: -width * 0.25, length, width: width * 0.5 },
    { x: -length * 0.25, z: width * 0.25, length: length * 0.5, width: width * 0.5 },
  ];
  if (shape === 'l-right') return [
    { x: 0, z: -width * 0.25, length, width: width * 0.5 },
    { x: length * 0.25, z: width * 0.25, length: length * 0.5, width: width * 0.5 },
  ];
  if (shape === 't-shape') return [
    { x: 0, z: -width * 0.25, length, width: width * 0.5 },
    { x: 0, z: width * 0.25, length: length * 0.42, width: width * 0.5 },
  ];
  return [{ x: 0, z: 0, length, width }];
};

const darken = (hex: string, amount: number) => {
  const c = new THREE.Color(hex);
  c.multiplyScalar(amount);
  return `#${c.getHexString()}`;
};

export const DeckModel = forwardRef<THREE.Group, DeckModelProps>(({ config, position = [0, 0, 0] }, ref) => {
  const length = config.dimensions.length / 1000;
  const width = config.dimensions.width / 1000;
  const height = config.height === 'elevated' ? config.dimensions.height / 1000 : 0.15;
  const sections = useMemo(() => getFootprint(config.shape, length, width), [config.shape, length, width]);
  const boardMaterial = useDeckBoardMaterial(config.color, config.material, config.boardDirection === 'horizontal');
  const frameMaterial = useDeckBoardMaterial(darken(config.color, 0.45), config.material, true);
  const boardWidth = 0.14;

  // Structural sizes
  const fasciaHeight = Math.min(0.3, Math.max(0.18, height * 0.55));
  const joistHeight = fasciaHeight * 0.8;
  const postSize = 0.16;
  const joistSpacing = 0.45;
  const postSpacing = 1.6;

  // Under-deck framing: fascia beams, joists and posts per section
  const framing = useMemo(() => {
    const items: { key: string; pos: [number, number, number]; size: [number, number, number]; frame?: boolean }[] = [];
    sections.forEach((s, si) => {
      const top = height; // underside of boards
      const beamY = top - fasciaHeight / 2 - 0.01;

      // Perimeter fascia beams (deep skirt visible from the side)
      items.push({ key: `f-${si}-front`, pos: [s.x, beamY, s.z + s.width / 2 - 0.03], size: [s.length, fasciaHeight, 0.06], frame: true });
      items.push({ key: `f-${si}-back`, pos: [s.x, beamY, s.z - s.width / 2 + 0.03], size: [s.length, fasciaHeight, 0.06], frame: true });
      items.push({ key: `f-${si}-left`, pos: [s.x - s.length / 2 + 0.03, beamY, s.z], size: [0.06, fasciaHeight, s.width], frame: true });
      items.push({ key: `f-${si}-right`, pos: [s.x + s.length / 2 - 0.03, beamY, s.z], size: [0.06, fasciaHeight, s.width], frame: true });

      // Joists running along the length, spaced across the width
      const joistCount = Math.max(2, Math.round(s.width / joistSpacing));
      for (let i = 0; i <= joistCount; i += 1) {
        const z = s.z - s.width / 2 + (i * s.width) / joistCount;
        items.push({
          key: `j-${si}-${i}`,
          pos: [s.x, top - joistHeight / 2 - 0.03, z],
          size: [s.length - 0.12, joistHeight, 0.05],
          frame: true,
        });
      }

      // Support posts down to the ground
      const postH = Math.max(0.05, top - fasciaHeight);
      if (postH > 0.05) {
        const colsX = Math.max(1, Math.round(s.length / postSpacing));
        const colsZ = Math.max(1, Math.round(s.width / postSpacing));
        for (let i = 0; i <= colsX; i += 1) {
          for (let k = 0; k <= colsZ; k += 1) {
            const px = s.x - s.length / 2 + 0.12 + (i * (s.length - 0.24)) / colsX;
            const pz = s.z - s.width / 2 + 0.12 + (k * (s.width - 0.24)) / colsZ;
            items.push({ key: `p-${si}-${i}-${k}`, pos: [px, postH / 2, pz], size: [postSize, postH, postSize], frame: true });
          }
        }
      }
    });
    return items;
  }, [sections, height, fasciaHeight, joistHeight]);

  // Box stairs with treads, risers, stringers and support posts
  const stairGroups = useMemo(() => {
    const groups: { key: string; side: DeckSide; stepCount: number; rise: number; run: number; stairWidth: number }[] = [];
    (Object.entries(config.stairs) as [DeckSide, DeckConfig['stairs'][DeckSide]][]).forEach(([side, stair]) => {
      if (!stair.enabled) return;
      const stepCount = Math.max(1, Math.round(height / 0.18));
      const rise = height / stepCount;
      const stairWidth = Math.min(stair.width / 1000, side === 'front' || side === 'back' ? length : width);
      groups.push({ key: side, side, stepCount, rise, run: 0.3, stairWidth });
    });
    return groups;
  }, [config.stairs, height, length, width]);

  const railingSegments = [
    { key: 'back', pos: [0, height + 0.52, -width / 2] as [number, number, number], size: [length, 1, 0.04] as [number, number, number] },
    { key: 'left', pos: [-length / 2, height + 0.52, 0] as [number, number, number], size: [0.04, 1, width] as [number, number, number] },
    { key: 'right', pos: [length / 2, height + 0.52, 0] as [number, number, number], size: [0.04, 1, width] as [number, number, number] },
  ];

  return (
    <group ref={ref} position={position}>
      {/* Under-deck framing */}
      {framing.map((f) => (
        <mesh key={f.key} position={f.pos} castShadow receiveShadow>
          <boxGeometry args={f.size} />
          <meshStandardMaterial {...frameMaterial} />
        </mesh>
      ))}

      {/* Decking boards */}
      {sections.map((section, sectionIndex) => {
        const count = Math.max(1, Math.floor((config.boardDirection === 'horizontal' ? section.width : section.length) / boardWidth));
        return (
          <group key={`section-${sectionIndex}`}>
            {Array.from({ length: count }).map((_, i) => {
              const horizontal = config.boardDirection === 'horizontal';
              const pos: [number, number, number] = horizontal
                ? [section.x, height + 0.02, section.z - section.width / 2 + (i + 0.5) * section.width / count]
                : [section.x - section.length / 2 + (i + 0.5) * section.length / count, height + 0.02, section.z];
              const size: [number, number, number] = horizontal
                ? [section.length - 0.02, 0.04, section.width / count - 0.008]
                : [section.length / count - 0.008, 0.04, section.width - 0.02];
              return <mesh key={`board-${sectionIndex}-${i}`} position={pos} castShadow receiveShadow><boxGeometry args={size} /><meshStandardMaterial {...boardMaterial} /></mesh>;
            })}
          </group>
        );
      })}

      {config.railingType !== 'none' && railingSegments.map((segment) => (
        <group key={segment.key}>
          {config.railingType === 'glass' ? (
            <mesh position={segment.pos} castShadow>
              <boxGeometry args={segment.size} />
              <meshPhysicalMaterial color="#BFE7F2" transparent opacity={0.32} transmission={0.55} roughness={0.08} metalness={0.05} />
            </mesh>
          ) : (
            Array.from({ length: segment.key === 'back' ? 8 : 6 }).map((_, i, arr) => {
              const ratio = arr.length === 1 ? 0 : i / (arr.length - 1) - 0.5;
              const pos: [number, number, number] = segment.key === 'back'
                ? [ratio * length, segment.pos[1], segment.pos[2]]
                : [segment.pos[0], segment.pos[1], ratio * width];
              return <mesh key={i} position={pos} castShadow><boxGeometry args={[0.04, 1, 0.04]} /><meshStandardMaterial color="#3B3F42" metalness={0.75} roughness={0.28} /></mesh>;
            })
          )}
          {config.handrailType !== 'none' && (
            <mesh position={[segment.pos[0], height + 1.04, segment.pos[2]]} castShadow>
              <boxGeometry args={segment.key === 'back' ? [length, 0.07, 0.07] : [0.07, 0.07, width]} />
              <meshStandardMaterial color={config.handrailType === 'timber' ? config.color : '#3B3F42'} metalness={config.handrailType === 'aluminum' ? 0.75 : 0} roughness={0.35} />
            </mesh>
          )}
        </group>
      ))}

      {/* Stairs: closed-box steps with treads, risers and stringers */}
      {stairGroups.map(({ key, side, stepCount, rise, run, stairWidth }) => {
        const isZ = side === 'front' || side === 'back';
        const dir = side === 'front' || side === 'right' ? 1 : -1;
        const edge = isZ ? width / 2 : length / 2;
        const totalRun = stepCount * run;

        const place = (along: number, y: number, acrossSize: number, alongSize: number, ySize: number, k: string) => {
          const pos: [number, number, number] = isZ
            ? [0, y, dir * (edge + along)]
            : [dir * (edge + along), y, 0];
          const size: [number, number, number] = isZ
            ? [acrossSize, ySize, alongSize]
            : [alongSize, ySize, acrossSize];
          return (
            <mesh key={k} position={pos} castShadow receiveShadow>
              <boxGeometry args={size} />
              <meshStandardMaterial {...(ySize <= 0.06 ? boardMaterial : frameMaterial)} />
            </mesh>
          );
        };

        const parts = [];
        for (let i = 0; i < stepCount; i += 1) {
          const stepTop = height - i * rise;
          const alongStart = i * run;
          // riser (vertical face)
          parts.push(place(alongStart + 0.02, stepTop - rise / 2, stairWidth, 0.05, rise, `${key}-riser-${i}`));
          // closed box side under tread
          parts.push(place(alongStart + run / 2, stepTop - rise / 2, stairWidth - 0.02, run, rise * 0.98, `${key}-box-${i}`));
          // tread board on top
          parts.push(place(alongStart + run / 2, stepTop + 0.025, stairWidth + 0.04, run + 0.05, 0.05, `${key}-tread-${i}`));
        }
        // Angled solid side stringers (raked plank following the stair slope)
        const angle = Math.atan2(height, totalRun);
        const hyp = Math.sqrt(height * height + totalRun * totalRun);
        const plankDepth = Math.max(0.28, rise * 1.6);
        for (const s of [-1, 1]) {
          const cx = s * (stairWidth / 2 + 0.04);
          // midpoint of the slope line, dropped half the plank depth perpendicular to it
          const midAlong = totalRun / 2 + (plankDepth / 2) * Math.sin(angle) * 0;
          const midY = height / 2 - plankDepth / 2 + 0.02;
          const pos: [number, number, number] = isZ
            ? [cx, midY, dir * (edge + midAlong)]
            : [dir * (edge + midAlong), midY, cx];
          const size: [number, number, number] = isZ ? [0.07, plankDepth, hyp] : [hyp, plankDepth, 0.07];
          const rotation: [number, number, number] = isZ
            ? [dir > 0 ? angle : Math.PI - angle, 0, 0]
            : [0, 0, dir > 0 ? -angle : Math.PI + angle];
          parts.push(
            <mesh key={`${key}-stringer-${s}`} position={pos} rotation={rotation} castShadow receiveShadow>
              <boxGeometry args={size} />
              <meshStandardMaterial {...boardMaterial} />
            </mesh>
          );
        }
        return <group key={`stairs-${key}`}>{parts}</group>;
      })}
    </group>
  );
});

DeckModel.displayName = 'DeckModel';
