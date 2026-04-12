import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";
import { Suspense } from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-row flex-1">
        <Suspense>
          <Navbar />
        </Suspense>
        <main className="flex-1 flex flex-col gap-20 p-5">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
