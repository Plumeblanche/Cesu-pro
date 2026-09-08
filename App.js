const KEY = “cesu-planning-v1”;

let state = JSON.parse(localStorage.getItem(KEY) || “null”) || {
clients: [],
interventions: [],
rate: 18
};

let current = new Date();
current.setDate(1);

const $ = (selector) => document.querySelector(selector);

/* =========================
OUTILS
========================= */

const money = (number) =>
new Intl.NumberFormat(“fr-FR”, {
style: “currency”,
currency: “EUR”
}).format(number || 0);

const dateISO = (date) => {
const d = new Date(date);
return d.toISOString().slice(0, 10);
};

function save() {
localStorage.setItem(KEY, JSON.stringify(state));
}

function clientName(id) {
const client = state.clients.find((c) => c.id === id);
return client ? client.name : “Client supprimé”;
}

function hoursOf(intervention) {
const start = new Date(2000-01-01T${intervention.start});
const end = new Date(2000-01-01T${intervention.end});

return Math.max(0, (end - start) / 3600000);
}

function rateOf(intervention) {
return Number(
intervention.rate !== undefined
? intervention.rate
: state.rate
);
}

function incomeOf(intervention) {
return hoursOf(intervention) * rateOf(intervention);
}

function formatDate(date) {
return new Intl.DateTimeFormat(“fr-FR”, {
day: “2-digit”,
month: “2-digit”,
year: “numeric”
}).format(new Date(date + “T12:00”));
}

function escapeHtml(value) {
return String(value).replace(/[&<>”’]/g, (character) => ({
“&”: “&”,
“<”: “<”,
“>”: “>”,
‘”’: “"”,
“’”: “'”
}[character]));
}

/* =========================
AFFICHAGE GÉNÉRAL
========================= */

function render() {
const rateInput = $(”#defaultRate”);

if (rateInput) {
rateInput.value = state.rate;
}

renderDashboard();
renderClients();
renderInterventions();
}

/* =========================
TABLEAU DE BORD
========================= */

function renderDashboard() {
const year = current.getFullYear();
const month = current.getMonth();

const monthTitle = $(”#currentMonth”);

if (monthTitle) {
monthTitle.textContent =
new Intl.DateTimeFormat(“fr-FR”, {
month: “long”,
year: “numeric”
}).format(current);
}

const interventions = state.interventions.filter((intervention) => {
const date = new Date(intervention.date + “T12:00”);

return (
  date.getFullYear() === year &&
  date.getMonth() === month
);

});

const totalHours = interventions.reduce(
(total, intervention) =>
total + hoursOf(intervention),
0
);

const totalIncome = interventions.reduce(
(total, intervention) =>
total + incomeOf(intervention),
0
);

const monthHours = $(”#monthHours”);
const monthInterventions = $(”#monthInterventions”);
const monthIncome = $(”#monthIncome”);

if (monthHours) {
monthHours.textContent =
totalHours.toFixed(1) + “ h”;
}

if (monthInterventions) {
monthInterventions.textContent =
interventions.length;
}

if (monthIncome) {
monthIncome.textContent =
money(totalIncome);
}

/* CALENDRIER */

const calendar = $(”#calendar”);

if (!calendar) return;

const firstDay =
new Date(year, month, 1);

const numberOfDays =
new Date(year, month + 1, 0).getDate();

const offset =
(firstDay.getDay() + 6) % 7;

let html = “”;

const dayNames = [
“Lun”,
“Mar”,
“Mer”,
“Jeu”,
“Ven”,
“Sam”,
“Dim”
];

dayNames.forEach((day) => {
html += <div class="dayName">${day}</div>;
});

for (let i = 0; i < offset; i++) {
html += <div class="day muted"></div>;
}

for (let day = 1; day <= numberOfDays; day++) {
const date =
${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")};

const events =
  state.interventions.filter(
    (intervention) =>
      intervention.date === date
  );
const today =
  dateISO(new Date()) === date;
html += `
  <div
    class="day ${today ? "today" : ""}"
    data-date="${date}"
  >
    <div class="num">
      ${day}
    </div>
    ${events.map((event) => `
      <div
        class="event"
        data-intervention-id="${event.id}"
      >
        ${escapeHtml(event.start)}-${escapeHtml(event.end)}
        ${escapeHtml(clientName(event.clientId))}
      </div>
    `).join("")}
  </div>
`;

}

calendar.innerHTML = html;

/* Cliquer sur un jour */

calendar
.querySelectorAll(”.day[data-date]”)
.forEach((dayElement) => {
dayElement.addEventListener(“click”, () => {
openIntervention(
dayElement.dataset.date
);
});
});

/* Cliquer sur une intervention */

calendar
.querySelectorAll(”.event[data-intervention-id]”)
.forEach((eventElement) => {
eventElement.addEventListener(
“click”,
(event) => {
event.stopPropagation();

      openIntervention(
        null,
        eventElement.dataset.interventionId
      );
    }
  );
});

}

/* =========================
CLIENTS
========================= */

function renderClients() {
const list = $(”#clientsList”);

if (!list) return;

if (!state.clients.length) {
list.innerHTML = <div class="card"> Aucun client pour le moment. </div>;
return;
}

list.innerHTML = state.clients
.map((client) => `
    <div>
      <h3>
        ${escapeHtml(client.name)}
      </h3>
      <p>
        ${escapeHtml(client.phone || "")}
        ${
          client.rate
            ? ` • ${client.rate} €/h`
            : ""
        }
      </p>
    </div>
    <button
      class="secondary"
      data-client-id="${client.id}"
    >
      Modifier
    </button>
  </div>
`)
.join("");

list
.querySelectorAll(”[data-client-id]”)
.forEach((button) => {
button.addEventListener(“click”, () => {
openClient(button.dataset.clientId);
});
});
}

/* =========================
INTERVENTIONS
========================= */

function renderInterventions() {
const list = $(”#interventionsList”);

if (!list) return;

const interventions =
[…state.interventions].sort(
(a, b) =>
(b.date + b.start)
.localeCompare(a.date + a.start)
);

if (!interventions.length) {
list.innerHTML = <div class="card"> Aucune intervention. </div>;
return;
}

list.innerHTML = interventions
.map((intervention) => `
    <div>
      <h3>
        ${formatDate(intervention.date)}
        •
        ${escapeHtml(
          clientName(intervention.clientId)
        )}
      </h3>
      <p>
        ${escapeHtml(intervention.start)}
        –
        ${escapeHtml(intervention.end)}
        •
        ${hoursOf(intervention).toFixed(2)}
        h
        •
        ${money(incomeOf(intervention))}
      </p>
    </div>
    <button
      class="secondary"
      data-intervention-id="${intervention.id}"
    >
      Modifier
    </button>
  </div>
`)
.join("");

list
.querySelectorAll(”[data-intervention-id]”)
.forEach((button) => {
button.addEventListener(“click”, () => {
openIntervention(
null,
button.dataset.interventionId
);
});
});
}

/* =========================
MODALE
========================= */

function showModal(content) {
const modal = $(”#modal”);
const modalContent = $(”#modalContent”);

if (!modal || !modalContent) return;

modalContent.innerHTML = content;

/* On utilise hidden, comme dans index.html */
modal.hidden = false;
}

function closeModal() {
const modal = $(”#modal”);

if (!modal) return;

modal.hidden = true;
}

/* =========================
CLIENTS
========================= */

function clientOptions(selected = “”) {
return state.clients
.map((client) => <option value="${client.id}" ${client.id === selected ? "selected" : ""} > ${escapeHtml(client.name)} </option>)
.join(””);
}

function openClient(id = null) {
const client =
state.clients.find(
(c) => c.id === id
) || {
id: “”,
name: “”,
phone: “”,
rate: “”
};

showModal(`
${id ? “Modifier” : “Nouveau”} client
<form id="clientForm">
  <label>
    Nom / prénom
    <input
      name="name"
      required
      value="${escapeHtml(client.name)}"
    >
  </label>
  <label>
    Téléphone
    <input
      name="phone"
      inputmode="tel"
      value="${escapeHtml(client.phone || "")}"
    >
  </label>
  <label>
    Tarif horaire (€ net)
    <input
      name="rate"
      type="number"
      min="0"
      step="0.01"
      value="${client.rate || state.rate}"
    >
  </label>
  <button
    type="submit"
    class="primary full"
  >
    Enregistrer
  </button>
</form>

`);

const form = $(”#clientForm”);

if (!form) return;

form.onsubmit = (event) => {
event.preventDefault();

const data = new FormData(event.target);
const updatedClient = {
  id: id || crypto.randomUUID(),
  name:
    String(data.get("name") || "").trim(),
  phone:
    String(data.get("phone") || "").trim(),
  rate:
    Number(data.get("rate")) || state.rate
};
if (id) {
  state.clients =
    state.clients.map((client) =>
      client.id === id
        ? updatedClient
        : client
    );
} else {
  state.clients.push(
    updatedClient
  );
}
save();
closeModal();
render();

};
}

/* =========================
INTERVENTIONS
========================= */

function openIntervention(
date = dateISO(new Date()),
id = null
) {
if (!state.clients.length) {
alert(
“Ajoute d’abord au moins un client.”
);

openClient();
return;

}

const intervention =
state.interventions.find(
(item) => item.id === id
) || {
id: “”,
date: date || dateISO(new Date()),
start: “08:00”,
end: “10:00”,
clientId:
state.clients[0].id,
rate: state.rate,
note: “”
};

showModal(`
${id ? “Modifier” : “Nouvelle”}
intervention
<form id="intForm">
  <label>
    Date
    <input
      name="date"
      type="date"
      required
      value="${intervention.date}"
    >
  </label>
  <div class="row">
    <label>
      Début
      <input
        name="start"
        type="time"
        required
        value="${intervention.start}"
      >
    </label>
    <label>
      Fin
      <input
        name="end"
        type="time"
        required
        value="${intervention.end}"
      >
    </label>
  </div>
  <label>
    Client
    <select name="clientId">
      ${clientOptions(
        intervention.clientId
      )}
    </select>
  </label>
  <label>
    Tarif horaire (€ net)
    <input
      name="rate"
      type="number"
      min="0"
      step="0.01"
      value="${
        intervention.rate ??
        state.rate
      }"
    >
  </label>
  <label>
    Note
    <input
      name="note"
      value="${escapeHtml(
        intervention.note || ""
      )}"
    >
  </label>
  <button
    type="submit"
    class="primary full"
  >
    Enregistrer
  </button>
  ${
    id
      ? `
        <button
          type="button"
          id="deleteInt"
          class="danger full"
        >
          Supprimer
        </button>
      `
      : ""
  }
</form>

`);

const form = $(”#intForm”);

if (!form) return;

form.onsubmit = (event) => {
event.preventDefault();

const data =
  new FormData(event.target);
const updatedIntervention = {
  id:
    id || crypto.randomUUID(),
  date:
    data.get("date"),
  start:
    data.get("start"),
  end:
    data.get("end"),
  clientId:
    data.get("clientId"),
  rate:
    Number(data.get("rate")) ||
    state.rate,
  note:
    String(
      data.get("note") || ""
    ).trim()
};
if (
  updatedIntervention.end <=
  updatedIntervention.start
) {
  alert(
    "L'heure de fin doit être après l'heure de début."
  );
  return;
}
if (id) {
  state.interventions =
    state.interventions.map(
      (item) =>
        item.id === id
          ? updatedIntervention
          : item
    );
} else {
  state.interventions.push(
    updatedIntervention
  );
}
save();
closeModal();
render();

};

if (id) {
const deleteButton =
$(”#deleteInt”);

if (deleteButton) {
  deleteButton.onclick = () => {
    if (
      confirm(
        "Supprimer cette intervention ?"
      )
    ) {
      state.interventions =
        state.interventions.filter(
          (item) =>
            item.id !== id
        );
      save();
      closeModal();
      render();
    }
  };
}

}
}

/* =========================
BOUTONS
========================= */

const addClientBtn =
$(”#addClientBtn”);

if (addClientBtn) {
addClientBtn.onclick =
() => openClient();
}

const addInterventionBtn =
$(”#addInterventionBtn”);

if (addInterventionBtn) {
addInterventionBtn.onclick =
() => openIntervention();
}

const closeModalBtn =
$(”#closeModal”);

if (closeModalBtn) {
closeModalBtn.onclick =
() => closeModal();
}

const modal =
$(”#modal”);

if (modal) {
modal.onclick = (event) => {
if (event.target === modal) {
closeModal();
}
};
}

/* =========================
CHANGEMENT DE MOIS
========================= */

const prevMonth =
$(”#prevMonth”);

if (prevMonth) {
prevMonth.onclick = () => {
current.setMonth(
current.getMonth() - 1
);

renderDashboard();

};
}

const nextMonth =
$(”#nextMonth”);

if (nextMonth) {
nextMonth.onclick = () => {
current.setMonth(
current.getMonth() + 1
);

renderDashboard();

};
}

/* =========================
PARAMÈTRES
========================= */

const saveSettingsBtn =
$(”#saveSettingsBtn”);

if (saveSettingsBtn) {
saveSettingsBtn.onclick = () => {
state.rate =
Number(
$(”#defaultRate”).value
) || 0;

save();
render();

};
}

/* =========================
EXPORTATION
========================= */

const exportBtn =
$(”#exportBtn”);

if (exportBtn) {
exportBtn.onclick = () => {
const blob =
new Blob(
[
JSON.stringify(
state,
null,
2
)
],
{
type: “application/json”
}
);

const link =
  document.createElement("a");
link.href =
  URL.createObjectURL(blob);
link.download =
  `cesu-planning-${dateISO(
    new Date()
  )}.json`;
link.click();
URL.revokeObjectURL(
  link.href
);

};
}

/* =========================
SUPPRESSION DES DONNÉES
========================= */

const deleteDataBtn =
$(”#deleteDataBtn”);

if (deleteDataBtn) {
deleteDataBtn.onclick = () => {
if (
confirm(
“Supprimer toutes les données de l’application ?”
)
) {
state = {
clients: [],
interventions: [],
rate: 18
};

  save();
  render();
}

};
}

/* =========================
IMPORTATION
========================= */

const importFile =
$(”#importFile”);

if (importFile) {
importFile.onchange =
(event) => {
const file =
event.target.files[0];

  if (!file) return;
  const reader =
    new FileReader();
  reader.onload = () => {
    try {
      const imported =
        JSON.parse(
          reader.result
        );
      if (
        !imported.clients ||
        !imported.interventions
      ) {
        throw new Error();
      }
      state = imported;
      save();
      render();
      alert(
        "Import réussi."
      );
    } catch {
      alert(
        "Fichier invalide."
      );
    }
  };
  reader.readAsText(file);
};

}

/* =========================
NAVIGATION DU BAS
========================= */

document
.querySelectorAll(”.nav-btn”)
.forEach((button) => {

button.onclick = () => {
  document
    .querySelectorAll(".nav-btn")
    .forEach((item) =>
      item.classList.remove(
        "active"
      )
    );
  button.classList.add(
    "active"
  );
  document
    .querySelectorAll(".page")
    .forEach((page) =>
      page.classList.remove(
        "active"
      )
    );
  const page =
    document.getElementById(
      button.dataset.page
    );
  if (page) {
    page.classList.add(
      "active"
    );
  }
  render();
};

});

/* =========================
INSTALLATION PWA
========================= */

let deferredPrompt;

window.addEventListener(
“beforeinstallprompt”,
(event) => {

event.preventDefault();
deferredPrompt = event;
const installBtn =
  $("#installBtn");
if (installBtn) {
  installBtn.hidden = false;
}

}
);

const installBtn =
$(”#installBtn”);

if (installBtn) {
installBtn.onclick =
async () => {

  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
};

}

/* =========================
FERMETURE AVEC ÉCHAP
========================= */

document.addEventListener(
“keydown”,
(event) => {

if (
  event.key === "Escape"
) {
  closeModal();
}

}
);

/* =========================
SERVICE WORKER
========================= */

if (
“serviceWorker” in navigator
) {
window.addEventListener(
“load”,
() => {

  navigator.serviceWorker
    .register("sw.js")
    .catch((error) =>
      console.error(
        "Service Worker :",
        error
      )
    );
}

);
}

/* =========================
DÉMARRAGE
========================= */

render();
