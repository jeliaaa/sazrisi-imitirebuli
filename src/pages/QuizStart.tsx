import { useEffect } from 'react';
import { useQuizStore } from '../stores/quizStore';
import Loader from '../components/reusables/Loader';
import { useStartAttemptStore } from '../stores/attemptStore';
import { Link } from 'react-router-dom';

const QuizStart = () => {
    const { loading } = useQuizStore();
    const { startAttempt, loading: attemptLoading } = useStartAttemptStore();
    const code = localStorage.getItem("attemptId");
    useEffect(() => {
        if (code) {
            startAttempt(code)
        }
    }, [code, startAttempt]);

    if (loading || attemptLoading) {
        return <Loader />;
    }

    return (
        <div>
            <div className='flex flex-col gap-y-5 justify-center items-center'>
                <Link to="/quiz/progress">start</Link>
            </div>
        </div>

    )
}

export default QuizStart
