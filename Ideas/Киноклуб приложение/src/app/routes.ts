import { createBrowserRouter } from 'react-router';
import Root from './components/Root';
import Home from './components/pages/Home';
import SessionPage from './components/pages/SessionPage';
import AdminPage from './components/pages/AdminPage';
import NotFound from './components/pages/NotFound';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: 'session/:id', Component: SessionPage },
      { path: 'admin', Component: AdminPage },
      { path: '*', Component: NotFound },
    ],
  },
]);
