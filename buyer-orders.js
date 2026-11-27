
(() => {
  const URL = "https://lkbasdgnoibamolpelhc.supabase.co";
  const KEY = "sb_publishable_7weL-1twNE-swPYqtpMYmA_iJCILiNB";
  const db = window.supabase.createClient(URL, KEY);

  function makeButton(label, action) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.style.cssText =
      "display:block;width:100%;padding:14px;margin:12px 0;border-radius:10px;font-size:16px;";
    b.addEventListener("click", action);
    return b;
  }

  async function loadPurchases(dialog) {
    const { data: auth, error: authError } = await db.auth.getUser();
    const user = auth?.user;

    if (authError || !user) {
      alert("Zaloguj się, aby zobaczyć swoje zakupy.");
      return;
    }

    dialog.replaceChildren();

    const heading = document.createElement("h2");
    heading.textContent = "Moje zakupy";
    dialog.appendChild(heading);

    const { data, error } = await db
      .from("marketplace_orders")
      .select("id,listing_id,amount,status,created_at")
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      const p = document.createElement("p");
      p.textContent = "Nie udało się pobrać zakupów: " + error.message;
      dialog.appendChild(p);
    } else if (!data || data.length === 0) {
      const p = document.createElement("p");
      p.textContent = "Nie masz jeszcze złożonych zamówień.";
      dialog.appendChild(p);
    } else {
      const labels = {
        pending: "Oczekuje na decyzję sprzedawcy",
        accepted: "Sprzedawca zaakceptował zamówienie",
        rejected: "Sprzedawca odrzucił zamówienie",
        completed: "Zamówienie zakończone",
        cancelled: "Zamówienie anulowane"
      };

      data.forEach((order) => {
        const card = document.createElement("div");
        card.style.cssText =
          "padding:14px 0;border-bottom:1px solid #ddd;";

        const name = document.createElement("strong");
        name.textContent = "Zamówienie – " + order.amount + " zł";

        const status = document.createElement("p");
        status.textContent =
          "Status: " + (labels[order.status] || order.status);

        const date = document.createElement("small");
        date.textContent =
          new Date(order.created_at).toLocaleString("pl-PL");

        card.append(name, status, date);
        dialog.appendChild(card);
      });
    }

    dialog.appendChild(
      makeButton("Odśwież zakupy", () => loadPurchases(dialog))
    );

    dialog.appendChild(
      makeButton("Zamknij", () => dialog.close())
    );
  }

  function addPurchasesButton() {
    if (document.getElementById("myPurchasesButton")) return;

    const b = makeButton("Moje zakupy", async () => {
      let dialog = document.getElementById("buyerPurchasesDialog");

      if (!dialog) {
        dialog = document.createElement("dialog");
        dialog.id = "buyerPurchasesDialog";
        dialog.style.cssText =
          "width:90%;max-width:520px;max-height:80vh;overflow:auto;border:1px solid #ccc;border-radius:12px;padding:18px;";
        document.body.appendChild(dialog);
      }

      await loadPurchases(dialog);

      if (!dialog.open) dialog.showModal();
    });

    b.id = "myPurchasesButton";
    b.style.cssText +=
      "position:fixed;left:12px;bottom:145px;width:auto;z-index:9999;background:#222;color:white;";

    document.body.appendChild(b);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", addPurchasesButton);
  } else {
    addPurchasesButton();
  }
})();
