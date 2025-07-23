import { HashRouter, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import Scanner from './components/Scanner';
import Logs from './components/Logs';
import PrivateRoute from './components/PrivateRoute';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Signup />} />
        <Route path="/dashboard" element={
        <PrivateRoute><Dashboard /></PrivateRoute>
      } />
         <Route path="/scanner" element={
        <PrivateRoute><Scanner /></PrivateRoute>
      } />
      <Route path="/logs" element={
        <PrivateRoute><Logs /></PrivateRoute>
      } />
      </Routes>
    </HashRouter>
  );
}
