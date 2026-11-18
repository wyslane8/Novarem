const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

if (!token || role !== "professionnel") {
    window.location.href = "/static/index.html";
}

async function api(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token,
            ...options.headers
        }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.erreur || "Une erreur est survenue");
    }

    return data;
}

function afficherSection(nom) {
    document.querySelectorAll("main section").forEach(section => {
        section.classList.add("d-none");
    });

    document.getElementById("section-" + nom).classList.remove("d-none");

    if (nom === "catalogue") chargerCatalogue();
    if (nom === "annonces") chargerAnnonces();
    if (nom === "conteneurs") chargerConteneurs();
    if (nom === "recuperation") chargerRecuperation();
    if (nom === "profil") chargerProfil();
    if(nom === "mes-recuperations") chargerMesDemandes();
}

document.getElementById("actualiser-recuperation").addEventListener("click", chargerRecuperation)
document.querySelectorAll("[data-section]").forEach(bouton => {
    bouton.addEventListener("click", () => afficherSection(bouton.dataset.section));
});

document.getElementById("btn-logout").addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/static/index.html";
});

async function chargerCatalogue() {
    try {
        const annonces = await api("/catalogue");
        const tableau = document.getElementById("tableau-catalogue");
        tableau.innerHTML = "";

        annonces.forEach(a => {
            tableau.innerHTML += `
                <tr>
                    <td>${a.titre}</td>
                    <td>${a.description}</td>
                    <td>${a.type_annonce}</td>
                    <td>${a.prix_vente} €</td>
                </tr>`;
        });

        if (!annonces.length) tableau.innerHTML = "<tr><td colspan='4'>Aucune annonce disponible.</td></tr>";
    } catch (e) {
        alert(e.message);
    }
}

async function chargerAnnonces() {
    try {
        const annonces = await api("/mesannonces");
        const tableau = document.getElementById("tableau-annonces");
        const select = document.getElementById("conteneur-annonce");

        tableau.innerHTML = "";
        select.innerHTML = '<option value="">Choisir une annonce validée</option>';

        annonces.forEach(a => {
            tableau.innerHTML += `
                <tr>
                    <td>${a.titre}</td>
                    <td>${a.description}</td>
                    <td>${a.type_annonce}</td>
                    <td>${a.prix_vente} €</td>
                    <td>${a.statut}</td>
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="supprimerAnnonce(${a.ID})">
                            Supprimer
                        </button>
                    </td>
                </tr>`;

            if (a.statut === "VALIDE") {
                select.innerHTML += `<option value="${a.ID}">${a.titre}</option>`;
            }
        });

        if (!annonces.length) tableau.innerHTML = "<tr><td colspan='6'>Vous n'avez pas encore d'annonce.</td></tr>";
    } catch (e) {
        alert(e.message);
    }
}

document.getElementById("form-annonce").addEventListener("submit", async e => {
    e.preventDefault();

    const annonce = {
        titre: document.getElementById("annonce-titre").value,
        description: document.getElementById("annonce-description").value,
        type_annonce: document.getElementById("annonce-type").value,
        nature_annonce: document.getElementById("annonce-nature").value,
        prix_vente: Number(document.getElementById("annonce-prix").value)
    };

    try {
        await api("/annonces", {
            method: "POST",
            body: JSON.stringify(annonce)
        });

        document.getElementById("annonce-message").textContent =
            "Annonce créée. Elle est en attente de validation par un administrateur.";

        e.target.reset();
        chargerAnnonces();
    } catch (err) {
        document.getElementById("annonce-message").textContent = err.message;
    }
});

async function supprimerAnnonce(id) {
    if (!confirm("Supprimer cette annonce ?")) return;

    try {
        await api("/annonces/" + id, { method: "DELETE" });
        chargerAnnonces();
    } catch (e) {
        alert(e.message);
    }
}

async function chargerConteneurs() {
    const reponse = await fetch("/depotmesconteneurs", {
        headers: { "Authorization": "Bearer " + token }
    });
    const depots = await reponse.json();
    const tableau = document.getElementById("tableau-conteneurs");
    tableau.innerHTML = "";

    if (depots.length === 0) {
        tableau.innerHTML = "<tr><td colspan='6'>Aucun dépôt pour le moment.</td></tr>";
        return;
    }

    depots.forEach(d => {
        let justificatif = "";
        if (d.statut === "VALIDE") {
            justificatif = `
                <img id="codebarres-${d.ID}" class="d-block mb-2" style="max-width:200px">
                <button onclick="telechargerPDF(${d.ID})" class="btn btn-primary btn-sm">PDF</button>
            `;
        }
        tableau.innerHTML += `
            <tr>
                <td>${d.titre}</td>
                <td>${d.description}</td>
                <td>${d.statut}</td>
                <td>${d.code_barres || "En attente"}</td>
                <td>${d.code_ouverture || "En attente"}</td>
                <td>${justificatif}</td>
            </tr>`;
    });

    //images  chargées apres la boucle, sinon innerHTML += les efface
    depots.forEach(d => {
        if (d.statut === "VALIDE") {
            chargerImageCodeBarres(d.ID);
        }
    });
}


async function chargerRecuperation() {
    try {
        const depots = await api("/professionnel/conteneurs");
        const tableau = document.getElementById("tableau-recuperation");

        tableau.innerHTML = "";

        depots.forEach(d => {
            tableau.innerHTML += `
                <tr>
                    <td>${d.titre}</td>
                    <td>${d.description}</td>
                    <td>${d.code_barres}</td>
                    <td>
                        <button onclick = "demanderRecuperation(${d.ID})" class ="btn btn-primary btn-sm">Demander </button>
                    </td>
                </tr>`;
        });

        if (!depots.length) {
            tableau.innerHTML = "<tr><td colspan='4'>Aucun objet disponible.</td></tr>";
        }

    } catch (e) {
        alert(e.message);
    }
}

document.getElementById("form-conteneur").addEventListener("submit", async e => {
    e.preventDefault();

    const annonceID = Number(document.getElementById("conteneur-annonce").value);

    try {
        await api("/depotconteneurs", {
            method: "POST",
            body: JSON.stringify({ annonce_id: annonceID })
        });

        document.getElementById("conteneur-message").textContent =
            "Demande de dépôt envoyée.";
        e.target.reset();
        chargerConteneurs();
    } catch (err) {
        document.getElementById("conteneur-message").textContent = err.message;
    }
});

document.getElementById("actualiser-catalogue").addEventListener("click", chargerCatalogue);
document.getElementById("actualiser-conteneurs").addEventListener("click", chargerConteneurs);

async function demanderRecuperation(id) {
    const reponse = await fetch("/professionnel/demandes-recuperation", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ conteneur_id: id })
    })
    if (reponse.ok) {
        alert("succes");
    } else {
        const data = await reponse.json();
        alert(data.erreur);
    }
    chargerRecuperation();
}

async function chargerProfil() {
    const reponse = await fetch("/profil", {
        headers: { "Authorization": "Bearer " + token }
    });
    const profil = await reponse.json();
    document.getElementById("profil-affiche-nom").textContent = profil.nom;
    document.getElementById("profil-affiche-email").textContent = profil.email;
    document.getElementById("profil-nom").value = profil.nom;
    document.getElementById("profil-email").value = profil.email;
    document.getElementById("profil-mdp").value = "";

    document.getElementById("profil-affiche-role").textContent = profil.role;
    const date = new Date(profil.CreatedAt);
    document.getElementById("profil-affiche-date").textContent = date.toLocaleDateString("fr-FR");

}

document.getElementById("form-profil").addEventListener("submit", async function (e) {
    e.preventDefault();
    const nouveauProfil = {
        nom: document.getElementById("profil-nom").value,
        email: document.getElementById("profil-email").value,
        mot_de_passe: document.getElementById("profil-mdp").value
    };
    const reponse = await fetch("/profil", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify(nouveauProfil)
    });
    if (reponse.ok) {
        alert("Profil mis à jour");
        chargerProfil();
    } else {
        const data = await reponse.json();
        alert(data.erreur);
    }
});

async function chargerMesDemandes() {
    const reponse = await fetch("/professionnel/mes-demandes", {
        headers: { "Authorization": "Bearer " + token }
    });
    const demandes = await reponse.json();
    const div = document.getElementById("liste-mes-demandes");
    div.innerHTML = "";

    if (demandes.length === 0) {
        div.innerHTML = `<p class="text-muted">Aucune demande pour l'instant.</p>`;
        return;
    }

    demandes.forEach(d => {
        let contenu = "";
        if (d.statut === "ACCEPTEE") {
            contenu = `
                <p class="card-text">Code d'ouverture : <strong>${d.code_ouverture}</strong></p>
                <input type="text" id="scan-${d.ID}" class="form-control mb-2" style="max-width:300px" placeholder="Scanner le code-barres de l'objet">
                <button onclick="confirmerRecuperation(${d.ID})" class="btn btn-success btn-sm">Confirmer la récupération</button>
            `;
        } else if (d.statut === "TERMINEE") {
            contenu = `<p class="text-success">Objet récupéré ✓</p>`;
        } else if (d.statut === "REFUSEE") {
            contenu = `<p class="text-danger">Demande refusée.</p>`;
        } else {
            contenu = `<p class="text-muted">En attente de réponse du particulier.</p>`;
        }

        div.innerHTML += `
        <div class="card mb-3">
            <div class="card-body">
                <h5 class="card-title">${d.titre}</h5>
                <p class="card-text">Statut : ${d.statut}</p>
                ${contenu}
            </div>
        </div>`;
    });
}

async function confirmerRecuperation(id) {
    const code = document.getElementById("scan-" + id).value;
    const reponse = await fetch(`/professionnel/demandes/${id}/recuperer`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ code_barres: code })
    });
    if (reponse.ok) {
        alert("Récupération confirmée");
    } else {
        const data = await reponse.json();
        alert(data.erreur);
    }
    chargerMesDemandes();
}

const natureAnnoncePro = document.getElementById("annonce-nature");
const champPrixPro = document.getElementById("annonce-prix");

natureAnnoncePro.addEventListener("change", function () {
    if (natureAnnoncePro.value === "DON") {
        champPrixPro.value = 0;
        champPrixPro.disabled = true;
    } else {
        champPrixPro.value = "";
        champPrixPro.disabled = false;
    }
});


async function chargerImageCodeBarres(id) {
    const reponse = await fetch(`/conteneur/${id}/codebarres`, {
        headers: { "Authorization": "Bearer " + token }
    });
    if (!reponse.ok) {
        return;
    }
    const blob = await reponse.blob();
    const url = URL.createObjectURL(blob);
    document.getElementById("codebarres-" + id).src = url;
}

async function telechargerPDF(id) {
    const reponse = await fetch(`/conteneur/${id}/pdf`, {
        headers: { "Authorization": "Bearer " + token }
    });
    const blob = await reponse.blob();
    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = "justificatif.pdf";
    lien.click();
}
