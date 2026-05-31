import { Suspense } from "react";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Suspense fallback={<div className="h-96" />}>
        <SignupForm />
      </Suspense>
    </div>
  );
}
