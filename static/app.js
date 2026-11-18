const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

if (!token || role !== "admin") {
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



// GESTION DES UTILISATEURS

async function chargerUtilisateurs() {
    const reponse = await fetch("/utilisateurs", {
        headers: { "Authorization": "Bearer " + token }
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

    let reponse;
    if (idEnModification === null) {
        reponse = await fetch("/utilisateurs", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify(nouvelUser)
        });
    } else {
        reponse = await fetch(`/utilisateurs/${idEnModification}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify(nouvelUser)
        });
        idEnModification = null;
    }

    await afficherResultat(reponse);
    document.getElementById("form-user").reset();
    chargerUtilisateurs();
});

async function supprimerUtilisateur(id) {
    await fetch(`/utilisateurs/${id}`, {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + token }
    });
    chargerUtilisateurs();
}


// GESTION DES CATEGORIES

async function chargerCategories() {
    const reponse = await fetch("/categoriePresta");
    const categories = await reponse.json();
    const tbody = document.getElementById("tableau-categories");
    tbody.innerHTML = "";

    categories.forEach(u => {
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
    await fetch(`/categoriePresta/${id}`, {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + token }
    });
    chargerCategories();
}

document.getElementById("form-categorie").addEventListener("submit", async function (e) {
    e.preventDefault();

    const nouvelCat = {
        nom: document.getElementById("cat-nom").value,
        description: document.getElementById("cat-description").value
    };

    let reponse;
    if (idCatEnModification === null) {
        reponse = await fetch("/categoriePresta", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify(nouvelCat)
        });
    } else {
        reponse = await fetch(`/categoriePresta/${idCatEnModification}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify(nouvelCat)
        });
        idCatEnModification = null;
    }

    await afficherResultat(reponse);
    document.getElementById("form-categorie").reset();
    chargerCategories();
});


// GESTION DES PRESTATIONS

async function chargerPrestation() {
    const reponse = await fetch("/prestations");
    const prestations = await reponse.json();
    const tbody = document.getElementById("tableau-prestation");
    tbody.innerHTML = "";

    prestations.forEach(u => {
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
    await fetch(`/prestations/${id}`, {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + token }
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

    let reponse;
    if (idPrestaEnModification === null) {
        reponse = await fetch("/prestations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify(nouvelPresta)
        });
    } else {
        reponse = await fetch(`/prestations/${idPrestaEnModification}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify(nouvelPresta)
        });
        idPrestaEnModification = null;
    }

    await afficherResultat(reponse);
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
    //le champ datetime-local veut le format AAAA-MM-JJTHH:MM
    document.getElementById("events_date").value = date_heure_debut.slice(0, 16);
    document.getElementById("events_duree").value = duree_minutes;
    document.getElementById("events_capacite_max").value = capacite_max;
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


// GESTION DES DEMANDES DE DEPOT

async function chargerDemandesDepot() {
    const reponse = await fetch("/depotconteneurs", {
        headers: { "Authorization": "Bearer " + token }
    });

    if (!reponse.ok) {
        alert("Erreur lors du chargement des demandes de dépôt.");
        return;
    }

    const depots = await reponse.json();
    const tbody = document.getElementById("tableau-depot");
    tbody.innerHTML = "";

    depots.forEach(d => {
        //on peut valider ou refuser seulement si la demande est en attente
        let boutons = "Déjà traité";
        if (d.statut === "EN_ATTENTE") {
            boutons = `
                <button onclick="validerDepot(${d.ID})" class="btn btn-success btn-sm">Valider</button>
                <button onclick="refuserDepot(${d.ID})" class="btn btn-danger btn-sm">Refuser</button>
            `;
        }
        const ligne = `
            <tr>
                <td>${d.ID}</td>
                <td>${d.titre}</td>
                <td>${d.description}</td>
                <td>${d.statut}</td>
                <td>${boutons}</td>
            </tr>
        `;
        tbody.innerHTML += ligne;
    });
}

async function validerDepot(id) {
    const reponse = await fetch(`/depotconteneurs/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ statut: "VALIDE" })
    });

    if (reponse.ok) {
        chargerDemandesDepot();
    } else {
        const data = await reponse.json();
        alert(data.erreur);
    }
}

async function refuserDepot(id) {
    if (!confirm("Voulez-vous vraiment refuser cette demande ?")) {
        return;
    }

    const reponse = await fetch(`/depotconteneurs/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ statut: "REFUSE" })
    });

    if (reponse.ok) {
        chargerDemandesDepot();
    } else {
        const data = await reponse.json();
        alert(data.erreur);
    }
}


// GESTION DES DEMANDES DE RECUPERATION

async function chargerRecuperationsAdmin() {
    const reponse = await fetch("/demandes-recuperation", {
        headers: { "Authorization": "Bearer " + token }
    });
    const demandes = await reponse.json();
    const tbody = document.getElementById("tableau-recuperations");
    tbody.innerHTML = "";

    if (demandes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-muted">Aucune demande pour l'instant.</td></tr>`;
        return;
    }

    demandes.forEach(d => {
        tbody.innerHTML += `
            <tr>
                <td>${d.ID}</td>
                <td>${d.conteneur_id}</td>
                <td>${d.professionnel_id}</td>
                <td>${d.particulier_ID}</td>
                <td>${d.statut}</td>
            </tr>`;
    });
}


// GESTION DES ANNONCES

async function chargerDepots() {
    const reponse = await fetch("/annonces", {
        headers: { "Authorization": "Bearer " + token }
    });
    const annonces = await reponse.json();
    const tbody = document.getElementById("tableau-annonces");
    tbody.innerHTML = "";

    annonces.forEach(d => {
        let boutons = "";
        if (d.statut === "EN_ATTENTE") {
            boutons = `
                <button onclick="validerAnnonce(${d.ID})" class="btn btn-success btn-sm">Valider</button>
                <button onclick="refuserAnnonce(${d.ID})" class="btn btn-warning btn-sm">Refuser</button>
            `;
        }
        const ligne = `
            <tr>
                <td>${d.ID}</td>
                <td>${d.titre}</td>
                <td>${d.description}</td>
                <td>${d.type_annonce}</td>
                <td>${d.nature_annonce}</td>
                <td>${d.prix_vente}</td>
                <td>${d.statut}</td>
                <td>${d.utilisateur_id}</td>
                <td>
                    ${boutons}
                    <button onclick="supprimerDepots(${d.ID})" class="btn btn-danger btn-sm">Supprimer</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += ligne;
    });
}

async function validerAnnonce(id) {
    await fetch(`/annonces/${id}/statut`, {
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
    await fetch(`/annonces/${id}/statut`, {
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
    await fetch(`/annonces/${id}`, {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + token }
    });
    chargerDepots();
}


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

//on retrouve le conseil dans la liste deja chargée, comme ça pas de souci avec les apostrophes
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


// TRADUCTIONS

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

// NAVIGATION ENTRE LES SECTIONS

function afficherSection(nom) {
    document.querySelectorAll("section").forEach(s => s.style.display = "none");
    document.getElementById("section-" + nom).style.display = "block";

    //certaines sections chargent leurs données seulement quand on clique dessus
    if (nom === "annonces") chargerDepots();
    if (nom === "depot") chargerDemandesDepot();
    if (nom === "recuperations") chargerRecuperationsAdmin();
}

document.querySelectorAll("[data-section]").forEach(bouton => {
    bouton.addEventListener("click", () => afficherSection(bouton.dataset.section));
});

//au chargement on affiche seulement les utilisateurs
afficherSection("utilisateurs");


// DECONNEXION

document.getElementById("btn-logout").addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/";
});
