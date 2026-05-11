import { createBrowserRouter } from 'react-router';

import { MembersView } from './views/Members';
import { HomeView } from './views/Home';
import Layout from './Layout';
import { LoansView } from './views/EquipmentLoan';

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
            },
        ],
    },
]);
