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
    try {
        const depots = await api("/depotmesconteneurs");
        const tableau = document.getElementById("tableau-conteneurs");
        tableau.innerHTML = "";

        depots.forEach(d => {
            tableau.innerHTML += `
                <tr>
                    <td>${d.titre}</td>
                    <td>${d.description}</td>
                    <td>${d.statut}</td>
                    <td>${d.code_barres || "En attente"}</td>
                    <td>${d.code_ouverture || "En attente"}</td>
                </tr>`;
        });

        if (!depots.length) tableau.innerHTML = "<tr><td colspan='5'>Aucun dépôt pour le moment.</td></tr>";
    } catch (e) {
        alert(e.message);
    }
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
