import { Route, Routes } from 'react-router-dom';
import { AppShell } from './AppShell';
import { TodayPage } from '../pages/TodayPage';
import { BriefPage } from '../pages/BriefPage';
import { LearnPage } from '../pages/LearnPage';
import { LessonPage } from '../pages/LessonPage';
import { NewsDetailPage } from '../pages/NewsDetailPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<TodayPage />} />
        <Route path="brief" element={<BriefPage />} />
        <Route path="learn" element={<LearnPage />} />
        <Route path="learn/:id" element={<LessonPage />} />
        <Route path="news/:id" element={<NewsDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
