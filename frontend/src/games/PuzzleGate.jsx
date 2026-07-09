/** Loading / error placeholder shown while a backend puzzle is being fetched. */

export const PuzzleGate = ({ loading, error, children }) => {
  if (loading) {
    return (
      <section className="mx-auto w-full max-w-md py-16 text-center text-slate-400">
        <div className="mb-3 animate-pulse text-4xl">🧩</div>
        <p className="text-sm font-medium">Generando el puzzle…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mx-auto w-full max-w-md py-16 text-center">
        <div className="mb-3 text-4xl">😵</div>
        <p className="text-sm font-medium text-slate-600">
          No pudimos cargar el puzzle. Inténtalo de nuevo en unos segundos.
        </p>
      </section>
    );
  }

  return children;
};
