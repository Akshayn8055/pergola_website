import { useMemo } from 'react';
import * as THREE from 'three';

// Generate procedural wood grain texture
const createWoodTexture = (baseColor: string, size: number = 512): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Parse base color
  const color = new THREE.Color(baseColor);
  const r = Math.floor(color.r * 255);
  const g = Math.floor(color.g * 255);
  const b = Math.floor(color.b * 255);

  // Fill with base color
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  // Add wood grain lines
  const grainCount = 60 + Math.random() * 40;
  for (let i = 0; i < grainCount; i++) {
    const y = Math.random() * size;
    const variation = (Math.random() - 0.5) * 30;
    
    ctx.beginPath();
    ctx.moveTo(0, y);
    
    // Create wavy grain line
    for (let x = 0; x < size; x += 10) {
      const waveY = y + Math.sin(x * 0.02 + i) * (3 + Math.random() * 5) + variation * Math.sin(x * 0.005);
      ctx.lineTo(x, waveY);
    }
    
    const darkness = 0.7 + Math.random() * 0.3;
    ctx.strokeStyle = `rgba(${Math.floor(r * darkness)}, ${Math.floor(g * darkness)}, ${Math.floor(b * darkness)}, ${0.1 + Math.random() * 0.15})`;
    ctx.lineWidth = 0.5 + Math.random() * 2;
    ctx.stroke();
  }

  // Add knots occasionally
  const knotCount = Math.floor(Math.random() * 3);
  for (let i = 0; i < knotCount; i++) {
    const knotX = Math.random() * size;
    const knotY = Math.random() * size;
    const knotRadius = 5 + Math.random() * 15;
    
    const gradient = ctx.createRadialGradient(knotX, knotY, 0, knotX, knotY, knotRadius);
    gradient.addColorStop(0, `rgba(${Math.floor(r * 0.4)}, ${Math.floor(g * 0.4)}, ${Math.floor(b * 0.4)}, 0.8)`);
    gradient.addColorStop(0.5, `rgba(${Math.floor(r * 0.6)}, ${Math.floor(g * 0.6)}, ${Math.floor(b * 0.6)}, 0.5)`);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(knotX, knotY, knotRadius, knotRadius * 0.7, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // Add subtle noise for texture
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 10;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  
  return texture;
};

// Generate bump map from wood texture
const createBumpMap = (size: number = 512): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Start with medium gray
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  // Add grain bump patterns
  const grainCount = 80;
  for (let i = 0; i < grainCount; i++) {
    const y = Math.random() * size;
    
    ctx.beginPath();
    ctx.moveTo(0, y);
    
    for (let x = 0; x < size; x += 8) {
      const waveY = y + Math.sin(x * 0.02 + i) * (2 + Math.random() * 4);
      ctx.lineTo(x, waveY);
    }
    
    const brightness = 100 + Math.floor(Math.random() * 55);
    ctx.strokeStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
    ctx.lineWidth = 0.5 + Math.random() * 1.5;
    ctx.stroke();
  }

  // Add darker lines for depth
  for (let i = 0; i < 30; i++) {
    const y = Math.random() * size;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x < size; x += 10) {
      const waveY = y + Math.sin(x * 0.015 + i * 0.5) * 3;
      ctx.lineTo(x, waveY);
    }
    ctx.strokeStyle = `rgb(60, 60, 60)`;
    ctx.lineWidth = 0.3 + Math.random() * 0.7;
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  
  return texture;
};

// Generate normal map approximation
const createNormalMap = (size: number = 512): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Start with neutral normal (pointing up)
  ctx.fillStyle = '#8080ff';
  ctx.fillRect(0, 0, size, size);

  // Add grain normal variations
  const grainCount = 60;
  for (let i = 0; i < grainCount; i++) {
    const y = Math.random() * size;
    
    ctx.beginPath();
    ctx.moveTo(0, y);
    
    for (let x = 0; x < size; x += 6) {
      const waveY = y + Math.sin(x * 0.02 + i) * 3;
      ctx.lineTo(x, waveY);
    }
    
    // Slight normal variation (blue channel stays high)
    const rVariation = 128 + Math.floor((Math.random() - 0.5) * 30);
    const gVariation = 128 + Math.floor((Math.random() - 0.5) * 40);
    ctx.strokeStyle = `rgb(${rVariation}, ${gVariation}, 255)`;
    ctx.lineWidth = 1 + Math.random() * 2;
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  
  return texture;
};

// Hook to get wood material with textures - enhanced PBR
export const useWoodMaterial = (color: string, materialType: 'wood' | 'composite' | 'aluminum') => {
  return useMemo(() => {
    if (materialType === 'aluminum') {
      const normalTexture = createNormalMap();
      return {
        color: new THREE.Color(color),
        roughness: 0.35,
        metalness: 0.8,
        envMapIntensity: 1.0,
        normalMap: normalTexture,
        normalScale: new THREE.Vector2(0.15, 0.15),
      };
    }

    const colorTexture = createWoodTexture(color);
    const bumpTexture = createBumpMap();
    const normalTexture = createNormalMap();

    return {
      color: new THREE.Color(color),
      map: colorTexture,
      bumpMap: bumpTexture,
      normalMap: normalTexture,
      bumpScale: materialType === 'wood' ? 0.02 : 0.01,
      normalScale: new THREE.Vector2(
        materialType === 'wood' ? 0.4 : 0.2,
        materialType === 'wood' ? 0.4 : 0.2
      ),
      roughness: materialType === 'wood' ? 0.7 : 0.45,
      metalness: materialType === 'wood' ? 0 : 0.05,
      envMapIntensity: 0.8,
    };
  }, [color, materialType]);
};
// Hook for deck board material with grain direction - enhanced PBR
export const useDeckBoardMaterial = (
  color: string, 
  materialType: 'wood' | 'composite' | 'aluminum',
  isHorizontal: boolean
) => {
  return useMemo(() => {
    if (materialType === 'aluminum') {
      const normalTexture = createNormalMap(256);
      return {
        color: new THREE.Color(color),
        roughness: 0.35,
        metalness: 0.8,
        envMapIntensity: 1.0,
        normalMap: normalTexture,
        normalScale: new THREE.Vector2(0.15, 0.15),
      };
    }

    const colorTexture = createWoodTexture(color, 256);
    const bumpTexture = createBumpMap(256);
    const normalTexture = createNormalMap(256);
    
    // Adjust repeat based on board direction
    const repeatX = isHorizontal ? 4 : 1;
    const repeatY = isHorizontal ? 1 : 4;
    
    colorTexture.repeat.set(repeatX, repeatY);
    bumpTexture.repeat.set(repeatX, repeatY);
    normalTexture.repeat.set(repeatX, repeatY);
    
    // Rotate textures for vertical boards
    if (!isHorizontal) {
      colorTexture.rotation = Math.PI / 2;
      bumpTexture.rotation = Math.PI / 2;
      normalTexture.rotation = Math.PI / 2;
      colorTexture.center.set(0.5, 0.5);
      bumpTexture.center.set(0.5, 0.5);
      normalTexture.center.set(0.5, 0.5);
    }

    return {
      color: new THREE.Color(color),
      map: colorTexture,
      bumpMap: bumpTexture,
      normalMap: normalTexture,
      bumpScale: materialType === 'wood' ? 0.018 : 0.008,
      normalScale: new THREE.Vector2(
        materialType === 'wood' ? 0.35 : 0.15,
        materialType === 'wood' ? 0.35 : 0.15
      ),
      roughness: materialType === 'wood' ? 0.75 : 0.5,
      metalness: materialType === 'wood' ? 0 : 0.05,
      envMapIntensity: 0.6,
    };
  }, [color, materialType, isHorizontal]);
};