import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../Utils/auth";

export default function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" />;
}
