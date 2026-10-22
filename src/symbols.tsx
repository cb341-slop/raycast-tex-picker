import {
  Action,
  ActionPanel,
  Grid,
  Icon,
  LocalStorage,
  Keyboard,
} from "@raycast/api";
import { useEffect, useMemo, useState } from "react";
import { symbols, type SymbolEntry } from "./catalog";

const FAVORITES_KEY = "favorite-symbol-ids";
const FAVORITES = "Favorites";
const categories = [...new Set(symbols.map((entry) => entry.category))];
const categoryColors: Record<string, string> = {
  Greek: "#3978ee",
  "Logic & Sets": "#8a5cf6",
  Relations: "#e58a28",
  Operators: "#12a89d",
  Calculus: "#31945b",
  Arrows: "#df5353",
  Geometry: "#a26b32",
  "Number Sets": "#607c35",
  Delimiters: "#c34e91",
  Miscellaneous: "#747b86",
};

function searchFields(entry: SymbolEntry): string[] {
  return [
    entry.symbol,
    entry.tex,
    entry.name,
    entry.category,
    ...entry.keywords,
  ];
}

function scoreEntry(entry: SymbolEntry, rawQuery: string): number | undefined {
  const query = rawQuery.trim();
  if (!query) return 0;
  if (entry.symbol === query) return 0;
  if (entry.tex === query) return 1;

  const fields = searchFields(entry);
  const lowerFields = fields.map((field) => field.toLocaleLowerCase());
  if (/^[A-Z]$/.test(query)) {
    return [entry.symbol, entry.tex].some((field) => field.includes(query))
      ? 2
      : undefined;
  }
  if (/^[a-z]$/.test(query)) {
    return lowerFields.some((field) => field === query) ? 2 : undefined;
  }

  const hasUppercase = /[A-Z]/.test(query);
  const queryTokens = query.split(/\s+/);
  let total = 0;

  for (const token of queryTokens) {
    const lowerToken = token.toLocaleLowerCase();
    const caseExact = hasUppercase
      ? [entry.symbol, entry.tex].some((field) => field.includes(token))
      : false;
    const lowerIndex = lowerFields.findIndex((field) =>
      field.includes(lowerToken),
    );

    if (caseExact) {
      total += 2;
    } else if (lowerFields.some((field) => field === lowerToken)) {
      total += 8;
    } else if (lowerFields.some((field) => field.startsWith(lowerToken))) {
      total += 12;
    } else if (lowerIndex >= 0) {
      total += 20 + lowerFields[lowerIndex].indexOf(lowerToken);
    } else {
      return undefined;
    }
  }

  return total;
}

export default function Command() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All Symbols");
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    console.info(
      `[TeX Symbols] command started with ${symbols.length} catalog entries`,
    );
    console.info("[TeX Symbols] loading favorites from Raycast LocalStorage");
    LocalStorage.getItem<string>(FAVORITES_KEY)
      .then((stored) => {
        const parsed: unknown = stored ? JSON.parse(stored) : [];
        const loaded =
          Array.isArray(parsed) &&
          parsed.every((id): id is string => typeof id === "string")
            ? parsed
            : [];
        console.info(`[TeX Symbols] favorites loaded: ${loaded.length}`);
        setFavorites(loaded);
      })
      .catch((error: unknown) => {
        console.error(
          "[TeX Symbols] favorites read failed; continuing without favorites",
          error,
        );
        setFavorites([]);
      });
  }, []);

  const sections = useMemo(() => {
    const categoryMatches = (entry: SymbolEntry) =>
      selectedCategory === "All Symbols" ||
      (selectedCategory === FAVORITES
        ? favorites.includes(entry.id)
        : entry.category === selectedCategory);
    const query = searchText.trim();

    if (query) {
      const results = symbols
        .filter(categoryMatches)
        .map((entry) => ({ entry, score: scoreEntry(entry, query) }))
        .filter(
          (result): result is { entry: SymbolEntry; score: number } =>
            result.score !== undefined,
        )
        .sort(
          (a, b) =>
            a.score - b.score || a.entry.name.localeCompare(b.entry.name),
        )
        .map(({ entry }) => entry);
      return results.length ? [{ title: "Results", entries: results }] : [];
    }

    if (selectedCategory === FAVORITES) {
      return [{ title: FAVORITES, entries: symbols.filter(categoryMatches) }];
    }

    const result: { title: string; entries: SymbolEntry[] }[] = [];
    const favoriteEntries = symbols.filter((entry) =>
      favorites.includes(entry.id),
    );
    if (selectedCategory === "All Symbols" && favoriteEntries.length > 0) {
      result.push({ title: FAVORITES, entries: favoriteEntries });
    }

    for (const category of categories) {
      if (selectedCategory !== "All Symbols" && selectedCategory !== category)
        continue;
      result.push({
        title: category,
        entries: symbols.filter((entry) => entry.category === category),
      });
    }
    return result;
  }, [favorites, searchText, selectedCategory]);

  console.info(
    `[TeX Symbols] rendering grid: ${symbols.length} symbols, ${sections.length} sections, ${favorites.length} favorites, category=${selectedCategory}, query=${JSON.stringify(searchText)}, top=${
      sections[0]?.entries
        .slice(0, 3)
        .map((entry) => entry.symbol)
        .join(",") ?? "none"
    }`,
  );

  async function toggleFavorite(entry: SymbolEntry) {
    const next = favorites.includes(entry.id)
      ? favorites.filter((id) => id !== entry.id)
      : [...favorites, entry.id];
    setFavorites(next);
    try {
      await LocalStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      console.info(
        `[TeX Symbols] favorite saved: ${entry.name} (${next.length} total)`,
      );
    } catch (error) {
      console.error(
        `[TeX Symbols] failed to save favorite: ${entry.name}`,
        error,
      );
      setFavorites(favorites);
    }
  }

  return (
    <Grid
      columns={8}
      inset={Grid.Inset.Small}
      filtering={false}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search symbols, TeX commands, or keywords…"
      searchBarAccessory={
        <Grid.Dropdown
          tooltip="Filter by category"
          value={selectedCategory}
          onChange={setSelectedCategory}
        >
          <Grid.Dropdown.Item title="All Symbols" value="All Symbols" />
          <Grid.Dropdown.Section title="Collections">
            <Grid.Dropdown.Item title="Favorites" value={FAVORITES} />
          </Grid.Dropdown.Section>
          <Grid.Dropdown.Section title="Categories">
            {categories.map((category) => (
              <Grid.Dropdown.Item
                key={category}
                title={category}
                value={category}
              />
            ))}
          </Grid.Dropdown.Section>
        </Grid.Dropdown>
      }
    >
      {sections.map(({ title, entries }) => (
        <Grid.Section key={title} title={title} subtitle={`${entries.length}`}>
          {entries.map((entry) => (
            <Grid.Item
              key={entry.id}
              content={{
                source: `glyphs/${[...entry.symbol].map((char) => char.codePointAt(0)?.toString(16)).join("-")}.png`,
                tintColor: categoryColors[entry.category] ?? "#3978ee",
              }}
              title={`${entry.symbol} ${entry.name}`}
              subtitle={entry.tex}
              keywords={[
                entry.symbol,
                entry.tex,
                entry.category,
                ...entry.keywords,
              ]}
              actions={
                <ActionPanel>
                  <Action.CopyToClipboard
                    title={`Copy Unicode ${entry.symbol}`}
                    content={entry.symbol}
                    shortcut={{ modifiers: ["cmd"], key: "c" }}
                  />
                  <Action.CopyToClipboard
                    title={`Copy TeX ${entry.tex}`}
                    content={entry.tex}
                    shortcut={Keyboard.Shortcut.Common.Copy}
                  />
                  <Action
                    title={
                      favorites.includes(entry.id)
                        ? "Remove from Favorites"
                        : "Add to Favorites"
                    }
                    icon={Icon.Star}
                    shortcut={{ modifiers: ["cmd"], key: "f" }}
                    onAction={() => toggleFavorite(entry)}
                  />
                </ActionPanel>
              }
            />
          ))}
        </Grid.Section>
      ))}
    </Grid>
  );
}
