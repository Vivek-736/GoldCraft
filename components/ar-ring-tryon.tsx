"use client";

import * as THREE from "three";
import { useEffect, useRef, useState, useCallback } from "react";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Eye, Camera, CameraOff, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const RINGS = [
  { id: "band",     name: "Classic Band",      sub: "22k Gold",    model: "/ring.glb", thumb: "/ring.png" },
  { id: "solitaire",name: "Diamond Solitaire", sub: "18k Gold",    model: "/ring.glb", thumb: "/ring.png" },
  { id: "emerald",  name: "Emerald Cut",       sub: "22k Rose Gold",model: "/ring.glb", thumb: "/ring.png" },
];

class Vec3Smoother {
  private buf: THREE.Vector3[] = [];
  private readonly n: number;
  constructor(n = 8) { this.n = n; }
  push(v: THREE.Vector3) {
    this.buf.push(v.clone());
    if (this.buf.length > this.n) this.buf.shift();
  }
  get(): THREE.Vector3 {
    if (!this.buf.length) return new THREE.Vector3();
    const s = new THREE.Vector3();
    for (const v of this.buf) s.add(v);
    return s.divideScalar(this.buf.length);
  }
  clear() { this.buf = []; }
}

function disposeObject(obj: THREE.Object3D) {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry?.dispose();
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      for (const m of mats) {
        if (m instanceof THREE.Material) {
          (m as THREE.MeshStandardMaterial).map?.dispose();
          m.dispose();
        }
      }
    }
  });
}

export function ARRingTryOn() {
  const threeCanvas  = useRef<HTMLCanvasElement>(null);
  const webcamCanvas = useRef<HTMLCanvasElement>(null);
  const videoRef     = useRef<HTMLVideoElement>(null);

  const scene      = useRef<THREE.Scene | null>(null);
  const renderer   = useRef<THREE.WebGLRenderer | null>(null);
  const camera     = useRef<THREE.PerspectiveCamera | null>(null);
  const orthoCamera= useRef<THREE.OrthographicCamera | null>(null);
  const orbit      = useRef<OrbitControls | null>(null);
  const ringObj    = useRef<THREE.Object3D | null>(null);
  const origMaxDim = useRef<number>(1);  
  const rafId      = useRef<number>(0);

  const stream   = useRef<MediaStream | null>(null);
  const hands    = useRef<any>(null);
  const arRafId  = useRef<number>(0);
  const posSm    = useRef(new Vec3Smoother(8));
  const scaleSm  = useRef<number>(80);

  const [mode, setMode]               = useState<"preview" | "ar">("preview");
  const [camOn, setCamOn]             = useState(false);
  const [ring, setRing]               = useState(RINGS[0]);
  const [loading, setLoading]         = useState(false);
  const [loadMsg, setLoadMsg]         = useState("");
  const [detected, setDetected]       = useState(false);

  const initThree = useCallback(() => {
    const cvs = threeCanvas.current;
    if (!cvs || scene.current) return;

    const sc = new THREE.Scene();
    sc.background = new THREE.Color(0xf5f2ed);
    scene.current = sc;

    const cam = new THREE.PerspectiveCamera(42, cvs.clientWidth / cvs.clientHeight, 0.001, 50);
    cam.position.set(0, 0.02, 0.18);
    camera.current = cam;

    const rend = new THREE.WebGLRenderer({ canvas: cvs, antialias: true, alpha: true });
    rend.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rend.setSize(cvs.clientWidth, cvs.clientHeight);
    rend.shadowMap.enabled = true;
    rend.shadowMap.type = THREE.PCFSoftShadowMap;
    rend.toneMapping = THREE.ACESFilmicToneMapping;
    rend.toneMappingExposure = 0.95;
    renderer.current = rend;

    sc.add(new THREE.AmbientLight(0xfff5e0, 0.55));

    const key = new THREE.DirectionalLight(0xffe8a0, 1.8);
    key.position.set(-2, 4, 3);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 0.01;
    key.shadow.camera.far  = 10;
    key.shadow.radius = 6;
    key.shadow.bias = -0.001;
    sc.add(key);

    const fill = new THREE.DirectionalLight(0xddeeff, 0.6);
    fill.position.set(3, 1, -1);
    sc.add(fill);

    const rim = new THREE.DirectionalLight(0xfff0cc, 0.4);
    rim.position.set(0, -2, -4);
    sc.add(rim);

    sc.add(new THREE.HemisphereLight(0xfff8ee, 0x8a6040, 0.35));

    const pmrem = new THREE.PMREMGenerator(rend);
    pmrem.compileEquirectangularShader();
    const envTexture = new THREE.DataTexture(
      (() => {
        const size = 64;
        const data = new Uint8Array(size * size * 4);
        for (let i = 0; i < size; i++) {
          for (let j = 0; j < size; j++) {
            const t = i / size;
            const idx = (i * size + j) * 4;
            data[idx]     = Math.round(255 * (0.98 * (1 - t) + 0.82 * t));
            data[idx + 1] = Math.round(255 * (0.96 * (1 - t) + 0.75 * t));
            data[idx + 2] = Math.round(255 * (0.92 * (1 - t) + 0.58 * t));
            data[idx + 3] = 255;
          }
        }
        return data;
      })(),
      64, 64,
      THREE.RGBAFormat,
    );
    envTexture.needsUpdate = true;
    const envMap = pmrem.fromEquirectangular(envTexture).texture;
    sc.environment = envMap;

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5, 0.5),
      new THREE.ShadowMaterial({ opacity: 0.12, transparent: true }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.05;
    floor.receiveShadow = true;
    floor.name = "floor";
    sc.add(floor);

    const oc = new OrbitControls(cam, cvs);
    oc.enableDamping = true;
    oc.dampingFactor = 0.07;
    oc.autoRotate = true;
    oc.autoRotateSpeed = 1.5;
    oc.minDistance = 0.05;
    oc.maxDistance = 0.6;
    orbit.current = oc;

    const oc2 = new THREE.OrthographicCamera(-1, 1, 1, -1, -1000, 1000);
    oc2.position.z = 500;
    orthoCamera.current = oc2;

    const obs = new ResizeObserver(() => {
      const w = cvs.clientWidth, h = cvs.clientHeight;
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
      rend.setSize(w, h);
    });
    obs.observe(cvs);

    const tick = () => {
      rafId.current = requestAnimationFrame(tick);
      oc.update();
      rend.render(sc, cam);
    };
    tick();

    return () => {
      obs.disconnect();
      cancelAnimationFrame(rafId.current);
      pmrem.dispose();
      envMap.dispose();
      envTexture.dispose();
    };
  }, []);

  const loadRing = useCallback((url: string) => {
    if (!scene.current) return;
    setLoading(true);
    setLoadMsg("Loading model...");

    if (ringObj.current) {
      disposeObject(ringObj.current);
      scene.current.remove(ringObj.current);
      ringObj.current = null;
    }

    new GLTFLoader().load(
      url,
      (gltf) => {
        const model = gltf.scene;

        model.position.set(0, 0, 0);
        model.rotation.set(0, 0, 0);
        model.scale.set(1, 1, 1);

        const box  = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxD = Math.max(size.x, size.y, size.z);
        origMaxDim.current = maxD > 0 ? maxD : 1;

        if (maxD > 0) model.scale.setScalar(0.065 / maxD);

        box.setFromObject(model);
        model.position.sub(box.getCenter(new THREE.Vector3()));
        model.position.y += 0.002;

        model.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return;
          child.castShadow = true;
          child.receiveShadow = true;
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((m) => {
            if (!(m instanceof THREE.MeshStandardMaterial)) return;
            m.metalness       = 0.95;
            m.roughness       = 0.22;
            m.envMap          = scene.current!.environment;
            m.envMapIntensity = 1.4;
            m.emissiveIntensity = 0;
            m.needsUpdate     = true;
          });
        });

        scene.current!.add(model);
        ringObj.current = model;
        setLoading(false);
        setLoadMsg("");
      },
      ({ loaded, total }) => setLoadMsg(`Loading... ${Math.round((loaded / Math.max(total, 1)) * 100)}%`),
      (err) => {
        console.error("GLB load error", err);
        setLoading(false);
        setLoadMsg("Model failed to load.");
      },
    );
  }, []);

  useEffect(() => {
    const cleanup = initThree();
    loadRing(ring.model);
    return () => {
      cleanup?.();
      cancelAnimationFrame(rafId.current);
      cancelAnimationFrame(arRafId.current);
      stream.current?.getTracks().forEach(t => t.stop());
      if (scene.current && ringObj.current) {
        disposeObject(ringObj.current);
        scene.current.remove(ringObj.current);
      }
      renderer.current?.dispose();
      scene.current = null;
    };
  }, []);

  useEffect(() => { loadRing(ring.model); }, [ring, loadRing]);

  const stopAR = useCallback(() => {
    cancelAnimationFrame(arRafId.current);
    stream.current?.getTracks().forEach(t => t.stop());
    stream.current = null;
    hands.current?.close?.();
    hands.current = null;
    posSm.current.clear();
    setCamOn(false);
    setDetected(false);
    setMode("preview");

    if (scene.current) {
      scene.current.background = new THREE.Color(0xf5f2ed);
      const floor = scene.current.getObjectByName("floor");
      if (floor) floor.visible = true;
    }
    if (orbit.current) { orbit.current.autoRotate = true; orbit.current.enabled = true; }

    if (ringObj.current) {
      ringObj.current.visible = true;
      ringObj.current.position.set(0, 0.002, 0);
      ringObj.current.rotation.set(0, 0, 0);
      ringObj.current.quaternion.identity();
      ringObj.current.scale.setScalar(0.065 / origMaxDim.current);
      scaleSm.current = 80; 
    }

    const tick = () => {
      rafId.current = requestAnimationFrame(tick);
      orbit.current?.update();
      if (scene.current && camera.current && renderer.current)
        renderer.current.render(scene.current, camera.current);
    };
    tick();
  }, []);

  const startAR = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
      });
      stream.current = s;
      if (videoRef.current) { videoRef.current.srcObject = s; await videoRef.current.play(); }

      if (scene.current) {
        scene.current.background = null;
        const floor = scene.current.getObjectByName("floor");
        if (floor) floor.visible = false;
      }
      if (orbit.current) { orbit.current.autoRotate = false; orbit.current.enabled = false; }
      cancelAnimationFrame(rafId.current);

      setCamOn(true);
      setMode("ar");
      await loadMediaPipe();
    } catch (e) {
      console.error(e);
    }
  }, []);

  const toggleCam = useCallback(() => {
    if (camOn) stopAR(); else startAR();
  }, [camOn, stopAR, startAR]);

  const loadMediaPipe = async () => {
    const { Hands, HAND_CONNECTIONS } = await import("@mediapipe/hands");
    const h = new Hands({
      locateFile: (f: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${f}`,
    });
    h.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.6,
    });
    h.onResults((res: any) => onResults(res, HAND_CONNECTIONS));
    hands.current = h;

    const loop = async () => {
      if (!videoRef.current || !stream.current) return;
      if (videoRef.current.readyState >= 2) {
        try { await h.send({ image: videoRef.current }); } catch { /* skip */ }
      }
      arRafId.current = requestAnimationFrame(loop);
    };
    loop();
  };

  const onResults = useCallback((results: any, HAND_CONNECTIONS: any) => {
    const vid = videoRef.current;
    const wc  = webcamCanvas.current;
    const tc  = threeCanvas.current;
    if (!vid || !wc || !tc) return;

    const vw = vid.videoWidth  || 1280;
    const vh = vid.videoHeight || 720;
    if (wc.width !== vw || wc.height !== vh) { wc.width = vw; wc.height = vh; }

    const ctx = wc.getContext("2d")!;
    ctx.save();
    ctx.translate(vw, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(vid, 0, 0, vw, vh);
    ctx.restore();

    if (!results.multiHandLandmarks?.length) {
      setDetected(false);
      if (ringObj.current) ringObj.current.visible = false;
      if (scene.current && camera.current && renderer.current)
        renderer.current.render(scene.current, camera.current);
      return;
    }

    setDetected(true);
    const lm = results.multiHandLandmarks[0] as { x: number; y: number; z: number }[];

    ctx.strokeStyle = "rgba(210,165,80,0.65)";
    ctx.lineWidth   = 2;
    if (HAND_CONNECTIONS) {
      for (const [a, b] of HAND_CONNECTIONS) {
        ctx.beginPath();
        ctx.moveTo((1 - lm[a].x) * vw, lm[a].y * vh);
        ctx.lineTo((1 - lm[b].x) * vw, lm[b].y * vh);
        ctx.stroke();
      }
    }
    for (const pt of lm) {
      ctx.beginPath();
      ctx.arc((1 - pt.x) * vw, pt.y * vh, 3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(210,165,80,0.85)";
      ctx.fill();
    }

    if (!ringObj.current || !scene.current || !orthoCamera.current || !renderer.current) return;

    const mcp = lm[13];
    const pip = lm[14];
    if (!mcp || !pip) return;

    const rendW = tc.clientWidth  || vw;
    const rendH = tc.clientHeight || vh;
    const oc = orthoCamera.current;
    oc.left   = -rendW / 2;
    oc.right  =  rendW / 2;
    oc.top    =  rendH / 2;
    oc.bottom = -rendH / 2;
    oc.updateProjectionMatrix();

    const toWorld = (lmk: { x: number; y: number; z: number }) =>
      new THREE.Vector3(
        (1 - lmk.x) * rendW - rendW / 2,
        -(lmk.y * rendH - rendH / 2),
        lmk.z * -150,
      );

    const mcpW = toWorld(mcp);
    const pipW = toWorld(pip);

    const targetPos = mcpW.clone().lerp(pipW, 0.3);
    posSm.current.push(targetPos);
    ringObj.current.position.lerp(posSm.current.get(), 0.3);

    const segPx = mcpW.distanceTo(pipW);
    const desiredDiamPx = Math.max(40, Math.min(220, segPx * 1.0));
    const targetScale   = desiredDiamPx / origMaxDim.current;
    scaleSm.current    += (targetScale - scaleSm.current) * 0.2;
    ringObj.current.scale.setScalar(scaleSm.current);

    const fingerAngle = Math.atan2(pipW.y - mcpW.y, pipW.x - mcpW.x);

    const q1 = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      Math.PI / 2,
    );

    const q2 = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 0, 1),
      fingerAngle + Math.PI / 2,
    );

    const targetQuat = q2.multiply(q1);
    ringObj.current.quaternion.slerp(targetQuat, 0.22);

    ringObj.current.visible = true;

    renderer.current.render(scene.current, oc);
  }, []);

  const switchMode = (m: "preview" | "ar") => {
    if (m === "ar" && !camOn) { startAR(); return; }
    if (m === "preview" && camOn) { stopAR(); return; }
    setMode(m);
  };

  const resetView = () => {
    camera.current?.position.set(0, 0.02, 0.18);
    orbit.current?.reset();
  };

  return (
    <div className="flex h-full min-h-[84vh] gap-5 flex-col xl:flex-row">
      <aside className="w-full xl:w-64 shrink-0 flex flex-col gap-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-amber-600">Select Style</p>
          <div className="space-y-2">
            {RINGS.map((r) => {
              const active = ring.id === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setRing(r)}
                  className={cn(
                    "group w-full flex items-center gap-3 rounded-xl p-2.5 text-left transition-all duration-200",
                    active
                      ? "bg-amber-50 ring-1 ring-amber-300 shadow-sm"
                      : "hover:bg-slate-50"
                  )}
                >
                  <div className={cn(
                    "h-11 w-11 shrink-0 rounded-lg overflow-hidden flex items-center justify-center transition-all",
                    active ? "bg-amber-100" : "bg-slate-100 group-hover:bg-slate-200"
                  )}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.thumb} alt={r.name} className="h-9 w-9 object-contain" />
                  </div>
                  <div className="min-w-0">
                    <p className={cn("text-sm font-semibold truncate", active ? "text-amber-800" : "text-slate-800")}>{r.name}</p>
                    <p className="text-[11px] text-slate-400">{r.sub}</p>
                  </div>
                  <div className={cn(
                    "ml-auto h-2 w-2 rounded-full shrink-0 transition-all",
                    active ? "bg-amber-500 scale-100" : "bg-transparent scale-0"
                  )} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-amber-600">View</p>
          <div className="flex rounded-full bg-slate-100 p-[3px] mb-3">
            {(["preview", "ar"] as const).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 rounded-full py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all duration-200",
                  mode === m ? "bg-white shadow-sm text-amber-700" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {m === "preview"
                  ? <><RotateCcw className="h-3 w-3" /> 3D</>
                  : <><Eye className="h-3 w-3" /> AR</>}
              </button>
            ))}
          </div>

          <button
            onClick={toggleCam}
            className={cn(
              "w-full flex items-center justify-center gap-2 rounded-full py-2.5 px-4 text-sm font-semibold transition-all duration-200",
              camOn
                ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                : "bg-amber-700 hover:bg-amber-800 text-white shadow-sm shadow-amber-900/20"
            )}
          >
            {camOn
              ? <><CameraOff className="h-4 w-4" />Stop Camera</>
              : <><Camera className="h-4 w-4" />Try On AR</>}
          </button>

          <button
            onClick={resetView}
            className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-full py-1.5 text-xs text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition-colors"
          >
            <RotateCcw className="h-3 w-3" /> Reset view
          </button>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-3.5">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-amber-600">Tips</p>
          {loadMsg ? (
            <p className="text-xs font-medium text-amber-800">{loadMsg}</p>
          ) : (
            <ul className="space-y-1.5">
              {[
                "Extend your ring finger naturally",
                "Keep hand within camera frame",
                "Good lighting helps tracking",
              ].map(t => (
                <li key={t} className="flex items-start gap-1.5 text-xs text-slate-600">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />{t}
                </li>
              ))}
            </ul>
          )}
          {camOn && (
            <div className={cn(
              "mt-3 flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold border transition-all",
              detected
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-white text-slate-500 border-slate-200"
            )}>
              <span className={cn("h-2 w-2 rounded-full", detected ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
              {detected ? "Hand detected" : "Searching for hand..."}
            </div>
          )}
        </div>
      </aside>

      <div className="relative flex-1 min-h-[520px] rounded-2xl overflow-hidden bg-[#f5f2ed] border border-slate-200/70 shadow-sm">
        <canvas
          ref={webcamCanvas}
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
            mode === "ar" && camOn ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        />

        <canvas
          ref={threeCanvas}
          className="absolute inset-0 w-full h-full"
        />

        <video ref={videoRef} className="hidden" muted playsInline />

        {loading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm">
            <div className="relative h-14 w-14">
              <div className="absolute inset-0 rounded-full border-[3px] border-amber-100 border-t-amber-600 animate-spin" />
              <Sparkles className="absolute inset-0 m-auto h-5 w-5 text-amber-600 animate-pulse" />
            </div>
            <p className="mt-4 text-sm font-medium text-slate-600">{loadMsg}</p>
          </div>
        )}

        {mode === "ar" && !camOn && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/5 backdrop-blur-[1px]">
            <button
              onClick={toggleCam}
              className="group flex flex-col items-center gap-4 rounded-2xl bg-white/90 backdrop-blur border border-slate-200 px-10 py-8 shadow-xl transition-all hover:shadow-2xl hover:scale-[1.02]"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-700 text-white group-hover:bg-amber-800 transition-colors shadow-lg">
                <Camera className="h-7 w-7" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-900">Start AR Try-On</p>
                <p className="text-xs text-slate-400 mt-1">Camera access required</p>
              </div>
            </button>
          </div>
        )}

        <div className="absolute top-3 left-3 z-30 pointer-events-none">
          <span className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider border",
            mode === "ar"
              ? "bg-black/30 backdrop-blur-sm text-white border-white/10"
              : "bg-white/80 backdrop-blur-sm text-amber-700 border-amber-200/60"
          )}>
            {mode === "ar"
              ? <><span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />Live AR</>
              : <><RotateCcw className="h-3 w-3" />3D Preview</>}
          </span>
        </div>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <span className="inline-block rounded-full bg-white/80 backdrop-blur border border-slate-200/60 px-4 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
            <span className="text-amber-700 font-semibold">{ring.name}</span>
            <span className="text-slate-400"> · {ring.sub}</span>
          </span>
        </div>
      </div>
    </div>
  );
}