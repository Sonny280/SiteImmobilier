// ui.jsx — composants réutilisables ImmobilierCI
import { useState } from "react";
import { photoSrc } from "./utils.js";

export function Modal({open,onClose,title,children,wide,xl}){
  if(!open) return null;
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4" style={{background:"rgba(92,26,43,0.4)",backdropFilter:"blur(4px)"}} onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-2xl ${xl?"w-full max-w-5xl":wide?"w-full max-w-3xl":"w-full max-w-xl"} max-h-[94vh] overflow-y-auto`} onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-7 py-5 border-b sticky top-0 bg-white z-10 rounded-t-2xl" style={{borderColor:"var(--border)"}}>
          <h3 className="font-semibold text-base" style={{color:"var(--text)"}}>{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors text-lg">&#x2715;</button>
        </div>
        <div className="p-7">{children}</div>
      </div>
    </div>
  );
}

export function Inp({label,error,...p}){
  return (
    <div className="flex flex-col gap-1.5">
      {label&&<label className="text-xs font-700 uppercase tracking-wider" style={{color:"var(--gray)",fontWeight:700}}>{label}</label>}
      <input className="inp" {...p}/>
      {error&&<span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

export function Sel({label,children,...p}){
  return (
    <div className="flex flex-col gap-1.5">
      {label&&<label className="text-xs uppercase tracking-wider" style={{color:"var(--gray)",fontWeight:700}}>{label}</label>}
      <select className="inp" style={{cursor:"pointer"}} {...p}>{children}</select>
    </div>
  );
}

export function Txta({label,...p}){
  return (
    <div className="flex flex-col gap-1.5">
      {label&&<label className="text-xs uppercase tracking-wider" style={{color:"var(--gray)",fontWeight:700}}>{label}</label>}
      <textarea className="inp" style={{resize:"none"}} {...p}/>
    </div>
  );
}

// Galerie photos professionnelle avec miniatures
export function Gallery({photos,title}){
  const [cur,setCur] = useState(0);
  const imgs = (photos||[]).filter(p=>photoSrc(p));
  if(!imgs.length) return (
    <div className="flex items-center justify-center rounded-2xl" style={{height:"380px",background:"var(--grayL)",border:"1px solid var(--border)"}}>
      <div className="text-center">
        <div className="text-5xl mb-3" style={{color:"var(--border)"}}>&#9776;</div>
        <p style={{color:"var(--gray)",fontSize:"14px"}}>Aucune photo disponible</p>
      </div>
    </div>
  );
  return (
    <div>
      <div className="relative rounded-2xl overflow-hidden" style={{height:"420px"}}>
        <img src={photoSrc(imgs[cur])} alt={title||""} className="gallery-main" style={{height:"100%",borderRadius:"16px"}}/>
        {imgs.length>1&&<>
          <button onClick={()=>setCur(p=>Math.max(0,p-1))} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-lg font-bold hover:bg-gray-50 transition-all" style={{color:"var(--blue)",display:cur>0?"flex":"none"}}>&#8249;</button>
          <button onClick={()=>setCur(p=>Math.min(imgs.length-1,p+1))} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-lg font-bold hover:bg-gray-50 transition-all" style={{color:"var(--blue)",display:cur<imgs.length-1?"flex":"none"}}>&#8250;</button>
          <div className="absolute bottom-3 right-3 rounded-lg px-3 py-1 text-xs font-semibold text-white" style={{background:"rgba(0,0,0,0.55)"}}>{cur+1} / {imgs.length} photos</div>
        </>}
      </div>
      {imgs.length>1&&(
        <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar py-1">
          {imgs.map((ph,i)=>(
            <img key={i} src={photoSrc(ph)} alt={`${title||"Photo"} — vue ${i+1}`} onClick={()=>setCur(i)}
              className={`thumb${i===cur?" active":""}`}
              style={{minWidth:"96px"}}/>
          ))}
        </div>
      )}
    </div>
  );
}

// Upload zone photos
export function PhotoUpload({onUpload,uploading,count}){
  return (
    <div
      onClick={onUpload}
      className="rounded-xl p-8 text-center cursor-pointer transition-all border-2 border-dashed hover:border-blue-400"
      style={{borderColor:"var(--border)",background:"var(--off)"}}>
      {uploading
        ?<><p className="font-semibold mb-1" style={{color:"var(--blue)"}}>Chargement en cours...</p><p className="text-sm" style={{color:"var(--gray)"}}>Veuillez patienter</p></>
        :<><p className="font-semibold mb-1" style={{color:"var(--blue)"}}>Cliquer pour ajouter des photos</p><p className="text-sm" style={{color:"var(--gray)"}}>JPG, PNG, WebP · Max 8 Mo · Jusqu'à 10 photos<br/>Les photos sont affichées dans un carrousel professionnel</p></>
      }
    </div>
  );
}

export function Badge({label,cls,color,className}){
  // Support legacy tailwind color strings and new badge class strings
  const cl = cls||color||className||"";
  // If it looks like a badge-* class, use it directly; otherwise wrap in className
  const isBadgeCls = cl.startsWith("badge-") || cl==="";
  return <span className={isBadgeCls?`badge ${cl}`:cl}>{label}</span>;
}

export function Stars({n=5}){
  return <span className="stars">{"★".repeat(n)}{"☆".repeat(5-n)}</span>;
}

export function KpiCard({label,value,sub,icon,variant,accent,pos}){
  // Support both variant and accent props
  const v = variant||accent||"blue";
  const colors = {
    blue:   {bg:"var(--blueL)",  border:"var(--blueL2)", icon:"var(--blue2)"},
    gold:   {bg:"var(--goldL)",  border:"#e8d5a0",       icon:"var(--gold)"},
    amber:  {bg:"#fff7ed",       border:"#fed7aa",       icon:"#c2410c"},
    orange: {bg:"#fff7ed",       border:"#fed7aa",       icon:"#c2410c"},
    green:  {bg:"#dcfce7",       border:"#bbf7d0",       icon:"#15803d"},
    emerald:{bg:"#dcfce7",       border:"#bbf7d0",       icon:"#15803d"},
    red:    {bg:"#fef2f2",       border:"#fecaca",       icon:"#dc2626"},
    purple: {bg:"#f5f3ff",       border:"#e9d5ff",       icon:"#7c3aed"},
  };
  const c = colors[v]||colors.blue;
  return (
    <div className="rounded-2xl p-5" style={{background:c.bg,border:`1px solid ${c.border}`}}>
      {icon&&<div className="text-xl mb-2" style={{color:c.icon}}>{icon}</div>}
      <div className="stat-num" style={{color:c.icon,fontSize:"28px"}}>{value}</div>
      <div className="text-sm font-semibold mt-1" style={{color:"var(--text)"}}>{label}</div>
      {sub&&<div className="text-xs mt-0.5" style={{color:pos===false?"#dc2626":pos?"#15803d":"var(--gray)"}}>{sub}</div>}
    </div>
  );
}
