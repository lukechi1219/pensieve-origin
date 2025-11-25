import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { I18nProvider } from './i18n/I18nContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Notes from './pages/Notes';
import NoteDetail from './pages/NoteDetail';
import Journals from './pages/Journals';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Chats from './pages/Chats';
import ChatDetail from './pages/ChatDetail';

function App() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="note/:id" element={<NoteDetail />} />
            <Route path="notes/:folder" element={<Notes />} />
            <Route path="journals" element={<Journals />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:name" element={<ProjectDetail />} />
            <Route path="chats" element={<Chats />} />
            <Route path="chats/:id" element={<ChatDetail />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  );
}

export default App;
