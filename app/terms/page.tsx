import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service - TabZero",
  description: "Terms for using TabZero.",
};

const CONTACT = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "nihar.manchikalapudi@gmail.com";

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro={
        <>
          <p>Effective date: June 13, 2026</p>
          <p>
            These terms govern your use of the TabZero web app and Chrome
            extension. By using TabZero, you agree to these terms.
          </p>
        </>
      }
      sections={[
        {
          title: "What TabZero Does",
          body: (
            <p>
              TabZero organizes submitted browser tab titles and URLs into a
              workspace plan with groups, tasks, focus blocks, and cleanup
              suggestions. TabZero is a productivity tool and does not guarantee
              that every recommendation will be correct or complete.
            </p>
          ),
        },
        {
          title: "Your Responsibilities",
          body: (
            <p>
              You are responsible for the tabs, URLs, goals, and other content
              you submit. Do not submit content you do not have the right to use,
              content that violates law, or highly sensitive information that
              should not be processed by a productivity service.
            </p>
          ),
        },
        {
          title: "Acceptable Use",
          body: (
            <p>
              You may not use TabZero to abuse, disrupt, reverse engineer,
              overload, or compromise the service or any third-party service.
              You may not use TabZero to generate or distribute unlawful,
              harmful, or infringing content.
            </p>
          ),
        },
        {
          title: "AI Output",
          body: (
            <p>
              Some TabZero deployments may use AI providers to generate plans.
              AI output can be incomplete, inaccurate, or unsuitable for your
              situation. You should review workspace plans before relying on
              them.
            </p>
          ),
        },
        {
          title: "Share Links",
          body: (
            <p>
              If you create a share link, anyone with that link may view the
              shared workspace. Only create share links for workspace content you
              are comfortable sharing.
            </p>
          ),
        },
        {
          title: "Service Changes",
          body: (
            <p>
              TabZero may change, suspend, or discontinue features at any time.
              These terms may be updated as the product changes. Continued use
              after updates means you accept the updated terms.
            </p>
          ),
        },
        {
          title: "No Warranties",
          body: (
            <p>
              TabZero is provided as is and as available, without warranties of
              any kind. To the fullest extent permitted by law, TabZero disclaims
              implied warranties of merchantability, fitness for a particular
              purpose, and non-infringement.
            </p>
          ),
        },
        {
          title: "Limitation Of Liability",
          body: (
            <p>
              To the fullest extent permitted by law, TabZero will not be liable
              for indirect, incidental, special, consequential, exemplary, or
              punitive damages, or for lost profits, lost data, or business
              interruption arising from your use of the service.
            </p>
          ),
        },
        {
          title: "Contact",
          body: <p>Questions about these terms can be sent to {CONTACT}.</p>,
        },
      ]}
    />
  );
}
