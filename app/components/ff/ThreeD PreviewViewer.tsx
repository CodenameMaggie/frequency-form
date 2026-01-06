'use client';

/**
 * FF AI Style Studio - 3D Preview Viewer
 * Shows clothing designs on user's body type using Three.js
 */

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

interface ThreeDPreviewViewerProps {
  bodyType?: 'hourglass' | 'pear' | 'apple' | 'rectangle' | 'inverted_triangle';
  measurements?: {
    bust?: number;
    waist?: number;
    hips?: number;
    height_inches?: number;
  };
  garmentColor?: string;
  garmentType?: 'top' | 'bottom' | 'dress';
  fabricTexture?: string;
}

export default function ThreeDPreviewViewer({
  bodyType = 'hourglass',
  measurements,
  garmentColor = '#1a3a2f',
  garmentType = 'dress',
  fabricTexture
}: ThreeDPreviewViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8f6f3);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      50,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.6, 3);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 5;
    controls.maxPolarAngle = Math.PI / 1.5;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);

    // Ground
    const groundGeometry = new THREE.CircleGeometry(5, 32);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0xe8dcc4,
      roughness: 0.8
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Create body model (simplified for now - in production would load GLTF)
    createBodyModel(scene, bodyType, measurements, garmentColor, garmentType);

    setLoading(false);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;

      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [bodyType, garmentColor, garmentType]);

  // Create simplified body model
  const createBodyModel = (
    scene: THREE.Scene,
    bodyType: string,
    measurements: any,
    garmentColor: string,
    garmentType: string
  ) => {
    const group = new THREE.Group();

    // Scale factors based on body type
    let bustScale = 1.0;
    let waistScale = 0.7;
    let hipScale = 1.0;

    switch (bodyType) {
      case 'hourglass':
        bustScale = 1.0;
        waistScale = 0.65;
        hipScale = 1.0;
        break;
      case 'pear':
        bustScale = 0.85;
        waistScale = 0.7;
        hipScale = 1.1;
        break;
      case 'apple':
        bustScale = 1.05;
        waistScale = 0.95;
        hipScale = 0.9;
        break;
      case 'rectangle':
        bustScale = 0.95;
        waistScale = 0.9;
        hipScale = 0.95;
        break;
      case 'inverted_triangle':
        bustScale = 1.1;
        waistScale = 0.85;
        hipScale = 0.85;
        break;
    }

    // Create body parts (simplified mannequin)
    // Head
    const headGeometry = new THREE.SphereGeometry(0.13, 32, 32);
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd5a6,
      roughness: 0.6,
      metalness: 0.1
    });
    const head = new THREE.Mesh(headGeometry, skinMaterial);
    head.position.y = 1.65;
    head.castShadow = true;
    group.add(head);

    // Neck
    const neckGeometry = new THREE.CylinderGeometry(0.06, 0.08, 0.15, 16);
    const neck = new THREE.Mesh(neckGeometry, skinMaterial);
    neck.position.y = 1.5;
    neck.castShadow = true;
    group.add(neck);

    // Torso (with garment)
    const garmentMaterial = new THREE.MeshStandardMaterial({
      color: garmentColor,
      roughness: 0.7,
      metalness: 0.1
    });

    // Upper torso (bust area)
    const bustGeometry = new THREE.CylinderGeometry(
      0.15 * bustScale,
      0.12 * waistScale,
      0.4,
      32
    );
    const bust = new THREE.Mesh(bustGeometry, garmentMaterial);
    bust.position.y = 1.2;
    bust.castShadow = true;
    group.add(bust);

    // Lower torso (waist to hips)
    const waistGeometry = new THREE.CylinderGeometry(
      0.12 * waistScale,
      0.16 * hipScale,
      0.3,
      32
    );
    const waist = new THREE.Mesh(waistGeometry, garmentMaterial);
    waist.position.y = 0.85;
    waist.castShadow = true;
    group.add(waist);

    // Hips (if dress or bottom)
    if (garmentType === 'dress' || garmentType === 'bottom') {
      const hipGeometry = new THREE.CylinderGeometry(
        0.16 * hipScale,
        0.18 * hipScale,
        0.3,
        32
      );
      const hip = new THREE.Mesh(hipGeometry, garmentMaterial);
      hip.position.y = 0.55;
      hip.castShadow = true;
      group.add(hip);
    }

    // Arms (simplified)
    const armGeometry = new THREE.CylinderGeometry(0.04, 0.035, 0.6, 16);

    // Left arm
    const leftArm = new THREE.Mesh(armGeometry, skinMaterial);
    leftArm.position.set(-0.2 * bustScale, 1.1, 0);
    leftArm.rotation.z = 0.2;
    leftArm.castShadow = true;
    group.add(leftArm);

    // Right arm
    const rightArm = new THREE.Mesh(armGeometry, skinMaterial);
    rightArm.position.set(0.2 * bustScale, 1.1, 0);
    rightArm.rotation.z = -0.2;
    rightArm.castShadow = true;
    group.add(rightArm);

    // Legs (if no dress)
    if (garmentType !== 'dress') {
      const legGeometry = new THREE.CylinderGeometry(0.07, 0.06, 0.9, 16);
      const legMaterial = skinMaterial;

      // Left leg
      const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
      leftLeg.position.set(-0.08, 0.05, 0);
      leftLeg.castShadow = true;
      group.add(leftLeg);

      // Right leg
      const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
      rightLeg.position.set(0.08, 0.05, 0);
      rightLeg.castShadow = true;
      group.add(rightLeg);
    } else {
      // Dress skirt
      const skirtGeometry = new THREE.CylinderGeometry(
        0.18 * hipScale,
        0.3,
        0.6,
        32
      );
      const skirt = new THREE.Mesh(skirtGeometry, garmentMaterial);
      skirt.position.y = 0.25;
      skirt.castShadow = true;
      group.add(skirt);
    }

    scene.add(group);
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {loading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#1a3a2f',
          fontSize: '1.2rem'
        }}>
          Loading 3D preview...
        </div>
      )}

      {error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#c41e3a',
          fontSize: '1rem',
          textAlign: 'center',
          padding: '1rem'
        }}>
          {error}
        </div>
      )}

      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '600px',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '2px solid #1a3a2f'
        }}
      />

      {/* Controls info */}
      <div style={{
        marginTop: '1rem',
        padding: '0.75rem',
        backgroundColor: '#f8f6f3',
        borderRadius: '8px',
        fontSize: '0.85rem',
        color: '#666',
        textAlign: 'center'
      }}>
        <strong>Controls:</strong> Left-click + drag to rotate • Right-click + drag to pan • Scroll to zoom
      </div>
    </div>
  );
}
