/* ============================================================
   NEKO - WHO IS THE SPY v3 (Final: Clean Setup, Premium Cards)
   ============================================================ */

(() => {
  'use strict';

  const Neko = window.Neko;
  if (!Neko) return;

  Neko.games = Neko.games || {};

  const STORAGE_KEY = 'neko_spy_roster_v3';

  const esc = Neko.util?.esc || (v =>
    String(v ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;',
      '"': '&quot;', "'": '&#039;'
    })[c])
  );

  const icon = name => {
    try { return Neko.icons?.icon?.(name) || ''; } catch { return ''; }
  };

  const sound = name => {
    try { Neko.audio?.play?.(name); } catch {}
  };

  function getPack() { return window.NekoAvatarPack || null; }

  function getCharacters() {
    const pack = getPack();
    if (!pack || !Array.isArray(pack.AVATARS)) return [];
    return pack.AVATARS.map(a => ({ id: a.id, name: a.name || a.id, pack: a.pack }));
  }

  function avatar(id, cls = '', expression = 'idle') {
    const pack = getPack();
    if (pack && pack.has?.(id)) {
      try { return pack.av(id, expression, `spy-avatar ${cls}`); } catch (e) {}
    }
    return `<span class="spy-avatar-fallback">${icon('user')}</span>`;
  }

  function readSaved() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; }
  }

  function saveSaved(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
  }

  Neko.games.spy = {
    mount(ctx) {
      const characters = getCharacters();
      const categories = window.NEK_SPY?.categories || [];

      if (!characters.length || !categories.length) {
        ctx.finish({ title: 'Data game belum tersedia', message: 'Pastikan avatars.js dan data/spy.js sudah dimuat.', score: 0, won: false, xp: 0, stats: [] });
        return;
      }

      const saved = readSaved();
      const rounds = Math.max(1, Number(ctx.config?.rounds) || 1);

      let roster = [];
      let categoryChoice = saved?.category || 'all';
      let discussionTime = Number(saved?.time ?? 60);
      let spyMode = saved?.mode === 'clue' ? 'clue' : 'label';

      let round = 1;
      let score = 0;
      let history = [];
      let timer = null;
      let overlay = null;
      let ended = false;

      const validIds = new Set(characters.map(c => c.id));

      if (Array.isArray(saved?.roster) && saved.roster.length >= 3) {
        const used = new Set();
        roster = saved.roster.slice(0, 30).map((p, i) => {
          let char = p.char;
          if (!validIds.has(char) || used.has(char)) {
            char = characters.find(c => !used.has(c.id))?.id;
          }
          if (char) used.add(char);
          return {
            name: String(p.name || `Pemain ${i + 1}`).slice(0, 16),
            char,
            mood: getPack()?.moodOf?.(p.mood) || 'idle'
          };
        }).filter(p => p.char);
      }

      if (roster.length < 3) {
        const total = Math.max(3, Math.min(30, Number(ctx.config?.players) || 4));
        const firstName = ctx.store?.session?.displayName || 'Kamu';
        roster = Array.from({ length: total }, (_, i) => ({
          name: i === 0 ? firstName : `Pemain ${i + 1}`,
          char: characters[i].id,
          mood: i === 0 ? 'happy' : 'idle'
        }));
      }

      function persist() {
        saveSaved({ roster, category: categoryChoice, time: discussionTime, mode: spyMode });
      }

      function stopTimer() {
        if (timer) clearInterval(timer);
        timer = null;
      }

      function cleanup() {
        stopTimer();
        overlay?.remove();
        overlay = null;
        document.getElementById('spy-discussion-overlay')?.remove();
      }

      ctx.cleanup(cleanup);

      function getCharacter(id) {
        return characters.find(c => c.id === id) || characters[0];
      }

      function moodOfPlayer(p) {
        return getPack()?.moodOf?.(p?.mood) || 'idle';
      }

      function setHeader(subtitle) {
        ctx.setSub(subtitle || `Putaran ${round} dari ${rounds}`);
        ctx.setHUD([
          { icon: 'users', label: `${roster.length} pemain` },
          { icon: 'spy', label: 'Who Is The Spy' }
        ]);
      }

      function showCharacterPicker(playerIndex, onClose) {
        const player = roster[playerIndex];
        if (!player) return;

        overlay?.remove();

        const owner = new Map();
        roster.forEach((p, i) => {
          if (i !== playerIndex && p.char) owner.set(p.char, p.name);
        });

        const pack = getPack();
        const moodLabel = m => pack?.MOODS?.[m]?.label || m;
        const moodNow = () => player.mood || 'idle';

        const groups = (pack?.PACKS || [])
          .map(group => ({ group, list: characters.filter(c => c.pack === group.id) }))
          .filter(g => g.list.length);

        const gridHTML = groups.length
          ? groups.map(g => `
            <div class="spy-picker-group" style="margin-bottom:6px">
              <p class="spy-picker-label" style="font-size:8.5px;margin-bottom:4px">${icon(g.group.icon)}${esc(g.group.name)}</p>
              <div class="spy-character-grid">
                ${g.list.map(c => characterOption(c, player, owner)).join('')}
              </div>
            </div>
          `).join('')
          : `<div class="spy-character-grid">${characters.map(c => characterOption(c, player, owner)).join('')}</div>`;

        overlay = document.createElement('div');
        overlay.className = 'spy-character-overlay';

        overlay.innerHTML = `
          <div class="spy-character-modal">
            <div class="spy-modal-heading">
              <div>
                <small style="font-size:8px;color:var(--muted)">PILIH KARAKTER</small>
                <h3 style="font-size:14px">${esc(player.name)}</h3>
              </div>
              <button type="button" data-close-picker aria-label="Tutup" style="width:24px;height:24px">${icon('x')}</button>
            </div>

            <div class="spy-picker-preview" style="padding:6px 8px;margin-bottom:6px">
              <span class="spy-picker-face" style="width:36px;height:36px">${avatar(player.char, 'spy-picker-image', moodNow())}</span>
              <div style="min-width:0">
                <b data-preview-name style="font-size:12px">${esc(getCharacter(player.char).name)}</b>
                <small data-preview-mood style="font-size:10px">${esc(moodLabel(moodNow()))}</small>
              </div>
            </div>

            ${gridHTML}
          </div>
        `;

        document.body.appendChild(overlay);

        const close = () => {
          overlay?.remove();
          overlay = null;
          if (typeof onClose === 'function') onClose();
          else renderSetup();
        };
        overlay.querySelector('[data-close-picker]').onclick = close;
        overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

        overlay.querySelectorAll('[data-char]').forEach(button => {
          button.onclick = () => {
            const id = button.dataset.char;
            if (owner.has(id)) return;
            player.char = id;
            persist();
            sound('select');

            overlay.querySelector('[data-preview-name]').textContent = getCharacter(id).name;
            overlay.querySelectorAll('[data-char]').forEach(other => {
              other.classList.toggle('selected', other.dataset.char === id);
            });
            overlay.querySelector('.spy-picker-face').innerHTML = avatar(id, 'spy-picker-image', moodNow());
          };
        });
      }

      function characterOption(c, player, owner) {
        const takenBy = owner.get(c.id);
        return `
          <button type="button" class="spy-character-option ${player.char === c.id ? 'selected' : ''} ${takenBy ? 'is-taken' : ''}" data-char="${esc(c.id)}" ${takenBy ? 'disabled' : ''}>
            ${avatar(c.id, 'spy-character-image', player.mood || 'idle')}
            <span>${esc(c.name)}</span>
          </button>
        `;
      }

      // --- BAGIAN YANG DIPERBARUI: TOMBOL PENGATURAN ---
      function choiceSection(title, name, options, selected) {
        return `
          <section class="spy-choice-section">
            <div class="spy-choice-title">
              <strong>${title}</strong>
            </div>
            <div class="spy-choice-options">
              ${options.map(o => `
                <label class="spy-choice-card ${String(o.value) === String(selected) ? 'active' : ''}">
                  <input type="radio" name="${name}" value="${esc(o.value)}" ${String(o.value) === String(selected) ? 'checked' : ''}>
                  <span class="spy-choice-copy">
                    <b>${o.label}</b>
                  </span>
                </label>
              `).join('')}
            </div>
          </section>
        `;
      }

      function renderSetup() {
        setHeader('Atur pemain dan permainan');

        const categoryOptions = [
          { value: 'all', label: 'Semua' },
          ...categories.map(c => ({ value: c.id, label: c.name }))
        ];

        const timeOptions = [
          { value: 0, label: 'Bebas' },
          { value: 30, label: '30 dtk' },
          { value: 60, label: '60 dtk' },
          { value: 90, label: '90 dtk' }
        ];

        const modeOptions = [
          { value: 'label', label: 'SPY + Clue' },
          { value: 'clue', label: 'Clue Saja' }
        ];

        ctx.setStage(`
          <div class="g-panel spy-setup-panel" id="spySetupRoot">
            <div class="g-title">
              <div>
                <span class="g-sub">WHO IS THE SPY</span>
                <h2>Atur Pemain</h2>
              </div>
            </div>

            <div class="spy-settings-panel">
              ${choiceSection('Kategori', 'spy-category', categoryOptions, categoryChoice)}
              ${choiceSection('Waktu', 'spy-time', timeOptions, discussionTime)}
              ${choiceSection('Mode', 'spy-mode', modeOptions, spyMode)}
            </div>

            <div class="spy-roster-heading">
              <div>
                <span class="g-sub">DAFTAR PEMAIN</span>
                <h3>Pemain (${roster.length}/30)</h3>
              </div>
            </div>

            <div class="spy-roster">
              ${roster.map((p, i) => `
                <div class="spy-player-row">
                  <button type="button" class="spy-avatar-button" data-picker="${i}" title="Ganti avatar">
                    ${avatar(p.char, 'spy-player-avatar', moodOfPlayer(p))}
                  </button>
                  <div class="spy-player-info">
                    <label>Nama</label>
                    <input type="text" maxlength="16" value="${esc(p.name)}" data-name="${i}">
                  </div>
                  ${i === 0
                    ? '<span class="spy-you-label">Kamu</span>'
                    : `<button type="button" class="spy-remove" data-remove="${i}">Hapus</button>`}
                </div>
              `).join('')}
            </div>

            <div class="spy-setup-actions" style="margin-top:8px">
              ${roster.length < 30 ? `<button type="button" class="btn btn-ghost" data-add>${icon('plus')} Tambah</button>` : ''}
              <button type="button" class="btn btn-primary" data-start>${icon('play')} Mulai</button>
            </div>
          </div>
        `);

        const rootEl = document.getElementById('spySetupRoot');
        if (!rootEl) return;

        rootEl.oninput = (e) => {
          const input = e.target.closest('[data-name]');
          if (input) {
            roster[Number(input.dataset.name)].name = input.value;
            persist();
          }
        };

        rootEl.onclick = (e) => {
          const pickerBtn = e.target.closest('[data-picker]');
          if (pickerBtn) {
            showCharacterPicker(Number(pickerBtn.dataset.picker));
            return;
          }

          const removeBtn = e.target.closest('[data-remove]');
          if (removeBtn) {
            if (roster.length <= 3) {
              Neko.ui?.toast?.('Minimal 3 pemain', 'Tambahkan pemain.', 'error');
              return;
            }
            roster.splice(Number(removeBtn.dataset.remove), 1);
            persist();
            renderSetup();
            return;
          }

          const addBtn = e.target.closest('[data-add]');
          if (addBtn) {
            if (roster.length >= 30) return;
            const used = new Set(roster.map(p => p.char));
            const available = characters.find(c => !used.has(c.id));
            if (!available) return;
            roster.push({ name: `Pemain ${roster.length + 1}`, char: available.id, mood: 'idle' });
            persist();
            renderSetup();
            return;
          }

          const startBtn = e.target.closest('[data-start]');
          if (startBtn) {
            if (roster.length < 3) return;
            roster.forEach((p, i) => { p.name = String(p.name || '').trim() || `Pemain ${i + 1}`; });
            persist();
            playRound();
            return;
          }
        };

        rootEl.onchange = (e) => {
          const catInp = e.target.closest('[name="spy-category"]');
          if (catInp) { categoryChoice = catInp.value; persist(); renderSetup(); return; }

          const timeInp = e.target.closest('[name="spy-time"]');
          if (timeInp) { discussionTime = Number(timeInp.value); persist(); renderSetup(); return; }

          const modeInp = e.target.closest('[name="spy-mode"]');
          if (modeInp) { spyMode = modeInp.value; persist(); renderSetup(); return; }
        };
      }

      function pick(list) {
        return list[Math.floor(Math.random() * list.length)];
      }

      function playRound() {
        if (ended) return;
        stopTimer();

        const pool = categoryChoice === 'all' ? categories : categories.filter(c => c.id === categoryChoice);
        const category = pick(pool);
        const pair = pick(category?.pairs);
        const word = pair[0];
        const clue = pair[1];
        const spyIndex = Math.floor(Math.random() * roster.length);
        let playerIndex = 0;

        setHeader(`Putaran ${round} dari ${rounds}`);

        function nextPlayer() {
          if (playerIndex >= roster.length) {
            startDiscussion(spyIndex, word, clue, category.name);
            return;
          }

          const player = roster[playerIndex];
          const isSpy = playerIndex === spyIndex;

          Promise.resolve(ctx.pass(`
            <div class="spy-pass-card">
              <div class="spy-pass-avatar-stage">
                ${avatar(player.char, 'spy-pass-avatar', moodOfPlayer(player))}
              </div>
              <span class="g-sub">GILIRAN PEMAIN ${playerIndex + 1}</span>
              <h2>Oper ke ${esc(player.name)}</h2>
            </div>
          `, '', 'Ketuk siap.'))
          .then(() => { reveal(player, isSpy, isSpy ? clue : word, category.name); });
        }

        function reveal(player, isSpy, secret, categoryName) {
          const isSpyKnown = isSpy && spyMode === 'label';

          ctx.setStage(`
            <div class="g-panel g-center spy-reveal-screen" id="spyRevealRoot">
              <div class="spy-current-player">
                <button type="button" class="spy-current-avatar-btn" data-reveal-pick title="Ganti">
                  <span class="spy-current-avatar-inner">${avatar(player.char, 'spy-current-avatar', moodOfPlayer(player))}</span>
                </button>
                <div class="spy-current-info">
                  <span class="spy-current-label">KARTU RAHASIA</span>
                  <strong class="spy-current-name">${esc(player.name)}</strong>
                </div>
              </div>

              <button type="button" class="spy-secret-card ${isSpy ? 'is-spy-card' : 'is-civ-card'}" data-secret>
                <span class="spy-secret-front">
                  <span class="spy-secret-icon">${icon('eye')}</span>
                  <small>KARTU RAHASIA</small>
                  <strong>Ketuk Buka</strong>
                  <small class="spy-secret-hint">Jangan sampai terlihat orang lain</small>
                </span>
                <span class="spy-secret-back">
                  ${isSpyKnown ? '<span class="spy-role-badge-big">SPY</span>' : ''}
                  <strong class="spy-secret-word">${esc(secret)}</strong>
                  <span class="spy-secret-topic">Topik · <b>${esc(categoryName)}</b></span>
                </span>
              </button>

              <div data-secret-action></div>
            </div>
          `);

          const panel = document.getElementById('spyRevealRoot');
          if (!panel) return;

          panel.querySelector('[data-reveal-pick]').onclick = () => {
            showCharacterPicker(playerIndex, () => {
              const inner = panel.querySelector('.spy-current-avatar-inner');
              if (inner) inner.innerHTML = avatar(player.char, 'spy-current-avatar', moodOfPlayer(player));
            });
          };

          const card = panel.querySelector('[data-secret]');
          card.onclick = () => {
            if (card.classList.contains('revealed')) return;
            card.classList.add('revealed');
            sound('reveal');
            panel.querySelector('[data-secret-action]').innerHTML = `
              <button type="button" class="btn btn-primary" data-done style="margin-top:6px;padding:8px 18px;font-size:12.5px">Lanjut</button>
            `;
            panel.querySelector('[data-done]').onclick = () => { playerIndex++; nextPlayer(); };
          };
        }

        nextPlayer();
      }

      function startDiscussion(spyIndex, word, clue, categoryName) {
        stopTimer();
        let left = discussionTime;
        let moved = false;

        function removeOverlay() { document.getElementById('spy-discussion-overlay')?.remove(); }
        function proceed() {
          if (moved) return;
          moved = true;
          stopTimer();
          removeOverlay();
          voting(spyIndex, word, clue, categoryName);
        }

        removeOverlay();
        const ov = document.createElement('div');
        ov.id = 'spy-discussion-overlay';
        ov.className = 'spy-disc-overlay';
        ov.innerHTML = `
          <div class="spy-disc-top">
            <button type="button" class="spy-disc-exit" data-disc-exit>${icon('x')} Keluar</button>
            ${left > 0
              ? `<div class="spy-disc-timer"><strong data-disc-value>${left}</strong><small>dtk</small></div>`
              : '<div class="spy-disc-timer is-free"><strong>∞</strong><small>Bebas</small></div>'}
          </div>
          <div class="spy-disc-main">
            <div class="spy-disc-head">
              <span class="spy-disc-kicker">DISKUSI</span>
              <h2>Cari Penyusup</h2>
            </div>
            <div class="spy-disc-players">
              ${roster.map((p, i) => `
                <button type="button" class="spy-disc-player" data-disc-pick="${i}">
                  <span class="spy-disc-avatar-wrap">${avatar(p.char, 'spy-disc-avatar', moodOfPlayer(p))}</span>
                  <span>${esc(p.name)}</span>
                </button>
              `).join('')}
            </div>
          </div>
          <div class="spy-disc-foot">
            <button type="button" class="btn btn-primary spy-disc-vote" data-disc-vote>${icon('check-circle')} Voting</button>
          </div>
        `;
        document.body.appendChild(ov);

        ov.querySelector('[data-disc-exit]').onclick = proceed;
        ov.querySelector('[data-disc-vote]').onclick = proceed;
        ov.querySelectorAll('[data-disc-pick]').forEach(btn => {
          btn.onclick = () => {
            const idx = Number(btn.dataset.discPick);
            showCharacterPicker(idx, () => {
              const p = roster[idx];
              if (btn && btn.isConnected) {
                btn.innerHTML = `<span class="spy-disc-avatar-wrap">${avatar(p.char, 'spy-disc-avatar', moodOfPlayer(p))}</span><span>${esc(p.name)}</span>`;
              }
            });
          };
        });

        if (left > 0) {
          const valueEl = ov.querySelector('[data-disc-value]');
          timer = setInterval(() => {
            left--;
            if (valueEl) valueEl.textContent = String(Math.max(0, left));
            if (left <= 0) { stopTimer(); proceed(); }
          }, 1000);
        }
        ctx.setStage(`<div class="g-panel g-center"><p>Diskusi aktif...</p></div>`);
      }

      function voting(spyIndex, word, clue, categoryName) {
        stopTimer();
        const votes = Array(roster.length).fill(0);
        let voter = 0;
        let locked = false;

        function renderVoter() {
          if (voter >= roster.length) { showResults(); return; }
          locked = false;
          const current = roster[voter];

          ctx.setStage(`
            <div class="g-panel spy-voting-screen" id="spyVoteRoot">
              <span class="g-sub">VOTING (${voter + 1}/${roster.length})</span>
              <h2>Pilih: ${esc(current.name)}</h2>
              <div class="spy-vote-grid">
                ${roster.map((p, i) => `
                  <button type="button" class="spy-vote-card" data-vote="${i}" ${i === voter ? 'disabled' : ''}>
                    <span class="spy-result-avatar-wrap">${avatar(p.char, 'spy-result-avatar', moodOfPlayer(p))}</span>
                    <strong>${esc(p.name)}</strong>
                    ${i === voter ? '<small class="spy-self">Kamu</small>' : ''}
                  </button>
                `).join('')}
              </div>
            </div>
          `);

          const panel = document.getElementById('spyVoteRoot');
          if (!panel) return;

          panel.querySelectorAll('[data-vote]').forEach(btn => {
            btn.onclick = () => {
              if (locked) return;
              locked = true;
              const target = Number(btn.dataset.vote);
              if (target === voter) { locked = false; return; }
              votes[target]++;
              sound('select');

              const last = voter === roster.length - 1;
              ctx.setStage(`
                <div class="g-panel g-center spy-vote-confirmation" id="spyConfirmRoot">
                  <span class="g-sub">SUARA TERCATAT</span>
                  <h2>Tersimpan!</h2>
                  <button type="button" class="btn btn-primary" data-next-voter style="margin-top:6px;padding:6px 12px;font-size:12px">
                    ${last ? 'Lihat Hasil' : 'Berikutnya'} ${icon('arrow-right')}
                  </button>
                </div>
              `);
              document.getElementById('spyConfirmRoot')?.querySelector('[data-next-voter]').addEventListener('click', () => {
                voter++;
                renderVoter();
              });
            };
          });
        }
        renderVoter();

        function showResults() {
          const resultData = roster.map((p, i) => ({
            player: p,
            index: i,
            votes: votes[i]
          })).sort((a, b) => b.votes - a.votes || a.index - b.index);

          const highestVotes = resultData[0].votes;
          const winners = resultData.filter(d => d.votes === highestVotes);
          const tie = winners.length !== 1;
          const eliminatedIndex = tie ? -1 : winners[0].index;
          const caught = !tie && eliminatedIndex === spyIndex;

          if (caught) score += 100;
          history.push({ round, spy: roster[spyIndex].name, caught, tie });

          const moodFor = (index) => {
            const isSpy = index === spyIndex;
            if (isSpy) return caught ? 'sad' : 'happy';
            if (!tie && index === eliminatedIndex) return 'sad';
            return moodOfPlayer(roster[index]) || 'idle';
          };

          const spyPlayer = roster[spyIndex];

          ctx.setStage(`
            <div class="g-panel spy-results-screen" id="spyResultRoot">
              <div class="spy-results-head">
                <span class="g-sub">HASIL PUTARAN ${round}</span>
                <h2>${tie ? 'Suara Seri!' : caught ? 'Penyusup Tertangkap!' : 'Penyusup Lolos!'}</h2>
                <p>${tie
                  ? `Tidak ada yang tereliminasi. Penyusup adalah <b>${esc(spyPlayer.name)}</b>.`
                  : caught
                    ? `<b>${esc(spyPlayer.name)}</b> adalah penyusup dan berhasil tertangkap.`
                    : `Penyusup sebenarnya adalah <b>${esc(spyPlayer.name)}</b> dan berhasil lolos.`}</p>
              </div>

              <div class="spy-result-votes">
                <h3>Papan Peringkat Suara</h3>
                ${resultData.map((d, rank) => {
                  const isSpy = d.index === spyIndex;
                  const isTop = rank === 0 && !tie && d.votes > 0;
                  return `
                    <div class="spy-result-vote-row ${isSpy ? 'is-spy' : ''} ${isTop ? 'is-winner' : ''}">
                      <span class="spy-rank ${isTop ? 'is-top' : ''}">${rank + 1}</span>
                      <span class="spy-result-avatar-wrap">${avatar(d.player.char, 'spy-result-avatar', moodFor(d.index))}</span>
                      <span class="spy-result-name">${esc(d.player.name)}</span>
                      <span class="spy-result-votes-count">${d.votes}<small>suara</small></span>
                      ${isSpy ? '<span class="spy-result-tag">Spy</span>' : ''}
                    </div>
                  `;
                }).join('')}
              </div>

              <button type="button" class="btn btn-primary spy-result-next" data-next-round>
                ${round >= rounds ? 'Selesai' : 'Putaran Berikutnya'} ${icon('arrow-right')}
              </button>
            </div>
          `);

          document.getElementById('spyResultRoot')
            ?.querySelector('[data-next-round]')
            ?.addEventListener('click', () => {
              round++;
              if (round > rounds) finish(); else playRound();
            });

          sound(caught ? 'win' : 'lose');
        }
      }

      function finish() {
        if (ended) return;
        ended = true;
        stopTimer();
        persist();
        const caught = history.filter(r => r.caught).length;
        ctx.finish({
          title: caught ? 'Permainan Selesai' : 'Penyusup Menang',
          message: `Penyusup tertangkap ${caught} kali.`,
          score, won: caught > 0, xp: 20 + Math.round(score / 5),
          stats: [{ label: 'Putaran', value: String(rounds) }, { label: 'Tertangkap', value: String(caught) }]
        });
      }

      renderSetup();
    }
  };
})();