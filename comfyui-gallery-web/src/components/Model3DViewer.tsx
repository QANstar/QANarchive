import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { api } from '../api/client';

interface Model3DViewerProps {
  src: string; // 需登录的授权文件端点
  alt?: string;
}

/**
 * 浏览器内 3D 交互预览(FBX)。源文件需登录,故通过授权客户端
 * (携带 JWT)以 fetch → ArrayBuffer → FBXLoader.parse() 加载。
 */
export default function Model3DViewer({ src }: Model3DViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;
    let frameId = 0;
    let renderer: THREE.WebGLRenderer | null = null;
    let controls: OrbitControls | null = null;
    let camera: THREE.PerspectiveCamera | null = null;

    const cleanup = () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      controls?.dispose();
      renderer?.dispose();
      if (mount) mount.innerHTML = '';
    };

    (async () => {
      try {
        const res = await api.get<Blob>(src, { responseType: 'blob' });
        if (disposed) return;
        const arrayBuffer = await res.data.arrayBuffer();

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x111114);

        camera = new THREE.PerspectiveCamera(50, mount.clientWidth / mount.clientHeight, 0.1, 10000);
        camera.position.set(3, 2, 3);

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(mount.clientWidth, mount.clientHeight);
        mount.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        const dir = new THREE.DirectionalLight(0xffffff, 0.85);
        dir.position.set(5, 10, 7);
        scene.add(dir);
        const dir2 = new THREE.DirectionalLight(0xffffff, 0.35);
        dir2.position.set(-6, -4, -6);
        scene.add(dir2);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        const loader = new FBXLoader();
        const object = loader.parse(arrayBuffer, '');
        scene.add(object);

        // 自动框选/居中
        const box = new THREE.Box3().setFromObject(object);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const dist = maxDim * 1.7;
        camera.position.set(center.x + dist, center.y + dist * 0.6, center.z + dist);
        camera.near = maxDim / 100;
        camera.far = maxDim * 100;
        camera.updateProjectionMatrix();
        controls.target.copy(center);
        controls.update();

        const animate = () => {
          if (disposed) return;
          controls?.update();
          renderer?.render(scene, camera!);
          frameId = requestAnimationFrame(animate);
        };
        animate();
        setLoading(false);
      } catch (e) {
        if (!disposed) {
          setError('模型加载失败,请确认已登录且文件有效');
          setLoading(false);
        }
      }
    })();

    const onResize = () => {
      if (!mount || !renderer || !camera) return;
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      cleanup();
    };
  }, [src]);

  return (
    <div className="model3d">
      {loading && !error && <div className="model3d-status">加载 3D 模型…</div>}
      {error && <div className="model3d-status error">{error}</div>}
      <div ref={mountRef} className="model3d-canvas" />
    </div>
  );
}
