# Repository: description and topics

What is set on GitHub by hand (it cannot be stored in the files of the repository). Overview: [README](../README.md).

## Name: `movie-discovery`

Naming standard: `reops/standards/repo-names.md`. The repository was created on 2026-11-21 as the successor of the team
project [`tmdb-movie-browser`](https://github.com/DamTchorzewski/tmdb-movie-browser) (Filmoteka, HiFiveTeam), whose
history it carries; that repository stays as it was. The product name is **Kadr**; the repository name says what the
project is.

## About

GitHub: the repository page → ⚙ next to "About". The description is at most 350 characters; topics are lower-case with
hyphens, at most 20.

**Description:**

```text
Kadr: a cinematic movie discovery app on the TMDB API, in Polish and English. Trends, filters, where to watch in Poland, a watchlist with ratings and a pick for tonight.
```

**Website:**

```text
https://damtchorzewski.github.io/movie-discovery/
```

**Topics:**

```text
movies tmdb-api movie-discovery watchlist react typescript vite tailwindcss tanstack-router tanstack-query pwa i18n accessibility playwright github-pages
```

With the GitHub CLI:

```bash
gh repo edit DamTchorzewski/movie-discovery \
  --homepage "https://damtchorzewski.github.io/movie-discovery/" \
  --description "Kadr: a cinematic movie discovery app on the TMDB API, in Polish and English. Trends, filters, where to watch in Poland, a watchlist with ratings and a pick for tonight." \
  --add-topic movies --add-topic tmdb-api --add-topic movie-discovery --add-topic watchlist --add-topic react \
  --add-topic typescript --add-topic vite --add-topic tailwindcss --add-topic tanstack-router \
  --add-topic tanstack-query --add-topic pwa --add-topic i18n --add-topic accessibility --add-topic playwright \
  --add-topic github-pages
```

## Settings

| Where (GitHub)                               | What                                                                          |
| -------------------------------------------- | ----------------------------------------------------------------------------- |
| Settings → Pages                             | Source: **GitHub Actions** (set on 2026-11-21)                                |
| Settings → Secrets and variables → Variables | `VITE_TMDB_API_KEY` (repository variable), see [deployment.md](deployment.md) |
| Settings → General → Pull Requests           | rebase merging and merge commits on, squash off, auto-delete branches off     |
| Settings → Rules → Rulesets                  | `main` and `develop`: restrict deletions, block force pushes                  |
| Settings → Code security                     | Dependabot alerts and security updates, secret scanning with push protection  |
