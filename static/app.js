
const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

if (!token || role !== "admin") {
    window.location.href = "/";
}

// GESTION DES UTILISATEURS

async function chargerUtilisateurs() {
    const reponse = await fetch("/utilisateurs", {
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("token")
        }
    });

    const utilisateurs = await reponse.json();
    const tbody = document.getElementById("tableau-utilisateurs");

    tbody.innerHTML = "";

    utilisateurs.forEach(u => {
        const ligne = `
            <tr>
                <td>${u.ID}</td>
                <td>${u.nom}</td>
                <td>${u.email}</td>
                <td>${u.role}</td>
                <td>
                    <button onclick="preparerModification(${u.ID}, '${u.nom}', '${u.email}', '${u.role}')" class="btn btn-warning btn-sm">Modifier</button>
                    <button onclick="supprimerUtilisateur(${u.ID})" class="btn btn-danger btn-sm">Supprimer</button>
                </td>
            </tr>
        `;

        tbody.innerHTML += ligne;
    });
}

chargerUtilisateurs();

let idEnModification = null;

function preparerModification(id, nom, email, role) {
    idEnModification = id;
    document.getElementById("input-nom").value = nom;
    document.getElementById("input-email").value = email;
    document.getElementById("input-role").value = role;
    document.getElementById("input-mdp").value = "";
}

document.getElementById("form-user").addEventListener("submit", async function (e) {
    e.preventDefault();

    const nouvelUser = {
        nom: document.getElementById("input-nom").value,
        email: document.getElementById("input-email").value,
        mot_de_passe: document.getElementById("input-mdp").value,
        role: document.getElementById("input-role").value
    };

    if (idEnModification === null) {
        await fetch("/utilisateurs", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("token")
            },
            body: JSON.stringify(nouvelUser)
        });
    } else {
        await fetch(`/utilisateurs/${idEnModification}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("token")
            },
            body: JSON.stringify(nouvelUser)
        });

        idEnModification = null;
    }

    document.getElementById("form-user").reset();
    chargerUtilisateurs();
});

async function supprimerUtilisateur(id) {
    const token = localStorage.getItem("token");

    await fetch(`/utilisateurs/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    chargerUtilisateurs();
}


// GESTION DES CATEGORIES

async function chargerCategories() {
    const reponse = await fetch("/categoriePresta");
    const categorie = await reponse.json();

    const tbody = document.getElementById("tableau-categories");
    tbody.innerHTML = "";

    categorie.forEach(u => {
        const ligne = `
            <tr>
                <td>${u.ID}</td>
                <td>${u.nom}</td>
                <td>${u.description}</td>
                <td>
                    <button onclick="preparerModificationCat(${u.ID}, '${u.nom}', '${u.description}')" class="btn btn-warning btn-sm">Modifier</button>
                    <button onclick="supprimerCategorie(${u.ID})" class="btn btn-danger btn-sm">Supprimer</button>
                </td>
            </tr>
        `;

        tbody.innerHTML += ligne;
    });
}

chargerCategories();

let idCatEnModification = null;

function preparerModificationCat(id, nom, description) {
    idCatEnModification = id;
    document.getElementById("cat-nom").value = nom;
    document.getElementById("cat-description").value = description;
}

async function supprimerCategorie(id) {
    const token = localStorage.getItem("token");

    await fetch(`/categoriePresta/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    chargerCategories();
}

document.getElementById("form-categorie").addEventListener("submit", async function (e) {
    e.preventDefault();

    const nouvelCat = {
        nom: document.getElementById("cat-nom").value,
        description: document.getElementById("cat-description").value
    };

    if (idCatEnModification === null) {
        await fetch("/categoriePresta", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("token")
            },
            body: JSON.stringify(nouvelCat)
        });
    } else {
        await fetch(`/categoriePresta/${idCatEnModification}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("token")
            },
            body: JSON.stringify(nouvelCat)
        });

        idCatEnModification = null;
    }

    document.getElementById("form-categorie").reset();
    chargerCategories();
});


// GESTION DES PRESTATIONS

async function chargerPrestation() {
    const reponse = await fetch("/prestations");
    const prestation = await reponse.json();

    const tbody = document.getElementById("tableau-prestation");
    tbody.innerHTML = "";

    prestation.forEach(u => {
        const ligne = `
            <tr>
                <td>${u.ID}</td>
                <td>${u.nom}</td>
                <td>${u.description}</td>
                <td>${u.type_offre}</td>
                <td>${u.tarif}</td>
                <td>${u.capacite_max}</td>
                <td>
                    <button onclick="preparerModificationPresta(${u.ID}, '${u.nom}', '${u.description}', '${u.type_offre}', ${u.tarif}, ${u.capacite_max})" class="btn btn-warning btn-sm">Modifier</button>
                    <button onclick="supprimerPresta(${u.ID})" class="btn btn-danger btn-sm">Supprimer</button>
                </td>
            </tr>
        `;

        tbody.innerHTML += ligne;
    });
}

chargerPrestation();

let idPrestaEnModification = null;

function preparerModificationPresta(id, nom, description, typeOffre, tarif, capaciteMax) {
    idPrestaEnModification = id;
    document.getElementById("presta-nom").value = nom;
    document.getElementById("presta-description").value = description;
    document.getElementById("presta-TypeOffre").value = typeOffre;
    document.getElementById("presta-Tarif").value = tarif;
    document.getElementById("presta-CapaciteMax").value = capaciteMax;
}

async function supprimerPresta(id) {
    const token = localStorage.getItem("token");

    await fetch(`/prestations/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    chargerPrestation();
}

document.getElementById("form-prestation").addEventListener("submit", async function (e) {
    e.preventDefault();

    const nouvelPresta = {
        nom: document.getElementById("presta-nom").value,
        description: document.getElementById("presta-description").value,
        type_offre: document.getElementById("presta-TypeOffre").value,
        tarif: parseFloat(document.getElementById("presta-Tarif").value),
        capacite_max: parseInt(document.getElementById("presta-CapaciteMax").value)
    };

    if (idPrestaEnModification === null) {
        await fetch("/prestations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("token")
            },
            body: JSON.stringify(nouvelPresta)
        });
    } else {
        await fetch(`/prestations/${idPrestaEnModification}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("token")
            },
            body: JSON.stringify(nouvelPresta)
        });

        idPrestaEnModification = null;
    }

    document.getElementById("form-prestation").reset();
    chargerPrestation();
});


// GESTION DES EVENEMENTS

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

function preparerModificationEvents(id, titre, description, date_heure_debut, duree_minutes, capacite_max) {
    idEventsEnModification = id;
    document.getElementById("events_titre").value = titre;
    document.getElementById("events_description").value = description;
    document.getElementById("events_date").value = date_heure_debut;
    document.getElementById("events_duree").value = duree_minutes;
    document.getElementById("events_capacite_max").value = capacite_max;
}

async function supprimerEvents(id) {
    const token = localStorage.getItem("token");

    await fetch(`/evenements/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    chargerEvenements();
}

document.getElementById("form-evenement").addEventListener("submit", async function (e) {
    e.preventDefault();

    const nouvelEvents = {
        titre: document.getElementById("events_titre").value,
        description: document.getElementById("events_description").value,
        date_heure_debut: document.getElementById("events_date").value,
        duree_minutes: parseFloat(document.getElementById("events_duree").value),
        capacite_max: parseInt(document.getElementById("events_capacite_max").value)
    };

    const token = localStorage.getItem("token");

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


// GESTION DES DEMANDES DE DEPOT

async function chargerDemandesDepot() {
    const reponse = await fetch("/depotconteneurs", {
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("token")
        }
    });

    if (!reponse.ok) {
        alert("Erreur lors du chargement des demandes de dépôt.");
        return;
    }

    const depots = await reponse.json();
    const tbody = document.getElementById("tableau-depot");

    tbody.innerHTML = "";

    depots.forEach(d => {
        const ligne = `
            <tr>
                <td>${d.ID}</td>
                <td>${d.titre}</td>
                <td>${d.description}</td>
                <td>${d.statut}</td>
                <td>
                    ${d.statut === "EN_ATTENTE"
                ? `<button onclick="validerDepot(${d.ID})" class="btn btn-success btn-sm">Valider</button>`
                : "Déjà traité"}
                </td>
            </tr>
        `;

        tbody.innerHTML += ligne;
    });
}

async function validerDepot(id) {
    const token = localStorage.getItem("token");

    const reponse = await fetch(`/depotconteneurs/${id}`, {
        method: "PUT",
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    if (reponse.ok) {
        await chargerDemandesDepot();
    } else {
        alert("Erreur lors de la validation du dépôt.");
    }
}


// GESTION DES ANNONCES

async function chargerDepots() {
    const reponse = await fetch("/annonces", {
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("token")
        }
    });

    const depots = await reponse.json();
    const tbody = document.getElementById("tableau-annonces");

    tbody.innerHTML = "";

    depots.forEach(d => {
        const ligne = `
            <tr>
                <td>${d.ID}</td>
                <td>${d.titre}</td>
                <td>${d.description}</td>
                <td>${d.type_annonce}</td>
                <td>${d.prix_vente}</td>
                <td>${d.statut}</td>
                <td>${d.utilisateur_id}</td>
                <td>
                    <button onclick="validerAnnonce(${d.ID})" class="btn btn-success btn-sm">Valider</button>
                    <button onclick="refuserAnnonce(${d.ID})" class="btn btn-warning btn-sm">Refuser</button>
                    <button onclick="supprimerDepots(${d.ID})" class="btn btn-danger btn-sm">Supprimer</button>
                </td>
            </tr>
        `;

        tbody.innerHTML += ligne;
    });
}

async function validerAnnonce(id) {
    const token = localStorage.getItem("token");

    await fetch(`/annonces/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ statut: "VALIDE" })
    });

    chargerDepots();
}

async function refuserAnnonce(id) {
    const token = localStorage.getItem("token");

    await fetch(`/annonces/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ statut: "REFUSE" })
    });

    chargerDepots();
}

async function supprimerDepots(id) {
    const token = localStorage.getItem("token");

    await fetch(`/annonces/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    chargerDepots();
}



// GESTION DES CONSEILS

async function chargerConseils() {
    const reponse = await fetch("/conseils");
    const categorie = await reponse.json();

    const tbody = document.getElementById("tableau-conseils");
    tbody.innerHTML = "";

    categorie.forEach(c => {
        const ligne = `
            <tr>
                <td>${c.ID}</td>
                <td>${c.titre}</td>
                <td>${c.contenu}</td>
                <td>
                    <button onclick="supprimerConseil(${c.ID})" class="btn btn-danger btn-sm">Supprimer</button>
                </td>
            </tr>
        `;

        tbody.innerHTML += ligne;
    });
}

chargerConseils();

document.getElementById("form-conseil").addEventListener("submit", async function (e) {
    e.preventDefault();

    const nouveauConseil = {
        titre: document.getElementById("conseil-titre").value,
        contenu: document.getElementById("conseil-contenu").value
    };

    const token = localStorage.getItem("token");

    await fetch("/conseils", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify(nouveauConseil)
    });

    document.getElementById("form-conseil").reset();
    chargerConseils();
});

async function supprimerConseil(id) {
    const token = localStorage.getItem("token");

    await fetch(`/conseils/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    chargerConseils();
}


// GESTION DES TRADUCTIONS

async function traduire(langue) {
    const reponse = await fetch(`/static/${langue}.json`);
    const textes = await reponse.json();

    document.querySelectorAll("[data-i18n]").forEach(element => {
        const cle = element.getAttribute("data-i18n");
        element.textContent = textes[cle];
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(element => {
        const cle = element.getAttribute("data-i18n-placeholder");
        element.placeholder = textes[cle];
    });
}


// GESTION DE LA NAVIGATION ENTRE LES SECTIONS

document.addEventListener("DOMContentLoaded", () => {
    const buttons = document.querySelectorAll(".navbar-nav .nav-link[data-section]");
    const sections = document.querySelectorAll("section[id^='section-']");

    function showSection(sectionName) {
        sections.forEach(section => {
            if (section.id === "section-" + sectionName) {
                section.style.display = "block";
            } else {
                section.style.display = "none";
            }
        });

        if (sectionName === "annonces") {
            chargerDepots();
        }
        if (sectionName === "depot") {
            chargerDemandesDepot();
        }
    }

    // Afficher la première section au chargement
    if (sections.length > 0) {
        sections.forEach((section, index) => {
            section.style.display = index === 0 ? "block" : "none";
        });
    }

    // Ecouter les clics sur les boutons du menu
    buttons.forEach(button => {
        button.addEventListener("click", () => {
            const sectionName = button.getAttribute("data-section");
            console.log("Section cliquée :", sectionName);
            showSection(sectionName);
        });
    });
});


// GESTION DE LA DECONNEXION

const btnLogout = document.getElementById("btn-logout");

if (btnLogout) {
    btnLogout.addEventListener("click", () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        window.location.href = "/";
    });
}
