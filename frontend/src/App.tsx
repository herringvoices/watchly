import { Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Feed } from './pages/Feed';
import { Login } from './pages/Login';
import { MediaDetails } from './pages/MediaDetails';
import { MediaSearch } from './pages/MediaSearch';
import { Register } from './pages/Register';
import { UserDetails } from './pages/UserDetails';
import { UserSearch } from './pages/UserSearch';

export function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes — wrapped in auth guard + shared layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Feed />} />
          <Route path="/search" element={<MediaSearch />} />
          <Route path="/users" element={<UserSearch />} />
          <Route path="/media/:tmdbId" element={<MediaDetails />} />
          <Route path="/users/:userId" element={<UserDetails />} />
        </Route>
      </Route>
    </Routes>
  );
}
