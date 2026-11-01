import { redirect } from "next/navigation";

// Matches now live inside the dashboard; this keeps old links and bookmarks working.
export default function MatchesPage() {
  redirect("/dashboard?view=matches");
}
