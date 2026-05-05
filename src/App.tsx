import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import PaymentPage from "./pages/PaymentPage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/pagamento/:token" element={<PaymentPage />} />
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
