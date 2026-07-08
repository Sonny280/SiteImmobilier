import { useState } from "react";
import { useCtx } from "../context.jsx";
import { Inp } from "../ui.jsx";
import { AG } from "../utils.js";

function LoginPage(){
  const {login,goTo} = useCtx();
  const [em,setEm] = useState("");
  const [pw,setPw] = useState("");
  const [err,setErr] = useState(""); const [ld,setLd] = useState(false);
  const go = async()=>{
    if(!em||!pw) { setErr("Email et mot de passe requis"); return; }
    setErr(""); setLd(true);
    try{ await login(em,pw); }
    catch(e){ setErr(e.message); }
    finally{ setLd(false); }
  };
  return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"24px",background:"var(--blue)"}}>
      <div style={{width:"100%",maxWidth:"400px"}}>
        <div style={{textAlign:"center",marginBottom:"32px"}}>
          <img src="/logo-icon.svg" alt="ImmobilierCI" style={{width:"60px",height:"60px",borderRadius:"16px",margin:"0 auto 16px",display:"block"}}/>
          <div style={{fontFamily:"Playfair Display,serif",fontSize:"22px",fontWeight:700,color:"white"}}>ImmobilierCI</div>
          <div style={{fontSize:"11px",fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:"rgba(255,255,255,0.5)",marginTop:"4px"}}>Administration</div>
        </div>
        <div style={{background:"white",borderRadius:"20px",padding:"32px",boxShadow:"0 32px 80px rgba(0,0,0,0.3)"}}>
          <h2 style={{fontSize:"18px",fontWeight:700,marginBottom:"24px"}}>Connexion</h2>
          <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
            <Inp label="Email" type="email" value={em} onChange={e=>setEm(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} autoFocus/>
            <Inp label="Mot de passe" type="password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()}/>
            {err&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:"8px",padding:"10px 14px",fontSize:"13px",color:"#dc2626"}}>{err}</div>}
            <button onClick={go} disabled={ld} className="btn btn-primary" style={{justifyContent:"center",opacity:ld?0.65:1}}>{ld?"Connexion...":"Se connecter"}</button>
          </div>
        </div>
        <div style={{textAlign:"center",marginTop:"16px"}}>
          <button onClick={()=>goTo("accueil")} style={{fontSize:"13px",color:"rgba(255,255,255,0.55)",fontWeight:600}}>&larr; Retour au site</button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
