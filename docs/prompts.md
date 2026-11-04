# Icon prompts

> Built by `tools/icon_prompts.js` from `tools/icon_sheets.json`, which keeps
> every icon, drawn or not. This page has only what is still to draw;
> `npm run icon-prompts -- --all` writes every sheet's prompt to
> `out/all-prompts.md`. Edit the JSON and run `npm run icon-prompts`; changes made
> here are overwritten.

Every icon is drawn. To have one drawn again, give it a `"redo"` in
`tools/icon_sheets.json` saying what's wrong with it; to add icons, add a
sheet of nine. Then run `npm run icon-prompts`.
