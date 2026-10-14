import MenuEditorContent from "@/app/components/dashboard/admin/tools/menu-editor/MenuEditorContent";

export const metadata = {
  title: "Menu editor",
  description: "Add, edit and price menu items.",
  robots: { index: false, follow: false },
};

export default function MenuEditorPage() {
  return <MenuEditorContent />;
}
