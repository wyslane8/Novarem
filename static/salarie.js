const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

//si on est pas connecté en salarié on retourne au login
if (!token || role !== "salarie") {
    window.location.href = "/";
}

async function afficherResultat(reponse) {
    if (reponse.ok) {
        alert("Enregistré");
    } else if (reponse.status === 404) {
        alert("Fonctionnalité bientôt disponible");
    } else {
        const data = await reponse.json();
        alert(data.erreur);
    }
}


// events

let tousLesEvenements = [];
let idEventsEnModification = null;

async function chargerEvenements() {
    const reponse = await fetch("/evenements");
    tousLesEvenements = await reponse.json();
    const tbody = document.getElementById("tableau-evenements");
    tbody.innerHTML = "";

    tousLesEvenements.forEach(u => {
        tbody.innerHTML += `
            <tr>
                <td>${u.ID}</td>
                <td>${u.titre}</td>
                <td>${u.description}</td>
                <td>${u.date_heure_debut}</td>
                <td>${u.duree_minutes}</td>
                <td>${u.capacite_max}</td>
                <td>
                    <button onclick="preparerModificationEvents(${u.ID})" class="btn btn-warning btn-sm">Modifier</button>
                    <button onclick="supprimerEvents(${u.ID})" class="btn btn-danger btn-sm">Supprimer</button>
                </td>
            </tr>`;
    });
}
chargerEvenements();

//on retrouve l'evenement dans la liste deja chargée, comme pour les conseils
function preparerModificationEvents(id) {
    const evenement = tousLesEvenements.find(e => e.ID === id);
    idEventsEnModification = id;
    document.getElementById("events_titre").value = evenement.titre;
    document.getElementById("events_description").value = evenement.description;
    document.getElementById("events_date").value = evenement.date_heure_debut.slice(0, 16);
    document.getElementById("events_duree").value = evenement.duree_minutes;
    document.getElementById("events_capacite_max").value = evenement.capacite_max;
}

async function supprimerEvents(id) {
    await fetch(`/evenements/${id}`, {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + token }
    });
    chargerEvenements();
}

document.getElementById("form-evenement").addEventListener("submit", async function (e) {
    e.preventDefault();

    const nouvelEvents = {
        titre: document.getElementById("events_titre").value,
        description: document.getElementById("events_description").value,
        date_heure_debut: document.getElementById("events_date").value,
        duree_minutes: parseInt(document.getElementById("events_duree").value),
        capacite_max: parseInt(document.getElementById("events_capacite_max").value)
    };

    let reponse;
    if (idEventsEnModification === null) {
        reponse = await fetch("/evenements", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify(nouvelEvents)
        });
    } else {
        reponse = await fetch(`/evenements/${idEventsEnModification}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify(nouvelEvents)
        });
        idEventsEnModification = null;
    }

    await afficherResultat(reponse);
    document.getElementById("form-evenement").reset();
    chargerEvenements();
});


// GESTION DES CONSEILS

let tousLesConseils = [];
let idConseilEnModification = null;

async function chargerConseils() {
    const reponse = await fetch("/conseils");
    tousLesConseils = await reponse.json();
    const tbody = document.getElementById("tableau-conseils");
    tbody.innerHTML = "";

    tousLesConseils.forEach(c => {
        tbody.innerHTML += `
            <tr>
                <td>${c.ID}</td>
                <td>${c.titre}</td>
                <td>${c.contenu}</td>
                <td>
                    <button onclick="preparerModificationConseil(${c.ID})" class="btn btn-warning btn-sm">Modifier</button>
                    <button onclick="supprimerConseil(${c.ID})" class="btn btn-danger btn-sm">Supprimer</button>
                </td>
            </tr>`;
    });
}
chargerConseils();

function preparerModificationConseil(id) {
    const conseil = tousLesConseils.find(c => c.ID === id);
    idConseilEnModification = id;
    document.getElementById("conseil-titre").value = conseil.titre;
    document.getElementById("conseil-contenu").value = conseil.contenu;
}

document.getElementById("form-conseil").addEventListener("submit", async function (e) {
    e.preventDefault();

    const nouveauConseil = {
        titre: document.getElementById("conseil-titre").value,
        contenu: document.getElementById("conseil-contenu").value
    };

    let reponse;
    if (idConseilEnModification === null) {
        reponse = await fetch("/conseils", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify(nouveauConseil)
        });
    } else {
        reponse = await fetch(`/conseils/${idConseilEnModification}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify(nouveauConseil)
        });
        idConseilEnModification = null;
    }

    await afficherResultat(reponse);
    document.getElementById("form-conseil").reset();
    chargerConseils();
});

async function supprimerConseil(id) {
    await fetch(`/conseils/${id}`, {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + token }
    });
    chargerConseils();
}

// GESTION DES ACTUALITES

let toutesLesActualites = [];
let idActuEnModification = null;

async function chargerActualites() {
    const reponse = await fetch("/actualites");
    const tbody = document.getElementById("tableau-actualites");
    tbody.innerHTML = "";

    if (reponse.status === 404) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-muted">Fonctionnalité bientôt disponible.</td></tr>`;
        return;
    }

    toutesLesActualites = await reponse.json();
    toutesLesActualites.forEach(a => {
        tbody.innerHTML += `
            <tr>
                <td>${a.ID}</td>
                <td>${a.titre}</td>
                <td>${a.contenu}</td>
                <td>
                    <button onclick="preparerModificationActu(${a.ID})" class="btn btn-warning btn-sm">Modifier</button>
                    <button onclick="supprimerActu(${a.ID})" class="btn btn-danger btn-sm">Supprimer</button>
                </td>
            </tr>`;
    });
}
chargerActualites();

function preparerModificationActu(id) {
    const actu = toutesLesActualites.find(a => a.ID === id);
    idActuEnModification = id;
    document.getElementById("actu-titre").value = actu.titre;
    document.getElementById("actu-contenu").value = actu.contenu;
}

document.getElementById("form-actualite").addEventListener("submit", async function (e) {
    e.preventDefault();
    const nouvelleActu = {
        titre: document.getElementById("actu-titre").value,
        contenu: document.getElementById("actu-contenu").value
    };

    let reponse;
    if (idActuEnModification === null) {
        reponse = await fetch("/actualites", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify(nouvelleActu)
        });
    } else {
        reponse = await fetch(`/actualites/${idActuEnModification}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify(nouvelleActu)
        });
        idActuEnModification = null;
    }

    await afficherResultat(reponse);
    document.getElementById("form-actualite").reset();
    chargerActualites();
});

async function supprimerActu(id) {
    await fetch(`/actualites/${id}`, {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + token }
    });
    chargerActualites();
}


// MODERATION DU FORUM

let sujetsModeration = [];
let sujetModere = null;

async function chargerSujetsModeration() {
    const reponse = await fetch("/forum/sujets", {
        headers: { "Authorization": "Bearer " + token }
    });
    const div = document.getElementById("moderation-sujets");
    div.innerHTML = "";

    if (reponse.status === 404) {
        div.innerHTML = `<p class="text-muted">Fonctionnalité bientôt disponible.</p>`;
        return;
    }

    sujetsModeration = await reponse.json();
    if (sujetsModeration.length === 0) {
        div.innerHTML = `<p class="text-muted">Aucun sujet pour l'instant.</p>`;
        return;
    }

    sujetsModeration.forEach(s => {
        div.innerHTML += `
        <div class="card mb-2">
            <div class="card-body">
                <h5 class="card-title">${s.titre}</h5>
                <p class="card-text text-muted mb-2">par ${s.auteur_nom}</p>
                <button onclick="ouvrirSujetModeration(${s.ID})" class="btn btn-outline-primary btn-sm">Modérer</button>
            </div>
        </div>`;
    });
}
chargerSujetsModeration();
//on passe de la liste des sujets aux messages du sujet
function ouvrirSujetModeration(id) {
    const sujet = sujetsModeration.find(s => s.ID === id);
    sujetModere = id;
    document.getElementById("moderation-titre").textContent = sujet.titre;
    document.getElementById("moderation-liste").classList.add("d-none");
    document.getElementById("moderation-sujet").classList.remove("d-none");
    chargerMessagesModeration();
}

async function chargerMessagesModeration() {
    const reponse = await fetch(`/forum/sujets/${sujetModere}/messages`, {
        headers: { "Authorization": "Bearer " + token }
    });
    const div = document.getElementById("moderation-messages");
    div.innerHTML = "";

    if (reponse.status === 404) {
        div.innerHTML = `<p class="text-muted">Fonctionnalité bientôt disponible.</p>`;
        return;
    }

    const messages = await reponse.json();
    if (messages.length === 0) {
        div.innerHTML = `<p class="text-muted">Aucun message dans ce sujet.</p>`;
        return;
    }

    messages.forEach(m => {
        div.innerHTML += `
        <div class="card mb-2">
            <div class="card-body">
                <p class="card-text">${m.contenu}</p>
                <p class="card-text text-muted small mb-2">${m.auteur_nom}</p>
                <button onclick="supprimerMessage(${m.ID})" class="btn btn-danger btn-sm">Supprimer</button>
            </div>
        </div>`;
    });
}

async function supprimerMessage(id) {
    if (!confirm("Supprimer ce message ?")) {
        return;
    }
    const reponse = await fetch(`/forum/messages/${id}`, {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + token }
    });
    if (!reponse.ok) {
        await afficherResultat(reponse);
    }
    chargerMessagesModeration();
}

document.getElementById("btn-retour-moderation").addEventListener("click", () => {
    sujetModere = null;
    document.getElementById("moderation-sujet").classList.add("d-none");
    document.getElementById("moderation-liste").classList.remove("d-none");
    chargerSujetsModeration();
});



// navig btw sections 

function afficherSection(nom) {
    document.querySelectorAll("section").forEach(s => s.style.display = "none");
    document.getElementById("section-" + nom).style.display = "block";
}

document.querySelectorAll("[data-section]").forEach(bouton => {
    bouton.addEventListener("click", () => afficherSection(bouton.dataset.section));
});

afficherSection("evenements");


// DECONNEXION

document.getElementById("btn-logout").addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/";
});
