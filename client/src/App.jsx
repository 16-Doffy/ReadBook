import { Routes, Route, Navigate } from 'react-router-dom';
import { Login, Register, AdminLogin } from './Auth';
import AdminPanel from './AdminPanel';
import ComicLibrary from './ComicLibrary';
import Profile from './Profile';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminPanel />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/" element={<ComicLibrary />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
