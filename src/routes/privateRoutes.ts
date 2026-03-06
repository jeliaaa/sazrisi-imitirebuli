// src/routes/publicRoutes.tsx
import { lazy } from 'react';
import { routes } from './routes';

// Lazy load your page
const QuizPage = lazy(() => import('../pages/QuizStart'));
const QuizProgressPage = lazy(() => import('../pages/QuizProgress'));


export const privateRoutes = [
    {
        title: "Quiz",
        path: routes.quiz,
        component: QuizPage,
    },
    {
        title: "QuizProgress",
        path: routes.quizProgress,
        component: QuizProgressPage,
    }

];
