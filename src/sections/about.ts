// About me (spec 0004, docs/design.md "About me"): the section heading, then the bio as a quote in real text (in
// quotation marks and italic, spec 0010), so GitHub colors it for every theme and people can select and translate
// it. Below it, a row of contact pills. Links inside an <img> SVG are dead, so each pill is its own themed image
// wrapped in <a href>.

import type { Profile } from "../../content/types.ts";
import { mailtoUrl, profileUrls } from "../content.ts";
import { escapeXml } from "../escape.ts";
import type { IconName } from "../icons.ts";
import { pillButton, sectionHeading, themedImage } from "../svg.ts";
import { button } from "../theme.ts";
import type { Section } from "../types.ts";

const HEADING = "About me";

type ContactButton = {
  readonly icon: IconName;
  readonly label: string;
  /** Raw alt text; `themedImage` escapes it. */
  readonly alt: (profile: Profile) => string;
  readonly url: (profile: Profile) => string;
};

/** Exactly these four, in this order. No GitHub button: the visitor is already on GitHub. */
const contactButtons = [
  { icon: "linkedin", label: "LinkedIn", alt: () => "LinkedIn profile", url: (p) => profileUrls(p.accounts).linkedin },
  { icon: "credly", label: "Credly", alt: () => "Credly badges", url: (p) => profileUrls(p.accounts).credly },
  { icon: "leetcode", label: "LeetCode", alt: () => "LeetCode profile", url: (p) => profileUrls(p.accounts).leetcode },
  { icon: "gmail", label: "Email", alt: (p) => `Email ${p.email}`, url: (p) => mailtoUrl(p.email) },
] as const satisfies readonly ContactButton[];

export const about: Section = ({ content: { profile } }) => {
  const buttons = contactButtons.map(({ icon, label, alt, url }) => {
    const image = themedImage({
      base: `contact-${icon}`,
      alt: alt(profile),
      width: button.width + 2 * button.margin,
      render: (theme) => pillButton(theme, { icon, label }),
    });
    return { ...image, markdown: `<a href="${escapeXml(url(profile))}">${image.markdown}</a>` };
  });

  const heading = sectionHeading({ key: "about", title: HEADING, icon: "person" });
  const markdown = [
    heading.markdown,
    `<p><i>\u201c${escapeXml(profile.bio)}\u201d</i></p>`,
    ["<p>", ...buttons.map((b) => b.markdown), "</p>"].join("\n"),
  ].join("\n\n");
  return { markdown, assets: [...(heading.assets ?? []), ...buttons.flatMap((b) => b.assets ?? [])] };
};
