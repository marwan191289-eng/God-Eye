import { useEffect } from "react";
import { useClerk } from "@clerk/react";
import { Loader2 } from "lucide-react";

export default function SignOut() {
  const { signOut } = useClerk();

  useEffect(() => {
    signOut({ redirectUrl: "/auth" });
  }, [signOut]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
