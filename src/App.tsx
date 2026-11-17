import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { Layout } from './components/Layout';
import { EDITORIAL_EASE } from './lib/motion';
import { SiteConfigProvider, useSiteConfig } from './lib/site-config';
import { HomePage } from './pages/HomePage';
import { SinglePhasePage } from './pages/SinglePhasePage';
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
import { DepotPage } from './pages/DepotPage';
import { NotFoundPage } from './pages/NotFoundPage';

function AppRoutes() {
  const { siteConfig } = useSiteConfig();
  const isSinglePage = siteConfig.mode === 'phase_single_page';

  if (isSinglePage) {
    return (
      <Routes>
        <Route path="/" element={<SinglePhasePage />} />
        <Route
          path="/depot"
          element={<SinglePhasePage initialAnchor="depot-production" />}
        />
        <Route
          path="/annonces"
          element={<SinglePhasePage initialAnchor="informations" />}
        />
        <Route
          path="/annonces/:slug"
          element={<SinglePhasePage initialAnchor="informations" />}
        />
        <Route
          path="/contact"
          element={<SinglePhasePage initialAnchor="informations" />}
        />
        <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
        <Route
          path="/politique-de-confidentialite"
          element={<PolitiqueConfidentialitePage />}
        />
        <Route path="/gestion" element={<GestionPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
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
      <Route path="/depot" element={<DepotPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user" transition={{ ease: EDITORIAL_EASE }}>
      <BrowserRouter>
        <SiteConfigProvider>
          <Layout>
            <AppRoutes />
          </Layout>
        </SiteConfigProvider>
      </BrowserRouter>
    </MotionConfig>
  );
}
