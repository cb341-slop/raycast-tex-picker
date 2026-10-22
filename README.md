# TeX Symbols

A Raycast extension for searching and copying Greek letters and mathematical symbols, including the natural, integer, rational, real, and complex number sets. Search by a symbol's name, TeX command, or related words. For example, search `fog` or `f(g(x))` to find the function composition symbol `∘` (`\circ`).

## Use

- Run **Search TeX Symbols** from Raycast.
- Browse the symbol grid or search by a Unicode character, name, command, or keyword.
- Each tile shows the Unicode character large, with its name and TeX command underneath.
- Glyph colors identify their category.
- Press Enter to copy the Unicode character. Use the action menu to copy the TeX command instead.
- Use **Add to Favorites** to keep a symbol in the Favorites section. Favorites are stored by Raycast on this Mac.
- Use the search bar dropdown to filter by category or show only favorites.

## Develop

Requires Node.js and Raycast.

```sh
npm install
npm run generate:glyphs
npm run dev
```

The catalog data is in `src/catalog.ts`. The grid's Unicode character images are generated into `assets/glyphs/`; regeneration requires `rsvg-convert` from librsvg. The original standalone browser catalog remains available as `symbols.html`.
