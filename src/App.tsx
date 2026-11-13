import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ConcoursPage } from './pages/ConcoursPage';
import { ParcoursPage } from './pages/ParcoursPage';
import { AnnoncesPage } from './pages/AnnoncesPage';
import { ActualitesPage } from './pages/ActualitesPage';
import { InscriptionPage } from './pages/InscriptionPage';
import { ConfirmationInscriptionPage } from './pages/ConfirmationInscriptionPage';
import { FaqPage } from './pages/FaqPage';
import { ContactPage } from './pages/ContactPage';
import {
  MentionsLegalesPage,
  PolitiqueConfidentialitePage,
} from './pages/LegalPages';
import { GestionPage } from './pages/GestionPage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/concours" element={<ConcoursPage />} />
          <Route path="/parcours" element={<ParcoursPage />} />
          <Route path="/annonces" element={<AnnoncesPage />} />
          <Route path="/annonces/:slug" element={<AnnoncesPage />} />
          <Route path="/actualites" element={<ActualitesPage />} />
          <Route path="/actualites/:slug" element={<ActualitesPage />} />
          <Route path="/inscription" element={<InscriptionPage />} />
          <Route
            path="/confirmation-inscription"
            element={<ConfirmationInscriptionPage />}
          />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
          <Route
            path="/politique-de-confidentialite"
            element={<PolitiqueConfidentialitePage />}
          />
          <Route path="/gestion" element={<GestionPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
