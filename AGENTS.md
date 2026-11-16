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

- Use the shared Button component with touch-sized controls for student/teacher actions; this keeps mobile interaction targets consistent.
- Keep mobile navigation safe-area aware and mission dialogs viewport-height bounded with internal scrolling so forms stay reachable on phones.
- Teachers review evidence manually in the validation page, approving or rejecting each pending submission.
- Rejections require a reason; every decision records the validator, timestamp, and audit event.
- Only approved submissions count toward student points and rankings, as calculated by `computeStudentStats` in `src/lib/ranking.ts`.
- Student ranking points come only from `computeStudentStats` in `src/lib/ranking.ts`, which reuses `studentPoints` from `src/lib/scoring.ts`; never add a parallel scoring formula. Only approved submissions count, and ranking shows abbreviated names only.
- Demo students live in `src/lib/demo-data.ts` (deterministic, flagged `demo`); never derive individual points from a school's aggregate total.
