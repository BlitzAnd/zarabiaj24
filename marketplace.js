
(() => {
  const SUPABASE_URL = "https://lkbasdgnoibamolpelhc.supabase.co";
  const SUPABASE_KEY = "sb_publishable_7weL-1twNE-swPYqtpMYmA_iJCILiNB";

  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const $ = (id) => document.getElementById(id);

  async function getUser() {
    const { data, error } = await db.auth.getUser();
    if (error) return null;
    return data.user;
  }

  function makeButton(label, action) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.style.cssText = "margin:8px 6px 8px 0;padding:10px 14px;border-radius:8px;cursor:pointer;";
    b.addEventListener("click", action);
    return b;
  }

  function showMessage(text) {
    alert(text);
  }

  async function saveContact(user) {
    const { data } = await db
      .from("seller_contacts")
      .select("phone,whatsapp")
      .eq("seller_id", user.id)
      .maybeSingle();

    const phone = prompt("Podaj numer telefonu:", data?.phone || "");
    if (phone === null) return;

    const whatsapp = prompt(
      "Podaj numer WhatsApp (lub zostaw puste):",
      data?.whatsapp || phone
    );
    if (whatsapp === null) return;

    const { error } = await db.from("seller_contacts").upsert({
      seller_id: user.id,
      phone: phone.trim() || null,
      whatsapp: whatsapp.trim() || null,
      updated_at: new Date().toISOString()
    });

    showMessage(error ? "Nie udało się zapisać kontaktu: " + error.message
      : "Dane kontaktowe zostały zapisane.");
  }

  async function showContact(sellerId, container) {
    const { data, error } = await db
      .from("seller_contacts")
      .select("phone,whatsapp")
      .eq("seller_id", sellerId)
      .maybeSingle();

    if (error || !data || (!data.phone && !data.whatsapp)) {
      const note = document.createElement("p");
      note.textContent = "Sprzedawca nie udostępnił danych kontaktowych.";
      container.appendChild(note);
      return;
    }

    if (data.phone) {
      const link = document.createElement("a");
      link.href = "tel:" + data.phone.replace(/[^\d+]/g, "");
      link.textContent = "Zadzwoń do sprzedawcy";
      link.style.display = "block";
      container.appendChild(link);
    }

    if (data.whatsapp) {
      const number = data.whatsapp.replace(/\D/g, "");
      if (number) {
        const link = document.createElement("a");
        link.href = "https://wa.me/" + number;
        link.target = "_blank";
        link.rel = "noopener";
        link.textContent = "Napisz na WhatsApp";
        link.style.display = "block";
        container.appendChild(link);
      }
    }
  }

  async function sendMessage(item, user) {
    const message = prompt("Wpisz wiadomość do sprzedawcy:");
    if (!message || !message.trim()) return;

    const { error } = await db.from("marketplace_messages").insert({
      listing_id: String(item.id),
      sender_id: user.id,
      recipient_id: item.owner_id,
      message: message.trim()
    });

    showMessage(error
      ? "Nie udało się wysłać wiadomości: " + error.message
      : "Wiadomość została wysłana.");
  }

  async function placeOrder(item, user) {
    if (user.id === item.owner_id) {
      showMessage("Nie możesz kupić własnego ogłoszenia.");
      return;
    }

    const accepted = confirm(
      "Czy wysłać sprzedawcy zamówienie na: " +
      item.title + " za " + item.price + " zł?\n\n" +
      "To zamówienie nie oznacza dokonania płatności."
    );

    if (!accepted) return;

    const { error } = await db.from("marketplace_orders").insert({
      listing_id: String(item.id),
      buyer_id: user.id,
      seller_id: item.owner_id,
      amount: Number(item.price),
      status: "pending"
    });

    showMessage(error
      ? "Nie udało się wysłać zamówienia: " + error.message
      : "Zamówienie zostało wysłane do sprzedawcy. Płatność nie została pobrana.");
  }

  async function openInbox() {
    const user = await getUser();

    if (!user) {
      showMessage("Zaloguj się, aby zobaczyć wiadomości.");
      return;
    }

    const { data, error } = await db
      .from("marketplace_messages")
      .select("id,listing_id,sender_id,recipient_id,message,created_at")
      .or("sender_id.eq." + user.id + ",recipient_id.eq." + user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      showMessage("Nie udało się pobrać wiadomości: " + error.message);
      return;
    }

    let dialog = $("marketplaceInbox");
    if (!dialog) {
      dialog = document.createElement("dialog");
      dialog.id = "marketplaceInbox";
      dialog.style.cssText = "width:90%;max-width:520px;border:1px solid #ccc;border-radius:12px;padding:18px;";
      document.body.appendChild(dialog);
    }

    dialog.replaceChildren();

    const heading = document.createElement("h2");
    heading.textContent = "Moje wiadomości";
    dialog.appendChild(heading);

    if (!data || data.length === 0) {
      const empty = document.createElement("p");
      empty.textContent = "Nie masz jeszcze wiadomości.";
      dialog.appendChild(empty);
    } else {
      data.forEach((msg) => {
        const card = document.createElement("div");
        card.style.cssText = "padding:10px 0;border-bottom:1px solid #ddd;";

        const direction = document.createElement("strong");
        direction.textContent = msg.sender_id === user.id
          ? "Wysłana wiadomość"
          : "Otrzymana wiadomość";

        const content = document.createElement("p");
        content.textContent = msg.message;

        const date = document.createElement("small");
        date.textContent = new Date(msg.created_at).toLocaleString("pl-PL");

        const reply = makeButton("Odpowiedz", async () => {
          const answer = prompt("Wpisz odpowiedź:");
          if (!answer || !answer.trim()) return;

          const recipient = msg.sender_id === user.id
            ? msg.recipient_id
            : msg.sender_id;

          const { error: sendError } = await db
            .from("marketplace_messages")
            .insert({
              listing_id: msg.listing_id,
              sender_id: user.id,
              recipient_id: recipient,
              message: answer.trim()
            });

          showMessage(sendError
            ? "Nie udało się wysłać odpowiedzi: " + sendError.message
            : "Odpowiedź została wysłana.");
        });

        card.append(direction, content, date, document.createElement("br"), reply);
        dialog.appendChild(card);
      });
    }

    dialog.appendChild(makeButton("Zamknij", () => dialog.close()));

    if (!dialog.open) dialog.showModal();
  }

  function addInboxButton() {
    if ($("marketplaceInboxButton")) return;

    const button = makeButton("Moje wiadomości", openInbox);
    button.id = "marketplaceInboxButton";
    button.style.cssText +=
      "position:fixed;right:12px;bottom:80px;z-index:9999;background:#222;color:white;";
    document.body.appendChild(button);
  }

  const originalDetail = window.detail;

  if (typeof originalDetail === "function") {
    window.detail = async function(item) {
      originalDetail(item);

      const content = $("detailContent");
      if (!content) return;

      const old = $("marketplaceActions");
      if (old) old.remove();

      const actions = document.createElement("div");
      actions.id = "marketplaceActions";
      actions.style.cssText = "margin-top:16px;padding-top:12px;border-top:1px solid #ddd;";

      const heading = document.createElement("h3");
      heading.textContent = "Kontakt i zakup";
      actions.appendChild(heading);

      const user = await getUser();

      if (!user) {
        const note = document.createElement("p");
        note.textContent = "Zaloguj się, aby kupować i wysyłać wiadomości.";
        actions.appendChild(note);
      } else if (user.id === item.owner_id) {
        actions.appendChild(makeButton(
          "Ustaw telefon / WhatsApp",
          () => saveContact(user)
        ));
      } else {
        actions.appendChild(makeButton(
          "Kup teraz – wyślij zamówienie",
          () => placeOrder(item, user)
        ));

        actions.appendChild(makeButton(
          "Napisz wiadomość",
          () => sendMessage(item, user)
        ));

        await showContact(item.owner_id, actions);
      }

      content.appendChild(actions);
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", addInboxButton);
  } else {
    addInboxButton();
  }
})();
