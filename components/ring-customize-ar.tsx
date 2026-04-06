"use client";

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, CameraOff, RotateCcw, Sparkles, CheckCircle2, ChevronDown } from "lucide-react";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const STONES = [
  { id: "ruby", label: "Ruby", hex: "#E0115F", from: "from-red-500", to: "to-red-800" },
  { id: "emerald", label: "Emerald", hex: "#50C878", from: "from-emerald-400", to: "to-emerald-700" },
  { id: "sapphire", label: "Sapphire", hex: "#0F52BA", from: "from-blue-500", to: "to-blue-800" },
  { id: "pearl", label: "Pearl", hex: "#F0EAD6", from: "from-slate-50", to: "to-orange-100" },
  { id: "diamond", label: "Diamond", hex: "#E8F4FD", from: "from-sky-100", to: "to-white" },
  { id: "amethyst", label: "Amethyst", hex: "#9966CC", from: "from-purple-400", to: "to-purple-800" },
];

class Vec3Smoother {
  private buf: THREE.Vector3[] = [];
  constructor(private n = 8) { }
  push(v: THREE.Vector3) { this.buf.push(v.clone()); if (this.buf.length > this.n) this.buf.shift(); }
  get(): THREE.Vector3 {
    const s = new THREE.Vector3();
    this.buf.forEach(v => s.add(v));
    return this.buf.length ? s.divideScalar(this.buf.length) : s;
  }
  clear() { this.buf = []; }
}

function disposeObject(obj: THREE.Object3D) {
  obj.traverse(child => {
    if (child instanceof THREE.Mesh) {
      child.geometry?.dispose();
      [child.material].flat().forEach((m: THREE.Material) => {
        Object.values(m).forEach(v => { if (v instanceof THREE.Texture) v.dispose(); });
        m.dispose();
      });
    }
  });
}

export function RingCustomizeAR() {
  const [stone, setStone] = useState(STONES[0]);
  const [camOn, setCamOn] = useState(false);
  const [mode, setMode] = useState<"preview" | "ar">("preview");
  const [detected, setDetected] = useState(false);
  const [loadMsg, setLoadMsg] = useState("Loading ring...");
  const [modelLoaded, setModelLoaded] = useState(false);

  const previewCanvas = useRef<HTMLCanvasElement>(null);
  const arCanvas = useRef<HTMLCanvasElement>(null);
  const webcamCanvas = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const previewRend = useRef<THREE.WebGLRenderer | null>(null);
  const arRend = useRef<THREE.WebGLRenderer | null>(null);
  const perspCam = useRef<THREE.PerspectiveCamera | null>(null);
  const orthoCam = useRef<THREE.OrthographicCamera | null>(null);
  const orbitRef = useRef<OrbitControls | null>(null);
  const ringObj = useRef<THREE.Object3D | null>(null);
  const origMaxDim = useRef<number>(1);
  const previewScale = useRef<number>(1);
  const previewRafId = useRef<number>(0);

  const stoneMat = useRef<THREE.MeshStandardMaterial | null>(null);
  const origPixels = useRef<{ data: Uint8ClampedArray; w: number; h: number } | null>(null);
  const origTex = useRef<THREE.Texture | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const handsRef = useRef<any>(null);
  const arRafId = useRef<number>(0);
  const posSm = useRef(new Vec3Smoother(8));
  const scaleSm = useRef<number>(80);

  useEffect(() => {
    const cvs = previewCanvas.current;
    if (!cvs || previewRend.current) return;

    const sc = new THREE.Scene();
    sceneRef.current = sc;

    const cam = new THREE.PerspectiveCamera(45, cvs.clientWidth / cvs.clientHeight, 0.1, 100);
    cam.position.set(0, 2, 8);
    perspCam.current = cam;

    const rend = new THREE.WebGLRenderer({ canvas: cvs, antialias: true, alpha: true, powerPreference: "high-performance" });
    rend.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rend.setSize(cvs.clientWidth, cvs.clientHeight);
    rend.toneMapping = THREE.ACESFilmicToneMapping;
    rend.toneMappingExposure = 1.5;
    rend.shadowMap.enabled = true;
    rend.shadowMap.type = THREE.PCFSoftShadowMap;
    previewRend.current = rend;

    const pmrem = new THREE.PMREMGenerator(rend);
    pmrem.compileEquirectangularShader();
    sc.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    sc.add(new THREE.AmbientLight(0xffffff, 0.8));

    const key = new THREE.DirectionalLight(0xffffff, 2.5);
    key.position.set(5, 5, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    sc.add(key);

    const spot = new THREE.SpotLight(0xffdb4d, 10);
    spot.position.set(-5, 8, 2);
    spot.angle = 0.6;
    spot.penumbra = 1;
    spot.castShadow = true;
    sc.add(spot);

    const fill = new THREE.PointLight(0xe0f2fe, 1);
    fill.position.set(5, 0, -5);
    sc.add(fill);

    const oc = new OrbitControls(cam, cvs);
    oc.enableDamping = true;
    oc.dampingFactor = 0.05;
    oc.enableZoom = false;
    oc.autoRotate = true;
    oc.autoRotateSpeed = 2.0;
    orbitRef.current = oc;

    new GLTFLoader().load(
      "/ring.glb",
      (gltf) => {
        const model = gltf.scene;
        model.scale.set(1, 1, 1);
        model.position.set(0, 0, 0);
        model.rotation.set(0, 0, 0);

        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxD = Math.max(size.x, size.y, size.z);
        origMaxDim.current = maxD > 0 ? maxD : 1;

        const sc3 = 4.5 / maxD;
        previewScale.current = sc3;
        model.scale.setScalar(sc3);

        box.setFromObject(model);
        model.position.sub(box.getCenter(new THREE.Vector3()));
        model.position.y -= 0.5;

        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            child.castShadow = true;
            child.receiveShadow = true;

            if (mesh.material) {
              const mat = mesh.material as any;
              mat.envMapIntensity = 1.5;

              if (mat.map?.image) {
                const mName = (mat.name || "").toLowerCase();
                const cName = (child.name || "").toLowerCase();

                const isMetal = mName.includes("gold") || mName.includes("silver") || mName.includes("metal") || mName.includes("brass") ||
                  mName.includes("band") || mName.includes("mount") || mName.includes("ring") ||
                  cName.includes("gold") || cName.includes("silver") || cName.includes("metal") || cName.includes("brass") ||
                  cName.includes("band") || cName.includes("mount") || cName.includes("ring");

                const isStone = mName.includes("stone") || mName.includes("diamond") || mName.includes("gem") || mName.includes("ruby") ||
                  cName.includes("stone") || cName.includes("diamond") || cName.includes("gem") || cName.includes("ruby");

                if (isStone || (!stoneMat.current && !isMetal)) {
                  stoneMat.current = mat;
                  origTex.current = mat.map;

                  const img = mat.map.image as HTMLImageElement | ImageBitmap;
                  const w = (img as HTMLImageElement).naturalWidth || (img as ImageBitmap).width || 1024;
                  const h = (img as HTMLImageElement).naturalHeight || (img as ImageBitmap).height || 1024;

                  const tmpCanvas = document.createElement("canvas");
                  tmpCanvas.width = w;
                  tmpCanvas.height = h;
                  const tmpCtx = tmpCanvas.getContext("2d")!;
                  tmpCtx.drawImage(img as CanvasImageSource, 0, 0);

                  try {
                    const imgData = tmpCtx.getImageData(0, 0, w, h);
                    origPixels.current = { data: imgData.data, w, h };
                  } catch {

                  }
                }
              }
            }
          }
        });

        sc.add(model);
        ringObj.current = model;
        setModelLoaded(true);
        setLoadMsg("");
      },
      ({ loaded: l, total: t }) => setLoadMsg(`Loading... ${Math.round(l / Math.max(t, 1) * 100)}%`),
      err => { console.error(err); setLoadMsg("Model failed to load."); },
    );

    const obs = new ResizeObserver(() => {
      const w = cvs.clientWidth, h = cvs.clientHeight;
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
      rend.setSize(w, h);
    });
    obs.observe(cvs);

    const tick = () => {
      previewRafId.current = requestAnimationFrame(tick);
      oc.update();
      rend.render(sc, cam);
    };
    tick();

    return () => {
      obs.disconnect();
      cancelAnimationFrame(previewRafId.current);
      if (ringObj.current) disposeObject(ringObj.current);
      rend.dispose();
      sceneRef.current = null;
      previewRend.current = null;
    };
  }, []);

  useEffect(() => {
    const cvs = arCanvas.current;
    if (!cvs || arRend.current) return;

    const rend = new THREE.WebGLRenderer({ canvas: cvs, antialias: true, alpha: true });
    rend.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rend.setSize(cvs.clientWidth, cvs.clientHeight);
    rend.toneMapping = THREE.ACESFilmicToneMapping;
    rend.toneMappingExposure = 1.5;
    arRend.current = rend;

    const oc = new THREE.OrthographicCamera(-1, 1, 1, -1, -1000, 1000);
    oc.position.z = 500;
    orthoCam.current = oc;

    const obs = new ResizeObserver(() => rend.setSize(cvs.clientWidth, cvs.clientHeight));
    obs.observe(cvs);
    return () => { obs.disconnect(); rend.dispose(); arRend.current = null; };
  }, []);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(previewRafId.current);
      cancelAnimationFrame(arRafId.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  useEffect(() => {
    const mat = stoneMat.current;
    const cached = origPixels.current;
    const oTex = origTex.current;
    if (!mat || !cached) return;

    const { data: origData, w, h } = cached;
    const workingData = new Uint8ClampedArray(origData);
    const tc = new THREE.Color(stone.hex);

    for (let i = 0; i < workingData.length; i += 4) {
      const r = workingData[i] / 255;
      const g = workingData[i + 1] / 255;
      const b = workingData[i + 2] / 255;

      if (r > 0.35 && r > g * 1.4 && r > b * 1.4) {
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
        const factor = Math.min(2.5, luma * 3);
        workingData[i] = Math.min(255, Math.round(tc.r * factor * 255));
        workingData[i + 1] = Math.min(255, Math.round(tc.g * factor * 255));
        workingData[i + 2] = Math.min(255, Math.round(tc.b * factor * 255));
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const c2d = canvas.getContext("2d")!;
    c2d.putImageData(new ImageData(workingData, w, h), 0, 0);

    const newTex = new THREE.CanvasTexture(canvas);
    if (oTex) {
      newTex.wrapS = oTex.wrapS;
      newTex.wrapT = oTex.wrapT;
      newTex.flipY = oTex.flipY;
      newTex.colorSpace = oTex.colorSpace;
    }
    mat.map = newTex;
    mat.needsUpdate = true;
  }, [stone, modelLoaded]);

  const resetRingForPreview = useCallback(() => {
    if (!ringObj.current) return;
    ringObj.current.visible = true;
    ringObj.current.position.set(0, -0.5, 0);
    ringObj.current.rotation.set(0, 0, 0);
    ringObj.current.quaternion.identity();
    ringObj.current.scale.setScalar(previewScale.current);
    scaleSm.current = 80;
    if (orbitRef.current) { orbitRef.current.autoRotate = true; orbitRef.current.enabled = true; }
    cancelAnimationFrame(previewRafId.current);
    const tick = () => {
      previewRafId.current = requestAnimationFrame(tick);
      orbitRef.current?.update();
      if (sceneRef.current && perspCam.current && previewRend.current)
        previewRend.current.render(sceneRef.current, perspCam.current);
    };
    tick();
  }, []);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(arRafId.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    handsRef.current?.close?.();
    handsRef.current = null;
    posSm.current.clear();
    setCamOn(false);
    setDetected(false);
    setMode("preview");
    resetRingForPreview();
  }, [resetRingForPreview]);

  const startCamera = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
      });
      streamRef.current = s;
      if (videoRef.current) { videoRef.current.srcObject = s; await videoRef.current.play(); }

      cancelAnimationFrame(previewRafId.current);
      if (orbitRef.current) { orbitRef.current.autoRotate = false; orbitRef.current.enabled = false; }
      if (ringObj.current) { ringObj.current.scale.setScalar(1); ringObj.current.position.set(0, 0, 0); }

      setCamOn(true);
      setMode("ar");

      const { Hands, HAND_CONNECTIONS } = await import("@mediapipe/hands");
      const h = new Hands({
        locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${f}`,
      });
      h.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.7, minTrackingConfidence: 0.6 });
      h.onResults((res: any) => onResults(res, HAND_CONNECTIONS));
      handsRef.current = h;

      const loop = async () => {
        if (!videoRef.current || !streamRef.current) return;
        if (videoRef.current.readyState >= 2) { try { await h.send({ image: videoRef.current }); } catch { /* skip */ } }
        arRafId.current = requestAnimationFrame(loop);
      };
      loop();
    } catch (e) { console.error("Camera error:", e); }
  }, []);

  const toggleCam = useCallback(() => { if (camOn) stopCamera(); else startCamera(); }, [camOn, stopCamera, startCamera]);

  const onResults = useCallback((results: any, HAND_CONNECTIONS: any) => {
    const vid = videoRef.current, wc = webcamCanvas.current, ac = arCanvas.current;
    if (!vid || !wc || !ac) return;

    const vw = vid.videoWidth || 1280, vh = vid.videoHeight || 720;
    if (wc.width !== vw || wc.height !== vh) { wc.width = vw; wc.height = vh; }

    const ctx = wc.getContext("2d")!;
    ctx.save(); ctx.translate(vw, 0); ctx.scale(-1, 1);
    ctx.drawImage(vid, 0, 0, vw, vh);
    ctx.restore();

    if (!results.multiHandLandmarks?.length) {
      setDetected(false);
      if (ringObj.current) ringObj.current.visible = false;
      if (sceneRef.current && orthoCam.current && arRend.current)
        arRend.current.render(sceneRef.current, orthoCam.current);
      return;
    }

    setDetected(true);
    const lm = results.multiHandLandmarks[0] as { x: number; y: number; z: number }[];

    ctx.strokeStyle = "rgba(212,169,90,0.5)"; ctx.lineWidth = 1.5;
    if (HAND_CONNECTIONS) {
      for (const [a, b] of HAND_CONNECTIONS) {
        ctx.beginPath();
        ctx.moveTo((1 - lm[a].x) * vw, lm[a].y * vh);
        ctx.lineTo((1 - lm[b].x) * vw, lm[b].y * vh);
        ctx.stroke();
      }
    }
    for (const pt of lm) {
      ctx.beginPath(); ctx.arc((1 - pt.x) * vw, pt.y * vh, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(212,169,90,0.85)"; ctx.fill();
    }

    if (!ringObj.current || !sceneRef.current || !orthoCam.current || !arRend.current) return;

    const rendW = ac.clientWidth || vw, rendH = ac.clientHeight || vh;
    const oc = orthoCam.current;
    oc.left = -rendW / 2; oc.right = rendW / 2;
    oc.top = rendH / 2; oc.bottom = -rendH / 2;
    oc.updateProjectionMatrix();

    const toWorld = (l: { x: number; y: number; z: number }) =>
      new THREE.Vector3((1 - l.x) * rendW - rendW / 2, -(l.y * rendH - rendH / 2), l.z * -150);

    const mcp = lm[13], pip = lm[14];
    if (!mcp || !pip) return;

    const mcpW = toWorld(mcp), pipW = toWorld(pip);
    posSm.current.push(mcpW.clone().lerp(pipW, 0.3));
    ringObj.current.position.lerp(posSm.current.get(), 0.3);

    const segPx = mcpW.distanceTo(pipW);
    const tScale = Math.max(40, Math.min(220, segPx)) / origMaxDim.current;
    scaleSm.current += (tScale - scaleSm.current) * 0.2;
    ringObj.current.scale.setScalar(scaleSm.current);

    const fingerAngle = Math.atan2(pipW.y - mcpW.y, pipW.x - mcpW.x);
    const q1 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
    const q2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), fingerAngle + Math.PI / 2);
    ringObj.current.quaternion.slerp(q2.multiply(q1), 0.22);
    ringObj.current.visible = true;

    arRend.current.render(sceneRef.current, oc);
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 flex flex-col sm:flex-row items-start sm:items-center gap-4 px-5 py-3 bg-white border-b border-slate-100">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="bg-amber-700 px-3 py-1 skew-x-[-10deg] shadow-sm shrink-0">
            <span className="inline-block skew-x-10 text-[9px] font-bold uppercase tracking-widest text-white">
              Customize
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {STONES.map(s => {
              const active = stone.id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setStone(s)}
                  title={s.label}
                  className={cn(
                    "relative flex flex-col items-center gap-1 rounded-xl border px-2.5 py-2 w-16 transition-all duration-150 hover:-translate-y-0.5",
                    active
                      ? "border-amber-400 bg-amber-50 ring-2 ring-amber-300 shadow-sm"
                      : "border-slate-100 bg-white hover:border-amber-200"
                  )}
                >
                  <div className={cn("h-7 w-7 rounded-full bg-linear-to-br shadow-inner border border-white/40", s.from, s.to)} />
                  <span className={cn("text-[8px] font-semibold uppercase tracking-wide leading-none", active ? "text-amber-800" : "text-slate-500")}>
                    {s.label}
                  </span>
                  {active && <CheckCircle2 className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 text-amber-500 bg-white rounded-full" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 pl-4 border-l border-slate-100 h-10">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Category</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2 border-slate-200 bg-white hover:bg-slate-50">
                Ring <ChevronDown className="h-3.5 w-3.5 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[140px]">
              <DropdownMenuCheckboxItem checked>Ring</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem disabled>Necklace</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem disabled>All</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="sm:ml-auto flex items-center gap-3 shrink-0">
          <span className="inline-block h-5 w-5 rounded-full border-2 border-white shadow-md shrink-0" style={{ background: stone.hex }} />
          <div>
            <p className="text-sm font-semibold text-slate-900 leading-none">{stone.label} Ring</p>
            <p className="text-[10px] text-slate-400 mt-0.5">22k Gold · {stone.hex}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0 overflow-hidden">
        <div className="relative flex flex-col overflow-hidden bg-[#faf8f4] border-r border-slate-100">
          <div className="absolute top-3 left-3 z-10 pointer-events-none">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur border border-amber-200/60 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 shadow-sm">
              <RotateCcw className="h-3 w-3" /> 3D Preview
            </span>
          </div>

          {!modelLoaded && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#faf8f4]">
              <div className="relative h-12 w-12">
                <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-amber-100 border-t-amber-600" />
                <Sparkles className="absolute inset-0 m-auto h-5 w-5 text-amber-500 animate-pulse" />
              </div>
              <p className="mt-3 text-xs font-medium text-slate-500">{loadMsg}</p>
            </div>
          )}

          <canvas ref={previewCanvas} className="w-full h-full outline-none cursor-grab active:cursor-grabbing" />

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none">
            <span className="rounded-full bg-white/70 backdrop-blur border border-slate-200/60 px-3 py-1 text-[10px] text-slate-500">
              Drag to rotate
            </span>
          </div>
        </div>

        <div className="relative flex flex-col overflow-hidden bg-slate-950">
          <div className="absolute top-3 left-3 z-30 pointer-events-none">
            <span className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md",
              mode === "ar" ? "bg-black/40 text-white border-white/10" : "bg-white/10 text-slate-300 border-white/10"
            )}>
              {mode === "ar"
                ? <><span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />AR Live</>
                : <><Camera className="h-3 w-3" />AR Try-On</>}
            </span>
          </div>

          {camOn && (
            <div className={cn(
              "absolute top-3 right-3 z-30 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold border backdrop-blur-md transition-all",
              detected ? "bg-emerald-900/60 text-emerald-300 border-emerald-700" : "bg-black/40 text-slate-400 border-white/10"
            )}>
              <span className={cn("h-1.5 w-1.5 rounded-full", detected ? "bg-emerald-400 animate-pulse" : "bg-slate-500")} />
              {detected ? "Hand detected" : "Searching..."}
            </div>
          )}

          <canvas
            ref={webcamCanvas}
            className={cn("absolute inset-0 w-full h-full object-cover transition-opacity duration-300", camOn ? "opacity-100" : "opacity-0")}
          />

          <canvas ref={arCanvas} className="absolute inset-0 w-full h-full" />
          <video ref={videoRef} className="hidden" muted playsInline />

          {!camOn && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-linear-to-br from-slate-900 to-stone-900">
              <div className="mb-6 relative">
                <div className="h-20 w-20 rounded-full border-[3px] border-amber-700/30 flex items-center justify-center">
                  <div className="h-13 w-13 rounded-full border-[3px] border-amber-600/50 flex items-center justify-center">
                    <div className="h-6 w-6 rounded-full border-2 border-amber-500 animate-pulse" />
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full border-2 border-slate-900 shadow" style={{ background: stone.hex }} />
              </div>
              <h3 className="text-white font-serif text-lg mb-1.5">Try On Your Ring</h3>
              <p className="text-slate-400 text-xs mb-5 text-center px-6 max-w-xs">
                See the <span className="text-amber-400">{stone.label}</span> ring on your finger in real time
              </p>
              <button
                onClick={toggleCam}
                className="flex items-center gap-2 rounded-full bg-amber-700 hover:bg-amber-600 px-7 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105"
              >
                <Camera className="h-4 w-4" /> Start AR Try-On
              </button>
              <p className="mt-3 text-[10px] text-slate-600">Camera access required</p>
            </div>
          )}

          {camOn && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-black/50 backdrop-blur border border-white/10 px-4 py-1 text-[10px] text-white">
                <span className="h-2 w-2 rounded-full border border-white/40" style={{ background: stone.hex }} />
                {stone.label} · 22k Gold
              </span>
              <button
                onClick={toggleCam}
                className="flex items-center gap-2 rounded-full bg-black/50 backdrop-blur border border-white/10 px-5 py-2 text-xs font-semibold text-white hover:bg-red-900/60 hover:border-red-700/40 transition-all"
              >
                <CameraOff className="h-3.5 w-3.5" /> Stop Camera
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 flex flex-wrap items-center gap-x-6 gap-y-1 px-5 py-2 bg-amber-50/80 border-t border-amber-100">
        {["Extend your ring finger straight", "Keep hand in frame", "Good lighting helps tracking"].map(tip => (
          <span key={tip} className="flex items-center gap-1.5 text-[10px] text-amber-700">
            <Sparkles className="h-3 w-3 text-amber-500 shrink-0" />{tip}
          </span>
        ))}
      </div>
    </div>
  );
}