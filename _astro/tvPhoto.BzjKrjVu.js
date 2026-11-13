import{E as e,L as t,M as n,N as r,P as i,_ as a,h as o,k as s,n as c,o as l,v as u}from"./three.module.YmngxLfQ.js";var d=12,f=420,p=4/3,m=1,h=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`,g=`
uniform sampler2D photo;
uniform sampler2D thumb;
uniform sampler2D mask; // r: vidro (borda suave), g: vidro bem desfocado

// Área acesa do tubo (onde a imagem aparece), em coordenadas da tela (0..1):
// recuada da borda do vidro, com cantos arredondados, como num CRT de verdade.
#define RASTER_MARGIN 0.036
#define RASTER_RADIUS 0.075
// Vidro é mais alto que largo na foto: corrige para os cantos ficarem redondos.
#define RASTER_Y 1.19

uniform mat3 toScreen;
uniform vec2 uvScale;
uniform vec2 uvOffset;
uniform float time;
uniform float noiseAmt;
uniform float roll;
uniform float hasThumb;
varying vec2 vUv;

float rand(vec2 c) {
  return fract(sin(dot(c, vec2(12.9898, 78.233))) * 43758.5453);
}

float roundRect(vec2 p, vec2 halfSize, float r) {
  vec2 q = abs(p) - halfSize + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

// Amostra da thumb em coordenadas da tela (0..1, y para baixo), recortada em 4:3.
vec3 thumbAt(vec2 uv) {
  vec2 t = uv * uvScale + uvOffset;
  return texture2D(thumb, vec2(t.x, 1.0 - t.y)).rgb;
}

void main() {
  vec3 photoCol = texture2D(photo, vUv).rgb;

  // Pixel da foto -> coordenada dentro do vidro (homografia).
  vec2 p = vec2(vUv.x, 1.0 - vUv.y);
  vec3 s = toScreen * vec3(p, 1.0);
  vec2 suv = s.xy / s.z;
  vec2 m = texture2D(mask, vUv).rg;
  float inside = m.r;
  // Perto da borda do vidro o desfocado fica em ~0.5; no meio, 1.
  float depth = smoothstep(0.42, 0.9, m.g);
  // Contorno da área acesa, levemente abaulado para fora como o vidro.
  vec2 rc = suv - 0.5;
  vec2 rv = rc * (1.0 - 0.08 * dot(rc, rc)) * vec2(1.0, RASTER_Y);
  float redge = roundRect(rv, vec2(0.5 - RASTER_MARGIN, (0.5 - RASTER_MARGIN) * RASTER_Y), RASTER_RADIUS);
  float raster = smoothstep(0.005, -0.005, redge);

  // Cor média da tela (para a luz que vaza na moldura).
  vec3 avg = (thumbAt(vec2(0.25, 0.25)) + thumbAt(vec2(0.75, 0.25)) + thumbAt(vec2(0.5, 0.5)) +
              thumbAt(vec2(0.25, 0.75)) + thumbAt(vec2(0.75, 0.75))) / 5.0;
  avg = mix(avg * hasThumb, vec3(0.45), noiseAmt);

  vec3 col = photoCol;

  if (inside > 0.0) {
    // Curvatura do tubo (barril).
    vec2 cc = suv - 0.5;
    float d = dot(cc, cc);
    vec2 uv = 0.5 + cc * (1.0 + 0.1 * d);

    // Na troca de canal a imagem rola e as linhas tremem.
    vec2 ruv = uv;
    ruv.y = fract(ruv.y + roll);
    ruv.x += (rand(vec2(floor(uv.y * 90.0), time)) - 0.5) * 0.04 * noiseAmt;

    vec3 c;
    c.r = thumbAt(ruv + vec2(0.0018, 0.0)).r;
    c.g = thumbAt(ruv).g;
    c.b = thumbAt(ruv - vec2(0.0018, 0.0)).b;
    c *= hasThumb;

    // Chiado.
    float n = rand(floor(suv * vec2(240.0, 180.0)) + fract(time) * 17.0);
    c = mix(c, vec3(n * 0.85), noiseAmt);

    // Linhas de varredura, máscara de sombra, vinheta do tubo e granulado.
    c *= 0.78 + 0.22 * sin(uv.y * 220.0 * 3.14159);
    c *= 0.93 + 0.07 * sin(suv.x * 560.0 * 3.14159);
    c *= 1.0 - d * 1.2;
    c += (rand(suv * 731.0 + fract(time)) - 0.5) * 0.045;
    // A imagem só existe na área acesa; perto da borda dela o fósforo perde força.
    c = max(c, 0.0) * raster * mix(0.5, 1.0, smoothstep(0.0, -0.07, redge));
    // Tubo escurece nas bordas do vidro.
    c *= mix(0.6, 1.0, depth);
    // Na margem entre a imagem e a borracha, só um brilho fraco do tubo ligado.
    c += avg * 0.035 * (1.0 - raster) * depth;

    // Os reflexos e a poeira do vidro da foto continuam por cima da imagem.
    // Reflexos fortes são comprimidos, para não lavarem a imagem.
    vec3 glass = photoCol / (1.0 + photoCol * 2.5);
    vec3 screenCol = c * 0.95 + glass * 0.6;
    col = mix(photoCol, screenCol, inside);
  }

  // Luz da tela batendo só na moldura logo em volta do vidro.
  float spill = (1.0 - inside) * m.g * m.g;
  col += avg * spill * 0.16;

  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;function _(e){let t=e.reduce((e,[t])=>e+t,0)/4,n=e.reduce((e,[,t])=>e+t,0)/4,[[r,i],[o,s],[c,l],[u,d]]=e.map(([e,r])=>[t+(e-t)*m,n+(r-n)*m]),f=o-c,p=u-c,h=r-o+c-u,g=s-l,_=d-l,v=i-s+l-d,y=f*_-p*g,b=(h*_-p*v)/y,x=(f*v-h*g)/y;return new a().set(o-r+b*o,u-r+x*u,r,s-i+b*s,d-i+x*d,i,b,x,1).invert()}function v(e,t){let n=1024,r=Math.round(n/t),i=document.createElement(`canvas`);i.width=n,i.height=r;let a=i.getContext(`2d`);a.fillStyle=`#000`,a.fillRect(0,0,n,r);let s=new Path2D;e.forEach(([e,t],i)=>i?s.lineTo(e*n,t*r):s.moveTo(e*n,t*r)),s.closePath(),a.globalCompositeOperation=`lighter`,a.filter=`blur(1.4px)`,a.fillStyle=`#f00`,a.fill(s),a.filter=`blur(23px)`,a.fillStyle=`#0f0`,a.fill(s);let c=new l(i);return c.minFilter=o,c.generateMipmaps=!1,c}async function y(a){let l=window.matchMedia(`(pointer: coarse)`).matches,m=Math.min(window.devicePixelRatio||1,l?1.5:2),y=new c({canvas:a.canvas,antialias:!1,alpha:!1});y.setPixelRatio(m);let b=new t,x=e=>(e.colorSpace=n,e.minFilter=o,e.generateMipmaps=!1,e),S=new i({vertexShader:h,fragmentShader:g,uniforms:{photo:{value:null},thumb:{value:null},mask:{value:null},toScreen:{value:_(a.corners)},uvScale:{value:[1,1]},uvOffset:{value:[0,0]},time:{value:0},noiseAmt:{value:+!!a.animate},roll:{value:0},hasThumb:{value:0}}}),C=new s(2,2),w=new r,T=new u(C,S);T.frustumCulled=!1,w.add(T);let E=new e(-1,1,1,-1,0,1),D=()=>y.render(w,E),O=new Map,k=e=>(O.has(e)||O.set(e,b.loadAsync(a.images[e]).then(x)),O.get(e)),A=e=>{let t=e.image,n=t.width/t.height,r=S.uniforms;if(n>p){let e=p/n;r.uvScale.value=[e,1],r.uvOffset.value=[(1-e)/2,0]}else{let e=n/p;r.uvScale.value=[1,e],r.uvOffset.value=[0,(1-e)/2]}r.thumb.value=e,r.hasThumb.value=1},j=()=>{let e=a.host.clientWidth,t=a.host.clientHeight;e&&t&&y.setSize(e,t,!1)};j();let M=new ResizeObserver(()=>{j(),D()});M.observe(a.host);let N=-1,P=null,F=!1,I=e=>{k((e+1)%a.images.length),k(e).then(e=>{a.animate?(P=e,F=!1,N=performance.now()):(A(e),D())})},L=performance.now(),R=e=>{let t=S.uniforms;if(t.time.value=(e-L)/1e3,N>=0){let n=Math.min(1,(e-N)/f);t.noiseAmt.value=Math.sin(n*Math.PI)*.95,t.roll.value=(1-n)*.35,n>=.5&&!F&&P&&(A(P),F=!0),n>=1&&(N=-1,t.noiseAmt.value=0,t.roll.value=0)}D()},z=1e3/d,B=0,V=0,H=!1,U=e=>{V=requestAnimationFrame(U),e-B<82.33333333333333||(B=e-(e-B)%z,R(e))},[W,G]=await Promise.all([b.loadAsync(a.photo).then(x),k(0)]);S.uniforms.photo.value=W;let K=W.image,q=v(a.outline,K.width/K.height);return S.uniforms.mask.value=q,a.animate?(R(performance.now()),P=G,F=!1,N=performance.now()):(A(G),D()),{show:I,setActive(e){a.animate&&e!==H&&(H=e,B=0,H?V=requestAnimationFrame(U):cancelAnimationFrame(V))},dispose(){cancelAnimationFrame(V),M.disconnect(),W.dispose(),q.dispose(),O.forEach(e=>e.then(e=>e.dispose())),S.dispose(),C.dispose(),y.dispose()}}}export{y as createTvPhoto};