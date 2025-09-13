import { Navigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { isAdmin, isLoading } = useAdmin();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAdmin) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}
