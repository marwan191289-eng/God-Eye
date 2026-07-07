import { useUser, useClerk } from "@clerk/react";
import { useMemo } from "react";

export interface AuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  imageUrl: string | null;
  username: string | null;
  phoneNumber: string | null;
  hasGoogleAccount: boolean;
  hasAppleAccount: boolean;
  hasFacebookAccount: boolean;
  hasTwitterAccount: boolean;
  hasEmailAddress: boolean;
  hasPhoneNumber: boolean;
  createdAt: Date | null;
  lastSignInAt: Date | null;
}

export function useAuth() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut: clerkSignOut } = useClerk();

  const authUser = useMemo<AuthUser | null>(() => {
    if (!user) return null;
    const externalAccounts = user.externalAccounts || [];
    return {
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress ?? null,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      fullName: user.fullName ?? null,
      imageUrl: user.imageUrl ?? null,
      username: user.username ?? null,
      phoneNumber: user.primaryPhoneNumber?.phoneNumber ?? null,
      hasGoogleAccount: externalAccounts.some((a) => a.provider === "google"),
      hasAppleAccount: externalAccounts.some((a) => a.provider === "apple"),
      hasFacebookAccount: externalAccounts.some((a) => a.provider === "facebook"),
      hasTwitterAccount: externalAccounts.some((a) => a.provider === "x"),
      hasEmailAddress: (user.emailAddresses || []).length > 0,
      hasPhoneNumber: (user.phoneNumbers || []).length > 0,
      createdAt: user.createdAt ? new Date(user.createdAt) : null,
      lastSignInAt: user.lastSignInAt ? new Date(user.lastSignInAt) : null,
    };
  }, [user]);

  return {
    user: authUser,
    loading: !isLoaded,
    isSignedIn: isSignedIn ?? false,
    signOut: () => clerkSignOut(),
  };
}

export default useAuth;
