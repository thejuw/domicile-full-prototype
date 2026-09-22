(function () {
  const navMemory = { today: 'today', map: 'map', places: 'places', explore: 'explore', you: 'you' };
  let current = 'today';

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return [...(root || document).querySelectorAll(sel)]; }

  const YOU_SCREENS = {
    'ledger': 1, 'move-planning': 1, 'move-checklist': 1, 'move-draft': 1, 'move-usps': 1,
    'permissions': 1, 'connections': 1, 'connected-services': 1, 'connected-service-detail': 1, 'support': 1
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
    if (name === 'you' || name === 'today') updateConnectedServicesSummaries();
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
