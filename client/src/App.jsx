import './index.css';

function App() {
  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-10">
      <header className="w-full max-w-3xl mb-10 text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Watchly (Frontend Scaffold)</h1>
        <p className="text-neutral-400">React + Vite + Tailwind starter. Components will land here incrementally (UpdateFeed, UpdateItem, Auth flows).</p>
      </header>
      <main className="w-full max-w-3xl space-y-6">
        <section className="rounded-lg border border-neutral-800 p-6 bg-neutral-900/60 backdrop-blur">
          <h2 className="text-xl font-semibold mb-3">Next Steps</h2>
          <ul className="list-disc pl-5 space-y-1 text-neutral-300 text-sm">
            <li>Implement auth client: register / login forms calling <code>/api/auth/*</code> with credentials include.</li>
            <li>Scaffold UpdateFeed consuming <code>/updates</code> (pending backend endpoints).</li>
            <li>Add layout + NavBar responsive breakpoints.</li>
            <li>Introduce query client (TanStack Query) for caching & pagination.</li>
          </ul>
        </section>
      </main>
      <footer className="mt-16 text-xs text-neutral-600">&copy; {new Date().getFullYear()} Watchly</footer>
    </div>
  );
}

export default App
