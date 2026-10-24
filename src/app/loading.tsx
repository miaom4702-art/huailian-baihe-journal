export default function Loading() {
  return (
    <div className="wrap py-12 lg:py-20">
      <div className="animate-pulse space-y-8">
        <div className="space-y-3">
          <div className="h-3 w-24 rounded-full bg-ink-900/10" />
          <div className="h-9 w-2/3 rounded-sm bg-ink-900/10" />
          <div className="h-4 w-full max-w-xl rounded-full bg-ink-900/5" />
          <div className="h-4 w-4/5 max-w-lg rounded-full bg-ink-900/5" />
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="card space-y-4 p-5">
              <div className="h-3 w-20 rounded-full bg-ink-900/10" />
              <div className="h-5 w-full rounded-sm bg-ink-900/10" />
              <div className="h-4 w-5/6 rounded-full bg-ink-900/5" />
              <div className="h-4 w-2/3 rounded-full bg-ink-900/5" />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="h-5 w-32 rounded-sm bg-ink-900/10" />
          <div className="h-24 w-full rounded-sm bg-ink-900/[0.04]" />
          <div className="h-24 w-full rounded-sm bg-ink-900/[0.04]" />
        </div>
      </div>
    </div>
  );
}
