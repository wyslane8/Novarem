// Récupération du token et vérification du rôle
const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

if (!token || role !== "salarie") {
    window.location.href = "/";
}


// ---------------- GESTION DES EVENEMENTS ----------------

// Afficher les événements
async function chargerEvenements() {
    const reponse = await fetch("/evenements");
    const evenements = await reponse.json();

    const tbody = document.getElementById("tableau-evenements");
    tbody.innerHTML = "";

    evenements.forEach(u => {
        const ligne = `
        <tr>
            <td>${u.ID}</td>
            <td>${u.titre}</td>
            <td>${u.description}</td>
            <td>${u.date_heure_debut}</td>
            <td>${u.duree_minutes}</td>
            <td>${u.capacite_max}</td>
            <td>
                <button onclick="preparerModificationEvents(${u.ID}, '${u.titre}', '${u.description}', '${u.date_heure_debut}', ${u.duree_minutes}, ${u.capacite_max})" class="btn btn-warning btn-sm">Modifier</button>
                <button onclick="supprimerEvents(${u.ID})" class="btn btn-danger btn-sm">Supprimer</button>
            </td>
        </tr>
        `;

        tbody.innerHTML += ligne;
    });
}

chargerEvenements();

let idEventsEnModification = null;


// Préparer la modification d'un événement
function preparerModificationEvents(id, titre, description, date_heure_debut, duree_minutes, capacite_max) {
    idEventsEnModification = id;

    document.getElementById("events_titre").value = titre;
    document.getElementById("events_description").value = description;
    document.getElementById("events_date").value = date_heure_debut.slice(0, 16);
    document.getElementById("events_duree").value = duree_minutes;
    document.getElementById("events_capacite_max").value = capacite_max;
}


// Supprimer un événement
async function supprimerEvents(id) {
    await fetch(`/evenements/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    chargerEvenements();
}


// Ajouter ou modifier un événement
document.getElementById("form-evenement").addEventListener("submit", async function (e) {
    e.preventDefault();

    const nouvelEvents = {
        titre: document.getElementById("events_titre").value,
        description: document.getElementById("events_description").value,
        date_heure_debut: document.getElementById("events_date").value,
        duree_minutes: parseFloat(document.getElementById("events_duree").value),
        capacite_max: parseInt(document.getElementById("events_capacite_max").value)
    };

    if (idEventsEnModification === null) {
        await fetch("/evenements", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify(nouvelEvents)
        });
    } else {
        await fetch(`/evenements/${idEventsEnModification}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify(nouvelEvents)
        });

        idEventsEnModification = null;
    }

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


// Ajouter un conseil
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

    document.getElementById("form-conseil").reset();
    chargerConseils();
});


// Supprimer un conseil
async function supprimerConseil(id) {
    await fetch(`/conseils/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    chargerConseils();
}


// ---------------- NAVIGATION ENTRE LES SECTIONS ----------------

const buttons = document.querySelectorAll(".navbar-nav .nav-link[data-section]");
const sections = document.querySelectorAll("section[id^='section-']");

function afficherSection(nomSection) {

    // Masquer toutes les sections
    sections.forEach(section => {
        section.style.display = "none";
    });

    // Afficher uniquement la section sélectionnée
    const sectionActive = document.getElementById("section-" + nomSection);

    if (sectionActive) {
        sectionActive.style.display = "block";
    }
}

// Afficher les événements au chargement
afficherSection("evenements");

// Changer de section quand on clique sur un bouton
buttons.forEach(button => {
    button.addEventListener("click", () => {
        const nomSection = button.getAttribute("data-section");
        afficherSection(nomSection);
    });
});


// ---------------- DECONNEXION ----------------

const btnLogout = document.getElementById("btn-logout");

if (btnLogout) {
    btnLogout.addEventListener("click", () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");

        window.location.href = "/";
    });
}
