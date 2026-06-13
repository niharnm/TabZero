import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Chrome Extension Disclosures - TabZero",
  description: "Permission and data-use disclosures for the TabZero extension.",
};

export default function ExtensionDisclosuresPage() {
  return (
    <LegalPage
      title="Chrome Extension Disclosures"
      intro={
        <>
          <p>Effective date: June 13, 2026</p>
          <p>
            This page summarizes the TabZero Chrome extension's single purpose,
            permissions, and data handling in plain English.
          </p>
        </>
      }
      sections={[
        {
          title: "Single Purpose",
          body: (
            <p>
              TabZero turns the tabs in your current Chrome window into a
              focused workspace plan. It collects tab metadata only to create
              that user-facing plan.
            </p>
          ),
        },
        {
          title: "Permissions",
          body: (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-foreground">
                    <th className="py-2 pr-4 font-medium">Permission</th>
                    <th className="py-2 pr-4 font-medium">Why it is needed</th>
                  </tr>
                </thead>
                <tbody className="align-top">
                  <tr className="border-b border-border/60">
                    <td className="py-3 pr-4 font-mono text-xs text-foreground">
                      tabs
                    </td>
                    <td className="py-3 pr-4">
                      Reads the current window's HTTP and HTTPS tab titles,
                      URLs, active state, and favicon URLs when you use the
                      popup.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-mono text-xs text-foreground">
                      storage
                    </td>
                    <td className="py-3 pr-4">
                      Saves your most recent submitted tabs, goal, and time
                      remaining locally in Chrome storage.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ),
        },
        {
          title: "Host Permissions",
          body: (
            <p>
              The extension may send submitted tab metadata to the configured
              TabZero web app, currently localhost for local testing and Vercel
              app domains for hosted deployments. It does not request access to
              read or modify every site you visit.
            </p>
          ),
        },
        {
          title: "User Control",
          body: (
            <p>
              TabZero sends tab data only after you click Analyze My Tabs. It
              does not continuously monitor browsing activity in the background.
            </p>
          ),
        },
        {
          title: "Privacy Policy",
          body: (
            <p>
              For the complete data handling policy, read the{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                TabZero Privacy Policy
              </Link>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
