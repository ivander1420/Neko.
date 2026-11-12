/* ============================================================
   NEKO · js/admin.js
   Panel Kontrol Administrator, Guru, Head Admin & Developer:
   - Mengubah papan informasi web
   - Mengirim pengumuman global
   - Manajemen akun: ubah role, gelar/title, sosmed, blokir akun
   - Sinkronisasi manual ke Supabase
   ============================================================ */
(function () {
  'use strict';

  const Neko = window.Neko = window.Neko || {};
  const { esc, timeAgo } = Neko.util;
  const { icon } = Neko.icons;

  const TYPES = [
    { id: 'info', label: 'Informasi' },
    { id: 'event', label: 'Acara' },
    { id: 'update', label: 'Pembaruan' },
    { id: 'reward', label: 'Hadiah' },
    { id: 'warning', label: 'Penting' }
  ];

  function myRole() {
    return (Neko.store.session && Neko.store.session.role) || 'Member';
  }

  function isSuper() {
    const r = myRole().toLowerCase();
    return r === 'developer' || r === 'head admin' || r === 'headadmin';
  }

  function canManage() {
    const r = myRole().toLowerCase();
    return isSuper() || r === 'admin' || r === 'president' || r === 'guru' || r === 'wali kelas';
  }

  function typeLabel(type) {
    const found = TYPES.find(item => item.id === type);
    return found ? found.label : 'Informasi';
  }

  function announcementList() {
    const list = Neko.community.announcements || [];
    if (!list.length) {
      return '<div class="empty-state admin-empty"><span class="empty-ic">' + icon('megaphone') + '</span><h3>Belum ada pengumuman</h3><p>Tulis pengumuman pertama untuk seluruh pengguna NEKO.</p></div>';
    }
    return '<div class="admin-ann-list">' + list.map(item => (
      '<article class="admin-ann" data-ann-id="' + esc(item.id) + '">' +
      '<div class="admin-ann-head"><span class="pill pill-accent">' + esc(typeLabel(item.type)) + '</span>' +
      '<b>' + esc(item.title) + '</b>' +
      '<span class="admin-ann-time">' + esc(timeAgo(item.time)) + '</span>' +
      '<button type="button" class="btn btn-ghost btn-sm admin-ann-del" data-ann-delete="' + esc(item.id) + '" aria-label="Hapus pengumuman">' + icon('trash') + '</button>' +
      '</div>' +
      '<p>' + esc(item.body) + '</p>' +
      '<small>' + esc(item.author || 'Admin') + ' · ' + esc(item.authorRole || 'Admin') + '</small>' +
      '</article>'
    )).join('') + '</div>';
  }

  function render() {
    const session = Neko.store.session || { displayName: 'Admin', role: 'Admin' };
    const info = Neko.community ? Neko.community.info : { title: '', body: '' };
    const players = Neko.community ? Neko.community.leaderboard().length : 0;
    const active = Neko.community ? Neko.community.activeCount() : 0;
    const superAdmin = isSuper();

    return (
      '<div class="page-head admin-head">' +
      '<div><span class="kicker">PANEL ' + esc(String(session.role).toUpperCase()) + (superAdmin ? ' · TERTINGGI (FULL AKSES)' : '') + '</span><h1>Pusat Manajemen NEKO</h1>' +
      '<p>Kelola konten web, pengumuman, data akun pengguna, dan sinkronisasi database.</p></div>' +
      '<div class="page-head-actions">' +
      '<button type="button" class="btn btn-primary" data-sync-supabase>' + icon('cloud') + 'Sinkronkan ke Supabase</button>' +
      '<button type="button" class="btn btn-soft" data-open-leaderboard>' + icon('ranking') + 'Leaderboard</button>' +
      '<button type="button" class="btn btn-ghost" data-admin-refresh>' + icon('refresh') + 'Muat ulang</button>' +
      '</div></div>' +

      '<div class="admin-stats">' +
      '<div class="admin-stat"><span>' + icon('users') + '</span><div><b>' + players + '</b><small>Peringkat terpantau</small></div></div>' +
      '<div class="admin-stat"><span>' + icon('bolt') + '</span><div><b>' + active + '</b><small>Aktif 5 menit terakhir</small></div></div>' +
      '<div class="admin-stat"><span>' + icon('megaphone') + '</span><div><b>' + (Neko.community.announcements.length) + '</b><small>Pengumuman tersimpan</small></div></div>' +
      '</div>' +

      '<div class="admin-grid">' +
      '<section class="card admin-card">' +
      '<div class="card-title">' + icon('note') + 'Papan informasi web</div>' +
      '<p class="card-sub">Tampil di beranda dan halaman profil semua pengguna.</p>' +
      '<form class="admin-form" data-admin-info>' +
      '<label class="field"><span>Judul informasi</span><input name="title" maxlength="80" required value="' + esc(info.title || '') + '" placeholder="Contoh: Jadwal praktikum minggu ini"></label>' +
      '<label class="field"><span>Isi informasi</span><textarea name="body" maxlength="500" required placeholder="Tulis informasi singkat dan jelas…">' + esc(info.body || '') + '</textarea></label>' +
      '<button class="btn btn-primary" type="submit">' + icon('check') + 'Simpan informasi</button>' +
      '</form>' +
      '</section>' +

      '<section class="card admin-card">' +
      '<div class="card-title">' + icon('megaphone') + 'Pengumuman baru</div>' +
      '<p class="card-sub">Muncul sebagai notifikasi di perangkat pengguna dan di kotak masuk NEKO.</p>' +
      '<form class="admin-form" data-admin-announce>' +
      '<label class="field"><span>Judul</span><input name="title" maxlength="80" required placeholder="Contoh: Turnamen arena Jumat"></label>' +
      '<label class="field"><span>Isi pesan</span><textarea name="body" maxlength="400" required placeholder="Tulis pesan untuk semua pengguna…"></textarea></label>' +
      '<label class="field"><span>Jenis</span><select name="type">' + TYPES.map(item => '<option value="' + item.id + '">' + item.label + '</option>').join('') + '</select></label>' +
      '<button class="btn btn-primary" type="submit">' + icon('send') + 'Kirim ke semua</button>' +
      '</form>' +
      '</section>' +
      '</div>' +

      /* Bagian Manajemen Pengguna */
      '<section class="card admin-card admin-users-card" style="margin-top:20px">' +
      '<div class="card-title" style="display:flex;justify-content:space-between;align-items:center">' +
      '<div>' + icon('profile') + 'Manajemen Akun & Role Pengguna</div>' +
      '<button type="button" class="btn btn-soft btn-sm" data-load-users>' + icon('refresh') + 'Muat Daftar Akun</button>' +
      '</div>' +
      '<p class="card-sub">Atur role (Developer, Head Admin, Guru, Wali Kelas, Custom), gelar/title akun, tautan media sosial, serta blokir/buka blokir.</p>' +
      '<div data-admin-users-table class="admin-users-table" style="overflow-x:auto;margin-top:12px">Tekan "Muat Daftar Akun" untuk melihat seluruh pengguna terdaftar.</div>' +
      '</section>' +

      '<section class="card admin-card admin-list-card" style="margin-top:20px">' +
      '<div class="card-title">' + icon('banner') + 'Daftar pengumuman</div>' +
      '<div data-admin-list>' + announcementList() + '</div>' +
      '</section>'
    );
  }

  async function loadUserList(container) {
    if (!container) return;
    container.innerHTML = '<div style="padding:16px;text-align:center"><span class="chip chip-soft">Memuat daftar akun…</span></div>';
    try {
      const res = await Neko.api.request('/api/admin/users', {
        method: 'POST',
        body: { action: 'list' }
      });
      if (!res.ok || !Array.isArray(res.users)) {
        container.innerHTML = '<p class="field-error">Gagal memuat pengguna: ' + esc(res.error || 'Akses ditolak') + '</p>';
        return;
      }

      const users = res.users;
      const canEdit = res.canFullEdit;

      container.innerHTML = (
        '<table class="table-compact" style="width:100%;font-size:0.88rem;border-collapse:collapse">' +
        '<thead><tr style="text-align:left;border-bottom:1px solid var(--line);opacity:0.8">' +
        '<th style="padding:8px">Pengguna</th>' +
        '<th style="padding:8px">Role</th>' +
        '<th style="padding:8px">Gelar / Title</th>' +
        '<th style="padding:8px">XP</th>' +
        '<th style="padding:8px">Status</th>' +
        '<th style="padding:8px">Aksi</th>' +
        '</tr></thead>' +
        '<tbody>' + users.map(u => {
          const socials = u.socials || {};
          const socText = [
            socials.ig ? 'IG: @' + socials.ig : '',
            socials.github ? 'GH: ' + socials.github : '',
            socials.discord ? 'DC: ' + socials.discord : ''
          ].filter(Boolean).join(' · ');

          return (
            '<tr style="border-bottom:1px solid var(--line-soft, rgba(255,255,255,0.06))" data-user-row="' + esc(u.username) + '">' +
            '<td style="padding:8px"><b>' + esc(u.displayName) + '</b><br><small style="opacity:0.7">@' + esc(u.username) + (u.email ? ' · ' + esc(u.email) : '') + '</small></td>' +
            '<td style="padding:8px"><span class="pill pill-accent">' + esc(u.role) + '</span></td>' +
            '<td style="padding:8px">' + esc(u.customTitle || '-') + '</td>' +
            '<td style="padding:8px">' + esc(u.xp) + '</td>' +
            '<td style="padding:8px">' + (u.blocked ? '<span style="color:var(--danger)">Diblokir</span>' : '<span style="color:var(--success)">Aktif</span>') + '</td>' +
            '<td style="padding:8px">' +
            '<button type="button" class="btn btn-ghost btn-sm" data-edit-user="' + esc(u.username) + '" style="margin-right:4px">' + icon('edit') + 'Edit</button>' +
            '<button type="button" class="btn btn-ghost btn-sm" data-toggle-block="' + esc(u.username) + '" data-blocked="' + String(u.blocked) + '">' +
            (u.blocked ? icon('check') + 'Buka' : icon('close') + 'Blokir') +
            '</button>' +
            '</td>' +
            '</tr>'
          );
        }).join('') +
        '</tbody></table>'
      );
    } catch (err) {
      container.innerHTML = '<p class="field-error">Error: ' + esc(err.message) + '</p>';
    }
  }

  function bind(root) {
    if (!root) return;

    const infoForm = root.querySelector('[data-admin-info]');
    if (infoForm) {
      infoForm.addEventListener('submit', async event => {
        event.preventDefault();
        const data = new FormData(infoForm);
        const button = infoForm.querySelector('button[type="submit"]');
        button.disabled = true;
        const result = await Neko.community.updateInfo({ title: data.get('title'), body: data.get('body') });
        button.disabled = false;
        if (result.ok) {
          Neko.audio.play('success');
          Neko.ui.toast('Informasi diperbarui', 'Papan informasi baru sudah tayang untuk semua pengguna.', 'success', 'note');
        } else {
          Neko.audio.play('error');
          Neko.ui.toast('Gagal menyimpan', 'Periksa judul dan isi informasi, lalu coba lagi.', 'error', 'warning');
        }
      });
    }

    const annForm = root.querySelector('[data-admin-announce]');
    if (annForm) {
      annForm.addEventListener('submit', async event => {
        event.preventDefault();
        const data = new FormData(annForm);
        const button = annForm.querySelector('button[type="submit"]');
        button.disabled = true;
        const result = await Neko.community.announce({
          title: data.get('title'),
          body: data.get('body'),
          type: data.get('type')
        });
        button.disabled = false;
        if (result.ok) {
          annForm.reset();
          Neko.audio.play('notify');
          Neko.ui.toast('Pengumuman terkirim', 'Pesanmu langsung muncul di kotak masuk semua pengguna.', 'success', 'megaphone');
          const list = root.querySelector('[data-admin-list]');
          if (list) list.innerHTML = announcementList();
        } else {
          Neko.audio.play('error');
          Neko.ui.toast('Gagal mengirim', 'Isi judul dan pesan terlebih dahulu.', 'error', 'warning');
        }
      });
    }

    // Tombol muat user
    const usersTable = root.querySelector('[data-admin-users-table]');
    const loadUsersBtn = root.querySelector('[data-load-users]');
    if (loadUsersBtn) {
      loadUsersBtn.addEventListener('click', () => loadUserList(usersTable));
    }

    // Tombol sinkronisasi ke Supabase
    const syncBtn = root.querySelector('[data-sync-supabase]');
    if (syncBtn) {
      syncBtn.addEventListener('click', async () => {
        syncBtn.disabled = true;
        Neko.ui.toast('Menghubungkan Supabase…', 'Mengirim seluruh data lokal ke cloud.', 'info', 'cloud');
        try {
          const res = await Neko.api.request('/api/sync-now', { method: 'POST' });
          if (res.ok) {
            Neko.audio.play('win');
            Neko.ui.toast('Sinkronisasi Sukses!', 'Snapshot terbaru sudah tersimpan di Supabase.', 'success', 'check');
          } else {
            Neko.audio.play('error');
            Neko.ui.toast('Sinkronisasi belum berhasil', res.error || 'Periksa kredensial Supabase.', 'error', 'warning');
          }
        } catch (err) {
          Neko.ui.toast('Gagal terhubung', err.message, 'error', 'warning');
        } finally {
          syncBtn.disabled = false;
        }
      });
    }

    root.addEventListener('click', async event => {
      // Hapus pengumuman
      const del = event.target.closest('[data-ann-delete]');
      if (del) {
        const id = del.dataset.annDelete;
        Neko.ui.dialog({
          title: 'Hapus pengumuman?',
          body: 'Pengumuman ini akan hilang untuk semua pengguna.',
          icon: 'trash',
          confirmText: 'Hapus',
          danger: true
        }).then(async ok => {
          if (!ok) return;
          await Neko.community.remove(id);
          Neko.audio.play('error');
          Neko.ui.toast('Pengumuman dihapus', 'Pesan sudah tidak tampil lagi.', 'info', 'trash');
          const list = root.querySelector('[data-admin-list]');
          if (list) list.innerHTML = announcementList();
        });
        return;
      }

      // Blokir / Buka blokir
      const blockBtn = event.target.closest('[data-toggle-block]');
      if (blockBtn) {
        const username = blockBtn.dataset.toggleBlock;
        const currentBlocked = blockBtn.dataset.blocked === 'true';
        const newBlocked = !currentBlocked;
        try {
          const res = await Neko.api.request('/api/admin/users', {
            method: 'POST',
            body: { action: 'update', username, blocked: newBlocked }
          });
          if (res.ok) {
            Neko.audio.play('tap');
            Neko.ui.toast('Status diubah', username + (newBlocked ? ' diblokir.' : ' diaktifkan kembali.'), 'info', 'profile');
            loadUserList(usersTable);
          } else {
            Neko.ui.toast('Gagal', res.error || 'Akses ditolak', 'error', 'warning');
          }
        } catch (err) {
          Neko.ui.toast('Error', err.message, 'error', 'warning');
        }
        return;
      }

      // Edit akun (Role, Title, Sosmed)
      const editBtn = event.target.closest('[data-edit-user]');
      if (editBtn) {
        const username = editBtn.dataset.editUser;
        const newRole = prompt('Ubah Role untuk @' + username + ':\n(Developer, Head Admin, Admin, Guru, Wali Kelas, Member, atau ketik custom role):');
        if (newRole === null) return;
        const newTitle = prompt('Gelar / Title khusus untuk @' + username + ' (contoh: Network Specialist, Ahli Subnet):');
        const ig = prompt('Instagram (username tanpa @):');

        const body = { action: 'update', username };
        if (newRole.trim()) body.role = newRole.trim();
        if (newTitle !== null) body.customTitle = newTitle.trim();
        if (ig !== null) body.socials = { ig: ig.trim() };

        try {
          const res = await Neko.api.request('/api/admin/users', {
            method: 'POST',
            body
          });
          if (res.ok) {
            Neko.audio.play('success');
            Neko.ui.toast('Akun diperbarui', 'Data akun @' + username + ' berhasil diubah.', 'success', 'check');
            loadUserList(usersTable);
          } else {
            Neko.ui.toast('Gagal mengubah', res.error || 'Akses ditolak', 'error', 'warning');
          }
        } catch (err) {
          Neko.ui.toast('Error', err.message, 'error', 'warning');
        }
        return;
      }

      if (event.target.closest('[data-admin-refresh]')) {
        await Neko.community.refresh({ force: true });
        Neko.app.refresh();
      }
    });
  }

  Neko.admin = { canManage, render, bind };
})();
