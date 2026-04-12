import { FileText, FileUp, LayoutDashboard } from "lucide-react";

type NavigationProp = {
  name: string;
  href: string;
  icon?: React.ReactNode;
};
export const navigation: NavigationProp[] = [
  { name: "Dashboard", href: "/", icon: <LayoutDashboard /> },
  { name: "Importar PDF", href: "/protected/importar", icon: <FileUp /> },
  { name: "Extratos", href: "/protected/extratos", icon: <FileText /> },
];
