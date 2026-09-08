const KEY = “cesu-planning-v1”;

let state = JSON.parse(localStorage.getItem(KEY) || “null”) || {
clients: [],
interventions: [],
rate: 18
};

let current = new Date();
current.setDate(1);

const $ = selector => document.querySelector(selector);

const money = number =>
new Intl.NumberFormat(“fr-FR”, {
style: “currency”,
currency: “EUR”
}).format(number || 0);

const dateISO = date => {
const d = new Date(date);
return d.toISOString().slice(0, 10);
};

function save() {
localStorage.setItem(KEY, JSON.stringify(state));
}

function clientName(id) {
const client = state.clients.find(c => c.id === id);
return client ? client.name : “Client supprimé”;
}

function hoursOf(intervention) {
const start = new Date(2000-01-01T${intervention.start});
const end = new Date(2000-01-01T${intervention.end});

return Math.max(
0,
(end - start) / 3600000
);
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

/* =========================
AFFICHAGE GÉNÉRAL
========================= */

function render() {
$(”#defaultRate”).value = state.rate;

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

$(”#monthTitle”).textContent =
new Intl.DateTimeFormat(“fr-FR”, {
month: “long”,
year: “numeric”
}).format(current);

const interventions =
state.interventions.filter(intervention => {

```
  const date =
    new Date(intervention.date + "T12:00");

  return (
    date.getFullYear() === year &&
    date.getMonth() === month
  );

});
```

const totalHours =
interventions.reduce(
(total, intervention) =>
total + hoursOf(intervention),
0
);

const totalIncome =
interventions.reduce(
(total, intervention) =>
total + incomeOf(intervention),
0
);

$(”#monthHours”).textContent =
totalHours.toFixed(1) + “ h”;

$(”#monthCount”).textContent =
interventions.length;

$(”#monthIncome”).textContent =
money(totalIncome);

/* CALENDRIER */

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

dayNames.forEach(day => {
html += <div class="dayName"> ${day} </div>;
});

for (let i = 0; i < offset; i++) {

```
html += `
  <div class="day muted"></div>
`;
```

}

for (let day = 1; day <= numberOfDays; day++) {

```
const date =
  `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const events =
  state.interventions.filter(
    intervention =>
      intervention.date === date
  );

const today =
  dateISO(new Date()) === date;


html += `
  <div
    class="day ${today ? "today" : ""}"
    onclick="openIntervention('${date}')"
  >

    <div class="num">
      ${day}
    </div>

    ${events.map(event => `
      <div class="event">
        ${event.start}-${event.end}
        ${escapeHtml(clientName(event.clientId))}
      </div>
    `).join("")}

  </div>
`;
```

}

$(”#calendar”).innerHTML = html;
}

/* =========================
CLIENTS
========================= */

function renderClients() {

if (!state.clients.length) {

```
$("#clientList").innerHTML = `
  <div class="card">
    Aucun client pour le moment.
  </div>
`;

return;
```

}

$(”#clientList”).innerHTML =
state.clients.map(client => `

```
  <div class="item">

    <div>

      <h3>
        ${escapeHtml(client.name)}
      </h3>

      <p>
        ${escapeHtml(client.phone || "")}

        ${
          client.rate
            ? `• ${client.rate} €/h`
            : ""
        }

      </p>

    </div>

    <button
      class="secondary"
      onclick="editClient('${client.id}')"
    >
      Modifier
    </button>

  </div>

`).join("");
```

}

/* =========================
INTERVENTIONS
========================= */

function renderInterventions() {

const list =
[…state.interventions].sort(
(a, b) =>
(b.date + b.start)
.localeCompare(a.date + a.start)
);

if (!list.length) {

```
$("#interventionList").innerHTML = `
  <div class="card">
    Aucune intervention.
  </div>
`;

return;
```

}

$(”#interventionList”).innerHTML =
list.map(intervention => `

```
  <div class="item">

    <div>

      <h3>
        ${formatDate(intervention.date)}
        •
        ${escapeHtml(
          clientName(intervention.clientId)
        )}
      </h3>

      <p>
        ${intervention.start}
        –
        ${intervention.end}

        •

        ${hoursOf(intervention).toFixed(2)}
        h

        •

        ${money(incomeOf(intervention))}
      </p>

    </div>

    <button
      class="secondary"
      onclick="editIntervention('${intervention.id}')"
    >
      Modifier
    </button>

  </div>

`).join("");
```

}

/* =========================
OUTILS
========================= */

function formatDate(date) {

return new Intl.DateTimeFormat(“fr-FR”, {
day: “2-digit”,
month: “2-digit”,
year: “numeric”
}).format(
new Date(date + “T12:00”)
);

}

function escapeHtml(value) {

return String(value).replace(
/[&<>”’]/g,
character => ({
“&”: “&”,
“<”: “<”,
“>”: “>”,
‘”’: “"”,
“’”: “'”
}[character])
);

}

/* =========================
FENÊTRE POP-UP
========================= */

function showModal(content) {

$(”#modalContent”).innerHTML = content;

$(”#modal”).classList.remove(“hidden”);

}

function closeModal() {

$(”#modal”).classList.add(“hidden”);

}

/* =========================
LISTE DES CLIENTS
========================= */

function clientOptions(selected = “”) {

return state.clients.map(client => `

```
<option
  value="${client.id}"
  ${client.id === selected ? "selected" : ""}
>
  ${escapeHtml(client.name)}
</option>
```

`).join(””);

}

/* =========================
AJOUT / MODIFICATION CLIENT
========================= */

function openClient(id = null) {

const client =
state.clients.find(c => c.id === id) || {

```
  id: "",
  name: "",
  phone: "",
  rate: ""

};
```

showModal(`

```
<h2>
  ${id ? "Modifier" : "Nouveau"} client
</h2>

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
      step="0.01"
      value="${client.rate || state.rate}"
    >

  </label>


  <button class="primary full">
    Enregistrer
  </button>

</form>
```

`);

$(”#clientForm”).onsubmit = event => {

```
event.preventDefault();

const form =
  new FormData(event.target);


const updatedClient = {

  id: id || crypto.randomUUID(),

  name:
    form.get("name").trim(),

  phone:
    form.get("phone").trim(),

  rate:
    Number(form.get("rate"))

};


if (id) {

  state.clients =
    state.clients.map(client =>
      client.id === id
        ? updatedClient
        : client
    );

} else {

  state.clients.push(updatedClient);

}


save();

closeModal();

render();
```

};

}

/* =========================
AJOUT / MODIFICATION
INTERVENTION
========================= */

function openIntervention(
date = dateISO(new Date()),
id = null
) {

if (!state.clients.length) {

```
alert(
  "Ajoute d'abord au moins un client."
);

openClient();

return;
```

}

const intervention =
state.interventions.find(
intervention =>
intervention.id === id
) || {

```
  id: "",

  date,

  start: "08:00",

  end: "10:00",

  clientId:
    state.clients[0].id,

  rate:
    state.rate,

  note: ""

};
```

showModal(`

```
<h2>
  ${id ? "Modifier" : "Nouvelle"}
  intervention
</h2>


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


  <button class="primary full">
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
```

`);

$(”#intForm”).onsubmit = event => {

```
event.preventDefault();

const form =
  new FormData(event.target);


const updatedIntervention = {

  id:
    id || crypto.randomUUID(),

  date:
    form.get("date"),

  start:
    form.get("start"),

  end:
    form.get("end"),

  clientId:
    form.get("clientId"),

  rate:
    Number(form.get("rate")),

  note:
    form.get("note").trim()

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
      intervention =>
        intervention.id === id
          ? updatedIntervention
          : intervention
    );

} else {

  state.interventions.push(
    updatedIntervention
  );

}


save();

closeModal();

render();
```

};

if (id) {

```
$("#deleteInt").onclick = () => {

  if (
    confirm(
      "Supprimer cette intervention ?"
    )
  ) {

    state.interventions =
      state.interventions.filter(
        intervention =>
          intervention.id !== id
      );

    save();

    closeModal();

    render();

  }

};
```

}

}

function editClient(id) {

openClient(id);

}

function editIntervention(id) {

openIntervention(null, id);

}

/* =========================
BOUTONS
========================= */

$(”#addClient”).onclick =
() => openClient();

$(”#addIntervention”).onclick =
() => openIntervention();

$(”#addQuick”).onclick =
() => openIntervention();

$(”#closeModal”).onclick =
closeModal;

$(”#modal”).onclick = event => {

if (event.target.id === “modal”) {

```
closeModal();
```

}

};

/* =========================
CHANGEMENT DE MOIS
========================= */

$(”#prevMonth”).onclick = () => {

current.setMonth(
current.getMonth() - 1
);

renderDashboard();

};

$(”#nextMonth”).onclick = () => {

current.setMonth(
current.getMonth() + 1
);

renderDashboard();

};

/* =========================
RÉGLAGES
========================= */

$(”#saveSettings”).onclick = () => {

state.rate =
Number($(”#defaultRate”).value) || 0;

save();

render();

};

$(”#exportData”).onclick = () => {

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
document.createElement(“a”);

link.href =
URL.createObjectURL(blob);

link.download =
cesu-planning-${dateISO( new Date() )}.json;

link.click();

URL.revokeObjectURL(
link.href
);

};

$(”#clearData”).onclick = () => {

if (
confirm(
“Supprimer toutes les données de l’application ?”
)
) {

```
state = {

  clients: [],

  interventions: [],

  rate: 18

};

save();

render();
```

}

};

/* =========================
IMPORTATION
========================= */

$(”#importData”).onchange =
event => {

```
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
```

};

/* =========================
MENU DU BAS
========================= */

document
.querySelectorAll(
“.bottomnav button”
)
.forEach(button => {

```
button.onclick = () => {

  document
    .querySelectorAll(
      ".bottomnav button"
    )
    .forEach(item =>
      item.classList.remove(
        "active"
      )
    );


  button.classList.add(
    "active"
  );


  document
    .querySelectorAll(
      ".screen"
    )
    .forEach(screen =>
      screen.classList.remove(
        "active"
      )
    );


  $(
    "#" +
    button.dataset.screen
  ).classList.add(
    "active"
  );


  render();

};
```

});

/* =========================
INSTALLATION PWA
========================= */

let deferredPrompt;

window.addEventListener(
“beforeinstallprompt”,
event => {

```
event.preventDefault();

deferredPrompt = event;

$("#installBtn")
  .classList
  .remove("hidden");
```

}
);

$(”#installBtn”).onclick =
async () => {

```
if (!deferredPrompt) return;

deferredPrompt.prompt();

await deferredPrompt.userChoice;

deferredPrompt = null;

$("#installBtn")
  .classList
  .add("hidden");
```

};

/* =========================
SERVICE WORKER
========================= */

if (“serviceWorker” in navigator) {

window.addEventListener(
“load”,
() => {

```
  navigator.serviceWorker
    .register("sw.js")
    .catch(error =>
      console.error(
        "Service Worker :",
        error
      )
    );

}
```

);

}

/* =========================
DÉMARRAGE
========================= */

render();
