import { SignUpForm } from "@/components/sign-up-form";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-[#A2CEF0] to-[#33AB9D]">
      <div className="w-full max-w-sm">
        <SignUpForm />
      </div>
    </div>
  );
}
