import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ToastProvider from './components/ToastProvider.jsx';
import HomePage from './pages/HomePage.jsx';
import ExercisePage from './pages/ExercisePage.jsx';
import FeedbackPage from './pages/FeedbackPage.jsx';
import RecordsPage from './pages/RecordsPage.jsx';
import RecordDetailPage from './pages/RecordDetailPage.jsx';
import ProductModePage from './pages/ProductModePage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/exercise" element={<ExercisePage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/records" element={<RecordsPage />} />
          <Route path="/records/:id" element={<RecordDetailPage />} />
          <Route path="/product" element={<ProductModePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ToastProvider>
  );
}
