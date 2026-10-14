import MenuPage from "./menu";

export const metadata = {
  title: "Our menu",
  description: "Browse the full menu.",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <MenuPage />;
}
