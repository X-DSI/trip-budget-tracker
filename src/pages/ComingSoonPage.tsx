export function ComingSoonPage({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-3xl bg-white p-8 text-center ring-1 ring-slate-200">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-slate-600">{body}</p>
      <p className="mt-4 text-xs font-medium tracking-wide text-slate-400 uppercase">Coming soon</p>
    </section>
  );
}
