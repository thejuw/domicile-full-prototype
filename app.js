(function () {
  const navMemory = {
    today: 'today', map: 'map', places: 'places', explore: 'explore', you: 'you',
    'biz-today': 'biz-today', 'biz-inbox': 'biz-inbox', 'biz-jobs': 'biz-jobs', 'biz-profile': 'biz-profile',
    'crew-today': 'crew-today', 'crew-jobs': 'crew-jobs', 'crew-me': 'crew-me'
  };
  let current = 'today';

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return [...(root || document).querySelectorAll(sel)]; }

  const YOU_SCREENS = {
    'ledger': 1, 'move-planning': 1, 'move-checklist': 1, 'move-draft': 1, 'move-usps': 1,
    'permissions': 1, 'permission-detail': 1, 'connections': 1, 'connected-services': 1, 'connected-service-detail': 1, 'support': 1,
    'org-events': 1, 'org-event-edit': 1, 'org-event-detail': 1, 'org-event-participant': 1
  };

  var BIZ_SCREENS = {
    'biz-today': 1, 'biz-inbox': 1, 'biz-inquiry-detail': 1,
    'biz-jobs': 1, 'biz-job-detail': 1, 'biz-profile': 1,
    'biz-public-profile': 1, 'biz-catalog': 1, 'biz-catalog-detail': 1,
    'biz-coverage': 1, 'biz-schedule': 1,
    'biz-customers': 1, 'biz-customer-detail': 1,
    'biz-team': 1, 'biz-team-member': 1,
    'biz-finance': 1, 'biz-invoice-detail': 1, 'biz-payments': 1,
    'biz-integrations': 1, 'biz-growth': 1, 'biz-settings': 1
  };

  var CREW_SCREENS = {
    'crew-today': 1, 'crew-jobs': 1, 'crew-job-detail': 1, 'crew-me': 1
  };

  var PUBLIC_SCREENS = {
    'public-entry': 1, 'public-qr': 1, 'public-business': 1, 'public-event': 1,
    'public-stay': 1, 'public-stay-invite': 1, 'public-place': 1, 'public-handle': 1,
    'public-signin': 1, 'public-gallery': 1
  };

  // Three platform accounts: Al Personal · Al Owner @ Cedar · Casey Crew @ Cedar
  var activeWorkspace = 'personal'; // personal | business | crew
  var activeOrg = null; // 'cedar' when business or crew
  var activeAccount = 'al'; // 'al' | 'casey'
  var activeBizRole = 'owner'; // owner | crew (legacy lens on owner profile)
  var activeBizInquiryId = 'grant_inq_cedar_7a2f';
  // W8 public/guest session (standalone shell — not full account switcher)
  var publicSession = { signedIn: false, alias: null, continuedAt: null };
  var publicReturnScreen = 'public-entry';
  var publicGrantId = 'grant_maya_4c2e';
  var publicQrToken = 'maya_4c2e_opaque';
  var publicPriorWorkspace = 'personal';
  var publicInquiryAlias = 'Garden Guest';
  var publicEventAlias = 'Porch Curious';
  var publicStayInviteAccepted = null; // null | true | false
  var activeBizJobId = null;
  var activeCrewJobId = null;
  var activeBizCustomerId = null;
  var activeBizInvoiceId = null;
  var activeBizCatalogId = null;
  var activeBizTeamMemberId = null;
  var activeBizFinanceTab = 'invoices'; // invoices | payments | payouts | exceptions
  var bizQuoteSeq = 1;
  var bizDemoRoleView = 'owner'; // optional owner-only lens; primary story is Casey account
  var bizPausedAccepting = false;
  var bizLastReconciledLabel = 'Sep 20 · 4:12p CT';
  var bizCatalogSeq = 4;

  var CREW_PEOPLE = {
    casey: { id: 'casey', name: 'Casey Nguyen', short: 'Casey', initials: 'CN', color: '#6a7a55', fullAccount: true },
    riley: { id: 'riley', name: 'Riley Okonkwo', short: 'Riley', initials: 'RO', color: '#8a7355', fullAccount: false }
  };

  // Shared jobs board — Owner sees all; Crew (Casey) filters assigneeId === 'casey'
  // River Guest deep-clean is created by Accept quote (E2E); other rows seed the board.
  // Seed ISO helpers — relative to page load so mid-flight duration is honest
  function seedIsoMinutesAgo(mins) {
    return new Date(Date.now() - mins * 60000).toISOString();
  }
  function seedIsoHoursAgo(hours, extraMins) {
    return seedIsoMinutesAgo(hours * 60 + (extraMins || 0));
  }

  var bizJobs = [
    {
      id: 'job_turnover_02',
      inquiryId: null,
      service: 'Turnover',
      whenLabel: 'Fri Sep 26 · 9–11',
      whenShort: 'Fri · 9–11',
      customerAlias: 'Loft Host',
      status: 'in_progress',
      assigneeId: 'casey',
      addressExact: '2110 S Lamar Blvd · Apt 3B',
      addressApprox: 'South Lamar area',
      accessNotes: 'Lockbox 4421 · quiet hours after 10',
      placeId: 'place_sl',
      crewPhase: 'on_way',
      startedAt: seedIsoMinutesAgo(26),
      onTheWayAt: seedIsoMinutesAgo(10),
      completedAt: null,
      statusLog: [
        { status: 'scheduled', atIso: seedIsoHoursAgo(5, 12), byAccountId: 'al', byLabel: 'Owner Al', note: 'Assigned to Casey' },
        { status: 'started', atIso: seedIsoMinutesAgo(26), byAccountId: 'casey', byLabel: 'Casey Nguyen' },
        { status: 'on_way', atIso: seedIsoMinutesAgo(10), byAccountId: 'casey', byLabel: 'Casey Nguyen' }
      ]
    },
    {
      id: 'job_recurring_03',
      inquiryId: null,
      service: 'Recurring tidy',
      whenLabel: 'Wed Sep 24 · done',
      whenShort: 'Wed · done',
      customerAlias: 'Maple Client',
      status: 'completed',
      assigneeId: 'casey',
      addressExact: '1204 E Cesar Chavez St · Unit 204',
      addressApprox: 'East Cesar Chavez area',
      accessNotes: 'Side gate · dog friendly',
      placeId: 'place_ecc',
      crewPhase: 'completed',
      startedAt: seedIsoHoursAgo(48, 90),
      onTheWayAt: seedIsoHoursAgo(48, 75),
      completedAt: seedIsoHoursAgo(48, 20),
      statusLog: [
        { status: 'scheduled', atIso: seedIsoHoursAgo(72), byAccountId: 'al', byLabel: 'Owner Al', note: 'Assigned to Casey' },
        { status: 'started', atIso: seedIsoHoursAgo(48, 90), byAccountId: 'casey', byLabel: 'Casey Nguyen' },
        { status: 'on_way', atIso: seedIsoHoursAgo(48, 75), byAccountId: 'casey', byLabel: 'Casey Nguyen' },
        { status: 'completed', atIso: seedIsoHoursAgo(48, 20), byAccountId: 'casey', byLabel: 'Casey Nguyen' }
      ]
    },
    {
      id: 'job_window_04',
      inquiryId: null,
      service: 'Move-out clean',
      whenLabel: 'Sat Sep 27 · 1–5',
      whenShort: 'Sat · 1–5',
      customerAlias: 'Unassigned Guest',
      status: 'needs_assign',
      assigneeId: null,
      addressExact: null,
      addressApprox: 'East Austin · approx',
      accessNotes: null,
      placeId: null,
      crewPhase: null,
      startedAt: null,
      onTheWayAt: null,
      completedAt: null,
      statusLog: [
        { status: 'needs_assign', atIso: seedIsoHoursAgo(2), byAccountId: 'al', byLabel: 'Owner Al', note: 'Job created · needs crew' }
      ]
    }
  ];

  /* ========== Business suite seed (W2 · Finance · CRM · Catalog) ========== */
  var BIZ_ORG = {
    id: 'acct_cedar_stone_01',
    legalName: 'Cedar & Stone Clean Co. LLC',
    displayName: 'Cedar & Stone Clean Co.',
    handle: '@cedarstone',
    ownerLabel: 'Owner Al',
    timezone: 'America/Chicago',
    about: 'Small East Austin cleaning team. Quiet during work hours. Matched privately in Explore — never notified by browse alone.',
    categories: ['Home cleaning', 'Turnover', 'Move-out'],
    coverageBlurb: 'Serves East Austin · mobile stops along Cesar Chavez & South Lamar corridors',
    hours: 'Mon–Sat · 8a–6p CT · Sundays by arrangement'
  };

  var bizCatalog = [
    {
      id: 'offer_deep_01',
      name: 'Deep clean',
      version: 'v3',
      priceBasis: 'From $185 · flat by home size',
      duration: '3–5 hours',
      inclusions: 'Kitchen, baths, floors, dusting, inside fridge on request',
      exclusions: 'Windows exterior · oven coils · garage',
      intakeNotes: 'Pets? Parking? Preferred products?',
      active: true
    },
    {
      id: 'offer_turnover_01',
      name: 'Turnover',
      version: 'v2',
      priceBasis: 'From $120 · per turnover window',
      duration: '2–3 hours',
      inclusions: 'Guest reset, linens staging, trash out, restock checklist',
      exclusions: 'Laundry off-site · deep appliance',
      intakeNotes: 'Lockbox / code · next guest ETA',
      active: true
    },
    {
      id: 'offer_tidy_01',
      name: 'Tidy',
      version: 'v1',
      priceBasis: 'From $75 · recurring weekly/biweekly',
      duration: '1.5–2.5 hours',
      inclusions: 'Surfaces, floors, baths touch-up, kitchen wipe',
      exclusions: 'Inside oven · laundry · organization projects',
      intakeNotes: 'Access notes · quiet hours',
      active: true
    }
  ];

  var bizCustomers = [
    {
      id: 'cust_river_01',
      alias: 'River Guest',
      initials: 'RG',
      color: '#5a7a8a',
      kind: 'inquiry_alias',
      grantId: 'grant_inq_cedar_7a2f',
      notes: 'Inquiry alias from private Explore path. Deliberate contact only — not a browse lead.',
      openInquiryIds: ['grant_inq_cedar_7a2f'],
      jobIds: ['job_deep_river_01'],
      invoiceIds: ['inv_river_deep_01'],
      status: 'open'
    },
    {
      id: 'cust_loft_02',
      alias: 'Loft Host',
      initials: 'LH',
      color: '#7a6a55',
      kind: 'past_customer',
      grantId: null,
      notes: 'Recurring turnover client · South Lamar loft. Past accepted jobs only.',
      openInquiryIds: [],
      jobIds: ['job_turnover_02'],
      invoiceIds: ['inv_loft_turnover_02'],
      status: 'active'
    },
    {
      id: 'cust_maple_03',
      alias: 'Maple Client',
      initials: 'MC',
      color: '#6a7a55',
      kind: 'past_customer',
      grantId: null,
      notes: 'East Cesar Chavez recurring tidy. Completed Wed Sep 24.',
      openInquiryIds: [],
      jobIds: ['job_recurring_03'],
      invoiceIds: ['inv_maple_tidy_03'],
      status: 'active'
    }
  ];

  // Invoices: quoted ≠ invoiced ≠ paid ≠ paid-out (P59)
  var bizInvoices = [
    {
      id: 'inv_river_deep_01',
      customerId: 'cust_river_01',
      jobId: 'job_deep_river_01',
      inquiryId: 'grant_inq_cedar_7a2f',
      label: 'Deep clean · River Guest',
      quotedCents: 21000,
      invoicedCents: 21000,
      paidCents: 0,
      paidOutCents: 0,
      depositCents: 5000,
      creditCents: 0,
      feeCents: 0,
      status: 'outstanding',
      issuedLabel: 'Sep 22 · draft after quote',
      dueLabel: 'Due on completion',
      lines: [
        { desc: 'Deep clean · East Austin cottage', amountCents: 18500 },
        { desc: 'Inside fridge add-on', amountCents: 2500 }
      ],
      notes: 'Quoted $210 · invoiced $210 · not yet paid · not paid out'
    },
    {
      id: 'inv_loft_turnover_02',
      customerId: 'cust_loft_02',
      jobId: 'job_turnover_02',
      inquiryId: null,
      label: 'Turnover · Loft Host',
      quotedCents: 13500,
      invoicedCents: 12800,
      paidCents: 12800,
      paidOutCents: 0,
      depositCents: 0,
      creditCents: 700,
      feeCents: 384,
      status: 'paid_pending_payout',
      issuedLabel: 'Sep 26 · mid-job',
      dueLabel: 'Paid Sep 26',
      lines: [
        { desc: 'Turnover · Apt 3B', amountCents: 12000 },
        { desc: 'Linen staging', amountCents: 800 }
      ],
      notes: 'Quoted $135 · credit $7 · invoiced $128 · paid $128 · payout pending (fees $3.84)'
    },
    {
      id: 'inv_maple_tidy_03',
      customerId: 'cust_maple_03',
      jobId: 'job_recurring_03',
      inquiryId: null,
      label: 'Recurring tidy · Maple Client',
      quotedCents: 8500,
      invoicedCents: 8500,
      paidCents: 8500,
      paidOutCents: 8100,
      depositCents: 0,
      creditCents: 0,
      feeCents: 255,
      status: 'paid_out',
      issuedLabel: 'Sep 24',
      dueLabel: 'Paid out Sep 25',
      lines: [
        { desc: 'Biweekly tidy · Unit 204', amountCents: 8500 }
      ],
      notes: 'Quoted = invoiced = paid $85 · paid out $81.00 after $2.55 fee'
    },
    {
      id: 'inv_exception_04',
      customerId: 'cust_loft_02',
      jobId: null,
      inquiryId: null,
      label: 'Partial refund · Loft Host Aug',
      quotedCents: 12000,
      invoicedCents: 12000,
      paidCents: 12000,
      paidOutCents: 9000,
      depositCents: 0,
      creditCents: 0,
      feeCents: 360,
      status: 'exception',
      issuedLabel: 'Aug 18',
      dueLabel: 'Refund $30 pending review',
      lines: [
        { desc: 'Turnover Aug 18', amountCents: 12000 },
        { desc: 'Guest complaint credit (demo)', amountCents: -3000 }
      ],
      notes: 'Exception path · refund demo · not auto-wallet'
    }
  ];

  var bizPayouts = [
    { id: 'po_sep_25', label: 'Sep 25 payout', amountCents: 8100, status: 'completed', arrivedLabel: 'Sep 25 · 9:02a CT', dest: '····4821 · checking' },
    { id: 'po_sep_18', label: 'Sep 18 payout', amountCents: 21450, status: 'completed', arrivedLabel: 'Sep 18 · 8:44a CT', dest: '····4821 · checking' },
    { id: 'po_sep_27', label: 'Next payout (est.)', amountCents: 12416, status: 'scheduled', arrivedLabel: 'Fri Sep 27 · est.', dest: '····4821 · checking' }
  ];

  var bizPaymentAttempts = [
    { id: 'pay_maple_01', invoiceId: 'inv_maple_tidy_03', label: 'Card · Maple Client', amountCents: 8500, status: 'succeeded', atLabel: 'Sep 24 · 3:18p' },
    { id: 'pay_loft_01', invoiceId: 'inv_loft_turnover_02', label: 'Card · Loft Host', amountCents: 12800, status: 'succeeded', atLabel: 'Sep 26 · 11:02a' },
    { id: 'pay_loft_ret_01', invoiceId: 'inv_exception_04', label: 'Return · Loft Host Aug', amountCents: 3000, status: 'returned', atLabel: 'Aug 20 · return code R01 (demo)' },
    { id: 'pay_refund_demo', invoiceId: 'inv_exception_04', label: 'Refund pending · Loft Host', amountCents: 3000, status: 'refund_pending', atLabel: 'Awaiting owner confirm' }
  ];

  var bizIntegrations = [
    { id: 'int_gcal', name: 'Google Calendar', kind: 'calendar', status: 'connected', authority: 'Create job blocks · read free/busy', honesty: 'Demo connector · not real OAuth' },
    { id: 'int_ical', name: 'Apple Calendar (ICS)', kind: 'calendar', status: 'not_connected', authority: 'Export availability ICS', honesty: 'Would sync one-way when connected' },
    { id: 'int_crm', name: 'Lightweight CRM export', kind: 'crm', status: 'connected', authority: 'Export deliberate contacts only', honesty: 'No browse-lead import · ever' },
    { id: 'int_stripe', name: 'Hosted payment processor', kind: 'payments', status: 'connected', authority: 'Charges · payouts · refunds via hosted UI', honesty: 'No card numbers stored in Domicile' },
    { id: 'int_slack', name: 'Crew alerts (Slack)', kind: 'ops', status: 'needs_reauth', authority: 'Job assign pings', honesty: 'Needs reauth · demo toggle only' }
  ];

  var bizGrowth = {
    periodLabel: 'Sep 1–22 CT',
    inquiries: 14,
    quotesSent: 11,
    accepted: 8,
    completed: 6,
    sponsoredClicks: 3,
    organicInquiries: 11,
    campaigns: [
      { id: 'camp_east', name: 'East Austin tidy promo', channel: 'organic', status: 'active', inquiries: 5, quotes: 4, accepted: 3 },
      { id: 'camp_ad', name: 'Explore sponsored tile', channel: 'sponsored', status: 'paused', inquiries: 3, quotes: 2, accepted: 1 }
    ]
  };

  var bizSettings = {
    legalName: 'Cedar & Stone Clean Co. LLC',
    timezone: 'America/Chicago',
    notifyInquiries: true,
    notifyPayouts: true,
    notifyExceptions: true,
    quietHours: '9p–7a CT',
    roleDefaultCrew: 'Assigned jobs · schedule · no finance',
    roleDefaultOwner: 'Full inbox · quotes · finance · reset'
  };

  var BIZ_ROLE_CAPS = [
    { key: 'inquiries', label: 'View / reply inquiries', owner: true, crew: false },
    { key: 'quotes', label: 'Send quotes', owner: true, crew: false },
    { key: 'exact', label: 'Request exact address', owner: true, crew: false },
    { key: 'assign', label: 'Assign / reassign crew', owner: true, crew: false },
    { key: 'job_status', label: 'Advance own job status', owner: true, crew: true },
    { key: 'reset', label: 'Reset job status', owner: true, crew: false },
    { key: 'finance', label: 'Finance · invoices · payouts', owner: true, crew: false },
    { key: 'settings', label: 'Business settings', owner: true, crew: false },
    { key: 'customers', label: 'Full CRM', owner: true, crew: false }
  ];

  function money(cents) {
    var n = Math.round(cents || 0) / 100;
    var sign = n < 0 ? '-' : '';
    var abs = Math.abs(n);
    if (abs === Math.floor(abs) && abs >= 1) return sign + '$' + abs.toFixed(0);
    return sign + '$' + abs.toFixed(2);
  }
  function money2(cents) {
    var n = Math.round(cents || 0) / 100;
    var sign = n < 0 ? '-' : '';
    return sign + '$' + Math.abs(n).toFixed(2);
  }
  function findBizCustomer(id) {
    for (var i = 0; i < bizCustomers.length; i++) if (bizCustomers[i].id === id) return bizCustomers[i];
    return null;
  }
  function findBizInvoice(id) {
    for (var i = 0; i < bizInvoices.length; i++) if (bizInvoices[i].id === id) return bizInvoices[i];
    return null;
  }
  function findBizOffering(id) {
    for (var i = 0; i < bizCatalog.length; i++) if (bizCatalog[i].id === id) return bizCatalog[i];
    return null;
  }
  function requireBizOwner(actionLabel) {
    if (activeWorkspace !== 'business' || activeAccount !== 'al') {
      toast((actionLabel || 'Owner action') + ' · switch to Cedar Owner');
      return false;
    }
    return true;
  }
  function bizHubStats() {
    var openInq = 0;
    try {
      outgoingGrants.forEach(function (g) {
        if (g && g.class === 'inquiry' && g.accountId === 'acct_cedar_stone_01' && g.status !== 'expired' && g.status !== 'revoked') openInq++;
      });
    } catch (e) { openInq = 1; }
    if (!openInq) openInq = 1;
    var jobsToday = bizJobs.filter(function (j) {
      return j.status === 'in_progress' || j.status === 'scheduled' || j.status === 'needs_assign';
    }).length;
    var ar = 0;
    bizInvoices.forEach(function (inv) {
      if (inv.status === 'outstanding') ar += (inv.invoicedCents - inv.paidCents);
    });
    var nextPo = bizPayouts.filter(function (p) { return p.status === 'scheduled'; })[0];
    return {
      openInquiries: openInq,
      jobsToday: jobsToday,
      outstandingArCents: ar,
      nextPayoutCents: nextPo ? nextPo.amountCents : 0,
      nextPayoutLabel: nextPo ? nextPo.arrivedLabel : '—'
    };
  }

  // Cross-mode rule: navigating to a screen belonging to another workspace
  // auto-switches the account (with toast), then opens that screen.
  // Documented in README.

  function isBizScreen(name) {
    return !!BIZ_SCREENS[name] || (name && name.indexOf('biz-') === 0);
  }

  function isCrewScreen(name) {
    return !!CREW_SCREENS[name] || (name && name.indexOf('crew-') === 0);
  }

  function isPublicScreen(name) {
    return !!PUBLIC_SCREENS[name] || (name && name.indexOf('public-') === 0);
  }

  function applyWorkspaceChrome() {
    var phone = document.querySelector('.phone') || document.body;
    var pers = $('#bottom-nav-personal');
    var biz = $('#bottom-nav-business');
    var crew = $('#bottom-nav-crew');
    if (pers) pers.classList.add('hide');
    if (biz) biz.classList.add('hide');
    if (crew) crew.classList.add('hide');
    if (phone) {
      phone.classList.remove('biz-mode', 'crew-mode', 'public-mode');
    }
    if (activeWorkspace === 'public') {
      if (phone) phone.classList.add('public-mode');
      // No bottom nav in guest shell
    } else if (activeWorkspace === 'business') {
      if (biz) biz.classList.remove('hide');
      if (phone) phone.classList.add('biz-mode');
    } else if (activeWorkspace === 'crew') {
      if (crew) crew.classList.remove('hide');
      if (phone) phone.classList.add('crew-mode');
    } else {
      if (pers) pers.classList.remove('hide');
    }
  }

  function switchWorkspace(mode, opts) {
    opts = opts || {};
    var prev = activeWorkspace;
    var prevAcct = activeAccount;
    if (mode === 'public') {
      if (prev !== 'public') publicPriorWorkspace = prev;
      activeWorkspace = 'public';
      // Keep activeAccount as-is for demo continuity; guest shell does not use bottom nav
    } else if (mode === 'business') {
      activeWorkspace = 'business';
      activeOrg = opts.org || 'cedar';
      activeAccount = 'al';
      activeBizRole = 'owner';
      bizDemoRoleView = 'owner';
    } else if (mode === 'crew') {
      activeWorkspace = 'crew';
      activeOrg = opts.org || 'cedar';
      activeAccount = 'casey';
      activeBizRole = 'crew';
    } else {
      activeWorkspace = 'personal';
      activeOrg = null;
      activeAccount = 'al';
    }
    applyWorkspaceChrome();
    if (opts.toast && (prev !== activeWorkspace || prevAcct !== activeAccount)) {
      if (activeWorkspace === 'public') {
        /* silent — guest shell */
      } else if (activeWorkspace === 'business') {
        toast('Switched to Cedar & Stone · Owner');
      } else if (activeWorkspace === 'crew') {
        toast('Switched to Casey · Crew @ Cedar & Stone');
      } else if (prev === 'public') {
        /* returning from guest — optional soft toast handled by exitPublicToApp */
      } else {
        toast('Switched to Personal · @al');
      }
    }
  }

  function findJob(id) {
    for (var i = 0; i < bizJobs.length; i++) if (bizJobs[i].id === id) return bizJobs[i];
    return null;
  }

  function execStatusKey(j) {
    if (!j) return '';
    if (typeof j === 'string') return j;
    if (j.status === 'completed' || j.crewPhase === 'completed') return 'completed';
    if (j.status === 'in_progress') {
      if (j.crewPhase === 'on_way') return 'on_way';
      if (j.crewPhase === 'started') return 'started';
      return 'in_progress';
    }
    return j.status || '';
  }

  function jobStatusPill(jobOrStatus) {
    var key = typeof jobOrStatus === 'string' ? jobOrStatus : execStatusKey(jobOrStatus);
    if (key === 'completed') return { cls: 'ok', label: 'Completed' };
    if (key === 'on_way') return { cls: 'warn', label: 'On the way' };
    if (key === 'started') return { cls: 'warn', label: 'Started' };
    if (key === 'in_progress') return { cls: 'warn', label: 'In progress' };
    if (key === 'needs_assign') return { cls: 'warn', label: 'Needs crew' };
    if (key === 'scheduled') return { cls: 'sage', label: 'Scheduled' };
    return { cls: 'ghost', label: key || '—' };
  }

  function statusKeyLabel(key) {
    var map = {
      needs_assign: 'Needs crew',
      scheduled: 'Scheduled',
      started: 'Started',
      on_way: 'On the way',
      in_progress: 'In progress',
      completed: 'Completed'
    };
    return map[key] || key || '—';
  }

  function formatCtClock(d) {
    if (!(d instanceof Date) || isNaN(d.getTime())) return '—';
    var h = d.getHours();
    var m = d.getMinutes();
    var ap = h >= 12 ? 'p' : 'a';
    h = h % 12;
    if (!h) h = 12;
    return h + ':' + (m < 10 ? '0' : '') + m + ap;
  }

  function formatCtStamp(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return days[d.getDay()] + ' ' + months[d.getMonth()] + ' ' + d.getDate() + ' · ' + formatCtClock(d) + ' CT';
  }

  function formatDurationShort(ms) {
    if (ms == null || isNaN(ms)) return '—';
    if (ms < 0) ms = 0;
    var mins = Math.floor(ms / 60000);
    if (mins < 1) return '<1m';
    if (mins < 60) return mins + 'm';
    var h = Math.floor(mins / 60);
    var m = mins % 60;
    return m ? (h + 'h ' + m + 'm') : (h + 'h');
  }

  function ensureJobStatusFields(j) {
    if (!j) return j;
    if (!j.statusLog) j.statusLog = [];
    if (j.startedAt === undefined) j.startedAt = null;
    if (j.onTheWayAt === undefined) j.onTheWayAt = null;
    if (j.completedAt === undefined) j.completedAt = null;
    return j;
  }

  function appendStatusLog(j, status, byAccountId, byLabel, note, extra) {
    ensureJobStatusFields(j);
    var row = {
      status: status,
      atIso: new Date().toISOString(),
      byAccountId: byAccountId || 'al',
      byLabel: byLabel || 'Owner Al',
      note: note || null
    };
    if (extra) {
      Object.keys(extra).forEach(function (k) { row[k] = extra[k]; });
    }
    j.statusLog.push(row);
    return row;
  }

  function jobDurationFacts(j) {
    ensureJobStatusFields(j);
    var now = Date.now();
    var started = j.startedAt ? new Date(j.startedAt).getTime() : null;
    var onWay = j.onTheWayAt ? new Date(j.onTheWayAt).getTime() : null;
    var done = j.completedAt ? new Date(j.completedAt).getTime() : null;
    var end = done != null ? done : now;
    var firstStart = started != null ? started : onWay;
    return {
      sinceStarted: started != null ? (now - started) : null,
      sinceOnWay: onWay != null ? (now - onWay) : null,
      activeService: started != null ? (end - started) : null,
      doorToDone: (firstStart != null && done != null) ? (done - firstStart) : null,
      startedClock: started != null ? formatCtClock(new Date(started)) : null,
      onWayClock: onWay != null ? formatCtClock(new Date(onWay)) : null,
      completedClock: done != null ? formatCtClock(new Date(done)) : null
    };
  }

  function jobListDurationHint(j) {
    var d = jobDurationFacts(j);
    var key = execStatusKey(j);
    if (key === 'completed' && d.doorToDone != null) {
      return 'Started ' + (d.startedClock || d.onWayClock || '—') + ' · ' + formatDurationShort(d.doorToDone) + ' total';
    }
    if (key === 'on_way' && j.onTheWayAt) {
      return 'On the way ' + d.onWayClock + ' · ' + formatDurationShort(d.sinceOnWay);
    }
    if ((key === 'started' || key === 'in_progress') && j.startedAt) {
      return 'Started ' + d.startedClock + ' · ' + formatDurationShort(d.sinceStarted);
    }
    return '';
  }

  function renderJobStatusTimeline(j, opts) {
    opts = opts || {};
    ensureJobStatusFields(j);
    var rows = (j.statusLog || []).slice().reverse(); // newest first for access-tl style
    if (!rows.length) {
      return '<p class="sub">No status events yet.</p>';
    }
    return rows.map(function (r) {
      var title;
      if (r.kind === 'reset') {
        title = r.note || ('Reset · ' + statusKeyLabel(r.fromStatus) + ' → ' + statusKeyLabel(r.toStatus));
      } else {
        title = statusKeyLabel(r.status) + (r.note ? (' · ' + r.note) : '');
      }
      var who = r.byLabel || r.byAccountId || '—';
      var denied = r.kind === 'reset';
      return '<div class="access-row' + (denied ? ' denied' : '') + '">' +
        '<div class="ar-title">' + title + '</div>' +
        '<div class="ar-sub">' + formatCtStamp(r.atIso) + ' · ' + who + '</div></div>';
    }).join('');
  }

  function renderJobDurationCard(j) {
    var d = jobDurationFacts(j);
    var key = execStatusKey(j);
    var rows = '';
    if (j.startedAt) {
      rows += '<div class="fact-row"><span class="muted">Started</span><span class="strong" style="font-size:12px">' +
        formatCtStamp(j.startedAt) + (key !== 'completed' && d.sinceStarted != null ? ' · ' + formatDurationShort(d.sinceStarted) + ' ago' : '') +
        '</span></div>';
    }
    if (j.onTheWayAt) {
      rows += '<div class="fact-row"><span class="muted">On the way</span><span class="strong" style="font-size:12px">' +
        formatCtStamp(j.onTheWayAt) + (key !== 'completed' && d.sinceOnWay != null ? ' · ' + formatDurationShort(d.sinceOnWay) + ' ago' : '') +
        '</span></div>';
    }
    if (d.activeService != null) {
      rows += '<div class="fact-row"><span class="muted">Active service</span><span class="strong" style="font-size:12px">' +
        formatDurationShort(d.activeService) + (key === 'completed' ? ' (to complete)' : ' (running)') +
        '</span></div>';
    }
    if (key === 'completed' && d.doorToDone != null) {
      rows += '<div class="fact-row" style="border:none"><span class="muted">Door-to-done</span><span class="strong" style="font-size:12px">' +
        formatDurationShort(d.doorToDone) + (j.completedAt ? ' · done ' + formatCtStamp(j.completedAt) : '') +
        '</span></div>';
    } else if (!rows) {
      rows = '<p class="sub" style="margin:0">No execution stamps yet · waiting for crew Start.</p>';
    } else {
      // last fact-row should lose border if we didn't add door-to-done
      rows = rows.replace(/class="fact-row"><span class="muted">Active service/, 'class="fact-row" style="border:none"><span class="muted">Active service');
      if (rows.indexOf('Active service') < 0) {
        rows = rows.replace(/(class="fact-row)("><span class="muted">On the way)/, '$1" style="border:none$2');
        if (rows.indexOf('On the way') < 0) {
          rows = rows.replace(/(class="fact-row)("><span class="muted">Started)/, '$1" style="border:none$2');
        }
      }
    }
    return '<div class="card field-preview mb-12">' + rows + '</div>';
  }

  function priorExecStatus(j) {
    var key = execStatusKey(j);
    if (key === 'completed') return j.onTheWayAt ? 'on_way' : (j.startedAt ? 'started' : 'scheduled');
    if (key === 'on_way') return j.startedAt ? 'started' : 'scheduled';
    if (key === 'started' || key === 'in_progress') return 'scheduled';
    return null;
  }

  function applyJobTargetStatus(j, target) {
    ensureJobStatusFields(j);
    if (target === 'scheduled' || target === 'needs_assign') {
      if (target === 'needs_assign') {
        j.status = 'needs_assign';
      } else {
        j.status = j.assigneeId ? 'scheduled' : 'needs_assign';
      }
      j.crewPhase = null;
      j.startedAt = null;
      j.onTheWayAt = null;
      j.completedAt = null;
    } else if (target === 'started') {
      j.status = 'in_progress';
      j.crewPhase = 'started';
      j.onTheWayAt = null;
      j.completedAt = null;
      if (!j.startedAt) j.startedAt = new Date().toISOString();
    } else if (target === 'on_way') {
      j.status = 'in_progress';
      j.crewPhase = 'on_way';
      j.completedAt = null;
      if (!j.startedAt) j.startedAt = new Date().toISOString();
      if (!j.onTheWayAt) j.onTheWayAt = new Date().toISOString();
    } else if (target === 'completed') {
      j.status = 'completed';
      j.crewPhase = 'completed';
      if (!j.startedAt) j.startedAt = new Date().toISOString();
      if (!j.completedAt) j.completedAt = new Date().toISOString();
    }
  }

  window.ownerResetJobStatus = function (jobId, targetStatus) {
    if (activeWorkspace !== 'business' || activeAccount !== 'al') {
      toast('Owner only · switch to Cedar Owner to reset');
      return;
    }
    var j = findJob(jobId || activeBizJobId);
    if (!j) { toast('Job not found'); return; }
    ensureJobStatusFields(j);
    var fromKey = execStatusKey(j);
    var target = targetStatus;
    if (target === 'step_back') {
      target = priorExecStatus(j);
      if (!target) { toast('Already at earliest status'); return; }
    }
    if (!target) { toast('Pick a reset target'); return; }
    if (target === fromKey) { toast('Already ' + statusKeyLabel(target)); return; }
    if (target !== 'scheduled' && target !== 'needs_assign' && target !== 'started' && target !== 'on_way') {
      toast('Invalid reset target');
      return;
    }
    applyJobTargetStatus(j, target);
    var toKey = execStatusKey(j);
    appendStatusLog(j, toKey, 'al', 'Owner Al',
      'Owner Al reset ' + statusKeyLabel(fromKey) + ' → ' + statusKeyLabel(toKey),
      { kind: 'reset', fromStatus: fromKey, toStatus: toKey });
    toast('Reset · ' + statusKeyLabel(fromKey) + ' → ' + statusKeyLabel(toKey));
    if (current === 'biz-job-detail') renderBizJobDetail();
    if (current === 'biz-jobs') renderBizJobs();
    if (current === 'biz-today') renderBizToday();
    if (current === 'crew-job-detail') renderCrewJobDetail();
    if (current === 'crew-jobs') renderCrewJobs();
    if (current === 'crew-today') renderCrewToday();
  };

  function assigneeLabel(id) {
    if (!id) return 'Unassigned';
    var p = CREW_PEOPLE[id];
    return p ? p.name : id;
  }

  function caseyJobs() {
    return bizJobs.filter(function (j) { return j.assigneeId === 'casey'; });
  }

  function crewCanSeeExact(j) {
    if (!j || j.assigneeId !== 'casey') return false;
    if (j.status !== 'scheduled' && j.status !== 'in_progress' && j.status !== 'completed') return false;
    // Prefer grant precision when linked; else job snapshot
    if (j.inquiryId) {
      var g = findOutgoing(j.inquiryId);
      if (g && g.precision === 'exact') return true;
      if (g && g.precision !== 'exact') return false;
    }
    return !!j.addressExact;
  }

  window.go = function (name) {
    if (name === 'connections') name = 'connected-services';
    name = normalizePublicRoute(name);
    const next = $('[data-screen="' + name + '"]');
    if (!next) { console.warn('Missing screen:', name); return; }

    // Workspace auto-switch on cross-mode navigation
    var targetPublic = isPublicScreen(name);
    var targetBiz = isBizScreen(name);
    var targetCrew = isCrewScreen(name);
    if (targetPublic) {
      if (activeWorkspace !== 'public') {
        switchWorkspace('public', { toast: false });
      }
      if (name !== 'public-signin') publicReturnScreen = name;
    } else if (targetCrew) {
      if (activeWorkspace !== 'crew') {
        switchWorkspace('crew', { org: 'cedar', toast: true });
      }
    } else if (targetBiz) {
      if (activeWorkspace !== 'business') {
        switchWorkspace('business', { org: 'cedar', role: 'owner', toast: true });
      }
    } else if (activeWorkspace === 'business' || activeWorkspace === 'crew' || activeWorkspace === 'public') {
      // Personal (or other non-biz/crew/public) screens → Personal
      var leaveToast = activeWorkspace !== 'public';
      switchWorkspace('personal', { toast: leaveToast });
    }

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
    if (name === 'biz-inquiry-detail') navMemory['biz-inbox'] = name;
    if (name === 'biz-job-detail') navMemory['biz-jobs'] = name;
    if (name === 'crew-job-detail') navMemory['crew-jobs'] = name;
    if (name.indexOf('biz-') === 0 && name !== 'biz-today' && name !== 'biz-inbox' && name !== 'biz-inquiry-detail' && name !== 'biz-jobs' && name !== 'biz-job-detail') {
      navMemory['biz-profile'] = name;
    }
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
    if (name === 'you' || name === 'today') { updateConnectedServicesSummaries(); updatePermissionsSummaries(); updateOrgEventsSummaries(); }
    if (name === 'biz-today') renderBizToday();
    if (name === 'biz-inbox') renderBizInbox();
    if (name === 'biz-inquiry-detail') renderBizInquiryDetail();
    if (name === 'biz-jobs') renderBizJobs();
    if (name === 'biz-job-detail') renderBizJobDetail();
    if (name === 'biz-profile') renderBizProfile();
    if (name === 'biz-public-profile') renderBizPublicProfile();
    if (name === 'biz-catalog') renderBizCatalog();
    if (name === 'biz-catalog-detail') renderBizCatalogDetail();
    if (name === 'biz-coverage') renderBizCoverage();
    if (name === 'biz-schedule') renderBizSchedule();
    if (name === 'biz-customers') renderBizCustomers();
    if (name === 'biz-customer-detail') renderBizCustomerDetail();
    if (name === 'biz-team') renderBizTeam();
    if (name === 'biz-team-member') renderBizTeamMember();
    if (name === 'biz-finance') renderBizFinance();
    if (name === 'biz-invoice-detail') renderBizInvoiceDetail();
    if (name === 'biz-payments') renderBizPayments();
    if (name === 'biz-integrations') renderBizIntegrations();
    if (name === 'biz-growth') renderBizGrowth();
    if (name === 'biz-settings') renderBizSettings();
    if (name === 'crew-today') renderCrewToday();
    if (name === 'crew-jobs') renderCrewJobs();
    if (name === 'crew-job-detail') renderCrewJobDetail();
    if (name === 'crew-me') renderCrewMe();
    if (name === 'org-events') renderOrgEventsHub();
    if (name === 'org-event-edit') renderOrgEventEdit();
    if (name === 'org-event-detail') renderOrgEventDetail();
    if (name === 'org-event-participant') renderOrgEventParticipant();
    if (name === 'you') updateOrgEventsSummaries();
    if (name === 'public-entry') renderPublicEntry();
    if (name === 'public-qr') renderPublicQr();
    if (name === 'public-business') renderPublicBusiness();
    if (name === 'public-event') renderPublicEvent();
    if (name === 'public-stay') renderPublicStay();
    if (name === 'public-stay-invite') renderPublicStayInvite();
    if (name === 'public-place') renderPublicPlace();
    if (name === 'public-handle') renderPublicHandle();
    if (name === 'public-signin') renderPublicSignin();
    if (name === 'public-gallery') renderPublicGallery();
  };

  window.navTo = function (tab) {
    go(navMemory[tab] || tab);
  };

  function updateNav(activeTab) {
    var root;
    if (activeWorkspace === 'business') root = $('#bottom-nav-business');
    else if (activeWorkspace === 'crew') root = $('#bottom-nav-crew');
    else root = $('#bottom-nav-personal');
    if (!root) root = document;
    $all('.nav-item', root).forEach(function (el) {
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
    var added = orgRsvpInterestFromExplore();
    btn.textContent = 'Interest noted';
    btn.classList.add('disabled');
    if (added) {
      toast('Interest noted · synced to organizer Interest (not a seat)');
    } else {
      toast('Interest already on organizer list · still not a seat');
    }
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
      windowLabel: 'Thu Sep 25 · 10–1',
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
    html += '<div class="banner private mb-12"><span>◎</span><span>Disabling public visibility does not revoke existing peer grants. Pause suspends peer/public-personal only.</span></div>';
    html += '<div class="card tap" onclick="go(\'public-gallery\')"><div class="between"><div><div class="strong" style="font-size:14px">Open guest link gallery</div><div class="muted" style="font-size:11px">W8 public shell · business · event · stay · grant · QR</div></div><span>›</span></div>';
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
      '<button class="btn btn-secondary mt-8" onclick="openRecipientPublicLink()">Open recipient link</button>' +
      '<button class="btn btn-secondary mt-8" onclick="openQrSheet()">Show QR</button>' +
      '<button class="btn btn-secondary mt-8" onclick="openPublicQrFromGrant(activeGrantId)">Open QR landing</button>' +
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
    if (current === 'biz-inquiry-detail') renderBizInquiryDetail();
    if (current === 'biz-today') renderBizToday();
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

  window.openRecipientPublicLink = function () {
    var g = findOutgoing(activeGrantId);
    if (!g) return;
    openPublicPlaceFromGrant(g.id);
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



  /* ========== Business workspace (Cedar & Stone · SERVICES) ========== */

  var BIZ_CLOSED_SEED = {
    id: 'inq_closed_demo_01',
    alias: 'Lake Host',
    service: 'Turnover clean',
    windowLabel: 'Mon Sep 15 · afternoon',
    area: 'Approx East Austin',
    precision: 'approx',
    status: 'closed',
    grantId: null,
    note: 'Older closed inquiry for texture · not linked to live grant'
  };

  function cedarGrant() {
    return findOutgoing(INQUIRY_SEED_ID);
  }

  function bizInboxStatus(g) {
    if (!g || g.status === 'revoked' || g.status === 'expired') return 'Closed';
    if (g.inquiryStatus === 'quoted') return 'Quoted';
    if (g.inquiryStatus === 'accepted') return 'Accepted';
    if (g.inquiryStatus === 'closed') return 'Closed';
    if (g.exactRequested && g.precision !== 'exact') return 'Needs exact';
    if (g.precision === 'exact') return 'Open · exact';
    return 'Open';
  }

  function bizPrecisionBadge(g) {
    if (g.precision === 'exact') return { cls: 'ok', label: 'Exact street' };
    return { cls: 'warn', label: 'Approx area' };
  }

  function countBizStats() {
    var g = cedarGrant();
    var open = 0, waiting = 0, jobsToday = 0;
    if (g && g.status === 'active') {
      if (g.inquiryStatus === 'quoted') waiting++;
      else if (g.inquiryStatus !== 'closed' && g.inquiryStatus !== 'accepted') open++;
    }
    bizJobs.forEach(function (j) {
      if (j.status === 'scheduled' || j.status === 'needs_assign' || j.status === 'in_progress') jobsToday++;
    });
    return { open: open, waiting: waiting, jobsToday: jobsToday };
  }

  window.openAccountSwitcher = function () {
    var list = $('#acct-switch-list');
    if (!list) return;
    var persOn = activeWorkspace === 'personal';
    var cedarOn = activeWorkspace === 'business' && activeOrg === 'cedar';
    var caseyOn = activeWorkspace === 'crew' && activeAccount === 'casey';
    list.innerHTML =
      '<div class="acct-option' + (persOn ? ' current' : '') + '" onclick="selectAccount(\'personal\')">' +
        '<div class="avatar" style="background:linear-gradient(135deg,#c4a882,#6d8a72)">AL</div>' +
        '<div class="acct-meta"><div class="acct-name">Al · Personal</div>' +
        '<div class="acct-sub">@al · Today · Map · Places · Explore · You</div></div>' +
        (persOn ? '<span class="pill sage">Current</span>' : '') +
      '</div>' +
      '<div class="acct-option' + (cedarOn ? ' current' : '') + '" onclick="selectAccount(\'cedar\')">' +
        '<div class="avatar" style="background:#2F5D50">CS</div>' +
        '<div class="acct-meta"><div class="acct-name">Cedar &amp; Stone Clean Co. · Owner</div>' +
        '<div class="acct-sub">Cedar &amp; Stone · Owner · Al · Inbox · Jobs · Business</div></div>' +
        (cedarOn ? '<span class="pill sage">Current</span>' : '') +
      '</div>' +
      '<div class="acct-option' + (caseyOn ? ' current' : '') + '" onclick="selectAccount(\'casey\')">' +
        '<div class="avatar" style="background:#6a7a55">CN</div>' +
        '<div class="acct-meta"><div class="acct-name">Casey Nguyen · Crew @ Cedar &amp; Stone</div>' +
        '<div class="acct-sub">Platform account · Crew role · assigned jobs only</div></div>' +
        (caseyOn ? '<span class="pill sage">Current</span>' : '') +
      '</div>' +
      '<div class="acct-option disabled">' +
        '<div class="avatar" style="background:#6a7a55">BL</div>' +
        '<div class="acct-meta"><div class="acct-name">Bluebonnet Lawn · Staff</div>' +
        '<div class="acct-sub">Demo focuses on Cedar &amp; Stone</div></div>' +
        '<span class="pill ghost">Soon</span>' +
      '</div>';
    $('#acct-switch-backdrop').classList.add('show');
    $('#acct-switch-sheet').classList.add('show');
  };

  window.closeAccountSwitcher = function () {
    var b = $('#acct-switch-backdrop'); var s = $('#acct-switch-sheet');
    if (b) b.classList.remove('show');
    if (s) s.classList.remove('show');
  };

  window.selectAccount = function (which) {
    closeAccountSwitcher();
    if (which === 'personal') {
      if (activeWorkspace === 'personal') { toast('Already on Personal'); return; }
      switchWorkspace('personal', { toast: true });
      go('today');
      return;
    }
    if (which === 'cedar') {
      if (activeWorkspace === 'business' && activeOrg === 'cedar') {
        toast('Already on Cedar & Stone · Owner');
        go('biz-today');
        return;
      }
      switchWorkspace('business', { org: 'cedar', role: 'owner', toast: true });
      go('biz-today');
      return;
    }
    if (which === 'casey') {
      if (activeWorkspace === 'crew' && activeAccount === 'casey') {
        toast('Already on Casey · Crew');
        go('crew-today');
        return;
      }
      switchWorkspace('crew', { org: 'cedar', toast: true });
      go('crew-today');
    }
  };

  function renderBizToday() {
    var body = $('#biz-today-body');
    if (!body) return;
    var g = cedarGrant();
    var stats = countBizStats();
    var cards = '';
    var riverJob = findJob('job_deep_river_01');
    if (riverJob && !riverJob.assigneeId && (riverJob.status === 'needs_assign' || riverJob.status === 'scheduled')) {
      cards +=
        '<div class="card tap mb-8" style="border-color:#c2d6c5;background:var(--accent-soft)" onclick="openBizJob(\'job_deep_river_01\')">' +
          '<div class="between mb-8"><span class="pill warn">Continue E2E</span><span class="muted">Assign</span></div>' +
          '<div class="strong">Continue E2E: assign River Guest job</div>' +
          '<p class="sub mt-8">Deep clean · needs crew · open to Assign Casey</p>' +
        '</div>';
    }
    if (g && g.status === 'active' && g.inquiryStatus !== 'closed') {
      var st = bizInboxStatus(g);
      cards +=
        '<div class="card tap mb-8" onclick="openBizInquiry(\'' + g.id + '\')">' +
          '<div class="between mb-8"><span class="pill ' + (g.inquiryStatus === 'quoted' ? 'warn' : 'sage') + '">' + st + '</span>' +
          '<span class="muted">Inbox</span></div>' +
          '<div class="strong">' + (g.identityLabel || 'River Guest') + ' · Deep clean</div>' +
          '<p class="sub mt-8">' + (g.windowLabel || 'Thu Sep 25 · morning') + ' · Approx East Cesar Chavez area</p>' +
          '<div class="muted mt-8" style="font-size:11px">Ref ' + g.id + '</div>' +
        '</div>';
    }
    if (g && g.inquiryStatus === 'quoted') {
      cards +=
        '<div class="card tap mb-8" onclick="openBizInquiry(\'' + g.id + '\')">' +
          '<div class="between mb-8"><span class="pill warn">Quote waiting</span><span class="muted">Customer</span></div>' +
          '<div class="strong">Quote ' + (g.latestQuoteId || 'quote_…') + '</div>' +
          '<p class="sub mt-8">Accept quote (demo) creates job · quote ≠ booking</p>' +
        '</div>';
    }
    var upcoming = bizJobs.filter(function (j) { return j.status === 'scheduled' || j.status === 'needs_assign' || j.status === 'in_progress'; });
    upcoming.slice(0, 3).forEach(function (j) {
      ensureJobStatusFields(j);
      var pill = jobStatusPill(j);
      var hint = jobListDurationHint(j);
      cards +=
        '<div class="card tap mb-8" onclick="openBizJob(\'' + j.id + '\')">' +
          '<div class="between mb-8"><span class="pill ' + pill.cls + '">' + pill.label + '</span>' +
          '<span class="muted">' + j.whenShort + '</span></div>' +
          '<div class="strong">' + j.service + ' · ' + (j.assigneeId ? assigneeLabel(j.assigneeId) : 'Unassigned') + '</div>' +
          '<p class="sub mt-8">' + j.customerAlias + ' · job-scoped crew access' + (hint ? ' · ' + hint : '') + '</p>' +
        '</div>';
    });
    if (!cards) {
      cards =
        '<div class="card mb-8" style="border-style:dashed">' +
          '<div class="muted" style="font-size:13px">Nothing needs attention right now.</div>' +
        '</div>';
    }

    body.innerHTML =
      '<div class="greeting">Good afternoon · Cedar &amp; Stone</div>' +
      '<h1 class="h1">Business Today</h1>' +
      '<p class="sub mb-12">Owner view · inquiries from deliberate resident submits only.</p>' +
      '<div class="banner private mb-12"><span>◎</span><span>You only see deliberate inquiries — Explore browse does <strong>not</strong> create leads.</span></div>' +
      '<div class="stat-row mb-16">' +
        '<div class="stat"><div class="n">' + stats.open + '</div><div class="l">Open inquiries</div></div>' +
        '<div class="stat"><div class="n">' + stats.waiting + '</div><div class="l">Quotes waiting</div></div>' +
        '<div class="stat"><div class="n">' + stats.jobsToday + '</div><div class="l">Active jobs</div></div>' +
      '</div>' +
      '<div class="section-label" style="margin-top:0">Needs attention</div>' +
      cards +
      '<button class="btn btn-secondary mt-8" onclick="go(\'biz-inbox\')">Open Inbox</button>' +
      '<button class="btn btn-ghost mt-8" style="width:100%" onclick="go(\'biz-jobs\')">Open Jobs board</button>' +
      '<p class="muted mt-16" style="font-size:11px;text-align:center">Prototype / demo · acct_cedar_stone_01</p>';
  }

  window.openBizInquiry = function (id) {
    activeBizInquiryId = id || INQUIRY_SEED_ID;
    go('biz-inquiry-detail');
  };

  function renderBizInbox() {
    var list = $('#biz-inbox-list');
    if (!list) return;
    list.innerHTML = '';
    var g = cedarGrant();
    if (g) {
      var prec = bizPrecisionBadge(g);
      var st = bizInboxStatus(g);
      var linked = findJob('job_deep_river_01');
      var row = document.createElement('div');
      row.className = 'inq-row';
      row.innerHTML =
        '<div class="avatar" style="background:#5a7a8a">RG</div>' +
        '<div class="inq-body">' +
          '<div class="inq-title">' + (g.identityLabel || 'River Guest') + '</div>' +
          '<div class="inq-meta">Deep clean · ' + (g.windowLabel || 'Thu Sep 25 morning') + '<br>Approx East Cesar Chavez area</div>' +
          '<div class="inq-chips">' +
            '<span class="pill ' + prec.cls + '">' + prec.label + '</span>' +
            '<span class="pill ' + (st.indexOf('Needs') >= 0 ? 'warn' : (st === 'Quoted' ? 'warn' : 'sage')) + '">' + st + '</span>' +
            (linked ? '<span class="pill ghost">Job ' + linked.status + '</span>' : '') +
          '</div>' +
          '<div class="grant-id" style="margin-top:6px">' + g.id + '</div>' +
        '</div>' +
        '<span class="y-chev">›</span>';
      row.addEventListener('click', function () { openBizInquiry(g.id); });
      list.appendChild(row);
    }
    var c = BIZ_CLOSED_SEED;
    var crow = document.createElement('div');
    crow.className = 'inq-row';
    crow.style.opacity = '.72';
    crow.innerHTML =
      '<div class="avatar" style="background:#78716C">LH</div>' +
      '<div class="inq-body">' +
        '<div class="inq-title">' + c.alias + '</div>' +
        '<div class="inq-meta">' + c.service + ' · ' + c.windowLabel + '<br>' + c.area + '</div>' +
        '<div class="inq-chips"><span class="pill ghost">Approx area</span><span class="pill ghost">Closed</span></div>' +
        '<div class="muted mt-8" style="font-size:11px">' + c.note + '</div>' +
      '</div>';
    crow.addEventListener('click', function () { toast('Closed inquiry · demo texture only'); });
    list.appendChild(crow);
  }

  function linkedJobForInquiry(g) {
    if (!g) return null;
    for (var i = 0; i < bizJobs.length; i++) {
      if (bizJobs[i].inquiryId === g.id) return bizJobs[i];
    }
    return null;
  }

  function renderBizInquiryDetail() {
    var body = $('#biz-inquiry-detail-body');
    if (!body) return;
    var g = findOutgoing(activeBizInquiryId) || cedarGrant();
    if (!g) {
      body.innerHTML = '<p class="sub">Inquiry not found.</p>';
      return;
    }
    var isOwner = activeWorkspace === 'business' && (bizDemoRoleView === 'owner' || activeAccount === 'al');
    var prec = g.precision;
    var mapHtml;
    if (prec === 'exact') {
      var pl = placeById(g.placeId);
      mapHtml =
        '<div class="biz-map-blob"><div class="pin" style="top:52%;left:58%"></div></div>' +
        '<div class="card field-preview mb-12">' +
          '<div class="fact-row"><span class="muted">Street</span><span class="strong" style="font-size:13px">' + pl.street + '</span></div>' +
          '<div class="fact-row"><span class="muted">Unit</span><span class="strong" style="font-size:13px">' + pl.unit + '</span></div>' +
          '<div class="fact-row" style="border:none"><span class="muted">City</span><span class="strong" style="font-size:13px">' + pl.city + ', ' + pl.zip + '</span></div>' +
        '</div>';
    } else {
      mapHtml =
        '<div class="biz-map-blob"><div class="blob" style="top:28%;left:32%;width:120px;height:90px">East Cesar Chavez area</div></div>' +
        '<div class="card field-preview mb-12">' +
          '<div class="fact-row"><span class="muted">Disclosure</span><span class="strong" style="font-size:13px">Approximate neighborhood</span></div>' +
          '<div class="fact-row" style="border:none"><span class="muted">Geometry</span><span class="strong" style="font-size:13px">Area blob · no street / unit</span></div>' +
        '</div>';
    }

    var exactAction = '';
    if (prec === 'exact') {
      exactAction = '<div class="banner ok mb-12" style="background:var(--ok-soft);border:1px solid #b5d4c0;color:var(--ok)"><span>✓</span><span>Exact street approved by resident · bound to this inquiry only.</span></div>';
    } else if (g.exactRequested) {
      exactAction = '<div class="banner warn mb-12"><span>…</span><span><strong>Waiting on customer</strong> — exact request pending on resident Permissions for ' + g.id + '.</span></div>';
    }

    var linked = linkedJobForInquiry(g);
    var jobBlock = '';
    if (linked) {
      var jp = jobStatusPill(linked.status);
      jobBlock =
        '<div class="card mb-12" style="background:var(--ok-soft);border-color:#b5d4c0">' +
          '<div class="between"><span class="strong" style="font-size:13px">Linked job</span><span class="pill ' + jp.cls + '">' + jp.label + '</span></div>' +
          '<div class="muted mt-8" style="font-size:12px">' + linked.id + ' · ' + (linked.assigneeId ? assigneeLabel(linked.assigneeId) : 'Unassigned') + '</div>' +
          (linked.status === 'completed'
            ? '<div class="muted mt-4" style="font-size:11px">Job completed by ' + assigneeLabel(linked.assigneeId || 'casey') + '</div>'
            : '') +
          '<button class="btn btn-secondary btn-sm mt-12" style="width:auto" onclick="openBizJob(\'' + linked.id + '\')">Open job</button>' +
        '</div>';
    }

    var quoteBlock = '';
    if (g.inquiryStatus === 'quoted' || g.inquiryStatus === 'accepted') {
      quoteBlock =
        '<div class="card mb-12" style="background:var(--accent-soft);border-color:#c2d6c5">' +
          '<div class="strong" style="font-size:13px">Quote ' + (g.latestQuoteId || '—') + '</div>' +
          '<div class="muted mt-8" style="font-size:12px">' + (g.latestQuoteSummary || 'Sent') + '</div>' +
          '<div class="muted mt-4" style="font-size:11px">Status: ' + inquiryStatusLabel(g) + ' · quote ≠ booking / job confirmation</div>' +
          (g.inquiryStatus === 'quoted' && isOwner
            ? '<button class="btn btn-primary btn-sm mt-12" style="width:auto" onclick="markBizQuoteAccepted()">Accept quote (demo)</button>'
            : '') +
        '</div>';
    }

    var actions = '';
    if (g.status === 'revoked' || g.status === 'expired' || g.inquiryStatus === 'closed') {
      actions = '<p class="muted" style="font-size:12px;text-align:center">Inquiry closed — new disclosure blocked.</p>';
    } else {
      actions =
        (prec !== 'exact'
          ? '<button class="btn btn-secondary" onclick="bizRequestExact()"' + (!isOwner ? ' disabled style="opacity:.5"' : '') + '>Request exact address</button>'
          : '') +
        (g.inquiryStatus !== 'quoted' && g.inquiryStatus !== 'accepted'
          ? '<button class="btn btn-primary mt-8" onclick="openBizQuoteSheet()"' + (!isOwner ? ' disabled style="opacity:.5"' : '') + '>Send quote</button>'
          : '') +
        '<button class="btn btn-secondary mt-8" onclick="toast(\'Message thread (prototype) · ref ' + g.id + '\')">Message</button>' +
        '<button class="btn btn-ghost mt-8" style="width:100%;color:var(--danger)" onclick="bizDeclineInquiry()">Decline / Close</button>';
    }

    body.innerHTML =
      '<div class="between mb-8"><span class="pill ghost">Prototype / demo</span><span class="pill sage">' + bizInboxStatus(g) + '</span></div>' +
      '<h1 class="h1" style="font-size:22px">' + (g.identityLabel || 'River Guest') + '</h1>' +
      '<p class="sub mb-12">Inquiry alias · usual @handle may be hidden. Identity ≠ address.</p>' +
      '<div class="banner info mb-12"><span>ℹ</span><span>You never received browse analytics for this customer — only the deliberate submit.</span></div>' +
      exactAction +
      '<div class="section-label" style="margin-top:0">What you can see now</div>' +
      mapHtml +
      '<div class="section-label">Request</div>' +
      '<div class="card mb-12" style="padding:12px 14px">' +
        '<div class="fact-row"><span class="muted">Service</span><span class="strong" style="font-size:13px">' + (g.purpose || 'Deep clean quote') + '</span></div>' +
        '<div class="fact-row"><span class="muted">Window</span><span class="strong" style="font-size:12px">' + (g.windowLabel || '—') + '</span></div>' +
        '<div class="fact-row" style="border:none"><span class="muted">Notes</span><span class="strong" style="font-size:12px;text-align:right;max-width:58%">' + (g.notes || '—') + '</span></div>' +
      '</div>' +
      quoteBlock +
      jobBlock +
      '<div class="section-label">Actions</div>' +
      actions +
      '<p class="muted mt-16" style="font-size:11px;text-align:center">Pairwise ref <strong>' + g.id + '</strong> · shared with resident Permissions</p>';
  }

  window.bizRequestExact = function () {
    if (activeWorkspace !== 'business') { toast('Owner only · request exact'); return; }
    var g = findOutgoing(activeBizInquiryId) || cedarGrant();
    if (!g) return;
    if (g.precision === 'exact') { toast('Already exact · grant ' + g.id); return; }
    if (g.exactRequested) { toast('Still waiting on customer · ' + g.id); return; }
    g.exactRequested = true;
    g.history.unshift({
      title: 'Exact address requested (pending)',
      sub: 'Tue Sep 22 · just now · provider ask · not yet approved',
      denied: false
    });
    if (current === 'biz-inquiry-detail') renderBizInquiryDetail();
    toast('Exact requested · pending on resident · ' + g.id);
  };

  window.openBizQuoteSheet = function () {
    if (activeWorkspace !== 'business') { toast('Owner only · send quote'); return; }
    $('#biz-quote-backdrop').classList.add('show');
    $('#biz-quote-sheet').classList.add('show');
  };
  window.closeBizQuoteSheet = function () {
    var b = $('#biz-quote-backdrop'); var s = $('#biz-quote-sheet');
    if (b) b.classList.remove('show');
    if (s) s.classList.remove('show');
  };

  window.confirmBizQuote = function () {
    var g = findOutgoing(activeBizInquiryId) || cedarGrant();
    if (!g) return;
    var price = ($('#biz-quote-price') && $('#biz-quote-price').value) || '$185';
    var scope = ($('#biz-quote-scope') && $('#biz-quote-scope').value) || 'Deep clean';
    var expiry = ($('#biz-quote-expiry') && $('#biz-quote-expiry').value) || 'Fri Sep 26 CT';
    var excl = ($('#biz-quote-excl') && $('#biz-quote-excl').value) || '';
    var qid = 'quote_cedar_' + (bizQuoteSeq++) + '_' + Math.floor(Math.random() * 900 + 100).toString(16);
    g.inquiryStatus = 'quoted';
    g.latestQuoteId = qid;
    g.latestQuoteSummary = price + ' · ' + scope + ' · expires ' + expiry + (excl ? ' · ' + excl : '');
    g.history.unshift({
      title: 'Quote received',
      sub: 'Tue Sep 22 · just now · ' + qid + ' · opaque ref · not a booking',
      denied: false
    });
    closeBizQuoteSheet();
    if (current === 'biz-inquiry-detail') renderBizInquiryDetail();
    toast('Quote sent · ' + qid + ' · not a booking');
  };

  window.markBizQuoteAccepted = function () {
    var g = findOutgoing(activeBizInquiryId) || cedarGrant();
    if (!g) return;
    g.inquiryStatus = 'accepted';
    g.history.unshift({
      title: 'Quote accepted (demo)',
      sub: 'Tue Sep 22 · just now · creates job · still not payment',
      denied: false
    });
    var jid = 'job_deep_river_01';
    var existing = findJob(jid);
    var pl = placeById(g.placeId || 'place_ecc');
    var exactSnap = (g.precision === 'exact' && pl) ? (pl.street + ' · ' + pl.unit) : null;
    if (existing) {
      existing.inquiryId = g.id;
      existing.service = 'Deep clean';
      existing.whenLabel = g.windowLabel || 'Thu Sep 25 · 10–1';
      existing.whenShort = 'Thu · 10–1';
      existing.customerAlias = g.identityLabel || 'River Guest';
      existing.status = 'needs_assign';
      existing.assigneeId = null;
      existing.addressExact = exactSnap;
      existing.addressApprox = 'East Cesar Chavez area';
      existing.placeId = g.placeId || 'place_ecc';
      existing.crewPhase = null;
      existing.accessNotes = g.notes || 'Gate code on arrival · quiet during work';
      existing.startedAt = null;
      existing.onTheWayAt = null;
      existing.completedAt = null;
      ensureJobStatusFields(existing);
      appendStatusLog(existing, 'needs_assign', 'al', 'Owner Al', 'Quote accepted · job needs assign');
    } else {
      var freshJob = {
        id: jid,
        inquiryId: g.id,
        service: 'Deep clean',
        whenLabel: g.windowLabel || 'Thu Sep 25 · 10–1',
        whenShort: 'Thu · 10–1',
        customerAlias: g.identityLabel || 'River Guest',
        status: 'needs_assign',
        assigneeId: null,
        addressExact: exactSnap,
        addressApprox: 'East Cesar Chavez area',
        accessNotes: g.notes || 'Gate code on arrival · quiet during work',
        placeId: g.placeId || 'place_ecc',
        crewPhase: null,
        startedAt: null,
        onTheWayAt: null,
        completedAt: null,
        statusLog: []
      };
      appendStatusLog(freshJob, 'needs_assign', 'al', 'Owner Al', 'Quote accepted · job needs assign');
      bizJobs.unshift(freshJob);
    }
    activeBizJobId = jid;
    if (current === 'biz-inquiry-detail') renderBizInquiryDetail();
    toast('Quote accepted · job ' + jid + ' · needs assign');
  };

  window.bizDeclineInquiry = function () {
    var g = findOutgoing(activeBizInquiryId) || cedarGrant();
    if (!g) return;
    g.inquiryStatus = 'closed';
    g.history.unshift({
      title: 'Inquiry closed by provider',
      sub: 'Tue Sep 22 · just now · new disclosure blocked',
      denied: true
    });
    toast('Inquiry closed · ' + g.id);
    go('biz-inbox');
  };

  function renderBizJobs() {
    var body = $('#biz-jobs-body');
    if (!body) return;
    var html = '<h1 class="h1" style="font-size:22px">Schedule / Jobs</h1>' +
      '<p class="sub mb-12">Owner board · live execution status · assign crew. Worker access is job-scoped; reassign ends prior access.</p>';
    if (!bizJobs.length) {
      html +=
        '<div class="banner info mb-12"><span>ℹ</span><span>No jobs yet. Accept a quote from Inbox to create River Guest job.</span></div>';
    } else {
      bizJobs.forEach(function (j) {
        ensureJobStatusFields(j);
        var pill = jobStatusPill(j);
        var who = j.assigneeId ? assigneeLabel(j.assigneeId) : 'Unassigned';
        var av = j.assigneeId && CREW_PEOPLE[j.assigneeId] ? CREW_PEOPLE[j.assigneeId] : null;
        var hint = jobListDurationHint(j);
        html +=
          '<div class="card tap mb-8" onclick="openBizJob(\'' + j.id + '\')">' +
            '<div class="between mb-8"><span class="pill ' + pill.cls + '">' + pill.label + '</span>' +
            '<span class="muted">' + j.whenShort + '</span></div>' +
            '<div class="strong">' + j.service + ' · ' + j.customerAlias + '</div>' +
            (hint ? '<div class="muted mt-8" style="font-size:12px">' + hint + '</div>' : '') +
            '<div class="row gap-md mt-8">' +
              '<div class="avatar sm" style="background:' + (av ? av.color : '#a8a29e') + '">' + (av ? av.initials : '?') + '</div>' +
              '<div><div class="strong" style="font-size:13px">' + who + '</div>' +
              '<div class="muted">' + (j.assigneeId ? 'Crew assigned' : 'Needs assign') + '</div></div>' +
            '</div>' +
            '<div class="grant-id" style="margin-top:8px">' + j.id + '</div>' +
          '</div>';
      });
    }
    html += '<p class="muted mt-16" style="font-size:11px;text-align:center">P45 ops · prototype</p>';
    body.innerHTML = html;
  }

  window.openBizJob = function (id) {
    activeBizJobId = id;
    go('biz-job-detail');
  };

  function renderBizJobDetail() {
    var body = $('#biz-job-detail-body');
    if (!body) return;
    var j = findJob(activeBizJobId);
    if (!j) { body.innerHTML = '<p class="sub">Job not found.</p>'; return; }
    ensureJobStatusFields(j);
    var g = j.inquiryId ? findOutgoing(j.inquiryId) : null;
    var exactOk = false;
    if (g && g.precision === 'exact') exactOk = true;
    else if (j.addressExact) exactOk = true;
    var fields;
    if (exactOk) {
      var street = j.addressExact;
      if (!street && g) {
        var pl = placeById(j.placeId || g.placeId);
        street = pl.street + ' · ' + pl.unit;
      }
      fields =
        '<div class="fact-row"><span class="muted">Street</span><span class="strong" style="font-size:13px">' + street + '</span></div>' +
        '<div class="fact-row"><span class="muted">Access</span><span class="strong" style="font-size:12px">' + (j.accessNotes || '—') + '</span></div>' +
        '<div class="fact-row" style="border:none"><span class="muted">Scope</span><span class="strong" style="font-size:12px">Owner + assigned crew (job window)</span></div>';
    } else {
      fields =
        '<div class="fact-row"><span class="muted">Area</span><span class="strong" style="font-size:13px">' + (j.addressApprox || 'Approx area') + '</span></div>' +
        '<div class="fact-row" style="border:none"><span class="muted">Exact</span><span class="strong" style="font-size:12px">Hidden until resident approved</span></div>';
    }
    var pill = jobStatusPill(j);
    var who = j.assigneeId ? assigneeLabel(j.assigneeId) : 'Unassigned';
    var av = j.assigneeId && CREW_PEOPLE[j.assigneeId] ? CREW_PEOPLE[j.assigneeId] : null;
    var execKey = execStatusKey(j);
    var canReset = execKey === 'started' || execKey === 'on_way' || execKey === 'in_progress' || execKey === 'completed';
    var stepTarget = priorExecStatus(j);
    var resetBlock = '';
    if (canReset) {
      resetBlock =
        '<div class="section-label">Owner reset</div>' +
        '<div class="card mb-12">' +
          '<p class="sub mb-12">If crew advanced by accident, reset clears later stamps and restores a prior state. Audit row is written.</p>' +
          '<button class="btn btn-secondary mb-8" onclick="ownerResetJobStatus(\'' + j.id + '\',\'scheduled\')">Reset to Scheduled</button>' +
          (stepTarget
            ? '<button class="btn btn-ghost" style="width:100%" onclick="ownerResetJobStatus(\'' + j.id + '\',\'step_back\')">Step back → ' + statusKeyLabel(stepTarget) + '</button>'
            : '') +
        '</div>';
    }
    body.innerHTML =
      '<div class="between mb-8"><span class="pill ' + pill.cls + '">' + pill.label + '</span><span class="muted">' + j.whenLabel + '</span></div>' +
      '<h1 class="h1" style="font-size:22px">' + j.service + '</h1>' +
      '<p class="sub mb-12">' + j.customerAlias + ' · live execution · job-scoped assignment.</p>' +
      '<div class="banner private mb-12"><span>◎</span><span><strong>Crew sees exact only for job window.</strong> Reassign ends prior worker access. You can reset mistaken status advances.</span></div>' +
      '<div class="section-label" style="margin-top:0">Execution status</div>' +
      renderJobDurationCard(j) +
      '<div class="section-label">Assignee</div>' +
      '<div class="card mb-12"><div class="team-row" style="padding:0;border:none">' +
        '<div class="avatar" style="background:' + (av ? av.color : '#a8a29e') + '">' + (av ? av.initials : '?') + '</div>' +
        '<div class="flex-1"><div class="strong">' + who + '</div>' +
        '<div class="muted">' + (j.assigneeId ? 'Crew · limited fields while assigned' : 'No crew yet') + '</div></div>' +
      '</div></div>' +
      '<div class="section-label">Fields</div>' +
      '<div class="card field-preview mb-12">' + fields + '</div>' +
      (j.inquiryId ? '<div class="muted mb-12" style="font-size:11px">Linked inquiry <strong>' + j.inquiryId + '</strong></div>' : '') +
      '<button class="btn btn-primary mb-8" onclick="openAssignSheet()">' + (j.assigneeId ? 'Reassign crew' : 'Assign crew') + '</button>' +
      resetBlock +
      '<div class="section-label">Status history</div>' +
      '<div class="card mb-12"><div class="access-tl">' + renderJobStatusTimeline(j) + '</div></div>' +
      '<p class="muted mt-12" style="font-size:11px;text-align:center">Job ' + j.id + ' · prototype</p>';
  }

  window.openAssignSheet = function () {
    var list = $('#biz-assign-list');
    if (!list) return;
    var j = findJob(activeBizJobId);
    if (!j) return;
    var html = '';
    ['casey', 'riley'].forEach(function (cid) {
      var p = CREW_PEOPLE[cid];
      var on = j.assigneeId === cid;
      html +=
        '<div class="acct-option' + (on ? ' current' : '') + '" onclick="assignJobTo(\'' + cid + '\')">' +
          '<div class="avatar" style="background:' + p.color + '">' + p.initials + '</div>' +
          '<div class="acct-meta"><div class="acct-name">' + p.name + '</div>' +
          '<div class="acct-sub">' + (p.fullAccount ? 'Crew · full switchable account' : 'Crew · assignable only (demo)') + '</div></div>' +
          (on ? '<span class="pill sage">Assigned</span>' : '<span class="pill ghost">Assign</span>') +
        '</div>';
    });
    if (j.assigneeId) {
      html +=
        '<button class="btn btn-ghost mt-8" style="width:100%;color:var(--danger)" onclick="assignJobTo(null)">Clear assignment</button>';
    }
    list.innerHTML = html;
    $('#biz-assign-backdrop').classList.add('show');
    $('#biz-assign-sheet').classList.add('show');
  };

  window.closeAssignSheet = function () {
    var b = $('#biz-assign-backdrop'); var s = $('#biz-assign-sheet');
    if (b) b.classList.remove('show');
    if (s) s.classList.remove('show');
  };

  window.assignJobTo = function (crewId) {
    var j = findJob(activeBizJobId);
    if (!j) return;
    ensureJobStatusFields(j);
    var prev = j.assigneeId;
    closeAssignSheet();
    if (crewId === prev) { toast('Already assigned to ' + assigneeLabel(crewId)); return; }
    var fromKey = execStatusKey(j);
    j.assigneeId = crewId || null;
    if (crewId && (j.status === 'needs_assign' || j.status === 'scheduled')) j.status = 'scheduled';
    if (!crewId && (j.status === 'scheduled' || j.status === 'needs_assign')) j.status = 'needs_assign';
    // Reassign clears in-flight execution (new worker starts fresh)
    if (prev !== crewId) {
      j.crewPhase = null;
      j.startedAt = null;
      j.onTheWayAt = null;
      j.completedAt = null;
      if (j.status === 'in_progress' || j.status === 'completed') {
        j.status = crewId ? 'scheduled' : 'needs_assign';
      }
    }
    // Snapshot exact for assignee when grant already approved
    if (crewId && j.inquiryId) {
      var gSnap = findOutgoing(j.inquiryId);
      if (gSnap && gSnap.precision === 'exact') {
        var plSnap = placeById(j.placeId || gSnap.placeId || 'place_ecc');
        j.addressExact = plSnap.street + ' · ' + plSnap.unit;
        if (gSnap.notes) j.accessNotes = gSnap.notes;
      }
    }
    var toKey = execStatusKey(j);
    appendStatusLog(j, toKey, 'al', 'Owner Al',
      crewId
        ? ('Assigned to ' + assigneeLabel(crewId) + (fromKey !== toKey ? ' · cleared ' + statusKeyLabel(fromKey) : ''))
        : ('Unassigned' + (prev ? ' · ' + assigneeLabel(prev).split(' ')[0] + ' access ended' : '')));
    var msg;
    if (prev && crewId) {
      msg = assigneeLabel(prev).split(' ')[0] + ' access ended · ' + assigneeLabel(crewId).split(' ')[0] + ' now assigned';
    } else if (crewId) {
      msg = 'Assigned to ' + assigneeLabel(crewId) + ' · ' + j.id;
    } else {
      msg = (prev ? assigneeLabel(prev).split(' ')[0] + ' access ended · ' : '') + 'Unassigned · ' + j.id;
    }
    toast(msg);
    if (j.inquiryId && crewId) {
      var ig = findOutgoing(j.inquiryId);
      if (ig) {
        ig.history.unshift({
          title: 'Job assigned to ' + assigneeLabel(crewId),
          sub: 'Tue Sep 22 · just now · ' + j.id + ' · prior access revoked if any',
          denied: false
        });
      }
    }
    if (current === 'biz-job-detail') renderBizJobDetail();
    if (current === 'biz-jobs') renderBizJobs();
    if (current === 'biz-today') renderBizToday();
  };

  function renderBizProfile() {
    var body = $('#biz-profile-body');
    if (!body) return;
    var stats = bizHubStats();
    var pauseNote = bizPausedAccepting
      ? '<div class="banner warn mb-12"><span>⏸</span><span>Accepting new work is <strong>paused</strong> (demo). Existing jobs continue.</span></div>'
      : '';
    body.innerHTML =
      '<div class="card mb-12 acct-card">' +
        '<div class="row gap-md">' +
          '<div class="avatar lg" style="background:#2F5D50">CS</div>' +
          '<div class="flex-1">' +
            '<div class="strong" style="font-size:17px">' + BIZ_ORG.displayName + '</div>' +
            '<div class="muted">' + BIZ_ORG.handle + ' · ' + BIZ_ORG.ownerLabel + '</div>' +
            '<div class="row mt-8 wrap" style="gap:6px"><span class="pill sage">' + BIZ_ORG.id + '</span></div>' +
          '</div>' +
        '</div>' +
        '<button type="button" class="btn btn-primary mt-12" onclick="openAccountSwitcher()">Switch account…</button>' +
      '</div>' +
      pauseNote +
      '<div class="section-label" style="margin-top:0">At a glance</div>' +
      '<div class="biz-stat-strip mb-16">' +
        '<div class="biz-stat"><div class="biz-stat-n">' + stats.openInquiries + '</div><div class="biz-stat-l">Open inquiries</div></div>' +
        '<div class="biz-stat"><div class="biz-stat-n">' + stats.jobsToday + '</div><div class="biz-stat-l">Active jobs</div></div>' +
        '<div class="biz-stat"><div class="biz-stat-n">' + money(stats.outstandingArCents) + '</div><div class="biz-stat-l">Outstanding AR</div></div>' +
        '<div class="biz-stat"><div class="biz-stat-n">' + money(stats.nextPayoutCents) + '</div><div class="biz-stat-l">Next payout</div></div>' +
      '</div>' +
      '<div class="section-label">Manage</div>' +
      '<div class="card mb-12" style="padding:4px 16px">' +
        '<div class="you-row" onclick="go(\'biz-public-profile\')"><span>◎</span><span class="y-label">Public profile</span><span class="y-meta">Guest view</span><span class="y-chev">›</span></div>' +
        '<div class="you-row" onclick="go(\'biz-catalog\')"><span>☰</span><span class="y-label">Service catalog</span><span class="y-meta">' + bizCatalog.length + ' offerings</span><span class="y-chev">›</span></div>' +
        '<div class="you-row" onclick="go(\'biz-coverage\')"><span>⌖</span><span class="y-label">Coverage &amp; schedule</span><span class="y-meta">East Austin</span><span class="y-chev">›</span></div>' +
        '<div class="you-row" onclick="go(\'biz-schedule\')"><span>▦</span><span class="y-label">Schedule board</span><span class="y-meta">Week</span><span class="y-chev">›</span></div>' +
        '<div class="you-row" onclick="go(\'biz-customers\')"><span>☺</span><span class="y-label">Customers</span><span class="y-meta">CRM · deliberate</span><span class="y-chev">›</span></div>' +
        '<div class="you-row" onclick="go(\'biz-team\')"><span>◇</span><span class="y-label">Team &amp; permissions</span><span class="y-meta">3 people</span><span class="y-chev">›</span></div>' +
      '</div>' +
      '<div class="section-label">Money</div>' +
      '<div class="card mb-12" style="padding:4px 16px">' +
        '<div class="you-row" onclick="go(\'biz-finance\')"><span>◈</span><span class="y-label">Finance / Ledger</span><span class="y-meta">Sep</span><span class="y-chev">›</span></div>' +
        '<div class="you-row" onclick="go(\'biz-payments\')"><span>↔</span><span class="y-label">Payments &amp; payouts</span><span class="y-meta">Processor</span><span class="y-chev">›</span></div>' +
      '</div>' +
      '<div class="section-label">Grow &amp; connect</div>' +
      '<div class="card mb-12" style="padding:4px 16px">' +
        '<div class="you-row" onclick="go(\'biz-integrations\')"><span>⛓</span><span class="y-label">Integrations</span><span class="y-meta">Calendar · CRM</span><span class="y-chev">›</span></div>' +
        '<div class="you-row" onclick="go(\'biz-growth\')"><span>↗</span><span class="y-label">Growth</span><span class="y-meta">Funnel</span><span class="y-chev">›</span></div>' +
        '<div class="you-row" onclick="go(\'biz-settings\')"><span>⚙</span><span class="y-label">Business settings</span><span class="y-meta">Owner</span><span class="y-chev">›</span></div>' +
      '</div>' +
      '<div class="banner info mb-12"><span>ℹ</span><span>Business hub · W2 management. Prefer <strong>Switch account → Casey</strong> for real crew UX (not a lens).</span></div>' +
      '<p class="muted" style="font-size:11px;text-align:center">W2 · P38 team · P39 coverage · P55 catalog · P56 crews · P57 jobs · P58 CRM · P59 invoices · P80 ledger · prototype only</p>';
  }

  function renderBizPublicProfile() {
    var body = $('#biz-public-profile-body');
    if (!body) return;
    body.innerHTML =
      '<div class="banner private mb-12"><span>◎</span><span><strong>Public page ≠ address book.</strong> Guests see catalog &amp; coverage blurbs — never your customer list, inbox, or exact job addresses.</span></div>' +
      '<div class="card mb-12">' +
        '<div class="row gap-md">' +
          '<div class="avatar lg" style="background:#2F5D50">CS</div>' +
          '<div class="flex-1">' +
            '<div class="strong" style="font-size:18px">' + BIZ_ORG.displayName + '</div>' +
            '<div class="muted">' + BIZ_ORG.handle + ' · verified merchant (demo)</div>' +
            '<div class="chip-row mt-8">' + BIZ_ORG.categories.map(function (c) { return '<span class="pill sage">' + c + '</span>'; }).join('') + '</div>' +
          '</div>' +
        '</div>' +
        '<p class="sub mt-12">' + BIZ_ORG.about + '</p>' +
      '</div>' +
      '<div class="section-label">What guests see</div>' +
      '<div class="card mb-12">' +
        '<div class="fact-row"><span class="muted">Coverage</span><span class="strong" style="font-size:12px">' + BIZ_ORG.coverageBlurb.split('·')[0].trim() + '</span></div>' +
        '<div class="fact-row"><span class="muted">Hours</span><span class="strong" style="font-size:12px">' + BIZ_ORG.hours + '</span></div>' +
        '<div class="fact-row" style="border:none"><span class="muted">Offerings</span><span class="strong" style="font-size:12px">Deep clean · Turnover · Tidy</span></div>' +
      '</div>' +
      '<div class="section-label">Photo placeholders</div>' +
      '<div class="biz-photo-row mb-12">' +
        '<div class="biz-photo-ph" style="background:linear-gradient(145deg,#d4e0d6,#a8c0b0)">Team</div>' +
        '<div class="biz-photo-ph" style="background:linear-gradient(145deg,#e8dcc8,#c4a882)">Before/after</div>' +
        '<div class="biz-photo-ph" style="background:linear-gradient(145deg,#d8e2ea,#8aa0b0)">Van</div>' +
      '</div>' +
      '<div class="section-label">Owner-only (hidden from guests)</div>' +
      '<div class="card mb-12">' +
        '<p class="sub">Inbox, exact addresses, finance, team capabilities, and CRM contacts stay behind account switch. Public Explore match never creates a lead until inquiry.</p>' +
      '</div>' +
      '<button type="button" class="btn btn-primary" onclick="openPublicBusiness()">Open public link</button>' +
      '<button type="button" class="btn btn-secondary mt-8" onclick="go(\'biz-catalog\')">Edit catalog</button>' +
      '<p class="muted mt-12" style="font-size:11px;text-align:center">Opens guest shell <strong>#public-business</strong> · no owner chrome</p>';
  }

  window.openBizCatalog = function (id) {
    activeBizCatalogId = id;
    go('biz-catalog-detail');
  };

  function renderBizCatalog() {
    var body = $('#biz-catalog-body');
    if (!body) return;
    var rows = bizCatalog.map(function (o) {
      return '<div class="card tap mb-8" onclick="openBizCatalog(\'' + o.id + '\')">' +
        '<div class="between mb-8"><span class="strong">' + o.name + '</span><span class="pill ghost">' + o.version + '</span></div>' +
        '<div class="muted" style="font-size:12px">' + o.priceBasis + ' · ' + o.duration + '</div>' +
        '<div class="muted mt-8" style="font-size:11px">' + (o.active ? 'Active · guest-visible when public' : 'Draft') + '</div>' +
      '</div>';
    }).join('');
    body.innerHTML =
      '<div class="banner info mb-12"><span>ℹ</span><span>Versioned offerings (P55). Price basis &amp; duration are estimates — quote ≠ booking.</span></div>' +
      rows +
      '<button type="button" class="btn btn-secondary mt-8" onclick="openCatalogAddSheet()">Add offering (demo)</button>';
  }

  function renderBizCatalogDetail() {
    var body = $('#biz-catalog-detail-body');
    if (!body) return;
    var o = findBizOffering(activeBizCatalogId);
    if (!o) {
      body.innerHTML = '<div class="banner warn"><span>⚠</span><span>Offering not found.</span></div><button class="btn btn-secondary mt-12" onclick="go(\'biz-catalog\')">Back</button>';
      return;
    }
    body.innerHTML =
      '<h1 class="h1" style="font-size:22px">' + o.name + '</h1>' +
      '<div class="chip-row mb-12"><span class="pill sage">' + o.version + '</span><span class="pill ghost">' + (o.active ? 'Active' : 'Draft') + '</span></div>' +
      '<div class="card mb-12">' +
        '<div class="fact-row"><span class="muted">Price basis</span><span class="strong" style="font-size:12px">' + o.priceBasis + '</span></div>' +
        '<div class="fact-row"><span class="muted">Duration</span><span class="strong" style="font-size:12px">' + o.duration + '</span></div>' +
        '<div class="fact-row" style="border:none"><span class="muted">Status</span><span class="strong" style="font-size:12px">' + (o.active ? 'Listed' : 'Hidden') + '</span></div>' +
      '</div>' +
      '<div class="section-label">Inclusions</div><div class="card mb-12"><p class="sub">' + o.inclusions + '</p></div>' +
      '<div class="section-label">Exclusions</div><div class="card mb-12"><p class="sub">' + o.exclusions + '</p></div>' +
      '<div class="section-label">Intake notes</div><div class="card mb-12"><p class="sub">' + o.intakeNotes + '</p></div>' +
      '<button type="button" class="btn btn-secondary" onclick="toast(\'Edit sheet (demo) · local only\')">Edit offering (demo)</button>';
  }

  window.openCatalogAddSheet = function () {
    if (!requireBizOwner('Add offering')) return;
    var bd = $('#biz-catalog-add-backdrop');
    var sh = $('#biz-catalog-add-sheet');
    if (bd) bd.classList.add('show');
    if (sh) sh.classList.add('show');
  };
  window.closeCatalogAddSheet = function () {
    var bd = $('#biz-catalog-add-backdrop');
    var sh = $('#biz-catalog-add-sheet');
    if (bd) bd.classList.remove('show');
    if (sh) sh.classList.remove('show');
  };
  window.saveCatalogOffering = function () {
    if (!requireBizOwner('Save offering')) return;
    var name = ($('#biz-cat-name') && $('#biz-cat-name').value.trim()) || 'Custom tidy';
    var price = ($('#biz-cat-price') && $('#biz-cat-price').value.trim()) || 'From $95 · flat';
    var dur = ($('#biz-cat-duration') && $('#biz-cat-duration').value.trim()) || '2 hours';
    var id = 'offer_custom_' + (bizCatalogSeq++);
    bizCatalog.push({
      id: id, name: name, version: 'v1', priceBasis: price, duration: dur,
      inclusions: 'As scoped in quote', exclusions: 'Anything not listed', intakeNotes: 'Confirm access', active: true
    });
    closeCatalogAddSheet();
    toast('Offering saved (demo) · ' + name);
    if (current === 'biz-catalog') renderBizCatalog();
  };

  function renderBizCoverage() {
    var body = $('#biz-coverage-body');
    if (!body) return;
    body.innerHTML =
      '<div class="banner info mb-12"><span>ℹ</span><span><strong>Coverage ≠ capacity</strong> (P45). Serving East Austin does not mean infinite same-day slots.</span></div>' +
      '<div class="section-label" style="margin-top:0">Service area</div>' +
      '<div class="card mb-12">' +
        '<div class="strong">East Austin</div>' +
        '<p class="sub mt-8">' + BIZ_ORG.coverageBlurb + '</p>' +
        '<div class="fact-row mt-12"><span class="muted">Hours</span><span class="strong" style="font-size:12px">' + BIZ_ORG.hours + '</span></div>' +
        '<div class="fact-row" style="border:none"><span class="muted">Capacity note</span><span class="strong" style="font-size:12px">~4 deep / 6 tidy per day</span></div>' +
      '</div>' +
      '<div class="section-label">Mobile stops (faux map)</div>' +
      '<div class="biz-faux-map mb-12">' +
        '<div class="biz-map-blob" style="left:18%;top:30%">ECC</div>' +
        '<div class="biz-map-blob" style="left:42%;top:48%">Cesar</div>' +
        '<div class="biz-map-blob" style="left:62%;top:38%">S Lamar</div>' +
        '<div class="biz-map-label">Austin · demo blobs · not live tiles</div>' +
      '</div>' +
      '<div class="card mb-12">' +
        '<div class="team-row"><div class="flex-1"><div class="strong">East Cesar Chavez corridor</div><div class="muted">Cottage cluster · dog-friendly notes</div></div><span class="pill sage">Primary</span></div>' +
        '<div class="team-row"><div class="flex-1"><div class="strong">South Lamar lofts</div><div class="muted">Turnover windows · lockbox common</div></div><span class="pill ghost">Secondary</span></div>' +
        '<div class="team-row"><div class="flex-1"><div class="strong">Mueller / Manor Rd edge</div><div class="muted">By arrangement · travel fee in quote</div></div><span class="pill ghost">Edge</span></div>' +
      '</div>' +
      '<button type="button" class="btn btn-secondary" onclick="go(\'biz-schedule\')">Open schedule board</button>';
  }

  function renderBizSchedule() {
    var body = $('#biz-schedule-body');
    if (!body) return;
    var days = [
      { d: 'Mon 22', items: [] },
      { d: 'Tue 23', items: [{ t: 'Tidy hold', who: 'Riley · capacity' }] },
      { d: 'Wed 24', items: [{ t: 'Recurring tidy', who: 'Maple · done' }] },
      { d: 'Thu 25', items: [{ t: 'Deep clean window', who: 'River Guest · inquiry' }] },
      { d: 'Fri 26', items: [{ t: 'Turnover 9–11', who: 'Casey · on the way' }] },
      { d: 'Sat 27', items: [{ t: 'Move-out 1–5', who: 'Needs assign' }] },
      { d: 'Sun 28', items: [] }
    ];
    var html = '<div class="banner private mb-12"><span>◎</span><span>Week board distinct from Jobs list. Tap a job day to open the Jobs board.</span></div>';
    days.forEach(function (day) {
      html += '<div class="card mb-8"><div class="between mb-8"><span class="strong">' + day.d + '</span><span class="muted" style="font-size:11px">' + (day.items.length ? day.items.length + ' block' : 'Open') + '</span></div>';
      if (!day.items.length) html += '<p class="muted" style="font-size:12px">No booked blocks · capacity available</p>';
      day.items.forEach(function (it) {
        html += '<div class="fact-row" style="border:none;padding:6px 0"><span class="strong" style="font-size:13px">' + it.t + '</span><span class="muted" style="font-size:11px">' + it.who + '</span></div>';
      });
      html += '</div>';
    });
    html += '<button type="button" class="btn btn-secondary mt-8" onclick="go(\'biz-jobs\')">Open Jobs list</button>';
    body.innerHTML = html;
  }

  window.openBizCustomer = function (id) {
    activeBizCustomerId = id;
    go('biz-customer-detail');
  };

  window.openBizInquiryFromCrm = function (gid) {
    activeBizInquiryId = gid;
    go('biz-inquiry-detail');
  };

  function renderBizCustomers() {
    var body = $('#biz-customers-body');
    if (!body) return;
    var rows = bizCustomers.map(function (c) {
      var meta = c.kind === 'inquiry_alias' ? 'Inquiry alias · ' + (c.grantId || '') : 'Past customer · jobs linked';
      var pill = c.status === 'open' ? '<span class="pill sage">Open</span>' : '<span class="pill ghost">Active</span>';
      return '<div class="card tap mb-8" onclick="openBizCustomer(\'' + c.id + '\')">' +
        '<div class="team-row" style="border:none;padding:0">' +
          '<div class="avatar" style="background:' + c.color + '">' + c.initials + '</div>' +
          '<div class="flex-1"><div class="strong">' + c.alias + '</div><div class="muted" style="font-size:12px">' + meta + '</div></div>' +
          pill +
        '</div></div>';
    }).join('');
    body.innerHTML =
      '<div class="banner private mb-12"><span>◎</span><span>Light CRM of <strong>deliberate contacts only</strong>. No browse leads. Explore match never adds a row here.</span></div>' +
      rows;
  }

  function renderBizCustomerDetail() {
    var body = $('#biz-customer-detail-body');
    if (!body) return;
    var c = findBizCustomer(activeBizCustomerId);
    if (!c) {
      body.innerHTML = '<div class="banner warn"><span>⚠</span><span>Customer not found.</span></div>';
      return;
    }
    var inqHtml = '';
    if (c.openInquiryIds.length) {
      c.openInquiryIds.forEach(function (gid) {
        inqHtml += '<div class="you-row" onclick="openBizInquiryFromCrm(\'' + gid + '\')"><span>◎</span><span class="y-label">' + gid + '</span><span class="y-chev">›</span></div>';
      });
    } else {
      inqHtml = '<p class="muted" style="font-size:12px">No open inquiries</p>';
    }
    var jobHtml = '';
    c.jobIds.forEach(function (jid) {
      var j = findJob(jid);
      var label = j ? (j.service + ' · ' + j.status) : (jid + ' · pending Accept quote');
      var click = j ? 'onclick="openBizJob(\'' + jid + '\')"' : '';
      jobHtml += '<div class="you-row" ' + click + '><span>◇</span><span class="y-label">' + label + '</span><span class="y-chev">›</span></div>';
    });
    if (!c.jobIds.length) jobHtml = '<p class="muted" style="font-size:12px">No jobs yet</p>';
    var invHtml = '';
    c.invoiceIds.forEach(function (iid) {
      var inv = findBizInvoice(iid);
      if (!inv) return;
      invHtml += '<div class="you-row" onclick="openBizInvoice(\'' + iid + '\')"><span>◈</span><span class="y-label">' + inv.label + '</span><span class="y-meta">' + money2(inv.invoicedCents) + '</span><span class="y-chev">›</span></div>';
    });
    if (!invHtml) invHtml = '<p class="muted" style="font-size:12px">No invoices</p>';
    body.innerHTML =
      '<div class="row gap-md mb-12">' +
        '<div class="avatar lg" style="background:' + c.color + '">' + c.initials + '</div>' +
        '<div class="flex-1"><h1 class="h1" style="font-size:20px;margin:0">' + c.alias + '</h1>' +
        '<div class="muted">' + (c.kind === 'inquiry_alias' ? 'Inquiry alias' : 'Past customer') + '</div></div>' +
      '</div>' +
      '<div class="card mb-12"><p class="sub">' + c.notes + '</p></div>' +
      '<div class="section-label">Open inquiries</div><div class="card mb-12" style="padding:4px 16px">' + inqHtml + '</div>' +
      '<div class="section-label">Jobs</div><div class="card mb-12" style="padding:4px 16px">' + jobHtml + '</div>' +
      '<div class="section-label">Invoices</div><div class="card mb-12" style="padding:4px 16px">' + invHtml + '</div>';
  }

  window.openBizTeamMember = function (id) {
    activeBizTeamMemberId = id;
    go('biz-team-member');
  };

  window.demoInviteCrew = function () {
    if (!requireBizOwner('Invite')) return;
    toast('Invite link copied (demo) · not emailed');
  };

  function renderBizTeam() {
    var body = $('#biz-team-body');
    if (!body) return;
    var matrix = BIZ_ROLE_CAPS.map(function (r) {
      return '<div class="fact-row"><span class="muted" style="font-size:12px;flex:1">' + r.label + '</span>' +
        '<span class="pill ' + (r.owner ? 'sage' : 'ghost') + '" style="margin-right:4px">Own</span>' +
        '<span class="pill ' + (r.crew ? 'sage' : 'ghost') + '">Crew</span></div>';
    }).join('');
    body.innerHTML =
      '<div class="banner info mb-12"><span>ℹ</span><span>P38 roles. Crew sees assigned jobs only — not full Business hub, finance, or all customers.</span></div>' +
      '<div class="card mb-12">' +
        '<div class="team-row tap" onclick="openBizTeamMember(\'al\')">' +
          '<div class="avatar" style="background:linear-gradient(135deg,#c4a882,#6d8a72)">AL</div>' +
          '<div class="flex-1"><div class="strong">Al</div><div class="muted">Owner · full inquiries · quotes · finance</div></div>' +
          '<span class="pill sage">Owner</span></div>' +
        '<div class="team-row tap" onclick="openBizTeamMember(\'casey\')">' +
          '<div class="avatar" style="background:#6a7a55">CN</div>' +
          '<div class="flex-1"><div class="strong">Casey Nguyen</div><div class="muted">Crew · switchable account</div></div>' +
          '<span class="pill ghost">Crew</span></div>' +
        '<div class="team-row tap" onclick="openBizTeamMember(\'riley\')">' +
          '<div class="avatar" style="background:#8a7355">RO</div>' +
          '<div class="flex-1"><div class="strong">Riley Okonkwo</div><div class="muted">Crew · assignable (no full account)</div></div>' +
          '<span class="pill ghost">Crew</span></div>' +
      '</div>' +
      '<div class="section-label">Capability matrix</div>' +
      '<div class="card mb-12">' + matrix + '</div>' +
      '<button type="button" class="btn btn-primary" onclick="openAccountSwitcher()">Switch account → Casey</button>' +
      '<button type="button" class="btn btn-secondary mt-8" onclick="demoInviteCrew()">Invite crew (demo)</button>';
  }

  function renderBizTeamMember() {
    var body = $('#biz-team-member-body');
    if (!body) return;
    var id = activeBizTeamMemberId;
    var name, role, initials, color, blurb, switchBtn = '';
    if (id === 'al') {
      name = 'Al'; role = 'Owner'; initials = 'AL'; color = 'linear-gradient(135deg,#c4a882,#6d8a72)';
      blurb = 'Full Business hub. Can send quotes, request exact, assign crew, reset job status, and run finance.';
    } else if (id === 'casey') {
      name = 'Casey Nguyen'; role = 'Crew'; initials = 'CN'; color = '#6a7a55';
      blurb = 'Platform crew account. Sees Today · Jobs · Me only. Advances assigned job status; cannot reset or open Finance.';
      switchBtn = '<button type="button" class="btn btn-primary mt-12" onclick="openAccountSwitcher()">Switch to Casey account</button>';
    } else {
      name = 'Riley Okonkwo'; role = 'Crew'; initials = 'RO'; color = '#8a7355';
      blurb = 'Assignable on Jobs board. No full login in this prototype — toast-only presence.';
    }
    var caps = BIZ_ROLE_CAPS.filter(function (r) {
      return role === 'Owner' ? r.owner : r.crew;
    }).map(function (r) { return '<li>' + r.label + '</li>'; }).join('');
    body.innerHTML =
      '<div class="row gap-md mb-12">' +
        '<div class="avatar lg" style="background:' + color + '">' + initials + '</div>' +
        '<div class="flex-1"><h1 class="h1" style="font-size:20px;margin:0">' + name + '</h1><div class="muted">' + role + ' @ Cedar &amp; Stone</div></div>' +
      '</div>' +
      '<div class="card mb-12"><p class="sub">' + blurb + '</p></div>' +
      '<div class="section-label">This role can</div>' +
      '<div class="card mb-12"><ul class="sub" style="margin:0;padding-left:18px">' + caps + '</ul></div>' +
      switchBtn;
  }

  window.setBizFinanceTab = function (tab) {
    activeBizFinanceTab = tab;
    renderBizFinance();
  };

  window.openBizInvoice = function (id) {
    activeBizInvoiceId = id;
    go('biz-invoice-detail');
  };

  window.demoExportStatement = function () {
    if (!requireBizOwner('Export')) return;
    toast('Statement export queued (demo) · Sep CT CSV');
  };

  window.demoRefundInvoice = function (id) {
    if (!requireBizOwner('Refund')) return;
    var inv = findBizInvoice(id);
    if (!inv) { toast('Invoice not found'); return; }
    if (inv.paidCents <= 0) { toast('Nothing paid to refund'); return; }
    var amt = Math.min(3000, inv.paidCents);
    inv.paidCents -= amt;
    inv.status = 'exception';
    inv.notes = (inv.notes || '') + ' · Refund demo −' + money2(amt);
    bizPaymentAttempts.unshift({
      id: 'pay_ref_' + Date.now(),
      invoiceId: id,
      label: 'Refund demo · ' + inv.label,
      amountCents: amt,
      status: 'refund_pending',
      atLabel: 'Just now · demo'
    });
    toast('Refund ' + money2(amt) + ' queued (demo · hosted processor)');
    renderBizInvoiceDetail();
  };

  function financePeriodSummary() {
    var rev = 0, out = 0, fees = 0, net = 0;
    bizInvoices.forEach(function (inv) {
      rev += inv.paidCents;
      if (inv.status === 'outstanding') out += (inv.invoicedCents - inv.paidCents);
      fees += inv.feeCents || 0;
      net += inv.paidOutCents || 0;
    });
    return { rev: rev, out: out, fees: fees, net: net };
  }

  function renderBizFinance() {
    var body = $('#biz-finance-body');
    if (!body) return;
    if (activeWorkspace !== 'business') {
      body.innerHTML = '<div class="banner warn"><span>⚠</span><span>Owner Finance · switch to Cedar Owner.</span></div>';
      return;
    }
    var s = financePeriodSummary();
    var tab = activeBizFinanceTab;
    var tabs = [
      { id: 'invoices', label: 'Invoices' },
      { id: 'payments', label: 'Payments' },
      { id: 'payouts', label: 'Payouts' },
      { id: 'exceptions', label: 'Exceptions' }
    ];
    var tabHtml = '<div class="chip-row mb-12">' + tabs.map(function (t) {
      return '<button type="button" class="purpose-chip' + (tab === t.id ? ' on' : '') + '" onclick="setBizFinanceTab(\'' + t.id + '\')">' + t.label + '</button>';
    }).join('') + '</div>';

    var list = '';
    if (tab === 'invoices') {
      list = bizInvoices.map(function (inv) {
        var bal = inv.invoicedCents - inv.paidCents;
        return '<div class="card tap mb-8" onclick="openBizInvoice(\'' + inv.id + '\')">' +
          '<div class="between mb-8"><span class="strong">' + inv.label + '</span><span class="pill ' + (inv.status === 'outstanding' ? 'warn' : inv.status === 'paid_out' ? 'sage' : 'ghost') + '">' + inv.status.replace(/_/g, ' ') + '</span></div>' +
          '<div class="muted" style="font-size:12px">Quoted ' + money2(inv.quotedCents) + ' · Invoiced ' + money2(inv.invoicedCents) + ' · Paid ' + money2(inv.paidCents) + ' · Out ' + money2(inv.paidOutCents) + '</div>' +
          '<div class="muted mt-8" style="font-size:11px">Balance ' + money2(bal) + ' · ' + inv.dueLabel + '</div></div>';
      }).join('');
    } else if (tab === 'payments') {
      list = bizPaymentAttempts.map(function (p) {
        return '<div class="card mb-8"><div class="between"><span class="strong">' + p.label + '</span><span class="pill ghost">' + p.status.replace(/_/g, ' ') + '</span></div>' +
          '<div class="muted mt-8" style="font-size:12px">' + money2(p.amountCents) + ' · ' + p.atLabel + '</div></div>';
      }).join('');
    } else if (tab === 'payouts') {
      list = bizPayouts.map(function (p) {
        return '<div class="card mb-8"><div class="between"><span class="strong">' + p.label + '</span><span class="pill ' + (p.status === 'completed' ? 'sage' : 'ghost') + '">' + p.status + '</span></div>' +
          '<div class="muted mt-8" style="font-size:12px">' + money2(p.amountCents) + ' → ' + p.dest + '</div>' +
          '<div class="muted" style="font-size:11px">' + p.arrivedLabel + '</div></div>';
      }).join('');
    } else {
      var ex = bizInvoices.filter(function (i) { return i.status === 'exception' || i.status === 'outstanding'; });
      list = ex.map(function (inv) {
        return '<div class="card tap mb-8" onclick="openBizInvoice(\'' + inv.id + '\')">' +
          '<div class="strong">' + inv.label + '</div><p class="sub mt-8">' + inv.notes + '</p></div>';
      }).join('') || '<p class="muted">No exceptions</p>';
    }

    body.innerHTML =
      '<div class="banner private mb-12"><span>◎</span><span>Business ledger · distinct from personal You → Ledger. Quoted ≠ invoiced ≠ paid ≠ paid-out (P59).</span></div>' +
      '<div class="banner info mb-12"><span>ℹ</span><span>Last reconciled <strong>' + bizLastReconciledLabel + '</strong> (demo).</span></div>' +
      '<div class="section-label" style="margin-top:0">September CT</div>' +
      '<div class="biz-stat-strip mb-16">' +
        '<div class="biz-stat"><div class="biz-stat-n">' + money(s.rev) + '</div><div class="biz-stat-l">Collected</div></div>' +
        '<div class="biz-stat"><div class="biz-stat-n">' + money(s.out) + '</div><div class="biz-stat-l">Outstanding</div></div>' +
        '<div class="biz-stat"><div class="biz-stat-n">' + money2(s.fees) + '</div><div class="biz-stat-l">Fees</div></div>' +
        '<div class="biz-stat"><div class="biz-stat-n">' + money(s.net) + '</div><div class="biz-stat-l">Paid out</div></div>' +
      '</div>' +
      tabHtml + list +
      '<button type="button" class="btn btn-secondary mt-12" onclick="demoExportStatement()">Export statement (demo)</button>' +
      '<button type="button" class="btn btn-ghost mt-8" style="width:100%" onclick="go(\'biz-payments\')">Open Payments &amp; payouts</button>';
  }

  function renderBizInvoiceDetail() {
    var body = $('#biz-invoice-detail-body');
    if (!body) return;
    var inv = findBizInvoice(activeBizInvoiceId);
    if (!inv) {
      body.innerHTML = '<div class="banner warn"><span>⚠</span><span>Invoice not found.</span></div>';
      return;
    }
    var bal = inv.invoicedCents - inv.paidCents;
    var lines = inv.lines.map(function (l) {
      return '<div class="fact-row"><span class="muted" style="font-size:12px">' + l.desc + '</span><span class="strong" style="font-size:12px">' + money2(l.amountCents) + '</span></div>';
    }).join('');
    var jobLink = inv.jobId && findJob(inv.jobId)
      ? '<button type="button" class="btn btn-ghost mt-8" style="width:100%" onclick="openBizJob(\'' + inv.jobId + '\')">Open linked job</button>'
      : '';
    body.innerHTML =
      '<h1 class="h1" style="font-size:20px">' + inv.label + '</h1>' +
      '<div class="chip-row mb-12"><span class="pill sage">' + inv.status.replace(/_/g, ' ') + '</span><span class="pill ghost">' + inv.issuedLabel + '</span></div>' +
      '<div class="card mb-12">' +
        '<div class="fact-row"><span class="muted">Quoted</span><span class="strong">' + money2(inv.quotedCents) + '</span></div>' +
        '<div class="fact-row"><span class="muted">Invoiced</span><span class="strong">' + money2(inv.invoicedCents) + '</span></div>' +
        '<div class="fact-row"><span class="muted">Paid</span><span class="strong">' + money2(inv.paidCents) + '</span></div>' +
        '<div class="fact-row"><span class="muted">Paid out</span><span class="strong">' + money2(inv.paidOutCents) + '</span></div>' +
        '<div class="fact-row"><span class="muted">Deposit / credit</span><span class="strong">' + money2(inv.depositCents) + ' / ' + money2(inv.creditCents) + '</span></div>' +
        '<div class="fact-row" style="border:none"><span class="muted">Fees</span><span class="strong">' + money2(inv.feeCents) + '</span></div>' +
      '</div>' +
      '<div class="section-label">Line items</div><div class="card mb-12">' + lines + '</div>' +
      '<div class="card mb-12"><div class="between"><span class="strong">Balance</span><span class="strong" style="font-size:18px">' + money2(bal) + '</span></div>' +
        '<p class="muted mt-8" style="font-size:11px">' + inv.notes + '</p></div>' +
      '<button type="button" class="btn btn-secondary" onclick="toast(\'Receipt PDF (demo) · not emailed\')">View receipt (demo)</button>' +
      '<button type="button" class="btn btn-ghost mt-8" style="width:100%" onclick="demoRefundInvoice(\'' + inv.id + '\')">Refund (demo)</button>' +
      jobLink;
  }

  window.demoTriggerPayout = function () {
    if (!requireBizOwner('Payout')) return;
    var pending = bizPayouts.filter(function (p) { return p.status === 'scheduled'; })[0];
    if (!pending) { toast('No scheduled payout'); return; }
    pending.status = 'completed';
    pending.arrivedLabel = 'Just now · demo';
    // Mark loft invoice paid-out fractionally
    var loft = findBizInvoice('inv_loft_turnover_02');
    if (loft && loft.paidOutCents < loft.paidCents - loft.feeCents) {
      loft.paidOutCents = loft.paidCents - loft.feeCents;
      loft.status = 'paid_out';
    }
    toast('Payout ' + money2(pending.amountCents) + ' sent (demo · hosted processor)');
    if (current === 'biz-payments') renderBizPayments();
    if (current === 'biz-finance') renderBizFinance();
  };

  function renderBizPayments() {
    var body = $('#biz-payments-body');
    if (!body) return;
    var attempts = bizPaymentAttempts.map(function (p) {
      return '<div class="team-row"><div class="flex-1"><div class="strong" style="font-size:13px">' + p.label + '</div><div class="muted" style="font-size:11px">' + p.atLabel + '</div></div>' +
        '<div style="text-align:right"><div class="strong" style="font-size:13px">' + money2(p.amountCents) + '</div><span class="pill ghost">' + p.status.replace(/_/g, ' ') + '</span></div></div>';
    }).join('');
    var pos = bizPayouts.map(function (p) {
      return '<div class="team-row"><div class="flex-1"><div class="strong" style="font-size:13px">' + p.label + '</div><div class="muted" style="font-size:11px">' + p.arrivedLabel + ' · ' + p.dest + '</div></div>' +
        '<div style="text-align:right"><div class="strong">' + money2(p.amountCents) + '</div><span class="pill ' + (p.status === 'completed' ? 'sage' : 'ghost') + '">' + p.status + '</span></div></div>';
    }).join('');
    body.innerHTML =
      '<div class="banner warn mb-12"><span>⚠</span><span><strong>Hosted processor</strong> honesty: Domicile does not store card numbers. Not a stored-value wallet. Prototype only — no real charges.</span></div>' +
      '<div class="card mb-12">' +
        '<div class="between mb-8"><span class="strong">Payee onboarding</span><span class="pill sage">Connected</span></div>' +
        '<p class="sub">Demo processor linked · payout to checking ·····4821. Schedule: twice weekly (Tue/Fri CT).</p>' +
      '</div>' +
      '<div class="section-label">Payout schedule</div>' +
      '<div class="card mb-12">' + pos + '</div>' +
      '<button type="button" class="btn btn-primary mb-16" onclick="demoTriggerPayout()">Run next payout (demo)</button>' +
      '<div class="section-label">Payment attempts · returns · refunds</div>' +
      '<div class="card mb-12">' + attempts + '</div>';
  }

  window.toggleBizIntegration = function (id) {
    if (!requireBizOwner('Integration')) return;
    var item = null;
    for (var i = 0; i < bizIntegrations.length; i++) if (bizIntegrations[i].id === id) item = bizIntegrations[i];
    if (!item) return;
    if (item.status === 'connected') item.status = 'not_connected';
    else if (item.status === 'needs_reauth') item.status = 'connected';
    else item.status = 'connected';
    toast(item.name + ' → ' + item.status.replace(/_/g, ' ') + ' (demo)');
    renderBizIntegrations();
  };

  function renderBizIntegrations() {
    var body = $('#biz-integrations-body');
    if (!body) return;
    var cards = bizIntegrations.map(function (it) {
      var pill = it.status === 'connected' ? 'sage' : it.status === 'needs_reauth' ? 'warn' : 'ghost';
      return '<div class="card mb-8">' +
        '<div class="between mb-8"><span class="strong">' + it.name + '</span><span class="pill ' + pill + '">' + it.status.replace(/_/g, ' ') + '</span></div>' +
        '<p class="sub">Authority: ' + it.authority + '</p>' +
        '<p class="muted mt-8" style="font-size:11px">' + it.honesty + '</p>' +
        '<button type="button" class="btn btn-secondary mt-12" onclick="toggleBizIntegration(\'' + it.id + '\')">Toggle (demo)</button>' +
      '</div>';
    }).join('');
    body.innerHTML =
      '<div class="banner private mb-12"><span>◎</span><span>Connectors declare authority explicitly (P58). Demo toggles only — not real OAuth.</span></div>' +
      cards;
  }

  function renderBizGrowth() {
    var body = $('#biz-growth-body');
    if (!body) return;
    var g = bizGrowth;
    var camps = g.campaigns.map(function (c) {
      return '<div class="card mb-8">' +
        '<div class="between mb-8"><span class="strong">' + c.name + '</span><span class="pill ' + (c.channel === 'sponsored' ? 'warn' : 'sage') + '">' + c.channel + '</span></div>' +
        '<div class="muted" style="font-size:12px">Inquiries ' + c.inquiries + ' · Quotes ' + c.quotes + ' · Accepted ' + c.accepted + '</div>' +
        '<div class="muted mt-8" style="font-size:11px">Status: ' + c.status + (c.channel === 'sponsored' ? ' · Ad-labeled upstream' : ' · Organic') + '</div></div>';
    }).join('');
    body.innerHTML =
      '<div class="banner info mb-12"><span>ℹ</span><span>Honest funnel metrics — inquiries → quotes → accepted → completed. Not vanity impressions.</span></div>' +
      '<div class="section-label" style="margin-top:0">' + g.periodLabel + '</div>' +
      '<div class="biz-stat-strip mb-16">' +
        '<div class="biz-stat"><div class="biz-stat-n">' + g.inquiries + '</div><div class="biz-stat-l">Inquiries</div></div>' +
        '<div class="biz-stat"><div class="biz-stat-n">' + g.quotesSent + '</div><div class="biz-stat-l">Quotes</div></div>' +
        '<div class="biz-stat"><div class="biz-stat-n">' + g.accepted + '</div><div class="biz-stat-l">Accepted</div></div>' +
        '<div class="biz-stat"><div class="biz-stat-n">' + g.completed + '</div><div class="biz-stat-l">Completed</div></div>' +
      '</div>' +
      '<div class="card mb-12">' +
        '<div class="fact-row"><span class="muted">Organic inquiries</span><span class="strong">' + g.organicInquiries + '</span></div>' +
        '<div class="fact-row" style="border:none"><span class="muted">Sponsored clicks (Ad)</span><span class="strong">' + g.sponsoredClicks + '</span></div>' +
      '</div>' +
      '<div class="section-label">Campaigns</div>' + camps;
  }

  window.openBizPauseSheet = function () {
    if (!requireBizOwner('Pause business')) return;
    var bd = $('#biz-pause-backdrop');
    var sh = $('#biz-pause-sheet');
    if (bd) bd.classList.add('show');
    if (sh) sh.classList.add('show');
  };
  window.closeBizPauseSheet = function () {
    var bd = $('#biz-pause-backdrop');
    var sh = $('#biz-pause-sheet');
    if (bd) bd.classList.remove('show');
    if (sh) sh.classList.remove('show');
  };
  window.confirmBizPause = function () {
    if (!requireBizOwner('Pause')) return;
    bizPausedAccepting = true;
    closeBizPauseSheet();
    toast('Paused accepting new work (demo)');
    if (current === 'biz-settings') renderBizSettings();
    if (current === 'biz-profile') renderBizProfile();
  };
  window.toggleBizNotify = function (key) {
    if (!requireBizOwner('Settings')) return;
    bizSettings[key] = !bizSettings[key];
    toast((key.replace('notify', '')) + ' → ' + (bizSettings[key] ? 'on' : 'off') + ' (demo)');
    renderBizSettings();
  };
  window.demoBizDataExport = function () {
    if (!requireBizOwner('Export')) return;
    toast('Org data export queued (demo) · JSON zip');
  };

  function renderBizSettings() {
    var body = $('#biz-settings-body');
    if (!body) return;
    if (activeWorkspace !== 'business' || activeAccount !== 'al') {
      body.innerHTML = '<div class="banner warn mb-12"><span>⚠</span><span>Business settings are <strong>owner-only</strong>. Switch to Cedar &amp; Stone · Owner.</span></div>' +
        '<button class="btn btn-primary" onclick="openAccountSwitcher()">Switch account…</button>';
      return;
    }
    var s = bizSettings;
    body.innerHTML =
      '<div class="banner private mb-12"><span>◎</span><span>Owner-only org settings. Quiet hours &amp; role defaults do not change personal Pause sharing.</span></div>' +
      '<div class="card mb-12">' +
        '<div class="fact-row"><span class="muted">Legal name</span><span class="strong" style="font-size:12px">' + s.legalName + '</span></div>' +
        '<div class="fact-row"><span class="muted">Timezone</span><span class="strong" style="font-size:12px">' + s.timezone + '</span></div>' +
        '<div class="fact-row"><span class="muted">Quiet hours</span><span class="strong" style="font-size:12px">' + s.quietHours + '</span></div>' +
        '<div class="fact-row" style="border:none"><span class="muted">Accepting work</span><span class="strong" style="font-size:12px">' + (bizPausedAccepting ? 'Paused' : 'Open') + '</span></div>' +
      '</div>' +
      '<div class="section-label">Notifications</div>' +
      '<div class="card mb-12" style="padding:4px 16px">' +
        '<div class="you-row" onclick="toggleBizNotify(\'notifyInquiries\')"><span class="y-label">New inquiries</span><span class="y-meta">' + (s.notifyInquiries ? 'On' : 'Off') + '</span></div>' +
        '<div class="you-row" onclick="toggleBizNotify(\'notifyPayouts\')"><span class="y-label">Payouts</span><span class="y-meta">' + (s.notifyPayouts ? 'On' : 'Off') + '</span></div>' +
        '<div class="you-row" onclick="toggleBizNotify(\'notifyExceptions\')"><span class="y-label">Exceptions / refunds</span><span class="y-meta">' + (s.notifyExceptions ? 'On' : 'Off') + '</span></div>' +
      '</div>' +
      '<div class="section-label">Role defaults</div>' +
      '<div class="card mb-12">' +
        '<div class="fact-row"><span class="muted">Owner</span><span class="strong" style="font-size:11px">' + s.roleDefaultOwner + '</span></div>' +
        '<div class="fact-row" style="border:none"><span class="muted">Crew</span><span class="strong" style="font-size:11px">' + s.roleDefaultCrew + '</span></div>' +
      '</div>' +
      '<button type="button" class="btn btn-secondary" onclick="demoBizDataExport()">Export org data (demo)</button>' +
      '<button type="button" class="btn btn-ghost mt-8" style="width:100%" onclick="openBizPauseSheet()">' + (bizPausedAccepting ? 'Already paused' : 'Pause / close business…') + '</button>' +
      '<p class="muted mt-16" style="font-size:11px;text-align:center">Optional View-as-Crew lens removed from hub — use Switch → Casey.</p>';
  }

  window.setBizRoleLens = function (role) {
    bizDemoRoleView = role === 'crew' ? 'crew' : 'owner';
    toast(bizDemoRoleView === 'owner'
      ? 'Owner lens (optional) · prefer Switch → Casey for real crew'
      : 'Crew lens overlay · Switch account → Casey for full crew UX');
    if (current === 'biz-profile') renderBizProfile();
    if (current === 'biz-inquiry-detail') renderBizInquiryDetail();
  };

  /* ========== Crew account (Casey Nguyen @ Cedar & Stone) ========== */  /* ========== Crew account (Casey Nguyen @ Cedar & Stone) ========== */

  window.openCrewJob = function (id) {
    var j = findJob(id);
    if (!j || j.assigneeId !== 'casey') {
      toast('Not assigned to you · access denied');
      return;
    }
    activeCrewJobId = id;
    go('crew-job-detail');
  };

  function renderCrewToday() {
    var body = $('#crew-today-body');
    if (!body) return;
    var mine = caseyJobs().filter(function (j) { return j.status !== 'completed'; });
    var next = mine[0] || null;
    var cards = '';
    if (next) {
      cards +=
        '<div class="card tap mb-8" style="border-color:#c2d6c5;background:var(--accent-soft)" onclick="openCrewJob(\'' + next.id + '\')">' +
          '<div class="between mb-8"><span class="pill sage">Next up</span><span class="muted">' + next.whenShort + '</span></div>' +
          '<div class="strong">' + next.service + ' · ' + next.customerAlias + '</div>' +
          '<p class="sub mt-8">' + next.addressApprox + '</p>' +
        '</div>';
    }
    mine.forEach(function (j) {
      if (next && j.id === next.id) return;
      ensureJobStatusFields(j);
      var pill = jobStatusPill(j);
      var hint = jobListDurationHint(j);
      cards +=
        '<div class="card tap mb-8" onclick="openCrewJob(\'' + j.id + '\')">' +
          '<div class="between mb-8"><span class="pill ' + pill.cls + '">' + pill.label + '</span>' +
          '<span class="muted">' + j.whenShort + '</span></div>' +
          '<div class="strong">' + j.service + '</div>' +
          '<p class="sub mt-8">' + j.customerAlias + (hint ? ' · ' + hint : '') + '</p>' +
        '</div>';
    });
    if (!cards) {
      cards = '<div class="card mb-8" style="border-style:dashed"><p class="sub">No active assignments. Ask Owner to assign a job.</p></div>';
    }
    var done = caseyJobs().filter(function (j) { return j.status === 'completed'; }).length;
    body.innerHTML =
      '<div class="greeting">Hi Casey</div>' +
      '<h1 class="h1">Crew Today</h1>' +
      '<p class="sub mb-12">Cedar &amp; Stone · Crew role</p>' +
      '<div class="banner private mb-12"><span>◎</span><span>You only see jobs assigned to you · exact address only for active job window.</span></div>' +
      '<div class="stat-row mb-16">' +
        '<div class="stat"><div class="n">' + mine.length + '</div><div class="l">Assigned</div></div>' +
        '<div class="stat"><div class="n">' + done + '</div><div class="l">Completed</div></div>' +
        '<div class="stat"><div class="n">0</div><div class="l">Inbox</div></div>' +
      '</div>' +
      '<div class="section-label" style="margin-top:0">Your jobs</div>' +
      cards +
      '<button class="btn btn-secondary mt-8" onclick="go(\'crew-jobs\')">All my jobs</button>' +
      '<p class="muted mt-16" style="font-size:11px;text-align:center">No inquiry inbox · no finance · prototype</p>';
  }

  function renderCrewJobs() {
    var body = $('#crew-jobs-body');
    if (!body) return;
    var mine = caseyJobs();
    var html = '<h1 class="h1" style="font-size:22px">My jobs</h1>' +
      '<p class="sub mb-12">Filtered to Casey · reassign removes jobs from this list.</p>';
    if (!mine.length) {
      html += '<div class="card" style="border-style:dashed"><p class="sub">Nothing assigned. Owner Jobs → Assign Casey.</p></div>';
    } else {
      mine.forEach(function (j) {
        ensureJobStatusFields(j);
        var pill = jobStatusPill(j);
        var hint = jobListDurationHint(j);
        html +=
          '<div class="card tap mb-8" onclick="openCrewJob(\'' + j.id + '\')">' +
            '<div class="between mb-8"><span class="pill ' + pill.cls + '">' + pill.label + '</span>' +
            '<span class="muted">' + j.whenShort + '</span></div>' +
            '<div class="strong">' + j.service + '</div>' +
            '<div class="muted mt-8" style="font-size:12px">' + j.customerAlias + ' · ' + j.addressApprox + '</div>' +
            (hint ? '<div class="muted mt-8" style="font-size:12px">' + hint + '</div>' : '') +
            '<div class="grant-id" style="margin-top:8px">' + j.id + '</div>' +
          '</div>';
      });
    }
    body.innerHTML = html;
  }

  function renderCrewJobDetail() {
    var body = $('#crew-job-detail-body');
    if (!body) return;
    var j = findJob(activeCrewJobId);
    if (!j || j.assigneeId !== 'casey') {
      body.innerHTML =
        '<div class="banner warn mb-12"><span>⚠</span><span>This job is not assigned to you. Access ended on reassign (or never granted).</span></div>' +
        '<button class="btn btn-secondary" onclick="go(\'crew-jobs\')">Back to my jobs</button>';
      return;
    }
    var exact = crewCanSeeExact(j);
    var fields;
    if (exact) {
      var street = j.addressExact;
      if (!street && j.placeId) {
        var pl = placeById(j.placeId);
        street = pl.street + ' · ' + pl.unit;
      }
      fields =
        '<div class="fact-row"><span class="muted">Street</span><span class="strong" style="font-size:13px">' + (street || '—') + '</span></div>' +
        '<div class="fact-row"><span class="muted">Access</span><span class="strong" style="font-size:12px">' + (j.accessNotes || 'See Owner notes') + '</span></div>' +
        '<div class="fact-row" style="border:none"><span class="muted">Window</span><span class="strong" style="font-size:12px">Exact unlocked for assignee</span></div>';
    } else {
      fields =
        '<div class="fact-row"><span class="muted">Area</span><span class="strong" style="font-size:13px">' + (j.addressApprox || 'Approx') + '</span></div>' +
        '<div class="fact-row" style="border:none"><span class="muted">Exact</span><span class="strong" style="font-size:12px">Locked · needs grant precision or job unlock</span></div>';
    }
    ensureJobStatusFields(j);
    var pill = jobStatusPill(j);
    var phase = j.crewPhase || 'idle';
    var phaseLabel = phase === 'idle' || !phase ? 'Scheduled · not started' : statusKeyLabel(phase === 'on_way' ? 'on_way' : phase);
    var hint = jobListDurationHint(j);
    var checklist =
      '<div class="section-label">Execution</div>' +
      '<div class="card mb-12">' +
        '<button class="btn ' + (phase === 'idle' || !phase ? 'btn-primary' : 'btn-secondary') + ' mb-8" ' +
          (j.status === 'completed' ? 'disabled style="opacity:.5"' : '') +
          ' onclick="crewAdvanceJob(\'started\')">1 · Start job</button>' +
        '<button class="btn ' + (phase === 'started' ? 'btn-primary' : 'btn-secondary') + ' mb-8" ' +
          (phase !== 'started' && phase !== 'on_way' && j.status !== 'in_progress' ? 'disabled style="opacity:.5"' : '') +
          (j.status === 'completed' ? ' disabled style="opacity:.5"' : '') +
          ' onclick="crewAdvanceJob(\'on_way\')">2 · On the way / on site</button>' +
        '<button class="btn ' + (phase === 'on_way' ? 'btn-primary' : 'btn-secondary') + '" ' +
          (phase !== 'on_way' && j.status !== 'in_progress' ? 'disabled style="opacity:.5"' : '') +
          (j.status === 'completed' ? ' disabled style="opacity:.5"' : '') +
          ' onclick="crewAdvanceJob(\'completed\')">3 · Complete</button>' +
        '<p class="muted mt-12" style="font-size:11px">Status: ' + phaseLabel + (hint ? ' · ' + hint : '') + '</p>' +
        '<p class="muted mt-8" style="font-size:11px">Tapped wrong status? Ask Owner Al to reset — crew cannot undo.</p>' +
      '</div>';

    body.innerHTML =
      '<div class="between mb-8"><span class="pill ' + pill.cls + '">' + pill.label + '</span><span class="muted">' + j.whenLabel + '</span></div>' +
      '<h1 class="h1" style="font-size:22px">' + j.service + '</h1>' +
      '<p class="sub mb-12">' + j.customerAlias + ' · assigned to you</p>' +
      '<div class="banner private mb-12"><span>◎</span><span>No Send quote · no full inbox. Exact only while you are assignee in the job window.</span></div>' +
      '<div class="section-label" style="margin-top:0">What you can see</div>' +
      '<div class="card field-preview mb-12">' + fields + '</div>' +
      checklist +
      '<div class="section-label">Status history</div>' +
      '<div class="card mb-12"><div class="access-tl">' + renderJobStatusTimeline(j) + '</div></div>' +
      '<div class="banner info mb-12"><span>ℹ</span><span>Read-only timeline. Owner can reset mistaken advances from Business → Jobs.</span></div>' +
      '<p class="muted mt-8" style="font-size:11px;text-align:center">Job ' + j.id + (j.inquiryId ? ' · ' + j.inquiryId : '') + '</p>';
  }

  window.crewAdvanceJob = function (phase) {
    var j = findJob(activeCrewJobId);
    if (!j || j.assigneeId !== 'casey') { toast('Not your job'); return; }
    ensureJobStatusFields(j);
    if (j.status === 'completed') { toast('Already completed · ' + j.id); return; }
    var nowIso = new Date().toISOString();
    j.crewPhase = phase;
    if (phase === 'started') {
      j.status = 'in_progress';
      j.startedAt = nowIso;
      j.onTheWayAt = null;
      j.completedAt = null;
      appendStatusLog(j, 'started', 'casey', 'Casey Nguyen');
      toast('Job started · ' + j.id);
    } else if (phase === 'on_way') {
      j.status = 'in_progress';
      if (!j.startedAt) j.startedAt = nowIso;
      j.onTheWayAt = nowIso;
      j.completedAt = null;
      appendStatusLog(j, 'on_way', 'casey', 'Casey Nguyen');
      toast('On the way · ' + j.id);
    } else if (phase === 'completed') {
      j.status = 'completed';
      j.crewPhase = 'completed';
      if (!j.startedAt) j.startedAt = nowIso;
      j.completedAt = nowIso;
      appendStatusLog(j, 'completed', 'casey', 'Casey Nguyen');
      if (j.inquiryId) {
        var g = findOutgoing(j.inquiryId);
        if (g) {
          g.history.unshift({
            title: 'Job completed by Casey',
            sub: 'Tue Sep 22 · just now · ' + j.id + ' · opaque ref',
            denied: false
          });
        }
      }
      toast('Completed · ' + j.id);
    }
    if (current === 'crew-job-detail') renderCrewJobDetail();
    if (current === 'crew-jobs') renderCrewJobs();
    if (current === 'crew-today') renderCrewToday();
  };

  function renderCrewMe() {
    var body = $('#crew-me-body');
    if (!body) return;
    var n = caseyJobs().length;
    body.innerHTML =
      '<div class="card mb-16 acct-card">' +
        '<div class="row gap-md">' +
          '<div class="avatar lg" style="background:#6a7a55">CN</div>' +
          '<div class="flex-1">' +
            '<div class="strong" style="font-size:17px">Casey Nguyen</div>' +
            '<div class="muted">Crew at Cedar &amp; Stone</div>' +
            '<div class="row mt-8 wrap" style="gap:6px"><span class="pill sage">acct_casey_crew_01</span></div>' +
          '</div>' +
        '</div>' +
        '<button type="button" class="btn btn-primary mt-12" onclick="openAccountSwitcher()">Switch account…</button>' +
      '</div>' +
      '<div class="section-label" style="margin-top:0">Access</div>' +
      '<div class="card mb-12">' +
        '<div class="fact-row"><span class="muted">Org</span><span class="strong" style="font-size:12px">Cedar &amp; Stone</span></div>' +
        '<div class="fact-row"><span class="muted">Role</span><span class="strong" style="font-size:12px">Crew</span></div>' +
        '<div class="fact-row" style="border:none"><span class="muted">Jobs</span><span class="strong" style="font-size:12px">' + n + ' assigned</span></div>' +
      '</div>' +
      '<div class="banner private mb-12"><span>◎</span><span>No inquiry inbox · no all-customers CRM · no finance. Exact address only for jobs assigned to you during the job window.</span></div>' +
      '<div class="banner info"><span>ℹ</span><span>Reassign by Owner removes this job from your list and ends exact access.</span></div>' +
      '<p class="muted mt-16" style="font-size:11px;text-align:center">Platform crew account · prototype</p>';
  }

  // Extend inquiry status labels
  var _inqLabel = inquiryStatusLabel;
  inquiryStatusLabel = function (g) {
    var s = (g && g.inquiryStatus) || 'submitted';
    return ({
      submitted: 'Submitted', needs_info: 'Needs info', quoted: 'Quoted',
      active: 'Active', accepted: 'Accepted', closed: 'Closed'
    })[s] || _inqLabel(g);
  };



  /* ========== Event organizer (personal · W5 · P8/E13/P41/P42/P45) ========== */
  var activeOrgEventId = 'evt_porch_01';
  var activeOrgParticipantId = null;
  var orgEventEditId = null; // null = create
  var orgEventDetailTab = 'requests';
  var orgBcastType = 'schedule';
  var orgPartSeq = 20;

  function orgNowLabel() {
    try {
      return new Date().toLocaleString('en-US', {
        timeZone: 'America/Chicago', month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit'
      }) + ' CT';
    } catch (e) {
      return 'just now CT';
    }
  }

  function orgPushAudit(ev, line) {
    if (!ev.audit) ev.audit = [];
    ev.audit.unshift({ at: orgNowLabel(), line: line });
    if (ev.audit.length > 12) ev.audit.length = 12;
  }

  var orgEvents = [
    {
      id: 'evt_porch_01',
      title: 'East Side Porch Social',
      description: 'Neighborhood porch hang — bring a dish if you like. Quiet after 8. Hosted under Al · Personal (not a business listing).',
      status: 'published',
      startLabel: 'Sat Oct 4 · 5:00 PM CT',
      endLabel: 'Sat Oct 4 · 8:00 PM CT',
      whenShort: 'Sat Oct 4 · 5–8 PM',
      capacity: 40,
      admission: 'open_rsvp',
      venuePolicy: 'approx',
      venueLabel: 'East Cesar Chavez neighborhood · approximate area',
      venueNamed: 'East Side porch garden (public-facing name)',
      venueExact: '1204 E Cesar Chavez St · porch / garden',
      venueVersion: 1,
      venueWindow: 'Confirmed guests · Oct 3 12:00p – Oct 4 10:00p CT',
      listVisibility: 'organizer',
      aliasesAllowed: true,
      ticketingEnabled: false,
      organizerLabel: 'Al · Personal',
      audit: [
        { at: 'Sep 18 · 2:14p CT', line: 'Published · venue policy v1 · approximate area' },
        { at: 'Sep 16 · 11:02a CT', line: 'Draft created · open RSVP · capacity 40' }
      ],
      participants: [
        {
          id: 'op_lantern',
          alias: 'Lantern Guest',
          usesAlias: true,
          state: 'interest',
          venueGrant: 'none',
          history: [
            { at: 'Sep 20 · 6:40p CT', line: 'Interest (not a seat)' }
          ],
          messagesStub: 'Thanks for hosting — hoping to make it.'
        },
        {
          id: 'op_porch',
          alias: 'Porch Neighbor',
          usesAlias: true,
          state: 'pending',
          venueGrant: 'none',
          history: [
            { at: 'Sep 21 · 9:12a CT', line: 'Requested seat (approval policy demo)' },
            { at: 'Sep 21 · 9:10a CT', line: 'Interest' }
          ],
          messagesStub: 'Can I bring +1?'
        },
        {
          id: 'op_cedar',
          alias: 'Cedar Walker',
          usesAlias: true,
          state: 'pending',
          venueGrant: 'none',
          history: [
            { at: 'Sep 21 · 4:02p CT', line: 'Requested seat' }
          ],
          messagesStub: ''
        },
        {
          id: 'op_maya',
          alias: 'Maya Chen',
          usesAlias: false,
          state: 'confirmed',
          venueGrant: 'approx',
          history: [
            { at: 'Sep 19 · 1:20p CT', line: 'Confirmed seat' },
            { at: 'Sep 19 · 1:05p CT', line: 'Interest' }
          ],
          messagesStub: 'See you Saturday.'
        },
        {
          id: 'op_devon',
          alias: 'Garden Alias',
          usesAlias: true,
          state: 'confirmed',
          venueGrant: 'exact',
          history: [
            { at: 'Sep 22 · 10:00a CT', line: 'Exact venue grant · v1 window' },
            { at: 'Sep 18 · 8:30p CT', line: 'Confirmed seat' },
            { at: 'Sep 18 · 8:11p CT', line: 'Interest' }
          ],
          messagesStub: ''
        },
        {
          id: 'op_wait',
          alias: 'Waitlist Willow',
          usesAlias: true,
          state: 'waitlist',
          venueGrant: 'none',
          history: [
            { at: 'Sep 22 · 3:45p CT', line: 'Moved to waitlist' },
            { at: 'Sep 22 · 3:40p CT', line: 'Requested seat' }
          ],
          messagesStub: ''
        },
        {
          id: 'op_check',
          alias: 'Early Bird',
          usesAlias: true,
          state: 'checked_in',
          venueGrant: 'exact',
          history: [
            { at: 'Sep 22 · 5:01p CT', line: 'Checked in (organizer action)' },
            { at: 'Sep 17 · 2:00p CT', line: 'Confirmed seat' }
          ],
          messagesStub: ''
        },
        {
          id: 'op_pending3',
          alias: 'Quiet Guest',
          usesAlias: true,
          state: 'pending',
          venueGrant: 'none',
          history: [
            { at: 'Sep 22 · 7:18p CT', line: 'Requested seat' }
          ],
          messagesStub: ''
        }
      ]
    },
    {
      id: 'evt_draft_02',
      title: 'Lantern Night (draft)',
      description: 'Small invite-only evening — not published. Venue authority still required before exact address.',
      status: 'draft',
      startLabel: 'Fri Oct 17 · 7:00 PM CT',
      endLabel: 'Fri Oct 17 · 10:00 PM CT',
      whenShort: 'Fri Oct 17 · 7–10 PM',
      capacity: 18,
      admission: 'invite_only',
      venuePolicy: 'approx',
      venueLabel: 'East Austin · approximate area',
      venueNamed: '',
      venueExact: '',
      venueVersion: 0,
      venueWindow: '—',
      listVisibility: 'organizer',
      aliasesAllowed: true,
      ticketingEnabled: false,
      organizerLabel: 'Al · Personal',
      audit: [
        { at: 'Sep 21 · 8:05p CT', line: 'Draft saved · invite-only · ticketing off' }
      ],
      participants: []
    },
    {
      id: 'evt_past_03',
      title: 'Spring Block Coffee',
      description: 'Closed neighborhood coffee on the block. Metrics kept honest: interest ≠ attendance.',
      status: 'closed',
      startLabel: 'Sat Apr 12 · 9:00 AM CT',
      endLabel: 'Sat Apr 12 · 11:00 AM CT',
      whenShort: 'Apr 12 · closed',
      capacity: 25,
      admission: 'open_rsvp',
      venuePolicy: 'named_public',
      venueLabel: 'Holly Grove pocket park',
      venueNamed: 'Holly Grove pocket park',
      venueExact: '',
      venueVersion: 1,
      venueWindow: 'Ended · grants expired',
      listVisibility: 'confirmed_counts',
      aliasesAllowed: true,
      ticketingEnabled: false,
      organizerLabel: 'Al · Personal',
      audit: [
        { at: 'Apr 12 · 11:30a CT', line: 'Closed · attended counted from check-in only' }
      ],
      participants: [
        {
          id: 'op_past1',
          alias: 'Block Regular',
          usesAlias: true,
          state: 'checked_in',
          venueGrant: 'none',
          history: [
            { at: 'Apr 12 · 9:05a CT', line: 'Checked in' },
            { at: 'Apr 10 · 2:00p CT', line: 'Confirmed seat' }
          ],
          messagesStub: ''
        },
        {
          id: 'op_past2',
          alias: 'Coffee Alias',
          usesAlias: true,
          state: 'confirmed',
          venueGrant: 'none',
          history: [
            { at: 'Apr 11 · 6:00p CT', line: 'Confirmed · did not check in' }
          ],
          messagesStub: ''
        },
        {
          id: 'op_past3',
          alias: 'Curious Neighbor',
          usesAlias: true,
          state: 'interest',
          venueGrant: 'none',
          history: [
            { at: 'Apr 9 · 12:00p CT', line: 'Interest only · never requested seat' }
          ],
          messagesStub: ''
        }
      ]
    }
  ];

  function findOrgEvent(id) {
    return orgEvents.find(function (e) { return e.id === (id || activeOrgEventId); });
  }

  function findOrgParticipant(ev, pid) {
    if (!ev) return null;
    return (ev.participants || []).find(function (p) { return p.id === pid; });
  }

  function orgStatusPill(status) {
    var map = {
      draft: ['ghost', 'Draft'],
      published: ['sage', 'Published'],
      live: ['ok', 'Live'],
      closed: ['ghost', 'Closed'],
      cancelled: ['danger', 'Cancelled']
    };
    var m = map[status] || ['ghost', status];
    return '<span class="pill ' + m[0] + '">' + m[1] + '</span>';
  }

  function orgStateLabel(state) {
    return ({
      interest: 'Interest',
      pending: 'Pending approval',
      confirmed: 'Confirmed seat',
      waitlist: 'Waitlist',
      checked_in: 'Checked in',
      declined: 'Declined',
      cancelled: 'Cancelled'
    })[state] || state;
  }

  function orgStatePill(state) {
    var cls = ({
      interest: 'ghost', pending: 'warn', confirmed: 'sage', waitlist: 'ghost',
      checked_in: 'ok', declined: 'danger', cancelled: 'danger'
    })[state] || 'ghost';
    return '<span class="pill ' + cls + '">' + orgStateLabel(state) + '</span>';
  }

  function orgAdmissionLabel(a) {
    return ({ open_rsvp: 'Open RSVP', approval: 'Approval required', invite_only: 'Invite only' })[a] || a;
  }

  function orgVenuePolicyLabel(v) {
    return ({
      approx: 'Approximate area only',
      named_public: 'Named public venue',
      exact: 'Exact address'
    })[v] || v;
  }

  function orgCount(ev, states) {
    var set = {};
    (states || []).forEach(function (s) { set[s] = 1; });
    return (ev.participants || []).filter(function (p) { return set[p.state]; }).length;
  }

  function orgMetrics(ev) {
    var interested = orgCount(ev, ['interest', 'pending', 'confirmed', 'waitlist', 'checked_in']);
    var requested = orgCount(ev, ['pending', 'confirmed', 'waitlist', 'checked_in']);
    var confirmed = orgCount(ev, ['confirmed', 'checked_in']);
    var waitlist = orgCount(ev, ['waitlist']);
    var attended = orgCount(ev, ['checked_in']);
    var interestOnly = orgCount(ev, ['interest']);
    var pending = orgCount(ev, ['pending']);
    var seatsTaken = confirmed;
    var remaining = Math.max(0, (ev.capacity || 0) - seatsTaken);
    return {
      interested: interested,
      interestOnly: interestOnly,
      requested: requested,
      pending: pending,
      confirmed: confirmed,
      waitlist: waitlist,
      attended: attended,
      remaining: remaining,
      capacity: ev.capacity || 0
    };
  }

  function updateOrgEventsSummaries() {
    var open = orgEvents.filter(function (e) {
      return e.status === 'published' || e.status === 'live' || e.status === 'draft';
    }).length;
    var meta = $('#you-org-events-meta');
    if (meta) meta.textContent = open + ' open';
  }

  function orgRsvpInterestFromExplore() {
    var ev = findOrgEvent('evt_porch_01');
    if (!ev) return false;
    var existing = (ev.participants || []).find(function (p) { return p.id === 'op_explore_self'; });
    if (existing) return false;
    ev.participants.unshift({
      id: 'op_explore_self',
      alias: 'You (Explore demo)',
      usesAlias: true,
      state: 'interest',
      venueGrant: 'none',
      history: [{ at: orgNowLabel(), line: 'Interest via Explore event page · not a seat' }],
      messagesStub: ''
    });
    orgPushAudit(ev, 'Interest added from Explore attendee page (demo sync)');
    updateOrgEventsSummaries();
    return true;
  }

  window.openOrgEvent = function (id) {
    activeOrgEventId = id || activeOrgEventId;
    orgEventDetailTab = 'requests';
    go('org-event-detail');
  };

  window.startOrgEventCreate = function () {
    orgEventEditId = null;
    go('org-event-edit');
  };

  window.startOrgEventEdit = function () {
    orgEventEditId = activeOrgEventId;
    go('org-event-edit');
  };

  window.openOrgParticipant = function (pid) {
    activeOrgParticipantId = pid;
    go('org-event-participant');
  };

  window.setOrgDetailTab = function (tab) {
    orgEventDetailTab = tab;
    renderOrgEventDetail();
  };

  function renderOrgEventsHub() {
    var root = $('#org-events-body');
    if (!root) return;
    updateOrgEventsSummaries();
    var strip = orgEvents.reduce(function (acc, ev) {
      if (ev.status === 'cancelled' || ev.status === 'closed') return acc;
      var m = orgMetrics(ev);
      acc.interested += m.interestOnly;
      acc.confirmed += m.confirmed;
      acc.waitlist += m.waitlist;
      acc.remaining += m.remaining;
      return acc;
    }, { interested: 0, confirmed: 0, waitlist: 0, remaining: 0 });

    var cards = orgEvents.map(function (ev) {
      var m = orgMetrics(ev);
      return (
        '<div class="card tap mb-10" onclick="openOrgEvent(\'' + ev.id + '\')">' +
          '<div class="between mb-8">' + orgStatusPill(ev.status) +
            '<span class="muted">' + ev.whenShort + '</span></div>' +
          '<div class="strong" style="font-size:15px">' + ev.title + '</div>' +
          '<p class="sub mt-8">' + orgAdmissionLabel(ev.admission) + ' · cap ' + ev.capacity +
            ' · ' + m.confirmed + ' confirmed · ' + m.remaining + ' seats left</p>' +
          '<div class="row wrap mt-8" style="gap:6px">' +
            '<span class="pill ghost">Interest ' + m.interestOnly + '</span>' +
            '<span class="pill warn">Pending ' + m.pending + '</span>' +
            '<span class="pill sage">Confirmed ' + m.confirmed + '</span>' +
            '<span class="pill ghost">Waitlist ' + m.waitlist + '</span>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    root.innerHTML =
      '<div class="banner private mb-12"><span>◎</span><span><strong>Personal organizer.</strong> Not a business or crew account. Paid ticketing is <strong>off</strong> unless you enable it (disabled in this demo).</span></div>' +
      '<div class="stat-row mb-16">' +
        '<div class="stat"><div class="n">' + strip.interested + '</div><div class="l">Interest only</div></div>' +
        '<div class="stat"><div class="n">' + strip.confirmed + '</div><div class="l">Confirmed</div></div>' +
        '<div class="stat"><div class="n">' + strip.waitlist + '</div><div class="l">Waitlist</div></div>' +
        '<div class="stat"><div class="n">' + strip.remaining + '</div><div class="l">Seats left</div></div>' +
      '</div>' +
      '<div class="banner info mb-12"><span>ℹ</span><span><strong>Honest counts (P45):</strong> Interest ≠ Request ≠ Confirmed seat ≠ Waitlist ≠ Checked-in. Interest is not a seat.</span></div>' +
      '<button class="btn btn-primary mb-16" onclick="startOrgEventCreate()">Create event</button>' +
      '<div class="section-label" style="margin-top:0">Your events</div>' +
      cards +
      '<p class="muted mt-12" style="font-size:11px;text-align:center;line-height:1.45">Venue publication needs separate authority — seeing a friend’s home (or your Places home) does not authorize a public event venue.</p>';
  }

  function renderOrgEventEdit() {
    var root = $('#org-event-edit-body');
    var titleEl = $('#org-edit-title');
    if (!root) return;
    var ev = orgEventEditId ? findOrgEvent(orgEventEditId) : null;
    if (titleEl) titleEl.textContent = ev ? 'Edit event' : 'Create event';
    var t = ev ? ev.title : '';
    var d = ev ? ev.description : '';
    var start = ev ? ev.startLabel : 'Sat Oct 25 · 4:00 PM CT';
    var end = ev ? ev.endLabel : 'Sat Oct 25 · 7:00 PM CT';
    var cap = ev ? ev.capacity : 30;
    var adm = ev ? ev.admission : 'open_rsvp';
    var vp = ev ? ev.venuePolicy : 'approx';
    var lv = ev ? ev.listVisibility : 'organizer';
    var al = ev ? !!ev.aliasesAllowed : true;

    function opt(val, cur, label) {
      return '<option value="' + val + '"' + (val === cur ? ' selected' : '') + '>' + label + '</option>';
    }

    root.innerHTML =
      '<div class="banner gated mb-12"><span>⬚</span><span>Prototype form · America/Chicago times · ticketing remains <strong>disabled</strong>.</span></div>' +
      '<div class="field mb-10"><label for="org-f-title">Title</label><input id="org-f-title" value="' + t.replace(/"/g, '&quot;') + '" /></div>' +
      '<div class="field mb-10"><label for="org-f-desc">Description</label><textarea id="org-f-desc" rows="3">' + d + '</textarea></div>' +
      '<div class="field-row mb-10">' +
        '<div class="field"><label for="org-f-start">Start (CT)</label><input id="org-f-start" value="' + start.replace(/"/g, '&quot;') + '" /></div>' +
        '<div class="field"><label for="org-f-end">End (CT)</label><input id="org-f-end" value="' + end.replace(/"/g, '&quot;') + '" /></div>' +
      '</div>' +
      '<div class="field mb-10"><label for="org-f-cap">Capacity</label><input id="org-f-cap" type="number" min="1" value="' + cap + '" /></div>' +
      '<div class="field mb-12"><label for="org-f-adm">Admission policy</label><select id="org-f-adm">' +
        opt('open_rsvp', adm, 'Open RSVP') +
        opt('approval', adm, 'Approval required') +
        opt('invite_only', adm, 'Invite only') +
      '</select></div>' +
      '<div class="section-label">Venue policy</div>' +
      '<div class="banner warn mb-10"><span>⚠</span><span><strong>Authority:</strong> Being able to see a friend’s home — or your own home in Places — does <strong>not</strong> authorize publishing it as a public event venue. Exact address requires separate venue-release + versioned disclosure.</span></div>' +
      '<div class="vis-option' + (vp === 'approx' ? ' selected' : '') + '" data-vp="approx" onclick="pickOrgVenuePolicy(this)">' +
        '<div class="v-title">Approximate area only</div>' +
        '<div class="v-desc">Default. Public / guests see neighborhood blob — no street or pin.</div></div>' +
      '<div class="vis-option' + (vp === 'named_public' ? ' selected' : '') + '" data-vp="named_public" onclick="pickOrgVenuePolicy(this)">' +
        '<div class="v-title">Named public venue</div>' +
        '<div class="v-desc">Park, café, or other public place name — still not a private home pin.</div></div>' +
      '<div class="vis-option' + (vp === 'exact' ? ' selected' : '') + '" data-vp="exact" onclick="pickOrgVenuePolicy(this)">' +
        '<div class="v-title">Exact address</div>' +
        '<div class="v-desc">Only with venue-release authority. Disclosed to eligible confirmed participants in a time window.</div></div>' +
      '<input type="hidden" id="org-f-venue" value="' + vp + '" />' +
      '<div class="section-label">Participant list visibility</div>' +
      '<div class="field mb-12"><label for="org-f-list">Who sees the list</label><select id="org-f-list">' +
        opt('organizer', lv, 'Organizer only') +
        opt('confirmed_counts', lv, 'Confirmed-visible counts') +
      '</select></div>' +
      '<div class="section-label">Aliases (P41)</div>' +
      '<div class="card mb-12">' +
        '<div class="between"><div><div class="strong" style="font-size:14px">Allow event aliases</div>' +
        '<p class="sub mt-8">Attendees may join under an event alias. You see permitted context profiles — not private alias→root-handle maps.</p></div>' +
        '<button type="button" class="pill ' + (al ? 'sage' : 'ghost') + '" id="org-f-alias-btn" onclick="toggleOrgAliasPolicy()">' + (al ? 'On' : 'Off') + '</button></div>' +
        '<input type="hidden" id="org-f-alias" value="' + (al ? '1' : '0') + '" />' +
      '</div>' +
      '<div class="banner gated mb-16"><span>⬚</span><span>Paid ticketing · <strong>not enabled</strong> · disabled in this prototype.</span></div>' +
      '<div class="btn-row mb-8">' +
        '<button class="btn btn-secondary" onclick="saveOrgEvent(false)">Save draft</button>' +
        '<button class="btn btn-primary" onclick="saveOrgEvent(true)">Publish</button>' +
      '</div>' +
      '<p class="muted" style="font-size:11px;text-align:center">Publish writes a versioned venue policy. Demo only.</p>';
  }

  window.pickOrgVenuePolicy = function (el) {
    $all('.vis-option[data-vp]').forEach(function (n) { n.classList.remove('selected'); });
    el.classList.add('selected');
    var inp = $('#org-f-venue');
    if (inp) inp.value = el.getAttribute('data-vp');
  };

  window.toggleOrgAliasPolicy = function () {
    var inp = $('#org-f-alias');
    var btn = $('#org-f-alias-btn');
    if (!inp || !btn) return;
    var on = inp.value !== '1';
    inp.value = on ? '1' : '0';
    btn.textContent = on ? 'On' : 'Off';
    btn.className = 'pill ' + (on ? 'sage' : 'ghost');
  };

  window.saveOrgEvent = function (publish) {
    var title = ($('#org-f-title') && $('#org-f-title').value.trim()) || 'Untitled event';
    var desc = ($('#org-f-desc') && $('#org-f-desc').value.trim()) || '';
    var start = ($('#org-f-start') && $('#org-f-start').value.trim()) || '';
    var end = ($('#org-f-end') && $('#org-f-end').value.trim()) || '';
    var cap = parseInt(($('#org-f-cap') && $('#org-f-cap').value) || '30', 10) || 30;
    var adm = ($('#org-f-adm') && $('#org-f-adm').value) || 'open_rsvp';
    var vp = ($('#org-f-venue') && $('#org-f-venue').value) || 'approx';
    var lv = ($('#org-f-list') && $('#org-f-list').value) || 'organizer';
    var al = ($('#org-f-alias') && $('#org-f-alias').value) === '1';
    var whenShort = start.replace(' CT', '').replace(' · ', ' · ');

    var ev;
    if (orgEventEditId) {
      ev = findOrgEvent(orgEventEditId);
    }
    if (!ev) {
      orgPartSeq += 1;
      ev = {
        id: 'evt_new_' + orgPartSeq,
        participants: [],
        audit: [],
        venueExact: '',
        venueNamed: '',
        venueVersion: 0,
        venueWindow: '—',
        ticketingEnabled: false,
        organizerLabel: 'Al · Personal'
      };
      orgEvents.unshift(ev);
      orgEventEditId = ev.id;
    }
    ev.title = title;
    ev.description = desc;
    ev.startLabel = start;
    ev.endLabel = end;
    ev.whenShort = whenShort || start;
    ev.capacity = cap;
    ev.admission = adm;
    ev.venuePolicy = vp;
    ev.listVisibility = lv;
    ev.aliasesAllowed = al;
    ev.venueLabel = vp === 'exact' ? (ev.venueExact || 'Exact address · authority required')
      : vp === 'named_public' ? (ev.venueNamed || 'Named public venue')
      : 'Approximate area only';
    if (publish) {
      if (ev.status !== 'live' && ev.status !== 'closed' && ev.status !== 'cancelled') {
        ev.status = 'published';
      }
      if (!ev.venueVersion) ev.venueVersion = 1;
      if (vp === 'exact') {
        ev.venueWindow = ev.venueWindow && ev.venueWindow !== '—'
          ? ev.venueWindow
          : 'Confirmed guests · disclosure window set at publish';
      }
      orgPushAudit(ev, 'Published · venue policy v' + ev.venueVersion + ' · ' + orgVenuePolicyLabel(vp));
      toast('Published · ticketing still off');
    } else {
      if (ev.status !== 'published' && ev.status !== 'live' && ev.status !== 'closed' && ev.status !== 'cancelled') {
        ev.status = 'draft';
      }
      orgPushAudit(ev, 'Draft saved');
      toast('Draft saved');
    }
    activeOrgEventId = ev.id;
    updateOrgEventsSummaries();
    go('org-event-detail');
  };

  function renderOrgEventDetail() {
    var root = $('#org-event-detail-body');
    if (!root) return;
    var ev = findOrgEvent(activeOrgEventId);
    if (!ev) {
      root.innerHTML = '<div class="pad"><p class="sub">Event not found.</p></div>';
      return;
    }
    var m = orgMetrics(ev);
    var tabs = [
      ['requests', 'RSVPs'],
      ['aliases', 'Aliases'],
      ['comms', 'Comms'],
      ['checkin', 'Check-in'],
      ['venue', 'Venue'],
      ['metrics', 'Metrics']
    ];
    var tabHtml = '<div class="seg-tabs mb-0">' + tabs.map(function (t) {
      return '<button type="button" class="' + (orgEventDetailTab === t[0] ? 'on' : '') + '" onclick="setOrgDetailTab(\'' + t[0] + '\')">' + t[1] + '</button>';
    }).join('') + '</div>';

    var body = '';
    if (orgEventDetailTab === 'requests') body = renderOrgRequestsTab(ev);
    else if (orgEventDetailTab === 'aliases') body = renderOrgAliasesTab(ev);
    else if (orgEventDetailTab === 'comms') body = renderOrgCommsTab(ev);
    else if (orgEventDetailTab === 'checkin') body = renderOrgCheckinTab(ev);
    else if (orgEventDetailTab === 'venue') body = renderOrgVenueTab(ev);
    else body = renderOrgMetricsTab(ev, m);

    var actions = '';
    if (ev.status !== 'cancelled' && ev.status !== 'closed') {
      actions =
        '<div class="section-label">Actions</div>' +
        '<div class="stack gap-sm mb-16">' +
          '<div class="card tap" onclick="openOrgBroadcastSheet()"><div class="between"><span class="strong">Broadcast update</span><span>›</span></div></div>' +
          '<div class="card tap" onclick="orgCloseEvent()"><div class="between"><span class="strong">Close event</span><span class="muted">ends ops</span></div></div>' +
          '<div class="card tap" onclick="openOrgCancelSheet()"><div class="between"><span class="strong" style="color:var(--danger)">Cancel event</span><span class="muted">revokes venue</span></div></div>' +
        '</div>';
    }

    root.innerHTML =
      '<div class="pad pb-0">' +
        '<div class="between mb-8">' + orgStatusPill(ev.status) +
          '<span class="pill ghost">Ticketing off</span></div>' +
        '<h1 class="h1" style="font-size:22px;margin-bottom:6px">' + ev.title + '</h1>' +
        '<p class="sub mb-12">' + ev.startLabel + ' → ' + ev.endLabel + '</p>' +
        '<div class="card mb-12">' +
          '<div class="fact-row"><span class="muted">Capacity</span><span class="strong" style="font-size:13px">' + m.confirmed + ' / ' + m.capacity + ' · ' + m.remaining + ' left</span></div>' +
          '<div class="fact-row"><span class="muted">Admission</span><span class="strong" style="font-size:13px">' + orgAdmissionLabel(ev.admission) + '</span></div>' +
          '<div class="fact-row"><span class="muted">Venue policy</span><span class="strong" style="font-size:12px">' + orgVenuePolicyLabel(ev.venuePolicy) + ' · v' + (ev.venueVersion || 0) + '</span></div>' +
          '<div class="fact-row" style="border:none"><span class="muted">Organizer</span><span class="strong" style="font-size:13px">' + ev.organizerLabel + '</span></div>' +
        '</div>' +
        '<div class="banner info mb-12"><span>ℹ</span><span>Interest ≠ seat. Check-in requires organizer action — opening Map never marks attendance.</span></div>' +
      '</div>' +
      tabHtml +
      '<div class="pad pt-12">' + body + actions +
        (ev.audit && ev.audit.length ? (
          '<div class="section-label">Audit</div><div class="card mb-8">' +
          ev.audit.slice(0, 5).map(function (a, i, arr) {
            return '<div class="fact-row"' + (i === arr.length - 1 ? ' style="border:none"' : '') + '>' +
              '<span class="muted" style="font-size:11px">' + a.at + '</span>' +
              '<span class="strong" style="font-size:12px;text-align:right;max-width:62%">' + a.line + '</span></div>';
          }).join('') + '</div>'
        ) : '') +
        '<p class="muted mb-16" style="font-size:11px;text-align:center"><button class="btn btn-ghost btn-sm" style="width:auto" onclick="openPublicEventGuest()">Preview as guest</button></p>' +
      '</div>';
  }

  function orgParticipantRow(ev, p, actionsHtml) {
    return (
      '<div class="card mb-8">' +
        '<div class="between mb-8">' +
          '<div class="row gap-md" style="cursor:pointer" onclick="openOrgParticipant(\'' + p.id + '\')">' +
            '<div class="avatar sm">' + (p.alias || '?').slice(0, 2).toUpperCase() + '</div>' +
            '<div><div class="strong" style="font-size:14px">' + p.alias +
              (p.usesAlias ? ' <span class="muted" style="font-weight:500">· alias</span>' : '') +
            '</div><div class="muted" style="font-size:11px">Venue grant · ' + (p.venueGrant || 'none') + '</div></div>' +
          '</div>' +
          orgStatePill(p.state) +
        '</div>' +
        (actionsHtml || '') +
      '</div>'
    );
  }

  function renderOrgRequestsTab(ev) {
    var groups = [
      ['interest', 'Interest (not seats)'],
      ['pending', 'Pending approval'],
      ['confirmed', 'Confirmed seats'],
      ['waitlist', 'Waitlist'],
      ['checked_in', 'Checked in'],
      ['declined', 'Declined / cancelled']
    ];
    var html = '<div class="banner private mb-12"><span>◎</span><span>States are distinct. Approving creates a seat; Interest alone never does.</span></div>';
    groups.forEach(function (g) {
      var list = (ev.participants || []).filter(function (p) {
        if (g[0] === 'declined') return p.state === 'declined' || p.state === 'cancelled';
        return p.state === g[0];
      });
      if (!list.length && g[0] !== 'interest' && g[0] !== 'pending' && g[0] !== 'confirmed' && g[0] !== 'waitlist') return;
      html += '<div class="section-label">' + g[1] + ' · ' + list.length + '</div>';
      if (!list.length) {
        html += '<p class="muted mb-12" style="font-size:12px">None</p>';
        return;
      }
      list.forEach(function (p) {
        var acts = '';
        if (ev.status === 'cancelled' || ev.status === 'closed') {
          acts = '';
        } else if (p.state === 'interest') {
          acts = '<div class="btn-row">' +
            '<button class="btn btn-secondary btn-sm" onclick="orgSetParticipantState(\'' + p.id + '\',\'pending\')">Request seat</button>' +
            '<button class="btn btn-primary btn-sm" onclick="orgSetParticipantState(\'' + p.id + '\',\'confirmed\')">Confirm seat</button>' +
            '</div>';
        } else if (p.state === 'pending') {
          acts = '<div class="btn-row">' +
            '<button class="btn btn-primary btn-sm" onclick="orgSetParticipantState(\'' + p.id + '\',\'confirmed\')">Approve</button>' +
            '<button class="btn btn-secondary btn-sm" onclick="orgSetParticipantState(\'' + p.id + '\',\'waitlist\')">Waitlist</button>' +
            '<button class="btn btn-ghost btn-sm" onclick="orgSetParticipantState(\'' + p.id + '\',\'declined\')">Decline</button>' +
            '</div>';
        } else if (p.state === 'waitlist') {
          acts = '<div class="btn-row">' +
            '<button class="btn btn-primary btn-sm" onclick="orgSetParticipantState(\'' + p.id + '\',\'confirmed\')">Promote</button>' +
            '<button class="btn btn-ghost btn-sm" onclick="orgSetParticipantState(\'' + p.id + '\',\'declined\')">Decline</button>' +
            '</div>';
        } else if (p.state === 'confirmed') {
          acts = '<div class="btn-row">' +
            '<button class="btn btn-secondary btn-sm" onclick="orgCheckIn(\'' + p.id + '\')">Check in</button>' +
            '<button class="btn btn-ghost btn-sm" onclick="orgSetParticipantState(\'' + p.id + '\',\'cancelled\')">Cancel seat</button>' +
            '</div>';
        }
        html += orgParticipantRow(ev, p, acts);
      });
    });
    return html;
  }

  function renderOrgAliasesTab(ev) {
    var html =
      '<div class="banner private mb-12"><span>◎</span><span><strong>P41:</strong> Display aliases only. Organizers never see private alias→root-handle maps. No @root-handle leak for alias participants.</span></div>' +
      '<p class="sub mb-12">Aliases allowed: <strong>' + (ev.aliasesAllowed ? 'Yes' : 'No') + '</strong></p>';
    var aliased = (ev.participants || []).filter(function (p) { return p.usesAlias; });
    var plain = (ev.participants || []).filter(function (p) { return !p.usesAlias; });
    html += '<div class="section-label">Event aliases</div>';
    if (!aliased.length) html += '<p class="muted mb-12">No alias participants yet.</p>';
    aliased.forEach(function (p) {
      html +=
        '<div class="card mb-8 tap" onclick="openOrgParticipant(\'' + p.id + '\')">' +
          '<div class="between"><div><div class="strong">' + p.alias + '</div>' +
          '<div class="muted mt-8" style="font-size:11px">Context profile · root handle hidden</div></div>' +
          orgStatePill(p.state) + '</div></div>';
    });
    html += '<div class="section-label">Display names (no alias)</div>';
    if (!plain.length) html += '<p class="muted mb-12">None</p>';
    plain.forEach(function (p) {
      html +=
        '<div class="card mb-8 tap" onclick="openOrgParticipant(\'' + p.id + '\')">' +
          '<div class="between"><div class="strong">' + p.alias + '</div>' + orgStatePill(p.state) + '</div></div>';
    });
    return html;
  }

  function renderOrgCommsTab(ev) {
    return (
      '<div class="banner info mb-12"><span>ℹ</span><span>Broadcasts are demo toasts + audit lines — no real push or email.</span></div>' +
      '<button class="btn btn-primary mb-16" onclick="openOrgBroadcastSheet()">Broadcast update</button>' +
      '<div class="section-label">Recent audit</div>' +
      '<div class="card">' +
      (ev.audit || []).slice(0, 6).map(function (a, i, arr) {
        return '<div class="fact-row"' + (i === arr.length - 1 ? ' style="border:none"' : '') + '>' +
          '<span class="muted" style="font-size:11px">' + a.at + '</span>' +
          '<span class="strong" style="font-size:12px;text-align:right;max-width:62%">' + a.line + '</span></div>';
      }).join('') + '</div>'
    );
  }

  function renderOrgCheckinTab(ev) {
    var confirmed = (ev.participants || []).filter(function (p) {
      return p.state === 'confirmed' || p.state === 'checked_in';
    });
    var attended = orgCount(ev, ['checked_in']);
    var html =
      '<div class="banner warn mb-12"><span>⚠</span><span><strong>Check-in requires organizer action</strong> (or authorized evidence). Opening the Map or event page never marks attended.</span></div>' +
      '<div class="stat-row mb-16">' +
        '<div class="stat"><div class="n">' + confirmed.length + '</div><div class="l">Eligible</div></div>' +
        '<div class="stat"><div class="n">' + attended + '</div><div class="l">Attended</div></div>' +
        '<div class="stat"><div class="n">' + (confirmed.length - attended) + '</div><div class="l">Not in yet</div></div>' +
      '</div>' +
      '<div class="section-label">Confirmed roster</div>';
    if (!confirmed.length) html += '<p class="muted">No confirmed seats yet.</p>';
    confirmed.forEach(function (p) {
      var acts = '';
      if (p.state === 'confirmed' && ev.status !== 'cancelled' && ev.status !== 'closed') {
        acts = '<button class="btn btn-primary btn-sm mt-8" style="width:auto" onclick="orgCheckIn(\'' + p.id + '\')">Check in</button>';
      } else if (p.state === 'checked_in') {
        acts = '<p class="muted mt-8" style="font-size:11px">Checked in · counted in attended (≠ interest)</p>';
      }
      html += orgParticipantRow(ev, p, acts);
    });
    return html;
  }

  function renderOrgVenueTab(ev) {
    var exactHolders = (ev.participants || []).filter(function (p) {
      return p.venueGrant === 'exact' && (p.state === 'confirmed' || p.state === 'checked_in');
    });
    return (
      '<div class="banner warn mb-12"><span>⚠</span><span><strong>Venue publication authority</strong> is separate from Places visibility or friend home access. Exact pin only to eligible confirmed participants during the disclosure window.</span></div>' +
      '<div class="card mb-12">' +
        '<div class="fact-row"><span class="muted">Policy</span><span class="strong" style="font-size:12px">' + orgVenuePolicyLabel(ev.venuePolicy) + '</span></div>' +
        '<div class="fact-row"><span class="muted">Version</span><span class="strong" style="font-size:13px">v' + (ev.venueVersion || 0) + '</span></div>' +
        '<div class="fact-row"><span class="muted">Window</span><span class="strong" style="font-size:12px;text-align:right;max-width:58%">' + (ev.venueWindow || '—') + '</span></div>' +
        '<div class="fact-row" style="border:none"><span class="muted">Public sees</span><span class="strong" style="font-size:12px;text-align:right;max-width:58%">' + (ev.venueLabel || 'Approximate area') + '</span></div>' +
      '</div>' +
      '<div class="section-label">Exact access holders</div>' +
      (exactHolders.length
        ? exactHolders.map(function (p) {
            return '<div class="card mb-8"><div class="between"><span class="strong">' + p.alias + (p.usesAlias ? ' · alias' : '') + '</span><span class="pill sage">Exact · v' + ev.venueVersion + '</span></div></div>';
          }).join('')
        : '<p class="muted mb-12" style="font-size:12px">None — approx / named only until you grant exact in-window.</p>') +
      '<div class="btn-row mb-8">' +
        '<button class="btn btn-secondary" onclick="orgBumpVenueVersion()">Bump version</button>' +
        '<button class="btn btn-ghost" onclick="orgRevokeVenueGrants()">Revoke exact</button>' +
      '</div>' +
      '<p class="muted" style="font-size:11px;line-height:1.45">Cancel/revoke ends <em>future</em> exact access. Attendee home/device location is never published via interest, RSVP, or check-in.</p>'
    );
  }

  function renderOrgMetricsTab(ev, m) {
    return (
      '<div class="banner info mb-12"><span>ℹ</span><span><strong>P45 honest ops:</strong> interested ≠ confirmed ≠ attended. Interest ≠ attendance.</span></div>' +
      '<div class="card mb-12">' +
        '<div class="fact-row"><span class="muted">Interested (any signal)</span><span class="strong">' + m.interested + '</span></div>' +
        '<div class="fact-row"><span class="muted">Interest only</span><span class="strong">' + m.interestOnly + '</span></div>' +
        '<div class="fact-row"><span class="muted">Requested (pending+)</span><span class="strong">' + m.requested + '</span></div>' +
        '<div class="fact-row"><span class="muted">Pending approval</span><span class="strong">' + m.pending + '</span></div>' +
        '<div class="fact-row"><span class="muted">Confirmed seats</span><span class="strong">' + m.confirmed + '</span></div>' +
        '<div class="fact-row"><span class="muted">Waitlist</span><span class="strong">' + m.waitlist + '</span></div>' +
        '<div class="fact-row"><span class="muted">Attended (check-in)</span><span class="strong">' + m.attended + '</span></div>' +
        '<div class="fact-row" style="border:none"><span class="muted">Capacity remaining</span><span class="strong">' + m.remaining + ' / ' + m.capacity + '</span></div>' +
      '</div>' +
      '<p class="muted" style="font-size:11px;line-height:1.45">Sources: participant state machine on this event. Map opens and Explore views are not attendance.</p>'
    );
  }

  window.orgSetParticipantState = function (pid, state) {
    var ev = findOrgEvent(activeOrgEventId);
    var p = findOrgParticipant(ev, pid);
    if (!ev || !p) return;
    var prev = p.state;
    if (state === 'confirmed') {
      var m = orgMetrics(ev);
      var seats = m.confirmed - (prev === 'confirmed' || prev === 'checked_in' ? 1 : 0);
      if (seats >= ev.capacity) {
        toast('At capacity · use waitlist');
        return;
      }
      if (p.venueGrant === 'none' && ev.venuePolicy !== 'exact') p.venueGrant = 'approx';
    }
    p.state = state;
    if (!p.history) p.history = [];
    p.history.unshift({ at: orgNowLabel(), line: orgStateLabel(state) + ' (was ' + orgStateLabel(prev) + ')' });
    orgPushAudit(ev, p.alias + ' → ' + orgStateLabel(state));
    toast(p.alias + ' · ' + orgStateLabel(state));
    renderOrgEventDetail();
  };

  window.orgCheckIn = function (pid) {
    var ev = findOrgEvent(activeOrgEventId);
    var p = findOrgParticipant(ev, pid);
    if (!ev || !p) return;
    if (p.state !== 'confirmed' && p.state !== 'checked_in') {
      toast('Only confirmed seats can check in');
      return;
    }
    if (p.state === 'checked_in') {
      toast('Already checked in');
      return;
    }
    p.state = 'checked_in';
    if (!p.history) p.history = [];
    p.history.unshift({ at: orgNowLabel(), line: 'Checked in (organizer action)' });
    orgPushAudit(ev, 'Check-in · ' + p.alias + ' · attended +1');
    toast('Checked in · attended counted separately');
    renderOrgEventDetail();
  };

  window.orgBumpVenueVersion = function () {
    var ev = findOrgEvent(activeOrgEventId);
    if (!ev) return;
    ev.venueVersion = (ev.venueVersion || 0) + 1;
    (ev.participants || []).forEach(function (p) {
      if (p.venueGrant === 'exact') p.venueGrant = 'approx';
    });
    orgPushAudit(ev, 'Venue policy bumped to v' + ev.venueVersion + ' · prior exact grants reset to approx');
    toast('Venue v' + ev.venueVersion + ' · prior exact revoked');
    renderOrgEventDetail();
  };

  window.orgRevokeVenueGrants = function () {
    var ev = findOrgEvent(activeOrgEventId);
    if (!ev) return;
    var n = 0;
    (ev.participants || []).forEach(function (p) {
      if (p.venueGrant === 'exact') {
        p.venueGrant = 'approx';
        n += 1;
        if (!p.history) p.history = [];
        p.history.unshift({ at: orgNowLabel(), line: 'Exact venue grant revoked · future access ended' });
      }
    });
    orgPushAudit(ev, 'Revoked exact venue grants (' + n + ') · future access ended');
    toast('Exact grants revoked · ' + n);
    renderOrgEventDetail();
  };

  window.orgCloseEvent = function () {
    var ev = findOrgEvent(activeOrgEventId);
    if (!ev) return;
    ev.status = 'closed';
    orgPushAudit(ev, 'Event closed · check-in frozen · metrics retained');
    toast('Event closed');
    updateOrgEventsSummaries();
    renderOrgEventDetail();
  };

  window.openOrgBroadcastSheet = function () {
    orgBcastType = 'schedule';
    $all('#org-bcast-type-chips .purpose-chip').forEach(function (c) {
      c.classList.toggle('on', c.getAttribute('data-bcast') === 'schedule');
    });
    var bd = $('#org-broadcast-backdrop');
    var sh = $('#org-broadcast-sheet');
    if (bd) bd.classList.add('show');
    if (sh) sh.classList.add('show');
  };

  window.closeOrgBroadcastSheet = function () {
    var bd = $('#org-broadcast-backdrop');
    var sh = $('#org-broadcast-sheet');
    if (bd) bd.classList.remove('show');
    if (sh) sh.classList.remove('show');
  };

  window.pickOrgBcast = function (el) {
    orgBcastType = el.getAttribute('data-bcast') || 'general';
    $all('#org-bcast-type-chips .purpose-chip').forEach(function (c) { c.classList.remove('on'); });
    el.classList.add('on');
  };

  window.confirmOrgBroadcast = function () {
    var ev = findOrgEvent(activeOrgEventId);
    if (!ev) return;
    var msg = ($('#org-bcast-msg') && $('#org-bcast-msg').value.trim()) || '(empty)';
    var kind = ({ schedule: 'Schedule change', venue: 'Venue version', general: 'General note' })[orgBcastType] || 'Update';
    if (orgBcastType === 'venue') {
      ev.venueVersion = (ev.venueVersion || 0) + 1;
    }
    orgPushAudit(ev, 'Broadcast · ' + kind + ' · “' + msg.slice(0, 48) + (msg.length > 48 ? '…' : '') + '”');
    closeOrgBroadcastSheet();
    toast('Broadcast sent (demo) · audit logged');
    if (current === 'org-event-detail') renderOrgEventDetail();
  };

  window.openOrgCancelSheet = function () {
    var ev = findOrgEvent(activeOrgEventId);
    var body = $('#org-cancel-body');
    if (body && ev) {
      body.textContent = 'Cancel “' + ev.title + '”? Future exact-venue grants end. Screenshots already taken cannot be recalled.';
    }
    var bd = $('#org-cancel-backdrop');
    var sh = $('#org-cancel-sheet');
    if (bd) bd.classList.add('show');
    if (sh) sh.classList.add('show');
  };

  window.closeOrgCancelSheet = function () {
    var bd = $('#org-cancel-backdrop');
    var sh = $('#org-cancel-sheet');
    if (bd) bd.classList.remove('show');
    if (sh) sh.classList.remove('show');
  };

  window.confirmOrgCancel = function () {
    var ev = findOrgEvent(activeOrgEventId);
    if (!ev) return;
    ev.status = 'cancelled';
    (ev.participants || []).forEach(function (p) {
      if (p.venueGrant === 'exact') p.venueGrant = 'none';
      if (p.state === 'confirmed' || p.state === 'pending' || p.state === 'waitlist' || p.state === 'interest') {
        // leave historical states; mark cancelled seats
        if (p.state === 'confirmed' || p.state === 'pending' || p.state === 'waitlist') {
          p.state = 'cancelled';
          if (!p.history) p.history = [];
          p.history.unshift({ at: orgNowLabel(), line: 'Seat/request cancelled · event cancelled' });
        }
      }
    });
    orgPushAudit(ev, 'Event cancelled · future venue grants revoked');
    closeOrgCancelSheet();
    toast('Event cancelled · future exact access ended');
    updateOrgEventsSummaries();
    renderOrgEventDetail();
  };

  function renderOrgEventParticipant() {
    var root = $('#org-event-participant-body');
    if (!root) return;
    var ev = findOrgEvent(activeOrgEventId);
    var p = findOrgParticipant(ev, activeOrgParticipantId);
    if (!ev || !p) {
      root.innerHTML = '<p class="sub">Participant not found.</p>';
      return;
    }
    root.innerHTML =
      '<div class="card mb-12 acct-card">' +
        '<div class="row gap-md">' +
          '<div class="avatar lg">' + (p.alias || '?').slice(0, 2).toUpperCase() + '</div>' +
          '<div class="flex-1">' +
            '<div class="strong" style="font-size:17px">' + p.alias + '</div>' +
            '<div class="muted">' + (p.usesAlias ? 'Event alias · root handle hidden' : 'Display name') + '</div>' +
            '<div class="row mt-8 wrap" style="gap:6px">' + orgStatePill(p.state) +
              '<span class="pill ghost">Venue · ' + (p.venueGrant || 'none') + '</span></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="banner private mb-12"><span>◎</span><span>No private alias→@root map. Organizer sees this context profile only.</span></div>' +
      '<div class="section-label" style="margin-top:0">State history</div>' +
      '<div class="card mb-12">' +
      (p.history || []).map(function (h, i, arr) {
        return '<div class="fact-row"' + (i === arr.length - 1 ? ' style="border:none"' : '') + '>' +
          '<span class="muted" style="font-size:11px">' + h.at + '</span>' +
          '<span class="strong" style="font-size:12px;text-align:right;max-width:62%">' + h.line + '</span></div>';
      }).join('') + '</div>' +
      '<div class="section-label">Messages (stub)</div>' +
      '<div class="card mb-12"><p class="sub">' + (p.messagesStub || 'No messages in this demo.') + '</p></div>' +
      '<div class="section-label">Venue grant</div>' +
      '<div class="card mb-12">' +
        '<div class="fact-row"><span class="muted">Status</span><span class="strong" style="font-size:13px">' + (p.venueGrant || 'none') + '</span></div>' +
        '<div class="fact-row" style="border:none"><span class="muted">Policy version</span><span class="strong" style="font-size:13px">v' + (ev.venueVersion || 0) + '</span></div>' +
      '</div>';
  }



  /* ========== W8 Public / guest share shell ========== */
  function normalizePublicRoute(name) {
    if (!name) return name;
    var h = String(name).replace(/^\/+/, '');
    var map = {
      'public': 'public-entry',
      'p': 'public-entry',
      'p/': 'public-entry',
      'p/b/cedar': 'public-business',
      'p/b/cedarstone': 'public-business',
      'p/event': 'public-event',
      'p/event/porch': 'public-event',
      'p/stay': 'public-stay',
      'p/stay/invite': 'public-stay-invite',
      'p/grant': 'public-place',
      'p/place': 'public-place',
      'p/qr': 'public-qr',
      'p/handle': 'public-handle',
      'p/signin': 'public-signin',
      'p/gallery': 'public-gallery',
      'public-grant': 'public-place'
    };
    if (map[h]) return map[h];
    if (map[name]) return map[name];
    return name;
  }

  window.exitPublicToApp = function () {
    var dest = 'you';
    if (publicPriorWorkspace === 'business') dest = 'biz-profile';
    else if (publicPriorWorkspace === 'crew') dest = 'crew-me';
    switchWorkspace(publicPriorWorkspace === 'business' ? 'business' : (publicPriorWorkspace === 'crew' ? 'crew' : 'personal'), { toast: false });
    go(dest);
    toast('Back in signed-in app (demo)');
  };

  window.openPublicGallery = function () { go('public-gallery'); };

  window.openPublicBusiness = function () { go('public-business'); };
  window.openPublicStayInvite = function () {
    publicStayInviteAccepted = null;
    go('public-stay-invite');
  };
  window.copyHostInviteLink = function () {
    toast('Copied domicile.app/stay/invite/ecc-7f3a9c');
    setTimeout(function () { toast('Invite-bound · forwarding does not transfer the slot'); }, 2200);
  };
  window.openPublicEventGuest = function () { go('public-event'); };
  window.openPublicPlaceFromGrant = function (grantId) {
    publicGrantId = grantId || activeGrantId || 'grant_maya_4c2e';
    publicQrToken = String(publicGrantId).replace('grant_', '') + '_opaque';
    go('public-place');
  };
  window.openPublicQrFromGrant = function (grantId) {
    publicGrantId = grantId || activeGrantId || 'grant_maya_4c2e';
    publicQrToken = String(publicGrantId).replace('grant_', '') + '_opaque';
    go('public-qr');
  };

  function publicSessionBarHtml() {
    if (!publicSession.signedIn) return '';
    return '<div class="public-session-bar"><span>✓</span><span>Continued with Domicile · demo session' +
      (publicSession.alias ? ' · ' + publicSession.alias : '') + '</span></div>';
  }

  function renderPublicEntry() {
    var body = $('#public-entry-body');
    if (!body) return;
    body.innerHTML =
      publicSessionBarHtml() +
      '<h1 class="h1" style="font-size:24px">Open a guest link</h1>' +
      '<p class="sub mb-16">Paste a share link, type a handle, or say you scanned a QR. Public pages never dump street addresses by default.</p>' +
      '<div class="field mb-8"><label>Handle or share link</label>' +
        '<div class="public-entry-field">' +
          '<input id="public-resolve-input" placeholder="@cedarstone or domicile.app/…" autocomplete="off" />' +
        '</div></div>' +
      '<button class="btn btn-primary mb-16" onclick="resolvePublicEntry()">Resolve</button>' +
      '<div class="section-label">Demo seeds</div>' +
      '<div class="mb-12">' +
        '<button type="button" class="public-demo-chip" onclick="fillPublicResolve(\'@cedarstone\')">@cedarstone</button>' +
        '<button type="button" class="public-demo-chip" onclick="fillPublicResolve(\'@al\')">@al</button>' +
        '<button type="button" class="public-demo-chip" onclick="fillPublicResolve(\'domicile.app/grant/grant_maya_4c2e\')">grant link</button>' +
        '<button type="button" class="public-demo-chip" onclick="fillPublicResolve(\'domicile.app/stay/invite/ecc-7f3a9c\')">stay invite</button>' +
        '<button type="button" class="public-demo-chip" onclick="fillPublicResolve(\'domicile.app/event/evt_porch_01\')">event</button>' +
        '<button type="button" class="public-demo-chip" onclick="fillPublicResolve(\'domicile.app/qr/maya_4c2e_opaque\')">QR token</button>' +
      '</div>' +
      '<button class="btn btn-secondary" onclick="go(\'public-qr\')">I scanned a QR</button>' +
      '<button class="btn btn-ghost mt-8" style="width:100%" onclick="go(\'public-gallery\')">Guest link gallery</button>' +
      '<p class="muted mt-16" style="font-size:11px;text-align:center;line-height:1.45">Prototype · no real auth · share/QR is recipient-bound</p>';
  }

  window.fillPublicResolve = function (val) {
    var inp = $('#public-resolve-input');
    if (inp) inp.value = val;
    resolvePublicEntry();
  };

  window.resolvePublicEntry = function () {
    var inp = $('#public-resolve-input');
    var raw = ((inp && inp.value) || '').trim().toLowerCase();
    if (!raw) { toast('Enter a handle or paste a link'); return; }
    if (raw.indexOf('@cedarstone') !== -1 || raw.indexOf('cedarstone') !== -1 && raw.indexOf('@') === 0) {
      go('public-business'); return;
    }
    if (raw === '@al' || raw === 'al' || raw.indexOf('@al') === 0) {
      go('public-handle'); return;
    }
    if (raw.indexOf('stay/invite') !== -1 || raw.indexOf('ecc-7f3a9c') !== -1) {
      go('public-stay-invite'); return;
    }
    if (raw.indexOf('event') !== -1 || raw.indexOf('evt_porch') !== -1 || raw.indexOf('porch') !== -1) {
      go('public-event'); return;
    }
    if (raw.indexOf('/qr/') !== -1 || raw.indexOf('qr/') === 0 || raw.indexOf('opaque') !== -1) {
      var tok = raw.split('/').pop();
      publicQrToken = tok || 'maya_4c2e_opaque';
      if (publicQrToken.indexOf('maya') !== -1) publicGrantId = 'grant_maya_4c2e';
      go('public-qr'); return;
    }
    if (raw.indexOf('grant') !== -1 || raw.indexOf('dml.link') !== -1 || raw.indexOf('/r/') !== -1) {
      if (raw.indexOf('maya') !== -1) publicGrantId = 'grant_maya_4c2e';
      else if (raw.indexOf('devon') !== -1) publicGrantId = 'grant_devon_8a1f';
      else publicGrantId = 'grant_maya_4c2e';
      go('public-place'); return;
    }
    if (raw.indexOf('stay') !== -1 || raw.indexOf('oak') !== -1 || raw.indexOf('waller') !== -1) {
      go('public-stay'); return;
    }
    toast('Unrecognized demo token — try a chip below');
  };

  function renderPublicQr() {
    var body = $('#public-qr-body');
    if (!body) return;
    var token = publicQrToken || 'maya_4c2e_opaque';
    var cells = '';
    var seed = token.length * 3;
    for (var y = 0; y < 11; y++) {
      for (var x = 0; x < 11; x++) {
        var on = ((x * 7 + y * 13 + seed) % 5) !== 0;
        if (x < 3 && y < 3) on = true;
        if (x > 7 && y < 3) on = true;
        if (x < 3 && y > 7) on = true;
        if (on) cells += '<rect x="' + (x * 14 + 8) + '" y="' + (y * 14 + 8) + '" width="12" height="12" fill="#1C1917"/>';
      }
    }
    body.innerHTML =
      publicSessionBarHtml() +
      '<h1 class="h1" style="font-size:22px">QR scanned</h1>' +
      '<p class="sub mb-12">Opaque token resolved. This QR is bound to a named recipient account — forwarding does not transfer the grant.</p>' +
      '<div class="public-qr-hero"><svg viewBox="0 0 170 170" width="140" height="140" xmlns="http://www.w3.org/2000/svg"><rect width="170" height="170" fill="#F7F4EF"/>' + cells + '</svg></div>' +
      '<div class="card mb-12">' +
        '<div class="muted mb-8" style="font-size:11px">Opaque token</div>' +
        '<div class="strong" style="font-size:13px;word-break:break-all">dml.link/r/' + token + '</div>' +
        '<p class="muted mt-8" style="font-size:11px">Pairwise ref · not a street address · history-safe</p>' +
      '</div>' +
      '<div class="banner private mb-16"><span>◎</span><span><strong>Recipient-bound.</strong> Wrong-account redemption is denied. Share/QR honesty is part of the product.</span></div>' +
      '<button class="btn btn-primary" onclick="go(\'public-place\')">Continue to location card</button>' +
      '<button class="btn btn-secondary mt-8" onclick="go(\'public-signin\')">Continue with Domicile</button>' +
      '<button class="btn btn-ghost mt-8" style="width:100%" onclick="go(\'public-entry\')">Back to entry</button>';
  }

  function renderPublicBusiness() {
    var body = $('#public-business-body');
    if (!body) return;
    var o = BIZ_ORG;
    body.innerHTML =
      publicSessionBarHtml() +
      '<div class="banner private mb-12"><span>◎</span><span><strong>Public page ≠ address book.</strong> Coverage is an area blurb — not a street, unit, or customer list.</span></div>' +
      '<div class="card mb-12">' +
        '<div class="row gap-md">' +
          '<div class="avatar lg" style="background:#2F5D50">CS</div>' +
          '<div class="flex-1">' +
            '<div class="strong" style="font-size:18px;font-family:var(--font-display)">' + o.displayName + '</div>' +
            '<div class="muted">' + o.handle + ' · verified merchant (demo)</div>' +
            '<div class="chip-row mt-8">' + o.categories.map(function (c) { return '<span class="pill sage">' + c + '</span>'; }).join('') + '</div>' +
          '</div>' +
        '</div>' +
        '<p class="sub mt-12">' + o.about + '</p>' +
      '</div>' +
      '<div class="section-label">Coverage &amp; hours</div>' +
      '<div class="card mb-12">' +
        '<div class="fact-row"><span class="muted">Serves</span><span class="strong" style="font-size:12px;text-align:right;max-width:58%">East Austin corridors</span></div>' +
        '<div class="fact-row"><span class="muted">Hours</span><span class="strong" style="font-size:12px">' + o.hours + '</span></div>' +
        '<div class="fact-row" style="border:none"><span class="muted">Street</span><span class="strong" style="font-size:12px">Not published</span></div>' +
      '</div>' +
      '<div class="section-label">Offerings</div>' +
      '<div class="card mb-8"><div class="between"><span class="strong">Deep clean</span><span class="muted">From $185</span></div><p class="muted mt-8" style="font-size:11px">Quote ≠ booking</p></div>' +
      '<div class="card mb-8"><div class="between"><span class="strong">Turnover</span><span class="muted">From $120</span></div></div>' +
      '<div class="card mb-16"><div class="between"><span class="strong">Tidy</span><span class="muted">From $75</span></div></div>' +
      '<button class="btn btn-primary" onclick="openPublicInquireSheet()">Inquire</button>' +
      '<button class="btn btn-ghost mt-8" style="width:100%" onclick="go(\'public-entry\')">Guest entry</button>' +
      '<p class="muted mt-12" style="font-size:11px;text-align:center">Inquiry uses a <strong>context alias</strong> · approx area default</p>';
  }

  window.openPublicInquireSheet = function () {
    var box = $('#public-inquire-body');
    if (box) {
      box.innerHTML =
        '<div class="public-alias-preview mb-12">' +
          '<div class="muted mb-4" style="font-size:11px">Context alias (not root @handle)</div>' +
          '<div class="field mb-0"><input id="pub-inq-alias" value="' + publicInquiryAlias + '" /></div>' +
          '<p class="muted mt-8" style="font-size:11px">Provider sees this alias on the inquiry — not your public handle by default.</p>' +
        '</div>' +
        '<div class="field mb-8"><label>Service</label><select id="pub-inq-service"><option>Deep clean</option><option>Turnover</option><option>Tidy</option></select></div>' +
        '<div class="field mb-8"><label>Preferred window</label><input id="pub-inq-window" value="Thu Sep 25 · 10–1 CT" /></div>' +
        '<div class="card mb-12">' +
          '<div class="fact-row"><span class="muted">Disclosure</span><span class="strong" style="font-size:12px">Approximate area</span></div>' +
          '<div class="fact-row" style="border:none"><span class="muted">Street</span><span class="strong" style="font-size:12px">Locked until eligibility</span></div>' +
        '</div>' +
        '<div class="banner info mb-12"><span>ℹ</span><span>Same honesty as private inquiry: approx ON · exact OFF · alias · no street dump from public page.</span></div>';
    }
    $('#public-inquire-backdrop').classList.add('show');
    $('#public-inquire-sheet').classList.add('show');
  };
  window.closePublicInquireSheet = function () {
    $('#public-inquire-backdrop').classList.remove('show');
    $('#public-inquire-sheet').classList.remove('show');
  };
  window.submitPublicInquire = function () {
    var a = ($('#pub-inq-alias') && $('#pub-inq-alias').value) || publicInquiryAlias;
    publicInquiryAlias = a.trim() || 'Garden Guest';
    closePublicInquireSheet();
    toast('Inquiry sent as “' + publicInquiryAlias + '” · opaque ref · no street');
  };

  function renderPublicEvent() {
    var body = $('#public-event-body');
    if (!body) return;
    var ev = findOrgEvent('evt_porch_01') || { title: 'East Side Porch Social', venueLabel: 'East Cesar Chavez neighborhood · approximate area', capacity: 40 };
    var unlocked = publicSession.signedIn && publicSession.eventConfirmed;
    body.innerHTML =
      publicSessionBarHtml() +
      '<div class="photo med event mb-12"><span class="photo-label">Oct 4</span></div>' +
      '<h1 class="h1" style="font-size:22px">' + (ev.title || 'East Side Porch Social') + '</h1>' +
      '<p class="sub mb-12">Saturday, Oct 4 · 5:00–8:00 PM CT · ' + (ev.organizerLabel || 'Al · Personal') + '</p>' +
      '<div class="banner private mb-12"><span>◎</span><span>Exact venue locked until you are a <strong>confirmed</strong> participant in the disclosure window.</span></div>' +
      '<div class="card mb-12">' +
        '<div class="h3">Venue</div>' +
        '<p class="sub">' + (ev.venueLabel || 'East Cesar Chavez neighborhood · approximate area') + '</p>' +
        (unlocked
          ? '<p class="strong mt-8" style="font-size:13px">' + (ev.venueExact || 'Exact pin unlocked (demo)') + '</p>'
          : '<div class="public-lock mt-12"><div class="lock-ico">🔒</div><div class="strong" style="font-size:13px">Exact address locked</div><p class="muted mt-4" style="font-size:11px">Confirm + in-window required</p></div>') +
      '</div>' +
      '<div class="map-canvas mb-12" style="height:140px">' +
        '<div class="map-blob sky" style="top:30%;left:35%"><span>Venue area</span></div>' +
        '<div class="map-note">Approx area only on public page · ticketed off</div>' +
      '</div>' +
      '<div class="card mb-16">' +
        '<div class="h3">Attendance</div>' +
        '<p class="sub">Interest list · capacity ~' + (ev.capacity || 40) + ' · no ticket fee · open RSVP interest</p>' +
      '</div>' +
      '<button class="btn btn-primary" onclick="openPublicRsvpSheet()">RSVP interest</button>' +
      '<button class="btn btn-ghost mt-8" style="width:100%" onclick="go(\'public-entry\')">Guest entry</button>';
  }

  window.openPublicRsvpSheet = function () {
    var box = $('#public-rsvp-body');
    if (box) {
      box.innerHTML =
        '<div class="public-alias-preview mb-12">' +
          '<div class="muted mb-4" style="font-size:11px">Event context alias</div>' +
          '<div class="field mb-0"><input id="pub-rsvp-alias" value="' + publicEventAlias + '" /></div>' +
          '<p class="muted mt-8" style="font-size:11px">Organizer sees this alias — not your root @handle by default (P41).</p>' +
        '</div>' +
        '<div class="field mb-12"><label>Note (optional)</label><textarea id="pub-rsvp-note" rows="2" placeholder="Hope to make it…">Looking forward to the porch hang.</textarea></div>' +
        '<div class="banner info mb-8"><span>ℹ</span><span>Interest ≠ seat. Exact venue stays locked until confirmed + window.</span></div>';
    }
    $('#public-rsvp-backdrop').classList.add('show');
    $('#public-rsvp-sheet').classList.add('show');
  };
  window.closePublicRsvpSheet = function () {
    $('#public-rsvp-backdrop').classList.remove('show');
    $('#public-rsvp-sheet').classList.remove('show');
  };
  window.submitPublicRsvp = function () {
    var a = ($('#pub-rsvp-alias') && $('#pub-rsvp-alias').value) || publicEventAlias;
    publicEventAlias = a.trim() || 'Porch Curious';
    closePublicRsvpSheet();
    toast('Interest sent as “' + publicEventAlias + '” · not a seat');
  };

  function renderPublicStay() {
    var body = $('#public-stay-body');
    if (!body) return;
    var reveal = publicSession.signedIn && publicSession.stayBooked;
    body.innerHTML =
      publicSessionBarHtml() +
      '<div class="photo tall loft mb-12"><span class="photo-label">Oak &amp; Waller</span></div>' +
      '<div class="between mb-8"><h1 class="h1" style="font-size:22px;margin:0">Oak &amp; Waller Loft</h1><span class="pill">Instant book</span></div>' +
      '<p class="sub mb-8">Entire loft · East Austin · up to 3 guests</p>' +
      '<div class="banner warn mb-12"><span>⚠</span><span><strong>Cohort gate:</strong> Public discovery listing — not a private host invite. Guest ≠ household.</span></div>' +
      '<div class="card mb-12"><p class="sub">Light-filled loft near Waller Creek. Quiet evenings. Self check-in after confirmation.</p></div>' +
      '<div class="section-label">Location</div>' +
      '<div class="map-canvas mb-8" style="height:140px">' +
        '<div class="map-blob" style="top:30%;left:35%"><span>Neighborhood</span></div>' +
        '<div class="map-note">Approximate neighborhood — exact address locked</div>' +
      '</div>' +
      (reveal
        ? '<div class="card mb-16"><div class="strong">2110 Oak &amp; Waller area · unit after confirm</div><p class="muted mt-8" style="font-size:11px">Demo unlock after booked continuation</p></div>'
        : '<div class="public-lock mb-16"><div class="lock-ico">🔒</div><div class="strong" style="font-size:13px">Exact address locked</div><p class="muted mt-4" style="font-size:11px">Unlocks for confirmed guests before arrival</p></div>') +
      '<div class="sticky-cta">' +
        '<div class="between mb-8"><div><span class="strong">$148</span> <span class="muted">/ night</span></div><span class="muted">Request / Book</span></div>' +
        '<button class="btn btn-primary" onclick="publicStayCta()">Request / Book</button>' +
      '</div>' +
      '<button class="btn btn-ghost mt-8" style="width:100%" onclick="go(\'public-entry\')">Guest entry</button>';
  }

  window.publicStayCta = function () {
    if (!publicSession.signedIn) {
      publicReturnScreen = 'public-stay';
      toast('Sign in to continue booking (demo)');
      setTimeout(function () { go('public-signin'); }, 500);
      return;
    }
    publicSession.stayBooked = true;
    renderPublicStay();
    toast('Request sent · exact address still locked until confirm (demo)');
  };

  function renderPublicStayInvite() {
    var body = $('#public-stay-invite-body');
    if (!body) return;
    var status = publicStayInviteAccepted;
    body.innerHTML =
      publicSessionBarHtml() +
      '<div class="banner private mb-12"><span>◎</span><span><strong>Private invitation</strong> · invite-bound · not transferable · not public Stays discovery.</span></div>' +
      '<h1 class="h1" style="font-size:22px">You’re invited</h1>' +
      '<p class="sub mb-16">Host <strong>Mira</strong> invited you to a short stay — East Cesar Chavez area.</p>' +
      '<div class="card mb-12">' +
        '<div class="fact-row"><span class="muted">Guest</span><span class="strong" style="font-size:13px">Jordan K. (invite slot)</span></div>' +
        '<div class="fact-row"><span class="muted">Dates</span><span class="strong" style="font-size:13px">Oct 3–6, 2026</span></div>' +
        '<div class="fact-row"><span class="muted">Place</span><span class="strong" style="font-size:13px">East Cesar Chavez · approx</span></div>' +
        '<div class="fact-row" style="border:none"><span class="muted">Token</span><span class="strong" style="font-size:12px">ecc-7f3a9c</span></div>' +
      '</div>' +
      '<div class="public-lock mb-16"><div class="lock-ico">🔒</div><div class="strong" style="font-size:13px">Exact home locked</div><p class="muted mt-4" style="font-size:11px">Reveals after accept + host confirm window</p></div>' +
      (status === true
        ? '<div class="banner info mb-12"><span>✓</span><span>Accepted (demo). Exact address still locked until window.</span></div>'
        : status === false
          ? '<div class="banner warn mb-12"><span>—</span><span>Declined (demo). Invite slot released.</span></div>'
          : '<div class="btn-row mb-12">' +
              '<button class="btn btn-primary" style="flex:1;width:auto" onclick="acceptPublicStayInvite()">Accept</button>' +
              '<button class="btn btn-secondary" style="flex:1;width:auto" onclick="declinePublicStayInvite()">Decline</button>' +
            '</div>') +
      '<p class="muted" style="font-size:11px;text-align:center;line-height:1.45">Forwarding this link does not move the invite to someone else.</p>' +
      '<button class="btn btn-ghost mt-12" style="width:100%" onclick="go(\'public-entry\')">Guest entry</button>';
  }

  window.acceptPublicStayInvite = function () {
    publicStayInviteAccepted = true;
    renderPublicStayInvite();
    toast('Invite accepted · cohort slot held (demo)');
  };
  window.declinePublicStayInvite = function () {
    publicStayInviteAccepted = false;
    renderPublicStayInvite();
    toast('Invite declined (demo)');
  };

  function renderPublicPlace() {
    var body = $('#public-place-body');
    if (!body) return;
    var g = findOutgoing(publicGrantId) || findOutgoing('grant_maya_4c2e');
    if (!g) {
      body.innerHTML = '<p class="sub">Grant not found.</p>';
      return;
    }
    var continued = !!publicSession.signedIn;
    var approx = g.precision === 'approx' || !continued;
    var revealExact = continued && g.precision === 'exact';
    var btn = $('#public-place-signin-btn');
    if (btn) btn.textContent = continued ? 'Signed in' : 'Sign in';

    var mapHtml;
    if (revealExact) {
      var pl = g.selection === 'fixed' && g.placeId ? placeById(g.placeId) : (typeof PLACE_HOME !== 'undefined' ? PLACE_HOME : { street: 'Exact pin', unit: '', city: 'Austin', zip: '78702', label: 'Home' });
      mapHtml =
        '<div class="card mb-12">' +
          '<div class="strong">' + (pl.label || 'Place') + '</div>' +
          '<div class="muted mt-8">' + pl.street + (pl.unit ? ' · ' + pl.unit : '') + '</div>' +
          '<div class="muted">' + pl.city + ', ' + pl.zip + '</div>' +
        '</div>';
    } else {
      mapHtml =
        '<div class="map-canvas mb-12" style="height:160px">' +
          '<div class="map-blob" style="top:28%;left:30%;width:100px;height:78px"><span>Approx area</span></div>' +
          '<div class="map-note">Approximate neighborhood · no street / unit</div>' +
        '</div>';
    }

    body.innerHTML =
      publicSessionBarHtml() +
      '<div class="banner private mb-12"><span>◎</span><span><strong>Recipient-bound share.</strong> Forwarding does not transfer ' + g.name + '\'s grant. Wrong-account redemption denied.</span></div>' +
      '<div class="pd-hero mb-12">' +
        '<div class="grant-avatar" style="background:' + g.color + '">' + g.initials + '</div>' +
        '<div>' +
          '<div class="strong" style="font-size:18px;font-family:var(--font-display)">Shared location</div>' +
          '<div class="muted" style="font-size:12px;margin-top:2px">From AL · for ' + g.name + ' (' + g.handle + ')</div>' +
        '</div>' +
      '</div>' +
      '<div class="card mb-12">' +
        '<div class="fact-row"><span class="muted">Purpose</span><span class="strong" style="font-size:12px">' + g.purpose + '</span></div>' +
        '<div class="fact-row"><span class="muted">Precision</span><span class="strong" style="font-size:12px">' + (approx ? 'Approximate area' : 'Exact pin') + '</span></div>' +
        '<div class="fact-row"><span class="muted">Routing</span><span class="strong" style="font-size:12px">' + (g.selection === 'fixed' ? 'Fixed address version' : 'Follow home') + '</span></div>' +
        '<div class="fact-row" style="border:none"><span class="muted">Window</span><span class="strong" style="font-size:12px;text-align:right;max-width:58%">' + g.endLabel + '</span></div>' +
      '</div>' +
      mapHtml +
      (!continued
        ? '<div class="public-lock mb-16"><div class="lock-ico">🔒</div><div class="strong" style="font-size:13px">Limited preview</div><p class="muted mt-4" style="font-size:11px">Continue with Domicile to redeem as the bound recipient</p></div>' +
          '<button class="btn btn-primary" onclick="go(\'public-signin\')">Continue with Domicile</button>'
        : '<div class="banner info mb-12"><span>✓</span><span>Permitted fields revealed for this grant · history-safe · no raw dump beyond precision.</span></div>' +
          (g.precision === 'approx'
            ? '<p class="muted mb-12" style="font-size:11px;text-align:center">Grant is still approximate — exact pin not authorized.</p>'
            : '') +
          '<button class="btn btn-secondary" onclick="toast(\'Opened in Map (demo)\')">Open in Map</button>') +
      '<button class="btn btn-ghost mt-8" style="width:100%" onclick="go(\'public-qr\')">View QR token</button>' +
      '<p class="muted mt-12" style="font-size:11px;text-align:center">Pairwise <strong>' + g.id + '</strong> · prototype</p>';
  }

  function renderPublicHandle() {
    var body = $('#public-handle-body');
    if (!body) return;
    body.innerHTML =
      publicSessionBarHtml() +
      '<div class="banner private mb-12"><span>◎</span><span><strong>Handle ≠ location.</strong> Resolving @al shows profile / message — not a map pin.</span></div>' +
      '<div class="card mb-16">' +
        '<div class="row gap-md">' +
          '<div class="avatar lg">AL</div>' +
          '<div class="flex-1">' +
            '<div class="strong" style="font-size:18px;font-family:var(--font-display)">AL</div>' +
            '<div class="muted">@al · Personal</div>' +
            '<div class="chip-row mt-8"><span class="pill sage">Message only</span><span class="pill ghost">No address</span></div>' +
          '</div>' +
        '</div>' +
        '<p class="sub mt-12">Public discoverability is message / profile only. A handle does not publish home coordinates.</p>' +
      '</div>' +
      '<button class="btn btn-primary" onclick="toast(\'Message composer (demo) · no address attached\')">Message @al</button>' +
      '<button class="btn btn-ghost mt-8" style="width:100%" onclick="go(\'public-entry\')">Guest entry</button>';
  }

  function renderPublicSignin() {
    var body = $('#public-signin-body');
    if (!body) return;
    body.innerHTML =
      '<h1 class="h1" style="font-size:24px">Continue</h1>' +
      '<p class="sub mb-16">Lightweight guest continuation — mock sign-in returns you to the prior public card with permitted fields unlocked. No full account switcher.</p>' +
      '<div class="card mb-12">' +
        '<div class="strong" style="font-size:14px">Return to</div>' +
        '<div class="muted mt-4">' + (publicReturnScreen || 'public-place') + '</div>' +
      '</div>' +
      '<button class="btn btn-primary" onclick="publicContinueSignIn()">Sign in with Domicile (mock)</button>' +
      '<button class="btn btn-secondary mt-8" onclick="publicContinueGuest()">Continue as guest demo</button>' +
      '<button class="btn btn-ghost mt-8" style="width:100%" onclick="go(publicReturnScreen || \'public-entry\')">Cancel</button>' +
      '<p class="muted mt-16" style="font-size:11px;text-align:center">Prototype only · no real auth / payments</p>';
  }

  window.publicContinueSignIn = function () {
    publicSession.signedIn = true;
    publicSession.continuedAt = Date.now();
    publicSession.alias = publicSession.alias || 'Demo guest';
    var dest = publicReturnScreen || 'public-place';
    go(dest);
    toast('Signed in · permitted fields unlocked (demo)');
  };
  window.publicContinueGuest = function () {
    publicSession.signedIn = true;
    publicSession.alias = 'Guest demo';
    var dest = publicReturnScreen || 'public-place';
    go(dest);
    toast('Guest continuation · limited unlock (demo)');
  };

  function renderPublicGallery() {
    var body = $('#public-gallery-body');
    if (!body) return;
    var rows = [
      ['public-entry', 'Handle / link entry', '#public'],
      ['public-business', 'Cedar & Stone public', '#public-business'],
      ['public-event', 'Porch Social (guest)', '#public-event'],
      ['public-stay', 'Oak & Waller stay card', '#public-stay'],
      ['public-stay-invite', 'Private stay invite', '#public-stay-invite'],
      ['public-place', 'Permitted location card', '#public-place'],
      ['public-qr', 'QR landing', '#public-qr'],
      ['public-handle', '@al handle card', '#public-handle'],
      ['public-signin', 'Sign-in continuation', '#public-signin']
    ];
    body.innerHTML =
      '<h1 class="h1" style="font-size:22px">Public &amp; guest links</h1>' +
      '<p class="sub mb-16">W8 demo gallery — open cold without personal/business/crew chrome.</p>' +
      rows.map(function (r) {
        return '<div class="card tap mb-8" onclick="go(\'' + r[0] + '\')"><div class="between"><div><div class="strong" style="font-size:14px">' + r[1] + '</div><div class="muted" style="font-size:11px">' + r[2] + '</div></div><span>›</span></div></div>';
      }).join('') +
      '<button class="btn btn-secondary mt-8" onclick="exitPublicToApp()">Return to signed-in app</button>' +
      '<p class="muted mt-12" style="font-size:11px;text-align:center">Seeds: @cedarstone · @al · grant_maya_4c2e · ecc-7f3a9c · evt_porch_01</p>';
  }

    var toastTimer;
  window.toast = function (msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  };

  function boot() {
    applyWorkspaceChrome();
    updateMoveOverview();
    updateConnectedServicesSummaries();
    updatePermissionsSummaries();
    updateOrgEventsSummaries();
    var hash = (location.hash || '').replace(/^#/, '');
    hash = normalizePublicRoute(hash);
    if (hash && $('[data-screen="' + hash + '"]')) {
      $all('.screen').forEach(function (s) { s.classList.remove('active'); });
      // Pre-set workspace so first go() doesn't double-toast
      if (isPublicScreen(hash)) {
        activeWorkspace = 'public';
        applyWorkspaceChrome();
      } else if (isCrewScreen(hash)) {
        activeWorkspace = 'crew';
        activeOrg = 'cedar';
        activeAccount = 'casey';
        applyWorkspaceChrome();
      } else if (isBizScreen(hash)) {
        activeWorkspace = 'business';
        activeOrg = 'cedar';
        activeAccount = 'al';
        applyWorkspaceChrome();
      }
      go(hash);
    } else {
      updateNav('today');
    }
  }
  boot();
  window.addEventListener('hashchange', function () {
    var hash = (location.hash || '').replace(/^#/, '');
    hash = normalizePublicRoute(hash);
    if (hash && hash !== current) go(hash);
  });
})();
