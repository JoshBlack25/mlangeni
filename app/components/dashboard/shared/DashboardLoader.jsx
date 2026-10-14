/**
 * Full-screen loader while the role guard checks the session: the wordmark
 * with a gold hairline travelling under it (static under reduced motion).
 */
export default function DashboardLoader() {
  return (
    <div role="status" className="flex min-h-dvh items-center justify-center bg-mgh-bg">
      <div className="flex flex-col items-center">
        <p className="font-serif text-2xl text-mgh-text">Mlangeni</p>
        <span aria-hidden="true" className="relative mt-3 block h-px w-28 overflow-hidden bg-mgh-line">
          <span className="mgh-sweep absolute inset-y-0 left-0 w-1/3 bg-mgh-gold" />
        </span>
        <p className="mt-4 text-caption text-mgh-dim">Loading your dashboard…</p>
      </div>
    </div>
  );
}
