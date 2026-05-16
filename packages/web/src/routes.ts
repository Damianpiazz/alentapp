import { createBrowserRouter } from 'react-router';

import { MembersView } from './views/Members';
import { HomeView } from './views/Home';
import { SportsView } from './views/Sports';
import { PaymentsView } from './views/Payments';
import { DisciplinesView } from './views/Disciplines';
import Layout from './Layout';

export const router = createBrowserRouter([
    {
        Component: Layout,
        children: [
            {
                path: '/',
                Component: HomeView,
            },
            {
                path: '/members',
                Component: MembersView,
            },
            {
                path: '/sports',
                Component: SportsView,
                path: '/payments',
                Component: PaymentsView,
            },
            {
                path: '/disciplines',
                Component: DisciplinesView,
            },
        ],
    },
]);
