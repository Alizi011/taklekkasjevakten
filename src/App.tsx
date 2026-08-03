import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Forside from "./pages/Forside";
import OmTaklekkasjer from "./pages/OmTaklekkasjer";
import OmLekkasjesok from "./pages/OmLekkasjesok";
import VartArbeid from "./pages/VartArbeid";
import OmOss from "./pages/OmOss";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Forside />} />
        <Route path="/om-taklekkasjer" element={<OmTaklekkasjer />} />
        <Route path="/om-lekkasjesok" element={<OmLekkasjesok />} />
        <Route path="/vart-arbeid" element={<VartArbeid />} />
        <Route path="/om-oss" element={<OmOss />} />
      </Route>
    </Routes>
  );
}

export default App;
