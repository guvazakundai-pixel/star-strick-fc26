export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="space-y-4 text-center">
        <div className="h-10 w-10 mx-auto rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
        <p className="font-mono text-[11px] text-muted-soft tracking-wider uppercase">Loading...</p>
      </div>
    </div>
  );
}