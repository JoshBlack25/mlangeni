import Link from "next/link";
import { FaInstagram, FaLinkedin, FaFacebook } from "react-icons/fa";
import { cn } from "@/lib/utils";
import { focusRing } from "@/app/components/dashboard/ui";

const legalLinks = [
  "Privacy Policy",
  "Terms & Conditions",
  "POPIA Compliance",
  "PAIA Manual",
];

const socials = [
  { icon: FaInstagram, href: "#", label: "Instagram" },
  { icon: FaLinkedin, href: "#", label: "LinkedIn" },
  { icon: FaFacebook, href: "#", label: "Facebook" },
];

const quietLink = cn("rounded-sm transition-colors hover:text-mgh-text", focusRing);

/** A quiet close to the dashboard: who to talk to, then the fine print. */
export default function DashboardFooter() {
  return (
    <footer className="border-t border-mgh-line pt-8 text-sm text-mgh-muted">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-serif text-lg text-mgh-text">Need help?</p>
          <p className="mt-1">
            <a href="mailto:hello@mlangeni.co.za" className={quietLink}>
              hello@mlangeni.co.za
            </a>
            <span className="mx-2 text-mgh-dim" aria-hidden="true">
              ·
            </span>
            <Link href="/dashboard/customer/support" className={quietLink}>
              Support
            </Link>
          </p>
        </div>

        <div className="flex gap-1">
          {socials.map(({ icon: Icon, href, label }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className={cn("grid size-9 place-items-center rounded-control text-mgh-dim hover:text-mgh-text", focusRing)}
            >
              <Icon size={15} aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 text-caption text-mgh-dim md:flex-row md:items-center md:justify-between">
        <ul className="flex flex-wrap gap-x-5 gap-y-1">
          {legalLinks.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>Mlangeni Group Holdings · Cape Town, South Africa · Site by CPUT</p>
      </div>
    </footer>
  );
}
