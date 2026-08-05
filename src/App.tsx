import { useState } from "react";
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

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  return (
    <Routes>
      {/* Offentlige sider pakket i Layout */}
      <Route element={<Layout />}>
        <Route path="/" element={<Forside />} />
        <Route path="/om-taklekkasjer" element={<OmTaklekkasjer />} />
        <Route path="/om-lekkasjesok" element={<OmLekkasjesok />} />
        <Route path="/vart-arbeid" element={<VartArbeid />} />
        <Route path="/om-oss" element={<OmOss />} />
        <Route path="/faq" element={<Faq />} />
        
        {/* Lokale SEO-landingssider */}
        <Route path="/taklekkasje-:areaSlug" element={<LocalAreaPage />} />
      </Route>

      {/* Beskyttet Admin Rute */}
      <Route
        path="/admin"
        element={
          isAuthenticated ? (
            <AdminDashboard onLogout={() => setIsAuthenticated(false)} />
          ) : (
            <AdminLogin onLogin={() => setIsAuthenticated(true)} />
          )
        }
      />
    </Routes>
  );
}

export default App;