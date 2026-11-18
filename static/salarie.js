const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

//si on est pas connecté en salarié on retourne au login
if (!token || role !== "salarie") {
    window.location.href = "/";
}

//affiche le message du back si ça a pas marché
async function afficherResultat(reponse) {
    if (reponse.ok) {
        alert("Enregistré");
    } else {
        const data = await reponse.json();
        alert(data.erreur);
    }
}


// GESTION DES EVENEMENTS

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


// NAVIGATION ENTRE LES SECTIONS

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
