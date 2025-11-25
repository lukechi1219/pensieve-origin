import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Notes from './pages/Notes';
import NoteDetail from './pages/NoteDetail';
import Journals from './pages/Journals';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="note/:id" element={<NoteDetail />} />
          <Route path="notes/:folder" element={<Notes />} />
          <Route path="journals" element={<Journals />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:name" element={<ProjectDetail />} />
          {/* More routes to be added */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
