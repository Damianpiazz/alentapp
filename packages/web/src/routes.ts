import { createBrowserRouter } from 'react-router';

import { MembersView } from './views/Members';
import { HomeView } from './views/Home';
import Layout from './Layout';
import { LoansView } from './views/EquipmentLoan';
import { SportsView } from './views/Sports';
import { PaymentsView } from './views/Payments';
import { DisciplinesView } from './views/Disciplines';

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
                path: '/loans',
                Component: LoansView,
                path: '/sports',
                Component: SportsView,
            },
            {
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
