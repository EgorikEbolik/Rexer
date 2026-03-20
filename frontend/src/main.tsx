import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";



import './index.css'
import App from './App.tsx'
import SettingsPage from './pages/SettingsPage.tsx';
import ClipsPage from './pages/ClipsPage.tsx';

const root = document.getElementById("root")!;

ReactDOM.createRoot(root).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />}>
        <Route path="clips" element={<ClipsPage />} />
        <Route path="settings" element={<SettingsPage />} />

      </Route>
    </Routes>
  </BrowserRouter>
)
