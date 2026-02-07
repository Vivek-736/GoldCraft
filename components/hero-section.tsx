"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import gsap from "gsap";
import { ArrowUpRight } from "lucide-react";

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const camera = new THREE.PerspectiveCamera(
      45,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 2, 8);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
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
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
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
        const scale = 4.0 / maxDim;
        model.scale.set(scale, scale, scale);

        model.position.sub(center.multiplyScalar(scale));
        model.position.y -= 0.2; 
        
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            const mesh = child as THREE.Mesh;
            if (mesh.material) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (mesh.material as any).envMapIntensity = 1.5; 
            }
          }
        });

        scene.add(model);

        model.scale.set(0,0,0);
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
      }
    );

    const clock = new THREE.Clock();

    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (mixer) mixer.update(delta);
      
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
        if(!canvasRef.current) return;
        const width = canvasRef.current.parentElement?.clientWidth || window.innerWidth;
        const height = canvasRef.current.parentElement?.clientHeight || window.innerHeight;
        
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
        ease: "power3.out"
    })
    .from(leftColRef.current, {
        x: -50,
        opacity: 0,
        duration: 1,
        ease: "power3.out"
    }, "-=0.5")
    .from(rightColRef.current, {
        x: 50,
        opacity: 0,
        duration: 1,
        ease: "power3.out"
    }, "-=0.8");

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      pmremGenerator.dispose();
      controls.dispose();
      if(model) scene.remove(model);
    };
  }, []);

  return (
    <section className="relative w-full min-h-screen md:h-[120vh] bg-white overflow-hidden pt-24 pb-12 md:pb-0">
      <div className="container mx-auto px-4 md:px-6 h-full flex flex-col relative z-10">
        <div className="text-center mb-4 md:mb-0 mt-4 md:mt-8 relative z-20">
             <h1 ref={titleRef} className="text-4xl md:text-8xl font-serif text-slate-900 leading-tight">
                MINDFUL WAY FOR <br />
                <span className="text-amber-800 block mt-2">CUSTOM JEWELLERY</span>
            </h1>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative">
          
          <div ref={leftColRef} className="flex flex-row md:flex-col order-3 md:order-0 justify-center flex-wrap gap-4 md:col-span-3 items-center md:items-start pl-0 md:pl-8">
            <div className="bg-amber-900 p-2 text-white px-4 py-1 skew-x-[-10deg] inline-block mb-2 md:mb-4 shadow-lg">
                <span className="skew-x-10 block uppercase text-xs tracking-wider font-bold">Premium Materials</span>
            </div>
            
            <div className="grid grid-cols-4 md:grid-cols-2 gap-3 md:gap-4 w-full md:w-auto">
                <div className="group w-16 h-16 md:w-24 md:h-24 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center hover:-translate-y-1 transition-transform cursor-pointer hover:border-amber-200 gap-1 md:gap-2">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-linear-to-br from-yellow-300 to-yellow-600 shadow-inner" /> 
                    <span className="text-[8px] md:text-[10px] font-medium text-slate-600 uppercase tracking-wide group-hover:text-amber-900">Gold</span>
                </div>
                <div className="group w-16 h-16 md:w-24 md:h-24 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center hover:-translate-y-1 transition-transform cursor-pointer hover:border-amber-200 gap-1 md:gap-2">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-linear-to-br from-slate-300 to-slate-500 shadow-inner" /> 
                    <span className="text-[8px] md:text-[10px] font-medium text-slate-600 uppercase tracking-wide group-hover:text-amber-900">Silver</span>
                </div>
                <div className="group w-16 h-16 md:w-24 md:h-24 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center hover:-translate-y-1 transition-transform cursor-pointer hover:border-amber-200 gap-1 md:gap-2">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-linear-to-br from-rose-300 to-rose-500 shadow-inner" /> 
                    <span className="text-[8px] md:text-[10px] font-medium text-slate-600 uppercase tracking-wide group-hover:text-amber-900">Rose</span>
                </div>
                <div className="group w-16 h-16 md:w-24 md:h-24 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center hover:-translate-y-1 transition-transform cursor-pointer hover:border-amber-200 gap-1 md:gap-2">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-linear-to-br from-slate-100 to-slate-400 shadow-inner" /> 
                    <span className="text-[8px] md:text-[10px] font-medium text-slate-600 uppercase tracking-wide group-hover:text-amber-900">Plat</span>
                </div>
            </div>
          </div>

          <div ref={containerRef} className="order-1 md:order-0 md:col-span-6 h-100 md:h-150 relative w-full">
            <canvas ref={canvasRef} className="w-full h-full outline-none cursor-grab active:cursor-grabbing" />
          </div>

          <div ref={rightColRef} className="order-2 md:order-0 md:col-span-3 flex flex-col gap-6 px-4 md:px-0 md:pr-8 text-center md:text-left items-center md:items-start">
            <div>
                <h2 className="text-2xl md:text-3xl font-serif text-slate-900 mb-4">
                    Gold Bracelet with Red Diamond Casato
                </h2>
                <p className="text-slate-500 text-sm leading-relaxed mb-8">
                    It is the beauty we find in simplicity and sophistication. 
                    We believe that elegance can be found in your most basic everyday essentials.
                </p>

                <button className="group cursor-pointer flex items-center gap-2 px-8 py-3 bg-amber-900 text-white hover:bg-amber-800 transition-all duration-300 shadow-lg shadow-amber-900/20 mx-auto md:mx-0">
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