(function () {
  const navMemory = { today: 'today', map: 'map', places: 'places', explore: 'explore', you: 'you' };
  let current = 'today';

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return [...(root || document).querySelectorAll(sel)]; }

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
    if (name === 'ledger' || name === 'move-planning' || name === 'permissions' || name === 'connections' || name === 'support') {
      navMemory.you = name;
    }
    if (name === 'arrival-detail' || name === 'appointment-detail') navMemory.today = name;
    updateNav(navKey);
    next.scrollTop = 0;
    try { history.replaceState(null, '', '#' + name); } catch (e) {}
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

  var toastTimer;
  window.toast = function (msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  };

  function boot() {
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
