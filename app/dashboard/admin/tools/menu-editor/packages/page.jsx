import {
  Button,
  EmptyState,
  PageHeader,
  Panel,
} from "@/app/components/dashboard/ui";

export const metadata = {
  title: "Menu packages",
  description: "Pre-made menus offered as packages.",
  robots: { index: false, follow: false },
};

export default function PackagesPage() {
  return (
    <div>
      <PageHeader density="dense" title="Packages" />
      <Panel density="dense">
        <EmptyState
          title="Packages"
          action={
            <Button variant="secondary" href="/dashboard/admin/tools/menu-editor">
              Back to menu editor
            </Button>
          }
        >
          Package editing isn&apos;t available here yet.
        </EmptyState>
      </Panel>
    </div>
  );
}
