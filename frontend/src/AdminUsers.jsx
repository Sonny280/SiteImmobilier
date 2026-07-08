// AdminUsers.jsx — Gestion des comptes (superadmin) + mon profil (tout rôle)
import { useState, useEffect } from "react";
import { useCtx } from "./context.jsx";
import { API } from "./utils.js";
import { Modal, Inp, Sel } from "./ui.jsx";

const ROLES = [
  { v:"superadmin", l:"Super-administrateur", desc:"Accès complet + gestion des utilisateurs" },
  { v:"admin",      l:"Administrateur",        desc:"Accès complet à tous les modules" },
  { v:"commercial", l:"Commercial",             desc:"Biens, clients, demandes, visites" },
  { v:"comptable",  l:"Comptable",              desc:"Loyers, ventes, contrats" },
  { v:"lecture",    l:"Lecture seule",           desc:"Consultation uniquement" },
];

const ROLE_COLORS = {
  superadmin:{ bg:"#f5f3ff", c:"#7c3aed" },
  admin:     { bg:"var(--blueL)", c:"var(--blue2)" },
  commercial:{ bg:"#dcfce7", c:"#15803d" },
  comptable: { bg:"#fff7ed", c:"#c2410c" },
  lecture:   { bg:"var(--grayL)", c:"var(--gray)" },
};

// Règle affichée à l'utilisateur — doit rester cohérente avec backend/routes/users.js
function validatePasswordClient(pwd) {
  if (!pwd || pwd.length < 8) return "Au moins 8 caractères requis.";
  if (!/[A-Z]/.test(pwd)) return "Au moins une majuscule requise.";
  if (!/[0-9]/.test(pwd)) return "Au moins un chiffre requis.";
  return null;
}

function PasswordStrengthHint({ pwd }) {
  if (!pwd) return null;
  const checks = [
    { ok: pwd.length >= 8, label: "8 caractères minimum" },
    { ok: /[A-Z]/.test(pwd), label: "Une majuscule" },
    { ok: /[0-9]/.test(pwd), label: "Un chiffre" },
  ];
  return (
    <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", marginTop:"6px" }}>
      {checks.map(c => (
        <span key={c.label} style={{ fontSize:"11px", fontWeight:600, color: c.ok ? "#15803d" : "var(--gray)" }}>
          {c.ok ? "✓" : "○"} {c.label}
        </span>
      ))}
    </div>
  );
}

// ── Mon profil — accessible à TOUT utilisateur connecté ───────────
export function AdminMonProfil() {
  const {user: me, showToast } = useCtx();
  const [ancien, setAncien] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [confirme, setConfirme] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const change = async () => {
    setErr("");
    if (!ancien || !nouveau) return setErr("Renseignez votre mot de passe actuel et le nouveau.");
    if (nouveau !== confirme) return setErr("Les deux nouveaux mots de passe ne correspondent pas.");
    const pwdErr = validatePasswordClient(nouveau);
    if (pwdErr) return setErr(pwdErr);
    setSaving(true);
    try {
      const r = await fetch(`${API}/users/me/password`, {
        method: "PUT",
        headers:{"Content-Type":"application/json"}, credentials:"include",
        body: JSON.stringify({ ancien, nouveau }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Erreur");
      showToast("Mot de passe modifié");
      setAncien(""); setNouveau(""); setConfirme("");
    } catch(e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const col = ROLE_COLORS[me?.role] || ROLE_COLORS.lecture;

  return (
    <div style={{ maxWidth:"560px" }}>
      <div style={{ background:"white", border:"1px solid var(--border)", borderRadius:"16px", padding:"24px", marginBottom:"20px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"14px", marginBottom:"4px" }}>
          <div style={{ width:"48px", height:"48px", borderRadius:"50%", background:col.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Playfair Display,serif", fontSize:"17px", fontWeight:700, color:col.c, flexShrink:0 }}>
            {(me?.nom||"··").slice(0,2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight:700, fontSize:"16px" }}>{me?.nom}</div>
            <div style={{ fontSize:"13px", color:"var(--gray)" }}>{me?.email}</div>
          </div>
          <span style={{ marginLeft:"auto", fontSize:"11px", fontWeight:700, padding:"4px 12px", borderRadius:"100px", background:col.bg, color:col.c }}>
            {ROLES.find(r=>r.v===me?.role)?.l || me?.role}
          </span>
        </div>
      </div>

      <div style={{ background:"white", border:"1px solid var(--border)", borderRadius:"16px", padding:"24px" }}>
        <h3 style={{ fontFamily:"Playfair Display,serif", fontSize:"17px", fontWeight:700, marginBottom:"4px" }}>Changer mon mot de passe</h3>
        <p style={{ fontSize:"12px", color:"var(--gray)", marginBottom:"18px" }}>Vous devez connaître votre mot de passe actuel pour le modifier.</p>
        <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
          <Inp label="Mot de passe actuel *" type="password" value={ancien} onChange={e=>setAncien(e.target.value)} />
          <div>
            <Inp label="Nouveau mot de passe *" type="password" value={nouveau} onChange={e=>setNouveau(e.target.value)} />
            <PasswordStrengthHint pwd={nouveau} />
          </div>
          <Inp label="Confirmer le nouveau mot de passe *" type="password" value={confirme} onChange={e=>setConfirme(e.target.value)} />
          {err && <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:"8px", padding:"10px 14px", fontSize:"13px", color:"#dc2626" }}>{err}</div>}
          <button onClick={change} disabled={saving}
            style={{ alignSelf:"flex-start", padding:"10px 22px", border:"none", borderRadius:"8px", cursor:"pointer", fontSize:"13px", fontWeight:700, background:"var(--blue)", color:"white", fontFamily:"Plus Jakarta Sans,sans-serif", opacity:saving?0.6:1 }}>
            {saving ? "Enregistrement..." : "Mettre à jour le mot de passe"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Gestion des comptes — superadmin uniquement ───────────────────
export function AdminUsers() {
  const {user: me, showToast } = useCtx();
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);   // null | "new" | user (édition infos)
  const [pwdModal,setPwdModal]= useState(null);    // user dont on réinitialise le mot de passe
  const [newPwd,  setNewPwd]  = useState("");
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState("");
  const empty = { nom:"", email:"", password:"", role:"admin" };
  const [form, setForm] = useState(empty);
  const sf = (k,v) => setForm(p=>({...p,[k]:v}));
  const isSuperAdmin = me?.role === "superadmin";
  // userReady : true une fois que context.jsx a fini de charger le profil
  // via /api/auth/me. Sans ce garde, isSuperAdmin vaut false au premier
  // rendu (user=null) et le contenu ne s'affiche jamais.
  const userReady = me !== null && me !== undefined;

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/users`, { credentials:"include" });
      if (!r.ok) { setLoading(false); return; }
      const data = await r.json();
      setUsers(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  };

  useEffect(()=>{
    if(!userReady) return;
    if(isSuperAdmin) load();
    else setLoading(false);
  },[userReady, isSuperAdmin]);

  const save = async () => {
    setErr("");
    if(!form.nom||!form.email) return setErr("Nom et email requis");
    const isNew = modal==="new";
    if(isNew) {
      const pwdErr = validatePasswordClient(form.password);
      if (pwdErr) return setErr(pwdErr);
    }
    setSaving(true);
    try {
      const body = isNew ? form : { nom: form.nom, email: form.email, role: form.role };
      const res = await fetch(isNew?`${API}/users`:`${API}/users/${modal.id}`, {
        method: isNew?"POST":"PUT",
        headers:{"Content-Type":"application/json"}, credentials:"include",
        body: JSON.stringify(body),
      });
      const saved = await res.json();
      if(!res.ok) throw new Error(saved.error||"Erreur");
      setUsers(p => isNew?[saved,...p]:p.map(x=>x.id===saved.id?saved:x));
      setModal(null);
      showToast(isNew ? "Utilisateur créé" : "Utilisateur modifié");
    } catch(e){ setErr(e.message); }
    finally{ setSaving(false); }
  };

  const resetPassword = async () => {
    setErr("");
    const pwdErr = validatePasswordClient(newPwd);
    if (pwdErr) return setErr(pwdErr);
    setSaving(true);
    try {
      const res = await fetch(`${API}/users/${pwdModal.id}/password`, {
        method: "PUT",
        headers:{"Content-Type":"application/json"}, credentials:"include",
        body: JSON.stringify({ password: newPwd }),
      });
      const d = await res.json();
      if(!res.ok) throw new Error(d.error||"Erreur");
      showToast(`Mot de passe de ${pwdModal.nom} réinitialisé`);
      setPwdModal(null); setNewPwd("");
    } catch(e){ setErr(e.message); }
    finally{ setSaving(false); }
  };

  const del = async (u) => {
    if(!confirm(`Supprimer définitivement le compte de ${u.nom} ?\nCette action est irréversible.`)) return;
    const r = await fetch(`${API}/users/${u.id}`,{method:"DELETE",credentials:"include"});
    const d = await r.json().catch(()=>({}));
    if(!r.ok){ showToast(d.error || "Erreur", "warn"); return; }
    setUsers(p=>p.filter(x=>x.id!==u.id));
    showToast("Compte supprimé","warn");
  };

  // Pendant que context.jsx charge le profil via /api/auth/me,
  // user est null — on attend plutôt que d'afficher "Accès restreint" à tort.
  if(!userReady) return (
    <div style={{textAlign:"center",padding:"80px 20px",color:"var(--gray)"}}>
      <div style={{fontSize:"32px",marginBottom:"12px"}}>⏳</div>
      <p style={{fontSize:"14px"}}>Chargement du profil...</p>
    </div>
  );

  if(!isSuperAdmin) return (
    <div style={{textAlign:"center",padding:"60px 20px"}}>
      <div style={{fontSize:"48px",marginBottom:"16px"}}>🔒</div>
      <h2 style={{fontFamily:"Playfair Display,serif",fontSize:"22px",fontWeight:700,marginBottom:"10px"}}>Accès restreint</h2>
      <p style={{color:"var(--gray)",fontSize:"14px"}}>La gestion des utilisateurs est réservée au super-administrateur.</p>
    </div>
  );

  return (
    <div>
      <div style={{background:"var(--blueL)",border:"1px solid var(--blueL2)",borderRadius:"12px",padding:"14px 18px",marginBottom:"20px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"12px",flexWrap:"wrap"}}>
        <div>
          <div style={{fontWeight:700,fontSize:"14px",color:"var(--blue)"}}>Gestion des accès — Super-administrateur</div>
          <div style={{fontSize:"12px",color:"var(--gray)",marginTop:"3px"}}>Créez des comptes avec des permissions limitées pour votre équipe.</div>
        </div>
        <button onClick={()=>{setForm(empty);setErr("");setModal("new");}} style={{padding:"9px 20px",background:"var(--blue)",color:"white",border:"none",borderRadius:"8px",cursor:"pointer",fontWeight:700,fontSize:"13px",fontFamily:"Plus Jakarta Sans,sans-serif"}}>
          + Ajouter un utilisateur
        </button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:"8px",marginBottom:"20px"}}>
        {ROLES.map(r=>{
          const col=ROLE_COLORS[r.v]; const count=users.filter(u=>u.role===r.v).length;
          return <div key={r.v} style={{background:col.bg,borderRadius:"10px",padding:"12px 14px"}}>
            <div style={{fontSize:"11px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:col.c,marginBottom:"4px"}}>{r.l}</div>
            <div style={{fontSize:"22px",fontWeight:700,color:col.c,fontFamily:"Playfair Display,serif"}}>{count}</div>
            <div style={{fontSize:"10px",color:col.c,opacity:0.75,marginTop:"2px"}}>{r.desc}</div>
          </div>;
        })}
      </div>

      {loading?<div style={{textAlign:"center",padding:"40px",color:"var(--gray)"}}>Chargement...</div>
      :users.length===0?<div style={{textAlign:"center",padding:"60px",background:"var(--off)",borderRadius:"16px"}}>Aucun utilisateur</div>
      :<div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
        {users.map(u=>{
          const col=ROLE_COLORS[u.role]||ROLE_COLORS.lecture;
          const isMe=u.id===me?.id;
          return <div key={u.id} style={{background:"white",border:"1px solid var(--border)",borderRadius:"14px",padding:"14px 18px",display:"flex",alignItems:"center",gap:"14px",flexWrap:"wrap"}}>
            <div style={{width:"42px",height:"42px",borderRadius:"50%",background:col.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Playfair Display,serif",fontSize:"15px",fontWeight:700,color:col.c,flexShrink:0}}>
              {u.nom.slice(0,2).toUpperCase()}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap",marginBottom:"3px"}}>
                <span style={{fontWeight:700,fontSize:"14px"}}>{u.nom}</span>
                {isMe&&<span style={{fontSize:"10px",fontWeight:700,padding:"2px 7px",borderRadius:"10px",background:"var(--goldL)",color:"#7a5c00"}}>Vous</span>}
                <span style={{fontSize:"11px",fontWeight:700,padding:"3px 10px",borderRadius:"100px",background:col.bg,color:col.c}}>{ROLES.find(r=>r.v===u.role)?.l||u.role}</span>
              </div>
              <div style={{fontSize:"12px",color:"var(--gray)"}}>{u.email}</div>
              <div style={{fontSize:"11px",color:"var(--gray)",marginTop:"2px"}}>Créé le {new Date(u.createdAt).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})}</div>
            </div>
            <div style={{display:"flex",gap:"6px",flexShrink:0,flexWrap:"wrap"}}>
              <button onClick={()=>{setForm({...u,password:""});setErr("");setModal(u);}} style={{padding:"6px 14px",border:"1px solid var(--border)",borderRadius:"7px",cursor:"pointer",fontSize:"12px",fontWeight:700,background:"white",fontFamily:"Plus Jakarta Sans,sans-serif"}}>Modifier</button>
              <button onClick={()=>{setPwdModal(u);setNewPwd("");setErr("");}} style={{padding:"6px 14px",border:"1px solid var(--border)",borderRadius:"7px",cursor:"pointer",fontSize:"12px",fontWeight:700,background:"white",color:"var(--blue2)",fontFamily:"Plus Jakarta Sans,sans-serif"}}>🔑 Mot de passe</button>
              {!isMe&&<button onClick={()=>del(u)} style={{padding:"6px 14px",border:"1px solid #fecaca",borderRadius:"7px",cursor:"pointer",fontSize:"12px",fontWeight:700,color:"#dc2626",background:"#fef2f2",fontFamily:"Plus Jakarta Sans,sans-serif"}}>Supprimer</button>}
            </div>
          </div>;
        })}
      </div>}

      {/* Modal création / modification infos (PAS le mot de passe) */}
      {modal&&<Modal open title={modal==="new"?"Nouvel utilisateur":"Modifier l'utilisateur"} onClose={()=>setModal(null)} wide>
        <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
            <Inp label="Nom complet *" value={form.nom} onChange={e=>sf("nom",e.target.value)} placeholder="Kouassi Atse Charles"/>
            <Inp label="Email *" type="email" value={form.email} onChange={e=>sf("email",e.target.value)}/>
          </div>
          <div>
            <label style={{display:"block",fontSize:"12px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"var(--gray)",marginBottom:"10px"}}>Rôle et permissions</label>
            <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
              {ROLES.map(r=>{
                const col=ROLE_COLORS[r.v]; const active=form.role===r.v;
                return <div key={r.v} onClick={()=>sf("role",r.v)} style={{padding:"12px 16px",border:`1.5px solid ${active?col.c:"var(--border)"}`,borderRadius:"10px",cursor:"pointer",background:active?col.bg:"white",display:"flex",alignItems:"center",gap:"12px"}}>
                  <div style={{width:"16px",height:"16px",borderRadius:"50%",border:`2px solid ${active?col.c:"var(--border)"}`,background:active?col.c:"white",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {active&&<div style={{width:"6px",height:"6px",borderRadius:"50%",background:"white"}}/>}
                  </div>
                  <div>
                    <div style={{fontWeight:700,fontSize:"13px",color:active?col.c:"var(--text)"}}>{r.l}</div>
                    <div style={{fontSize:"11px",color:"var(--gray)",marginTop:"2px"}}>{r.desc}</div>
                  </div>
                </div>;
              })}
            </div>
          </div>
          {modal==="new" && (
            <div>
              <Inp label="Mot de passe initial *" type="password" value={form.password} onChange={e=>sf("password",e.target.value)} placeholder="Min. 8 caractères, 1 majuscule, 1 chiffre"/>
              <PasswordStrengthHint pwd={form.password} />
            </div>
          )}
          {modal!=="new" && (
            <div style={{ background:"var(--off)", borderRadius:"8px", padding:"10px 14px", fontSize:"12px", color:"var(--gray)" }}>
              Pour changer le mot de passe de ce compte, utilisez le bouton "🔑 Mot de passe" depuis la liste.
            </div>
          )}
          {err&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:"8px",padding:"10px 14px",fontSize:"13px",color:"#dc2626"}}>{err}</div>}
          <div style={{display:"flex",gap:"10px",justifyContent:"flex-end",borderTop:"1px solid var(--border)",paddingTop:"14px"}}>
            <button onClick={()=>setModal(null)} style={{padding:"10px 20px",border:"1px solid var(--border)",borderRadius:"8px",cursor:"pointer",fontSize:"13px",fontFamily:"Plus Jakarta Sans,sans-serif"}}>Annuler</button>
            <button onClick={save} disabled={saving} style={{padding:"10px 20px",border:"none",borderRadius:"8px",cursor:"pointer",fontSize:"13px",fontWeight:700,background:"var(--blue)",color:"white",fontFamily:"Plus Jakarta Sans,sans-serif",opacity:saving?0.6:1}}>
              {saving?"Enregistrement...":modal==="new"?"Créer":"Enregistrer"}
            </button>
          </div>
        </div>
      </Modal>}

      {/* Modal réinitialisation mot de passe */}
      {pwdModal&&<Modal open title={`Réinitialiser le mot de passe — ${pwdModal.nom}`} onClose={()=>setPwdModal(null)}>
        <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
          <div style={{ background:"#fffbeb", border:"1px solid #fde68a", borderRadius:"8px", padding:"10px 14px", fontSize:"12px", color:"#92400e" }}>
            Le compte devra utiliser ce nouveau mot de passe à sa prochaine connexion.
          </div>
          <div>
            <Inp label="Nouveau mot de passe *" type="password" value={newPwd} onChange={e=>setNewPwd(e.target.value)} placeholder="Min. 8 caractères, 1 majuscule, 1 chiffre"/>
            <PasswordStrengthHint pwd={newPwd} />
          </div>
          {err&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:"8px",padding:"10px 14px",fontSize:"13px",color:"#dc2626"}}>{err}</div>}
          <div style={{display:"flex",gap:"10px",justifyContent:"flex-end",borderTop:"1px solid var(--border)",paddingTop:"14px"}}>
            <button onClick={()=>setPwdModal(null)} style={{padding:"10px 20px",border:"1px solid var(--border)",borderRadius:"8px",cursor:"pointer",fontSize:"13px",fontFamily:"Plus Jakarta Sans,sans-serif"}}>Annuler</button>
            <button onClick={resetPassword} disabled={saving} style={{padding:"10px 20px",border:"none",borderRadius:"8px",cursor:"pointer",fontSize:"13px",fontWeight:700,background:"var(--blue)",color:"white",fontFamily:"Plus Jakarta Sans,sans-serif",opacity:saving?0.6:1}}>
              {saving?"Enregistrement...":"Réinitialiser"}
            </button>
          </div>
        </div>
      </Modal>}
    </div>
  );
}
