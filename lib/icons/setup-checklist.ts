import type { GeneratedIcon } from "./icon-generator";

export function createShortcutSetupChecklist(icons: GeneratedIcon[]) {
  const rows = icons
    .map(
      (icon, index) =>
        `${index + 1}. [ ] ${icon.displayName}\n` +
        `   - Icon file: icons/${icon.fileName}\n` +
        `   - Create a shortcut with the Open App action for ${icon.displayName}.\n` +
        "   - Add it to the Home Screen and choose this PNG as the icon."
    )
    .join("\n\n");

  return `Shortcut setup checklist\n\n${rows}`;
}

