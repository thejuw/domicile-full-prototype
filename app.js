(function () {
  const navMemory = { today: 'today', map: 'map', places: 'places', explore: 'explore', you: 'you' };
  let current = 'today';

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return [...(root || document).querySelectorAll(sel)]; }

  const YOU_SCREENS = {
    'ledger': 1, 'move-planning': 1, 'move-checklist': 1, 'move-draft': 1, 'move-usps': 1,
    'permissions': 1, 'connections': 1, 'support': 1
  };

  window.go = function (name) {
    const next = $('[data-screen="' + name + '"]');
    if (!next) { console.warn('Missing screen:', name); return; }
    const prev = $('[data-screen="' + current + '"]');
    if (prev && prev !== next) {
      prev.classList.remove('active');
      prev.classList.add('exit-left');
      setTimeout(function () { prev.classList.remove('exit-left'); }, 300);
    }
    next.classList.add('active');
    current = name;
    const navKey = next.getAttribute('data-nav') || name;
    if (Object.prototype.hasOwnProperty.call(navMemory, navKey)) navMemory[navKey] = name;
    if (name === 'trips' || name.indexOf('trip-') === 0) navMemory.you = name;
    if (name.indexOf('host-') === 0 || name === 'place-home' || name.indexOf('place-') === 0) navMemory.places = name;
    if (name.indexOf('stays-') === 0 || name === 'listing-detail' || name === 'checkout' || name === 'confirmation' ||
        name.indexOf('services') === 0 || name.indexOf('events') === 0 || name.indexOf('packages') === 0 ||
        name.indexOf('sponsored') === 0 || name === 'service-inquiry') {
      navMemory.explore = name;
    }
    if (YOU_SCREENS[name]) navMemory.you = name;
    if (name === 'arrival-detail' || name === 'appointment-detail') navMemory.today = name;
    updateNav(navKey);
    next.scrollTop = 0;
    try { history.replaceState(null, '', '#' + name); } catch (e) {}
    if (name === 'move-checklist') renderRecipients();
    if (name === 'move-planning') updateMoveOverview();
    if (name === 'move-usps') syncUspsUi();
  };

  window.navTo = function (tab) {
    go(navMemory[tab] || tab);
  };

  function updateNav(activeTab) {
    $all('.nav-item').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-nav') === activeTab);
    });
  }

  window.toggleResults = function (mode) {
    var list = $('#results-list');
    var map = $('#results-map');
    var tl = $('#tog-list');
    var tm = $('#tog-map');
    if (mode === 'map') {
      list.classList.add('hide'); map.classList.remove('hide');
      tm.classList.add('on'); tl.classList.remove('on');
    } else {
      map.classList.add('hide'); list.classList.remove('hide');
      tl.classList.add('on'); tm.classList.remove('on');
    }
  };

  window.toggleLayer = function (btn) {
    btn.classList.toggle('on');
    var layer = btn.getAttribute('data-layer');
    $all('[data-map-layer="' + layer + '"]').forEach(function (el) {
      el.style.display = btn.classList.contains('on') ? '' : 'none';
    });
  };

  window.confirmBook = function (mode) {
    var title = $('#confirm-title');
    var sub = $('#confirm-sub');
    var pill = $('#trip-status-pill');
    var items = $all('#confirmation .tl-item');
    if (mode === 'request') {
      title.textContent = 'Request sent';
      sub.textContent = 'Waiting on host · Oak & Waller Loft';
      items[0].className = 'tl-item done';
      items[1].className = 'tl-item now';
      items[2].className = 'tl-item';
      $('#tl-confirmed-label').textContent = 'Confirmed';
      $('#tl-confirmed-sub').textContent = 'When Mira approves';
      if (pill) { pill.textContent = 'Requested'; pill.className = 'pill warn'; }
    } else {
      title.textContent = "You're booked";
      sub.textContent = 'Reservation confirmed · Oak & Waller Loft';
      items[0].className = 'tl-item done';
      items[1].className = 'tl-item done';
      items[2].className = 'tl-item now';
      $('#tl-confirmed-label').textContent = 'Confirmed';
      $('#tl-confirmed-sub').textContent = 'Instant book · payment authorized';
      if (pill) { pill.textContent = 'Confirmed'; pill.className = 'pill ok'; }
    }
    go('confirmation');
  };

  window.simulateUnlock = function () {
    $('#locked-address').classList.add('hide');
    $('#unlocked-address').classList.remove('hide');
    $('#countdown-card').classList.add('hide');
    toast('Address, house guide & access code revealed');
  };

  window.sendMsg = function () {
    var input = $('#msg-input');
    var text = (input.value || '').trim();
    if (!text) { toast('Type a message first'); return; }
    var thread = $('#msg-thread');
    var div = document.createElement('div');
    div.className = 'msg guest';
    div.innerHTML = text + '<div class="when">Just now</div>';
    thread.appendChild(div);
    input.value = '';
    thread.scrollTop = thread.scrollHeight;
  };

  window.selectVis = function (el, ok) {
    if (!ok) return;
    $all('.vis-option').forEach(function (v) {
      if (!v.classList.contains('disabled')) v.classList.remove('selected');
    });
    el.classList.add('selected');
  };

  window.toggleCheck = function (el) {
    el.classList.toggle('on');
    el.textContent = el.classList.contains('on') ? '✓' : '';
  };

  window.toggleRecipient = function (el) {
    el.classList.toggle('off');
    el.textContent = el.classList.contains('off') ? '' : '✓';
  };

  window.sendInquiry = function () {
    toast('Inquiry sent to Cedar & Stone Clean Co.');
    setTimeout(function () { go('services-list'); }, 900);
  };

  window.rsvpEvent = function () {
    var btn = $('#rsvp-btn');
    btn.textContent = 'Interest noted';
    btn.classList.add('disabled');
    toast('RSVP interest saved · organizer notified');
  };

  window.submitReview = function () {
    toast('Thanks — review submitted (prototype)');
    setTimeout(function () { go('trips'); }, 800);
  };

  /* ========== Move Engine (deterministic status; LLM drafts language only) ========== */
  var STATUS_LABEL = {
    'not-started': 'Not started',
    'draft-ready': 'Draft ready',
    'awaiting': 'Awaiting you',
    'queued': 'Queued',
    'submitted': 'Submitted',
    'confirmed': 'Confirmed',
    'excluded': 'Excluded'
  };
  var CHANNEL_LABEL = {
    official: 'Official form',
    email: 'Email draft',
    portal: 'Portal',
    manual: 'Manual'
  };

  var moveRecipients = [
    { id: 'usps', name: 'USPS', detail: 'Change of address · identity on USPS', channel: 'official', status: 'not-started', selected: true, action: 'usps' },
    { id: 'hoa', name: 'Holly Grove / Cedar Grove HOA', detail: 'Leave notice · stop dues routing', channel: 'email', status: 'draft-ready', selected: true, action: 'draft',
      to: 'management@hollygrove.example',
      subject: 'Address change notice — Unit 204 effective Nov 1, 2026',
      body: 'Hello Holly Grove management,\n\nI\'m writing to confirm that I will be moving out of Unit 204 at East Cesar Chavez Cottage. My forwarding / new residence is South Lamar loft, Austin, TX, effective November 1, 2026.\n\nPlease update your records for mail, dues, and access accordingly. I\'m happy to schedule a final walkthrough.\n\nThank you,\nAL' },
    { id: 'landlord', name: 'South Lamar Property Mgmt', detail: 'New lease address on file', channel: 'email', status: 'draft-ready', selected: true, action: 'draft',
      to: 'leasing@southlamar.example',
      subject: 'Resident address confirmation — move-in Nov 1, 2026',
      body: 'Hello Property Management,\n\nPlease confirm my mailing and account address for the South Lamar loft as of November 1, 2026. Prior residence: East Cesar Chavez Cottage, Austin, TX.\n\nHappy to provide any lease or ID docs you need.\n\nBest,\nAL' },
    { id: 'electric', name: 'Austin Energy', detail: 'Service address transfer', channel: 'portal', status: 'submitted', selected: true, action: 'portal' },
    { id: 'internet', name: 'Fiber / internet', detail: 'Disconnect & install window', channel: 'portal', status: 'not-started', selected: true, action: 'portal' },
    { id: 'bank', name: 'Bank / credit union', detail: 'Statement mailing address', channel: 'manual', status: 'confirmed', selected: true, action: 'manual', locked: true },
    { id: 'employer', name: 'Employer HR', detail: 'Payroll & W-2 address', channel: 'email', status: 'submitted', selected: true, action: 'draft',
      to: 'hr@employer.example',
      subject: 'Home address update effective Nov 1, 2026',
      body: 'Hi HR,\n\nPlease update my home address on file to South Lamar loft, Austin, TX, effective November 1, 2026. Prior address: East Cesar Chavez Cottage.\n\nThanks,\nAL' },
    { id: 'subs', name: 'Subscriptions', detail: 'Streaming, magazines, boxes', channel: 'manual', status: 'not-started', selected: true, action: 'manual' }
  ];

  var suggestedPool = [
    { id: 'dmv', name: 'Texas DMV', detail: 'Driver license / vehicle registration', channel: 'official', status: 'not-started', selected: true, action: 'manual', suggested: true },
    { id: 'voter', name: 'Voter registration', detail: 'County elections office', channel: 'official', status: 'not-started', selected: true, action: 'manual', suggested: true }
  ];
  var suggestionsAdded = false;
  var activeDraftId = 'hoa';
  var draftEditing = false;

  function notifiedCount() {
    return moveRecipients.filter(function (r) {
      return r.selected && (r.status === 'submitted' || r.status === 'confirmed' || r.status === 'queued');
    }).length;
  }
  function selectedCount() {
    return moveRecipients.filter(function (r) { return r.selected; }).length;
  }

  function updateMoveOverview() {
    var n = notifiedCount();
    var sel = selectedCount() || 1;
    var pct = Math.round((n / sel) * 100);
    var awaiting = moveRecipients.filter(function (r) {
      return r.selected && (r.status === 'awaiting' || r.status === 'draft-ready');
    }).length;
    var elN = $('#move-progress-n');
    var elPct = $('#move-progress-pct');
    var elBar = $('#move-progress-bar');
    var meta = $('#you-move-meta');
    var elA = $('#move-awaiting-n');
    if (elN) elN.textContent = n + '/' + sel;
    if (elPct) elPct.textContent = pct + '%';
    if (elBar) elBar.style.width = pct + '%';
    if (meta) meta.textContent = n + '/' + sel;
    if (elA) elA.textContent = String(awaiting);
  }

  function statusClass(st) {
    if (st === 'awaiting') return 'awaiting';
    if (st === 'draft-ready') return 'draft-ready';
    if (st === 'not-started') return 'not-started';
    if (st === 'queued') return 'queued';
    if (st === 'submitted') return 'submitted';
    if (st === 'confirmed') return 'confirmed';
    if (st === 'excluded') return 'excluded';
    return 'not-started';
  }

  function renderRecipients() {
    var list = $('#move-recipient-list');
    var sugList = $('#move-suggested-list');
    var sugLabel = $('#move-suggested-label');
    if (!list) return;
    list.innerHTML = '';
    moveRecipients.filter(function (r) { return !r.suggested; }).forEach(function (r) {
      list.appendChild(recipientRow(r));
    });
    var suggested = moveRecipients.filter(function (r) { return r.suggested; });
    if (sugList && sugLabel) {
      if (suggested.length) {
        sugList.classList.remove('hide');
        sugLabel.classList.remove('hide');
        sugList.innerHTML = '';
        suggested.forEach(function (r) { sugList.appendChild(recipientRow(r)); });
      } else {
        sugList.classList.add('hide');
        sugLabel.classList.add('hide');
      }
    }
    var cnt = $('#move-selected-count');
    if (cnt) cnt.textContent = '· ' + selectedCount() + ' selected';
    updateMoveOverview();
  }

  function recipientRow(r) {
    var row = document.createElement('div');
    row.className = 'move-recipient' + (r.selected ? '' : ' excluded');
    row.setAttribute('data-id', r.id);
    var checkCls = 'r-check' + (r.selected ? '' : ' off') + (r.locked ? ' locked' : '');
    var st = r.selected ? r.status : 'excluded';
    var chev = (r.action === 'draft' || r.action === 'usps') ? '<span class="move-r-chev">›</span>' : '';
    row.innerHTML =
      '<div class="' + checkCls + '" data-check="' + r.id + '">' + (r.selected ? '✓' : '') + '</div>' +
      '<div class="move-r-body">' +
        '<div class="move-r-top"><div class="move-r-name">' + r.name + '</div>' + chev + '</div>' +
        '<div class="move-r-meta">' + r.detail + '</div>' +
        '<div class="move-r-badges">' +
          '<span class="channel-badge ' + r.channel + '">' + CHANNEL_LABEL[r.channel] + '</span>' +
          '<span class="status-chip ' + statusClass(st) + '">' + STATUS_LABEL[st] + '</span>' +
        '</div>' +
      '</div>';
    row.querySelector('[data-check]').addEventListener('click', function (e) {
      e.stopPropagation();
      toggleMoveRecipient(r.id);
    });
    row.addEventListener('click', function () {
      openRecipient(r.id);
    });
    return row;
  }

  function findRecipient(id) {
    for (var i = 0; i < moveRecipients.length; i++) {
      if (moveRecipients[i].id === id) return moveRecipients[i];
    }
    return null;
  }

  window.toggleMoveRecipient = function (id) {
    var r = findRecipient(id);
    if (!r) return;
    if (r.locked && r.selected) {
      toast('Confirmed orders don’t silently move — keep selected or contact support');
      return;
    }
    r.selected = !r.selected;
    if (!r.selected) {
      /* excluded — status unchanged under the hood; UI shows Excluded */
    }
    renderRecipients();
    toast(r.selected ? r.name + ' included' : r.name + ' excluded from this move');
  };

  window.openRecipient = function (id) {
    var r = findRecipient(id);
    if (!r || !r.selected) {
      if (r && !r.selected) toast('Re-select to include, then open');
      return;
    }
    if (r.action === 'usps') { go('move-usps'); return; }
    if (r.action === 'draft') { openDraft(id); return; }
    if (r.action === 'portal') {
      toast('Would open ' + r.name + ' portal (prototype)');
      if (r.status === 'not-started') { r.status = 'awaiting'; renderRecipients(); syncUspsUi(); }
      return;
    }
    toast('Manual step — mark when you’ve updated ' + r.name);
  };

  function openDraft(id) {
    activeDraftId = id;
    var r = findRecipient(id);
    if (!r) return;
    draftEditing = false;
    $('#draft-recipient-name').textContent = r.name;
    $('#draft-recipient-sub').textContent = CHANNEL_LABEL[r.channel] + ' · Move Engine facts below';
    $('#draft-to').textContent = r.to || 'recipient@example.com';
    $('#draft-subject').textContent = r.subject || '';
    $('#draft-body').textContent = r.body || '';
    $('#draft-subject').contentEditable = 'false';
    $('#draft-body').contentEditable = 'false';
    go('move-draft');
  }

  window.toggleDraftEdit = function () {
    draftEditing = !draftEditing;
    $('#draft-subject').contentEditable = draftEditing ? 'true' : 'false';
    $('#draft-body').contentEditable = draftEditing ? 'true' : 'false';
    if (draftEditing) {
      $('#draft-body').focus();
      toast('Editing draft — Assist language only; facts stay from Move Engine');
    } else {
      var r = findRecipient(activeDraftId);
      if (r) {
        r.subject = $('#draft-subject').textContent.trim();
        r.body = $('#draft-body').textContent;
      }
      toast('Draft saved locally');
    }
  };

  window.copyDraft = function () {
    var subj = $('#draft-subject').textContent;
    var body = $('#draft-body').textContent;
    var text = 'Subject: ' + subj + '\n\n' + body;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        toast('Draft copied — you paste & send');
      }).catch(function () { toast('Copy unavailable — select text manually'); });
    } else {
      toast('Copy unavailable — select text manually');
    }
  };

  window.openConfirmSend = function () {
    var r = findRecipient(activeDraftId);
    if (!r) return;
    $('#confirm-recipient').textContent = r.name;
    $('#confirm-subject').textContent = ($('#draft-subject').textContent || '').slice(0, 48) + ((($('#draft-subject').textContent || '').length > 48) ? '…' : '');
    var cb = $('#confirm-send-as-me');
    if (cb) cb.checked = false;
    $('#confirm-send-backdrop').classList.add('show');
    $('#confirm-send-sheet').classList.add('show');
  };

  window.closeConfirmSend = function () {
    $('#confirm-send-backdrop').classList.remove('show');
    $('#confirm-send-sheet').classList.remove('show');
  };

  window.confirmSendDraft = function () {
    var cb = $('#confirm-send-as-me');
    if (!cb || !cb.checked) {
      toast('Confirm “Send as me” to continue');
      return;
    }
    var r = findRecipient(activeDraftId);
    if (r) {
      r.subject = $('#draft-subject').textContent.trim();
      r.body = $('#draft-body').textContent;
      r.status = 'queued';
    }
    closeConfirmSend();
    toast('Queued · Sent locally (demo) — not a real email');
    setTimeout(function () {
      if (r) r.status = 'submitted';
      updateMoveOverview();
      go('move-checklist');
    }, 700);
  };

  window.suggestMissingRecipients = function () {
    if (suggestionsAdded) return;
    suggestionsAdded = true;
    suggestedPool.forEach(function (s) {
      if (!findRecipient(s.id)) moveRecipients.push(Object.assign({}, s));
    });
    var btn = $('#suggest-recipients-btn');
    if (btn) { btn.classList.add('used'); btn.textContent = '✦ Suggestions added'; }
    renderRecipients();
    toast('Added DMV & voter reg tips — not scraped from accounts');
  };

  function syncUspsUi() {
    var r = findRecipient('usps');
    if (!r) return;
    var pill = $('#usps-status-pill');
    if (pill) {
      pill.textContent = STATUS_LABEL[r.status] || r.status;
      pill.className = 'pill ' + (r.status === 'confirmed' ? 'ok' : r.status === 'awaiting' ? 'warn' : 'ghost');
    }
  }

  window.openUspsExternal = function () {
    $('#usps-external-backdrop').classList.add('show');
    $('#usps-external-sheet').classList.add('show');
  };

  window.closeUspsExternal = function () {
    $('#usps-external-backdrop').classList.remove('show');
    $('#usps-external-sheet').classList.remove('show');
  };

  window.continueUspsDemo = function () {
    var r = findRecipient('usps');
    if (r && r.status !== 'confirmed') r.status = 'awaiting';
    closeUspsExternal();
    syncUspsUi();
    updateMoveOverview();
    toast('USPS demo handoff — status: Awaiting you (not filed)');
  };

  window.markUspsDone = function () {
    var r = findRecipient('usps');
    if (!r) return;
    if (r.status === 'not-started') {
      toast('Continue on USPS first — or mark after you finish there');
      return;
    }
    r.status = 'confirmed';
    syncUspsUi();
    updateMoveOverview();
    toast('USPS marked Confirmed — only because you said so');
  };

  var toastTimer;
  window.toast = function (msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  };

  function boot() {
    updateMoveOverview();
    var hash = (location.hash || '').replace(/^#/, '');
    if (hash && $('[data-screen="' + hash + '"]')) {
      $all('.screen').forEach(function (s) { s.classList.remove('active'); });
      go(hash);
    } else {
      updateNav('today');
    }
  }
  boot();
  window.addEventListener('hashchange', function () {
    var hash = (location.hash || '').replace(/^#/, '');
    if (hash && hash !== current) go(hash);
  });
})();
