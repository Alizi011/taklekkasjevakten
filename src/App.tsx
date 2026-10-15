import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Forside from "./pages/Forside";
import OmTaklekkasjer from "./pages/OmTaklekkasjer";
import OmLekkasjesok from "./pages/OmLekkasjesok";
import VartArbeid from "./pages/VartArbeid";
import OmOss from "./pages/OmOss";
import Faq from "./pages/Faq";
import LocalAreaPage from "./pages/LocalAreaPage";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import BusinessCustomerDashboard from "./pages/BusinessCustomerDashboard";
import ProjectManagerPortal from "./pages/ProjectManagerPortal";
import { apiUrl } from "./lib/api";

const ADMIN_AUTH_URL = apiUrl("/tlv_admin_auth.php");

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const checkSession = async () => {
      try {
        const response = await fetch(`${ADMIN_AUTH_URL}?action=session`, {
          method: "GET",
          credentials: "include",
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data: { success?: boolean; authenticated?: boolean } = await response.json();
        if (!controller.signal.aborted) setIsAuthenticated(data.success === true && data.authenticated === true);
      } catch {
        // Ugyldig/utløpt sesjon betyr at innlogging kreves.
      } finally {
        if (!controller.signal.aborted) setCheckingSession(false);
      }
    };
    void checkSession();
    return () => controller.abort();
  }, []);

  const handleLogout = async () => {
    // Lukk adminvisningen umiddelbart, også ved nettverksfeil.
    setIsAuthenticated(false);
    try {
      await fetch(`${ADMIN_AUTH_URL}?action=logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ved nettverksfeil er lokal visning lukket, men servercookien kan fortsatt være gyldig.
      // Brukeren må logge ut på nytt når nettverket er tilgjengelig.
    }
  };

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Forside />} />
        <Route path="/om-taklekkasjer" element={<OmTaklekkasjer />} />
        <Route path="/om-lekkasjesok" element={<OmLekkasjesok />} />
        <Route path="/vart-arbeid" element={<VartArbeid />} />
        <Route path="/om-oss" element={<OmOss />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/min-side" element={<CustomerDashboard />} />
        <Route path="/kundeportal" element={<CustomerDashboard />} />
        <Route path="/bedriftsportal" element={<BusinessCustomerDashboard />} />
        <Route path="/taklekkasje-:areaSlug" element={<LocalAreaPage />} />
      </Route>
      <Route path="/prosjektportal" element={<ProjectManagerPortal />} />
      <Route path="/admin" element={
        checkingSession ? (
          <div className="min-h-screen bg-[#0b0f17] flex items-center justify-center text-slate-200">Kontrollerer innlogging...</div>
        ) : isAuthenticated ? (
          <AdminDashboard onLogout={() => { void handleLogout(); }} />
        ) : (
          <AdminLogin onLogin={() => setIsAuthenticated(true)} />
        )
      } />
    </Routes>
  );
}

export default App;
