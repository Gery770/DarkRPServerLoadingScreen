/*
Divergence RP loading screen: rotates the screens and tips, and shows what
Garry's Mod reports while a player joins.

GMod calls these on the page (they have to stay global):
    GameDetails(serverName, serverUrl, mapName, maxPlayers, steamId, gamemode)
    SetFilesTotal(total)    SetFilesNeeded(needed)
    DownloadingFile(file)   SetStatusChanged(status)

Plain ES5 on purpose: GMod's default branch uses an old browser.

Open the page with ?demo in a normal browser to fake a join, and ?slide=N
to hold screen N.
*/
(function () {
    var SLIDE_TIME = 11000;
    var TIP_TIME = 7000;

    var TIPS = [
        "Lost? Type <code>/rules</code> for the rules and <code>/commands</code> for every chat command.",
        "<code>F4</code> &gt; Progress shows your points and exactly what each one unlocks next.",
        "<code>F3</code> opens your inventory. <code>Shift+E</code> picks up what you're looking at.",
        "Points only unlock things. Nothing you've earned is ever capped.",
        "Committing crimes costs police points. You can't be a top cop and a crime boss at once.",
        "New Life Rule: after you die, stay away from where it happened for 3 minutes.",
        "Gun on you? Put your hands up with <code>/surrender</code>. Police arrest, they don't execute.",
        "Saw a crime? <code>/911</code> calls the police to where you are.",
        "Someone breaking the rules? <code>/report</code> it to the staff.",
        "Wanted? <code>/bribe &lt;amount&gt;</code> offers a cop money to clear it. Some might take it.",
        "Spin once a day with <code>/spin</code> for money and perms.",
        "Banked money can't be taken in a hold-up, and it earns interest while you're online.",
        "<code>/pay &lt;name&gt; &lt;amount&gt;</code> pays anyone from anywhere. <code>/cheque</code> writes one only they can cash.",
        "Medics revive downed players. Going down and being revived isn't a new life.",
        "Odd jobs on the job board are the quickest start for civilian points.",
        "Gun Dealers restock with supply runs: buy a supply in F4 &gt; Shop &gt; Supplies.",
        "Selling loot at the fence is where criminal points come from. Get away first.",
        "<code>/dropbag</code> drops your loot bag if you need to run.",
        "Building a base: at most 3 fading doors and 3 doors on the way in, and 4 turns.",
        "Shooting windows must be at least a 0.75x0.75 plate, and work both ways.",
        "Keypads go right next to the door they open. The tool does it for you.",
        "In a raid, the raid card in the top right shows who's left, the timer and what to do.",
        "Raiders out of the raid stay out: dead, arrested or gone means NLR until it's over.",
        "<code>/g</code> talks to your group: the police, or your gang.",
        "<code>/advert</code> puts out an advert for everyone. Selling something? Say it there.",
        "The Mayor is elected with 10 or more players online. <code>/runformayor</code> to stand.",
        "<code>/want &lt;name&gt; &lt;reason&gt;</code> asks the Mayor or Chief to make someone wanted.",
        "Police specialties (SWAT, Detective, Warden, Medic) are picked at the police locker.",
        "Shake off the police after a crime and you'll earn a criminal point for it.",
        "Purple and black checkers or ERROR models? You need Counter-Strike: Source content.",
        "Gangs unlock at the Gang Member rank (30 criminal points): found one or join one, earn gang points, claim turf.",
        "Store clerks pull a shotgun if you look away too long. Keep them covered."
    ];

    function byId(id) { return document.getElementById(id); }

    // Size everything from the window (all of the CSS is in em)
    function scale() {
        var w = window.innerWidth || document.documentElement.clientWidth;
        var h = window.innerHeight || document.documentElement.clientHeight;
        document.body.style.fontSize = Math.max(10, Math.min(h / 54, w / 96)) + "px";
    }
    scale();
    window.onresize = scale;

    // Screens
    var slides = byId("stage").getElementsByTagName("div");
    var list = [];
    for (var i = 0; i < slides.length; i++) {
        if ((" " + slides[i].className + " ").indexOf(" slide ") >= 0) list.push(slides[i]);
    }
    var dots = byId("dots");
    for (var d = 0; d < list.length; d++) dots.appendChild(document.createElement("i"));
    var dotList = dots.getElementsByTagName("i");
    var fill = byId("bar-fill");

    var current = -1;
    function show(n) {
        if (current >= 0) {
            list[current].className = list[current].className.replace(" on", "");
            dotList[current].className = "";
        }
        current = n % list.length;
        list[current].className += " on";
        dotList[current].className = "on";
        var accent = list[current].getAttribute("data-accent");
        fill.className = accent === "white" ? "" : accent;
    }
    // ?slide=N holds one screen (for checking a layout)
    var held = /[?&]slide=(\d+)/.exec(window.location.search);
    show(held ? parseInt(held[1], 10) - 1 : 0);
    if (!held) setInterval(function () { show(current + 1); }, SLIDE_TIME);

    // Tips, shuffled
    var order = [];
    for (var t = 0; t < TIPS.length; t++) order.push(t);
    for (var s = order.length - 1; s > 0; s--) {
        var j = Math.floor(Math.random() * (s + 1));
        var tmp = order[s]; order[s] = order[j]; order[j] = tmp;
    }
    var tipIndex = 0;
    var tipText = byId("tip-text");
    function nextTip() {
        tipText.className = "out";
        setTimeout(function () {
            tipText.innerHTML = TIPS[order[tipIndex % order.length]];
            tipIndex++;
            tipText.className = "";
        }, 500);
    }
    tipText.innerHTML = TIPS[order[0]];
    tipIndex = 1;
    setInterval(nextTip, TIP_TIME);

    // Loading progress
    var filesTotal = 0, filesNeeded = 0, statusPercent = 0;
    var statusEl = byId("status"), percentEl = byId("percent");

    // Rough progress for the steps that don't come with a file count
    // (Workshop addons download through the game's own system)
    var STAGES = [
        ["Retrieving server info", 5], ["Sending client info", 15], ["Client info sent", 20],
        ["Mounting", 30], ["Workshop", 45], ["Downloading", 50], ["Received all Lua files", 75],
        ["Starting Lua", 85], ["Lua started", 90], ["Precaching", 92]
    ];

    function setPercent(p) {
        p = Math.max(0, Math.min(100, Math.round(p)));
        fill.style.width = p + "%";
        percentEl.innerHTML = p + "%";
    }

    function update() {
        var p = statusPercent;
        if (filesTotal > 0) p = Math.max(p, 50 + 25 * (filesTotal - filesNeeded) / filesTotal);
        setPercent(p);
    }

    window.GameDetails = function (serverName, serverUrl, mapName, maxPlayers) {
        if (serverName) byId("server-name").innerHTML = escapeHtml(serverName);
        var info = [];
        if (mapName) info.push(escapeHtml(mapName));
        if (maxPlayers) info.push(maxPlayers + " slots");
        byId("server-info").innerHTML = info.join(" &middot; ");
        demo = false;
    };
    window.SetFilesTotal = function (total) { filesTotal = total; update(); };
    window.SetFilesNeeded = function (needed) { filesNeeded = needed; update(); };
    window.DownloadingFile = function (file) {
        var name = String(file).split("/").pop();
        statusEl.innerHTML = "Downloading " + escapeHtml(name);
    };
    window.SetStatusChanged = function (status) {
        statusEl.innerHTML = escapeHtml(status);
        for (var k = 0; k < STAGES.length; k++) {
            if (String(status).indexOf(STAGES[k][0]) === 0) statusPercent = Math.max(statusPercent, STAGES[k][1]);
        }
        update();
    };

    function escapeHtml(text) {
        return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    // ?demo: fake a join in a normal browser
    var demo = /[?&]demo/.test(window.location.search);
    if (demo) {
        GameDetails("Divergence RP | Semi-Serious | Progression", "", "rp_downtown_tits_v2", 32);
        var steps = ["Retrieving server info...", "Mounting Addons", "Workshop Complete", "Sending client info...",
            "Client info sent!", "Received all Lua files", "Starting Lua...", "Lua started!"];
        var step = 0;
        SetFilesTotal(40); SetFilesNeeded(40);
        setInterval(function () {
            if (filesNeeded > 0 && step >= 5) {
                filesNeeded--;
                SetFilesNeeded(filesNeeded);
                DownloadingFile("materials/divergence/file" + filesNeeded + ".vmt");
                return;
            }
            SetStatusChanged(steps[step % steps.length]);
            step++;
            if (step > steps.length + 4) { step = 0; statusPercent = 0; filesNeeded = 40; }
        }, 1200);
    }
})();
