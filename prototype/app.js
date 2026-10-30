/* Prime Music interactive prototype. Design prototype by Suvarna Myneni, for portfolio purposes; not an Amazon product.
   All songs, artists, albums and playlists below are placeholder example content. */
(function () {
  "use strict";

  // ---------- placeholder data ----------
  var HUES = [12, 200, 280, 140, 330, 40, 170, 230, 300, 90, 0, 260];
  function grad(i) {
    var h = HUES[i % HUES.length], h2 = (h + 50) % 360;
    return "linear-gradient(135deg,hsl(" + h + ",55%,42%),hsl(" + h2 + ",60%,22%))";
  }
  var WORDS = ["Northern Lights", "Paper Planes", "Slow Motion", "Golden Hour", "City Rain", "Open Road", "Neon Bloom", "Low Tide",
    "Satellite", "Wildflower", "Midnight Drive", "Echo Park", "Blue Hours", "Firefly", "Daydream", "Copper Sky", "Static Hearts",
    "Lighthouse", "Morning Run", "Glasshouse", "Afterglow", "Silver Lining", "Weekend Sun", "Long Way Home", "Kite String",
    "Undertow", "Velvet Room", "High Wire", "Small Hours", "Riverbend", "Overpass", "Polaroid"];
  var GENRES = ["Pop", "Rock", "Alternative Rock", "Country", "Blues", "Classical"];
  var MOODS = ["Energetic & Fast Tempo", "Family & Fun", "Happy & Upbeat", "Hard & Heavy", "Party Time & Entertaining", "Relaxed & Laid Back", "Work, Study & Reading"];

  var albums = [], songs = [], byId = {};
  for (var a = 0; a < 6; a++) {
    var al = { id: "a" + (a + 1), kind: "album", title: "Example Album " + String.fromCharCode(65 + a), artist: "Example Artist " + (a + 1),
      genre: GENRES[a % GENRES.length], g: grad(a), prime: a !== 5, tracks: [] };
    for (var t = 0; t < 8; t++) {
      var n = a * 8 + t;
      var s = { id: "s" + (n + 1), kind: "song", title: WORDS[n % WORDS.length] + (n >= WORDS.length ? " (Reprise)" : ""), artist: al.artist,
        album: al.id, no: t + 1, prime: al.prime, dur: 150 + ((n * 37) % 120), g: al.g, lyrics: t === 0 };
      al.tracks.push(s.id); songs.push(s); byId[s.id] = s;
    }
    albums.push(al); byId[al.id] = al;
  }
  var playlists = [];
  var PL = [["Weekend Workout", MOODS[0], "Pop"], ["Laid-Back Sunday", MOODS[5], "Alternative Rock"], ["Heavy Riffs", MOODS[3], "Rock"],
    ["Focus Flow", MOODS[6], "Classical"], ["Road Trip Sing-Along", MOODS[2], "Pop"], ["Kitchen Dance Party", MOODS[4], "Pop"],
    ["Family Car Ride", MOODS[1], "Country"], ["Blues After Dark", MOODS[5], "Blues"], ["Morning Energy", MOODS[0], "Alternative Rock"],
    ["Loud & Fast", MOODS[3], "Rock"]];
  PL.forEach(function (p, i) {
    var tr = [];
    for (var k = 0; k < 8; k++) tr.push(songs[(i * 5 + k * 3) % 40].id);
    var pl = { id: "p" + (i + 1), kind: "playlist", title: p[0], mood: p[1], genre: p[2], tracks: tr, rating: 3 + (i % 3 === 0 ? 2 : 1),
      reviews: 12 + i * 7, desc: "Example playlist for “" + p[1] + "” moments. Placeholder description curated for this prototype.",
      artists: "Example Artist " + (i % 5 + 1) + ", Example Artist " + ((i + 2) % 5 + 1) + " and more" };
    playlists.push(pl); byId[pl.id] = pl;
  });

  // ---------- state ----------
  var st = {
    prime: true, hints: true,
    lib: { s1: true, s3: true },           // two purchased songs from Example Album A ("complete your albums")
    libPl: {}, stack: [], route: null, overlay: null,
    q: [], qi: 0, playing: false, pos: 0, playerOpen: false,
    songGenre: "All Genres", plFilter: "All Playlists", toastT: null, timer: null
  };

  var view = document.getElementById("view"), overlay = document.getElementById("overlay"), screen = document.getElementById("screen");

  // ---------- icons ----------
  var P = {
    menu: "M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z", search: "M10 3a7 7 0 015.6 11.2l5.1 5.1-1.4 1.4-5.1-5.1A7 7 0 1110 3zm0 2a5 5 0 100 10 5 5 0 000-10z",
    back: "M15.4 4.6L8 12l7.4 7.4-1.4 1.4L5.2 12l8.8-8.8z", more: "M12 5.5a1.8 1.8 0 110-3.6 1.8 1.8 0 010 3.6zm0 8.3a1.8 1.8 0 110-3.6 1.8 1.8 0 010 3.6zm0 8.3a1.8 1.8 0 110-3.6 1.8 1.8 0 010 3.6z",
    play: "M7 4l13 8-13 8z", pause: "M6 4h4v16H6zm8 0h4v16h-4z", next: "M5 5l10 7-10 7zm11 0h3v14h-3z", prev: "M19 5L9 12l10 7zM5 5h3v14H5z",
    shuffle: "M14 4h6v6l-2.3-2.3-3.9 3.9-1.4-1.4 3.9-3.9zM4 5.4L5.4 4l14.6 14.6V14h0v6h-6l2.3-2.3z", plus: "M11 4h2v7h7v2h-7v7h-2v-7H4v-2h7z",
    down: "M11 3h2v10l3.5-3.5 1.4 1.4L12 16.8 6.1 10.9l1.4-1.4L11 13zM5 19h14v2H5z", close: "M6.4 5L12 10.6 17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z",
    chev: "M7 9l5 5 5-5z", check: "M9 16.2l-4.2-4.2-1.4 1.4L9 19 21 7l-1.4-1.4z"
  };
  function ic(n, extra) { return '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"' + (extra || "") + '><path d="' + P[n] + '"/></svg>'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function fmt(s) { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }
  function art(item, size, corner) {
    return '<span class="art ' + size + (corner ? " prime-corner" : "") + '" style="--g:' + (item.g || grad(0)) + '">' + (corner ? '<span class="pb">prime</span>' : "") + "</span>";
  }
  function mosaic(pl) {
    return '<span class="mosaic">' + pl.tracks.slice(0, 4).map(function (id) { return '<i style="--g:' + byId[id].g + '"></i>'; }).join("") + "</span>";
  }
  function stars(n, r) { var s = ""; for (var i = 0; i < 5; i++) s += i < n ? "★" : "☆"; return '<span class="stars">' + s + "<span>(" + r + ")</span></span>"; }
  var badge = '<span class="pbadge" aria-label="Prime eligible">prime</span>';

  // ---------- add / buy control (UI kit buttons) ----------
  function control(s) {
    if (st.lib[s.id]) return '<span class="addbox">' + (s.prime ? badge : "") + '<button type="button" class="btn lib" data-act="noop" tabindex="-1">In Library</button></span>';
    if (s.prime && st.prime) return '<span class="addbox">' + badge + '<button type="button" class="btn add" data-hot data-act="add" data-id="' + s.id + '">' + ic("plus", ' style="width:14px;height:14px"') + 'Add</button></span>';
    if (s.prime) return '<span class="addbox"><button type="button" class="btn buy" data-act="buy" data-id="' + s.id + '">$1.29</button><button type="button" class="pbadge" data-hot data-act="upsell" title="$0.00 with Prime">$0.00</button></span>';
    return '<span class="addbox"><button type="button" class="btn buy" data-act="buy" data-id="' + s.id + '">$1.29</button></span>';
  }
  function songRow(s, opts) {
    opts = opts || {};
    var cur = st.q[st.qi] === s.id;
    return '<div class="row' + (cur ? " playing" : "") + '">' +
      (opts.num ? '<span class="num">' + s.no + "</span>" : '<button type="button" data-act="play" data-id="' + s.id + '" aria-label="Play ' + esc(s.title) + '">' + art(s, "s48") + "</button>") +
      '<button type="button" class="meta" style="text-align:left" data-hot data-act="play" data-id="' + s.id + '" data-ctx="' + (opts.ctx || "") + '"><div class="t">' + esc(s.title) +
      (s.lyrics && opts.num ? '<span class="lyrics">LYRICS</span>' : "") + '</div><div class="s">' + esc(s.artist) + " · " + esc(byId[s.album].title) + "</div></button>" +
      (opts.noControl ? "" : control(s)) + '<button type="button" class="more" data-act="more" aria-label="More options">' + ic("more") + "</button></div>";
  }
  function plRow(pl) {
    return '<button type="button" class="row" style="width:100%;text-align:left" data-hot data-act="go" data-r="playlist" data-id="' + pl.id + '">' + mosaic(pl) +
      '<span class="meta"><div class="t" style="font-size:var(--t2)">' + esc(pl.title) + "</div>" + stars(pl.rating, pl.reviews) +
      '<div class="s">' + esc(pl.artists) + "</div></span></button>";
  }
  function card(item) {
    var r = item.kind === "album" ? "album" : "playlist";
    return '<button type="button" class="card" data-hot data-act="go" data-r="' + r + '" data-id="' + item.id + '">' +
      (item.kind === "album" ? art(item, "", item.prime) : '<span class="art" style="--g:' + byId[item.tracks[0]].g + '"></span>') +
      '<div class="t">' + esc(item.title) + '</div><div class="s">' + esc(item.artist || item.mood) + "</div></button>";
  }
  function appbar(title, opt) {
    opt = opt || {};
    return '<div class="appbar">' + (opt.back ? '<button type="button" class="icon-btn" data-hot data-act="back" aria-label="Back">' + ic("back") + "</button>"
      : '<button type="button" class="icon-btn" data-hot data-act="drawer" aria-label="Open menu">' + ic("menu") + "</button>") +
      "<h3>" + esc(title) + "</h3>" + (opt.right || '<button type="button" class="icon-btn" data-act="search" aria-label="Search">' + ic("search") + "</button>") + "</div>";
  }
  function tabs(active, base) {
    return '<div class="tabs" role="tablist">' + ["songs", "albums", "playlists"].map(function (t) {
      return '<button type="button" role="tab" aria-selected="' + (t === active) + '" data-hot data-act="go" data-r="' + base + '" data-tab="' + t + '">' + t.toUpperCase() + "</button>";
    }).join("") + "</div>";
  }
  function mini() {
    if (!st.q.length) return "";
    var s = byId[st.q[st.qi]];
    return '<button type="button" class="mini" data-hot data-act="player"><span class="bar" style="width:' + (st.pos / s.dur * 100) + '%"></span>' + art(s, "s48") +
      '<span class="meta"><div class="t">' + esc(s.title) + '</div><div class="s">' + esc(s.artist) + "</div></span>" +
      '<span class="icon-btn" data-act="toggle" role="button" aria-label="' + (st.playing ? "Pause" : "Play") + '">' + ic(st.playing ? "pause" : "play") + "</span></button>";
  }
  var exTag = '<span class="example-tag">Example content · design prototype by Suvarna Myneni · not an Amazon product</span>';

  // ---------- screens ----------
  var R = {};
  R.welcome = function () {
    return '<div class="welcome"><h2>Good News! Your music collection just got a lot bigger.</h2>' +
      "<p>Prime Music gives you unlimited access to over a million songs and hundreds of playlists. And the best part is… it’s FREE for Prime members.</p>" +
      '<button type="button" class="btn add wide" data-hot data-act="continue">Continue</button>' +
      '<p class="fine">Prototype: no account or sign-in. Continue opens Prime Music.</p>' +
      '<div class="wordmark">prime <b>music</b></div></div>';
  };
  R.prime = function (r) {
    var tab = r.tab || "songs", h = appbar("Prime Music") + tabs(tab, "prime");
    if (tab === "songs") {
      h += '<button type="button" class="filter" data-hot data-act="genremenu">' + esc(st.songGenre) + "</button>";
      var list = songs.filter(function (s) { return s.prime && (st.songGenre === "All Genres" || byId[s.album].genre === st.songGenre); });
      h += list.slice(0, 14).map(function (s) { return songRow(s); }).join("");
    } else if (tab === "albums") {
      h += '<button type="button" class="filter" data-hot data-act="genremenu">' + esc(st.songGenre) + "</button>";
      var als = albums.filter(function (a) { return a.prime && (st.songGenre === "All Genres" || a.genre === st.songGenre); });
      h += '<div class="grid2">' + als.map(card).join("") + "</div>";
    } else {
      h += '<button type="button" class="filter" data-hot data-act="plmenu">' + esc(st.plFilter === "All Playlists" ? "All Moods & Genres" : st.plFilter) + "</button>";
      if (r.loading) h += '<div class="loading"><i></i></div>';
      else {
        var f = st.plFilter, pls = playlists.filter(function (p) {
          return f === "All Playlists" || f === p.mood || f === p.genre || (f === "Recommended for You" && /[13579]$/.test(p.id));
        });
        h += pls.length ? pls.map(plRow).join("") : '<div class="empty">No example playlists for “' + esc(f) + '” yet.<br><button type="button" class="btn lib" data-act="plpick" data-v="All Playlists">Show all playlists</button></div>';
      }
    }
    return h + exTag;
  };
  R.store = function () {
    var rec = [songs[0], songs[9], songs[2], songs[41], songs[17]];
    return appbar("Music Store") +
      '<div class="banner"><div class="wordmark">prime <b>music</b></div><h4>Your Collection Just Got Bigger</h4><p>Over a million songs and hundreds of playlists. FREE with your Prime membership.</p>' +
      '<button type="button" data-hot data-act="go" data-r="prime" data-tab="songs">Explore Prime Music ›</button></div>' +
      '<div class="section-h"><h4>Songs Recommended for You</h4><button type="button" data-act="go" data-r="prime" data-tab="songs">SEE MORE ›</button></div>' +
      rec.map(function (s) { return songRow(s); }).join("") +
      '<div class="section-h"><h4>Albums Recommended for You</h4><button type="button" data-act="go" data-r="prime" data-tab="albums">SEE MORE ›</button></div>' +
      '<div class="hscroll">' + albums.map(card).join("") + "</div>" +
      '<div class="section-h"><h4>Popular Prime Playlists</h4><button type="button" data-act="go" data-r="prime" data-tab="playlists">SEE ALL ›</button></div>' +
      '<div class="hscroll">' + playlists.slice(0, 6).map(card).join("") + "</div>" + exTag;
  };
  R.album = function (r) {
    var al = byId[r.id], all = al.tracks.every(function (id) { return st.lib[id]; }), h = appbar("", { back: true, right: '<button type="button" class="icon-btn" data-act="more" aria-label="More">' + ic("more") + "</button>" });
    h += '<div class="detail-head">' + art(al, "", al.prime) + '<div><h3>' + esc(al.title) + "</h3><p>" + esc(al.artist) + "</p><p>" + esc(al.genre) + " · " + al.tracks.length + " songs</p>" + (al.prime ? "<p>" + badge + "</p>" : "") + "</div></div>";
    h += '<div class="buybox">';
    if (al.prime && st.prime) {
      h += all ? '<button type="button" class="btn add wide" data-hot data-act="playall" data-id="' + al.id + '">' + ic("play", ' style="width:16px;height:16px"') + " Play now</button>"
        : '<button type="button" class="btn add wide" data-hot data-act="addall" data-id="' + al.id + '">' + ic("plus", ' style="width:16px;height:16px"') + " Add album to library</button>";
    } else if (al.prime) {
      h += '<button type="button" class="btn add wide" data-hot data-act="upsell">Listen free with Prime</button><button type="button" class="btn buy wide" data-act="buy">Buy MP3 album</button>';
    } else h += '<button type="button" class="btn buy wide" data-act="buy">Buy MP3 album</button><p class="s" style="margin:0;color:var(--sub);font-size:12px">This example album is not Prime-eligible.</p>';
    h += "</div>";
    return h + al.tracks.map(function (id) { return songRow(byId[id], { num: true, ctx: al.id }); }).join("") + exTag;
  };
  R.playlist = function (r) {
    var pl = byId[r.id], inLib = st.libPl[pl.id], h = appbar("", { back: true, right: '<button type="button" class="icon-btn" data-act="more" aria-label="More">' + ic("more") + "</button>" });
    h += '<div class="detail-head"><span style="transform:scale(1.65);transform-origin:top left;width:120px;height:120px;display:block">' + mosaic(pl) + "</span><div><h3>" + esc(pl.title) + "</h3>" + stars(pl.rating, pl.reviews) +
      "<p>" + pl.tracks.length + " songs</p><p>" + badge + "</p></div></div>";
    h += '<p class="desc">' + esc(pl.desc) + "</p>";
    h += '<div class="actions"><button type="button" class="icon-btn" data-hot data-act="playall" data-id="' + pl.id + '" aria-label="Play">' + ic("play") + "</button>" +
      '<button type="button" class="icon-btn" data-act="shuffle" data-id="' + pl.id + '" aria-label="Shuffle">' + ic("shuffle") + "</button>" +
      (st.prime ? '<button type="button" class="icon-btn' + (inLib ? " on" : "") + '" data-hot data-act="addpl" data-id="' + pl.id + '" aria-label="' + (inLib ? "In library" : "Add playlist to library") + '">' + ic(inLib ? "check" : "plus") + "</button>" : "") +
      '<button type="button" class="icon-btn" data-act="download" aria-label="Download" ' + (inLib ? "" : "disabled") + ">" + ic("down") + "</button></div>";
    if (!st.prime) h += '<div class="buybox"><button type="button" class="btn add wide" data-hot data-act="upsell">Listen now with Prime</button></div>';
    return h + pl.tracks.map(function (id) { return songRow(byId[id], { ctx: pl.id }); }).join("") + exTag;
  };
  R.library = function (r) {
    var tab = r.tab || "albums", h = appbar("Your Library") + tabs(tab, "library");
    var ls = songs.filter(function (s) { return st.lib[s.id]; });
    if (tab === "songs") h += ls.length ? ls.map(function (s) { return songRow(s, { noControl: true }); }).join("") : "";
    else if (tab === "albums") {
      var als = albums.filter(function (a) { return a.tracks.some(function (id) { return st.lib[id]; }); });
      h += '<div class="grid2">' + als.map(function (a) {
        var n = a.tracks.filter(function (id) { return st.lib[id]; }).length;
        return '<button type="button" class="card" data-hot data-act="go" data-r="libalbum" data-id="' + a.id + '">' + art(a, "", a.prime) + '<div class="t">' + esc(a.title) + '</div><div class="s">' + n + " of " + a.tracks.length + " songs</div></button>";
      }).join("") + "</div>";
    } else {
      var pls = playlists.filter(function (p) { return st.libPl[p.id]; });
      h += pls.length ? pls.map(plRow).join("") : '<div class="empty">No playlists in your library yet.<br>Open a Prime Playlist and tap + to add it.<br><button type="button" class="btn add" data-hot data-act="go" data-r="prime" data-tab="playlists">Browse Prime Playlists</button></div>';
    }
    return h + exTag;
  };
  R.libalbum = function (r) {
    var al = byId[r.id], own = al.tracks.filter(function (id) { return st.lib[id]; }), rest = al.tracks.filter(function (id) { return !st.lib[id]; });
    var h = appbar("", { back: true, right: '<button type="button" class="icon-btn" data-act="more" aria-label="More">' + ic("more") + "</button>" });
    h += '<div class="detail-head">' + art(al, "") + "<div><h3>" + esc(al.title) + "</h3><p>" + esc(al.artist) + "</p></div></div>";
    h += '<div class="actions"><button type="button" class="icon-btn" data-hot data-act="playlib" data-id="' + al.id + '" aria-label="Play">' + ic("play") + "</button>" +
      '<button type="button" class="icon-btn" data-act="shuffle" data-id="' + al.id + '" aria-label="Shuffle">' + ic("shuffle") + "</button>" +
      '<button type="button" class="icon-btn" data-act="download" aria-label="Download">' + ic("down") + "</button></div>";
    h += own.map(function (id) { return songRow(byId[id], { num: true, noControl: true }); }).join("");
    if (rest.length && al.prime) {
      if (r.expanded) h += rest.map(function (id) { return songRow(byId[id], { num: true }); }).join("");
      else h += '<button type="button" class="reveal" data-hot data-act="expand">' + ic("chev", ' style="width:18px;height:18px"') + " " + rest.length + " more Prime songs available from this album</button>";
    }
    return h + exTag;
  };

  // ---------- overlays ----------
  var O = {};
  O.drawer = function () {
    var cur = st.route.name, tab = st.route.tab;
    function item(label, r, t, extra) {
      var on = cur === r && (!t || t === tab);
      return '<button type="button" class="item" data-hot data-act="go" data-r="' + r + '"' + (t ? ' data-tab="' + t + '"' : "") + (on ? ' aria-current="true"' : "") + ">" + label + (extra || "") + "</button>";
    }
    return '<div class="scrim" data-act="close"><nav class="drawer" aria-label="App menu">' +
      '<div class="grp prime">Prime ' + badge + "</div>" + item("Prime Music", "prime", "songs") + item("Prime Playlists", "prime", "playlists") +
      '<div class="grp">Your Library</div>' + item("Playlists", "library", "playlists") + item("Albums", "library", "albums") + item("Songs", "library", "songs") +
      '<div class="grp">Music Store</div>' + item("Store Home", "store") + item("Best Sellers", "store") + item("New Releases", "store") +
      '<div class="grp">Prototype</div><button type="button" class="item" data-act="go" data-r="welcome">Welcome screen</button></nav></div>';
  };
  O.plmenu = function () {
    function b(v) { return '<button type="button" data-hot data-act="plpick" data-v="' + esc(v) + '"' + (st.plFilter === v ? ' aria-current="true"' : "") + ">" + esc(v) + "</button>"; }
    return '<div class="scrim" data-act="close"></div><div class="menu" role="menu">' + b("All Playlists") + b("Recommended for You") +
      '<div class="grp">Browse by Mood &amp; Activity</div>' + MOODS.map(b).join("") + '<div class="grp">Browse by Genre</div>' + GENRES.map(b).join("") + "</div>";
  };
  O.genremenu = function () {
    function b(v) { return '<button type="button" data-hot data-act="genrepick" data-v="' + esc(v) + '"' + (st.songGenre === v ? ' aria-current="true"' : "") + ">" + esc(v) + "</button>"; }
    return '<div class="scrim" data-act="close"></div><div class="menu" role="menu">' + b("All Genres") + GENRES.map(b).join("") + "</div>";
  };
  O.upsell = function () {
    return '<div class="scrim"><div class="modal" role="dialog" aria-label="Get started with Prime"><h3>Get Started with Prime</h3>' +
      "<p>Prime members get unlimited, ad-free access to over a million songs and hundreds of playlists for FREE.</p>" +
      '<button type="button" class="btn add wide" data-hot data-act="trial">Listen Free for 30 Days</button>' +
      '<button type="button" class="text-btn" data-hot data-act="close">Not Now</button>' +
      '<p class="note">Prototype: no sign-up or payment. “Listen Free” switches this demo to the Prime member view.</p></div></div>';
  };
  O.player = function () {
    var s = byId[st.q[st.qi]], pct = st.pos / s.dur * 100;
    return '<div class="player" role="dialog" aria-label="Now Playing">' + '<div class="appbar"><button type="button" class="icon-btn" data-hot data-act="closeplayer" aria-label="Close player">' + ic("close") + "</button><h3>Now Playing</h3>" +
      '<button type="button" class="icon-btn" data-act="more" aria-label="More">' + ic("more") + "</button></div>" +
      '<div class="big" style="--g:' + s.g + '">' + (s.prime ? '<span class="pb">prime</span>' : "") + '<span class="ex">Placeholder artwork</span></div>' +
      '<div class="scrub" id="scrub" data-hot data-act="seek"><i style="width:' + pct + '%"></i><b style="left:' + pct + '%"></b></div>' +
      '<div class="times"><span id="tpos">' + fmt(st.pos) + "</span><span>" + fmt(s.dur) + "</span></div>" +
      '<div class="info"><h3>' + esc(s.title) + "</h3><p>" + esc(s.artist) + " · " + esc(byId[s.album].title) + "</p></div>" +
      '<div class="transport"><button type="button" class="icon-btn" data-hot data-act="prev" aria-label="Previous"' + (st.qi === 0 && st.pos < 3 ? " disabled" : "") + ">" + ic("prev") + "</button>" +
      '<button type="button" class="icon-btn pp" data-hot data-act="toggle" aria-label="' + (st.playing ? "Pause" : "Play") + '">' + ic(st.playing ? "pause" : "play") + "</button>" +
      '<button type="button" class="icon-btn" data-hot data-act="next" aria-label="Next"' + (st.qi >= st.q.length - 1 ? " disabled" : "") + ">" + ic("next") + "</button></div>" +
      '<div style="text-align:center;padding:0 16px">' + (st.lib[s.id] ? '<span class="btn lib">In Library</span>' : control(s)) + "</div>" +
      '<span class="example-tag">No audio · track ' + (st.qi + 1) + " of " + st.q.length + "</span></div>";
  };

  // ---------- render / navigation ----------
  function render(keepScroll) {
    var top = view.scrollTop;
    var r = st.route;
    view.innerHTML = R[r.name](r) + (r.name !== "welcome" ? mini() : "");
    if (keepScroll) view.scrollTop = top; else view.scrollTop = 0;
    overlay.innerHTML = st.playerOpen ? O.player() : "";
    if (st.overlay) overlay.innerHTML += O[st.overlay]();
    screen.classList.toggle("hints", st.hints);
    syncList();
    var hash = "#" + r.name + (r.id ? "/" + r.id : "") + (r.tab ? "/" + r.tab : "");
    if (st.playerOpen) hash = "#player"; else if (st.overlay) hash = "#" + st.overlay;
    if (location.hash !== hash) history.replaceState(null, "", hash);
  }
  function go(name, opts, replace) {
    opts = opts || {};
    if (st.route && !replace) st.stack.push(st.route);
    st.route = { name: name, id: opts.id, tab: opts.tab || (name === "prime" ? "songs" : name === "library" ? "albums" : undefined) };
    st.overlay = null; st.playerOpen = false;
    render();
  }
  function back() {
    if (st.overlay) { st.overlay = null; render(true); return; }
    if (st.playerOpen) { st.playerOpen = false; render(true); return; }
    var prev = st.stack.pop();
    if (prev) { st.route = prev; render(); }
  }
  function toast(msg) {
    var old = screen.querySelector(".toast"); if (old) old.remove();
    var t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); t.textContent = msg;
    screen.appendChild(t); clearTimeout(st.toastT); st.toastT = setTimeout(function () { t.remove(); }, 2600);
  }

  // ---------- playback (simulated, no audio) ----------
  function startQueue(ids, i) {
    st.q = ids; st.qi = i || 0; st.pos = 0; st.playing = true; st.playerOpen = true; st.overlay = null;
    tick(); render(true);
  }
  function tick() {
    clearInterval(st.timer);
    if (!st.playing) return;
    st.timer = setInterval(function () {
      var s = byId[st.q[st.qi]]; st.pos += 1;
      if (st.pos >= s.dur) { if (st.qi < st.q.length - 1) { st.qi++; st.pos = 0; render(true); } else { st.playing = false; st.pos = 0; clearInterval(st.timer); render(true); } return; }
      var pct = st.pos / s.dur * 100, sc = document.getElementById("scrub");
      if (sc) { sc.firstChild.style.width = pct + "%"; sc.lastChild.style.left = pct + "%"; document.getElementById("tpos").textContent = fmt(st.pos); }
      var bar = view.querySelector(".mini .bar"); if (bar) bar.style.width = pct + "%";
    }, 1000);
  }
  function canPlay(s) { return st.lib[s.id] || (s.prime && st.prime); }

  // ---------- events ----------
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-act]");
    if (!el || el.disabled) return;
    var act = el.getAttribute("data-act"), id = el.getAttribute("data-id");
    if (act === "close" && e.target !== el) return; // clicks inside drawer content
    switch (act) {
      case "noop": return;
      case "go": go(el.getAttribute("data-r"), { id: id, tab: el.getAttribute("data-tab") || undefined }); return;
      case "back": back(); return;
      case "home": go("prime", { tab: "songs" }); return;
      case "drawer": st.overlay = "drawer"; st.playerOpen = false; render(true); return;
      case "close": st.overlay = null; render(true); return;
      case "continue": go("prime", { tab: "songs" }); toast("Welcome to Prime Music (example content)"); return;
      case "search": toast("Search isn’t part of this prototype"); return;
      case "more": toast("More options: not part of this prototype"); return;
      case "download": toast("Download started (simulated)"); return;
      case "buy": toast("Purchase is out of scope for this prototype"); return;
      case "upsell": st.overlay = "upsell"; render(true); return;
      case "trial": setPrime(true); st.overlay = null; render(true); toast("Demo switched to the Prime member view"); return;
      case "plmenu": st.overlay = "plmenu"; render(true); return;
      case "genremenu": st.overlay = "genremenu"; render(true); return;
      case "genrepick": st.songGenre = el.getAttribute("data-v"); st.overlay = null; render(); return;
      case "plpick":
        st.plFilter = el.getAttribute("data-v"); st.overlay = null; st.route.loading = true; render();
        setTimeout(function () { st.route.loading = false; if (st.route.name === "prime") render(); }, 700); return;
      case "add":
        el.classList.add("busy"); el.disabled = true;
        setTimeout(function () { st.lib[id] = true; render(true); toast("Added to your library"); }, 600); return;
      case "addall":
        el.classList.add("busy"); el.disabled = true; el.textContent = "Adding…";
        setTimeout(function () { byId[id].tracks.forEach(function (t) { st.lib[t] = true; }); render(true); toast("This Prime album was added to your library."); }, 900); return;
      case "addpl":
        if (st.libPl[id]) { toast("Already in your library"); return; }
        st.libPl[id] = true; byId[id].tracks.forEach(function (t) { st.lib[t] = true; }); render(true); toast("Playlist added to your library"); return;
      case "expand": st.route.expanded = true; render(true); return;
      case "play": {
        var s = byId[id];
        if (!canPlay(s)) { if (s.prime) { st.overlay = "upsell"; render(true); } else toast("Buy this song to play it (purchase is out of scope)"); return; }
        var ctx = el.getAttribute("data-ctx"), list = ctx && byId[ctx] ? byId[ctx].tracks.filter(function (t) { return canPlay(byId[t]); }) : [id];
        startQueue(list, Math.max(0, list.indexOf(id))); return;
      }
      case "playall": case "shuffle": {
        var c = byId[id]; if (!st.prime && !c.tracks.some(function (t) { return st.lib[t]; })) { st.overlay = "upsell"; render(true); return; }
        var ids = c.tracks.filter(function (t) { return canPlay(byId[t]); });
        if (act === "shuffle") ids = ids.slice().sort(function (x, y) { return ((x.length * 7 + x.charCodeAt(1)) % 5) - ((y.length * 7 + y.charCodeAt(1)) % 5); });
        startQueue(ids, 0); return;
      }
      case "playlib": startQueue(byId[id].tracks.filter(function (t) { return st.lib[t]; }), 0); return;
      case "player": if (e.target.closest('[data-act="toggle"]')) return; st.playerOpen = true; render(true); return;
      case "closeplayer": st.playerOpen = false; render(true); return;
      case "toggle": st.playing = !st.playing; tick(); render(true); return;
      case "next": if (st.qi < st.q.length - 1) { st.qi++; st.pos = 0; render(true); } return;
      case "prev": if (st.pos > 3) st.pos = 0; else if (st.qi > 0) { st.qi--; st.pos = 0; } render(true); return;
      case "seek": {
        var rect = el.getBoundingClientRect(), s2 = byId[st.q[st.qi]];
        st.pos = Math.round((e.clientX - rect.left) / rect.width * s2.dur); render(true); return;
      }
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") back();
    if (e.key === " " && st.q.length && e.target === document.body) { e.preventDefault(); st.playing = !st.playing; tick(); render(true); }
  });

  // ---------- side panel ----------
  var SCREENS = [
    ["Welcome (Prime member)", function () { go("welcome"); }, "welcome"],
    ["Prime Music · Songs", function () { go("prime", { tab: "songs" }); }, "prime//songs"],
    ["Prime Music · Albums", function () { go("prime", { tab: "albums" }); }, "prime//albums"],
    ["Prime Playlists · moods & genres", function () { go("prime", { tab: "playlists" }); }, "prime//playlists"],
    ["Mood & genre filter list", function () { go("prime", { tab: "playlists" }); st.overlay = "plmenu"; render(); }, "plmenu"],
    ["Playlist detail", function () { go("playlist", { id: "p1" }); }, "playlist/p1"],
    ["Album detail · add to library", function () { go("album", { id: "a2" }); }, "album/a2"],
    ["Now Playing", function () { if (!st.q.length) { st.q = byId.a2.tracks.slice(); st.qi = 0; st.pos = 0; } st.playerOpen = true; render(true); }, "player"],
    ["Your Library", function () { go("library", { tab: "albums" }); }, "library//albums"],
    ["Library album · complete your albums", function () { go("libalbum", { id: "a1" }); }, "libalbum/a1"],
    ["Navigation drawer (Prime section)", function () { st.overlay = "drawer"; st.playerOpen = false; render(true); }, "drawer"],
    ["Music Store home", function () { go("store"); }, "store"],
    ["Prime upsell (non-Prime)", function () { setPrime(false); go("store"); st.overlay = "upsell"; render(true); }, "upsell"]
  ];
  var listEl = document.getElementById("screens");
  listEl.innerHTML = SCREENS.map(function (s, i) { return '<li><button type="button" data-screen="' + i + '"><span>' + (i + 1) + "</span>" + esc(s[0]) + "</button></li>"; }).join("");
  listEl.addEventListener("click", function (e) {
    var b = e.target.closest("[data-screen]"); if (!b) return; e.stopPropagation();
    SCREENS[+b.getAttribute("data-screen")][1]();
    if (window.matchMedia("(max-width:820px)").matches) window.scrollTo({ top: 0, behavior: "smooth" });
  });
  function key() {
    if (st.playerOpen) return "player"; if (st.overlay) return st.overlay;
    var r = st.route; return r.name + (r.id ? "/" + r.id : "") + (r.tab ? "//" + r.tab : "");
  }
  function syncList() {
    var k = key();
    Array.prototype.forEach.call(listEl.querySelectorAll("button"), function (b, i) {
      var target = SCREENS[i][2];
      if (k === target) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
    });
  }
  function setPrime(v) {
    st.prime = v;
    var r = document.querySelector('input[name="who"][value="' + (v ? "prime" : "nonprime") + '"]'); if (r) r.checked = true;
  }
  document.querySelectorAll('input[name="who"]').forEach(function (r) {
    r.addEventListener("change", function () { st.prime = r.value === "prime"; st.overlay = null; render(true); toast(st.prime ? "Viewing as a Prime member" : "Viewing as a non-Prime customer"); });
  });
  document.getElementById("hints").addEventListener("change", function (e) { st.hints = e.target.checked; render(true); });
  document.getElementById("help").addEventListener("click", function (e) { e.stopPropagation(); document.getElementById("panel").scrollIntoView({ behavior: "smooth" }); });

  // ---------- start (supports deep links like #album/a2) ----------
  var h = location.hash.replace("#", "").split("/");
  st.route = { name: "welcome" };
  if (R[h[0]] && h[0] !== "welcome") {
    var hid = h[1] && byId[h[1]] ? h[1] : undefined, htab = hid ? h[2] : h[1];
    if (!hid && h[0] === "album") hid = "a2"; if (!hid && h[0] === "playlist") hid = "p1"; if (!hid && h[0] === "libalbum") hid = "a1";
    if (["songs", "albums", "playlists"].indexOf(htab) < 0) htab = h[0] === "prime" ? "songs" : h[0] === "library" ? "albums" : undefined;
    st.route = { name: h[0], id: hid, tab: htab }; st.stack = [{ name: "prime", tab: "songs" }];
  }
  render();
})();
