// Renderizador do atleta: raymarching da distância do corpo num shader de tela cheia (WebGL2).
// Luz de estúdio (chave com sombra suave, preenchimento, dois contornos), oclusão de ambiente,
// chão com sombra de contato, materiais (pele de argila, luva de couro, cetim do calção) e destaque de músculos.
// Cada quadro soma N subquadros com deslocamento de pixel (antisserrilhado) e, se vierem poses
// diferentes por subquadro, desfoque de movimento.
import * as THREE from 'three';
import { NB, OSSOS, matrizesRepouso, matrizesMundo } from './esqueleto.js';
import { ZONAS } from './anatomia.js';
import { gerarGLSL, esferaSegmento } from './sdf.js';

// qualidade: 'alta' para vídeo e folhas; 'leve' para a página ao vivo (sombra e oclusão mais curtas)
export const QUALIDADES = {
  alta: { sombraPassos: 80, sombraMin: 0.003, sombraMax: 0.05, aoPassos: 5, aoPasso: 0.024, marchaPassos: 240, eps: 0.00012 },
  leve: { sombraPassos: 24, sombraMin: 0.014, sombraMax: 0.1, aoPassos: 3, aoPasso: 0.04, marchaPassos: 120, eps: 0.0004 },
};

const VERT = `#version 300 es
in vec2 pos; void main(){ gl_Position=vec4(pos,0.0,1.0); }`;

const PRIMS = `
float sdElip(vec3 p, vec3 r){ float k0=length(p/r); float k1=length(p/(r*r)); return k0*(k0-1.0)/max(k1,1e-6); }
float sdCone(vec3 p, vec3 a, vec3 b, float r1, float r2){
  vec3 ba=b-a; float l2=dot(ba,ba); float rr=r1-r2; float a2=l2-rr*rr; float il2=1.0/l2;
  vec3 pa=p-a; float y=dot(pa,ba); float z=y-l2;
  vec3 xp=pa*l2-ba*y; float x2=dot(xp,xp);
  float y2=y*y*l2; float z2=z*z*l2;
  float k=sign(rr)*rr*rr*x2;
  if(sign(z)*a2*z2>k) return sqrt(x2+z2)*il2-r2;
  if(sign(y)*a2*y2<k) return sqrt(x2+y2)*il2-r1;
  return (sqrt(x2*a2*il2)+y*rr)*il2-r1;
}
float sdCaixa(vec3 p, vec3 b, float r){ vec3 q=abs(p)-b+r; return length(max(q,0.0))+min(max(q.x,max(q.y,q.z)),0.0)-r; }
float sdTronco(vec3 p, vec3 a, vec3 b, float ra, float rb){
  float rba=rb-ra; float baba=dot(b-a,b-a); float papa=dot(p-a,p-a); float paba=dot(p-a,b-a)/baba;
  float x=sqrt(max(papa-paba*paba*baba,0.0));
  float cax=max(0.0,x-((paba<0.5)?ra:rb)); float cay=abs(paba-0.5)-0.5;
  float k=rba*rba+baba; float f=clamp((rba*(x-ra)+paba*baba)/k,0.0,1.0);
  float cbx=x-ra-f*rba; float cby=paba-f;
  float s=(cbx<0.0&&cay<0.0)?-1.0:1.0;
  return s*sqrt(min(cax*cax+cay*cay*baba,cbx*cbx+cby*cby*baba));
}
float sdCilE(vec3 p, vec2 r, float h, float rr){
  float m=min(r.x,r.y); float dxz=(length(p.xz/r)-1.0)*m; vec2 d=vec2(dxz+rr,abs(p.y)-h+rr);
  return min(max(d.x,d.y),0.0)+length(max(d,0.0))-rr;
}
float smin(float a, float b, float k){ if(k<=1e-5) return min(a,b); float h=max(k-abs(a-b),0.0)/k; return min(a,b)-h*h*k*0.25; }
float smax(float a, float b, float k){ return -smin(-a,-b,k); }
`;

function fragShader(cod, nseg, Q, nl) {
  return `#version 300 es
precision highp float;
precision highp int;
#define SOMBRA_PASSOS ${Q.sombraPassos}
#define SOMBRA_MIN ${Q.sombraMin.toFixed(4)}
#define SOMBRA_MAX ${Q.sombraMax.toFixed(4)}
#define AO_PASSOS ${Q.aoPassos}
#define AO_PASSO ${Q.aoPasso.toFixed(4)}
#define MARCHA_PASSOS ${Q.marchaPassos}
#define EPS ${Q.eps.toFixed(5)}
uniform vec2 uRes; uniform vec2 uJit;
uniform vec3 uCamPos; uniform mat3 uCamRot; uniform float uTan;
uniform mat4 uB[${NB * nl}]; uniform vec3 uJ[${NB * nl}]; uniform vec4 uS[${nseg * nl}]; uniform vec4 uG[${5 * nl}];
uniform vec4 uL[${nl}]; uniform int uN;
uniform vec3 uCxMin; uniform vec3 uCxMax;
uniform vec3 uLuzDir[4]; uniform vec3 uLuzCor[4]; uniform float uLuzSombra[4];
uniform float uMI[${ZONAS.length}]; uniform vec3 uMC[${ZONAS.length}];
uniform vec3 uCor[${5 * nl}];
uniform vec3 uFundoA; uniform vec3 uFundoB; uniform vec3 uChaoCor; uniform vec3 uChaoCentro; uniform float uChaoRaio; uniform float uChao;
uniform vec3 uAmbCeu; uniform vec3 uAmbChao; uniform float uDestaque; uniform int uDestL;
uniform sampler2D uInterno; uniform float uRX; uniform int uRXL; uniform vec4 uRXp;
out vec4 frag;
${PRIMS}
${cod}
float mapaD(vec3 p){ int m; return mapa(p,m); }
vec3 normal(vec3 p){
  vec3 n=vec3(0.0);
  for(int i=0;i<4;i++){
    vec3 e=0.5773*(2.0*vec3(float(((i+3)>>1)&1),float((i>>1)&1),float(i&1))-1.0);
    n+=e*mapaD(p+0.0006*e);
  }
  return normalize(n);
}
float oclusao(vec3 p, vec3 n){
  float occ=0.0, sca=1.0;
  for(int i=0;i<AO_PASSOS;i++){ float h=0.006+AO_PASSO*float(i); float d=mapaD(p+h*n); occ+=(h-d)*sca; sca*=0.78; }
  return clamp(1.0-2.4*occ,0.0,1.0);
}
float sombra(vec3 ro, vec3 rd, float tmax, float w){
  float res=1.0; float t=0.008;
  for(int i=0;i<SOMBRA_PASSOS;i++){
    float h=mapaD(ro+rd*t);
    res=min(res,h/(w*t));
    t+=clamp(h,SOMBRA_MIN,SOMBRA_MAX);
    if(res<-1.0||t>tmax) break;
  }
  res=max(res,-1.0);
  return 0.25*(1.0+res)*(1.0+res)*(2.0-res);
}
vec2 caixa(vec3 ro, vec3 rd){
  vec3 r=rd; r.x=abs(r.x)<1e-6?1e-6:r.x; r.y=abs(r.y)<1e-6?1e-6:r.y; r.z=abs(r.z)<1e-6?1e-6:r.z;
  vec3 inv=1.0/r; vec3 t0=(uCxMin-ro)*inv; vec3 t1=(uCxMax-ro)*inv;
  vec3 a=min(t0,t1), b=max(t0,t1);
  return vec2(max(max(max(a.x,a.y),a.z),0.0), min(min(b.x,b.y),b.z));
}
float marcha(vec3 ro, vec3 rd, float t0, float t1, out int mat){
  float t=t0; mat=-1;
  for(int i=0;i<MARCHA_PASSOS;i++){
    vec3 p=ro+rd*t; int m; float d=mapa(p,m);
    if(d<EPS+0.00018*t){ mat=m; return t; }
    t+=d*0.9;
    if(t>t1) break;
  }
  return -1.0;
}
vec3 ggx(vec3 n, vec3 v, vec3 l, float rough, vec3 F0){
  vec3 h=normalize(v+l); float nl=max(dot(n,l),0.0), nv=max(dot(n,v),1e-3), nh=max(dot(n,h),0.0), vh=max(dot(v,h),0.0);
  float a=rough*rough; float a2=a*a; float dd=nh*nh*(a2-1.0)+1.0; float D=a2/(3.14159*dd*dd);
  float k=(rough+1.0)*(rough+1.0)/8.0; float G=(nl/(nl*(1.0-k)+k))*(nv/(nv*(1.0-k)+k));
  vec3 F=F0+(1.0-F0)*pow(1.0-vh,5.0);
  return D*G*F/(4.0*nv);
}
vec3 fundo(vec3 rd){ float t=clamp(rd.y*0.6+0.45,0.0,1.0); return mix(uFundoB,uFundoA,t); }
vec3 sombrear(vec3 p, vec3 n, vec3 rd, int mat){
  vec3 v=-rd; vec3 base; float rough; float f0; float wrap; float cc=0.0; float brilho=0.0;
  int ml=mat-5*(mat/5); // material dentro do lutador (cada lutador tem as suas 5 cores)
  base=uCor[mat];
  if(ml==0){ rough=0.52; f0=0.03; wrap=0.32; }
  else if(ml==1){ rough=0.36; f0=0.045; wrap=0.12; cc=0.75; brilho=0.06; }
  else if(ml==2){ rough=0.5; f0=0.04; wrap=0.12; brilho=0.04; }
  else if(ml==3){ rough=0.3; f0=0.04; wrap=0.18; cc=0.35; brilho=0.06; }
  else { rough=0.42; f0=0.04; wrap=0.15; brilho=0.04; }
  if(ml==0 && uDestaque>0.5 && (uDestL<0 || mat/5==uDestL)){ vec4 mu=musculos(p,mat); base=mix(base,mu.rgb,mu.a*0.88); brilho+=mu.a*0.05; }
  float oc=oclusao(p,n);
  vec3 col=base*mix(uAmbChao,uAmbCeu,0.5+0.5*n.y)*oc;
  for(int i=0;i<4;i++){
    vec3 l=uLuzDir[i]; float nl=dot(n,l);
    float dif=clamp((nl+wrap)/(1.0+wrap),0.0,1.0);
    if(dif<=0.0) continue;
    float sh = mix(1.0,oc,0.6);
    if(uLuzSombra[i]>0.5){ vec2 tb=caixa(p,l); sh = sombra(p+n*0.003,l,max(tb.y,0.02),0.035); }
    vec3 spec=ggx(n,v,l,rough,vec3(f0))*max(nl,0.0);
    if(cc>0.0) spec+=cc*ggx(n,v,l,0.14,vec3(0.04))*max(nl,0.0);
    col+=uLuzCor[i]*(base*dif*(1.0-f0)+spec)*sh;
  }
  float fr=pow(1.0-max(dot(n,v),0.0),4.0);
  col+=fr*(mat==3?0.3:0.1)*mix(uAmbChao,uAmbCeu,0.7)*oc*(mat==0?vec3(1.0):base*2.0);
  col+=base*brilho;
  return col;
}
vec3 chao(vec3 p){
  float r=length(p.xz-uChaoCentro.xz);
  vec3 base=uChaoCor*(0.45+0.55*exp(-r*r/(uChaoRaio*uChaoRaio)));
  float oc=1.0;
  // oclusão de contato só perto da pegada do corpo
  vec2 dxz=max(max(uCxMin.xz-p.xz,p.xz-uCxMax.xz),0.0);
  if(length(dxz)<0.25){
    float occ=0.0, sca=1.0;
    for(int i=0;i<4;i++){ float h=0.015+0.05*float(i); float d=mapaD(p+vec3(0.0,h,0.0)); occ+=max(h-d,0.0)*sca; sca*=0.7; }
    oc=clamp(1.0-1.5*occ,0.0,1.0);
  }
  vec3 col=base*uAmbCeu*oc;
  for(int i=0;i<4;i++){
    vec3 l=uLuzDir[i]; float nl=max(l.y,0.0); if(nl<=0.0) continue;
    float sh=1.0;
    if(uLuzSombra[i]>0.5){
      vec2 tb=caixa(p,l);
      if(tb.x<tb.y) sh=sombra(p+vec3(0.0,0.002,0.0),l,tb.y,0.05);
    }
    col+=uLuzCor[i]*base*nl*sh*oc*(uLuzSombra[i]>0.5?1.0:0.35);
  }
  return col;
}
void main(){
  vec2 uv=(gl_FragCoord.xy+uJit-0.5*uRes)/(0.5*uRes.y);
  vec3 rd=normalize(uCamRot*vec3(uv*uTan,-1.0));
  vec3 ro=uCamPos;
  vec3 col=fundo(rd);
  float tChao=(uChao>0.5&&rd.y<-1e-4)?-ro.y/rd.y:1e9;
  vec2 tb=caixa(ro,rd);
  float t=-1.0; int mat=-1;
  if(tb.x<tb.y) t=marcha(ro,rd,tb.x,min(tb.y,tChao),mat);
  if(t>0.0){
    vec3 p=ro+rd*t; vec3 n=normal(p); col=sombrear(p,n,rd,mat);
    // raio X: a pele vira uma casca (mais opaca nas bordas) e a anatomia interna aparece por baixo
    if(uRX>0.5 && (mat-5*(mat/5))==0 && mat/5==uRXL){
      vec4 I=texelFetch(uInterno, ivec2(gl_FragCoord.xy), 0);
      vec3 atras=I.rgb*uRXp.w + (1.0-I.a)*fundo(rd)*0.35;
      float fr=pow(1.0-max(dot(n,-rd),0.0), 2.2);
      float A=clamp(uRXp.x + uRXp.y*fr, 0.0, 1.0);
      col=mix(atras, col, A);
    }
  }
  else if(tChao<1e8){
    vec3 p=ro+rd*tChao; vec3 c=chao(p);
    float r=length(p.xz-uChaoCentro.xz);
    col=mix(c,col,smoothstep(uChaoRaio*1.1,uChaoRaio*3.2,r));
  }
  frag=vec4(col,1.0);
}`;
}

// peças internas (ossos e órgãos): malha com pele de ossos (mistura linear de até 4 ossos), sombreado simples e luz de contorno
const VERT_INT = `#version 300 es
precision highp float;
in vec3 aPos; in vec3 aNor; in uvec4 aBone; in vec4 aW;
uniform mat4 uMW[${NB}]; uniform mat4 uExtra;
uniform vec3 uCamPos; uniform mat3 uCamRot; uniform float uTan; uniform vec2 uRes; uniform vec2 uJit;
out vec3 vN; out vec3 vP;
void main(){
  mat4 M = uMW[aBone.x]*aW.x + uMW[aBone.y]*aW.y + uMW[aBone.z]*aW.z + uMW[aBone.w]*aW.w;
  vec4 wp = M*(uExtra*vec4(aPos,1.0));
  vN = mat3(M)*(mat3(uExtra)*aNor); vP = wp.xyz;
  vec3 d = wp.xyz-uCamPos;
  vec3 c = vec3(dot(d,uCamRot[0]), dot(d,uCamRot[1]), dot(d,uCamRot[2]));
  float w = -c.z; float n = 0.05, f = 14.0;
  float asp = uRes.x/uRes.y;
  gl_Position = vec4(c.x/(uTan*asp) + 2.0*uJit.x/uRes.x*w, c.y/uTan + 2.0*uJit.y/uRes.y*w, (f+n)/(f-n)*w - 2.0*f*n/(f-n), w);
}`;
const FRAG_INT = `#version 300 es
precision highp float;
in vec3 vN; in vec3 vP; out vec4 frag;
uniform vec3 uCor; uniform float uAlfa; uniform vec3 uCamPos;
uniform vec3 uLuzDir[4]; uniform vec3 uLuzCor[4]; uniform vec3 uAmbCeu;
void main(){
  vec3 n=normalize(vN); vec3 v=normalize(uCamPos-vP);
  if(dot(n,v)<0.0) n=-n;
  vec3 col=uCor*(uAmbCeu*1.6+0.12);
  for(int i=0;i<4;i++){ float nl=max(dot(n,uLuzDir[i])*0.75+0.25,0.0); col+=uCor*uLuzCor[i]*nl*0.26; }
  float fr=pow(1.0-max(dot(n,v),0.0),2.4);
  col+=uCor*fr*0.4;
  frag=vec4(col*uAlfa, uAlfa);
}`;

const FINAL = `#version 300 es
precision highp float;
uniform sampler2D uAcc; uniform float uN; uniform float uExpo; uniform vec2 uRes; uniform float uVinheta; uniform float uAA;
out vec4 frag;
vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0); }
float hash(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
vec3 tom(ivec2 q){ q=clamp(q,ivec2(0),ivec2(uRes)-1); return aces(texelFetch(uAcc,q,0).rgb/uN*uExpo); }
float luma(vec3 c){ return dot(c,vec3(0.299,0.587,0.114)); }
void main(){
  vec2 uv=gl_FragCoord.xy/uRes;
  ivec2 q=ivec2(gl_FragCoord.xy);
  vec3 c=tom(q);
  // suavização de bordas barata (só com 1 amostra por quadro): mistura com os vizinhos onde o contraste é alto
  if(uAA>0.5){
    vec3 n=tom(q+ivec2(0,1)), s=tom(q-ivec2(0,1)), e=tom(q+ivec2(1,0)), w=tom(q-ivec2(1,0));
    float lc=luma(c), ln=luma(n), ls=luma(s), le=luma(e), lw=luma(w);
    float con=max(max(max(ln,ls),max(le,lw)),lc)-min(min(min(ln,ls),min(le,lw)),lc);
    c=mix(c,(n+s+e+w)*0.25,0.55*smoothstep(0.05,0.25,con));
  }
  vec2 d=uv-0.5; d.x*=uRes.x/uRes.y;
  c*=1.0-uVinheta*smoothstep(0.35,1.0,length(d)*1.25);
  c=pow(c,vec3(1.0/2.2));
  c+=(hash(gl_FragCoord.xy)-0.5)/255.0;
  frag=vec4(c,1.0);
}`;

function compilar(gl, tipo, src) {
  const s = gl.createShader(tipo);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s);
    throw new Error('shader: ' + log + '\n' + src.split('\n').slice(0, 40).join('\n'));
  }
  return s;
}
function programa(gl, vs, fs) {
  const p = gl.createProgram();
  gl.attachShader(p, compilar(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compilar(gl, gl.FRAGMENT_SHADER, fs));
  gl.bindAttribLocation(p, 0, 'pos');
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('link: ' + gl.getProgramInfoLog(p));
  return p;
}

// cores em sRGB (hex) -> linear
export const lin = (hex) => new THREE.Color(hex).toArray();

// os dois cantos do boxe: o mesmo corpo, só a luva e o calção mudam de cor
export const CANTOS = {
  vermelho: { nome: 'Canto vermelho', luva: '#d0141f', faixa: '#9a0e17', short: '#c4121b', cos: '#8c0c14' },
  azul: { nome: 'Canto azul', luva: '#1d4fd8', faixa: '#14379b', short: '#1b49c9', cos: '#12318a' },
};

export const ESTUDIO = {
  cores: { pele: '#a3a19e', ...CANTOS.vermelho },
  fundoA: '#2a2d33',
  fundoB: '#0c0d10',
  chao: '#34363b',
  ambCeu: [0.15, 0.155, 0.17],
  ambChao: [0.05, 0.05, 0.055],
  luzes: [
    { dir: [0.55, 0.78, 0.6], cor: [1.2, 1.18, 1.15], sombra: true },
    { dir: [-0.75, 0.3, 0.55], cor: [0.24, 0.25, 0.28], sombra: false },
    { dir: [0.7, 0.45, -0.75], cor: [0.75, 0.77, 0.82], sombra: false },
    { dir: [-0.7, 0.4, -0.8], cor: [0.6, 0.62, 0.68], sombra: false },
  ],
  exposicao: 1.0,
  vinheta: 0.35,
};

// lutadores: quantos corpos o shader sabe desenhar juntos (1 ou 2); cada desenho pode usar menos
export function criarRenderizador(canvas, anat, { qualidade = 'alta', lutadores: NL = 1 } = {}) {
  const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!gl) throw new Error('sem WebGL2');
  if (!gl.getExtension('EXT_color_buffer_float')) throw new Error('sem EXT_color_buffer_float');
  const { codigo, nseg, blocos } = gerarGLSL(anat, { lutadores: NL });
  const prog = programa(gl, VERT, fragShader(codigo, nseg, QUALIDADES[qualidade] || QUALIDADES.alta, NL));
  const progF = programa(gl, VERT, FINAL);
  const progI = (() => {
    const p = gl.createProgram();
    gl.attachShader(p, compilar(gl, gl.VERTEX_SHADER, VERT_INT));
    gl.attachShader(p, compilar(gl, gl.FRAGMENT_SHADER, FRAG_INT));
    gl.bindAttribLocation(p, 0, 'aPos');
    gl.bindAttribLocation(p, 1, 'aNor');
    gl.bindAttribLocation(p, 2, 'aBone');
    gl.bindAttribLocation(p, 3, 'aW');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('link interno: ' + gl.getProgramInfoLog(p));
    return p;
  })();
  const UI = {};
  for (const n of ['uMW', 'uExtra', 'uCamPos', 'uCamRot', 'uTan', 'uRes', 'uJit', 'uCor', 'uAlfa', 'uLuzDir', 'uLuzCor', 'uAmbCeu']) UI[n] = gl.getUniformLocation(progI, n);
  // textura vazia na unidade 1: sem raio X o sampler do shader aponta para ela (nunca para o alvo em que se desenha)
  const texVazia = gl.createTexture();
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, texVazia);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.activeTexture(gl.TEXTURE0);
  // anatomia interna carregada por carregarInterno(); fica nula até lá
  let interno = null;
  let fboI = null, texI = null, depI = null, tiw = 0, tih = 0;
  function alvoInterno(w, h) {
    if (w === tiw && h === tih) return;
    if (texI) gl.deleteTexture(texI);
    if (depI) gl.deleteRenderbuffer(depI);
    if (fboI) gl.deleteFramebuffer(fboI);
    texI = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texI);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    depI = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depI);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h);
    fboI = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fboI);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texI, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depI);
    tiw = w;
    tih = h;
  }
  // dados: ArrayBuffer do interno.bin e o manifesto (interno.json)
  function carregarInterno(buf, man) {
    const c = man.camadas;
    const vao2 = gl.createVertexArray();
    gl.bindVertexArray(vao2);
    const buffer = (alvo, dados) => { const b = gl.createBuffer(); gl.bindBuffer(alvo, b); gl.bufferData(alvo, dados, gl.STATIC_DRAW); return b; };
    const fatia = (k, T) => new T(buf, c[k][0], c[k][1] / T.BYTES_PER_ELEMENT);
    buffer(gl.ARRAY_BUFFER, fatia('pos', Float32Array));
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    buffer(gl.ARRAY_BUFFER, fatia('nor', Int8Array));
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.BYTE, true, 0, 0);
    buffer(gl.ARRAY_BUFFER, fatia('osso', Uint8Array));
    gl.enableVertexAttribArray(2); gl.vertexAttribIPointer(2, 4, gl.UNSIGNED_BYTE, 0, 0);
    buffer(gl.ARRAY_BUFFER, fatia('peso', Uint8Array));
    gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 4, gl.UNSIGNED_BYTE, true, 0, 0);
    buffer(gl.ELEMENT_ARRAY_BUFFER, fatia('idx', Uint32Array));
    gl.bindVertexArray(null);
    interno = { vao: vao2, partes: man.partes.map((p) => ({ ...p, rgb: lin(p.cor) })) };
  }
  const mw = new Float32Array(16 * NB);
  const IDENT = new THREE.Matrix4().elements.slice();
  // desenha as peças internas de um lutador no alvo 'fboI' (cor pré-multiplicada); opacas primeiro, depois as translúcidas
  function desenharInterno(E, cam, w, h, jx, jy, estudio, camadas) {
    gl.useProgram(progI);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fboI);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clearDepth(1);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.disable(gl.CULL_FACE);
    gl.depthMask(true);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.bindVertexArray(interno.vao);
    matrizesMundo(E, mw);
    gl.uniformMatrix4fv(UI.uMW, false, mw);
    gl.uniform3fv(UI.uCamPos, cam.pos);
    gl.uniformMatrix3fv(UI.uCamRot, false, cam.rot);
    gl.uniform1f(UI.uTan, cam.tan);
    gl.uniform2f(UI.uRes, w, h);
    gl.uniform2f(UI.uJit, jx, jy);
    const Lz = estudio.luzes;
    gl.uniform3fv(UI.uLuzDir, Lz.flatMap((l) => new THREE.Vector3(...l.dir).normalize().toArray()));
    gl.uniform3fv(UI.uLuzCor, Lz.flatMap((l) => l.cor));
    gl.uniform3fv(UI.uAmbCeu, estudio.ambCeu);
    for (const passe of [1, 0]) {
      if (passe === 0) { gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); } else gl.disable(gl.BLEND);
      for (const p of interno.partes) {
        const cfg = camadas === true ? {} : camadas && camadas[p.id];
        if (!cfg && camadas !== true) continue;
        const alfa = (cfg && cfg.alfa) ?? p.alfa;
        if ((alfa >= 0.999) !== (passe === 1)) continue;
        // extra: giro da peça dentro do osso a que está presa (o cérebro solto no crânio): { giroY (rad), pivo: [x, y, z] em repouso }
        const ex = cfg && cfg.giroY ? new THREE.Matrix4().makeTranslation(...cfg.pivo).multiply(new THREE.Matrix4().makeRotationY(cfg.giroY)).multiply(new THREE.Matrix4().makeTranslation(-cfg.pivo[0], -cfg.pivo[1], -cfg.pivo[2])).elements : IDENT;
        gl.uniformMatrix4fv(UI.uExtra, false, ex);
        gl.uniform3fv(UI.uCor, (cfg && cfg.cor ? lin(cfg.cor) : p.rgb));
        gl.uniform1f(UI.uAlfa, alfa);
        gl.drawElements(gl.TRIANGLES, p.ni, gl.UNSIGNED_INT, p.i0 * 4);
      }
    }
    gl.disable(gl.BLEND);
    gl.depthMask(true);
    gl.disable(gl.DEPTH_TEST);
    gl.bindVertexArray(null);
  }
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const vb = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vb);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const U = {};
  const n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) {
    const info = gl.getActiveUniform(prog, i);
    const nome = info.name.replace(/\[0\]$/, '');
    U[nome] = gl.getUniformLocation(prog, nome);
  }
  const esferas = anat.segmentos.map((s) => ({ osso: OSSOS.findIndex((o) => o.nome === s.osso), esf: esferaSegmento(s) }));

  let fbo = null;
  let tex = null;
  let tw = 0;
  let th = 0;
  function alvo(w, h) {
    if (w === tw && h === th) return;
    if (tex) gl.deleteTexture(tex);
    if (fbo) gl.deleteFramebuffer(fbo);
    tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, w, h, 0, gl.RGBA, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    tw = w;
    th = h;
  }

  // dados dos ossos para o shader, de cada lutador: matrizes, juntas, esferas posadas, blocos e a caixa de todos
  const NS = anat.segmentos.length;
  const mats = new Float32Array(16 * NB * NL);
  const juntas = new Float32Array(3 * NB * NL);
  const esf = new Float32Array(4 * NS * NL);
  const blo = new Float32Array(4 * blocos.length * NL);
  const lut = new Float32Array(4 * NL);
  const tmpMats = new Float32Array(16 * NB);
  function carregarPoses(Es) {
    const mnT = [1e9, 1e9, 1e9];
    const mxT = [-1e9, -1e9, -1e9];
    const c = new THREE.Vector3();
    Es.forEach((E, L) => {
      matrizesRepouso(E, tmpMats);
      mats.set(tmpMats, 16 * NB * L);
      for (let i = 0; i < NB; i++) juntas.set([E.P[i].x, E.P[i].y, E.P[i].z], 3 * (NB * L + i));
      const mn = [1e9, 1e9, 1e9];
      const mx = [-1e9, -1e9, -1e9];
      esferas.forEach(({ osso, esf: [ctr, r] }, i) => {
        c.copy(ctr).sub(OSSOS[osso].j).applyQuaternion(E.R[osso]).add(E.P[osso]);
        esf.set([c.x, c.y, c.z, r], 4 * (NS * L + i));
        for (let k = 0; k < 3; k++) {
          mn[k] = Math.min(mn[k], c.getComponent(k) - r);
          mx[k] = Math.max(mx[k], c.getComponent(k) + r);
        }
      });
      // esfera de cada bloco envolve as esferas das suas partes
      blocos.forEach((lista, g) => {
        const box = new THREE.Box3();
        for (const i of lista) {
          const o = 4 * (NS * L + i);
          const c3 = new THREE.Vector3(esf[o], esf[o + 1], esf[o + 2]);
          box.expandByPoint(c3.clone().addScalar(-esf[o + 3]));
          box.expandByPoint(c3.clone().addScalar(esf[o + 3]));
        }
        const ctr = box.getCenter(new THREE.Vector3());
        let r = 0;
        for (const i of lista) {
          const o = 4 * (NS * L + i);
          r = Math.max(r, ctr.distanceTo(new THREE.Vector3(esf[o], esf[o + 1], esf[o + 2])) + esf[o + 3]);
        }
        blo.set([ctr.x, ctr.y, ctr.z, r], 4 * (blocos.length * L + g));
      });
      // esfera do lutador inteiro
      const cl = new THREE.Vector3((mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2);
      lut.set([cl.x, cl.y, cl.z, Math.hypot(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]) / 2], 4 * L);
      for (let k = 0; k < 3; k++) {
        mnT[k] = Math.min(mnT[k], mn[k]);
        mxT[k] = Math.max(mxT[k], mx[k]);
      }
    });
    gl.uniform4fv(U.uG, blo);
    gl.uniformMatrix4fv(U.uB, false, mats);
    gl.uniform3fv(U.uJ, juntas);
    gl.uniform4fv(U.uS, esf);
    if (U.uL) gl.uniform4fv(U.uL, lut);
    if (U.uN) gl.uniform1i(U.uN, Es.length);
    gl.uniform3fv(U.uCxMin, mnT.map((v) => v - 0.01));
    gl.uniform3fv(U.uCxMax, mxT.map((v) => v + 0.01));
  }

  const halton = (i, b) => {
    let fr = 1;
    let r = 0;
    while (i > 0) {
      fr /= b;
      r += fr * (i % b);
      i = Math.floor(i / b);
    }
    return r;
  };

  // desenha um quadro. estados: lista de poses de um lutador (uma por subquadro, ou uma só repetida);
  // ou lutadores: [{ estados, cores }] para até NL corpos na mesma cena, cada um com as suas cores
  function desenhar({ estados, lutadores, camera, w, h, amostras = 8, estudio = ESTUDIO, musculos = null, chao = true, chaoCentro = [0, 0, 0], chaoRaio = 1.6, suavizar = false, destaqueLutador = -1, raioX = null }) {
    const lista = (lutadores || [{ estados }]).slice(0, NL);
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    alvo(w, h);
    const usaRX = !!(raioX && interno);
    if (usaRX) alvoInterno(w, h);
    gl.useProgram(prog);
    gl.bindVertexArray(vao);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    // câmera: lente em mm num sensor de altura dada (36 mm em pé, 24 mm deitado)
    const pos = new THREE.Vector3(...camera.pos);
    const alvoC = new THREE.Vector3(...camera.alvo);
    const fwd = alvoC.clone().sub(pos).normalize();
    const up0 = new THREE.Vector3(...(camera.up || [0, 1, 0]));
    const right = fwd.clone().cross(up0).normalize();
    const up = right.clone().cross(fwd).normalize();
    const back = fwd.clone().negate();
    const sensor = camera.sensor ?? (h > w ? 36 : 24);
    gl.uniform3fv(U.uCamPos, pos.toArray());
    gl.uniformMatrix3fv(U.uCamRot, false, [...right.toArray(), ...up.toArray(), ...back.toArray()]);
    gl.uniform1f(U.uTan, sensor / 2 / camera.mm);
    gl.uniform2f(U.uRes, w, h);
    const L = estudio.luzes;
    gl.uniform3fv(U.uLuzDir, L.flatMap((l) => new THREE.Vector3(...l.dir).normalize().toArray()));
    gl.uniform3fv(U.uLuzCor, L.flatMap((l) => l.cor));
    gl.uniform1fv(U.uLuzSombra, L.map((l) => (l.sombra ? 1 : 0)));
    gl.uniform3fv(U.uCor, Array.from({ length: NL }, (_, L) => {
      const cs = { ...estudio.cores, ...((lista[L] && lista[L].cores) || {}) };
      return [cs.pele, cs.luva, cs.faixa, cs.short, cs.cos].flatMap(lin);
    }).flat());
    gl.uniform3fv(U.uFundoA, lin(estudio.fundoA));
    gl.uniform3fv(U.uFundoB, lin(estudio.fundoB));
    gl.uniform3fv(U.uChaoCor, lin(estudio.chao));
    gl.uniform3fv(U.uChaoCentro, chaoCentro);
    gl.uniform1f(U.uChaoRaio, chaoRaio);
    gl.uniform1f(U.uChao, chao ? 1 : 0);
    gl.uniform3fv(U.uAmbCeu, estudio.ambCeu);
    gl.uniform3fv(U.uAmbChao, estudio.ambChao);
    const mi = new Float32Array(ZONAS.length);
    const mc = new Float32Array(3 * ZONAS.length);
    if (musculos) {
      for (const [id, { intensidade = 1, cor = '#ff3b1f' }] of Object.entries(musculos)) {
        const i = ZONAS.findIndex(([m]) => m === id);
        if (i < 0) continue;
        mi[i] = intensidade;
        mc.set(lin(cor), 3 * i);
      }
    }
    gl.uniform1fv(U.uMI, mi);
    gl.uniform3fv(U.uMC, mc);
    gl.uniform1f(U.uDestaque, musculos ? 1 : 0);
    gl.uniform1i(U.uDestL, destaqueLutador);
    gl.uniform1f(U.uRX, usaRX ? 1 : 0);
    gl.uniform1i(U.uInterno, 1);
    if (!usaRX) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, texVazia);
      gl.activeTexture(gl.TEXTURE0);
    }
    if (usaRX) {
      gl.uniform1i(U.uRXL, raioX.lutador ?? 0);
      // base e borda: quanto da pele aparece no meio do corpo e nas bordas; ganho: brilho do interior
      gl.uniform4f(U.uRXp, raioX.base ?? 0.1, raioX.borda ?? 0.75, 0, raioX.ganho ?? 1.2);
      gl.uniform1i(U.uInterno, 1);
    }
    const camI = { pos: pos.toArray(), rot: [...right.toArray(), ...up.toArray(), ...back.toArray()], tan: sensor / 2 / camera.mm };
    for (let s = 0; s < amostras; s++) {
      const jx = amostras > 1 ? halton(s + 1, 2) - 0.5 : 0;
      const jy = amostras > 1 ? halton(s + 1, 3) - 0.5 : 0;
      if (usaRX) {
        const li = lista[raioX.lutador ?? 0];
        const es = li.estados;
        desenharInterno(es[Math.min(es.length - 1, Math.floor((s / amostras) * es.length))], camI, w, h, jx, jy, estudio, raioX.camadas ?? true);
        // volta ao estado do passe principal
        gl.useProgram(prog);
        gl.bindVertexArray(vao);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.viewport(0, 0, w, h);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, texI);
        gl.activeTexture(gl.TEXTURE0);
      }
      carregarPoses(lista.map(({ estados: es }) => es[Math.min(es.length - 1, Math.floor((s / amostras) * es.length))]));
      gl.uniform2f(U.uJit, jx, jy);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    gl.disable(gl.BLEND);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(progF);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(gl.getUniformLocation(progF, 'uAcc'), 0);
    gl.uniform1f(gl.getUniformLocation(progF, 'uN'), amostras);
    gl.uniform1f(gl.getUniformLocation(progF, 'uExpo'), estudio.exposicao);
    gl.uniform1f(gl.getUniformLocation(progF, 'uVinheta'), estudio.vinheta);
    gl.uniform2f(gl.getUniformLocation(progF, 'uRes'), w, h);
    gl.uniform1f(gl.getUniformLocation(progF, 'uAA'), suavizar ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.finish();
  }

  return { gl, desenhar, canvas, carregarInterno, temInterno: () => !!interno };
}
