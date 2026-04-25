import { useAuthContext } from "@asgardeo/auth-react";
import { Navigate } from "react-router-dom";

interface SecureRouteProps {
    children: React.ReactElement;
}

const SecureRoute: React.FC<SecureRouteProps> = ({ children }) => {
    const { state } = useAuthContext();

    if (state.isLoading) {
        return <div>Loading...</div>;
    }

    if (!state.isAuthenticated) {
        return <Navigate to="/" />;
    }

    return children;
};

export default SecureRoute;
