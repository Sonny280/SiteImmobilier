import { useCtx } from "../context.jsx";
import { useSeo } from "../seo.js";
import { AG } from "../utils.js";
import Calculatrice from "../Calculatrice.jsx";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
function PageCalculatrice({biens,setPage}){
  useSeo("calculatrice");
  const nav = p => { setPage(p); };
  return(
    <>
      <Navbar page="services" setPage={nav}/>
      <div style={{paddingTop:"88px",background:"var(--off)",minHeight:"100vh"}}>
        <div className="container" style={{padding:"clamp(32px,6vw,64px) clamp(16px,4vw,28px)"}}>
          <div data-anim="fadeUp" style={{marginBottom:"clamp(16px,3vw,28px)"}}>
            <div className="pill">Outil gratuit</div>
            <h1 style={{fontSize:"clamp(24px,5vw,36px)",fontWeight:700,marginBottom:"8px"}}>Calculatrice immobilière</h1>
            <p style={{fontSize:"15px",color:"var(--gray)"}}>Estimez votre budget locatif, simulez un crédit ou calculez votre rendement locatif.</p>
          </div>
          <Calculatrice biens={biens} onClose={()=>nav("services")}/>
        </div>
      </div>
      <Footer setPage={nav}/>
    </>
  );
}

// ── ROOT ────────────────────────────────────────────────────────

export default PageCalculatrice;
