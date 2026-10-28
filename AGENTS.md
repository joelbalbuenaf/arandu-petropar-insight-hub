<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Sample report data lives in one module (src/lib/petropar-data.ts) shared by report pages and the chat agent prompt, so charts and AI answers stay consistent.
- Chat streams via server route /api/chat (AI SDK Responses helpers in src/lib/ai); threads persist in localStorage keyed by route param.
- The executive presentation has a separate /presentacion route outside AppShell; one 1920×1080 ScaledSlide and global slide tokens serve canvas and overview, while print uses the same slide components to preserve visual fidelity.
- Commercial analytics and Arandu reuse AnalyticalChart and shared demo datasets; allowlisted chart markers render trusted data rather than model-generated chart values, keeping units and separate reporting universes explicit.
- Geographic sales use Google Maps JavaScript with the managed browser key, asynchronous callback loading and no Places calls; coordinates represent departments, not station locations.
- Hub solution cards live in a dedicated home-page component with detail dialogs; distinguish proposed capabilities and required integrations from existing demo reports to avoid implying live station, prospect, or SAP data.
