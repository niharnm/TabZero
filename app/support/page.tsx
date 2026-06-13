import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Support - TabZero",
  description: "Support and troubleshooting for TabZero.",
};

const CONTACT = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "nihar.manchikalapudi@gmail.com";

export default function SupportPage() {
  return (
    <LegalPage
      title="Support"
      intro={
        <p>
          Need help with TabZero? Start with the quick checks below, then email{" "}
          {CONTACT} with the workspace URL, browser, and what went wrong.
        </p>
      }
      sections={[
        {
          title: "Extension Cannot Read Tabs",
          body: (
            <p>
              Confirm the extension is loaded from the latest dist folder and
              that Chrome shows the tabs permission as enabled. TabZero only
              collects HTTP and HTTPS tabs in the current Chrome window.
            </p>
          ),
        },
        {
          title: "Analyze Fails",
          body: (
            <p>
              Confirm the web app URL configured at build time is reachable. For
              local testing, the web app should be running at
              http://localhost:3000 and the extension should be rebuilt with
              VITE_WEB_APP_URL=http://localhost:3000.
            </p>
          ),
        },
        {
          title: "Workspace Or Share Link Missing",
          body: (
            <p>
              Local development uses fallback storage unless Supabase is
              configured. Workspaces and share links may disappear if local or
              temporary hosted storage is cleared.
            </p>
          ),
        },
        {
          title: "Privacy Or Deletion Requests",
          body: (
            <p>
              Send privacy questions or deletion requests to {CONTACT}. Include
              the workspace URL or share URL so the relevant data can be found.
            </p>
          ),
        },
      ]}
    />
  );
}
