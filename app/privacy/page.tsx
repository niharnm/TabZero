import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy - TabZero",
  description: "How TabZero handles tab titles, URLs, and workspace data.",
};

const CONTACT = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "nihar.manchikalapudi@gmail.com";

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={
        <>
          <p>Effective date: June 13, 2026</p>
          <p>
            This policy explains how TabZero handles information for the web app
            and Chrome extension. It is written to match the current product
            behavior: TabZero organizes submitted tab titles and URLs into a
            workspace plan.
          </p>
        </>
      }
      sections={[
        {
          title: "Information TabZero Collects",
          body: (
            <>
              <p>
                When you use the Chrome extension, TabZero reads the current
                Chrome window's HTTP and HTTPS tab titles, URLs, active-tab
                state, and favicon URLs. It sends those fields to the configured
                TabZero web app only when you click Analyze My Tabs.
              </p>
              <p>
                TabZero also collects the goal and time remaining that you type,
                generated workspace content, share-link slugs when you create a
                share link, and limited technical request data that may be
                logged by the hosting platform.
              </p>
              <p>
                The extension stores your last submitted tabs, goal, and time
                remaining in Chrome local storage on your device so the recent
                input can be recovered locally.
              </p>
            </>
          ),
        },
        {
          title: "Information TabZero Does Not Collect",
          body: (
            <p>
              TabZero does not read page body contents, cookies, passwords,
              payment information, screenshots, keystrokes, browser history
              outside the tabs you submit, or data from non-HTTP and non-HTTPS
              tabs.
            </p>
          ),
        },
        {
          title: "How Information Is Used",
          body: (
            <p>
              TabZero uses submitted data to create tab groups, priorities,
              tasks, focus sessions, distraction cleanup suggestions, workspace
              pages, and optional share links. TabZero does not sell user data
              or use submitted tab data for advertising.
            </p>
          ),
        },
        {
          title: "AI Providers And Service Providers",
          body: (
            <>
              <p>
                If the deployed TabZero web app is configured with OpenAI or
                Gemini API keys, submitted tab titles, URLs, goal, and time
                remaining may be sent to that provider to generate the workspace
                plan. If no AI provider is configured, TabZero uses its local
                deterministic analyzer.
              </p>
              <p>
                TabZero may use hosting, database, storage, and AI service
                providers to operate the product. Data is shared with those
                providers only as needed to provide TabZero features.
              </p>
            </>
          ),
        },
        {
          title: "Chrome Web Store Limited Use Disclosure",
          body: (
            <p>
              TabZero's use and transfer of information received from Chrome
              extension APIs is limited to providing and improving the
              user-facing tab organization feature. TabZero does not transfer
              Chrome extension user data to data brokers, information resellers,
              advertising platforms, or services that determine creditworthiness
              or lending eligibility.
            </p>
          ),
        },
        {
          title: "Sharing And Share Links",
          body: (
            <p>
              Workspace pages are private by obscurity unless you create and
              share a public share link. Anyone with that share link may view the
              shared workspace content, including submitted tab titles and URLs.
            </p>
          ),
        },
        {
          title: "Retention And Deletion",
          body: (
            <p>
              Workspace retention depends on the deployment. Local development
              may store workspaces in a local fallback file. Hosted deployments
              may use Supabase or another configured database. To request
              deletion of hosted workspace data, contact {CONTACT}.
            </p>
          ),
        },
        {
          title: "Security",
          body: (
            <p>
              TabZero uses HTTPS in production and requests only the Chrome
              permissions needed for its current features. No internet service
              can be guaranteed perfectly secure, so avoid submitting tabs that
              contain sensitive information in their titles or URLs.
            </p>
          ),
        },
        {
          title: "Children",
          body: (
            <p>
              TabZero is not directed to children under 13, and it should not be
              used by children under 13.
            </p>
          ),
        },
        {
          title: "Contact",
          body: <p>Questions or privacy requests can be sent to {CONTACT}.</p>,
        },
      ]}
    />
  );
}
