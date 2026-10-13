import type { Metadata } from "next";
import { ProfileEditor } from "./ProfileEditor";

export const metadata: Metadata = {
  title: "My profile",
  description: "Add your CV or skills so Horus can rank visa sponsorship jobs for you. Stays in your browser.",
  robots: { index: false },
};

export default function ProfilePage() {
  return <ProfileEditor />;
}
