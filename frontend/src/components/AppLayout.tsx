import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AddMediaUpdate } from './AddMediaUpdate';
import { NavBar } from './NavBar';
import './AppLayout.css';

export function AppLayout() {
  const [addUpdateOpen, setAddUpdateOpen] = useState(false);

  return (
    <div className="app-layout">
      <NavBar onAddUpdate={() => setAddUpdateOpen(true)} />
      <main className="app-main">
        <Outlet />
      </main>
      {addUpdateOpen && (
        <AddMediaUpdate onClose={() => setAddUpdateOpen(false)} />
      )}
    </div>
  );
}
