
(() => {
  const URL = "https://lkbasdgnoibamolpelhc.supabase.co";
  const KEY = "sb_publishable_7weL-1twNE-swPYqtpMYmA_iJCILiNB";
  const db = window.supabase.createClient(URL, KEY);

  const button = (label, action) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.style.cssText =
      "display:block;width:100%;padding:14px;margin:10px 0;border-radius:10px;font-size:16px;";
    b.addEventListener("click", action);
    return b;
  };

  async function getUser() {
    const { data, error } = await db.auth.getUser();
    return error ? null : data.user;
  }

  async function loadOrders(dialog) {
    const user = await getUser();

    if (!user) {
      alert("Zaloguj się, aby zobaczyć zamówienia.");
      return;
    }

    dialog.replaceChildren();

    const title = document.createElement("h2");
    title.textContent = "Moje zamówienia";
    dialog.appendChild(title);

    const { data, error } = await db
      .from("marketplace_orders")
      .select("id,listing_id,amount,status,created_at")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      const message = document.createElement("p");
      message.textContent = "Błąd pobierania zamówień: " + error.message;
      dialog.appendChild(message);
    } else if (!data || data.length === 0) {
      const empty = document.createElement("p");
      empty.textContent = "Nie masz jeszcze zamówień.";
      dialog.appendChild(empty);
    } else {
      data.forEach((order) => {
        const card = document.createElement("div");
        card.style.cssText =
          "padding:14px 0;border-bottom:1px solid #ddd;";

        const name = document.createElement("strong");
        name.textContent = "Zamówienie – " + order.amount + " zł";

        const status = document.createElement("p");
        const labels = {
          pending: "Oczekuje na decyzję",
          accepted: "Zaakceptowane",
          rejected: "Odrzucone",
          completed: "Zakończone",
          cancelled: "Anulowane"
        };
        status.textContent =
          "Status: " + (labels[order.status] || order.status);

        const date = document.createElement("small");
        date.textContent =
          new Date(order.created_at).toLocaleString("pl-PL");

        card.append(name, status, date);

        if (order.status === "pending") {
          card.appendChild(button("Zaakceptuj zamówienie", async () => {
            await changeStatus(order.id, "accepted", dialog);
          }));

          card.appendChild(button("Odrzuć zamówienie", async () => {
            await changeStatus(order.id, "rejected", dialog);
          }));
        }

        dialog.appendChild(card);
      });
    }

    dialog.appendChild(button("Odśwież zamówienia", () => loadOrders(dialog)));
    dialog.appendChild(button("Zamknij", () => dialog.close()));
  }

  async function changeStatus(id, status, dialog) {
    const confirmation = confirm(
      status === "accepted"
        ? "Czy zaakceptować to zamówienie?"
        : "Czy odrzucić to zamówienie?"
    );

    if (!confirmation) return;

    const { error } = await db
      .from("marketplace_orders")
      .update({ status })
      .eq("id", id);

    if (error) {
      alert("Nie udało się zmienić statusu: " + error.message);
    } else {
      alert("Status zamówienia został zmieniony.");
      await loadOrders(dialog);
    }
  }

  function addOrdersButton() {
    if (document.getElementById("myOrdersButton")) return;

    const b = button("Moje zamówienia", async () => {
      let dialog = document.getElementById("sellerOrdersDialog");

      if (!dialog) {
        dialog = document.createElement("dialog");
        dialog.id = "sellerOrdersDialog";
        dialog.style.cssText =
          "width:90%;max-width:520px;max-height:80vh;overflow:auto;border:1px solid #ccc;border-radius:12px;padding:18px;";
        document.body.appendChild(dialog);
      }

      await loadOrders(dialog);
      if (!dialog.open) dialog.showModal();
    });

    b.id = "myOrdersButton";
    b.style.cssText +=
      "position:fixed;left:12px;bottom:80px;width:auto;z-index:9999;background:#222;color:white;";
    document.body.appendChild(b);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", addOrdersButton);
  } else {
    addOrdersButton();
  }
})();
