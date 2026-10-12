import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export type EquipmentKind = 'bioreactor' | 'purification' | 'fillfinish';
interface Props { kind: EquipmentKind; running: boolean; temp: number; agitation: number; gas: number; quality: number; alarmCount: number; }

const metal = (color = '#9aafb7', roughness = .28) => new THREE.MeshStandardMaterial({ color, metalness: .82, roughness });
const matte = (color: string, roughness = .62) => new THREE.MeshStandardMaterial({ color, metalness: .16, roughness });

function makePipe(points: THREE.Vector3[], material: THREE.Material, radius = .045) {
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 32, radius, 10, false), material);
}
function addLabel(scene: THREE.Scene, text: string, position: [number, number, number]) {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(11,29,40,0.88)'; ctx.strokeStyle = '#4bbcae'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(2, 2, 508, 124, 18); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#d7f4ee'; ctx.font = 'bold 31px DM Sans, Arial'; ctx.fillText(text, 24, 78);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
  sprite.position.set(...position); sprite.scale.set(1.7, .43, 1); scene.add(sprite);
  return sprite;
}
function makeBioreactor(scene: THREE.Scene, indices: Props, animations: { bubbles: THREE.Mesh[]; impeller?: THREE.Group }) {
  const vessel = new THREE.Group(); scene.add(vessel);
  const stainless = metal('#8fa8b2', .24), darkSteel = metal('#415a65', .34), glass = new THREE.MeshPhysicalMaterial({ color: '#88d7d2', transparent: true, opacity: .17, roughness: .12, metalness: .08, side: THREE.DoubleSide, depthWrite: false });
  const fluidLevel = .55 + Math.max(0, Math.min(100, indices.quality)) / 100 * 1.1;
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(.96, .87, 2.85, 56, 1, true), glass); shell.position.y = 1.68; vessel.add(shell);
  const liquidMaterial = new THREE.MeshPhysicalMaterial({ color: indices.alarmCount ? '#b8744d' : '#39b9ac', transparent: true, opacity: .55, roughness: .16, metalness: .05, side: THREE.DoubleSide });
  const liquid = new THREE.Mesh(new THREE.CylinderGeometry(.835, .80, fluidLevel, 48, 1, true), liquidMaterial); liquid.position.y = .35 + fluidLevel / 2; vessel.add(liquid);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(.99, .99, .19, 56), stainless); top.position.y = 3.15; vessel.add(top);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.91, .88, .18, 56), stainless); base.position.y = .23; vessel.add(base);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(.91, 48, 18, 0, Math.PI * 2, 0, Math.PI / 2), darkSteel); dome.position.y = 3.22; vessel.add(dome);
  const torusMaterial = metal('#c8d5d9', .19);
  const rimTop = new THREE.Mesh(new THREE.TorusGeometry(.98, .045, 12, 60), torusMaterial); rimTop.rotation.x = Math.PI / 2; rimTop.position.y = 3.07; vessel.add(rimTop);
  const rimLower = new THREE.Mesh(new THREE.TorusGeometry(.87, .045, 12, 60), torusMaterial); rimLower.rotation.x = Math.PI / 2; rimLower.position.y = .32; vessel.add(rimLower);
  // Jacket bands and calibration marks create a more instrument-like silhouette.
  for (const y of [.72, 1.18, 1.64, 2.10, 2.56]) { const band = new THREE.Mesh(new THREE.TorusGeometry(.91, .018, 8, 60), darkSteel); band.rotation.x = Math.PI / 2; band.position.y = y; vessel.add(band); }
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const bolt = new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.035,12), darkSteel); bolt.rotation.x = Math.PI/2; bolt.position.set(Math.cos(a)*.9,3.26,Math.sin(a)*.9); vessel.add(bolt); }
  // Motor and shaft.
  const motorBody = new THREE.Mesh(new THREE.CylinderGeometry(.25,.29,.44,32), darkSteel); motorBody.position.y = 3.58; vessel.add(motorBody);
  const motorCap = new THREE.Mesh(new THREE.CylinderGeometry(.20,.24,.10,32), stainless); motorCap.position.y = 3.85; vessel.add(motorCap);
  const motorNeck = new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,.20,20), darkSteel); motorNeck.position.y = 3.30; vessel.add(motorNeck);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,2.55,16), stainless); shaft.position.y = 1.90; vessel.add(shaft);
  const impeller = new THREE.Group(); impeller.position.y = 1.14; vessel.add(impeller);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(.11,.11,.15,20), darkSteel); impeller.add(hub);
  for (let i=0;i<3;i++){ const blade=new THREE.Mesh(new THREE.BoxGeometry(.68,.055,.13),stainless); blade.position.x=.30; blade.rotation.y=i*Math.PI*2/3; impeller.add(blade); }
  const secondImpeller = new THREE.Group(); secondImpeller.position.y = 2.00; vessel.add(secondImpeller);
  const hub2 = new THREE.Mesh(new THREE.CylinderGeometry(.10,.10,.14,18), darkSteel); secondImpeller.add(hub2);
  for (let i=0;i<3;i++){const blade=new THREE.Mesh(new THREE.BoxGeometry(.57,.05,.12),stainless);blade.position.x=.25;blade.rotation.y=i*Math.PI*2/3;secondImpeller.add(blade)}
  animations.impeller = impeller;
  // Probe rods, port heads and wall-side measurement hardware.
  for (const [x,z,len,color] of [[-.42,.19,1.85,'#ccd9dc'],[-.57,-.10,1.48,'#6dc6bd'],[.44,-.14,1.27,'#d6bd83']] as [number,number,number,string][]) {
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,len,12), metal(color,.25)); rod.position.set(x,3.02-len/2,z); vessel.add(rod);
    const port = new THREE.Mesh(new THREE.CylinderGeometry(.11,.11,.13,20), darkSteel); port.position.set(x,3.10,z); vessel.add(port);
  }
  // Gas sparger ring and inlet line.
  const sparger = new THREE.Mesh(new THREE.TorusGeometry(.58,.035,10,48), metal('#7e9ba5',.3)); sparger.rotation.x=Math.PI/2; sparger.position.y=.58; vessel.add(sparger);
  vessel.add(makePipe([new THREE.Vector3(0,2.95,.91),new THREE.Vector3(0,3.2,1.25),new THREE.Vector3(.65,3.2,1.25),new THREE.Vector3(.65,2.35,1.25)], stainless,.065));
  vessel.add(makePipe([new THREE.Vector3(.88,2.45,0),new THREE.Vector3(1.20,2.45,0),new THREE.Vector3(1.28,1.35,0),new THREE.Vector3(.92,1.35,0)], metal('#5ca79e',.28),.052));
  // Legs, cross members and adjustable feet.
  for(let i=0;i<3;i++){const a=i*Math.PI*2/3;const leg=new THREE.Mesh(new THREE.CylinderGeometry(.065,.085,1.02,14),stainless);leg.position.set(Math.cos(a)*.82,-.25,Math.sin(a)*.82);vessel.add(leg);const foot=new THREE.Mesh(new THREE.CylinderGeometry(.12,.15,.11,16),darkSteel);foot.position.set(Math.cos(a)*.82,-.82,Math.sin(a)*.82);vessel.add(foot)}
  const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,1.6,12),darkSteel);crossbar.rotation.z=Math.PI/2;crossbar.position.y=-.39;vessel.add(crossbar);
  // Floating bubbles are observable and animated with the gas-transfer index.
  for(let i=0;i<45;i++){const r=THREE.MathUtils.randFloat(.018,.04);const b=new THREE.Mesh(new THREE.SphereGeometry(r,8,8),new THREE.MeshBasicMaterial({color:'#b4fff0',transparent:true,opacity:THREE.MathUtils.randFloat(.28,.76)}));b.position.set(THREE.MathUtils.randFloat(-.65,.65),THREE.MathUtils.randFloat(.5,fluidLevel+0.35),THREE.MathUtils.randFloat(-.65,.65));b.userData={speed:THREE.MathUtils.randFloat(.12,.52)*(0.5+indices.gas/100),baseX:b.position.x,baseZ:b.position.z,offset:Math.random()*6};vessel.add(b);animations.bubbles.push(b)}
  addLabel(scene,'ENTRAÎNEMENT · INDICES FICTIFS',[-1.35,4.05,0]);
  return vessel;
}
function makePurification(scene: THREE.Scene) {
  const group=new THREE.Group();scene.add(group);const steel=metal('#a8b9c0',.2), frame=metal('#455f69',.35), media=new THREE.MeshPhysicalMaterial({color:'#44b9ac',transparent:true,opacity:.45,roughness:.2});
  for(let i=0;i<3;i++){const x=(i-1)*1.08;const col=new THREE.Group();col.position.x=x;group.add(col);const shell=new THREE.Mesh(new THREE.CylinderGeometry(.30,.30,2.40,32,1,true),new THREE.MeshPhysicalMaterial({color:'#b9edf0',transparent:true,opacity:.22,roughness:.12,side:THREE.DoubleSide}));shell.position.y=1.55;col.add(shell);const resin=new THREE.Mesh(new THREE.CylinderGeometry(.24,.24,1.42,28),media);resin.position.y=1.26;col.add(resin);for(const y of [.34,2.75]){const rim=new THREE.Mesh(new THREE.TorusGeometry(.30,.055,10,32),steel);rim.rotation.x=Math.PI/2;rim.position.y=y;col.add(rim)}const cap=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.13,24),frame);cap.position.y=2.88;col.add(cap);const gauge=new THREE.Mesh(new THREE.CylinderGeometry(.11,.11,.055,24),steel);gauge.rotation.x=Math.PI/2;gauge.position.set(0,2.45,.31);col.add(gauge);}
  for(let i=0;i<4;i++){const x=(i-1.5)*.58;const leg=new THREE.Mesh(new THREE.BoxGeometry(.06,3.4,.06),frame);leg.position.set(x,1.5,-.42);group.add(leg)}
  group.add(makePipe([new THREE.Vector3(-1.08,2.92,0),new THREE.Vector3(-1.08,3.4,0),new THREE.Vector3(1.08,3.4,0),new THREE.Vector3(1.08,2.92,0)],steel,.055));
  group.add(makePipe([new THREE.Vector3(-1.08,.25,0),new THREE.Vector3(-1.08,-.05,.25),new THREE.Vector3(1.08,-.05,.25),new THREE.Vector3(1.08,.25,0)],metal('#56b6aa',.25),.05));
  addLabel(scene,'UNITÉ DE PURIFICATION · MODÈLE',[-1.45,3.85,0]);return group;
}
function makeFiller(scene: THREE.Scene, animations:{bottles:THREE.Group[]}) {
  const group=new THREE.Group();scene.add(group);const steel=metal('#9eafb5',.28), rail=metal('#435d68',.32), clear=new THREE.MeshPhysicalMaterial({color:'#b6e5e4',transparent:true,opacity:.55,roughness:.15});
  const belt=new THREE.Mesh(new THREE.BoxGeometry(4.8,.16,1.0),matte('#253d47',.35));belt.position.y=.18;group.add(belt);
  for(const z of [-.47,.47]){const side=new THREE.Mesh(new THREE.BoxGeometry(4.9,.20,.08),steel);side.position.set(0,.31,z);group.add(side);const railLeg=new THREE.Mesh(new THREE.BoxGeometry(.12,1.2,.12),rail);railLeg.position.set(-1.8,-.4,z);group.add(railLeg);railLeg.position.x=1.8;}
  const canopy=new THREE.Mesh(new THREE.BoxGeometry(1.32,2.25,1.34),new THREE.MeshPhysicalMaterial({color:'#b5d2d7',transparent:true,opacity:.12,roughness:.15,metalness:.1,side:THREE.DoubleSide}));canopy.position.set(.1,1.38,0);group.add(canopy);
  for(let i=0;i<4;i++){const x=-.42+i*.28;const head=new THREE.Mesh(new THREE.CylinderGeometry(.05,.045,.62,16),steel);head.position.set(x,2.43,0);group.add(head);const nozzle=new THREE.Mesh(new THREE.ConeGeometry(.065,.14,16),metal('#52beb1',.25));nozzle.position.set(x,2.04,0);group.add(nozzle)}
  for(let i=0;i<8;i++){const bottle=new THREE.Group();const x=-2.0+i*.56;bottle.position.set(x,.32,0);group.add(bottle);const glass=new THREE.Mesh(new THREE.CylinderGeometry(.13,.12,.38,24),clear);glass.position.y=.25;bottle.add(glass);const neck=new THREE.Mesh(new THREE.CylinderGeometry(.065,.075,.13,18),clear);neck.position.y=.50;bottle.add(neck);const cap=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.085,18),i<4?steel:metal('#50b9ac',.24));cap.position.y=.61;bottle.add(cap);const liquid=new THREE.Mesh(new THREE.CylinderGeometry(.105,.105,.17,20),new THREE.MeshStandardMaterial({color:'#4bc0ad',transparent:true,opacity:.66}));liquid.position.y=.18;bottle.add(liquid);bottle.userData={baseX:x};animations.bottles.push(bottle)}
  group.add(makePipe([new THREE.Vector3(-.5,2.8,0),new THREE.Vector3(-.8,3.0,0),new THREE.Vector3(.7,3.0,0),new THREE.Vector3(.7,2.8,0)],steel,.06));addLabel(scene,'REMPLISSAGE · SCÉNARIO VIRTUEL',[-1.7,3.48,0]);return group;
}

export default function EquipmentViewer({kind,running,temp,agitation,gas,quality,alarmCount}:Props){
  const hostRef=useRef<HTMLDivElement>(null);const dataRef=useRef({kind,running,temp,agitation,gas,quality,alarmCount});
  useEffect(()=>{dataRef.current={kind,running,temp,agitation,gas,quality,alarmCount}},[kind,running,temp,agitation,gas,quality,alarmCount]);
  useEffect(()=>{
    const host=hostRef.current;if(!host)return;
    let renderer:THREE.WebGLRenderer;try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});}catch{host.innerHTML='<div class="webgl-fallback"><strong>Visualisation 3D indisponible</strong><span>Ce navigateur ou cet appareil ne prend pas en charge WebGL.</span></div>';return}
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.setSize(host.clientWidth,host.clientHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;host.appendChild(renderer.domElement);
    const scene=new THREE.Scene();scene.background=new THREE.Color('#0b1721');scene.fog=new THREE.Fog('#0b1721',9,20);
    const camera=new THREE.PerspectiveCamera(39,host.clientWidth/host.clientHeight,.1,100);camera.position.set(5.2,4.4,7.5);
    const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.055;controls.target.set(0,1.55,0);controls.minDistance=4;controls.maxDistance=12;controls.maxPolarAngle=Math.PI*.83;
    scene.add(new THREE.HemisphereLight('#d0f7f1','#223943',2.05));const key=new THREE.DirectionalLight('#fff0d6',3.1);key.position.set(4,7,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);scene.add(key);const fill=new THREE.PointLight('#47c3b1',28,12);fill.position.set(-3,3,3);scene.add(fill);const rim=new THREE.PointLight('#589ac5',18,11);rim.position.set(3,3,-4);scene.add(rim);
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:'#101f29',roughness:.78,metalness:.2}));floor.rotation.x=-Math.PI/2;floor.position.y=-.92;floor.receiveShadow=true;scene.add(floor);
    const grid=new THREE.GridHelper(16,32,'#28424a','#1d3039');grid.position.y=-.91;(grid.material as THREE.Material).transparent=true;(grid.material as THREE.Material).opacity=.48;scene.add(grid);
    const axes=new THREE.AxesHelper(1);axes.visible=false;scene.add(axes);
    const ambientPoints:THREE.Mesh[]=[];const group = dataRef.current.kind==='bioreactor'?makeBioreactor(scene,dataRef.current,{bubbles:ambientPoints}):dataRef.current.kind==='purification'?makePurification(scene):makeFiller(scene,{bottles:ambientPoints as unknown as THREE.Group[]});
    scene.traverse((object)=>{if(object instanceof THREE.Mesh){object.castShadow=true;object.receiveShadow=true;}});
    if(dataRef.current.kind==='purification') { camera.position.set(4.5,3.2,7);controls.target.set(0,1.45,0); }
    if(dataRef.current.kind==='fillfinish') { camera.position.set(5.7,3.6,7.7);controls.target.set(0,1.1,0); }
    const clock=new THREE.Clock();let frame=0;let disposed=false;
    const resize=()=>{if(!host||disposed)return;const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h)};
    const observer=new ResizeObserver(resize);observer.observe(host);
    const animate=()=>{if(disposed)return;frame=requestAnimationFrame(animate);const t=clock.getElapsedTime();const state=dataRef.current;
      if(state.kind==='bioreactor'){
        const impeller=group.children.find(o=>o instanceof THREE.Group && o.position.y===1.14) as THREE.Group|undefined;
        if(impeller&&state.running)impeller.rotation.y=t*(.75+state.agitation/65);
        ambientPoints.forEach((bubble,i)=>{if(state.running){bubble.position.y+=Number(bubble.userData.speed)*.014*(.4+state.gas/60);bubble.position.x=Number(bubble.userData.baseX)+Math.sin(t+Number(bubble.userData.offset))*.035;bubble.position.z=Number(bubble.userData.baseZ)+Math.cos(t*.7+Number(bubble.userData.offset))*.035;if(bubble.position.y>2.25){bubble.position.y=.56;bubble.position.x=Number(bubble.userData.baseX);}}});
        group.rotation.y=Math.sin(t*.12)*.02;
      }
      if(state.kind==='fillfinish'&&state.running)ambientPoints.forEach((b,i)=>{b.position.x=Number(b.userData.baseX)+Math.sin(t*.7)*.08});
      // Subtle light pulse signals activity without presenting itself as a real alarm lamp.
      fill.intensity=state.alarmCount>0?22+Math.sin(t*4)*5:state.running?24:16;
      controls.update();renderer.render(scene,camera);
    };animate();
    return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();controls.dispose();scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const m=o.material;if(Array.isArray(m))m.forEach(x=>x.dispose());else m.dispose()}if(o instanceof THREE.Sprite){o.material.map?.dispose();o.material.dispose()}});renderer.dispose();if(renderer.domElement.parentElement===host)host.removeChild(renderer.domElement)};
  },[kind]);
  return <div className="equipment-viewer" ref={hostRef} aria-label="Rendu 3D interactif de l'équipement de simulation"><div className="viewer-chip"><span className={running?'live-dot':'idle-dot'}/>{running?'SCÉNARIO EN COURS':'VUE ÉQUIPEMENT'}<span className="viewer-divider"/>{kind==='bioreactor'?'MODULE RÉACTEUR':kind==='purification'?'MODULE SÉPARATION':'MODULE FILL & FINISH'}</div><div className="viewer-tip"><span>⌖</span> Glisser pour tourner · Molette pour zoomer</div><div className="viewer-bottom"><div><span>ÉTAT VISUEL</span><strong>{alarmCount>0?'ANOMALIE À EXAMINER':running?'DYNAMIQUE ACTIVE':'EN ATTENTE'}</strong></div><div><span>INDICE QUALITÉ</span><strong>{quality.toFixed(1)}<small>/100</small></strong></div></div></div>
}
