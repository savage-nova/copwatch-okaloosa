// document
//   .getElementById("contact-form")
//   .addEventListener("submit", function (e) {
//     e.preventDefault();
//     // Use an API or service like Formspree or Netlify Forms to avoid storing data on your own server.
//     alert("Thank you. We will contact you with more info.");
//   });

// var GNEWS_API_KEY = '66c160d73065603b350fead122a8c1be'
// var FIREBASE_PROJECT_ID = 'copwatch-fd64e';

document.getElementById('year').textContent = new Date().getFullYear();

  // Mobile nav
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('siteNav');
  toggle.addEventListener('click', function(){
    var open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // Spotlight cursor effect on hero headline
  var heroSection = document.getElementById('heroSection');
  var revealText = document.querySelector('.reveal-text');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reduceMotion && revealText){
    heroSection.addEventListener('pointermove', function(e){
      var rect = heroSection.getBoundingClientRect();
      var x = ((e.clientX - rect.left) / rect.width) * 100;
      var y = ((e.clientY - rect.top) / rect.height) * 100;
      revealText.style.setProperty('--mx', x + '%');
      revealText.style.setProperty('--my', y + '%');
    });
  }

  // ---- Local News feed: Okaloosa County + police/sheriff terms ----
  // PRIMARY: GNews API (needs a free key from https://gnews.io — no credit card required).
  // FALLBACK: Google News RSS via rotating free CORS proxies, used automatically if no key is set
  // or the GNews request fails/hits its daily quota.
  (function(){
    var newsGrid = document.getElementById('newsGrid');

    // ---- Set your free GNews API key here. Leave as 'YOUR_GNEWS_API_KEY' to skip straight to the RSS fallback. ----
    var GNEWS_API_KEY = "66c160d73065603b350fead122a8c1be";

    var searchTerms = 'Okaloosa County (sheriff OR police OR deputy)';
    var query = encodeURIComponent(searchTerms);
    var rssUrl = 'https://news.google.com/rss/search?q=' + query + '&hl=en-US&gl=US&ceid=US:en';

    var proxies = [
      {
        build: function(u){ return 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(u); },
        extract: function(json){ return (json.items || []).map(function(i){ return { title:i.title, link:i.link, pubDate:i.pubDate, source:'' }; }); }
      },
      {
        build: function(u){ return 'https://api.allorigins.win/get?url=' + encodeURIComponent(u); },
        extract: function(json){ return parseRssXml(json.contents); }
      },
      {
        build: function(u){ return 'https://corsproxy.io/?url=' + encodeURIComponent(u); },
        extract: function(text){ return parseRssXml(typeof text === 'string' ? text : ''); }
      }
    ];

    function parseRssXml(xmlText){
      try{
        var doc = new DOMParser().parseFromString(xmlText, 'text/xml');
        var nodes = doc.querySelectorAll('item');
        var out = [];
        nodes.forEach(function(node){
          out.push({
            title: (node.querySelector('title') || {}).textContent || '',
            link: (node.querySelector('link') || {}).textContent || '',
            pubDate: (node.querySelector('pubDate') || {}).textContent || '',
            source: ''
          });
        });
        return out;
      } catch(e){ return []; }
    }

    function escapeHtml(str){
      var div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    function renderArticles(items, badgeText){
      if(!items || !items.length){
        newsGrid.innerHTML = '<p class="news-empty">No recent local coverage found for this search. Check back soon.</p>';
        return;
      }
      newsGrid.innerHTML = items.slice(0, 9).map(function(item){
        var d = new Date(item.pubDate);
        var dateStr = isNaN(d) ? '' : d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
        var source = item.source;
        var headline = item.title || '';
        if(!source){
          // Google News RSS titles are usually "Headline - Source"; split it out
          var parts = headline.split(' - ');
          source = parts.length > 1 ? parts.pop() : 'Source';
          headline = parts.join(' - ');
        }
        return '<div class="protocol news-card">' +
          '<div class="src-row"><span>' + escapeHtml(source) + '</span><span>' + dateStr + '</span></div>' +
          '<h3><a class="headline-link" href="' + item.link + '" target="_blank" rel="noopener">' + escapeHtml(headline) + '</a></h3>' +
          '<a class="read-more" href="' + item.link + '" target="_blank" rel="noopener">Read full story →</a>' +
          '</div>';
      }).join('') + '<p class="form-note" style="grid-column:1/-1; margin-top:4px;">Source: ' + badgeText + '</p>';
    }

    function showError(msg){
      newsGrid.innerHTML = '<p class="news-error">' + msg + '</p>' +
        '<button class="btn" id="retryNews" style="margin-top:12px;">Try again</button>';
      var retryBtn = document.getElementById('retryNews');
      if(retryBtn) retryBtn.addEventListener('click', function(){
        newsGrid.innerHTML = '<div class="protocol"><p class="mono" style="color:var(--mist); font-size:12.5px;">Loading local coverage…</p></div>';
        loadFromGNewsOrFallback();
      });
    }

    function loadFromRssFallback(attempt){
      if(attempt >= proxies.length){
        showError('Couldn\'t load the live feed right now — GNews and all fallback sources failed or are rate-limited.');
        return;
      }
      var proxy = proxies[attempt];
      fetch(proxy.build(rssUrl))
        .then(function(res){ if(!res.ok) throw new Error('status ' + res.status); return res.text(); })
        .then(function(text){
          var data; try{ data = JSON.parse(text); } catch(e){ data = text; }
          var items = proxy.extract(data);
          if(!items.length) throw new Error('empty result');
          renderArticles(items, 'Google News RSS (fallback feed)');
        })
        .catch(function(){ loadFromRssFallback(attempt + 1); });
    }

    function loadFromGNewsOrFallback(){
      if(!GNEWS_API_KEY || GNEWS_API_KEY === 'YOUR_GNEWS_API_KEY'){
        loadFromRssFallback(0);
        return;
      }
      var gnewsUrl = 'https://gnews.io/api/v4/search?q=' + query + '&lang=en&country=us&max=9&apikey=' + GNEWS_API_KEY;
      fetch(gnewsUrl)
        .then(function(res){ if(!res.ok) throw new Error('status ' + res.status); return res.json(); })
        .then(function(data){
          if(!data.articles || !data.articles.length) throw new Error('empty result');
          var items = data.articles.map(function(a){
            return { title: a.title, link: a.url, pubDate: a.publishedAt, source: (a.source && a.source.name) || 'Source' };
          });
          renderArticles(items, 'GNews API');
        })
        .catch(function(){ loadFromRssFallback(0); }); // GNews failed or quota hit — fall back to RSS chain
    }

    loadFromGNewsOrFallback();
  })();

  // ============================================================
  // DATA LAYER — backed by Cloud Firestore (Firebase's free tier).
  // Chosen over Supabase specifically because Firebase's free "Spark" plan
  // never pauses for inactivity — it just has generous daily quotas
  // (50,000 reads/day), unlike Supabase which pauses free projects after
  // ~7 days of no traffic. No credit card required either way.
  //
  // Until you configure FIREBASE_PROJECT_ID below, the site runs on the
  // local fallback values so it still works with zero setup. See the
  // "Setting up the database" comment block further down for how to wire
  // this up — once connected, editing data means opening the Firebase
  // Console and editing documents directly. No file editing, no redeploying.
  // ============================================================

  var FIREBASE_PROJECT_ID = 'copwatch-fd64e'; // found in Firebase Console → Project Settings

  function firebaseConfigured(){
    return FIREBASE_PROJECT_ID && FIREBASE_PROJECT_ID !== 'copwatch-fd64e';
  }

  function firestoreBaseUrl(){
    return 'https://firestore.googleapis.com/v1/projects/' + FIREBASE_PROJECT_ID + '/databases/(default)/documents';
  }

  // Firestore's REST API wraps every value in a type tag, e.g. {"stringValue":"x"} or {"integerValue":"5"}.
  // This unwraps a document's "fields" object into a plain JS object.
  function unwrapFirestoreFields(fields){
    var out = {};
    if(!fields) return out;
    Object.keys(fields).forEach(function(key){
      var v = fields[key];
      if(v.stringValue !== undefined) out[key] = v.stringValue;
      else if(v.integerValue !== undefined) out[key] = parseInt(v.integerValue, 10);
      else if(v.doubleValue !== undefined) out[key] = v.doubleValue;
      else if(v.booleanValue !== undefined) out[key] = v.booleanValue;
      else if(v.timestampValue !== undefined) out[key] = v.timestampValue;
      else if(v.nullValue !== undefined) out[key] = null;
      else out[key] = null;
    });
    return out;
  }

  // Fetch a single document, e.g. collection "site_stats", doc "main".
  function firestoreGetDoc(collectionName, docId){
    var url = firestoreBaseUrl() + '/' + collectionName + '/' + docId;
    return fetch(url).then(function(res){
      if(!res.ok) throw new Error(collectionName + '/' + docId + ' request failed: ' + res.status);
      return res.json();
    }).then(function(json){
      return unwrapFirestoreFields(json.fields);
    });
  }

  // Fetch every document in a collection. Sorting/limiting happens client-side afterward —
  // fine for the small volumes a grassroots org's log will realistically have.
  function firestoreGetCollection(collectionName){
    var url = firestoreBaseUrl() + '/' + collectionName;
    return fetch(url).then(function(res){
      if(!res.ok) throw new Error(collectionName + ' request failed: ' + res.status);
      return res.json();
    }).then(function(json){
      return (json.documents || []).map(function(doc){ return unwrapFirestoreFields(doc.fields); });
    });
  }

  // Local fallback data — used automatically if Firebase isn't configured, or a request fails.
  // Safe to hand-edit these too, if you just want static numbers without a database.
  var STATS = { incidents: 0, hours: 0, observers: 0, flyers: 0 };
  var MONTHLY = [
    {label:'Sep', value:0, flag:false},
    {label:'Oct', value:0, flag:false},
    {label:'Nov', value:0, flag:false},
    {label:'Dec', value:0, flag:false},
    {label:'Jan', value:0, flag:false},
    {label:'Feb', value:0, flag:false}
  ];
  var FUNDING = { raised: 0, spent: 0, balance: 0, expenseCount: 0 };
  var SPENDING_LOG = [];
  var INCIDENT_LOG = [];

  function loadSiteStats(){
    if(!firebaseConfigured()) return Promise.resolve();
    return firestoreGetDoc('site_stats', 'main').then(function(r){
      STATS = { incidents: r.incidents_logged || 0, hours: r.volunteer_hours || 0, observers: r.active_observers || 0, flyers: r.flyers_distributed || 0 };
    }).catch(function(){ /* keep local fallback */ });
  }

  function loadFundingTotals(){
    if(!firebaseConfigured()) return Promise.resolve();
    return firestoreGetDoc('funding_totals', 'main').then(function(r){
      var raised = Number(r.total_raised) || 0;
      var spent = Number(r.total_spent) || 0;
      FUNDING.raised = raised;
      FUNDING.spent = spent;
      FUNDING.balance = raised - spent;
    }).catch(function(){ /* keep local fallback */ });
  }

  function loadSpendingLog(){
    if(!firebaseConfigured()) return Promise.resolve();
    return firestoreGetCollection('spending_log').then(function(rows){
      SPENDING_LOG = rows
        .map(function(r){ return { date: r.entry_date, category: r.category, desc: r.description, amount: Number(r.amount) || 0 }; })
        .sort(function(a, b){ return new Date(b.date) - new Date(a.date); })
        .slice(0, 8);
      FUNDING.expenseCount = rows.length;
    }).catch(function(){ /* keep local fallback */ });
  }

  function loadIncidentLog(){
    if(!firebaseConfigured()) return Promise.resolve();
    return firestoreGetCollection('incident_log').then(function(rows){
      INCIDENT_LOG = rows
        .map(function(r){ return { date: r.entry_date, desc: r.description, status: r.status || 'Pending' }; })
        .sort(function(a, b){ return new Date(b.date) - new Date(a.date); })
        .slice(0, 6);
    }).catch(function(){ /* keep local fallback */ });
  }

  function loadMonthlyIncidents(){
    if(!firebaseConfigured()) return Promise.resolve();
    return firestoreGetCollection('monthly_incidents').then(function(rows){
      if(!rows.length) return;
      MONTHLY = rows
        .sort(function(a, b){ return (a.sort_order || 0) - (b.sort_order || 0); })
        .map(function(r){ return { label: r.month_label, value: r.value || 0, flag: !!r.flagged }; });
    }).catch(function(){ /* keep local fallback */ });
  }

  function buildChart(){
    var chart = document.getElementById('chart');
    var total = MONTHLY.reduce(function(sum, m){ return sum + m.value; }, 0);
    if(total <= 0){
      chart.innerHTML = '<p class="news-empty" style="padding:0;">No incidents logged yet — this chart will populate automatically as entries are added.</p>';
      return;
    }
    var max = Math.max.apply(null, MONTHLY.map(function(m){return m.value;})) || 1;
    chart.innerHTML = MONTHLY.map(function(m){
      var pct = Math.round((m.value / max) * 100);
      return '<div class="bar-col"><div class="bar" data-flag="'+(m.flag?1:0)+'" data-pct="'+pct+'"></div><div class="m-label">'+m.label+'</div></div>';
    }).join('');
  }

  function buildSpendingLog(){
    var list = document.getElementById('spendingLog');
    if(!SPENDING_LOG.length){
      list.innerHTML = '<li class="news-empty" style="grid-column:1/-1; padding:8px 0;">No expenses logged yet. This list will populate as donations are spent.</li>';
      return;
    }
    list.innerHTML = SPENDING_LOG.map(function(entry){
      var d = new Date(entry.date);
      var dateStr = isNaN(d) ? entry.date : d.toLocaleDateString('en-US', { month:'short', day:'numeric' });
      return '<li><span>' + dateStr + ' — ' + entry.desc + ' <span class="mono" style="color:var(--mist);">(' + entry.category + ')</span></span> <span class="chip">$' + entry.amount.toLocaleString() + '</span></li>';
    }).join('');
  }

  function buildIncidentLog(){
    var list = document.getElementById('incidentLog');
    if(!INCIDENT_LOG.length){
      list.innerHTML = '<li class="news-empty" style="grid-column:1/-1; padding:8px 0;">No incidents logged yet. This list will populate as observations are recorded.</li>';
      return;
    }
    list.innerHTML = INCIDENT_LOG.map(function(entry){
      var d = new Date(entry.date);
      var dateStr = isNaN(d) ? entry.date : d.toLocaleDateString('en-US', { month:'2-digit', day:'2-digit' });
      var chipClass = entry.status === 'Verified' ? 'chip' : 'chip pending';
      return '<li><span>' + dateStr + ' — ' + entry.desc + '</span> <span class="' + chipClass + '">' + entry.status + '</span></li>';
    }).join('');
  }

  // Generic: animate a set of .num elements within a container using a values object, keyed in DOM order.
  // Falls back to "—" for any value that's 0 or unset, so an early-stage site never shows a bare 0.
  function animateStatGroup(containerSelector, values, keys){
    var container = document.querySelector(containerSelector);
    if(!container) return;
    container.querySelectorAll('.num').forEach(function(el, i){
      var target = values[keys[i]] || 0;
      if(target <= 0){ el.textContent = '—'; return; }
      var current = 0;
      var step = Math.max(1, Math.round(target / 30));
      var iv = setInterval(function(){
        current += step;
        if(current >= target){ current = target; clearInterval(iv); }
        el.textContent = current.toLocaleString();
      }, 30);
    });
  }
  function animateBars(){
    document.querySelectorAll('.bar').forEach(function(bar){
      var pct = bar.getAttribute('data-pct');
      requestAnimationFrame(function(){ bar.style.height = pct + '%'; });
    });
  }

  // Load everything (in parallel), THEN wire up rendering + scroll-triggered animation.
  // Doing it in this order avoids a race where a card animates to "—" before real data arrives.
  Promise.all([
    loadSiteStats(),
    loadFundingTotals(),
    loadSpendingLog(),
    loadIncidentLog(),
    loadMonthlyIncidents()
  ]).then(function(){
    buildChart();
    buildSpendingLog();
    buildIncidentLog();

    var heroStatsTriggered = false, fundingStatsTriggered = false, chartTriggered = false;
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('in');
          if(entry.target.closest('.hero-inner') && !heroStatsTriggered){
            heroStatsTriggered = true;
            animateStatGroup('.hero-inner .hero-cards', STATS, ['incidents','hours','observers','flyers']);
          }
          if(entry.target.closest('#fundingTotals') && !fundingStatsTriggered){
            fundingStatsTriggered = true;
            animateStatGroup('#fundingTotals', FUNDING, ['raised','spent','balance','expenseCount']);
          }
          if(entry.target.closest('#dashboard') && !chartTriggered){ chartTriggered = true; animateBars(); }
        }
      });
    }, { threshold: 0.2 });
    document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });
  });

  /* ============================================================
     SETTING UP THE DATABASE (Firebase Firestore — free tier, never pauses)

     1. Create a project at console.firebase.google.com (free, no credit card)
     2. In the project, open Firestore Database → Create database → start in
        "production mode" (we set our own security rules next).
     3. Go to the "Rules" tab and paste in the rules from firestore.rules
        (provided alongside this checklist) — public READ-ONLY, no public writes.
     4. Manually create 5 collections via the Console's "Start collection" button
        (exact fields listed in setup-checklist.md): site_stats, funding_totals,
        spending_log, incident_log, monthly_incidents.
     5. Copy your Project ID from Project Settings (gear icon, top left).
     6. Paste it into FIREBASE_PROJECT_ID at the top of this file.
     7. From then on: open Firebase Console → Firestore Database → click into
        any collection → edit documents directly. The site re-reads this data
        on every page load. No file editing, no redeploying, no code — and
        the project never goes to sleep on the free tier.
     ============================================================ */

  // Contact form -> mailto

  // Contact form -> mailto
  var form = document.getElementById('contactForm');
  var status = document.getElementById('formStatus');
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var name = document.getElementById('name').value.trim();
    var email = document.getElementById('email').value.trim();
    var reason = document.getElementById('reason').value;
    var message = document.getElementById('message').value.trim();
    if(!name || !email || !message){
      status.textContent = 'Please fill in all fields before sending.';
      status.classList.add('show');
      return;
    }
    var subject = encodeURIComponent('[Okaloosa Copwatch] ' + reason + ' — ' + name);
    var body = encodeURIComponent('Name: ' + name + '\nEmail: ' + email + '\nReason: ' + reason + '\n\n' + message);
    window.location.href = 'mailto:okaloosacopwatch@gmail.com?subject=' + subject + '&body=' + body;
    status.textContent = 'Opening your email app to send this message…';
    status.classList.add('show');
  });