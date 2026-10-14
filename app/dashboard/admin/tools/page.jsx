import ToolsOverview from "@/app/components/dashboard/admin/tools/ToolsOverview";

export const metadata = {
  title: "Tools",
  description: "Menu editor and testimonial moderation.",
  robots: { index: false, follow: false },
};

export default function ToolsPage() {
  return <ToolsOverview />;
}
