import { ExploreNav } from "@/components/explore-nav";

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <ExploreNav />
      <div className="mx-auto max-w-5xl px-6 py-12">{children}</div>
    </div>
  );
}
