import { useMemo, forwardRef } from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import { PergolaConfig } from '@/types/configurator';
import { useWoodMaterial } from './WoodTexture';

interface PergolaModelProps {
  config: PergolaConfig;
  position?: [number, number, number];
}

export const PergolaModel = forwardRef<THREE.Group, PergolaModelProps>(({ config, position = [0, 0, 0] }, ref) => {
  const { dimensions, material, frameColor, roofType, roofColor, lighting, type, mounting, mountedSide = 'longer', panels, louveredAngle = 0, retractableOpenness = 0, roofPitch = 8 } = config;
  
  // Convert mm to meters - swap length/width when shorter side is wall-mounted
  const isShortMounted = mounting === 'wall-mounted' && mountedSide === 'shorter';
  const length = isShortMounted ? dimensions.width / 1000 : dimensions.length / 1000;
  const width = isShortMounted ? dimensions.length / 1000 : dimensions.width / 1000;
  const height = dimensions.height / 1000;
  
  // Modern pergola proportions matching reference images
  // Pro: Standard louvered roof with clean frame
  // Luxe: Dense louvered slats for premium shade control
  // Sky: Solid/flat roof for maximum coverage
  const adjustedFrameColor = frameColor;
  
  // Chunky modern posts and beams - consistent across all types
  const postSize = 0.15; // 150mm square posts
  const beamHeight = 0.22; // 220mm main beam height
  const beamWidth = 0.12; // 120mm beam depth
  
  // Perimeter fascia - tall enough to contain beams + slats flush
  const slatTotalHeight = 0.018 + 0.045; // flat blade plus raised weather-seal lip
  const perimeterFrameHeight = beamHeight + slatTotalHeight + 0.01; // Covers beams + slats
  const perimeterFrameWidth = 0.08;
  
  // Slat configuration based on roofType and pergola type
  // roofType controls what roof is shown:
  // - 'open' = no slats, just frame
  // - 'louvered' = adjustable slats (density based on pergola type)
  // - 'polycarbonate' = transparent panel
  // - 'solid' = opaque solid panel
  const showLouveredSlats = roofType === 'louvered' || roofType === 'louvered-200';
  const isWideLouvre = roofType === 'louvered-200';
  const showSolidRoof = roofType === 'solid' || type === 'sky';
  const showPolycarbonateRoof = roofType === 'polycarbonate';
  // Glass and polycarbonate roofs share the same framed pane construction.
  const showFramedTransparentRoof = showPolycarbonateRoof;
  const showRetractableRoof = roofType === 'retractable';
  const showFabricRoof = roofType === 'fabric';
  // Steel sheeting roofs (insulated panel or single-skin)
  const showSteelRoof = roofType === 'insulated' || roofType === 'non-insulated';
  const roofProfile = config.roofProfile ?? 'trimdek';
  const roofSheetColor = config.roofSheetColor ?? roofColor;
  const skylight = config.skylight ?? false;
  
  // Closely packed extruded aluminium blades matching the reference roof.
  // The blades span the pergola WIDTH and repeat along its LENGTH in two bays.
  const innerLength = length - perimeterFrameWidth * 2;
  const innerWidth = width - perimeterFrameWidth * 2;
  const centreBeamWidth = 0.12;
  const roofBayLength = Math.max(0.2, (innerLength - centreBeamWidth) / 2);
  const targetSlatPitch = isWideLouvre ? 0.205 : type === 'luxe' ? 0.115 : 0.125;
  const slatsPerBay = Math.max(2, Math.round(roofBayLength / targetSlatPitch));
  const slatSpacing = roofBayLength / slatsPerBay;

  // Broad blades that overlap slightly when closed, so no daylight gaps and no
  // coplanar faces between neighbours (which caused z-fighting/flicker).
  const slatBaseWidth = slatSpacing * 1.04;
  const slatBaseHeight = 0.018;
  const slatRidgeWidth = 0.018;
  const slatRidgeHeight = 0.045;
  
  // Louvered angle control (0 = closed/horizontal, 90 = open/vertical)
  const slatAngle = showLouveredSlats ? (louveredAngle * Math.PI / 180) : 0;

  // Use wood texture materials with bump and normal maps
  const frameMaterial = useWoodMaterial(adjustedFrameColor, material);
  const roofMaterial = useWoodMaterial(
    showLouveredSlats ? roofSheetColor : roofColor,
    material
  );

  // Trapezoidal Trimdek-style rib profile, extruded 1m along Z and scaled to fit
  const trimdekRibGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.05, 0);
    shape.lineTo(-0.032, 0.036);
    shape.lineTo(0.032, 0.036);
    shape.lineTo(0.05, 0);
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false });
  }, []);

  // CGI (corrugated) sheet: one continuous sine profile across the full sheet
  // length, extruded 1m along Z and scaled to the roof depth.
  const cgiSheetGeometry = useMemo(() => {
    const sheetLen = Math.max(0.5, length - 0.16);
    const pitch = 0.076;
    const amp = 0.011;
    const thickness = 0.009;
    const steps = Math.max(64, Math.round((sheetLen / pitch) * 8));
    const shape = new THREE.Shape();
    const yAt = (x: number) => amp * Math.cos((x / pitch) * Math.PI * 2);
    for (let i = 0; i <= steps; i++) {
      const x = -sheetLen / 2 + (sheetLen * i) / steps;
      const y = yAt(x);
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    for (let i = steps; i >= 0; i--) {
      const x = -sheetLen / 2 + (sheetLen * i) / steps;
      shape.lineTo(x, yAt(x) - thickness);
    }
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false });
  }, [length]);

  // No rotation needed - we swap length/width instead for stability

  // Calculate post positions based on mounting type
  const totalRoofHeight = perimeterFrameHeight; // Total height of roof assembly above post top
  const postPositions: [number, number, number][] = useMemo(() => {
    if (mounting === 'integrated' || mounting === 'wall-nested') {
      return [];
    }
    if (mounting === 'wall-mounted' || mounting === 'flyover') {
      return [
        [-length / 2 + postSize / 2, (height + totalRoofHeight) / 2, width / 2 - postSize / 2],
        [length / 2 - postSize / 2, (height + totalRoofHeight) / 2, width / 2 - postSize / 2],
      ];
    }
    if (mounting === 'corner-mounted') {
      // One front-left post; the rear and right sides attach to the walls
      return [
        [-length / 2 + postSize / 2, (height + totalRoofHeight) / 2, width / 2 - postSize / 2],
      ];
    }
    const y = (height + totalRoofHeight) / 2;
    const zFront = width / 2 - postSize / 2;
    const zBack = -width / 2 + postSize / 2;
    const result: [number, number, number][] = [
      [-length / 2 + postSize / 2, y, zBack],
      [length / 2 - postSize / 2, y, zBack],
      [-length / 2 + postSize / 2, y, zFront],
      [length / 2 - postSize / 2, y, zFront],
    ];
    // Carport bays: add intermediate posts between car spaces
    const bays = type === 'luxe' ? Math.max(1, Math.min(3, config.carSpaces ?? 1)) : 1;
    for (let i = 1; i < bays; i++) {
      const x = -length / 2 + (i * length) / bays;
      result.push([x, y, zBack], [x, y, zFront]);
    }
    return result;
  }, [length, width, height, postSize, mounting, totalRoofHeight, type, config.carSpaces]);

  const hasRearWall = mounting !== 'freestanding';
  // Flyover: roof pivots on the front edge and rises towards the house wall
  const isFlyover = mounting === 'flyover';
  const pitchRad = isFlyover ? (roofPitch * Math.PI) / 180 : 0;
  // Roof pivots on the FRONT top edge so the front fascia and posts never move.
  // The roof plane is stretched along Z by 1/cos(pitch) so its horizontal span
  // stays exactly `width` — the rear edge therefore always meets the house wall.
  const roofScaleZ = isFlyover ? 1 / Math.cos(pitchRad) : 1;
  const rearRise = isFlyover ? width * Math.tan(pitchRad) : 0;
  // Equivalent single-group transform for pivot at (0, height, width/2)
  const roofTiltPos: [number, number, number] = isFlyover
    ? [
        0,
        height * (1 - Math.cos(pitchRad)) + (width / 2) * Math.tan(pitchRad),
        -height * Math.sin(pitchRad),
      ]
    : [0, 0, 0];
  const hasRightWall = mounting === 'corner-mounted' || mounting === 'wall-nested';
  const hasLeftWall = mounting === 'wall-nested';
  const hasRearBeam = mounting === 'freestanding';

  // Two equal banks of blades, separated by the centre structural rail seen in the reference.
  const slatPositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    const fasciaTop = height + perimeterFrameHeight;
    const slatY = fasciaTop - slatTotalHeight / 2 - 0.005;
    const leftBayStart = -innerLength / 2;
    const rightBayStart = centreBeamWidth / 2;

    for (let i = 0; i < slatsPerBay; i++) {
      const offset = (i + 0.5) * slatSpacing;
      positions.push([leftBayStart + offset, slatY, 0]);
      positions.push([rightBayStart + offset, slatY, 0]);
    }
    return positions;
  }, [height, innerLength, perimeterFrameHeight, slatSpacing, slatsPerBay]);

  // Panel rendering helper - louvered horizontal slats with vertical dividers
  const renderPanel = (side: 'front' | 'back' | 'left' | 'right') => {
    const panel = panels[side];
    if (!panel.enabled || panel.type === 'open') return null;

    const panelColor = new THREE.Color(panel.color);
    
    // Panel dimensions based on side - span between post centers for proper attachment
    const isLengthSide = side === 'front' || side === 'back';
    const isWallMounted = mounting === 'wall-mounted';
    const isSidePanelWallMounted = isWallMounted && !isLengthSide;
    // For wall-mounted side panels, extend from wall to front post
    const panelWidth = isLengthSide 
      ? length - postSize 
      : (isSidePanelWallMounted ? width - postSize / 2 : width - postSize);
    const panelHeight = height + beamHeight; // Extend to the underside of the roof
    const panelThickness = 0.08;
    
    // Calculate panel position - align to inner face of posts
    const getPanelPosition = (): [number, number, number] => {
      const yCenter = (height + beamHeight) / 2;
      // For wall-mounted side panels, shift center toward wall
      const sidePanelZ = isSidePanelWallMounted 
        ? (-width / 2 + width / 2 - postSize / 2) / 2 
        : 0;
      switch (side) {
        case 'front':
          return [0, yCenter, width / 2 - postSize / 2];
        case 'back':
          return [0, yCenter, -width / 2 + postSize / 2];
        case 'left':
          return [-length / 2 + postSize / 2, yCenter, sidePanelZ];
        case 'right':
          return [length / 2 - postSize / 2, yCenter, sidePanelZ];
      }
    };

    const panelPosition = getPanelPosition();

    // Glass panel
    if (panel.type === 'glass') {
      const glassSize: [number, number, number] = isLengthSide 
        ? [panelWidth, panelHeight, 0.02]
        : [0.02, panelHeight, panelWidth];
      
      return (
        <group key={`panel-${side}`}>
          <mesh position={panelPosition} castShadow receiveShadow>
            <boxGeometry args={glassSize} />
            <meshPhysicalMaterial 
              color="#E8F4F8"
              transparent
              opacity={0.3}
              roughness={0}
              metalness={0.1}
              transmission={0.95}
              thickness={0.5}
            />
          </mesh>
          {/* Frame around glass */}
          {renderPanelFrame(side, panelPosition, panelWidth, panelHeight)}
        </group>
      );
    }

    // Privacy panel - retractable roller blind (semi-transparent dark mesh)
    if (
      panel.type === 'privacy' ||
      panel.type === 'outdoor-blind' ||
      panel.type === 'blind-regent' ||
      panel.type === 'blind-windsor'
    ) {
      const isRegent = panel.type === 'blind-regent';
      const isWindsor = panel.type === 'blind-windsor';
      const blindFrameMaterial = (isRegent || isWindsor)
        ? {
            color: isWindsor ? '#C9CDD0' : (panel.frameColor || frameMaterial.color),
            metalness: isWindsor ? 0.9 : 0.6,
            roughness: isWindsor ? 0.2 : 0.45,
          }
        : frameMaterial;
      const fabricOpacity = isRegent || isWindsor
        ? ({ 1: 0.9, 5: 0.75, 15: 0.55 } as Record<number, number>)[panel.fabricOpenness ?? 5] ?? 0.75
        : 0.55;
      const openness = (panel.openness ?? 100) / 100; // 0 = fully retracted (up), 100 = fully deployed (down)
      const frameThickness = 0.04;
      const housingHeight = 0.08; // Roller housing at the top
      const housingDepth = 0.10;
      const deployedHeight = (panelHeight - frameThickness * 2) * openness;
      const blindThickness = 0.008;

      const elements: JSX.Element[] = [];

      // Side guides: zip-guided aluminium tracks (Regent) or stainless wires (Windsor)
      const railWidth = isRegent ? 0.05 : isWindsor ? 0.012 : 0.025;
      const leftRailOffset = isLengthSide ? -panelWidth / 2 + railWidth / 2 : 0;
      const leftRailZ = isLengthSide ? 0 : -panelWidth / 2 + railWidth / 2;
      const rightRailOffset = isLengthSide ? panelWidth / 2 - railWidth / 2 : 0;
      const rightRailZ = isLengthSide ? 0 : panelWidth / 2 - railWidth / 2;

      elements.push(
        <mesh key={`${side}-rail-l`} position={[panelPosition[0] + leftRailOffset, panelPosition[1], panelPosition[2] + leftRailZ]} castShadow>
          <boxGeometry args={isLengthSide ? [railWidth, panelHeight, housingDepth * 0.5] : [housingDepth * 0.5, panelHeight, railWidth]} />
          <meshStandardMaterial {...blindFrameMaterial} />
        </mesh>
      );
      elements.push(
        <mesh key={`${side}-rail-r`} position={[panelPosition[0] + rightRailOffset, panelPosition[1], panelPosition[2] + rightRailZ]} castShadow>
          <boxGeometry args={isLengthSide ? [railWidth, panelHeight, housingDepth * 0.5] : [housingDepth * 0.5, panelHeight, railWidth]} />
          <meshStandardMaterial {...blindFrameMaterial} />
        </mesh>
      );

      // Top housing (roller cassette) - always visible
      elements.push(
        <mesh key={`${side}-housing`} position={[panelPosition[0], panelPosition[1] + panelHeight / 2 - housingHeight / 2, panelPosition[2]]} castShadow>
          <boxGeometry args={isLengthSide ? [panelWidth, housingHeight, housingDepth] : [housingDepth, housingHeight, panelWidth]} />
          <meshStandardMaterial {...blindFrameMaterial} />
        </mesh>
      );

      // Bottom bar (weighted hem bar) - moves with the blind
      if (openness > 0.02) {
        const barHeight = 0.03;
        const barY = panelPosition[1] + panelHeight / 2 - housingHeight - deployedHeight + barHeight / 2;
        elements.push(
          <mesh key={`${side}-bar`} position={[panelPosition[0], barY, panelPosition[2]]} castShadow>
            <boxGeometry args={isLengthSide ? [panelWidth - railWidth * 2, barHeight, housingDepth * 0.4] : [housingDepth * 0.4, barHeight, panelWidth - railWidth * 2]} />
            <meshStandardMaterial {...blindFrameMaterial} />
          </mesh>
        );
      }

      // The mesh fabric - semi-transparent dark screen
      if (openness > 0.02) {
        const fabricY = panelPosition[1] + panelHeight / 2 - housingHeight - deployedHeight / 2;
        const fabricWidth = panelWidth - railWidth * 2.5;
        elements.push(
          <mesh key={`${side}-fabric`} position={[panelPosition[0], fabricY, panelPosition[2]]}>
            <boxGeometry args={isLengthSide ? [fabricWidth, deployedHeight, blindThickness] : [blindThickness, deployedHeight, fabricWidth]} />
            <meshPhysicalMaterial
              color={panel.color || '#3E3E3C'}
              transparent
              opacity={fabricOpacity}
              roughness={0.9}
              metalness={0}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      }

      return <group key={`panel-${side}`}>{elements}</group>;
    }

    // Sliding glass door panel
    if (panel.type === 'sliding-glass' || panel.type === 'stacker-glass') {
      return renderSlidingGlassPanel(side, panelPosition, panelWidth, panelHeight);
    }

    // Gridded sliding glass wall with a hinged access door
    if (panel.type === 'sliding-glass-door') {
      return renderSlidingGlassWithDoor(side, panelPosition, panelWidth, panelHeight, panel.openness ?? 0);
    }

    // Versiclad Panelink walls (full height / 900 mm dwarf / dwarf + windows)
    if (panel.type === 'panelink-full') {
      return renderPanelinkWall(side, panelPosition, panelWidth, panelHeight, panelHeight, panel.color);
    }

    if (panel.type === 'panelink-dwarf') {
      return renderPanelinkWall(side, panelPosition, panelWidth, panelHeight, Math.min(0.9, panelHeight), panel.color);
    }

    if (panel.type === 'dwarf-windows') {
      const wallH = Math.min(0.9, panelHeight * 0.6);
      const bottomY = panelPosition[1] - panelHeight / 2;
      const glassH = panelHeight - wallH;
      const glassPos: [number, number, number] = [
        panelPosition[0],
        bottomY + wallH + glassH / 2,
        panelPosition[2],
      ];
      return (
        <group key={`panel-${side}`}>
          {renderPanelinkWall(side, panelPosition, panelWidth, panelHeight, wallH, panel.color)}
          {renderSlidingGlassPanel(side, glassPos, panelWidth, glassH)}
        </group>
      );
    }

    // Guillotine glass - two vertically stacked glazed sections with strong horizontal rails
    if (panel.type === 'guillotine-glass') {
      return renderGuillotineGlassPanel(side, panelPosition, panelWidth, panelHeight);
    }

    // Fixed glass wall - full-height panes with substantial aluminium mullions
    if (panel.type === 'fixed-glass-wall') {
      return renderFixedGlassWall(side, panelPosition, panelWidth, panelHeight);
    }

    // Slatted panel - horizontal louvers with vertical dividers (matching reference)
    if (panel.type === 'slatted') {
      return renderSlattedPanel(side, panelPosition, panelWidth, panelHeight, panelThickness);
    }

    if (panel.type === 'slats-wall') {
      return renderSlatsWall(side, panelPosition, panelWidth, panelHeight);
    }

    return null;
  };

  // Versiclad Panelink clad wall (full height or 900 mm dwarf wall)
  const renderPanelinkWall = (
    side: 'front' | 'back' | 'left' | 'right',
    position: [number, number, number],
    panelWidth: number,
    panelHeight: number,
    wallHeight: number,
    wallColor?: string
  ) => {
    const isLengthSide = side === 'front' || side === 'back';
    const wallThickness = 0.075;
    const cladColor = wallColor || '#E6E3DC';
    const bottomY = position[1] - panelHeight / 2;
    const centreY = bottomY + wallHeight / 2;
    const elements: JSX.Element[] = [];

    const size = (w: number, h: number, t: number): [number, number, number] =>
      isLengthSide ? [w, h, t] : [t, h, w];
    const at = (offset: number, y: number): [number, number, number] =>
      isLengthSide ? [position[0] + offset, y, position[2]] : [position[0], y, position[2] + offset];

    // Cladding face
    elements.push(
      <mesh key={`${side}-pl-face`} position={at(0, centreY)} castShadow receiveShadow>
        <boxGeometry args={size(panelWidth, wallHeight, wallThickness)} />
        <meshStandardMaterial color={cladColor} roughness={0.65} metalness={0.05} />
      </mesh>
    );

    // Vertical Panelink joins
    const joinCount = Math.max(2, Math.round(panelWidth / 0.6));
    for (let i = 1; i < joinCount; i++) {
      const offset = -panelWidth / 2 + (i * panelWidth) / joinCount;
      elements.push(
        <mesh key={`${side}-pl-join-${i}`} position={at(offset, centreY)}>
          <boxGeometry args={size(0.012, wallHeight * 0.98, wallThickness * 1.05)} />
          <meshStandardMaterial color={new THREE.Color(cladColor).multiplyScalar(0.9)} roughness={0.6} metalness={0.1} />
        </mesh>
      );
    }

    // Capping rail and floor track
    elements.push(
      <mesh key={`${side}-pl-cap`} position={at(0, bottomY + wallHeight - 0.025)} castShadow>
        <boxGeometry args={size(panelWidth, 0.05, wallThickness * 1.25)} />
        <meshStandardMaterial {...frameMaterial} />
      </mesh>
    );
    elements.push(
      <mesh key={`${side}-pl-base`} position={at(0, bottomY + 0.025)} castShadow>
        <boxGeometry args={size(panelWidth, 0.05, wallThickness * 1.25)} />
        <meshStandardMaterial {...frameMaterial} />
      </mesh>
    );

    return <group key={`panel-${side}`}>{elements}</group>;
  };

  // Render sliding glass door panel
  const renderSlidingGlassPanel = (
    side: 'front' | 'back' | 'left' | 'right',
    position: [number, number, number],
    panelWidth: number,
    panelHeight: number
  ) => {
    const isLengthSide = side === 'front' || side === 'back';
    const frameThickness = 0.04;
    const frameDepth = 0.06;
    const numPanels = 4;
    const innerPanelWidth = panelWidth - frameThickness * 2;
    const panelSectionWidth = innerPanelWidth / numPanels;
    const numRows = 2;
    const usableHeight = panelHeight - frameThickness * 2;
    const rowHeight = (usableHeight - frameThickness * (numRows - 1)) / numRows;
    const thinFrame = frameThickness * 0.6;
    
    // Openness: 0 = closed, 100 = fully open (panels stack inside at one end)
    const openness = (panels[side]?.openness ?? 0) / 100;
    // When open, panels slide and stack toward the right/positive end, staying inside the frame
    // Each panel compresses toward the stacking position
    const stackWidth = panelSectionWidth * 1.05; // Width of stacked area
    const maxSlide = innerPanelWidth - stackWidth; // Max distance a panel can slide
    
    const elements: JSX.Element[] = [];
    
    // Outer frame (top, bottom, left post, right post) - always static
    // Top rail
    elements.push(
      <mesh key={`${side}-sg-top`} position={[position[0], position[1] + panelHeight / 2 - frameThickness / 2, position[2]]} castShadow>
        <boxGeometry args={isLengthSide ? [panelWidth, frameThickness, frameDepth] : [frameDepth, frameThickness, panelWidth]} />
        <meshStandardMaterial {...frameMaterial} />
      </mesh>
    );
    // Bottom rail / track
    elements.push(
      <mesh key={`${side}-sg-bot`} position={[position[0], position[1] - panelHeight / 2 + frameThickness / 2, position[2]]} castShadow>
        <boxGeometry args={isLengthSide ? [panelWidth, frameThickness * 1.2, frameDepth] : [frameDepth, frameThickness * 1.2, panelWidth]} />
        <meshStandardMaterial {...frameMaterial} />
      </mesh>
    );
    // Left post
    elements.push(
      <mesh key={`${side}-sg-lp`} position={[position[0] + (isLengthSide ? -panelWidth / 2 + frameThickness / 2 : 0), position[1], position[2] + (isLengthSide ? 0 : -panelWidth / 2 + frameThickness / 2)]} castShadow>
        <boxGeometry args={isLengthSide ? [frameThickness, panelHeight, frameDepth] : [frameDepth, panelHeight, frameThickness]} />
        <meshStandardMaterial {...frameMaterial} />
      </mesh>
    );
    // Right post
    elements.push(
      <mesh key={`${side}-sg-rp`} position={[position[0] + (isLengthSide ? panelWidth / 2 - frameThickness / 2 : 0), position[1], position[2] + (isLengthSide ? 0 : panelWidth / 2 - frameThickness / 2)]} castShadow>
        <boxGeometry args={isLengthSide ? [frameThickness, panelHeight, frameDepth] : [frameDepth, panelHeight, frameThickness]} />
        <meshStandardMaterial {...frameMaterial} />
      </mesh>
    );
    
    // Sliding panels - each panel slides toward the right end when opening
    for (let p = 0; p < numPanels; p++) {
      // Closed position: evenly distributed
      const closedCenter = -innerPanelWidth / 2 + (p + 0.5) * panelSectionWidth;
      // Open position: all panels stack at the right end inside the frame
      const openCenter = innerPanelWidth / 2 - stackWidth / 2 - (numPanels - 1 - p) * (panelSectionWidth * 0.08);
      // Interpolate based on openness
      const currentCenter = closedCenter + (openCenter - closedCenter) * openness;
      
      // Slight Z offset per panel so they don't z-fight when stacked
      const zStackOffset = p * 0.015;
      
      const panelX = isLengthSide ? position[0] + currentCenter : position[0];
      const panelZ = isLengthSide ? position[2] + zStackOffset : position[2] + currentCenter;
      const xStackOffset = isLengthSide ? 0 : zStackOffset;
      
      // Panel frame (vertical dividers on each side of this panel section)
      const leftEdge = currentCenter - panelSectionWidth / 2;
      const rightEdge = currentCenter + panelSectionWidth / 2;
      
      // Left divider of panel
      elements.push(
        <mesh key={`${side}-sg-vdl-${p}`} position={[
          isLengthSide ? position[0] + leftEdge : position[0] + xStackOffset,
          position[1],
          isLengthSide ? position[2] + zStackOffset : position[2] + leftEdge
        ]} castShadow>
          <boxGeometry args={isLengthSide ? [thinFrame, panelHeight - frameThickness * 2, frameDepth * 0.5] : [frameDepth * 0.5, panelHeight - frameThickness * 2, thinFrame]} />
          <meshStandardMaterial {...frameMaterial} />
        </mesh>
      );
      // Right divider of panel
      elements.push(
        <mesh key={`${side}-sg-vdr-${p}`} position={[
          isLengthSide ? position[0] + rightEdge : position[0] + xStackOffset,
          position[1],
          isLengthSide ? position[2] + zStackOffset : position[2] + rightEdge
        ]} castShadow>
          <boxGeometry args={isLengthSide ? [thinFrame, panelHeight - frameThickness * 2, frameDepth * 0.5] : [frameDepth * 0.5, panelHeight - frameThickness * 2, thinFrame]} />
          <meshStandardMaterial {...frameMaterial} />
        </mesh>
      );
      
      // Single full-height glass pane (no mid-bar)
      const glassWidth = panelSectionWidth - thinFrame * 1.5;
      const glassHeight = usableHeight - thinFrame;
      elements.push(
        <mesh key={`${side}-sg-g-${p}`} position={[panelX + (isLengthSide ? 0 : xStackOffset), position[1], panelZ]}>
          <boxGeometry args={isLengthSide ? [glassWidth, glassHeight, 0.012] : [0.012, glassHeight, glassWidth]} />
          <meshPhysicalMaterial color="#D8EBF2" transparent opacity={0.25} roughness={0} metalness={0.1} transmission={0.9} thickness={0.5} />
        </mesh>
      );
    }
    
    return <group key={`panel-${side}`}>{elements}</group>;
  };

  const renderGuillotineGlassPanel = (
    side: 'front' | 'back' | 'left' | 'right',
    position: [number, number, number],
    panelWidth: number,
    panelHeight: number
  ) => {
    const isLengthSide = side === 'front' || side === 'back';
    const frameThickness = 0.055;
    const centerThickness = 0.10; // thicker center mullion + middle rail
    const frameDepth = 0.075;
    const innerWidth = panelWidth - frameThickness * 2;
    const innerHeight = panelHeight - frameThickness * 2;
    const bayWidth = (innerWidth - centerThickness) / 2;
    const paneHeight = (innerHeight - centerThickness) / 2;
    const elements: JSX.Element[] = [];

    const frameBox = (
      key: string,
      offsetX: number,
      offsetY: number,
      offsetZ: number,
      horizontal: boolean,
      thick = false
    ) => {
      const thickness = thick ? centerThickness : frameThickness;
      const size: [number, number, number] = horizontal
        ? (isLengthSide ? [panelWidth, thickness, frameDepth] : [frameDepth, thickness, panelWidth])
        : (isLengthSide ? [thickness, panelHeight, frameDepth] : [frameDepth, panelHeight, thickness]);
      elements.push(
        <mesh key={key} position={[position[0] + offsetX, position[1] + offsetY, position[2] + offsetZ]} castShadow>
          <boxGeometry args={size} />
          <meshStandardMaterial {...frameMaterial} />
        </mesh>
      );
    };

    frameBox(`${side}-gg-top`, 0, panelHeight / 2 - frameThickness / 2, 0, true);
    frameBox(`${side}-gg-middle`, 0, 0, 0, true, true);
    frameBox(`${side}-gg-bottom`, 0, -panelHeight / 2 + frameThickness / 2, 0, true);
    frameBox(`${side}-gg-left`, isLengthSide ? -panelWidth / 2 + frameThickness / 2 : 0, 0, isLengthSide ? 0 : -panelWidth / 2 + frameThickness / 2, false);
    frameBox(`${side}-gg-center`, 0, 0, 0, false, true);
    frameBox(`${side}-gg-right`, isLengthSide ? panelWidth / 2 - frameThickness / 2 : 0, 0, isLengthSide ? 0 : panelWidth / 2 - frameThickness / 2, false);

    for (let column = 0; column < 2; column++) {
      for (let row = 0; row < 2; row++) {
        const across = -innerWidth / 2 + bayWidth * (column + 0.5) + (column === 0 ? -centerThickness / 2 : centerThickness / 2);
        const paneY = row === 0
          ? -paneHeight / 2 - centerThickness / 2
          : paneHeight / 2 + centerThickness / 2;
        elements.push(
          <mesh
            key={`${side}-gg-pane-${column}-${row}`}
            position={[
              position[0] + (isLengthSide ? across : 0),
              position[1] + paneY,
              position[2] + (isLengthSide ? 0 : across),
            ]}
            receiveShadow
          >
            <boxGeometry args={isLengthSide
              ? [bayWidth - frameThickness * 0.5, paneHeight - frameThickness * 0.35, 0.014]
              : [0.014, paneHeight - frameThickness * 0.35, bayWidth - frameThickness * 0.5]}
            />
            <meshPhysicalMaterial
              color="#D8EBF2"
              transparent
              opacity={0.3}
              roughness={0.05}
              metalness={0.08}
              transmission={0.88}
              thickness={0.45}
            />
          </mesh>
        );
      }
    }

    return <group key={`panel-${side}`}>{elements}</group>;
  };

  // Gridded sliding glass wall with a hinged access door (Pergola Enclosures)
  const renderSlidingGlassWithDoor = (
    side: 'front' | 'back' | 'left' | 'right',
    basePosition: [number, number, number],
    panelWidth: number,
    baseHeight: number,
    doorOpenness: number = 0
  ) => {
    const isLengthSide = side === 'front' || side === 'back';
    const mullion = 0.055;
    const depth = 0.08;
    const glassThickness = 0.014;

    // Fit the enclosure inside the post opening and overlap the fascia slightly.
    // The incoming height already includes the main beam, so extending it again
    // pushed the complete glazed wall above the roof.
    const floorY = basePosition[1] - baseHeight / 2;
    const fasciaOverlap = 0.04;
    const panelHeight = Math.max(0.5, baseHeight - beamHeight + fasciaOverlap);
    const position: [number, number, number] = [
      basePosition[0],
      floorY + panelHeight / 2,
      basePosition[2],
    ];

    const doorWidth = Math.min(0.95, panelWidth * 0.32);
    const lowerH = panelHeight;

    const elements: JSX.Element[] = [];

    const bar = (
      key: string,
      x: number,
      y: number,
      w: number,
      h: number
    ) => {
      elements.push(
        <mesh key={key} position={[x, y, 0]} castShadow>
          <boxGeometry args={[w, h, depth]} />
          <meshStandardMaterial {...frameMaterial} />
        </mesh>
      );
    };

    const glass = (key: string, x: number, y: number, w: number, h: number) => {
      elements.push(
        <mesh key={key} position={[x, y, 0]} receiveShadow>
          <boxGeometry args={[Math.max(w, 0.01), Math.max(h, 0.01), glassThickness]} />
          <meshPhysicalMaterial
             color="#B9D8E5"
            transparent
             opacity={0.42}
             roughness={0.08}
            metalness={0.08}
             transmission={0.72}
            thickness={0.5}
             side={THREE.DoubleSide}
          />
        </mesh>
      );
    };

    const halfW = panelWidth / 2;
    const halfH = panelHeight / 2;

    // Perimeter frame only — no transom glazing against the roof beam.
    bar(`${side}-sgd-top`, 0, halfH - mullion / 2, panelWidth, mullion);
    bar(`${side}-sgd-bottom`, 0, -halfH + mullion / 2, panelWidth, mullion);
    bar(`${side}-sgd-left`, -halfW + mullion / 2, 0, mullion, panelHeight);
    bar(`${side}-sgd-right`, halfW - mullion / 2, 0, mullion, panelHeight);

    // Door opening jambs, centred
    const doorLeft = -doorWidth / 2;
    const doorRight = doorWidth / 2;
    bar(`${side}-sgd-jamb-l`, doorLeft, 0, mullion, lowerH);
    bar(`${side}-sgd-jamb-r`, doorRight, 0, mullion, lowerH);

    // Fixed glazed bays either side of the door, split into a grid
    const bays: { x0: number; x1: number }[] = [
      { x0: -halfW + mullion, x1: doorLeft - mullion / 2 },
      { x0: doorRight + mullion / 2, x1: halfW - mullion },
    ];

    bays.forEach((bay, bi) => {
      const width = bay.x1 - bay.x0;
      if (width <= 0.1) return;
      const cols = Math.max(1, Math.round(width / 1.1));
      const colW = (width - mullion * (cols - 1)) / cols;
      const rows = 3;
      const bayH = halfH - mullion / 2 - (-halfH + mullion);
      const rowH = (bayH - mullion * (rows - 1)) / rows;
      const bayBottom = -halfH + mullion;

      for (let c = 0; c < cols; c++) {
        const cx = bay.x0 + colW / 2 + c * (colW + mullion);
        if (c > 0) bar(`${side}-sgd-vm-${bi}-${c}`, cx - colW / 2 - mullion / 2, bayBottom + bayH / 2, mullion, bayH);
        for (let r = 0; r < rows; r++) {
          const cy = bayBottom + rowH / 2 + r * (rowH + mullion);
          if (r > 0) bar(`${side}-sgd-hm-${bi}-${c}-${r}`, cx, cy - rowH / 2 - mullion / 2, colW, mullion);
          glass(`${side}-sgd-g-${bi}-${c}-${r}`, cx, cy, colW, rowH);
        }
      }
    });

    // Hinged door leaf, swung open from the left jamb
    const leafW = doorWidth - mullion;
    const leafH = lowerH - mullion;
    const doorCenterY = 0;
    const doorRows = 3;
    const doorLeaf: JSX.Element[] = [];
    const leafRailH = mullion * 0.8;
    const innerH = leafH - leafRailH * 2;
    const paneH = (innerH - leafRailH * (doorRows - 1)) / doorRows;

    doorLeaf.push(
      <mesh key="leaf-top" position={[0, leafH / 2 - leafRailH / 2, 0]} castShadow>
        <boxGeometry args={[leafW, leafRailH, depth * 0.9]} />
        <meshStandardMaterial {...frameMaterial} />
      </mesh>,
      <mesh key="leaf-bottom" position={[0, -leafH / 2 + leafRailH / 2, 0]} castShadow>
        <boxGeometry args={[leafW, leafRailH, depth * 0.9]} />
        <meshStandardMaterial {...frameMaterial} />
      </mesh>,
      <mesh key="leaf-left" position={[-leafW / 2 + leafRailH / 2, 0, 0]} castShadow>
        <boxGeometry args={[leafRailH, leafH, depth * 0.9]} />
        <meshStandardMaterial {...frameMaterial} />
      </mesh>,
      <mesh key="leaf-right" position={[leafW / 2 - leafRailH / 2, 0, 0]} castShadow>
        <boxGeometry args={[leafRailH, leafH, depth * 0.9]} />
        <meshStandardMaterial {...frameMaterial} />
      </mesh>
    );

    for (let r = 0; r < doorRows; r++) {
      const cy = -leafH / 2 + leafRailH + paneH / 2 + r * (paneH + leafRailH);
      if (r > 0) {
        doorLeaf.push(
          <mesh key={`leaf-rail-${r}`} position={[0, cy - paneH / 2 - leafRailH / 2, 0]} castShadow>
            <boxGeometry args={[leafW, leafRailH, depth * 0.9]} />
            <meshStandardMaterial {...frameMaterial} />
          </mesh>
        );
      }
      // vertical mid mullion
      doorLeaf.push(
        <mesh key={`leaf-mid-${r}`} position={[0, cy, 0]} castShadow>
          <boxGeometry args={[leafRailH * 0.8, paneH, depth * 0.85]} />
          <meshStandardMaterial {...frameMaterial} />
        </mesh>
      );
      doorLeaf.push(
        <mesh key={`leaf-glass-${r}`} position={[0, cy, 0]} receiveShadow>
          <boxGeometry args={[leafW - leafRailH * 2, paneH, glassThickness]} />
          <meshPhysicalMaterial
            color="#D8EBF2"
            transparent
            opacity={0.28}
            roughness={0.04}
            metalness={0.08}
            transmission={0.9}
            thickness={0.5}
          />
        </mesh>
      );
    }

    // Door handle
    doorLeaf.push(
      <mesh key="leaf-handle" position={[leafW / 2 - leafRailH * 1.6, 0, depth * 0.55]} castShadow>
        <boxGeometry args={[0.035, 0.28, 0.035]} />
        <meshStandardMaterial color="#1A1D21" metalness={0.7} roughness={0.35} />
      </mesh>
    );

    elements.push(
      <group
        key={`${side}-sgd-door-hinge`}
        position={[doorLeft + mullion / 2, doorCenterY, 0]}
        rotation={[0, -(Math.max(0, Math.min(100, doorOpenness)) / 100) * (Math.PI / 2.2), 0]}
      >
        <group position={[leafW / 2, 0, 0]}>{doorLeaf}</group>
      </group>
    );

    return (
      <group
        key={`panel-${side}`}
        position={position}
        rotation={[0, isLengthSide ? 0 : Math.PI / 2, 0]}
      >
        {elements}
      </group>
    );
  };

  const renderFixedGlassWall = (
    side: 'front' | 'back' | 'left' | 'right',
    position: [number, number, number],
    panelWidth: number,
    panelHeight: number
  ) => {
    const isLengthSide = side === 'front' || side === 'back';
    const frameThickness = 0.075;
    const frameDepth = 0.09;
    const paneCount = Math.max(2, Math.round(panelWidth));
    const innerWidth = panelWidth - frameThickness * 2;
    const paneWidth = (innerWidth - frameThickness * (paneCount - 1)) / paneCount;
    const paneHeight = panelHeight - frameThickness * 2;
    const elements: JSX.Element[] = [];

    const addFrame = (key: string, across: number, y: number, horizontal: boolean) => {
      elements.push(
        <mesh
          key={key}
          position={[
            position[0] + (isLengthSide && !horizontal ? across : 0),
            position[1] + y,
            position[2] + (!isLengthSide && !horizontal ? across : 0),
          ]}
          castShadow
        >
          <boxGeometry args={horizontal
            ? (isLengthSide ? [panelWidth, frameThickness, frameDepth] : [frameDepth, frameThickness, panelWidth])
            : (isLengthSide ? [frameThickness, panelHeight, frameDepth] : [frameDepth, panelHeight, frameThickness])}
          />
          <meshStandardMaterial {...frameMaterial} />
        </mesh>
      );
    };

    addFrame(`${side}-fgw-top`, 0, panelHeight / 2 - frameThickness / 2, true);
    addFrame(`${side}-fgw-bottom`, 0, -panelHeight / 2 + frameThickness / 2, true);

    for (let divider = 0; divider <= paneCount; divider++) {
      const across = -panelWidth / 2 + frameThickness / 2 + divider * (paneWidth + frameThickness);
      addFrame(`${side}-fgw-divider-${divider}`, across, 0, false);
    }

    for (let pane = 0; pane < paneCount; pane++) {
      const across = -innerWidth / 2 + paneWidth / 2 + pane * (paneWidth + frameThickness);
      elements.push(
        <mesh
          key={`${side}-fgw-pane-${pane}`}
          position={[
            position[0] + (isLengthSide ? across : 0),
            position[1],
            position[2] + (isLengthSide ? 0 : across),
          ]}
          receiveShadow
        >
          <boxGeometry args={isLengthSide
            ? [paneWidth, paneHeight, 0.016]
            : [0.016, paneHeight, paneWidth]}
          />
          <meshPhysicalMaterial
            color="#D8EBF2"
            transparent
            opacity={0.28}
            roughness={0.04}
            metalness={0.08}
            transmission={0.9}
            thickness={0.5}
          />
        </mesh>
      );
    }

    return <group key={`panel-${side}`}>{elements}</group>;
  };

  // Helper to render frame around panels
  const renderPanelFrame = (
    side: 'front' | 'back' | 'left' | 'right', 
    position: [number, number, number], 
    panelWidth: number, 
    panelHeight: number
  ) => {
    const frameThickness = 0.04;
    const frameDepth = 0.05;
    const isLengthSide = side === 'front' || side === 'back';
    
    return (
      <>
        {/* Top frame */}
        <mesh 
          position={[position[0], position[1] + panelHeight / 2 - frameThickness / 2, position[2]]} 
          castShadow
        >
          <boxGeometry args={isLengthSide 
            ? [panelWidth, frameThickness, frameDepth] 
            : [frameDepth, frameThickness, panelWidth]} />
          <meshStandardMaterial {...frameMaterial} />
        </mesh>
        {/* Bottom frame */}
        <mesh 
          position={[position[0], position[1] - panelHeight / 2 + frameThickness / 2, position[2]]} 
          castShadow
        >
          <boxGeometry args={isLengthSide 
            ? [panelWidth, frameThickness, frameDepth] 
            : [frameDepth, frameThickness, panelWidth]} />
          <meshStandardMaterial {...frameMaterial} />
        </mesh>
      </>
    );
  };

  // Render louvered/slatted panel with horizontal slats and vertical dividers
  const renderSlattedPanel = (
    side: 'front' | 'back' | 'left' | 'right',
    position: [number, number, number],
    panelWidth: number,
    panelHeight: number,
    panelThickness: number
  ) => {
    const isLengthSide = side === 'front' || side === 'back';
    const frameThickness = 0.05; // Outer frame and divider thickness
    const slatHeight = 0.025; // Height of each horizontal slat
    const slatGap = 0.015; // Gap between slats
    const slatDepth = 0.06; // Depth of each slat (3D effect)
    
    // Calculate number of horizontal slats
    const usableHeight = panelHeight - frameThickness * 2;
    const slatSpacing = slatHeight + slatGap;
    const numSlats = Math.floor(usableHeight / slatSpacing);
    
    // Calculate number of vertical dividers (sections)
    const numSections = Math.max(2, Math.floor(panelWidth / 1.2)); // Section every ~1.2m
    const sectionWidth = (panelWidth - frameThickness * 2) / numSections;
    
    const elements: JSX.Element[] = [];
    
    // Outer frame - top
    elements.push(
      <mesh 
        key={`${side}-frame-top`}
        position={[
          position[0], 
          position[1] + panelHeight / 2 - frameThickness / 2, 
          position[2]
        ]}
        castShadow
      >
        <boxGeometry args={isLengthSide 
          ? [panelWidth, frameThickness, panelThickness] 
          : [panelThickness, frameThickness, panelWidth]} />
        <meshStandardMaterial {...frameMaterial} />
      </mesh>
    );
    
    // Outer frame - bottom
    elements.push(
      <mesh 
        key={`${side}-frame-bottom`}
        position={[
          position[0], 
          position[1] - panelHeight / 2 + frameThickness / 2, 
          position[2]
        ]}
        castShadow
      >
        <boxGeometry args={isLengthSide 
          ? [panelWidth, frameThickness, panelThickness] 
          : [panelThickness, frameThickness, panelWidth]} />
        <meshStandardMaterial {...frameMaterial} />
      </mesh>
    );
    
    // Outer frame - left side
    const leftOffset = isLengthSide ? -panelWidth / 2 + frameThickness / 2 : 0;
    const leftZ = isLengthSide ? 0 : -panelWidth / 2 + frameThickness / 2;
    elements.push(
      <mesh 
        key={`${side}-frame-left`}
        position={[
          position[0] + leftOffset, 
          position[1], 
          position[2] + leftZ
        ]}
        castShadow
      >
        <boxGeometry args={isLengthSide 
          ? [frameThickness, panelHeight, panelThickness] 
          : [panelThickness, panelHeight, frameThickness]} />
        <meshStandardMaterial {...frameMaterial} />
      </mesh>
    );
    
    // Outer frame - right side
    const rightOffset = isLengthSide ? panelWidth / 2 - frameThickness / 2 : 0;
    const rightZ = isLengthSide ? 0 : panelWidth / 2 - frameThickness / 2;
    elements.push(
      <mesh 
        key={`${side}-frame-right`}
        position={[
          position[0] + rightOffset, 
          position[1], 
          position[2] + rightZ
        ]}
        castShadow
      >
        <boxGeometry args={isLengthSide 
          ? [frameThickness, panelHeight, panelThickness] 
          : [panelThickness, panelHeight, frameThickness]} />
        <meshStandardMaterial {...frameMaterial} />
      </mesh>
    );
    
    // Vertical dividers between sections
    for (let s = 1; s < numSections; s++) {
      const dividerOffset = -panelWidth / 2 + frameThickness + s * sectionWidth;
      const dividerPos = isLengthSide 
        ? dividerOffset 
        : 0;
      const dividerZ = isLengthSide 
        ? 0 
        : dividerOffset;
      
      elements.push(
        <mesh 
          key={`${side}-divider-${s}`}
          position={[
            position[0] + dividerPos, 
            position[1], 
            position[2] + dividerZ
          ]}
          castShadow
        >
          <boxGeometry args={isLengthSide 
            ? [frameThickness * 0.7, panelHeight - frameThickness * 2, panelThickness] 
            : [panelThickness, panelHeight - frameThickness * 2, frameThickness * 0.7]} />
          <meshStandardMaterial {...frameMaterial} />
        </mesh>
      );
    }
    
    // Horizontal slats for each section
    for (let s = 0; s < numSections; s++) {
      const sectionStart = -panelWidth / 2 + frameThickness + s * sectionWidth;
      const sectionCenter = sectionStart + sectionWidth / 2;
      const actualSlatWidth = sectionWidth - frameThickness * 0.7;
      
      for (let i = 0; i < numSlats; i++) {
        const yPos = position[1] + panelHeight / 2 - frameThickness - (i + 0.5) * slatSpacing;
        
        if (isLengthSide) {
          elements.push(
            <mesh 
              key={`${side}-slat-${s}-${i}`}
              position={[position[0] + sectionCenter, yPos, position[2]]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[actualSlatWidth, slatHeight, slatDepth]} />
              <meshStandardMaterial {...frameMaterial} />
            </mesh>
          );
        } else {
          elements.push(
            <mesh 
              key={`${side}-slat-${s}-${i}`}
              position={[position[0], yPos, position[2] + sectionCenter]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[slatDepth, slatHeight, actualSlatWidth]} />
              <meshStandardMaterial {...frameMaterial} />
            </mesh>
          );
        }
      }
    }
    
    return <group key={`panel-${side}`}>{elements}</group>;
  };

  const renderSlatsWall = (
    side: 'front' | 'back' | 'left' | 'right',
    position: [number, number, number],
    panelWidth: number,
    panelHeight: number
  ) => {
    const isLengthSide = side === 'front' || side === 'back';
    const frameThickness = 0.085;
    const frameDepth = 0.11;
    const slatHeight = 0.19;
    const slatGap = 0.075;
    const slatDepth = 0.095;
    const sectionCount = Math.max(2, Math.round(panelWidth / 2.25));
    const innerWidth = panelWidth - frameThickness * 2;
    const sectionWidth = (innerWidth - frameThickness * (sectionCount - 1)) / sectionCount;
    const usableHeight = panelHeight - frameThickness * 2;
    const slatCount = Math.max(2, Math.floor((usableHeight + slatGap) / (slatHeight + slatGap)));
    const occupiedHeight = slatCount * slatHeight + (slatCount - 1) * slatGap;
    const elements: JSX.Element[] = [];

    const addRail = (key: string, across: number, y: number, horizontal: boolean) => {
      elements.push(
        <mesh
          key={key}
          position={[
            position[0] + (isLengthSide && !horizontal ? across : 0),
            position[1] + y,
            position[2] + (!isLengthSide && !horizontal ? across : 0),
          ]}
          castShadow
        >
          <boxGeometry args={horizontal
            ? (isLengthSide ? [panelWidth, frameThickness, frameDepth] : [frameDepth, frameThickness, panelWidth])
            : (isLengthSide ? [frameThickness, panelHeight, frameDepth] : [frameDepth, panelHeight, frameThickness])}
          />
          <meshStandardMaterial {...frameMaterial} />
        </mesh>
      );
    };

    addRail(`${side}-sw-top`, 0, panelHeight / 2 - frameThickness / 2, true);
    addRail(`${side}-sw-bottom`, 0, -panelHeight / 2 + frameThickness / 2, true);

    for (let divider = 0; divider <= sectionCount; divider++) {
      const across = -panelWidth / 2 + frameThickness / 2 + divider * (sectionWidth + frameThickness);
      addRail(`${side}-sw-divider-${divider}`, across, 0, false);
    }

    for (let section = 0; section < sectionCount; section++) {
      const across = -innerWidth / 2 + sectionWidth / 2 + section * (sectionWidth + frameThickness);
      for (let slat = 0; slat < slatCount; slat++) {
        const y = occupiedHeight / 2 - slatHeight / 2 - slat * (slatHeight + slatGap);
        elements.push(
          <mesh
            key={`${side}-sw-slat-${section}-${slat}`}
            position={[
              position[0] + (isLengthSide ? across : 0),
              position[1] + y,
              position[2] + (isLengthSide ? 0 : across),
            ]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={isLengthSide
              ? [sectionWidth, slatHeight, slatDepth]
              : [slatDepth, slatHeight, sectionWidth]}
            />
            <meshStandardMaterial {...frameMaterial} />
          </mesh>
        );
      }
    }

    return <group key={`panel-${side}`}>{elements}</group>;
  };

  return (
    <group ref={ref} position={position}>
      {/* Building walls and structural ledgers for attached pergolas */}
      {hasRearWall && (
        <group>
          {/* Main house wall */}
          <mesh position={[0, height / 2 + 1, -width / 2 - 0.15]} receiveShadow castShadow>
            <boxGeometry args={[length + 2, height + 3, 0.3]} />
            <meshStandardMaterial color="#F5F5F5" roughness={0.9} metalness={0} />
          </mesh>
          {/* House roof overhang hint */}
          <mesh position={[0, height + 2.2, -width / 2 - 0.3]} receiveShadow castShadow>
            <boxGeometry args={[length + 2.5, 0.15, 0.8]} />
            <meshStandardMaterial color="#E8E8E8" roughness={0.8} metalness={0} />
          </mesh>
          {/* Wall mounting bracket */}
          <mesh position={[0, height + rearRise + beamHeight / 2, -width / 2 + 0.03]} castShadow>
            <boxGeometry args={[length - 0.1, beamHeight * 0.6, beamWidth * 0.4]} />
            <meshStandardMaterial {...frameMaterial} />
          </mesh>
        </group>
      )}

      {hasRightWall && (
        <group>
          <mesh position={[length / 2 + 0.15, height / 2 + 1, 0]} receiveShadow castShadow>
            <boxGeometry args={[0.3, height + 3, width + 0.3]} />
            <meshStandardMaterial color="#F5F5F5" roughness={0.9} metalness={0} />
          </mesh>
          <mesh position={[length / 2 - 0.03, height + beamHeight / 2, 0]} castShadow>
            <boxGeometry args={[beamWidth * 0.4, beamHeight * 0.6, width - 0.1]} />
            <meshStandardMaterial {...frameMaterial} />
          </mesh>
        </group>
      )}

      {hasLeftWall && (
        <group>
          <mesh position={[-length / 2 - 0.15, height / 2 + 1, 0]} receiveShadow castShadow>
            <boxGeometry args={[0.3, height + 3, width + 0.3]} />
            <meshStandardMaterial color="#F5F5F5" roughness={0.9} metalness={0} />
          </mesh>
          <mesh position={[-length / 2 + 0.03, height + beamHeight / 2, 0]} castShadow>
            <boxGeometry args={[beamWidth * 0.4, beamHeight * 0.6, width - 0.1]} />
            <meshStandardMaterial {...frameMaterial} />
          </mesh>
        </group>
      )}

      {/* Posts with base plates */}
      {postPositions.map((pos, index) => (
        <group key={`post-${index}`}>
          {/* Post extends seamlessly through fascia */}
          <RoundedBox args={[postSize, height + totalRoofHeight, postSize]} radius={0.008} smoothness={4} position={[pos[0], pos[1], pos[2]]} castShadow receiveShadow>
            <meshStandardMaterial {...frameMaterial} />
          </RoundedBox>
          {/* Base plate - sits on top of flooring */}
          <mesh position={[pos[0], 0.045, pos[2]]} receiveShadow castShadow>
            <boxGeometry args={[postSize + 0.10, 0.024, postSize + 0.10]} />
            <meshStandardMaterial {...frameMaterial} />
          </mesh>
          {/* Bolt holes (4 corners) */}
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([dx, dz], bi) => (
            <mesh
              key={`bolt-${index}-${bi}`}
              position={[
                pos[0] + dx * (postSize / 2 + 0.032),
                0.058,
                pos[2] + dz * (postSize / 2 + 0.032),
              ]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <circleGeometry args={[0.013, 16]} />
              <meshStandardMaterial color="#111111" metalness={0.8} roughness={0.3} />
            </mesh>
          ))}
          {/* Center drainage/cable hole */}
          <mesh position={[pos[0], 0.058, pos[2] + postSize / 2 + 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.02, 16]} />
            <meshStandardMaterial color="#111111" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      ))}

      <group position={roofTiltPos} rotation={[pitchRad, 0, 0]} scale={[1, 1, roofScaleZ]}>
      {/* Main beams (length direction) */}
      {hasRearBeam && (
        <RoundedBox args={[length, beamHeight, beamWidth]} radius={0.008} smoothness={4} position={[0, height + beamHeight / 2, -width / 2 + postSize / 2]} castShadow>
          <meshStandardMaterial {...frameMaterial} />
        </RoundedBox>
      )}
      <RoundedBox args={[length, beamHeight, beamWidth]} radius={0.008} smoothness={4} position={[0, height + beamHeight / 2, width / 2 - postSize / 2]} castShadow>
        <meshStandardMaterial {...frameMaterial} />
      </RoundedBox>

      {/* Cross beams (width direction) */}
      <RoundedBox args={[beamWidth, beamHeight, width]} radius={0.008} smoothness={4} position={[-length / 2 + postSize / 2, height + beamHeight / 2, 0]} castShadow>
        <meshStandardMaterial {...frameMaterial} />
      </RoundedBox>
      <RoundedBox args={[beamWidth, beamHeight, width]} radius={0.008} smoothness={4} position={[length / 2 - postSize / 2, height + beamHeight / 2, 0]} castShadow>
        <meshStandardMaterial {...frameMaterial} />
      </RoundedBox>

      {/* Perimeter fascia - contains beams and slats, flush top */}
      <RoundedBox args={[length, perimeterFrameHeight, perimeterFrameWidth]} radius={0.006} smoothness={4} position={[0, height + perimeterFrameHeight / 2, -width / 2 + perimeterFrameWidth / 2]} castShadow>
        <meshStandardMaterial {...frameMaterial} />
      </RoundedBox>
      <RoundedBox args={[length, perimeterFrameHeight, perimeterFrameWidth]} radius={0.006} smoothness={4} position={[0, height + perimeterFrameHeight / 2, width / 2 - perimeterFrameWidth / 2]} castShadow>
        <meshStandardMaterial {...frameMaterial} />
      </RoundedBox>
      <RoundedBox args={[perimeterFrameWidth, perimeterFrameHeight, width - perimeterFrameWidth * 2]} radius={0.006} smoothness={4} position={[-length / 2 + perimeterFrameWidth / 2, height + perimeterFrameHeight / 2, 0]} castShadow>
        <meshStandardMaterial {...frameMaterial} />
      </RoundedBox>
      <RoundedBox args={[perimeterFrameWidth, perimeterFrameHeight, width - perimeterFrameWidth * 2]} radius={0.006} smoothness={4} position={[length / 2 - perimeterFrameWidth / 2, height + perimeterFrameHeight / 2, 0]} castShadow>
        <meshStandardMaterial {...frameMaterial} />
      </RoundedBox>

      {/* Central divider separates the two louver banks */}
      {showLouveredSlats && (
        <RoundedBox
          args={[centreBeamWidth, perimeterFrameHeight, innerWidth]}
          radius={0.005}
          smoothness={4}
          position={[0, height + perimeterFrameHeight / 2, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial {...frameMaterial} />
        </RoundedBox>
      )}

      {/* Fabric roof - two broad taut canopy panels divided by a substantial centre rail */}
      {showFabricRoof && (() => {
        const fabricInset = 0.035;
        const fabricThickness = 0.014;
        const roofY = height + perimeterFrameHeight - fabricThickness / 2 - 0.018;
        const bayWidth = (innerLength - centreBeamWidth) / 2;
        const panelLength = Math.max(0.1, bayWidth - fabricInset * 2);
        const panelWidth = Math.max(0.1, innerWidth - fabricInset * 2);
        const leftX = -(centreBeamWidth + bayWidth) / 2;
        const rightX = (centreBeamWidth + bayWidth) / 2;

        return (
          <>
            <RoundedBox
              args={[centreBeamWidth, perimeterFrameHeight, innerWidth]}
              radius={0.005}
              smoothness={4}
              position={[0, height + perimeterFrameHeight / 2, 0]}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial {...frameMaterial} />
            </RoundedBox>
            {[leftX, rightX].map((x, index) => (
              <group key={`fabric-roof-panel-${index}`} position={[x, roofY, 0]}>
                <RoundedBox
                  args={[panelLength, fabricThickness, panelWidth]}
                  radius={0.01}
                  smoothness={4}
                  castShadow
                  receiveShadow
                >
                  <meshStandardMaterial
                    color={roofColor}
                    roughness={0.82}
                    metalness={0}
                    side={THREE.DoubleSide}
                  />
                </RoundedBox>
                {/* Fine edge rails hold each fabric sheet tightly inside its bay. */}
                {[-1, 1].map((side) => (
                  <mesh key={`fabric-edge-${side}`} position={[0, 0.012, side * (panelWidth / 2 + 0.006)]} castShadow>
                    <boxGeometry args={[panelLength, 0.025, 0.025]} />
                    <meshStandardMaterial {...frameMaterial} />
                  </mesh>
                ))}
              </group>
            ))}
          </>
        );
      })()}

      {/* Louvered roof blades - broad flat aluminium profiles with raised weather-seal edges */}
      {showLouveredSlats && slatPositions.map((pos, index) => (
        <group key={`slat-group-${index}`} position={pos}>
          <group rotation={[0, 0, slatAngle]}>
            {/* Main blade, spanning the full width. 200 mm motorised blades use a
                thicker rounded aerofoil profile; standard blades stay flat. */}
            {isWideLouvre ? (
              <RoundedBox
                args={[slatBaseWidth, 0.05, innerWidth - 0.02]}
                radius={0.024}
                smoothness={5}
                castShadow
                receiveShadow
              >
                <meshStandardMaterial
                  color={roofSheetColor}
                  roughness={0.32}
                  metalness={0.9}
                  envMapIntensity={1.25}
                />
              </RoundedBox>
            ) : (
              <mesh castShadow receiveShadow>
                <boxGeometry args={[
                  slatBaseWidth,
                  slatBaseHeight,
                  innerWidth - 0.02
                ]} />
                <meshStandardMaterial 
                  color={roofSheetColor}
                  roughness={0.3}
                  metalness={0.88}
                  envMapIntensity={1.2}
                />
              </mesh>
            )}
            {/* Raised interlocking lip - sunk into the blade so no faces are coplanar */}
            {!isWideLouvre && <mesh castShadow receiveShadow position={[
              slatBaseWidth / 2 - slatRidgeWidth,
              (slatBaseHeight + slatRidgeHeight) / 2 - 0.006,
              0
            ]}>
              <boxGeometry args={[
                slatRidgeWidth,
                slatRidgeHeight,
                innerWidth - 0.03
              ]} />
              <meshStandardMaterial 
                color={roofSheetColor}
                roughness={0.26}
                metalness={0.92}
                envMapIntensity={1.3}
              />
            </mesh>}
          </group>
        </group>
      ))}

      {/* Solid roof panel - shown when roofType is 'solid' or pergola type is 'sky' */}
      {showSolidRoof && (
        <mesh position={[0, height + perimeterFrameHeight - 0.015, 0]} castShadow receiveShadow>
          <boxGeometry args={[length - perimeterFrameWidth * 2 - 0.02, 0.02, width - perimeterFrameWidth * 2 - 0.02]} />
          <meshStandardMaterial {...roofMaterial} />
        </mesh>
      )}

      {/* Steel sheeting roof - insulated panel or single-skin, Trimdek or CGI profile */}
      {showSteelRoof && (() => {
        const isInsulated = roofType === 'insulated';
        const sheetLength = innerLength;              // along X
        const sheetWidth = innerWidth;                // along Z (fall direction)
        const deckThickness = isInsulated ? 0.075 : 0.012;
        const topY = height + perimeterFrameHeight - 0.022;
        const skinThickness = isInsulated ? 0.014 : 0;
        // Keep the deck strictly below the coloured skin so no two faces are
        // coplanar (coplanar faces z-fight and flash white).
        const deckTopY = isInsulated ? topY - 0.010 : topY;
        const panY = deckTopY - deckThickness / 2;

        const isTrimdek = roofProfile === 'trimdek';
        const ribPitch = isTrimdek ? 0.2 : 0.078;
        const ribCount = Math.max(2, Math.floor(sheetLength / ribPitch));
        const ribStartX = -((ribCount - 1) * ribPitch) / 2;

        // Insulated panels are 1m modules; skylight strips sit at the panel joins.
        const panelCount = isInsulated ? Math.max(2, Math.round(sheetLength / 1.0)) : 0;
        const panelWidth = isInsulated ? sheetLength / panelCount : 0;
        const joinX = isInsulated
          ? Array.from({ length: panelCount - 1 }, (_, i) => -sheetLength / 2 + panelWidth * (i + 1))
          : [];
        const skylightWidth = 0.25; // 250 mm natural-light strip
        const skylightX = isInsulated && skylight ? joinX : [];
        const inSkylight = (x: number) =>
          skylightX.some((j) => Math.abs(x - j) < skylightWidth / 2 + ribPitch * 0.35);

        return (
          <group>
            {/* Non-insulated roofs use a continuous pan deck. */}
            {!isInsulated && (
              <mesh position={[0, panY, 0]} castShadow receiveShadow>
                <boxGeometry args={[sheetLength - 0.004, deckThickness, sheetWidth - 0.004]} />
                <meshStandardMaterial color={roofSheetColor} metalness={0.6} roughness={0.35} />
              </mesh>
            )}

            {/* Insulated panels are split at each join so the skylight glass
                does not overlap the coloured roof behind it. */}
            {isInsulated && (() => {
              const segmentEdges = [-sheetLength / 2, ...joinX, sheetLength / 2];
              const segments = [];
              const gapAt = (j: number) =>
                skylight && skylightX.includes(j) ? skylightWidth : 0.012;
              for (let i = 0; i < segmentEdges.length - 1; i++) {
                const start = segmentEdges[i];
                const end = segmentEdges[i + 1];
                // Trim only half of each interior join gap from either side so
                // panels meet the skylight strip exactly with no leftover gap.
                const leftTrim = i > 0 ? gapAt(joinX[i - 1]) / 2 : 0;
                const rightTrim = i < joinX.length ? gapAt(joinX[i]) / 2 : 0;
                const segStart = start + leftTrim;
                const segEnd = end - rightTrim;
                const segWidth = Math.max(0.01, segEnd - segStart);
                segments.push({ center: (segStart + segEnd) / 2, width: segWidth });
              }
              return (
                <>
                  {segments.map((seg, idx) => (
                    <group key={`insulated-segment-${idx}`}>
                      <mesh position={[seg.center, panY, 0]} castShadow receiveShadow>
                        <boxGeometry args={[seg.width, deckThickness, sheetWidth - 0.004]} />
                        <meshStandardMaterial color="#E8E6E0" metalness={0.15} roughness={0.7} />
                      </mesh>
                      <mesh position={[seg.center, topY + 0.002 - skinThickness / 2, 0]} castShadow receiveShadow>
                        <boxGeometry args={[seg.width, skinThickness, sheetWidth]} />
                        <meshStandardMaterial color={roofSheetColor} metalness={0.6} roughness={0.35} />
                      </mesh>
                    </group>
                  ))}
                </>
              );
            })()}


            {/* CGI: one continuous corrugated sheet across the whole roof */}
            {!isTrimdek && (
              <mesh
                geometry={cgiSheetGeometry}
                position={[0, topY + 0.012, -sheetWidth / 2]}
                scale={[1, 1, sheetWidth]}
                castShadow
                receiveShadow
              >
                <meshStandardMaterial color={roofSheetColor} metalness={0.7} roughness={0.28} />
              </mesh>
            )}

            {/* Profile ribs running down the fall of the roof */}
            {isTrimdek && Array.from({ length: ribCount }, (_, i) => {
              const x = ribStartX + i * ribPitch;
              if (inSkylight(x)) return null;
              if (isTrimdek) {
                return (
                  <mesh
                    key={`steel-rib-${i}`}
                    geometry={trimdekRibGeometry}
                    position={[x, topY, -sheetWidth / 2]}
                    scale={[1, 1, sheetWidth]}
                    castShadow
                    receiveShadow
                  >
                    <meshStandardMaterial color={roofSheetColor} metalness={0.65} roughness={0.32} />
                  </mesh>
                );
              }
              return (
                <mesh
                  key={`steel-rib-${i}`}
                  position={[x, topY + 0.004, 0]}
                  rotation={[Math.PI / 2, 0, 0]}
                  castShadow
                  receiveShadow
                >
                  <cylinderGeometry args={[0.026, 0.026, sheetWidth, 16]} />
                  <meshStandardMaterial color={roofSheetColor} metalness={0.7} roughness={0.28} />
                </mesh>
              );
            })}

            {/* Panel joins / natural skylight strips. The glass colour is fixed. */}
            {isInsulated &&
              (() => {
                const stackBottom = panY - deckThickness / 2;
                const stackTop = topY + 0.002;
                const stackH = stackTop - stackBottom;
                const stackY = (stackTop + stackBottom) / 2;
                return joinX.map((x, i) =>
                  skylight ? (
                    <mesh key={`skylight-${i}`} position={[x, stackY, 0]} receiveShadow>
                      <boxGeometry args={[skylightWidth * 1.02, stackH * 0.9, sheetWidth * 0.999]} />
                      <meshPhysicalMaterial
                        color="#C4DCE4"
                        transparent
                        opacity={0.32}
                        transmission={0.92}
                        thickness={0.04}
                        ior={1.45}
                        roughness={0.05}
                        metalness={0}
                        clearcoat={1}
                        clearcoatRoughness={0.05}
                        side={THREE.DoubleSide}
                      />
                    </mesh>
                  ) : (
                    <mesh key={`panel-join-${i}`} position={[x, stackY, 0]}>
                      <boxGeometry args={[0.012, stackH * 1.02, sheetWidth * 0.999]} />
                      <meshStandardMaterial color="#9A9A9A" metalness={0.6} roughness={0.4} />
                    </mesh>
                  ),
                );
              })()}

          </group>
        );
      })()}

      {/* Standard polycarbonate roof - transparent weather protection */}
      {showPolycarbonateRoof && !showFramedTransparentRoof && (
        <mesh position={[0, height + perimeterFrameHeight - 0.015, 0]} castShadow receiveShadow>
          <boxGeometry args={[length - perimeterFrameWidth * 2 - 0.02, 0.02, width - perimeterFrameWidth * 2 - 0.02]} />
          <meshPhysicalMaterial 
            color="#E8F4F8"
            transparent
            opacity={0.4}
            transmission={0.85}
            thickness={0.5}
            metalness={0.1}
            roughness={0.05}
          />
        </mesh>
      )}

      {/* Glass/polycarbonate roof - twin banks of flush panes over underside supports */}
      {showFramedTransparentRoof && (() => {
        const glassThickness = 0.012;
        const glassY = height + perimeterFrameHeight - glassThickness / 2 - 0.018;
        const rafterWidth = 0.055;
        const rafterHeight = 0.075;
        const glassCentreBeamWidth = 0.14;
        const baysPerSide = Math.max(2, Math.round((innerLength - glassCentreBeamWidth) / 2 / 0.7));
        const halfRoofLength = (innerLength - glassCentreBeamWidth) / 2;
        const bayLength = halfRoofLength / baysPerSide;
        const paneInset = 0.012;
        const rafterY = glassY - glassThickness / 2 - rafterHeight / 2;
        const centreBeamHeight = rafterHeight + 0.035;
        const centreBeamY = glassY - glassThickness / 2 - centreBeamHeight / 2;

        // Polycarbonate roof pergola gets a warm bronze/tinted pane colour;
        // the glass roof pergola keeps its clear, slightly blue tint.
        const isGlassPergola = type === 'glass';
        const paneColor = isGlassPergola ? "#dcecf2" : "#C9A86A";
        const paneOpacity = isGlassPergola ? 0.32 : 0.45;
        const paneTransmission = isGlassPergola ? 0.88 : 0.72;
        const paneRoughness = isGlassPergola ? 0.12 : 0.18;

        return (
          <group>
            {[-1, 1].flatMap((side) =>
              Array.from({ length: baysPerSide }, (_, index) => {
                const distanceFromCentre = glassCentreBeamWidth / 2 + bayLength * (index + 0.5);
                const x = side * distanceFromCentre;
                return (
                  <mesh key={`glass-pane-${side}-${index}`} position={[x, glassY, 0]} receiveShadow>
                    <boxGeometry args={[
                      Math.max(0.08, bayLength - paneInset),
                      glassThickness,
                      innerWidth - paneInset * 2,
                    ]} />
                    <meshPhysicalMaterial
                      color={paneColor}
                      transparent
                      opacity={paneOpacity}
                      transmission={paneTransmission}
                      thickness={0.12}
                      metalness={0}
                      roughness={paneRoughness}
                      ior={1.5}
                      side={THREE.DoubleSide}
                      depthWrite={false}
                    />
                  </mesh>
                );
              }),
            )}
            {[-1, 1].flatMap((side) =>
              Array.from({ length: baysPerSide - 1 }, (_, index) => {
                const x = side * (glassCentreBeamWidth / 2 + bayLength * (index + 1));
                return (
                  <RoundedBox
                    key={`glass-rafter-${side}-${index}`}
                    args={[rafterWidth, rafterHeight, innerWidth]}
                    radius={0.005}
                    smoothness={4}
                    position={[x, rafterY, 0]}
                    castShadow
                    receiveShadow
                  >
                    <meshStandardMaterial {...frameMaterial} />
                  </RoundedBox>
                );
              }),
            )}
            <RoundedBox
              args={[glassCentreBeamWidth, centreBeamHeight, innerWidth]}
              radius={0.006}
              smoothness={4}
              position={[0, centreBeamY, 0]}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial {...frameMaterial} />
            </RoundedBox>
          </group>
        );
      })()}

      {/* Retractable roof - panels slide and stack when retracting */}
      {showRetractableRoof && (() => {
        const innerLength = length - perimeterFrameWidth * 2 - 0.02;
        const innerWidthRoof = width - perimeterFrameWidth * 2 - 0.02;
        const panelCount = 8;
        const panelThick = 0.012; // Thinner slat panels
        const panelGap = 0.008;
        const roofY = height + perimeterFrameHeight - 0.015;
        const openness = retractableOpenness / 100;
        
        // Each panel's full width when closed
        const fullPanelWidth = (innerLength - panelGap * (panelCount - 1)) / panelCount;
        // When fully retracted, panels stack at the left end
        const stackedWidth = fullPanelWidth * 0.12;
        
        // Guide rails along the width edges (always visible)
        const rails = (
          <>
            <mesh position={[0, roofY - panelThick / 2 - 0.004, -innerWidthRoof / 2 + 0.015]}>
              <boxGeometry args={[innerLength, 0.006, 0.012]} />
              <meshStandardMaterial color="#333333" metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[0, roofY - panelThick / 2 - 0.004, innerWidthRoof / 2 - 0.015]}>
              <boxGeometry args={[innerLength, 0.006, 0.012]} />
              <meshStandardMaterial color="#333333" metalness={0.9} roughness={0.2} />
            </mesh>
          </>
        );
        
        const panels = Array.from({ length: panelCount }, (_, i) => {
          // Closed position: panels evenly distributed
          const closedX = -innerLength / 2 + fullPanelWidth / 2 + i * (fullPanelWidth + panelGap);
          // Open position: stacked at left
          const openX = -innerLength / 2 + stackedWidth / 2 + i * (stackedWidth + 0.003);
          const currentX = closedX + (openX - closedX) * openness;
          const currentWidth = fullPanelWidth + (stackedWidth - fullPanelWidth) * openness;
          
          return (
            <mesh key={`retract-panel-${i}`} position={[currentX, roofY, 0]} castShadow receiveShadow>
              <boxGeometry args={[currentWidth, panelThick, innerWidthRoof]} />
              <meshStandardMaterial {...roofMaterial} />
            </mesh>
          );
        });
        
        return <>{rails}{panels}</>;
      })()}
      </group>


      {/* Side Panels */}
      {renderPanel('front')}
      {renderPanel('back')}
      {renderPanel('left')}
      {renderPanel('right')}

      {/* LED Strips - Long continuous strips on underside of beams + down inner face of posts */}
      {lighting.ledStrips && (
        <group position={roofTiltPos} rotation={[pitchRad, 0, 0]} scale={[1, 1, roofScaleZ]}>
          {/* === BEAM UNDERSIDE STRIPS (horizontal, running full beam length) === */}
          
          {/* Front main beam - strip on underside center */}
          <group position={[0, height + beamHeight * 0.02, width / 2 - postSize / 2]}>
            <mesh>
              <boxGeometry args={[length - postSize * 2, 0.018, 0.03]} />
              <meshStandardMaterial color="#111111" metalness={0.95} roughness={0.1} />
            </mesh>
            <mesh position={[0, -0.008, 0]}>
              <boxGeometry args={[length - postSize * 2 - 0.02, 0.01, 0.022]} />
              <meshStandardMaterial color="#FFAA33" emissive="#FF8C00" emissiveIntensity={18} toneMapped={false} />
            </mesh>
          </group>
          
          {/* Back main beam - strip on underside */}
          {hasRearBeam && (
            <group position={[0, height + beamHeight * 0.02, -width / 2 + postSize / 2]}>
              <mesh>
                <boxGeometry args={[length - postSize * 2, 0.018, 0.03]} />
                <meshStandardMaterial color="#111111" metalness={0.95} roughness={0.1} />
              </mesh>
              <mesh position={[0, -0.008, 0]}>
                <boxGeometry args={[length - postSize * 2 - 0.02, 0.01, 0.022]} />
                <meshStandardMaterial color="#FFAA33" emissive="#FF8C00" emissiveIntensity={18} toneMapped={false} />
              </mesh>
            </group>
          )}
          
          {/* Left cross beam - strip on underside */}
          <group position={[-length / 2 + postSize / 2, height + beamHeight * 0.02, 0]}>
            <mesh>
              <boxGeometry args={[0.03, 0.018, width - postSize * 2]} />
              <meshStandardMaterial color="#111111" metalness={0.95} roughness={0.1} />
            </mesh>
            <mesh position={[0, -0.008, 0]}>
              <boxGeometry args={[0.022, 0.01, width - postSize * 2 - 0.02]} />
              <meshStandardMaterial color="#FFAA33" emissive="#FF8C00" emissiveIntensity={18} toneMapped={false} />
            </mesh>
          </group>
          
          {/* Right cross beam - strip on underside */}
          <group position={[length / 2 - postSize / 2, height + beamHeight * 0.02, 0]}>
            <mesh>
              <boxGeometry args={[0.03, 0.018, width - postSize * 2]} />
              <meshStandardMaterial color="#111111" metalness={0.95} roughness={0.1} />
            </mesh>
            <mesh position={[0, -0.008, 0]}>
              <boxGeometry args={[0.022, 0.01, width - postSize * 2 - 0.02]} />
              <meshStandardMaterial color="#FFAA33" emissive="#FF8C00" emissiveIntensity={18} toneMapped={false} />
            </mesh>
          </group>
          
          {/* === LOUVER LED STRIPS (between louvers on the roof underside) === */}
          {(() => {
            const roofStripCount = lighting.louverLedCount || 3;
            const stripLength = length - perimeterFrameWidth * 2 - 0.04;
            // Flush against the underside of the roof slats (touching the "ceiling")
            const slatBottomY = height + perimeterFrameHeight - slatTotalHeight - 0.005;
            const roofY = slatBottomY - 0.006; // strip housing top touches slat underside
            const strips = [];
            for (let i = 0; i < roofStripCount; i++) {
              const zPos = -width / 2 + perimeterFrameWidth + (i + 0.5) * (innerWidth / roofStripCount);
              strips.push(
                <group key={`roof-led-${i}`} position={[0, roofY, zPos]}>
                  <mesh>
                    <boxGeometry args={[stripLength, 0.012, 0.022]} />
                    <meshStandardMaterial color="#111111" metalness={0.95} roughness={0.1} />
                  </mesh>
                  <mesh position={[0, -0.006, 0]}>
                    <boxGeometry args={[stripLength - 0.02, 0.006, 0.016]} />
                    <meshStandardMaterial color="#FFAA33" emissive="#FF8C00" emissiveIntensity={14} toneMapped={false} />
                  </mesh>
                </group>
              );
            }
            return strips;
          })()}

          {/* Warm amber ambient lighting */}
          <pointLight position={[0, height + beamHeight - 0.2, 0]} color="#FF9A3C" intensity={6} distance={12} decay={2} />
          <pointLight position={[-length / 3, height + beamHeight - 0.2, width / 3]} color="#FF9A3C" intensity={2.5} distance={6} decay={2} />
          <pointLight position={[length / 3, height + beamHeight - 0.2, -width / 3]} color="#FF9A3C" intensity={2.5} distance={6} decay={2} />
        </group>
      )}

      {/* Spotlights - Larger, more visible fixtures with bright illumination */}
      {lighting.spotlights && (
        <>
          {/* Spotlight 1 - Front left */}
          <group position={[-length / 4, height + beamHeight - 0.02, -width / 4]}>
            {/* Housing */}
            <mesh>
              <cylinderGeometry args={[0.06, 0.08, 0.12, 16]} />
              <meshStandardMaterial color="#2C2C2C" metalness={0.9} roughness={0.2} />
            </mesh>
            {/* Light lens - glowing */}
            <mesh position={[0, -0.08, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 0.02, 16]} />
              <meshStandardMaterial color="#FFFACD" emissive="#FFFF00" emissiveIntensity={8} toneMapped={false} />
            </mesh>
            {/* Light cone visual */}
            <mesh position={[0, -0.25, 0]}>
              <coneGeometry args={[0.3, 0.4, 16, 1, true]} />
              <meshStandardMaterial color="#FFFACD" transparent opacity={0.15} side={THREE.DoubleSide} />
            </mesh>
            <spotLight position={[0, -0.1, 0]} angle={0.5} penumbra={0.5} color="#FFF8DC" intensity={15} distance={6} castShadow />
          </group>
          {/* Spotlight 2 - Front right */}
          <group position={[length / 4, height + beamHeight - 0.02, -width / 4]}>
            <mesh>
              <cylinderGeometry args={[0.06, 0.08, 0.12, 16]} />
              <meshStandardMaterial color="#2C2C2C" metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[0, -0.08, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 0.02, 16]} />
              <meshStandardMaterial color="#FFFACD" emissive="#FFFF00" emissiveIntensity={8} toneMapped={false} />
            </mesh>
            <mesh position={[0, -0.25, 0]}>
              <coneGeometry args={[0.3, 0.4, 16, 1, true]} />
              <meshStandardMaterial color="#FFFACD" transparent opacity={0.15} side={THREE.DoubleSide} />
            </mesh>
            <spotLight position={[0, -0.1, 0]} angle={0.5} penumbra={0.5} color="#FFF8DC" intensity={15} distance={6} castShadow />
          </group>
          {/* Spotlight 3 - Back left */}
          <group position={[-length / 4, height + beamHeight - 0.02, width / 4]}>
            <mesh>
              <cylinderGeometry args={[0.06, 0.08, 0.12, 16]} />
              <meshStandardMaterial color="#2C2C2C" metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[0, -0.08, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 0.02, 16]} />
              <meshStandardMaterial color="#FFFACD" emissive="#FFFF00" emissiveIntensity={8} toneMapped={false} />
            </mesh>
            <spotLight position={[0, -0.1, 0]} angle={0.5} penumbra={0.5} color="#FFF8DC" intensity={15} distance={6} castShadow />
          </group>
          {/* Spotlight 4 - Back right */}
          <group position={[length / 4, height + beamHeight - 0.02, width / 4]}>
            <mesh>
              <cylinderGeometry args={[0.06, 0.08, 0.12, 16]} />
              <meshStandardMaterial color="#2C2C2C" metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[0, -0.08, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 0.02, 16]} />
              <meshStandardMaterial color="#FFFACD" emissive="#FFFF00" emissiveIntensity={8} toneMapped={false} />
            </mesh>
            <spotLight position={[0, -0.1, 0]} angle={0.5} penumbra={0.5} color="#FFF8DC" intensity={15} distance={6} castShadow />
          </group>
        </>
      )}

      {/* Ceiling Fan - Larger, more prominent with light fixture */}
      {lighting.ceilingFan && (
        <group position={[0, height + beamHeight - 0.15, 0]}>
          {/* Motor housing - larger */}
          <mesh>
            <cylinderGeometry args={[0.12, 0.12, 0.18, 24]} />
            <meshStandardMaterial color="#3C3C3C" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Decorative ring */}
          <mesh position={[0, -0.05, 0]}>
            <torusGeometry args={[0.1, 0.02, 8, 24]} />
            <meshStandardMaterial color="#B8860B" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Fan blades - 5 larger blades */}
          {[0, 1, 2, 3, 4].map((i) => (
            <group key={`blade-${i}`} rotation={[0, (i * Math.PI * 2) / 5, 0]}>
              <mesh position={[0.45, -0.08, 0]}>
                <boxGeometry args={[0.7, 0.025, 0.15]} />
                <meshStandardMaterial color="#654321" roughness={0.7} metalness={0.1} />
              </mesh>
              {/* Blade bracket */}
              <mesh position={[0.12, -0.06, 0]}>
                <boxGeometry args={[0.08, 0.04, 0.04]} />
                <meshStandardMaterial color="#3C3C3C" metalness={0.8} roughness={0.3} />
              </mesh>
            </group>
          ))}
          {/* Light kit underneath */}
          <mesh position={[0, -0.2, 0]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color="#FFF8E7" emissive="#FFE4B5" emissiveIntensity={2} />
          </mesh>
          <pointLight position={[0, -0.3, 0]} color="#FFF8DC" intensity={2} distance={5} />
        </group>
      )}

      {/* Infrared Tube Heaters - Wall-mounted style with glowing orange elements */}
      {lighting.heaters && (
        <>
          {[
            { pos: [-length / 3, 0, 0] as [number, number, number], rot: 0 },
            { pos: [0, 0, 0] as [number, number, number], rot: 0 },
            { pos: [length / 3, 0, 0] as [number, number, number], rot: 0 },
          ].map(({ pos, rot }, hi) => {
            const heaterY = height + beamHeight - 0.08;
            const heaterLength = 0.6;
            const heaterRadius = 0.045;
            const housingWidth = 0.11;
            const housingHeight = 0.09;
            
            return (
              <group key={`heater-${hi}`} position={[pos[0], heaterY, pos[2]]} rotation={[0, rot, 0]}>
                {/* Mounting bracket to beam */}
                <mesh position={[0, housingHeight / 2 + 0.02, 0]}>
                  <boxGeometry args={[0.06, 0.05, 0.04]} />
                  <meshStandardMaterial color="#1A1A1A" metalness={0.9} roughness={0.2} />
                </mesh>
                
                {/* Main housing - dark rectangular body */}
                <mesh castShadow>
                  <boxGeometry args={[heaterLength, housingHeight, housingWidth]} />
                  <meshStandardMaterial color="#1A1A1A" metalness={0.85} roughness={0.15} />
                </mesh>
                
                {/* End caps - slightly wider dark blocks */}
                <mesh position={[-heaterLength / 2 - 0.02, 0, 0]} castShadow>
                  <boxGeometry args={[0.05, housingHeight + 0.01, housingWidth + 0.01]} />
                  <meshStandardMaterial color="#111111" metalness={0.9} roughness={0.2} />
                </mesh>
                <mesh position={[heaterLength / 2 + 0.02, 0, 0]} castShadow>
                  <boxGeometry args={[0.05, housingHeight + 0.01, housingWidth + 0.01]} />
                  <meshStandardMaterial color="#111111" metalness={0.9} roughness={0.2} />
                </mesh>
                
                {/* Reflector back panel (silver) */}
                <mesh position={[0, 0.01, 0]}>
                  <boxGeometry args={[heaterLength - 0.04, housingHeight - 0.03, housingWidth - 0.04]} />
                  <meshStandardMaterial color="#888888" metalness={0.95} roughness={0.1} />
                </mesh>
                
                {/* Glowing infrared heating tubes (2 tubes) */}
                <mesh position={[0, 0.01, -0.015]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.008, 0.008, heaterLength - 0.06, 12]} />
                  <meshStandardMaterial 
                    color="#FF6B00" 
                    emissive="#FF4500" 
                    emissiveIntensity={12} 
                    toneMapped={false} 
                  />
                </mesh>
                <mesh position={[0, 0.01, 0.015]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.008, 0.008, heaterLength - 0.06, 12]} />
                  <meshStandardMaterial 
                    color="#FF6B00" 
                    emissive="#FF4500" 
                    emissiveIntensity={12} 
                    toneMapped={false} 
                  />
                </mesh>
                
                {/* Warm orange glow from front opening */}
                <mesh position={[0, -housingHeight / 2 + 0.01, 0]}>
                  <boxGeometry args={[heaterLength - 0.06, 0.01, housingWidth - 0.04]} />
                  <meshStandardMaterial 
                    color="#FF4500" 
                    emissive="#FF3300" 
                    emissiveIntensity={4} 
                    transparent 
                    opacity={0.6} 
                    toneMapped={false} 
                  />
                </mesh>
                
                {/* Ventilation grille lines on end caps */}
                {[-1, 1].map((side) => (
                  <group key={`grille-${side}`} position={[side * (heaterLength / 2 + 0.02), 0, 0]}>
                    {[-2, -1, 0, 1, 2].map((gi) => (
                      <mesh key={`g-${gi}`} position={[0, gi * 0.012, 0]}>
                        <boxGeometry args={[0.052, 0.004, housingWidth - 0.03]} />
                        <meshStandardMaterial color="#0A0A0A" metalness={0.8} roughness={0.3} />
                      </mesh>
                    ))}
                  </group>
                ))}
                
                {/* Heat point light */}
                <pointLight position={[0, -0.15, 0]} color="#FF4500" intensity={3} distance={4} decay={2} />
              </group>
            );
          })}
        </>
      )}
    </group>
  );
});

PergolaModel.displayName = 'PergolaModel';
