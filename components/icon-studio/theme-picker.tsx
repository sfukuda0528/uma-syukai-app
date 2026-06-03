import themes from "@/data/default-icon-themes.json";
import type { IconTheme } from "@/lib/icons/icon-generator";

type ThemePickerProps = {
  customTheme: IconTheme;
  selectedThemeId: string;
  onCustomThemeChange: (theme: IconTheme) => void;
  onSelect: (themeId: string) => void;
};

export function ThemePicker({ customTheme, selectedThemeId, onCustomThemeChange, onSelect }: ThemePickerProps) {
  function updateColor(index: number, color: string) {
    const nextPalette = [...customTheme.palette];
    nextPalette[index] = color;
    onCustomThemeChange({
      ...customTheme,
      palette: nextPalette
    });
    onSelect(customTheme.id);
  }

  return (
    <div className="rounded-md border border-ink/10 bg-white p-4 sm:p-5">
      <h2 className="text-lg font-black">アイコンテーマ</h2>
      <p className="mt-1 text-sm text-ink/60">ブランドロゴをコピーせず、頭文字と抽象図形で生成します。</p>

      <div className="mt-5 grid gap-3">
        {themes.map((theme) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => onSelect(theme.id)}
            aria-pressed={selectedThemeId === theme.id}
            className={`flex min-h-16 items-center justify-between gap-3 rounded-md border p-3 text-left transition hover:border-tomato ${
              selectedThemeId === theme.id ? "border-tomato bg-tomato/5" : "border-ink/10"
            }`}
          >
            <span className="min-w-0">
              <span className="block text-sm font-bold">{theme.name}</span>
              <span className="text-xs text-ink/55">{theme.description}</span>
            </span>
            <span className="flex shrink-0 gap-1" aria-hidden="true">
              {theme.palette.map((color) => (
                <span
                  key={color}
                  className="h-7 w-7 rounded-sm border border-ink/10"
                  style={{ backgroundColor: color }}
                />
              ))}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-md border border-ink/10 bg-paper/70 p-3">
        <button
          type="button"
          onClick={() => onSelect(customTheme.id)}
          aria-pressed={selectedThemeId === customTheme.id}
          className={`flex min-h-12 w-full items-center justify-between rounded-md border px-3 text-left text-sm font-bold transition hover:border-tomato ${
            selectedThemeId === customTheme.id ? "border-tomato bg-white text-tomato" : "border-ink/10 bg-white text-ink"
          }`}
        >
          カスタムテーマ
          <span className="text-xs text-ink/50">色を編集</span>
        </button>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {customTheme.palette.map((color, index) => (
            <label key={index} className="grid gap-1 text-xs font-bold text-ink/55">
              {index === 0 ? "背景" : index === 1 ? "文字" : "アクセント"}
              <input
                type="color"
                value={color}
                onChange={(event) => updateColor(index, event.target.value)}
                className="h-10 w-full cursor-pointer rounded-md border border-ink/15 bg-white p-1"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
