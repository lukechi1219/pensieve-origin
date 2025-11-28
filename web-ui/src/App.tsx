import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { I18nProvider } from './i18n/I18nContext';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { Loader2 } from 'lucide-react';

// Lazy load pages for performance optimization
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Notes = lazy(() => import('./pages/Notes'));
const NoteDetail = lazy(() => import('./pages/NoteDetail'));
const Journals = lazy(() => import('./pages/Journals'));
const JournalDetail = lazy(() => import('./pages/JournalDetail'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const Chats = lazy(() => import('./pages/Chats'));
const ChatDetail = lazy(() => import('./pages/ChatDetail'));

const PageLoader = () => (
  <div className="flex items-center justify-center h-screen w-full">
    <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#363636',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
                duration: 5000,
              },
              loading: {
                iconTheme: {
                  primary: '#3b82f6',
                  secondary: '#fff',
                },
              },
            }}
          />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="note/:id" element={<NoteDetail />} />
                <Route path="notes/:folder" element={<Notes />} />
                <Route path="journals" element={<Journals />} />
                <Route path="journal/:id" element={<JournalDetail />} />
                <Route path="projects" element={<Projects />} />
                <Route path="projects/:name" element={<ProjectDetail />} />
                <Route path="chats" element={<Chats />} />
                <Route path="chats/:id" element={<ChatDetail />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </I18nProvider>
    </ErrorBoundary>
  );
}

export default App;
