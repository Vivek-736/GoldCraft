"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  GLTFLoader
} from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  RoomEnvironment
} from "three/examples/jsm/environments/RoomEnvironment.js";
import {
  OrbitControls
} from "three/examples/jsm/controls/OrbitControls.js";
import gsap from "gsap";
import { ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);
  const [stoneColor, setStoneColor] = useState("#ff0000");
  const router = useRouter();
  const stoneMaterialRef = useRef<any>(null);
  const originalImageRef = useRef<HTMLImageElement | ImageBitmap | null>(null);
  const originalTexRef = useRef<THREE.Texture | null>(null);

  const handleClick = () => {
    router.push("/dashboard");
  };

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    let requestID: number;
    let isRendering = true;
    const ctx = gsap.context(() => {
      const scene = new THREE.Scene();

      const camera = new THREE.PerspectiveCamera(
        45,
        canvasRef.current!.clientWidth / canvasRef.current!.clientHeight,
        0.1,
        100,
      );
      camera.position.set(0, 2, 8);

      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current!,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });

      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(
        canvasRef.current!.clientWidth,
        canvasRef.current!.clientHeight,
      );
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.5;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.enableZoom = false;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 2.0;

      const environment = new RoomEnvironment();
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      scene.environment = pmremGenerator.fromScene(environment).texture;

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
      scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
      dirLight.position.set(5, 5, 5);
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      scene.add(dirLight);

      const spotLight = new THREE.SpotLight(0xffdb4d, 10);
      spotLight.position.set(-5, 8, 2);
      spotLight.angle = 0.6;
      spotLight.penumbra = 1;
      spotLight.castShadow = true;
      scene.add(spotLight);

      const fillLight = new THREE.PointLight(0xe0f2fe, 1);
      fillLight.position.set(5, 0, -5);
      scene.add(fillLight);

      const loader = new GLTFLoader();
      let model: THREE.Group | null = null;
      // eslint-disable-next-line prefer-const
      let mixer: THREE.AnimationMixer | null = null;

      loader.load(
        "/ring.glb",
        (gltf) => {
          model = gltf.scene;

          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());

          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 3.5 / maxDim;
          model.scale.set(scale, scale, scale);

          model.position.sub(center.multiplyScalar(scale));
          model.position.y -= 0.5;

          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              child.castShadow = true;
              child.receiveShadow = true;

              if (mesh.material) {
                const mat = mesh.material as any;
                mat.envMapIntensity = 1.5;

                if (mat.map?.image && !stoneMaterialRef.current) {
                  stoneMaterialRef.current = mat;
                  originalImageRef.current = mat.map.image;
                  originalTexRef.current = mat.map;
                }
              }
            }
          });
          scene.add(model);
          model.scale.set(0, 0, 0);
          gsap.to(model.scale, {
            x: scale,
            y: scale,
            z: scale,
            duration: 1.5,
            ease: "back.out(1.7)",
          });
        },
        undefined,
        (error) => {
          console.error("An error occurred loading the GLB:", error);
        },
      );

      const clock = new THREE.Clock();

      const observer = new IntersectionObserver(
        (entries) => {
          isRendering = entries[0].isIntersecting;
        },
        { threshold: 0 }
      );
      if (containerRef.current) observer.observe(containerRef.current);

      const animate = () => {
        requestID = requestAnimationFrame(animate);
        if (!isRendering) return;
        const delta = clock.getDelta();

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (mixer) mixer.update(delta);

        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      const handleResize = () => {
        if (!canvasRef.current) return;
        const width =
          canvasRef.current.parentElement?.clientWidth || window.innerWidth;
        const height =
          canvasRef.current.parentElement?.clientHeight || window.innerHeight;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      };
      window.addEventListener("resize", handleResize);
      handleResize();

      const tl = gsap.timeline();
      tl.from(titleRef.current, {
        y: 50,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
      })
        .from(
          leftColRef.current,
          {
            x: -50,
            opacity: 0,
            duration: 1,
            ease: "power3.out",
          },
          "-=0.5",
        )
        .from(
          rightColRef.current,
          {
            x: 50,
            opacity: 0,
            duration: 1,
            ease: "power3.out",
          },
          "-=0.8",
        );

      return () => {
        observer.disconnect();
        window.removeEventListener("resize", handleResize);
        cancelAnimationFrame(requestID);
        renderer.dispose();
        pmremGenerator.dispose();
        controls.dispose();
        if (model) scene.remove(model);
      };
    });

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const mat = stoneMaterialRef.current;
    const img = originalImageRef.current;
    const origTex = originalTexRef.current;
    if (!mat || !img) return;

    const canvas = document.createElement("canvas");
    const w = (img as HTMLImageElement).naturalWidth || (img as ImageBitmap).width || 1024;
    const h = (img as HTMLImageElement).naturalHeight || (img as ImageBitmap).height || 1024;
    canvas.width = w;
    canvas.height = h;
    const c2d = canvas.getContext("2d")!;
    c2d.drawImage(img as CanvasImageSource, 0, 0);

    let imageData: ImageData;
    try {
      imageData = c2d.getImageData(0, 0, w, h);
    } catch {
      return;
    }

    const data = imageData.data;
    const tc = new THREE.Color(stoneColor);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      if (r > 0.35 && r > g * 1.4 && r > b * 1.4) {
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
        const factor = Math.min(2.5, luma * 3);
        data[i] = Math.min(255, Math.round(tc.r * factor * 255));
        data[i + 1] = Math.min(255, Math.round(tc.g * factor * 255));
        data[i + 2] = Math.min(255, Math.round(tc.b * factor * 255));
      }
    }

    c2d.putImageData(imageData, 0, 0);
    const newTex = new THREE.CanvasTexture(canvas);
    if (origTex) {
      newTex.wrapS = origTex.wrapS;
      newTex.wrapT = origTex.wrapT;
      newTex.flipY = origTex.flipY;
      newTex.colorSpace = origTex.colorSpace;
    }
    mat.map = newTex;
    mat.needsUpdate = true;
  }, [stoneColor]);

  return (
    <section className="relative w-full min-h-screen bg-white overflow-hidden pt-24 pb-20 md:pb-8">
      <div className="container mx-auto px-4 md:px-6 h-full flex flex-col relative z-10">
        <div className="text-center mb-4 md:mb-0 mt-4 md:mt-8 relative z-20">
          <h1
            ref={titleRef}
            className="text-4xl md:text-8xl font-serif text-slate-900 leading-tight"
          >
            MINDFUL WAY FOR
            <br />
            <span className="text-amber-800 block mt-2">
              CUSTOM JEWELLERY
            </span>
          </h1>
        </div>

        <div className="flex-1 -mt-6 grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative">
          <div
            ref={leftColRef}
            className="flex flex-row md:flex-col order-3 md:order-0 justify-center flex-wrap gap-4 md:col-span-3 items-center md:items-start pl-0 md:pl-8"
          >
            <div className="bg-amber-700 p-2 text-white px-4 py-1 skew-x-[-10deg] inline-block mb-2 md:mb-4 shadow-lg">
              <span className="skew-x-10 block uppercase text-xs tracking-wider font-bold">
                Customize
              </span>
            </div>

            <div className="grid grid-cols-4 md:grid-cols-2 gap-3 md:gap-4 w-full md:w-auto">
              <div
                onClick={() => setStoneColor("#50C878")}
                className="group w-16 h-16 md:w-24 md:h-24 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center hover:-translate-y-1 transition-transform cursor-pointer hover:border-emerald-200 gap-1 md:gap-2"
              >
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-linear-to-br from-emerald-400 to-emerald-700 shadow-inner" />
                <span className="text-[8px] md:text-[10px] font-medium text-slate-600 uppercase tracking-wide group-hover:text-emerald-900">
                  Emerald
                </span>
              </div>
              <div
                onClick={() => setStoneColor("#F0EAD6")}
                className="group w-16 h-16 md:w-24 md:h-24 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center hover:-translate-y-1 transition-transform cursor-pointer hover:border-orange-100 gap-1 md:gap-2"
              >
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-linear-to-br from-slate-50 to-orange-100 shadow-inner border border-slate-100" />
                <span className="text-[8px] md:text-[10px] font-medium text-slate-600 uppercase tracking-wide group-hover:text-orange-900">
                  Pearl
                </span>
              </div>
              <div
                onClick={() => setStoneColor("#0F52BA")}
                className="group w-16 h-16 md:w-24 md:h-24 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center hover:-translate-y-1 transition-transform cursor-pointer hover:border-blue-200 gap-1 md:gap-2"
              >
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-linear-to-br from-blue-500 to-blue-800 shadow-inner" />
                <span className="text-[8px] md:text-[10px] font-medium text-slate-600 uppercase tracking-wide group-hover:text-blue-900">
                  Sapphire
                </span>
              </div>
              <div
                onClick={() => setStoneColor("#E0115F")}
                className="group w-16 h-16 md:w-24 md:h-24 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center hover:-translate-y-1 transition-transform cursor-pointer hover:border-red-200 gap-1 md:gap-2"
              >
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-linear-to-br from-red-500 to-red-800 shadow-inner" />
                <span className="text-[8px] md:text-[10px] font-medium text-slate-600 uppercase tracking-wide group-hover:text-red-900">
                  Ruby
                </span>
              </div>
            </div>
          </div>

          <div
            ref={containerRef}
            className="order-1 md:order-0 md:col-span-6 h-100 md:h-150 relative w-full -mt-6"
          >
            <canvas
              ref={canvasRef}
              className="w-full h-full outline-none cursor-grab active:cursor-grabbing"
            />
          </div>
          <div
            ref={rightColRef}
            className="order-2 md:order-0 md:col-span-3 flex flex-col gap-6 px-4 md:px-0 md:pr-8 text-center md:text-left items-center md:items-start"
          >
            <div>
              <h2 className="text-2xl md:text-3xl font-serif text-slate-900 mb-4">
                Gold Bracelet with Red Diamond Casato
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-8">
                It is the beauty we find in simplicity and sophistication. We
                believe that elegance can be found in your most basic everyday
                essentials.
              </p>

              <button
                onClick={handleClick}
                className="group cursor-pointer flex items-center gap-2 px-8 py-3 bg-amber-700 text-white hover:bg-amber-800 transition-all duration-300 shadow-lg shadow-amber-700/20 mx-auto md:mx-0"
              >
                <span className="font-medium tracking-wide">Customize Now</span>
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}