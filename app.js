
const SUPABASE_URL = "https://lkbasdgnoibamolpelhc.supabase.co";
const SUPABASE_KEY = "sb_publishable_7weL-1twNE-swPYqtpMYmA_iJCILiNB";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let listings = [];
let currentUser = null;
let profileName = "";
let category = "Wszystkie";
let mineOnly = false;

const $ = id => document.getElementById(id);

function money(n) {
  return Number(n).toLocaleString("pl-PL", {
    style: "currency",
    currency: "PLN"
  });
}

function toast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  setTimeout(() => $("toast").classList.remove("show"), 2600);
}

function mapListing(x) {
  return {
    id: x.id,
    owner_id: x.owner_id,
    name: x.title,
    price: x.price,
    cat: x.category,
    desc: x.description || "",
    emoji: "📦",
    owner: x.owner_name || "Sprzedawca",
    status: x.status
  };
}

async function loadListings() {
  let query = db.from("listings")
    .select("*")
    .order("created_at", { ascending: false });

  if (currentUser) {
    query = query.or(
      `status.eq.active,owner_id.eq.${currentUser.id}`
    );
  } else {
    query = query.eq("status", "active");
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    toast("Nie udało się pobrać ogłoszeń.");
    return;
  }

  listings = (data || []).map(mapListing);
  render();
}

async function loadProfile() {
  if (!currentUser) return;

  const { data, error } = await db
    .from("profiles")
    .select("display_name")
    .eq("id", currentUser.id)
    .maybeSingle();

  if (!error && data && data.display_name) {
    profileName = data.display_name;
  } else {
    profileName = "";
  }
}

function render() {
  const q = $("search").value.toLowerCase();

  const shown = listings.filter(x =>
    (category === "Wszystkie" || x.cat === category) &&
    x.name.toLowerCase().includes(q) &&
    (!mineOnly || (currentUser && x.owner_id === currentUser.id))
  );

  $("products").innerHTML = "";

  shown.forEach(x => {
    const el = document.createElement("article");
    el.className = "product";

    const ph = document.createElement("div");
    ph.className = "photo";
    ph.textContent = x.emoji;

    const body = document.createElement("div");
    body.className = "productbody";

    const h = document.createElement("h3");
    h.textContent = x.name;

    const p = document.createElement("div");
    p.className = "price";
    p.textContent = money(x.price);

    const m = document.createElement("div");
    m.className = "muted";
    m.textContent = x.cat + " · " + x.owner;

    const b = document.createElement("button");
    b.className = "outline";
    b.style.width = "100%";
    b.style.marginTop = "9px";
    b.textContent = "Szczegóły";
    b.onclick = () => detail(x);

    body.append(h, p, m, b);
    el.append(ph, body);
    $("products").append(el);
  });

  $("listingCount").textContent = shown.length + " ofert";

  const own = currentUser
    ? listings.filter(x => x.owner_id === currentUser.id).length
    : 0;

  $("myListings").textContent = own;
  $("adminListings").textContent = listings.length;
}

function detail(x) {
  $("detailTitle").textContent = x.name;
  $("detailContent").innerHTML = "";

  const p = document.createElement("p");
  p.textContent = x.emoji + "  " + money(x.price);

  const d = document.createElement("p");
  d.textContent = x.desc || "Brak opisu.";

  const c = document.createElement("p");
  c.className = "muted";
  c.textContent = "Kategoria: " + x.cat + " · Sprzedawca: " + x.owner;

  const note = document.createElement("p");
  note.className = "tiny muted";
  note.textContent = x.status === "pending"
    ? "Ogłoszenie oczekuje na zatwierdzenie."
    : "Zakup i płatności nie są jeszcze aktywne.";

  $("detailContent").append(p, d, c, note);
  $("detailDialog").showModal();
}

function open(id) {
  $(id).showModal();
}

function showAccount() {
  const dialog = $("accountDialog");

  dialog.innerHTML = `
    <div class="dialog-head">
      <h2>Moje konto</h2>
      <button class="x" id="closeAccount">×</button>
    </div>

    <p id="accountStatus"></p>

    ${currentUser ? `
      <p>Zalogowano jako: <strong>${currentUser.email}</strong></p>

      <label>Nazwa sprzedawcy
        <input id="displayName" type="text"
          placeholder="Wpisz nazwę sklepu"
          value="${profileName.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}">
      </label>

      <button class="primary" id="saveName">
        Zapisz nazwę
      </button>

      <button class="outline" id="logoutBtn">
        Wyloguj się
      </button>
    ` : `
      <label>Adres e-mail
        <input id="authEmail" type="email" placeholder="twoj@email.pl">
      </label>

      <label>Hasło
        <input id="authPassword" type="password"
          placeholder="Minimum 6 znaków">
      </label>

      <button class="primary" id="registerBtn">
        Utwórz konto
      </button>

      <button class="outline" id="loginBtn">
        Zaloguj się
      </button>

      <p class="tiny muted">
        Po rejestracji może być wymagane potwierdzenie adresu e-mail.
      </p>
    `}
  `;

  $("closeAccount").onclick = () => dialog.close();

  if (currentUser) {
    $("saveName").onclick = async () => {
      const name = $("displayName").value.trim();

      if (!name) return toast("Wpisz nazwę.");

      const { error } = await db
        .from("profiles")
        .update({ display_name: name })
        .eq("id", currentUser.id);

      if (error) return toast(error.message);

      const { error: listingsError } = await db
        .from("listings")
        .update({ owner_name: name })
        .eq("owner_id", currentUser.id);

      if (listingsError) {
        return toast("Nazwa profilu zapisana, ale nie udało się zaktualizować ogłoszeń.");
      }

      profileName = name;
      toast("Zapisano nazwę sprzedawcy.");
      dialog.close();
      await loadListings();
    };

    $("logoutBtn").onclick = async () => {
      const { error } = await db.auth.signOut();

      if (error) return toast(error.message);

      dialog.close();
      toast("Wylogowano.");
      await refreshAccount();
    };
  } else {
    $("registerBtn").onclick = async () => {
      const email = $("authEmail").value.trim();
      const password = $("authPassword").value;

      if (!email || password.length < 6) {
        return toast("Podaj e-mail i hasło (minimum 6 znaków).");
      }

      const { error } = await db.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: "https://zarabiaj24.pages.dev"
        }
      });

      if (error) return toast(error.message);

      $("accountStatus").textContent =
        "Konto utworzone. Jeśli wymagane, potwierdź e-mail.";

      toast("Sprawdź swoją pocztę.");
    };

    $("loginBtn").onclick = async () => {
      const email = $("authEmail").value.trim();
      const password = $("authPassword").value;

      const { error } = await db.auth.signInWithPassword({
        email,
        password
      });

      if (error) return toast(error.message);

      dialog.close();
      toast("Zalogowano.");
      await refreshAccount();
    };
  }

  dialog.showModal();
}

async function refreshAccount() {
  const { data } = await db.auth.getUser();
  currentUser = data.user || null;

  if (currentUser) {
    await loadProfile();
  } else {
    profileName = "";
  }

  mineOnly = false;
  $("showMy").textContent = "Pokaż moje ogłoszenia";

  await loadListings();
}

$("heroSell").onclick = $("navSell").onclick = () => {
  if (!currentUser) {
    toast("Najpierw zaloguj się lub utwórz konto.");
    showAccount();
    return;
  }

  open("listingDialog");
};

$("accountBtn").onclick = showAccount;

document.querySelectorAll("[data-close]").forEach(b => {
  b.onclick = () => b.closest("dialog").close();
});

$("listingForm").onsubmit = async e => {
  e.preventDefault();

  if (!currentUser) {
    return toast("Najpierw zaloguj się.");
  }

  const title = $("productName").value.trim();
  const price = Number($("productPrice").value);

  if (!title || !price || price <= 0) {
    return toast("Sprawdź nazwę i cenę.");
  }

  const { error } = await db.from("listings").insert({
    owner_id: currentUser.id,
    owner_name: profileName || "Sprzedawca",
    title,
    description: $("productDescription").value,
    price,
    category: $("productCategory").value,
    item_condition: "Nie podano",
    city: "Nie podano",
    images: [],
    status: "active"
  });

  if (error) {
    console.error(error);
    return toast("Błąd dodawania: " + error.message);
  }

  e.target.reset();
  $("listingDialog").close();

  toast("Ogłoszenie opublikowane!");
  await loadListings();
};

$("search").oninput = render;

document.querySelectorAll("[data-cat]").forEach(b => {
  b.onclick = () => {
    category = b.dataset.cat;

    document.querySelectorAll("[data-cat]").forEach(z => {
      z.classList.toggle("selected", z === b);
    });

    render();
  };
});

$("showMy").onclick = () => {
  if (!currentUser) {
    return showAccount();
  }

  mineOnly = !mineOnly;

  $("showMy").textContent = mineOnly
    ? "Pokaż wszystkie ogłoszenia"
    : "Pokaż moje ogłoszenia";

  render();
  $("sellerPanel").scrollIntoView({ behavior: "smooth" });
};

$("navAdmin").onclick = () => {
  $("adminPanel").classList.toggle("hidden");
  $("adminPanel").scrollIntoView({ behavior: "smooth" });
};

$("exportData").onclick = () => {
  const blob = new Blob([JSON.stringify(listings, null, 2)], {
    type: "application/json"
  });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "zarabiaj24.json";
  a.click();
  URL.revokeObjectURL(a.href);
};

document.querySelectorAll("[data-view]").forEach(b => {
  b.onclick = () => {
    document.querySelectorAll(".navitem").forEach(n => {
      n.classList.remove("active");
    });

    b.classList.add("active");

    if (b.dataset.view === "seller") {
      $("sellerPanel").scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
});

db.auth.onAuthStateChange(() => {
  setTimeout(() => refreshAccount(), 0);
});

async function startApp() {
  await refreshAccount();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    });
  }
}

startApp();

