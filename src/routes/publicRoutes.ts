// src/routes/publicRoutes.tsx
import { lazy } from 'react';
import { routes } from './routes';

// Lazy load your page
const EnterCodePage = lazy(() => import('../pages/EnterCode'));

export const publicRoutes = [
    {
        title: "enter code",
        path: routes.enterCode,
        component: EnterCodePage,
    }
];
