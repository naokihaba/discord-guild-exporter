<script setup lang="ts">
import { useGuildExporter } from "./useGuildExporter";

const exporter = useGuildExporter();
</script>

<template>
  <div class="page-shell">
    <header>
      <a class="brand" href="/" aria-label="Guild Exporter ホーム">
        <span class="brand-mark" aria-hidden="true">GE</span>
        <span>Guild Exporter</span>
      </a>
      <span class="utility-label">Discord utility</span>
    </header>

    <main>
      <section class="hero" aria-labelledby="hero-title">
        <div class="eyebrow"><span aria-hidden="true"></span> Your data, kept temporary</div>
        <h1 id="hero-title">参加サーバーを、<br /><strong>ひとつのリストに。</strong></h1>
        <p class="lead">
          Discord公式OAuthで参加サーバーの基本情報を読み込み、見やすく確認してJSONに書き出せます。
        </p>

        <div v-if="exporter.session.value.status === 'idle'" class="actions">
          <button class="primary" type="button" @click="exporter.connect">
            Discordでリストを読み込む
          </button>
          <p>要求する権限は <code>guilds</code> のみです。</p>
        </div>

        <div
          v-else-if="exporter.session.value.status === 'pending'"
          class="status-card"
          role="status"
          aria-live="polite"
        >
          <span class="loader" aria-hidden="true"></span>
          接続状態を確認しています
        </div>

        <div
          v-else-if="exporter.session.value.status === 'error'"
          class="status-card error"
          role="alert"
        >
          <div>
            <strong>読み込めませんでした</strong>
            <p>{{ exporter.session.value.message }}</p>
          </div>
          <button type="button" @click="exporter.connect">もう一度試す</button>
        </div>

        <div v-else class="result-panel">
          <div class="result-summary">
            <div>
              <span class="success-label">読み込み完了</span>
              <h2>{{ exporter.guilds.value.length }} servers</h2>
            </div>
            <div class="result-actions">
              <button class="secondary" type="button" @click="exporter.clear">クリア</button>
              <button class="primary" type="button" @click="exporter.download">JSONを保存</button>
            </div>
          </div>

          <label class="search-field">
            <span>サーバーを検索</span>
            <input
              v-model="exporter.query.value"
              type="search"
              autocomplete="off"
              placeholder="名前で絞り込む"
            />
          </label>

          <p class="result-count" aria-live="polite">
            {{ exporter.filteredGuilds.value.length }}件を表示
          </p>
          <ul class="guild-list">
            <li v-for="guild in exporter.filteredGuilds.value" :key="guild.id">
              <span class="guild-avatar" aria-hidden="true">{{ guild.name.slice(0, 1) }}</span>
              <span class="guild-name">{{ guild.name }}</span>
              <span v-if="guild.owner" class="owner-badge">Owner</span>
              <code>{{ guild.id }}</code>
            </li>
          </ul>
          <p v-if="exporter.filteredGuilds.value.length === 0" class="empty-state">
            一致するサーバーはありません。
          </p>
        </div>
      </section>

      <aside aria-label="このツールの特徴">
        <article>
          <span class="feature-number">01</span>
          <h2>Read only</h2>
          <p>サーバーの追加や変更は行いません。Botの導入も不要です。</p>
        </article>
        <article>
          <span class="feature-number">02</span>
          <h2>Private by default</h2>
          <p>アクセストークンは保存せず、取得後にDiscordへ失効を要求します。</p>
        </article>
        <article>
          <span class="feature-number">03</span>
          <h2>Portable JSON</h2>
          <p>ID、名前、アイコン識別子、オーナー状態を手元へ書き出せます。</p>
        </article>
      </aside>
    </main>

    <footer>
      <p>Guild Exporter is an independent tool and is not affiliated with Discord.</p>
      <p>データは短時間のセッション終了後に破棄されます。</p>
    </footer>
  </div>
</template>

<style scoped>
.page-shell {
  inline-size: min(100% - 2rem, 76rem);
  margin-inline: auto;
}

header,
footer,
.brand,
.result-summary,
.result-actions {
  display: flex;
  align-items: center;
}

header {
  min-block-size: 5.5rem;
  justify-content: space-between;
  border-block-end: 1px solid var(--border);
}

.brand {
  gap: 0.75rem;
  color: var(--text);
  font-weight: 760;
  text-decoration: none;
}

.brand-mark {
  display: grid;
  place-items: center;
  inline-size: 2.25rem;
  aspect-ratio: 1;
  border-radius: 0.7rem;
  background: var(--accent);
  color: white;
  font-size: 0.75rem;
  letter-spacing: -0.03em;
}

.utility-label,
.eyebrow,
.feature-number,
.result-count {
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(15rem, 21rem);
  gap: clamp(3rem, 8vw, 8rem);
  padding-block: clamp(4rem, 10vw, 8rem);
}

.hero {
  min-inline-size: 0;
}

.eyebrow {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--accent-strong);

  span {
    inline-size: 0.45rem;
    aspect-ratio: 1;
    border-radius: 50%;
    background: currentColor;
  }
}

h1 {
  margin-block-start: 1.25rem;
  font-size: clamp(2.8rem, 7vw, 5.8rem);
  line-height: 0.98;
  letter-spacing: -0.065em;
  text-wrap: balance;

  strong {
    color: var(--accent-strong);
    font-weight: inherit;
  }
}

.lead {
  max-inline-size: 38rem;
  margin-block-start: 2rem;
  color: var(--text-muted);
  font-size: clamp(1rem, 1.4vw, 1.2rem);
  line-height: 1.75;
  text-wrap: pretty;
}

.actions {
  margin-block-start: 2rem;

  p {
    margin-block-start: 0.9rem;
    color: var(--text-muted);
    font-size: 0.84rem;
  }
}

button {
  border: 1px solid var(--border);
  border-radius: 0.85rem;
  padding-inline: 1.15rem;
  background: var(--surface-raised);
  color: var(--text);
  font-weight: 720;
  cursor: pointer;
  transition:
    translate 150ms ease,
    border-color 150ms ease,
    background-color 150ms ease;

  &:hover:not(:disabled) {
    border-color: var(--accent-strong);
    translate: 0 -0.1rem;
  }
}

.primary {
  border-color: var(--accent);
  background: var(--accent);
  color: white;
}

.status-card,
.result-panel {
  margin-block-start: 2.5rem;
  border: 1px solid var(--border);
  border-radius: 1.25rem;
  background: var(--surface);
  box-shadow: 0 1.25rem 3rem var(--shadow);
}

.status-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;

  &.error {
    justify-content: space-between;
    border-color: var(--danger);

    strong {
      color: var(--danger);
    }

    p {
      margin-block-start: 0.25rem;
      color: var(--text-muted);
    }
  }
}

.loader {
  inline-size: 1.2rem;
  aspect-ratio: 1;
  border: 0.18rem solid var(--border);
  border-block-start-color: var(--accent);
  border-radius: 50%;
  animation: spin 800ms linear infinite;
  --animation-reduced: none;
}

@keyframes spin {
  to {
    rotate: 1turn;
  }
}

.result-panel {
  overflow: hidden;
}

.result-summary {
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem;
  border-block-end: 1px solid var(--border);

  h2 {
    margin-block-start: 0.15rem;
    font-size: 1.6rem;
  }
}

.success-label {
  color: var(--success);
  font-size: 0.78rem;
  font-weight: 750;
  text-transform: uppercase;
}

.result-actions {
  gap: 0.5rem;
}

.search-field {
  display: grid;
  gap: 0.4rem;
  padding: 1.25rem 1.25rem 0;
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 680;

  input {
    min-block-size: 2.75rem;
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    padding-inline: 0.9rem;
    background: var(--surface-soft);
    color: var(--text);
  }
}

.result-count {
  padding: 1rem 1.25rem 0.6rem;
}

.guild-list {
  max-block-size: 25rem;
  overflow-y: auto;
  padding: 0;
  list-style: none;
  scrollbar-color: var(--border) transparent;

  li {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.75rem;
    padding: 0.8rem 1.25rem;

    &:not(:last-child) {
      border-block-end: 1px solid var(--border);
    }

    code {
      grid-column: 2 / -1;
      color: var(--text-muted);
      font-size: 0.72rem;
      overflow-wrap: anywhere;
    }
  }
}

.guild-avatar {
  display: grid;
  grid-row: 1 / 3;
  place-items: center;
  inline-size: 2.5rem;
  aspect-ratio: 1;
  border-radius: 0.8rem;
  background: var(--surface-soft);
  color: var(--accent-strong);
  font-weight: 800;
}

.guild-name {
  min-inline-size: 0;
  overflow: hidden;
  font-weight: 680;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.owner-badge {
  border: 1px solid color-mix(in oklab, var(--accent), transparent 60%);
  border-radius: 999px;
  padding: 0.15rem 0.5rem;
  color: var(--accent-strong);
  font-size: 0.68rem;
  font-weight: 750;
}

.empty-state {
  padding: 2.5rem 1.25rem;
  color: var(--text-muted);
  text-align: center;
}

aside {
  display: grid;
  align-content: start;
  gap: 0;

  article {
    padding-block: 1.5rem;
    border-block-start: 1px solid var(--border);

    &:last-child {
      border-block-end: 1px solid var(--border);
    }
  }

  h2 {
    margin-block-start: 0.45rem;
    font-size: 1.1rem;
  }

  p {
    margin-block-start: 0.4rem;
    color: var(--text-muted);
    font-size: 0.9rem;
    line-height: 1.65;
    text-wrap: pretty;
  }
}

footer {
  justify-content: space-between;
  gap: 2rem;
  padding-block: 1.5rem 2rem;
  border-block-start: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 0.75rem;
}

@media (max-width: 52rem) {
  main {
    grid-template-columns: 1fr;
  }

  aside {
    grid-template-columns: repeat(3, 1fr);

    article {
      padding-inline: 1rem;
      border-block-end: 1px solid var(--border);
    }
  }
}

@media (max-width: 38rem) {
  .page-shell {
    inline-size: min(100% - 1.25rem, 76rem);
  }

  .utility-label {
    display: none;
  }

  main {
    padding-block-start: 3rem;
  }

  .result-summary,
  footer {
    align-items: stretch;
    flex-direction: column;
  }

  .result-actions button {
    flex: 1;
  }

  aside {
    grid-template-columns: 1fr;

    article {
      padding-inline: 0;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .loader {
    animation: var(--animation-reduced);
  }
}
</style>
