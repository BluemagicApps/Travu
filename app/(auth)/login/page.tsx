import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Suspense fallback={<div className="h-80" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
