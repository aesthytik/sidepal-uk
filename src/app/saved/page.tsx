import type { Metadata } from "next";
import { Shortlist } from "./Shortlist";

export const metadata: Metadata = {
  title: "My shortlist",
  description: "Track the visa sponsors you're applying to.",
};

export default function SavedPage() {
  return <Shortlist />;
}
