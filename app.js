(function () {
  const navMemory = { today: 'today', map: 'map', places: 'places', explore: 'explore', you: 'you' };
  let current = 'today';

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return [...(root || document).querySelectorAll(sel)]; }

  const YOU_SCREENS = {
    'ledger': 1, 'move-planning': 1, 'move-checklist': 1, 'move-draft': 1, 'move-usps': 1,
    'permissions': 1, 'permission-detail': 1, 'connections': 1, 'connected-services': 1, 'connected-service-detail': 1, 'support': 1
  };

  window.go = function (name) {
    if (name === 'connections') name = 'connected-services';
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
    if (name === 'move-planning') { updateMoveOverview(); updateConnectedServicesSummaries(); }
    if (name === 'move-usps') syncUspsUi();
    if (name === 'connected-services') renderConnectedServices();
    if (name === 'connected-service-detail') renderServiceDetail();
    if (name === 'permissions') renderPermissionsHub();
    if (name === 'permission-detail') renderPermissionDetail();
    if (name === 'service-inquiry') syncInquiryFormUi();
    if (name === 'you' || name === 'today') { updateConnectedServicesSummaries(); updatePermissionsSummaries(); }
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

  /* ========== Private inquiry disclosure (Services → Permissions) ========== */
  var inquiryDraft = {
    service: 'Deep clean',
    window: 'Thu Sep 25 · morning',
    placeId: 'place_ecc',
    approx: true,
    exact: false,
    access: false,
    identity: 'alias', // alias | handle
    notes: 'Deep clean before next host arrival. Pets: none. Lockbox OK if you later receive exact access.',
    exactRequested: true // seed demo: provider already asked
  };

  var INQUIRY_SEED_ID = 'grant_inq_cedar_7a2f';

  function syncInquiryFormUi() {
    var d = inquiryDraft;
    $all('#inq-service-chips .purpose-chip').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-inq-svc') === d.service);
    });
    var win = $('#inq-window'); if (win && document.activeElement !== win) win.value = d.window;
    var notes = $('#inq-notes'); if (notes && document.activeElement !== notes) notes.value = d.notes;
    var ecc = $('#inq-place-ecc'); if (ecc) ecc.classList.toggle('on', d.placeId === 'place_ecc');
    var alias = $('#inq-id-alias'); if (alias) alias.classList.toggle('on', d.identity === 'alias');
    var handle = $('#inq-id-handle'); if (handle) handle.classList.toggle('on', d.identity === 'handle');
    syncInqToggle('inq-tog-approx', d.approx);
    syncInqToggle('inq-tog-exact', d.exact);
    syncInqToggle('inq-tog-access', d.access);
    if (typeof window.inqSyncPreview === 'function') window.inqSyncPreview();
  }

  function syncInqToggle(id, on) {
    var el = $('#' + id);
    if (!el) return;
    el.classList.toggle('on', !!on);
    el.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  window.inqPickService = function (btn) {
    inquiryDraft.service = btn.getAttribute('data-inq-svc') || 'Deep clean';
    syncInquiryFormUi();
  };
  window.inqPickPlace = function (pid) {
    if (pid !== 'place_ecc') {
      toast('View-only places can’t be forwarded for inquiry');
      return;
    }
    inquiryDraft.placeId = pid;
    syncInquiryFormUi();
  };
  window.inqPickIdentity = function (mode) {
    if (mode === 'handle') {
      // soft confirm via toast; still selectable
      toast('Confirm: sharing usual @al (handle ≠ address)');
    }
    inquiryDraft.identity = mode;
    syncInquiryFormUi();
  };
  window.inqToggle = function (key) {
    if (key === 'approx') {
      // Approximate stays the kit default; turning off alone is discouraged
      inquiryDraft.approx = !inquiryDraft.approx;
      if (!inquiryDraft.approx && !inquiryDraft.exact) {
        inquiryDraft.approx = true;
        toast('Keep approximate area on, or turn on exact street');
      }
    } else if (key === 'exact') {
      inquiryDraft.exact = !inquiryDraft.exact;
      if (inquiryDraft.exact) inquiryDraft.approx = true; // exact includes zone; both can show
    } else if (key === 'access') {
      inquiryDraft.access = !inquiryDraft.access;
    }
    syncInquiryFormUi();
  };
  window.inqSyncPreview = function () {
    var winEl = $('#inq-window');
    var notesEl = $('#inq-notes');
    if (winEl) inquiryDraft.window = winEl.value;
    if (notesEl) inquiryDraft.notes = notesEl.value;
    var area = $('#inq-prev-area');
    var idEl = $('#inq-prev-id');
    var svc = $('#inq-prev-svc');
    if (area) {
      if (inquiryDraft.exact) area.textContent = 'Exact street requested in this submit (demo) · East Cesar Chavez Cottage';
      else area.textContent = 'East Austin · serves-this-zone (approx)';
    }
    if (idEl) {
      idEl.textContent = inquiryDraft.identity === 'alias'
        ? 'From: River Guest (inquiry alias)'
        : 'From: @al (usual handle)';
    }
    if (svc) svc.textContent = inquiryDraft.service + ' · ' + inquiryDraft.window;
  };

  window.sendInquiry = function () {
    inqSyncPreview();
    if (!inquiryDraft.approx && !inquiryDraft.exact) {
      toast('Choose destination precision before send');
      return;
    }
    // Single-demo path: refresh seeded Cedar inquiry (grant_inq_cedar_7a2f) so hub stays coherent.
    var g = findOutgoing(INQUIRY_SEED_ID);
    var precision = inquiryDraft.exact ? 'exact' : 'approx';
    var identityLabel = inquiryDraft.identity === 'alias' ? 'River Guest (inquiry alias)' : '@al';
    var hist = [
      { title: 'Inquiry submitted', sub: 'Tue Sep 22 · just now · ' + inquiryDraft.service + ' · opaque ref', denied: false },
      { title: precision === 'exact' ? 'Exact street disclosed' : 'Approx area disclosed', sub: 'East Cesar Chavez zone · identity ' + identityLabel, denied: false }
    ];
    if (!inquiryDraft.exact) {
      hist.push({ title: 'Exact address requested (pending)', sub: 'Provider may ask · separate grant step', denied: false });
    }
    if (g) {
      g.purpose = inquiryDraft.service + ' quote';
      g.precision = precision;
      g.selection = 'fixed';
      g.placeId = inquiryDraft.placeId;
      g.status = 'active';
      g.inquiryStatus = 'submitted';
      g.windowLabel = inquiryDraft.window;
      g.identityMode = inquiryDraft.identity;
      g.identityLabel = identityLabel;
      g.accessNotes = !!inquiryDraft.access;
      g.notes = inquiryDraft.notes;
      g.exactRequested = !inquiryDraft.exact;
      g.countdown = 'Inquiry · expires Oct 6';
      g.endLabel = 'Demo expiry · Mon Oct 6, 2026 CT';
      g.endingSoon = false;
      g.history = hist.concat([
        { title: 'Prior seed history cleared for demo resubmit', sub: 'Prototype · not a live merchant API', denied: false }
      ]);
    } else {
      g = {
        id: INQUIRY_SEED_ID,
        name: 'Cedar & Stone Clean Co.',
        handle: '@cedarstone',
        accountId: 'acct_cedar_stone_01',
        initials: 'CS',
        color: '#2F5D50',
        class: 'inquiry',
        precision: precision,
        selection: 'fixed',
        placeId: inquiryDraft.placeId,
        purpose: inquiryDraft.service + ' quote',
        status: 'active',
        inquiryStatus: 'submitted',
        windowLabel: inquiryDraft.window,
        identityMode: inquiryDraft.identity,
        identityLabel: identityLabel,
        accessNotes: !!inquiryDraft.access,
        notes: inquiryDraft.notes,
        exactRequested: !inquiryDraft.exact,
        startIso: '2026-09-22T18:00:00-05:00',
        endIso: '2026-10-06T20:00:00-05:00',
        endLabel: 'Demo expiry · Mon Oct 6, 2026 CT',
        countdown: 'Inquiry · expires Oct 6',
        endingSoon: false,
        instructions: null,
        history: hist
      };
      outgoingGrants.unshift(g);
    }
    updatePermissionsSummaries();
    toast('Inquiry sent · grant ' + INQUIRY_SEED_ID);
    openGrantDetail(INQUIRY_SEED_ID, 'out');
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

  /* ========== Connected Services (demo connectors · not real OAuth) ========== */
  var PLACE_HOME = {
    id: 'place_ecc',
    label: 'East Cesar Chavez Cottage',
    street: '1204 E Cesar Chavez St',
    unit: 'Unit 204',
    city: 'Austin',
    zip: '78702'
  };
  var PLACE_SOUTH = {
    id: 'place_sl',
    label: 'South Lamar loft',
    street: '2110 S Lamar Blvd',
    unit: 'Apt 3B',
    city: 'Austin',
    zip: '78704'
  };
  var PLACE_LOBBY = {
    id: 'place_lobby',
    label: 'Building lobby',
    street: '1204 E Cesar Chavez St',
    unit: 'Lobby / concierge',
    city: 'Austin',
    zip: '78702'
  };

  var CAP_LABEL = { api: 'API apply', deeplink: 'Deep link', draft: 'Draft / manual' };
  var STATUS_CS_LABEL = {
    connected: 'Connected',
    'needs-reconnect': 'Needs reconnect',
    'apply-pending': 'Apply pending',
    'applied-ok': 'Applied · read-back OK',
    failed: 'Failed',
    excluded: 'Excluded from move'
  };

  var connectedServices = [
    {
      id: 'conn_amz_7f3a',
      name: 'Amazon',
      purpose: 'Subscribe & Save / delivery address',
      initials: 'Az',
      color: '#2F5D50',
      capability: 'api',
      routing: 'follow',
      pinnedPlaceId: null,
      status: 'applied-ok',
      moveIncluded: true,
      openOrders: 2,
      readback: 'Merchant confirmed default address · 2h ago',
      readbackKind: 'ok',
      note: null,
      catalog: true
    },
    {
      id: 'conn_dd_9c21',
      name: 'DoorDash',
      purpose: 'Delivery address preference',
      initials: 'DD',
      color: '#C45C26',
      capability: 'api',
      routing: 'follow',
      pinnedPlaceId: null,
      status: 'connected',
      moveIncluded: true,
      openOrders: 0,
      readback: 'Last sync OK · yesterday',
      readbackKind: 'ok',
      note: null,
      catalog: true
    },
    {
      id: 'conn_ubr_4e88',
      name: 'Uber',
      purpose: 'Pickup / dropoff preference',
      initials: 'Ub',
      color: '#1C1917',
      capability: 'deeplink',
      routing: 'follow',
      pinnedPlaceId: null,
      status: 'connected',
      moveIncluded: true,
      openOrders: 0,
      readback: 'Deep link ready · opens Uber app',
      readbackKind: 'pending',
      note: 'Rides ≠ parcel delivery — destination preference only.',
      catalog: true
    },
    {
      id: 'conn_ue_2b19',
      name: 'Uber Eats',
      purpose: 'Food delivery address',
      initials: 'UE',
      color: '#5a7a8a',
      capability: 'api',
      routing: 'follow',
      pinnedPlaceId: null,
      status: 'connected',
      moveIncluded: true,
      openOrders: 1,
      readback: 'Default address on file · 1d ago',
      readbackKind: 'ok',
      note: null,
      catalog: true
    },
    {
      id: 'conn_ic_6d40',
      name: 'Instacart',
      purpose: 'Grocery delivery address',
      initials: 'Ic',
      color: '#2F6F4E',
      capability: 'api',
      routing: 'pinned',
      pinnedPlaceId: 'place_lobby',
      status: 'connected',
      moveIncluded: true,
      openOrders: 0,
      readback: 'Pinned override active · Building lobby',
      readbackKind: 'ok',
      note: 'Pinned example: Building lobby (not home door).',
      catalog: true
    },
    {
      id: 'conn_ups_1a55',
      name: 'UPS My Choice',
      purpose: 'Parcel delivery manager',
      initials: 'UP',
      color: '#5a4a2a',
      capability: 'deeplink',
      routing: 'follow',
      pinnedPlaceId: null,
      status: 'connected',
      moveIncluded: true,
      openOrders: 0,
      readback: 'Opens UPS delivery preferences',
      readbackKind: 'pending',
      note: 'FedEx Delivery Manager–style deep link also available in catalog.',
      catalog: true
    },
    {
      id: 'conn_hf_8c02',
      name: 'Harvest Box',
      purpose: 'Meal kit · HelloFresh-like',
      initials: 'HB',
      color: '#6a7a55',
      capability: 'draft',
      routing: 'follow',
      pinnedPlaceId: null,
      status: 'apply-pending',
      moveIncluded: true,
      openOrders: 0,
      readback: 'Draft ready — you confirm in merchant account',
      readbackKind: 'pending',
      note: 'No partner API. Domicile prepares a draft you apply manually.',
      catalog: true
    },
    {
      id: 'conn_tgt_3f71',
      name: 'Target',
      purpose: 'Same-day / ship-to address',
      initials: 'Tg',
      color: '#B91C1C',
      capability: 'api',
      routing: 'follow',
      pinnedPlaceId: null,
      status: 'needs-reconnect',
      moveIncluded: true,
      openOrders: 0,
      readback: 'Token expired · reconnect required (demo)',
      readbackKind: 'warn',
      note: 'Demo reconnect state — not a real OAuth failure.',
      catalog: true
    },
    {
      id: 'conn_chy_0e44',
      name: 'Chewy',
      purpose: 'Pet supply autoship',
      initials: 'Ch',
      color: '#3A4F6A',
      capability: 'api',
      routing: 'follow',
      pinnedPlaceId: null,
      status: 'excluded',
      moveIncluded: false,
      openOrders: 0,
      readback: 'Excluded from current move plan',
      readbackKind: 'pending',
      note: 'Tied to Move Planning — keep shipping to current home until you include.',
      catalog: true
    }
  ];

  var catalogExtras = [
    {
      id: 'cat_fdx',
      name: 'FedEx Delivery Manager',
      purpose: 'Parcel delivery preferences',
      initials: 'Fx',
      color: '#4a2060',
      capability: 'deeplink',
      connected: false
    },
    {
      id: 'cat_wal',
      name: 'Walmart',
      purpose: 'Delivery & pickup address',
      initials: 'Wm',
      color: '#0071ce',
      capability: 'api',
      connected: false
    }
  ];

  var csFilter = 'all';
  var activeServiceId = 'conn_amz_7f3a';
  var updateFailNext = false;

  function findService(id) {
    for (var i = 0; i < connectedServices.length; i++) {
      if (connectedServices[i].id === id) return connectedServices[i];
    }
    return null;
  }

  function placeById(id) {
    if (id === PLACE_SOUTH.id) return PLACE_SOUTH;
    if (id === PLACE_LOBBY.id) return PLACE_LOBBY;
    return PLACE_HOME;
  }

  function effectivePlace(svc) {
    if (svc.routing === 'pinned' && svc.pinnedPlaceId) return placeById(svc.pinnedPlaceId);
    return PLACE_HOME;
  }

  function csMoveStats() {
    var follow = 0, pinned = 0, excluded = 0;
    connectedServices.forEach(function (s) {
      if (!s.moveIncluded) excluded++;
      else if (s.routing === 'pinned') pinned++;
      else follow++;
    });
    return { follow: follow, pinned: pinned, excluded: excluded };
  }

  function updateConnectedServicesSummaries() {
    var st = csMoveStats();
    var line = st.follow + ' services follow this move · ' + st.pinned + ' pinned · ' + st.excluded + ' excluded';
    var el = $('#move-cs-summary');
    if (el) el.textContent = line;
    var today = $('#today-cs-meta');
    if (today) today.textContent = st.follow + ' follow · ' + st.pinned + ' pinned · ' + st.excluded + ' excluded';
    var you = $('#you-cs-meta');
    if (you) you.textContent = String(connectedServices.length);
  }

  window.filterConnectedServices = function (mode) {
    csFilter = mode || 'all';
    $all('.cs-filter').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-cs-filter') === csFilter);
    });
    renderConnectedServices();
  };

  function passesFilter(s) {
    if (csFilter === 'follow') return s.routing === 'follow' && s.moveIncluded;
    if (csFilter === 'pinned') return s.routing === 'pinned';
    if (csFilter === 'move') return s.moveIncluded;
    return true;
  }

  function renderConnectedServices() {
    var list = $('#cs-list');
    if (!list) return;
    list.innerHTML = '';
    connectedServices.filter(passesFilter).forEach(function (s) {
      list.appendChild(serviceCard(s));
    });
    if (!list.children.length) {
      list.innerHTML = '<div class="card"><p class="sub">No services in this filter.</p></div>';
    }
    updateConnectedServicesSummaries();
  }

  function serviceCard(s) {
    var el = document.createElement('div');
    var extraCls = '';
    if (!s.moveIncluded || s.status === 'excluded') extraCls += ' excluded-state';
    if (s.status === 'needs-reconnect') extraCls += ' needs-reconnect';
    el.className = 'cs-card' + extraCls;
    el.setAttribute('data-id', s.id);
    var routeLabel = s.routing === 'pinned'
      ? ('Pinned: ' + (placeById(s.pinnedPlaceId).label))
      : 'Follow home';
    var stLabel = (!s.moveIncluded) ? STATUS_CS_LABEL.excluded : STATUS_CS_LABEL[s.status];
    var stCls = (!s.moveIncluded) ? 'excluded' : s.status;
    el.innerHTML =
      '<div class="cs-logo" style="background:' + s.color + '">' + s.initials + '</div>' +
      '<div class="cs-body">' +
        '<div class="cs-name-row"><div class="cs-name">' + s.name + '</div><span class="y-chev">›</span></div>' +
        '<div class="cs-purpose">' + s.purpose + '</div>' +
        '<div class="cs-chips">' +
          '<span class="cap-badge ' + s.capability + '">' + CAP_LABEL[s.capability] + '</span>' +
          '<span class="route-chip ' + (s.routing === 'pinned' ? 'pinned' : '') + '">' + routeLabel + '</span>' +
          '<span class="cs-status ' + stCls + '">' + stLabel + '</span>' +
        '</div>' +
        (s.note ? '<div class="cs-note">' + s.note + '</div>' : '') +
        '<div class="cs-id">ID ' + s.id + '</div>' +
      '</div>';
    el.addEventListener('click', function () { openServiceDetail(s.id); });
    return el;
  }

  window.openServiceDetail = function (id) {
    activeServiceId = id;
    go('connected-service-detail');
  };

  function renderServiceDetail() {
    var s = findService(activeServiceId);
    var body = $('#csd-body');
    var title = $('#csd-title');
    if (!s || !body) return;
    if (title) title.textContent = s.name;
    var place = effectivePlace(s);
    var routeFollowOn = s.routing === 'follow' ? ' on' : '';
    var routePinOn = s.routing === 'pinned' ? ' on' : '';
    var pinPlace = s.pinnedPlaceId ? placeById(s.pinnedPlaceId) : PLACE_SOUTH;
    var rbCls = s.readbackKind === 'ok' ? '' : (s.readbackKind === 'fail' ? 'fail' : (s.readbackKind === 'warn' ? 'warn' : 'pending'));
    var includeLabel = s.moveIncluded ? 'Exclude from Move Planning' : 'Include in Move Planning';
    var stLabel = (!s.moveIncluded) ? STATUS_CS_LABEL.excluded : STATUS_CS_LABEL[s.status];

    body.innerHTML =
      '<div class="csd-hero">' +
        '<div class="cs-logo" style="background:' + s.color + '">' + s.initials + '</div>' +
        '<div>' +
          '<div class="strong" style="font-size:18px;font-family:var(--font-display)">' + s.name + '</div>' +
          '<div class="muted" style="font-size:12px;margin-top:2px">' + s.purpose + '</div>' +
          '<div class="cs-chips" style="margin-top:8px">' +
            '<span class="cap-badge ' + s.capability + '">' + CAP_LABEL[s.capability] + '</span>' +
            '<span class="cs-status ' + (s.moveIncluded ? s.status : 'excluded') + '">' + stLabel + '</span>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="readback-strip ' + rbCls + '"><span>●</span><span id="csd-readback">' + s.readback + '</span></div>' +

      '<div class="section-label" style="margin-top:0">What they receive</div>' +
      '<div class="card field-preview mb-12">' +
        '<div class="fact-row"><span class="muted">Street</span><span class="strong" style="font-size:13px">' + place.street + '</span></div>' +
        '<div class="fact-row"><span class="muted">Unit</span><span class="strong" style="font-size:13px">' + place.unit + '</span></div>' +
        '<div class="fact-row"><span class="muted">City</span><span class="strong" style="font-size:13px">' + place.city + '</span></div>' +
        '<div class="fact-row" style="border:none"><span class="muted">ZIP</span><span class="strong" style="font-size:13px">' + place.zip + '</span></div>' +
      '</div>' +
      '<p class="muted mb-12" style="font-size:11px;line-height:1.4">Preview fields only — no phone dump. Pairwise ID <strong>' + s.id + '</strong> (not a raw handle).</p>' +

      '<div class="section-label">Selection policy</div>' +
      '<div class="policy-option' + routeFollowOn + '" onclick="setServiceRouting(\'follow\')">' +
        '<div class="po-radio"></div>' +
        '<div><div class="po-title">Follow my home updates</div>' +
        '<div class="po-sub">' + PLACE_HOME.label + ' · wallet / home destination</div></div>' +
      '</div>' +
      '<div class="policy-option' + routePinOn + '" onclick="setServiceRouting(\'pinned\')">' +
        '<div class="po-radio"></div>' +
        '<div><div class="po-title">Pin this place</div>' +
        '<div class="po-sub">' + pinPlace.label + ' · override (demo: South Lamar or lobby)</div></div>' +
      '</div>' +
      (s.routing === 'pinned' ?
        '<div class="card mb-12" style="padding:10px 12px">' +
          '<div class="muted mb-8" style="font-size:11px">Pinned destination</div>' +
          '<button class="btn btn-ghost btn-sm" style="width:auto;margin-right:6px" onclick="event.stopPropagation();pinServicePlace(\'place_sl\')">South Lamar loft</button>' +
          '<button class="btn btn-ghost btn-sm" style="width:auto;margin-right:6px" onclick="event.stopPropagation();pinServicePlace(\'place_lobby\')">Building lobby</button>' +
          '<button class="btn btn-ghost btn-sm" style="width:auto" onclick="event.stopPropagation();pinServicePlace(\'place_ecc\')">East Cesar Chavez</button>' +
        '</div>' : '') +

      '<div class="banner info mb-12"><span>ℹ</span><span><strong>Effective for:</strong> Future deliveries only. Confirmed in-flight orders keep their checkout address.</span></div>' +
      '<div class="card mb-12">' +
        '<div class="between"><div><div class="strong" style="font-size:13px">Confirmed in-flight orders</div>' +
        '<div class="muted mt-8">' + (s.openOrders || 0) + ' open order' + ((s.openOrders === 1) ? '' : 's') + ' keep their checkout address</div></div>' +
        '<span class="pill ghost">Immutable</span></div>' +
      '</div>' +
      '<div class="banner private mb-12"><span>◎</span><span>Personal-sharing pause does <strong>not</strong> cancel this merchant grant.</span></div>' +

      '<button class="btn btn-primary" onclick="updateServiceNow()">' +
        (s.capability === 'deeplink' ? 'Open deep link (demo)' : (s.capability === 'draft' ? 'Prepare draft (demo)' : 'Update now')) +
      '</button>' +
      '<button class="btn btn-secondary mt-8" onclick="toggleServiceMoveInclude()">' + includeLabel + '</button>' +
      '<button class="btn btn-ghost mt-8" style="width:100%;color:var(--danger)" onclick="disconnectService()">Disconnect</button>' +
      '<p class="muted mt-12" style="font-size:11px;text-align:center;line-height:1.45">Planning prototype · synthetic connector · no real partner API</p>';
  }

  window.setServiceRouting = function (mode) {
    var s = findService(activeServiceId);
    if (!s) return;
    s.routing = mode;
    if (mode === 'pinned' && !s.pinnedPlaceId) {
      s.pinnedPlaceId = (s.name === 'Instacart') ? 'place_lobby' : 'place_sl';
    }
    if (mode === 'follow') {
      s.readback = 'Following home · ' + PLACE_HOME.label;
      s.readbackKind = 'ok';
    } else {
      s.readback = 'Pinned · ' + placeById(s.pinnedPlaceId).label;
      s.readbackKind = 'ok';
    }
    renderServiceDetail();
    updateConnectedServicesSummaries();
    toast(mode === 'follow' ? 'Routing: follow home updates' : 'Routing: pinned place');
  };

  window.pinServicePlace = function (placeId) {
    var s = findService(activeServiceId);
    if (!s) return;
    s.routing = 'pinned';
    s.pinnedPlaceId = placeId;
    s.readback = 'Pinned · ' + placeById(placeId).label;
    s.readbackKind = 'ok';
    renderServiceDetail();
    updateConnectedServicesSummaries();
    toast('Pinned: ' + placeById(placeId).label);
  };

  window.updateServiceNow = function () {
    var s = findService(activeServiceId);
    if (!s) return;
    if (s.status === 'needs-reconnect') {
      s.status = 'connected';
      s.readback = 'Reconnected (demo) · ready to apply';
      s.readbackKind = 'ok';
      renderServiceDetail();
      toast('Demo reconnect OK — still not real OAuth');
      return;
    }
    if (s.capability === 'deeplink') {
      s.readback = 'Deep link handed off · confirm in provider app';
      s.readbackKind = 'pending';
      s.status = 'apply-pending';
      renderServiceDetail();
      toast('Would open ' + s.name + ' (prototype deep link)');
      return;
    }
    if (s.capability === 'draft') {
      s.readback = 'Draft prepared · apply manually in merchant account';
      s.readbackKind = 'pending';
      s.status = 'apply-pending';
      renderServiceDetail();
      toast('Draft / manual path — you finish in merchant UI');
      return;
    }
    // Toggle demo success/fail for API
    if (updateFailNext) {
      updateFailNext = false;
      s.status = 'failed';
      s.readback = 'Merchant rejected apply · try again (demo fail)';
      s.readbackKind = 'fail';
      renderServiceDetail();
      toast('Demo apply failed — read-back shows failure');
    } else {
      updateFailNext = true;
      s.status = 'applied-ok';
      s.readback = 'Merchant confirmed default address · just now';
      s.readbackKind = 'ok';
      renderServiceDetail();
      toast('Applied · merchant read-back OK (demo)');
    }
  };

  window.toggleServiceMoveInclude = function () {
    var s = findService(activeServiceId);
    if (!s) return;
    s.moveIncluded = !s.moveIncluded;
    if (!s.moveIncluded) {
      s.status = 'excluded';
      s.readback = 'Excluded from current move plan';
      s.readbackKind = 'pending';
      toast('Excluded from Move Planning — open orders unchanged');
    } else {
      s.status = 'connected';
      s.readback = 'Included for future deliveries on this move';
      s.readbackKind = 'ok';
      toast('Included in Move Planning');
    }
    renderServiceDetail();
    updateConnectedServicesSummaries();
  };

  window.disconnectService = function () {
    var s = findService(activeServiceId);
    if (!s) return;
    connectedServices = connectedServices.filter(function (x) { return x.id !== s.id; });
    updateConnectedServicesSummaries();
    toast('Disconnected ' + s.name + ' (demo grant revoked)');
    go('connected-services');
  };

  window.openAddService = function () {
    renderAddCatalog();
    $('#add-service-backdrop').classList.add('show');
    $('#add-service-sheet').classList.add('show');
  };
  window.closeAddService = function () {
    $('#add-service-backdrop').classList.remove('show');
    $('#add-service-sheet').classList.remove('show');
  };

  function renderAddCatalog() {
    var box = $('#add-service-catalog');
    if (!box) return;
    box.innerHTML = '';
    var card = document.createElement('div');
    card.className = 'card mb-8';
    var rows = '';
    connectedServices.forEach(function (s) {
      rows += catalogRow(s, true);
    });
    catalogExtras.forEach(function (c) {
      var already = connectedServices.some(function (s) { return s.name === c.name; });
      rows += catalogRow(c, already);
    });
    card.innerHTML = rows;
    box.appendChild(card);
  }

  function catalogRow(item, connected) {
    return (
      '<div class="add-svc-row" onclick="' + (connected ? 'closeAddService();openServiceDetail(\'' + item.id + '\')' : 'connectCatalogService(\'' + item.id + '\')') + '">' +
        '<div class="cs-logo" style="background:' + item.color + '">' + item.initials + '</div>' +
        '<div class="flex-1">' +
          '<div class="strong" style="font-size:13px">' + item.name + '</div>' +
          '<div class="muted" style="font-size:11px">' + item.purpose + '</div>' +
          '<div class="cs-chips" style="margin-top:6px">' +
            '<span class="cap-badge ' + item.capability + '">' + CAP_LABEL[item.capability] + '</span>' +
            (connected ? '<span class="cs-status connected">Connected</span>' : '<span class="pill ghost">Available</span>') +
          '</div>' +
        '</div>' +
        '<span class="y-chev">›</span>' +
      '</div>'
    );
  }

  window.connectCatalogService = function (catId) {
    var extra = null;
    for (var i = 0; i < catalogExtras.length; i++) {
      if (catalogExtras[i].id === catId) { extra = catalogExtras[i]; break; }
    }
    if (!extra) { toast('Already in your list'); return; }
    if (connectedServices.some(function (s) { return s.name === extra.name; })) {
      toast('Already connected');
      closeAddService();
      return;
    }
    var nid = 'conn_' + catId.replace('cat_', '') + '_' + Math.floor(Math.random() * 9000 + 1000);
    connectedServices.push({
      id: nid,
      name: extra.name,
      purpose: extra.purpose,
      initials: extra.initials,
      color: extra.color,
      capability: extra.capability,
      routing: 'follow',
      pinnedPlaceId: null,
      status: 'connected',
      moveIncluded: true,
      openOrders: 0,
      readback: 'Connected (demo) · not real OAuth',
      readbackKind: 'ok',
      note: 'Synthetic connector — capability: ' + CAP_LABEL[extra.capability],
      catalog: true
    });
    catalogExtras = catalogExtras.filter(function (c) { return c.id !== catId; });
    closeAddService();
    updateConnectedServicesSummaries();
    toast('Connected ' + extra.name + ' (demo)');
    openServiceDetail(nid);
  };

  window.requestServiceIdea = function () {
    closeAddService();
    toast('Request noted (prototype) — no partner outreach');
  };

  /* ========== Permissions & sharing (MAP demo · not live grants) ========== */
  var personalSharingPaused = false;
  var permTab = 'shared';
  var activeGrantId = null;
  var activeGrantKind = 'out'; // out | in
  var publicMapOn = false;
  var publicHandleMode = 'message'; // message | off
  var pubDraft = { loc: 'ecc', prec: 'approx', dur: 'weekend' };
  var shareDraft = {
    step: 1,
    recipient: null,
    selection: 'follow',
    placeId: 'place_ecc',
    precision: 'approx',
    purpose: 'Visit',
    duration: 'fri'
  };

  var PLACE_LABELS = {
    place_ecc: 'East Cesar Chavez Cottage',
    place_sl: 'South Lamar loft',
    place_lobby: 'Building lobby'
  };

  var DEMO_RECIPIENTS = [
    { handle: '@maya', name: 'Maya Chen', accountId: 'acct_maya_91c2', initials: 'MC', color: '#2F5D50' },
    { handle: '@devon', name: 'Devon Okoro', accountId: 'acct_devon_4a11', initials: 'DO', color: '#3A4F6A' },
    { handle: '@jordan', name: 'Jordan R.', accountId: 'acct_jordan_77e0', initials: 'JR', color: '#6a7a55' }
  ];

  var outgoingGrants = [
    {
      id: 'grant_maya_4c2e',
      name: 'Maya Chen',
      handle: '@maya',
      accountId: 'acct_maya_91c2',
      initials: 'MC',
      color: '#2F5D50',
      class: 'peer',
      precision: 'approx',
      selection: 'follow',
      placeId: null,
      purpose: 'Meet up / visit',
      status: 'active',
      startIso: '2026-09-20T09:00:00-05:00',
      endIso: '2026-09-25T20:00:00-05:00',
      endLabel: 'Fri Sep 25, 8:00 PM CT',
      countdown: 'Expires Fri Sep 25',
      endingSoon: true,
      instructions: null,
      history: [
        { title: 'Opened map card', sub: 'Tue Sep 22 · 2:14 PM CT · approximate area shown', denied: false },
        { title: 'Viewed approximate neighborhood', sub: 'Mon Sep 21 · 6:02 PM CT · no street/unit', denied: false },
        { title: 'Link redeemed on wrong account', sub: 'Sun Sep 20 · 11:40 AM CT · denied — account mismatch', denied: true },
        { title: 'Grant created', sub: 'Sat Sep 20 · 9:00 AM CT · purpose Meet up / visit', denied: false }
      ]
    },
    {
      id: 'grant_devon_8a1f',
      name: 'Devon Okoro',
      handle: '@devon',
      accountId: 'acct_devon_4a11',
      initials: 'DO',
      color: '#3A4F6A',
      class: 'peer',
      precision: 'exact',
      selection: 'fixed',
      placeId: 'place_ecc',
      purpose: 'Package handoff',
      status: 'scheduled',
      startIso: '2026-09-28T08:00:00-05:00',
      endIso: '2026-09-28T18:00:00-05:00',
      endLabel: 'Mon Sep 28, 6:00 PM CT',
      countdown: 'Starts Mon Sep 28 · 8:00 AM CT',
      endingSoon: false,
      instructions: 'Leave at side gate — code shared separately if needed',
      history: [
        { title: 'Grant scheduled', sub: 'Tue Sep 22 · 10:05 AM CT · not yet active', denied: false },
        { title: 'Fixed address version selected', sub: 'East Cesar Chavez Cottage · version pinned', denied: false }
      ]
    },
    {
      id: 'grant_jordan_2b90',
      name: 'Jordan R.',
      handle: '@jordan',
      accountId: 'acct_jordan_77e0',
      initials: 'JR',
      color: '#6a7a55',
      class: 'household',
      precision: 'exact',
      selection: 'follow',
      placeId: null,
      purpose: 'Household member',
      status: 'household',
      startIso: '2026-01-01T00:00:00-06:00',
      endIso: null,
      endLabel: 'Ongoing · review by Dec 1, 2026',
      countdown: 'Review Dec 1 · household role (not unlimited wallet)',
      endingSoon: false,
      instructions: null,
      history: [
        { title: 'Opened home map card', sub: 'Mon Sep 21 · 8:12 AM CT', denied: false },
        { title: 'Role confirmed', sub: 'Household member · quarterly review set', denied: false }
      ]
    },
    {
      id: 'grant_ccc_task_9e3c',
      name: 'Cedar Creek Courier',
      handle: '@cedarcreek',
      accountId: 'acct_ccc_job_441',
      initials: 'CC',
      color: '#C45C26',
      class: 'task',
      precision: 'exact',
      selection: 'fixed',
      placeId: 'place_ecc',
      purpose: 'Delivery destination · job #CC-2041',
      status: 'task',
      startIso: '2026-09-22T14:00:00-05:00',
      endIso: null,
      endLabel: 'Ends when job completes',
      countdown: 'Task-scoped · active job',
      endingSoon: false,
      instructions: 'Front porch · no gate code in this grant',
      history: [
        { title: 'Driver opened destination card', sub: 'Tue Sep 22 · 4:51 PM CT · job-scoped', denied: false },
        { title: 'Task grant issued', sub: 'Tue Sep 22 · 2:00 PM CT · ends on job complete', denied: false }
      ]
    },
    {
      id: 'grant_inq_cedar_7a2f',
      name: 'Cedar & Stone Clean Co.',
      handle: '@cedarstone',
      accountId: 'acct_cedar_stone_01',
      initials: 'CS',
      color: '#2F5D50',
      class: 'inquiry',
      precision: 'approx',
      selection: 'fixed',
      placeId: 'place_ecc',
      purpose: 'Deep clean quote',
      status: 'active',
      inquiryStatus: 'submitted',
      windowLabel: 'Thu Sep 25 · morning',
      identityMode: 'alias',
      identityLabel: 'River Guest (inquiry alias)',
      accessNotes: false,
      notes: 'Deep clean before next host arrival.',
      exactRequested: true,
      startIso: '2026-09-21T11:00:00-05:00',
      endIso: '2026-10-06T20:00:00-05:00',
      endLabel: 'Demo expiry · Mon Oct 6, 2026 CT',
      countdown: 'Inquiry · expires Oct 6',
      endingSoon: false,
      instructions: null,
      history: [
        { title: 'Exact address requested (pending)', sub: 'Mon Sep 22 · 9:40 AM CT · provider ask · not yet approved', denied: false },
        { title: 'Approx area disclosed', sub: 'Sun Sep 21 · 11:05 AM CT · East Austin zone · no street', denied: false },
        { title: 'Inquiry submitted', sub: 'Sun Sep 21 · 11:00 AM CT · Deep clean quote · opaque ref', denied: false }
      ]
    },
    {
      id: 'grant_priya_0d55',
      name: 'Priya Nair',
      handle: '@priya',
      accountId: 'acct_priya_33ab',
      initials: 'PN',
      color: '#5a7a8a',
      class: 'peer',
      precision: 'approx',
      selection: 'follow',
      placeId: null,
      purpose: 'Coffee meetup',
      status: 'expired',
      startIso: '2026-09-18T10:00:00-05:00',
      endIso: '2026-09-21T20:00:00-05:00',
      endLabel: 'Expired Mon Sep 21, 8:00 PM CT',
      countdown: 'Expired yesterday',
      endingSoon: false,
      instructions: null,
      history: [
        { title: 'Grant expired', sub: 'Mon Sep 21 · 8:00 PM CT · auto-closed', denied: false },
        { title: 'Viewed approximate area', sub: 'Sun Sep 20 · 3:22 PM CT', denied: false }
      ]
    }
  ];

  var incomingGrants = [
    {
      id: 'in_sam_7c01',
      name: 'Sam Ortiz',
      handle: '@sam',
      accountId: 'acct_sam_12fe',
      initials: 'SO',
      color: '#2F6F4E',
      class: 'peer',
      precision: 'approx',
      selection: 'follow',
      purpose: 'Weekend hang',
      status: 'active',
      endLabel: 'Sun Sep 27, 9:00 PM CT',
      countdown: 'Expires Sun',
      history: [
        { title: 'You opened their map card', sub: 'Tue Sep 22 · 1:05 PM CT · approximate only', denied: false }
      ]
    },
    {
      id: 'in_holly_evt_3a2',
      name: 'Holly Grove events',
      handle: '@hollygrove',
      accountId: 'acct_hg_evt_88',
      initials: 'HG',
      color: '#6B5B4A',
      class: 'event',
      precision: 'venue',
      selection: 'fixed',
      purpose: 'Community BBQ · Sat',
      status: 'active',
      endLabel: 'Sat Sep 26, 10:00 PM CT',
      countdown: 'Venue only · event class',
      history: [
        { title: 'Venue pin disclosed', sub: 'Event venue · not a home wallet', denied: false }
      ]
    },
    {
      id: 'in_lee_revoked',
      name: 'Lee Park',
      handle: '@lee',
      accountId: 'acct_lee_90cd',
      initials: 'LP',
      color: '#78716C',
      class: 'peer',
      precision: 'exact',
      selection: 'follow',
      purpose: 'Drop-off',
      status: 'revoked',
      endLabel: 'Revoked Sep 19',
      countdown: 'Revoked by sender',
      history: [
        { title: 'Access revoked by sender', sub: 'Fri Sep 19 · 4:30 PM CT', denied: true }
      ]
    }
  ];

  function findOutgoing(id) {
    for (var i = 0; i < outgoingGrants.length; i++) if (outgoingGrants[i].id === id) return outgoingGrants[i];
    return null;
  }
  function findIncoming(id) {
    for (var i = 0; i < incomingGrants.length; i++) if (incomingGrants[i].id === id) return incomingGrants[i];
    return null;
  }

  function effectiveOutgoingStatus(g) {
    if (g.status === 'expired' || g.status === 'revoked') return g.status;
    // Inquiry / task / merchant-style grants are NOT affected by personal Pause sharing with people
    if (g.class === 'inquiry') return g.status === 'active' ? 'inquiry' : g.status;
    if (g.class === 'task') return 'task';
    if (g.class === 'household') return personalSharingPaused ? 'paused' : 'household';
    if (g.class === 'peer' && personalSharingPaused) return 'paused';
    return g.status;
  }

  function statusLabel(st) {
    return ({
      active: 'Active', scheduled: 'Scheduled', expired: 'Expired',
      task: 'Task', paused: 'Paused', household: 'Household', revoked: 'Revoked',
      inquiry: 'Inquiry'
    })[st] || st;
  }

  function precLabel(p) {
    if (p === 'exact') return 'Exact pin';
    if (p === 'venue') return 'Venue only';
    return 'Approximate area';
  }

  function selLabel(s, placeId) {
    if (s === 'fixed') return 'Fixed: ' + (PLACE_LABELS[placeId] || 'address version');
    return 'Follow home';
  }

  function updatePermissionsSummaries() {
    var active = 0, soon = 0;
    outgoingGrants.forEach(function (g) {
      var st = effectiveOutgoingStatus(g);
      if (st === 'active' || st === 'scheduled' || st === 'task' || st === 'household' || st === 'inquiry') active++;
      if (g.endingSoon && st !== 'expired' && st !== 'revoked') soon++;
    });
    var a = $('#perm-sum-active'); if (a) a.textContent = String(active);
    var s = $('#perm-sum-soon'); if (s) s.textContent = String(soon);
    var p = $('#perm-sum-pause'); if (p) p.textContent = personalSharingPaused ? 'Paused' : 'On';
    var today = $('#today-perm-meta');
    if (today) {
      if (personalSharingPaused) today.textContent = 'Personal sharing paused · merchants unchanged';
      else today.textContent = 'Maya · approx area · expires Fri';
    }
  }

  window.goPermissionsTab = function (tab) {
    permTab = tab || 'shared';
    go('permissions');
  };

  window.setPermTab = function (tab) {
    permTab = tab || 'shared';
    $all('#perm-tabs .cs-filter').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-perm-tab') === permTab);
    });
    renderPermissionsHub();
  };

  window.togglePersonalSharingPause = function () {
    personalSharingPaused = !personalSharingPaused;
    syncPauseUi();
    renderPermissionsHub();
    updatePermissionsSummaries();
    toast(personalSharingPaused
      ? 'Paused sharing with people — merchants & inquiries unchanged'
      : 'Sharing with people active again');
  };

  function syncPauseUi() {
    var tog = $('#perm-pause-toggle');
    var sub = $('#perm-pause-sub');
    var ban = $('#perm-pause-banner');
    if (tog) {
      tog.classList.toggle('on', !personalSharingPaused);
      tog.classList.toggle('paused', personalSharingPaused);
      tog.setAttribute('aria-pressed', personalSharingPaused ? 'true' : 'false');
    }
    if (sub) {
      sub.textContent = personalSharingPaused
        ? 'Paused · peer & public-personal suspended'
        : 'Active · peer & public-personal grants live';
    }
    if (ban) ban.classList.toggle('hide', !personalSharingPaused);
  }

  function renderPermissionsHub() {
    syncPauseUi();
    updatePermissionsSummaries();
    $all('#perm-tabs .cs-filter').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-perm-tab') === permTab);
    });
    var list = $('#perm-list');
    if (!list) return;
    list.innerHTML = '';
    if (permTab === 'shared') renderOutgoingList(list);
    else if (permTab === 'incoming') renderIncomingList(list);
    else renderPublicPanel(list);
  }

  function renderOutgoingList(list) {
    var note = document.createElement('div');
    note.className = 'banner private mb-12';
    note.innerHTML = '<span>◎</span><span>Grants bind to <strong>stable accounts</strong>, not mutable handles. Renaming preserves grants; aliases do not inherit. Peer grants require expiry (CT).</span>';
    list.appendChild(note);
    outgoingGrants.forEach(function (g) {
      list.appendChild(grantCard(g, 'out'));
    });
  }

  function renderIncomingList(list) {
    var note = document.createElement('div');
    note.className = 'banner private mb-12';
    note.innerHTML = '<span>◎</span><span>Incoming grants to <strong>AL</strong>. Redemption checks your account + grant + pause. Forwarded links do not confer access.</span>';
    list.appendChild(note);
    incomingGrants.forEach(function (g) {
      list.appendChild(grantCard(g, 'in'));
    });
  }

  function renderPublicPanel(list) {
    var html = '';
    html += '<div class="banner private mb-12"><span>◎</span><span>Public handle lookup resolves to <strong>message / profile only</strong> by default — not an address. Public map visibility defaults <strong>off</strong>.</span></div>';
    html += '<div class="card pub-card mb-12">';
    html += '<div class="between mb-8"><div><div class="strong" style="font-size:14px">Public handle @al</div>';
    html += '<div class="muted">Discoverability · Message only / Off map</div></div>';
    html += '<span class="pill ghost">' + (publicHandleMode === 'message' ? 'Message only' : 'Off') + '</span></div>';
    html += '<div class="chip-row mt-8">';
    html += '<button type="button" class="purpose-chip' + (publicHandleMode === 'message' ? ' on' : '') + '" onclick="setPublicHandle(\'message\')">Message only</button>';
    html += '<button type="button" class="purpose-chip' + (publicHandleMode === 'off' ? ' on' : '') + '" onclick="setPublicHandle(\'off\')">Off</button>';
    html += '</div>';
    html += '<p class="muted mt-12" style="font-size:11px;line-height:1.4">A handle, AI answer, or public pin does not grant unrelated authority.</p>';
    html += '</div>';

    html += '<div class="card pub-card mb-12">';
    html += '<div class="between mb-8"><div><div class="strong" style="font-size:14px">Public map publication</div>';
    html += '<div class="muted">Default off · never silent wallet publish</div></div>';
    html += '<span class="pill ' + (publicMapOn ? 'sage' : 'ghost') + '">' + (publicMapOn ? 'On (demo)' : 'Off') + '</span></div>';
    if (publicMapOn) {
      html += '<p class="sub mb-8">Published: ' + (pubDraft.loc === 'sl' ? 'South Lamar' : 'East Cesar Chavez') + ' · ' + (pubDraft.prec === 'exact' ? 'Exact' : 'Approximate') + ' · window set</p>';
      html += '<button class="btn btn-secondary btn-sm" style="width:auto" onclick="turnPublicMapOff()">Turn off</button>';
    } else {
      html += '<button class="btn btn-secondary btn-sm" style="width:auto" onclick="openPublicMapSheet()">Publish on map…</button>';
    }
    html += '</div>';

    html += '<div class="banner info mb-8"><span>ℹ</span><span><strong>Distinguisher:</strong> Public off ≠ peer grants revoked ≠ Pause sharing with people. Three separate controls.</span></div>';
    html += '<div class="banner private"><span>◎</span><span>Disabling public visibility does not revoke existing peer grants. Pause suspends peer/public-personal only.</span></div>';
    list.innerHTML = html;
  }


  function inquiryStatusLabel(g) {
    var s = (g && g.inquiryStatus) || 'submitted';
    return ({ submitted: 'Submitted', needs_info: 'Needs info', quoted: 'Quoted', active: 'Active' })[s] || s;
  }

  function grantCard(g, kind) {
    var el = document.createElement('div');
    var st = kind === 'out' ? effectiveOutgoingStatus(g) : g.status;
    var cls = 'grant-card';
    if (st === 'expired' || st === 'revoked') cls += ' expired-state';
    if (st === 'paused') cls += ' paused-state';
    el.className = cls;
    var metaBits = [precLabel(g.precision)];
    if (kind === 'out' && g.class !== 'inquiry') metaBits.push(g.selection === 'fixed' ? 'Fixed' : 'Follow home');
    if (g.class === 'inquiry') metaBits.push('Place: ' + (PLACE_LABELS[g.placeId] || 'ECC'));
    metaBits.push(g.purpose);
    el.innerHTML =
      '<div class="grant-avatar" style="background:' + g.color + '">' + g.initials + '</div>' +
      '<div class="grant-body">' +
        '<div class="grant-name-row">' +
          '<div class="grant-name">' + g.name + '</div>' +
          '<span class="g-status ' + st + '">' + statusLabel(st) + '</span>' +
        '</div>' +
        '<div class="grant-meta">' + metaBits.join(' · ') + '</div>' +
        '<div class="grant-chips">' +
          (g.class === 'inquiry' ? '<span class="class-pill-inq">Inquiry</span>' : '') +
          '<span class="prec-pill ' + (g.precision === 'exact' ? 'exact' : 'approx') + '">' + precLabel(g.precision) + '</span>' +
          (kind === 'out' && g.class !== 'inquiry' ? '<span class="sel-pill">' + (g.selection === 'fixed' ? 'Fixed' : 'Follow') + '</span>' : '') +
          (g.class === 'inquiry' ? '<span class="sel-pill">' + inquiryStatusLabel(g) + '</span>' : '') +
          '<span class="sel-pill">' + g.countdown + '</span>' +
        '</div>' +
        '<div class="grant-id">' + g.id + '</div>' +
      '</div>' +
      '<span class="y-chev">›</span>';
    el.addEventListener('click', function () { openGrantDetail(g.id, kind); });
    return el;
  }

  window.openGrantDetail = function (id, kind) {
    activeGrantId = id;
    activeGrantKind = kind || 'out';
    go('permission-detail');
  };

  function renderPermissionDetail() {
    var body = $('#pd-body');
    var title = $('#pd-title');
    if (!body) return;
    if (activeGrantKind === 'in') {
      renderIncomingDetail(body, title);
      return;
    }
    var g = findOutgoing(activeGrantId);
    if (!g) { body.innerHTML = '<p class="sub">Grant not found.</p>'; return; }
    if (g.class === 'inquiry') {
      renderInquiryDetail(body, title, g);
      return;
    }
    var st = effectiveOutgoingStatus(g);
    if (title) title.textContent = g.name;

    var fieldsHtml;
    if (g.precision === 'approx') {
      fieldsHtml =
        '<div class="fact-row"><span class="muted">Disclosure</span><span class="strong" style="font-size:13px">Approximate neighborhood only</span></div>' +
        '<div class="fact-row" style="border:none"><span class="muted">Geometry</span><span class="strong" style="font-size:13px">Area blob · no street / unit / exact pin</span></div>';
    } else {
      var pl = g.selection === 'fixed' && g.placeId ? placeById(g.placeId) : PLACE_HOME;
      fieldsHtml =
        '<div class="fact-row"><span class="muted">Street</span><span class="strong" style="font-size:13px">' + pl.street + '</span></div>' +
        '<div class="fact-row"><span class="muted">Unit</span><span class="strong" style="font-size:13px">' + pl.unit + '</span></div>' +
        '<div class="fact-row"><span class="muted">City</span><span class="strong" style="font-size:13px">' + pl.city + ', ' + pl.zip + '</span></div>' +
        '<div class="fact-row" style="border:none"><span class="muted">Honesty</span><span class="strong" style="font-size:12px">Exact fields bound to this grant only</span></div>';
    }

    var followOn = g.selection === 'follow' ? ' on' : '';
    var fixedOn = g.selection === 'fixed' ? ' on' : '';
    var exactOn = g.precision === 'exact' ? ' on' : '';
    var approxOn = g.precision === 'approx' ? ' on' : '';

    body.innerHTML =
      '<div class="between mb-8"><span class="pill ghost">Prototype / demo</span><span class="g-status ' + st + '">' + statusLabel(st) + '</span></div>' +
      '<div class="pd-hero">' +
        '<div class="grant-avatar" style="background:' + g.color + '">' + g.initials + '</div>' +
        '<div>' +
          '<div class="strong" style="font-size:18px;font-family:var(--font-display)">' + g.name + '</div>' +
          '<div class="muted" style="font-size:12px;margin-top:2px">' + g.handle + ' · account ' + g.accountId + '</div>' +
          '<p class="muted mt-8" style="font-size:11px;line-height:1.35">Grants bind to this account ID. Renaming the handle preserves the grant; aliases do not inherit it.</p>' +
        '</div>' +
      '</div>' +

      (st === 'paused' ? '<div class="banner warn mb-12"><span>⏸</span><span>Paused by your personal-sharing pause. Merchant grants elsewhere are unchanged.</span></div>' : '') +

      '<div class="section-label" style="margin-top:0">Purpose &amp; fields</div>' +
      '<div class="card mb-8" style="padding:12px 14px"><div class="strong" style="font-size:13px">' + g.purpose + '</div></div>' +
      '<div class="card field-preview mb-12">' + fieldsHtml + '</div>' +

      '<div class="section-label">Selection policy</div>' +
      '<div class="policy-option' + followOn + '" onclick="setGrantSelection(\'follow\')">' +
        '<div class="po-radio"></div>' +
        '<div><div class="po-title">Follow home</div><div class="po-sub">recipient_route · tracks current home destination</div></div>' +
      '</div>' +
      '<div class="policy-option' + fixedOn + '" onclick="setGrantSelection(\'fixed\')">' +
        '<div class="po-radio"></div>' +
        '<div><div class="po-title">Fixed address version</div><div class="po-sub">' + (PLACE_LABELS[g.placeId] || PLACE_HOME.label) + ' · pinned version</div></div>' +
      '</div>' +

      '<div class="section-label">Precision</div>' +
      '<div class="policy-option' + exactOn + '" onclick="setGrantPrecision(\'exact\')">' +
        '<div class="po-radio"></div>' +
        '<div><div class="po-title">Exact pin</div><div class="po-sub">Street / unit when grant allows</div></div>' +
      '</div>' +
      '<div class="policy-option' + approxOn + '" onclick="setGrantPrecision(\'approx\')">' +
        '<div class="po-radio"></div>' +
        '<div><div class="po-title">Approximate area</div><div class="po-sub">Never leaks exact geometry in previews</div></div>' +
      '</div>' +

      '<div class="section-label">Time window</div>' +
      '<div class="card mb-12">' +
        '<div class="fact-row"><span class="muted">Start</span><span class="strong" style="font-size:12px">' + formatGrantStart(g) + '</span></div>' +
        '<div class="fact-row" style="border:none"><span class="muted">End</span><span class="strong" style="font-size:12px">' + g.endLabel + '</span></div>' +
      '</div>' +
      '<p class="muted mb-12" style="font-size:11px">Timezone: America/Chicago (CT). Future-address and historical access are separate and default-denied.</p>' +

      (g.instructions ?
        '<div class="section-label">Instructions</div><div class="card mb-12"><p class="sub">' + g.instructions + '</p><p class="muted mt-8" style="font-size:11px">Gate codes are permissioned separately — not implied by destination grants.</p></div>' : '') +

      '<div class="section-label">Actions</div>' +
      '<button class="btn btn-primary" onclick="openPreviewSheet()">Preview as recipient</button>' +
      (g.status === 'expired'
        ? '<button class="btn btn-secondary mt-8" onclick="extendGrant()">Extend</button>'
        : '<button class="btn btn-secondary mt-8" onclick="extendGrant()">Extend</button>') +
      '<button class="btn btn-secondary mt-8" onclick="copyRecipientLink()">Copy recipient-bound link</button>' +
      '<button class="btn btn-secondary mt-8" onclick="openQrSheet()">Show QR</button>' +
      (g.class !== 'task' && g.status !== 'expired'
        ? '<button class="btn btn-ghost mt-8" style="width:100%;color:var(--danger)" onclick="openRevokeSheet()">Revoke</button>'
        : (g.status === 'expired' ? '<p class="muted mt-8" style="font-size:11px;text-align:center">Expired — use Extend to create a new window.</p>' : '')) +

      '<div class="section-label">Access history</div>' +
      '<div class="card mb-8"><div class="access-tl">' + renderHistory(g.history) + '</div></div>' +
      '<p class="muted mb-12" style="font-size:11px;text-align:center;line-height:1.45">Audit metadata only — no raw address dump. Pairwise ID <strong>' + g.id + '</strong></p>' +
      '<p class="muted" style="font-size:11px;text-align:center">Prototype / demo · not a live grant</p>';
  }

  function formatGrantStart(g) {
    if (!g.startIso) return '—';
    if (g.status === 'scheduled') return 'Mon Sep 28, 8:00 AM CT';
    if (g.class === 'household') return 'Ongoing since Jan 2026';
    if (g.class === 'task') return 'Tue Sep 22, 2:00 PM CT';
    if (g.class === 'inquiry') return 'Inquiry window · ' + (g.windowLabel || 'Thu Sep 25 · morning');
    return 'Sat Sep 20, 9:00 AM CT';
  }

  function renderInquiryDetail(body, title, g) {
    var st = effectiveOutgoingStatus(g);
    if (title) title.textContent = g.name;
    var placeLabel = PLACE_LABELS[g.placeId] || 'East Cesar Chavez Cottage';
    var fieldsHtml;
    if (g.precision === 'approx') {
      fieldsHtml =
        '<div class="fact-row"><span class="muted">Disclosure</span><span class="strong" style="font-size:13px">Approximate area / serves-this-zone</span></div>' +
        '<div class="fact-row"><span class="muted">Place ref</span><span class="strong" style="font-size:13px">' + placeLabel + ' (owned)</span></div>' +
        '<div class="fact-row" style="border:none"><span class="muted">Geometry</span><span class="strong" style="font-size:13px">Coverage zone · no street / unit</span></div>';
    } else {
      var pl = placeById(g.placeId);
      fieldsHtml =
        '<div class="fact-row"><span class="muted">Street</span><span class="strong" style="font-size:13px">' + pl.street + '</span></div>' +
        '<div class="fact-row"><span class="muted">Unit</span><span class="strong" style="font-size:13px">' + pl.unit + '</span></div>' +
        '<div class="fact-row"><span class="muted">City</span><span class="strong" style="font-size:13px">' + pl.city + ', ' + pl.zip + '</span></div>' +
        '<div class="fact-row" style="border:none"><span class="muted">Honesty</span><span class="strong" style="font-size:12px">Exact bound to this inquiry only</span></div>';
    }

    var exactCard = '';
    if (g.exactRequested && g.precision !== 'exact' && g.status !== 'expired' && g.status !== 'revoked') {
      exactCard =
        '<div class="card mb-12" style="border-color:#c2d6c5;background:linear-gradient(160deg,#FFFCFA 0%,var(--accent-soft) 100%)">' +
          '<div class="strong" style="font-size:13px;margin-bottom:6px">Cedar &amp; Stone requested exact street for the quote</div>' +
          '<p class="muted mb-12" style="font-size:11px;line-height:1.4">Separate from identity. Approving upgrades this inquiry grant’s destination precision only.</p>' +
          '<div style="display:flex;gap:8px">' +
            '<button class="btn btn-primary btn-sm" style="flex:1;width:auto" onclick="approveInquiryExact()">Approve exact address</button>' +
            '<button class="btn btn-secondary btn-sm" style="flex:1;width:auto" onclick="declineInquiryExact()">Not now</button>' +
          '</div>' +
        '</div>';
    }

    body.innerHTML =
      '<div class="between mb-8"><span class="pill ghost">Prototype / demo</span><span class="g-status inquiry">Inquiry</span></div>' +
      '<div class="pd-hero">' +
        '<div class="grant-avatar" style="background:' + g.color + '">' + g.initials + '</div>' +
        '<div>' +
          '<div class="strong" style="font-size:18px;font-family:var(--font-display)">' + g.name + '</div>' +
          '<div class="muted" style="font-size:12px;margin-top:2px">' + g.handle + ' · ' + g.accountId + '</div>' +
          '<div class="muted" style="font-size:11px;margin-top:4px">Status: ' + inquiryStatusLabel(g) + ' · quote ≠ booking</div>' +
        '</div>' +
      '</div>' +

      '<div class="banner private mb-12"><span>◎</span><span>Marketplace browse did <strong>not</strong> notify them — only this inquiry submit did. One provider only.</span></div>' +
      '<div class="banner info mb-12"><span>ℹ</span><span><strong>Distinguisher:</strong> one-shot inquiry grant, not standing merchant routing (see Connected Services). Pause sharing with people does not cancel inquiry grants.</span></div>' +

      exactCard +

      '<div class="section-label" style="margin-top:0">Purpose &amp; window</div>' +
      '<div class="card mb-8" style="padding:12px 14px">' +
        '<div class="strong" style="font-size:13px">' + g.purpose + '</div>' +
        '<div class="muted mt-8" style="font-size:12px">Window: ' + (g.windowLabel || '—') + '</div>' +
        '<div class="muted" style="font-size:12px">Identity: ' + (g.identityLabel || 'River Guest') + ' · address disclosure separate</div>' +
      '</div>' +
      '<div class="card field-preview mb-12">' + fieldsHtml + '</div>' +

      '<div class="section-label">Selection</div>' +
      '<div class="card mb-12" style="padding:12px 14px">' +
        '<div class="strong" style="font-size:13px">Fixed: ' + placeLabel + '</div>' +
        '<p class="muted mt-8" style="font-size:11px;line-height:1.4">Inquiry destinations must be owned or authorized-for-onward. View-only places cannot be forwarded.</p>' +
      '</div>' +

      '<div class="section-label">Time window</div>' +
      '<div class="card mb-12">' +
        '<div class="fact-row"><span class="muted">Service window</span><span class="strong" style="font-size:12px">' + (g.windowLabel || '—') + '</span></div>' +
        '<div class="fact-row" style="border:none"><span class="muted">Grant expiry</span><span class="strong" style="font-size:12px">' + g.endLabel + '</span></div>' +
      '</div>' +
      '<p class="muted mb-12" style="font-size:11px">Revoke/expiry blocks <strong>new</strong> disclosure. Accepted quote may keep a bounded demo transaction note (copies not recalled).</p>' +

      '<div class="section-label">Actions</div>' +
      '<button class="btn btn-primary" onclick="openInquiryProviderPreview()">Preview as provider</button>' +
      (g.status !== 'expired' && g.status !== 'revoked'
        ? '<button class="btn btn-ghost mt-8" style="width:100%;color:var(--danger)" onclick="openRevokeSheet()">Revoke inquiry access</button>'
        : '<p class="muted mt-8" style="font-size:11px;text-align:center">Revoked / expired — new disclosure blocked.</p>') +

      '<div class="section-label">Access history</div>' +
      '<div class="card mb-8"><div class="access-tl">' + renderHistory(g.history) + '</div></div>' +
      '<p class="muted mb-12" style="font-size:11px;text-align:center;line-height:1.45">Audit metadata only — no raw address in toasts. Pairwise ID <strong>' + g.id + '</strong></p>' +
      '<p class="muted" style="font-size:11px;text-align:center">Prototype / demo · not a live grant</p>';
  }

  window.approveInquiryExact = function () {
    var g = findOutgoing(activeGrantId);
    if (!g || g.class !== 'inquiry') return;
    if (g.status === 'expired' || g.status === 'revoked') {
      toast('Revoked inquiry — new disclosure blocked');
      return;
    }
    g.precision = 'exact';
    g.exactRequested = false;
    g.inquiryStatus = 'needs_info';
    g.history.unshift({
      title: 'Exact street approved',
      sub: 'Tue Sep 22 · just now · precision upgraded · opaque ref',
      denied: false
    });
    renderPermissionDetail();
    toast('Exact address approved · grant ' + g.id);
  };

  window.declineInquiryExact = function () {
    var g = findOutgoing(activeGrantId);
    if (!g || g.class !== 'inquiry') return;
    g.exactRequested = false;
    g.history.unshift({
      title: 'Exact street deferred',
      sub: 'Tue Sep 22 · just now · Not now · approx remains',
      denied: false
    });
    renderPermissionDetail();
    toast('Kept approximate · grant ' + g.id);
  };

  window.openInquiryProviderPreview = function () {
    var g = findOutgoing(activeGrantId);
    if (!g) return;
    var box = $('#perm-preview-body');
    var approx = g.precision === 'approx';
    var html = '<div class="share-preview-card mb-12">';
    html += '<div class="muted mb-8" style="font-size:11px">As Cedar &amp; Stone would see</div>';
    if (approx) {
      html += '<div class="map-canvas" style="height:120px;margin-bottom:10px;border-radius:12px">' +
        '<div class="map-blob" style="top:30%;left:28%;width:90px;height:70px"><span>Approx zone</span></div></div>';
      html += '<div class="strong" style="font-size:14px">East Austin · serves-this-zone</div>';
      html += '<p class="muted mt-8" style="font-size:12px">No street, unit, or exact pin.</p>';
    } else {
      var pl = placeById(g.placeId);
      html += '<div class="strong" style="font-size:14px">' + pl.label + '</div>';
      html += '<div class="muted mt-8">' + pl.street + ' · ' + pl.unit + '</div>';
      html += '<div class="muted">' + pl.city + ', ' + pl.zip + '</div>';
    }
    html += '<div class="muted mt-12" style="font-size:11px">From: ' + (g.identityLabel || 'River Guest') + '</div>';
    html += '<div class="muted" style="font-size:11px">' + g.purpose + ' · ' + (g.windowLabel || '') + '</div>';
    html += '<div class="muted mt-8" style="font-size:11px">Quote ≠ booking · status ' + inquiryStatusLabel(g) + '</div>';
    html += '</div>';
    html += '<div class="banner private"><span>◎</span><span>Identity disclosure ≠ address disclosure. Inquiry alias is not a bearer capability.</span></div>';
    if (box) box.innerHTML = html;
    $('#perm-preview-backdrop').classList.add('show');
    $('#perm-preview-sheet').classList.add('show');
  };

  function renderHistory(rows) {
    if (!rows || !rows.length) return '<p class="sub">No resolutions yet.</p>';
    return rows.map(function (r) {
      return '<div class="access-row' + (r.denied ? ' denied' : '') + '">' +
        '<div class="ar-title">' + r.title + '</div>' +
        '<div class="ar-sub">' + r.sub + '</div></div>';
    }).join('');
  }

  function renderIncomingDetail(body, title) {
    var g = findIncoming(activeGrantId);
    if (!g) { body.innerHTML = '<p class="sub">Grant not found.</p>'; return; }
    if (title) title.textContent = g.name;
    var previewNote = g.precision === 'approx' || g.precision === 'venue'
      ? 'Approximate / venue only — no exact home geometry'
      : 'Exact fields if grant still active';
    body.innerHTML =
      '<div class="between mb-8"><span class="pill ghost">Incoming · demo</span><span class="g-status ' + g.status + '">' + statusLabel(g.status) + '</span></div>' +
      '<div class="pd-hero">' +
        '<div class="grant-avatar" style="background:' + g.color + '">' + g.initials + '</div>' +
        '<div>' +
          '<div class="strong" style="font-size:18px;font-family:var(--font-display)">' + g.name + '</div>' +
          '<div class="muted" style="font-size:12px">' + g.handle + ' → you (AL)</div>' +
        '</div>' +
      '</div>' +
      '<div class="card field-preview mb-12">' +
        '<div class="fact-row"><span class="muted">Purpose</span><span class="strong" style="font-size:13px">' + g.purpose + '</span></div>' +
        '<div class="fact-row"><span class="muted">Precision</span><span class="strong" style="font-size:13px">' + precLabel(g.precision) + '</span></div>' +
        '<div class="fact-row" style="border:none"><span class="muted">Window</span><span class="strong" style="font-size:12px">' + g.endLabel + '</span></div>' +
      '</div>' +
      '<div class="banner private mb-12"><span>◎</span><span>' + previewNote + '. Class: ' + g.class + '.</span></div>' +
      (g.status === 'active'
        ? '<button class="btn btn-primary" onclick="previewIncoming()">Preview</button>' +
          '<button class="btn btn-secondary mt-8" onclick="requestIncomingExtend()">Request extend</button>' +
          '<button class="btn btn-ghost mt-8" style="width:100%;color:var(--danger)" onclick="declineIncoming()">Decline</button>'
        : '<p class="sub mb-12">This incoming grant is no longer usable.</p>') +
      '<div class="section-label">Access history</div>' +
      '<div class="card"><div class="access-tl">' + renderHistory(g.history) + '</div></div>';
  }

  window.setGrantSelection = function (mode) {
    var g = findOutgoing(activeGrantId);
    if (!g || g.status === 'expired') { toast('Expired grants are read-only — Extend first'); return; }
    g.selection = mode;
    if (mode === 'fixed' && !g.placeId) g.placeId = 'place_ecc';
    renderPermissionDetail();
    toast(mode === 'follow' ? 'Selection: Follow home (demo)' : 'Selection: Fixed address version (demo)');
  };

  window.setGrantPrecision = function (mode) {
    var g = findOutgoing(activeGrantId);
    if (!g || g.status === 'expired') { toast('Expired grants are read-only — Extend first'); return; }
    g.precision = mode;
    renderPermissionDetail();
    toast(mode === 'exact' ? 'Precision: Exact pin (demo)' : 'Precision: Approximate area (demo)');
  };

  window.extendGrant = function () {
    var g = findOutgoing(activeGrantId);
    if (!g) return;
    g.status = 'active';
    g.endIso = '2026-09-28T20:00:00-05:00';
    g.endLabel = 'Sun Sep 28, 8:00 PM CT';
    g.countdown = 'Expires Sun Sep 28';
    g.endingSoon = true;
    g.history.unshift({ title: 'Grant extended', sub: 'Tue Sep 22 · just now · new end Sun Sep 28 CT', denied: false });
    renderPermissionDetail();
    updatePermissionsSummaries();
    toast('Extended through Sun Sep 28 CT (demo)');
  };

  window.copyRecipientLink = function () {
    var g = findOutgoing(activeGrantId);
    if (!g) return;
    var token = 'dml.link/r/' + g.id.replace('grant_', 'x7k') + '…';
    toast('Copied ' + token);
    setTimeout(function () {
      toast('Forwarding does not transfer ' + g.name + "'s grant");
    }, 2300);
  };

  window.openQrSheet = function () {
    var g = findOutgoing(activeGrantId);
    if (!g) return;
    var token = 'dml.link/r/' + g.id.replace('grant_', '') + '_opaque';
    var box = $('#perm-qr-box');
    var tok = $('#perm-qr-token');
    if (tok) tok.textContent = token;
    if (box) {
      // Simple placeholder QR-like SVG (not a real encoder)
      var cells = '';
      var seed = g.id.length;
      for (var y = 0; y < 11; y++) {
        for (var x = 0; x < 11; x++) {
          var on = ((x * 7 + y * 13 + seed) % 5) !== 0;
          if (x < 3 && y < 3) on = true;
          if (x > 7 && y < 3) on = true;
          if (x < 3 && y > 7) on = true;
          if (on) cells += '<rect x="' + (x * 14 + 8) + '" y="' + (y * 14 + 8) + '" width="12" height="12" fill="#1C1917"/>';
        }
      }
      box.innerHTML = '<svg viewBox="0 0 170 170" xmlns="http://www.w3.org/2000/svg"><rect width="170" height="170" fill="#F7F4EF"/>' + cells + '</svg>';
    }
    $('#perm-qr-backdrop').classList.add('show');
    $('#perm-qr-sheet').classList.add('show');
  };
  window.closeQrSheet = function () {
    $('#perm-qr-backdrop').classList.remove('show');
    $('#perm-qr-sheet').classList.remove('show');
  };

  window.openPreviewSheet = function () {
    var g = findOutgoing(activeGrantId);
    if (!g) return;
    var box = $('#perm-preview-body');
    var approx = g.precision === 'approx';
    var html = '<div class="share-preview-card mb-12">';
    html += '<div class="muted mb-8" style="font-size:11px">As ' + g.name + ' would see</div>';
    if (approx) {
      html += '<div class="map-canvas" style="height:120px;margin-bottom:10px;border-radius:12px">' +
        '<div class="map-blob" style="top:30%;left:28%;width:90px;height:70px"><span>Approx area</span></div>' +
        '</div>';
      html += '<div class="strong" style="font-size:14px">Neighborhood area · Austin</div>';
      html += '<p class="muted mt-8" style="font-size:12px">No street, unit, or exact pin. Approximate never leaks exact geometry.</p>';
    } else {
      var pl = g.selection === 'fixed' && g.placeId ? placeById(g.placeId) : PLACE_HOME;
      html += '<div class="strong" style="font-size:14px">' + pl.label + '</div>';
      html += '<div class="muted mt-8">' + pl.street + ' · ' + pl.unit + '</div>';
      html += '<div class="muted">' + pl.city + ', ' + pl.zip + '</div>';
    }
    html += '<div class="muted mt-12" style="font-size:11px">Purpose: ' + g.purpose + ' · until ' + g.endLabel + '</div>';
    html += '</div>';
    html += '<div class="banner private"><span>◎</span><span>Preview honors precision + pause + account binding. Wrong-account redemption is denied.</span></div>';
    if (box) box.innerHTML = html;
    $('#perm-preview-backdrop').classList.add('show');
    $('#perm-preview-sheet').classList.add('show');
  };
  window.closePreviewSheet = function () {
    $('#perm-preview-backdrop').classList.remove('show');
    $('#perm-preview-sheet').classList.remove('show');
  };

  window.openRevokeSheet = function () {
    var g = findOutgoing(activeGrantId);
    if (!g) return;
    var who = $('#perm-revoke-who');
    if (who) who.textContent = 'Stop access for ' + g.name + ' (' + g.handle + '). Pairwise ' + g.id + '.';
    $('#perm-revoke-backdrop').classList.add('show');
    $('#perm-revoke-sheet').classList.add('show');
  };
  window.closeRevokeSheet = function () {
    $('#perm-revoke-backdrop').classList.remove('show');
    $('#perm-revoke-sheet').classList.remove('show');
  };
  window.confirmRevokeGrant = function () {
    var g = findOutgoing(activeGrantId);
    if (!g) return;
    g.status = 'expired';
    g.countdown = 'Revoked just now';
    g.endLabel = 'Revoked Tue Sep 22 CT';
    g.endingSoon = false;
    if (g.class === 'inquiry') {
      g.exactRequested = false;
      g.inquiryStatus = 'submitted';
      g.history.unshift({ title: 'Inquiry access revoked', sub: 'Tue Sep 22 · just now · new disclosure blocked · copies not recalled', denied: true });
      toast('Inquiry revoked · grant ' + g.id + ' · copies not recalled');
    } else {
      g.history.unshift({ title: 'Grant revoked by you', sub: 'Tue Sep 22 · just now · copies/screenshots not recalled', denied: true });
      toast('Revoked — copies they already have cannot be recalled');
    }
    closeRevokeSheet();
    renderPermissionDetail();
    updatePermissionsSummaries();
  };

  window.previewIncoming = function () {
    var g = findIncoming(activeGrantId);
    if (!g) return;
    toast(g.precision === 'exact' ? 'Preview exact (if still active)' : 'Preview approximate / venue only');
  };
  window.requestIncomingExtend = function () {
    toast('Extend request sent (demo)');
  };
  window.declineIncoming = function () {
    var g = findIncoming(activeGrantId);
    if (!g) return;
    g.status = 'revoked';
    g.countdown = 'Declined by you';
    renderPermissionDetail();
    toast('Declined incoming grant (demo)');
  };

  window.setPublicHandle = function (mode) {
    publicHandleMode = mode;
    renderPermissionsHub();
    toast(mode === 'message' ? 'Handle: Message only (no address)' : 'Handle discoverability off');
  };

  window.openPublicMapSheet = function () {
    $('#perm-public-backdrop').classList.add('show');
    $('#perm-public-sheet').classList.add('show');
  };
  window.closePublicMapSheet = function () {
    $('#perm-public-backdrop').classList.remove('show');
    $('#perm-public-sheet').classList.remove('show');
  };
  window.pickPubLoc = function (btn) {
    pubDraft.loc = btn.getAttribute('data-pub-loc');
    $all('#perm-public-sheet [data-pub-loc]').forEach(function (b) { b.classList.toggle('on', b === btn); });
  };
  window.pickPubPrec = function (btn) {
    pubDraft.prec = btn.getAttribute('data-pub-prec');
    $all('#perm-public-sheet [data-pub-prec]').forEach(function (b) { b.classList.toggle('on', b === btn); });
  };
  window.pickPubDur = function (btn) {
    pubDraft.dur = btn.getAttribute('data-pub-dur');
    $all('#perm-public-sheet [data-pub-dur]').forEach(function (b) { b.classList.toggle('on', b === btn); });
  };
  window.confirmPublicMapOn = function () {
    publicMapOn = true;
    closePublicMapSheet();
    renderPermissionsHub();
    toast('Public map on (demo) — location + precision + window set');
  };
  window.turnPublicMapOff = function () {
    publicMapOn = false;
    renderPermissionsHub();
    toast('Public map off — peer grants unchanged');
  };

  /* —— Share wizard —— */
  window.openShareWizard = function () {
    shareDraft = { step: 1, recipient: null, selection: 'follow', placeId: 'place_ecc', precision: 'approx', purpose: 'Visit', duration: 'fri' };
    renderShareWizard();
    $('#share-wizard-backdrop').classList.add('show');
    $('#share-wizard-sheet').classList.add('show');
  };
  window.closeShareWizard = function () {
    $('#share-wizard-backdrop').classList.remove('show');
    $('#share-wizard-sheet').classList.remove('show');
  };

  function renderShareWizard() {
    var box = $('#share-wizard-steps');
    if (!box) return;
    var s = shareDraft.step;
    var html = '<div class="muted mb-12" style="font-size:11px">Step ' + s + ' of 7</div>';
    if (s === 1) {
      html += '<div class="share-step-label">Recipient</div>';
      html += '<div class="field mb-8"><label>Search handle</label><input id="share-handle-input" placeholder="@maya" value="@maya" oninput="filterShareRecipients(this.value)" /></div>';
      html += '<div id="share-recipient-hits"></div>';
    } else if (s === 2) {
      html += '<div class="share-step-label">Destination</div>';
      html += '<div class="policy-option' + (shareDraft.selection === 'follow' ? ' on' : '') + '" onclick="sharePickSelection(\'follow\')"><div class="po-radio"></div><div><div class="po-title">Follow current home</div><div class="po-sub">' + PLACE_HOME.label + '</div></div></div>';
      html += '<div class="policy-option' + (shareDraft.selection === 'fixed' ? ' on' : '') + '" onclick="sharePickSelection(\'fixed\')"><div class="po-radio"></div><div><div class="po-title">Fixed address version</div><div class="po-sub">Pick a place below</div></div></div>';
      if (shareDraft.selection === 'fixed') {
        html += '<div class="chip-row mt-8">';
        ['place_ecc', 'place_sl', 'place_lobby'].forEach(function (pid) {
          html += '<button type="button" class="purpose-chip' + (shareDraft.placeId === pid ? ' on' : '') + '" onclick="sharePickPlace(\'' + pid + '\')">' + PLACE_LABELS[pid] + '</button>';
        });
        html += '</div>';
      }
    } else if (s === 3) {
      html += '<div class="share-step-label">Precision</div>';
      html += '<div class="policy-option' + (shareDraft.precision === 'exact' ? ' on' : '') + '" onclick="sharePickPrecision(\'exact\')"><div class="po-radio"></div><div><div class="po-title">Exact pin</div><div class="po-sub">Street / unit when allowed</div></div></div>';
      html += '<div class="policy-option' + (shareDraft.precision === 'approx' ? ' on' : '') + '" onclick="sharePickPrecision(\'approx\')"><div class="po-radio"></div><div><div class="po-title">Approximate area</div><div class="po-sub">Neighborhood blob only</div></div></div>';
    } else if (s === 4) {
      html += '<div class="share-step-label">Purpose</div>';
      html += '<div class="chip-row">';
      ['Visit', 'Delivery handoff', 'Temporary stay', 'Other'].forEach(function (p) {
        html += '<button type="button" class="purpose-chip' + (shareDraft.purpose === p ? ' on' : '') + '" onclick="sharePickPurpose(\'' + p + '\')">' + p + '</button>';
      });
      html += '</div>';
    } else if (s === 5) {
      html += '<div class="share-step-label">Duration</div>';
      html += '<div class="chip-row">';
      [{ id: 'fri', l: 'Until Fri evening' }, { id: '3d', l: '3 days' }, { id: 'custom', l: 'Custom' }].forEach(function (d) {
        html += '<button type="button" class="purpose-chip' + (shareDraft.duration === d.id ? ' on' : '') + '" onclick="sharePickDuration(\'' + d.id + '\')">' + d.l + '</button>';
      });
      html += '</div>';
      html += '<p class="muted mt-12" style="font-size:11px">Peer grants require expiry · times in America/Chicago (CT).</p>';
    } else if (s === 6) {
      var r = shareDraft.recipient;
      html += '<div class="share-step-label">Preview</div>';
      html += '<div class="share-preview-card">';
      html += '<div class="strong">' + (r ? r.name : 'Recipient') + ' will see</div>';
      if (shareDraft.precision === 'approx') {
        html += '<p class="muted mt-8">Approximate neighborhood only · no exact pin</p>';
      } else {
        var pl = shareDraft.selection === 'fixed' ? placeById(shareDraft.placeId) : PLACE_HOME;
        html += '<p class="muted mt-8">' + pl.street + ' · ' + pl.unit + '</p>';
      }
      html += '<p class="muted mt-8" style="font-size:11px">' + shareDraft.purpose + ' · ' + (shareDraft.selection === 'follow' ? 'Follow home' : 'Fixed') + ' · ' + durationLabel(shareDraft.duration) + '</p>';
      html += '</div>';
    } else if (s === 7) {
      html += '<div class="share-step-label">Confirm</div>';
      html += '<div class="banner private mb-12"><span>◎</span><span>Creates pairwise grant ID bound to account — not the mutable handle. Demo only.</span></div>';
      html += '<button class="btn btn-primary" onclick="confirmShareWizard()">Confirm share</button>';
      html += '<button class="btn btn-ghost mt-8" style="width:100%" onclick="closeShareWizard()">Cancel</button>';
    }
    if (s < 7) {
      html += '<div class="wiz-nav">';
      html += '<button class="btn btn-ghost" onclick="shareWizardBack()"' + (s === 1 ? ' disabled style="opacity:.4"' : '') + '>Back</button>';
      html += '<button class="btn btn-primary" onclick="shareWizardNext()">Next</button>';
      html += '</div>';
    } else if (s === 7) {
      html += '<div class="wiz-nav"><button class="btn btn-ghost" onclick="shareWizardBack()">Back</button></div>';
    }
    box.innerHTML = html;
    if (s === 1) {
      filterShareRecipients(($('#share-handle-input') && $('#share-handle-input').value) || '@maya');
    }
  }

  function durationLabel(id) {
    if (id === '3d') return '3 days';
    if (id === 'custom') return 'Custom window';
    return 'Until Fri evening';
  }

  window.filterShareRecipients = function (q) {
    var box = $('#share-recipient-hits');
    if (!box) return;
    q = (q || '').toLowerCase();
    box.innerHTML = '';
    DEMO_RECIPIENTS.filter(function (r) {
      return !q || r.handle.indexOf(q) >= 0 || r.name.toLowerCase().indexOf(q.replace('@', '')) >= 0;
    }).forEach(function (r) {
      var on = shareDraft.recipient && shareDraft.recipient.accountId === r.accountId;
      var row = document.createElement('div');
      row.className = 'handle-hit' + (on ? ' on' : '');
      row.innerHTML = '<div class="grant-avatar" style="background:' + r.color + '">' + r.initials + '</div>' +
        '<div class="flex-1"><div class="strong" style="font-size:13px">' + r.name + '</div>' +
        '<div class="muted" style="font-size:11px">' + r.handle + ' · ' + r.accountId + '</div></div>' +
        (on ? '<span class="pill sage">Selected</span>' : '');
      row.addEventListener('click', function () {
        shareDraft.recipient = r;
        filterShareRecipients(q);
      });
      box.appendChild(row);
    });
  };

  window.sharePickSelection = function (m) { shareDraft.selection = m; renderShareWizard(); };
  window.sharePickPlace = function (pid) { shareDraft.placeId = pid; shareDraft.selection = 'fixed'; renderShareWizard(); };
  window.sharePickPrecision = function (m) { shareDraft.precision = m; renderShareWizard(); };
  window.sharePickPurpose = function (p) { shareDraft.purpose = p; renderShareWizard(); };
  window.sharePickDuration = function (d) { shareDraft.duration = d; renderShareWizard(); };

  window.shareWizardNext = function () {
    if (shareDraft.step === 1 && !shareDraft.recipient) { toast('Confirm a recipient account'); return; }
    if (shareDraft.step < 7) { shareDraft.step++; renderShareWizard(); }
  };
  window.shareWizardBack = function () {
    if (shareDraft.step > 1) { shareDraft.step--; renderShareWizard(); }
  };

  window.confirmShareWizard = function () {
    var r = shareDraft.recipient;
    if (!r) { toast('Pick a recipient'); return; }
    var nid = 'grant_' + r.handle.replace('@', '') + '_' + Math.floor(Math.random() * 9000 + 1000).toString(16);
    var endLabel = shareDraft.duration === '3d' ? 'Fri Sep 25, 5:00 PM CT' : (shareDraft.duration === 'custom' ? 'Custom window (demo)' : 'Fri Sep 25, 8:00 PM CT');
    outgoingGrants.unshift({
      id: nid,
      name: r.name,
      handle: r.handle,
      accountId: r.accountId,
      initials: r.initials,
      color: r.color,
      class: 'peer',
      precision: shareDraft.precision,
      selection: shareDraft.selection,
      placeId: shareDraft.selection === 'fixed' ? shareDraft.placeId : null,
      purpose: shareDraft.purpose,
      status: 'active',
      startIso: '2026-09-22T17:49:00-05:00',
      endIso: '2026-09-25T20:00:00-05:00',
      endLabel: endLabel,
      countdown: 'Expires Fri',
      endingSoon: true,
      instructions: null,
      history: [
        { title: 'Grant created', sub: 'Tue Sep 22 · just now · demo pairwise share', denied: false }
      ]
    });
    closeShareWizard();
    permTab = 'shared';
    updatePermissionsSummaries();
    toast('Shared with ' + r.name + ' · ' + nid);
    openGrantDetail(nid, 'out');
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
    updateConnectedServicesSummaries();
    updatePermissionsSummaries();
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
