// SafeRouter.tsx
import { useEffect } from "react";
import Loader from "./reusables/Loader";
import { Navigate, useParams } from "react-router-dom";
import { useStartAttemptStore } from "../stores/attemptStore";

function SafeRouter({ children }: { children: React.ReactNode }) {
    const { attemptId } = useParams();
    const { success, loading, error, startAttempt } = useStartAttemptStore();

    useEffect(() => {
        if (attemptId && !success && !loading && !error) {
            startAttempt(attemptId);
        }
    }, [attemptId, startAttempt, success, loading, error]);

    // No attemptId on this route, just render normally
    if (!attemptId) return <>{children}</>;

    if (loading) return <Loader />;
    if (error) return <Navigate to="/" replace />;
    if (success) return <>{children}</>;

    return <Loader />;
}

export default SafeRouter;