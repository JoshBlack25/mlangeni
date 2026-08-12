export default function DashboardLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#1F1F1F] border-t-[#D4AF37]" />
        <p className="text-sm tracking-wide text-[#A0A0A0]">
          Loading your dashboard…
        </p>
      </div>
    </div>
  );
}
