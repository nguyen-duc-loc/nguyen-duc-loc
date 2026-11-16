// Starter content data. Feature 3 (Profile content data) owns the final shape.
// Edit this file, then run `pnpm build`. Never edit README.md by hand.

export type Profile = {
  readonly name: string;
  readonly title: string;
};

export const profile = { name: "Loc Nguyen", title: "Cloud Developer" } as const satisfies Profile;
