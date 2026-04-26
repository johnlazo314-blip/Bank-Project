import { type FC, type ReactElement } from "react";
import { useAuthContext } from "@asgardeo/auth-react";
import { Navigate } from "react-router-dom";
import { useUserContext } from "../context/UserContext";

interface SecureRouteProps {
    children: ReactElement;
    adminOnly?: boolean;
}

const SecureRoute: FC<SecureRouteProps> = ({ children, adminOnly = false }) => {
    const { state } = useAuthContext();
    const { isAdmin, loadingUser } = useUserContext();

    if (state.isLoading || loadingUser) {
        return <div>Loading...</div>;
    }

    if (!state.isAuthenticated) {
        return <Navigate to="/" />;
    }

    if (adminOnly && !isAdmin) {
        return <Navigate to="/" />;
    }

    return children;
};

export default SecureRoute;
