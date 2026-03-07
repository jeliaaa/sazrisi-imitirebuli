// SafeRouter.tsx
import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import Loader from "./reusables/Loader";
import { useStartAttemptStore } from "../stores/attemptStore";

function SafeRouter({ children }: { children: React.ReactNode }) {
    const { attemptId } = useParams();
    const { success, loading, error, startAttempt } = useStartAttemptStore();

    const timerKey = (id: string) => `attempt_timer_${id}`;

    useEffect(() => {
        if (!attemptId) return;
        if (success || loading || error) return;

        // Start attempt request
        startAttempt(attemptId);

        // Persist timer start if not already saved
        const existingTimer = localStorage.getItem(timerKey(attemptId));

        if (!existingTimer) {
            localStorage.setItem(timerKey(attemptId), String(Date.now()));
        }

    }, [attemptId, success, loading, error, startAttempt]);

    // Route does not require attempt
    if (!attemptId) {
        return <>{children}</>;
    }

    if (loading) {
        return <Loader />;
    }

    if (error) {
        return <Navigate to="/" replace />;
    }

    if (success) {
        return <>{children}</>;
    }

    return <Loader />;
}

export default SafeRouter;