import { Navigate, Route, Routes } from 'react-router-dom';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import GamePage from './pages/GamePage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RankingsPage from './pages/RankingsPage';
import RegisterPage from './pages/RegisterPage';

const App = () => (
  <Routes>
    <Route element={<Layout />}>
      <Route index element={<HomePage />} />
      <Route path="games/:gameId/:mode" element={<GamePage />} />
      <Route path="login" element={<LoginPage />} />
      <Route path="register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="rankings" element={<RankingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>
);

export default App;
