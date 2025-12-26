import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Layers, 
  Play, 
  Pause,
  Box,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Scan3DViewerProps {
  scanType: 'ct' | 'mri';
  sliceCount?: number;
  className?: string;
}

export function Scan3DViewer({ scanType, sliceCount = 64, className }: Scan3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const animationRef = useRef<number | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSlice, setCurrentSlice] = useState(32);
  const [viewMode, setViewMode] = useState<'volume' | 'slice'>('volume');
  const [isDragging, setIsDragging] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(3);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Three.js scene
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = zoom;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    const backLight = new THREE.DirectionalLight(0x4080ff, 0.5);
    backLight.position.set(-1, -1, -1);
    scene.add(backLight);

    // Create volumetric representation
    createVolume(scene, scanType);

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      
      if (meshRef.current) {
        if (isPlaying) {
          meshRef.current.rotation.y += 0.01;
          setRotation(prev => ({ ...prev, y: meshRef.current!.rotation.y }));
        } else {
          meshRef.current.rotation.x = rotation.x;
          meshRef.current.rotation.y = rotation.y;
        }
      }
      
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.position.z = zoom;
    }
  }, [zoom]);

  useEffect(() => {
    if (meshRef.current && !isPlaying) {
      meshRef.current.rotation.x = rotation.x;
      meshRef.current.rotation.y = rotation.y;
    }
  }, [rotation, isPlaying]);

  const createVolume = (scene: THREE.Scene, type: 'ct' | 'mri') => {
    // Create a group to hold all elements
    const group = new THREE.Group();
    
    if (viewMode === 'volume') {
      // Create volumetric cube representation
      const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
      
      // Create custom shader material for volumetric effect
      const material = new THREE.MeshPhongMaterial({
        color: type === 'ct' ? 0x4080ff : 0x80ff40,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
      });
      
      const cube = new THREE.Mesh(geometry, material);
      group.add(cube);
      
      // Add wireframe for structure
      const wireframe = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry),
        new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.3, transparent: true })
      );
      group.add(wireframe);
      
      // Add slice planes
      for (let i = 0; i < 8; i++) {
        const slicePlane = new THREE.Mesh(
          new THREE.PlaneGeometry(1.4, 1.4),
          new THREE.MeshBasicMaterial({
            color: type === 'ct' ? 0x2060aa : 0x60aa20,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide,
          })
        );
        slicePlane.position.z = -0.7 + (i * 0.2);
        group.add(slicePlane);
      }
      
      // Add simulated organ shapes
      const organGeometry = new THREE.SphereGeometry(0.3, 32, 32);
      const organMaterial = new THREE.MeshPhongMaterial({
        color: type === 'ct' ? 0xff4040 : 0xff8040,
        transparent: true,
        opacity: 0.6,
      });
      
      const organ1 = new THREE.Mesh(organGeometry, organMaterial);
      organ1.position.set(-0.3, 0.2, 0);
      organ1.scale.set(1, 0.8, 0.6);
      group.add(organ1);
      
      const organ2 = new THREE.Mesh(organGeometry, organMaterial.clone());
      organ2.material.color.setHex(type === 'ct' ? 0x40ff40 : 0x40ffff);
      organ2.position.set(0.3, -0.1, 0.1);
      organ2.scale.set(0.7, 1.2, 0.5);
      group.add(organ2);
    } else {
      // Slice view - single plane
      const sliceGeometry = new THREE.PlaneGeometry(2, 2);
      const sliceMaterial = new THREE.MeshBasicMaterial({
        color: type === 'ct' ? 0x3070cc : 0x70cc30,
        side: THREE.DoubleSide,
      });
      const slice = new THREE.Mesh(sliceGeometry, sliceMaterial);
      
      // Add cross-section visualization
      const crossSection = new THREE.RingGeometry(0.3, 0.5, 32);
      const crossMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      });
      const crossMesh = new THREE.Mesh(crossSection, crossMaterial);
      crossMesh.position.set(-0.3, 0.2, 0.01);
      slice.add(crossMesh);
      
      group.add(slice);
    }
    
    scene.add(group);
    meshRef.current = group as unknown as THREE.Mesh;
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isPlaying) return;
    setRotation(prev => ({
      x: prev.x + e.movementY * 0.01,
      y: prev.y + e.movementX * 0.01,
    }));
  };

  const resetView = () => {
    setRotation({ x: 0, y: 0 });
    setZoom(3);
    setIsPlaying(false);
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Box className="w-4 h-4" />
            3D {scanType.toUpperCase()} Reconstruction
          </CardTitle>
          <Badge variant="outline" className="gap-1">
            <Layers className="w-3 h-3" />
            {sliceCount} slices
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === 'volume' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('volume')}
              className="h-7 px-2 text-xs"
            >
              <Box className="w-3 h-3 mr-1" />
              Volume
            </Button>
            <Button
              variant={viewMode === 'slice' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('slice')}
              className="h-7 px-2 text-xs"
            >
              <Eye className="w-3 h-3 mr-1" />
              Slice
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
            className="h-7 px-2"
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(z => Math.max(1.5, z - 0.5))}
            className="h-7 px-2"
          >
            <ZoomIn className="w-3 h-3" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(z => Math.min(6, z + 0.5))}
            className="h-7 px-2"
          >
            <ZoomOut className="w-3 h-3" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={resetView}
            className="h-7 px-2"
          >
            <RotateCcw className="w-3 h-3" />
          </Button>
        </div>

        {/* 3D Viewer */}
        <div
          ref={containerRef}
          className="aspect-square bg-[#1a1a2e] rounded-lg cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onMouseMove={handleMouseMove}
        />

        {/* Slice Slider */}
        {viewMode === 'slice' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Slice Position</span>
              <span className="font-mono">{currentSlice} / {sliceCount}</span>
            </div>
            <Slider
              value={[currentSlice]}
              onValueChange={([v]) => setCurrentSlice(v)}
              min={1}
              max={sliceCount}
              step={1}
            />
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-muted-foreground text-center">
          {isPlaying ? 'Auto-rotating' : 'Click and drag to rotate'} • Scroll to zoom
        </div>
      </CardContent>
    </Card>
  );
}
