const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

//si on est pas connecté en particulier on retourne au login
if (!token || role !== "particulier") {
    window.location.href = "/";
}


function dateFr(d) {
    if (!d) return "";
    const date = new Date(d);
    return isNaN(date) ? esc(d) : date.toLocaleDateString("fr-FR");
}

//pour date_heure_debut des evenements
function dateHeureFr(d) {
    if (!d) return "";
    const date = new Date(d);
    if (isNaN(date)) return esc(d);
    return date.toLocaleDateString("fr-FR") + " à " +
        date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

//affiche le resultat et message dispo car fonctionnalités indispo
async function afficherResultat(reponse) {
    if (reponse.ok) {
        alert("Enregistré");
    } else if (reponse.status === 404) {
        alert("Fonctionnalité bientôt disponible");
    } else {
        try {
            const data = await reponse.json();
            alert(data.erreur || "Une erreur est survenue");
        } catch {
            alert("Une erreur est survenue");
        }
    }
}


async function getJSON(url) {
    try {
        const reponse = await fetch(url, { headers: { "Authorization": "Bearer " + token } });
        if (!reponse.ok) return null;
        const data = await reponse.json();
        return data ?? []; // renvoie null quand la liste est vide
    } catch {
        return null;
    }
}


function envoyer(url, methode, corps) {
    return fetch(url, {
        method: methode,
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: corps ? JSON.stringify(corps) : undefined
    });
}

//pour les paiements le back renvoie l'url Stripe
async function payer(url, corps) {
    const reponse = await envoyer(url, "POST", corps);
    if (reponse.ok) {
        const data = await reponse.json().catch(() => ({}));
        if (data.url) {
            window.location.href = data.url;
            return;
        }
        alert("Réservation enregistrée");
    } else {
        await afficherResultat(reponse);
    }
}

async function telechargerFichier(url, nom) {
    const reponse = await fetch(url, { headers: { "Authorization": "Bearer " + token } });
    if (!reponse.ok) {
        await afficherResultat(reponse);
        return;
    }
    const blob = await reponse.blob();
    const lien = document.createElement("a");
    lien.href = URL.createObjectURL(blob);
    lien.download = nom;
    lien.click();
}

const INDISPO = `<p class="text-muted">Fonctionnalité bientôt disponible.</p>`;
function vide(texte) {
    return `<p class="text-muted">${texte}</p>`;
}


// nav

function afficherSection(nom) {
    document.querySelectorAll("main section").forEach(s => s.classList.add("d-none"));
    document.getElementById("section-" + nom).classList.remove("d-none");

    document.querySelectorAll("[data-section]").forEach(b => {
        b.classList.toggle("active", b.dataset.section === nom);
    });

    if (nom === "accueil") chargerAccueil();
    if (nom === "depot") chargerAnnonces();
    if (nom === "catalogue") chargerCatalogue();
    if (nom === "conseil") chargerConseils();
    if (nom === "evenements") chargerEvenements();
    if (nom === "prestations") chargerPrestations();
    if (nom === "projets") chargerProjets();
    if (nom === "conteneur") {
        chargerConteneurs();
        chargerDemandes();
        chargerAnnoncesPourSelect();
    }
    if (nom === "forum") {
        fermerSujet();
        chargerSujets();
    }
    if (nom === "actualites") chargerActualites();
    if (nom === "abonnement") chargerAbonnement();
    if (nom === "factures") chargerFactures();
    if (nom === "profil") chargerProfil();
}

document.querySelectorAll("[data-section]").forEach(bouton => {
    bouton.addEventListener("click", () => afficherSection(bouton.dataset.section));
});

document.getElementById("btn-logout").addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/";
});


// accueil

async function chargerAccueil() {
    const profil = await getJSON("/profil");
    if (profil) {
        document.getElementById("accueil-nom").textContent = profil.nom;
    }

    //c'est 10 pts/annonce & la barre se remplit tous les 100 pts
    const score = await getJSON("/score");
    const points = score && score.score ? score.score : 0;
    document.getElementById("score-valeur").textContent = points;
    document.getElementById("score-barre").style.width = (points % 100) + "%";

    //3 dernieres annonces
    const divDepots = document.getElementById("accueil-depots");
    const annonces = await getJSON("/mesannonces");
    if (!annonces) {
        divDepots.innerHTML = INDISPO;
    } else if (annonces.length === 0) {
        divDepots.innerHTML = vide("Aucune annonce pour l'instant.");
    } else {
        divDepots.innerHTML = annonces.slice(-3).reverse().map(a => `
            <div class="card mb-2" style="max-width:500px">
                <div class="card-body py-2 d-flex justify-content-between">
                    <span>${esc(a.titre)}</span>
                    <span class="badge bg-secondary">${esc(a.statut)}</span>
                </div>
            </div>`).join("");
    }

    //planning = evenements auxquels je suis inscrit
    const divPlanning = document.getElementById("accueil-planning");
    const planning = await getJSON("/mes-inscriptions");
    if (!planning) {
        divPlanning.innerHTML = INDISPO;
    } else if (planning.length === 0) {
        divPlanning.innerHTML = vide("Rien de prévu.");
    } else {
        divPlanning.innerHTML = planning.map(ev =>
            `<p class="mb-1"><strong>${dateHeureFr(ev.date_heure_debut)}</strong> : ${esc(ev.titre)}</p>`
        ).join("");
    }

    //reservations de prestations , back pas encore fait 
    const divResa = document.getElementById("accueil-reservations");
    const resas = await getJSON("/reservations");
    if (!resas) {
        divResa.innerHTML = INDISPO;
    } else if (resas.length === 0) {
        divResa.innerHTML = vide("Aucune réservation.");
    } else {
        divResa.innerHTML = resas.map(r =>
            `<p class="mb-1">${esc(r.nom || r.titre)} <span class="badge bg-info text-dark">${esc(r.statut)}</span></p>`
        ).join("");
    }
}


// annoces

async function chargerAnnonces() {
    const annonces = await getJSON("/mesannonces");
    const tableau = document.getElementById("tableau-depots");

    if (!annonces) {
        tableau.innerHTML = "<tr><td colspan='6'>Fonctionnalité bientôt disponible.</td></tr>";
        return;
    }
    if (annonces.length === 0) {
        tableau.innerHTML = "<tr><td colspan='6'>Vous n'avez pas encore d'annonce.</td></tr>";
        return;
    }

    tableau.innerHTML = annonces.map(a => `
        <tr>
            <td>${esc(a.titre)}</td>
            <td>${esc(a.description)}</td>
            <td>${esc(a.type_annonce)}</td>
            <td>${a.nature_annonce === "DON" ? "Don" : a.prix_vente + " €"}</td>
            <td>${esc(a.statut)}</td>
            <td><button onclick="supprimerAnnonce(${a.ID})" class="btn btn-danger btn-sm">Supprimer</button></td>
        </tr>`).join("");
}

//si c'est don alors = 0€
const natureAnnonce = document.getElementById("depot-nature");
const champPrix = document.getElementById("depot-prix");

natureAnnonce.addEventListener("change", function () {
    if (natureAnnonce.value === "DON") {
        champPrix.value = 0;
        champPrix.disabled = true;
    } else {
        champPrix.value = "";
        champPrix.disabled = false;
    }
});

document.getElementById("form-depot").addEventListener("submit", async function (e) {
    e.preventDefault();
    const annonce = {
        titre: document.getElementById("depot-titre").value,
        description: document.getElementById("depot-description").value,
        type_annonce: document.getElementById("depot-type").value,
        nature_annonce: natureAnnonce.value,
        prix_vente: natureAnnonce.value === "DON" ? 0 : Number(champPrix.value)
    };
    const reponse = await envoyer("/annonces", "POST", annonce);

    if (reponse.ok) {
        alert("Annonce créée. Elle est en attente de validation par un administrateur.");
        document.getElementById("form-depot").reset();
        champPrix.disabled = false;
    } else {
        await afficherResultat(reponse);
    }
    chargerAnnonces();
});

async function supprimerAnnonce(id) {
    if (!confirm("Supprimer cette annonce ?")) return;
    const reponse = await envoyer(`/annonces/${id}`, "DELETE");
    if (!reponse.ok) await afficherResultat(reponse);
    chargerAnnonces();
}


// catalogue

let toutLeCatalogue = [];

async function chargerCatalogue() {
    toutLeCatalogue = (await getJSON("/catalogue")) || [];
    afficherCatalogue();
}

//
function afficherCatalogue() {
    const recherche = document.getElementById("recherche-catalogue").value.toLowerCase();
    const categorie = document.getElementById("filtre-categorie").value;
    const tableau = document.getElementById("tableau-catalogue");

    const liste = toutLeCatalogue.filter(a =>
        (categorie === "" || a.type_annonce === categorie) &&
        ((a.titre || "").toLowerCase().includes(recherche) ||
         (a.description || "").toLowerCase().includes(recherche))
    );

    if (liste.length === 0) {
        tableau.innerHTML = "<tr><td colspan='5'>Aucune annonce trouvée.</td></tr>";
        return;
    }

    tableau.innerHTML = liste.map(a => {
        
        let action = "Don";
        let prix = "Gratuit";
        if (a.nature_annonce === "VENTE") {
            action = `<button onclick="acheterAnnonce(${a.ID})" class="btn btn-success btn-sm">Acheter</button>`;
            prix = a.prix_vente + " €";
        }
        return `
        <tr>
            <td>${esc(a.titre)}</td>
            <td>${esc(a.description)}</td>
            <td>${esc(a.type_annonce)}</td>
            <td>${prix}</td>
            <td>${action}</td>
        </tr>`;
    }).join("");
}

document.getElementById("recherche-catalogue").addEventListener("input", afficherCatalogue);
document.getElementById("filtre-categorie").addEventListener("change", afficherCatalogue);

function acheterAnnonce(id) {
    payer("/paiement/session", { type: "annonce", id: id });
}


// conseils

async function chargerConseils() {
    const div = document.getElementById("liste-conseils");
    const conseils = await getJSON("/conseils");
    if (!conseils) { div.innerHTML = INDISPO; return; }
    if (conseils.length === 0) { div.innerHTML = vide("Aucun conseil pour l'instant."); return; }

    div.innerHTML = conseils.map(c => `
        <div class="card mb-3">
            <div class="card-body">
                <h5 class="card-title">${esc(c.titre)}</h5>
                <p class="card-text">${esc(c.contenu)}</p>
            </div>
        </div>`).join("");
}


// events

async function chargerEvenements() {
    const div = document.getElementById("liste-evenements-dispo");
    const evenements = await getJSON("/evenements");
    if (!evenements) { div.innerHTML = INDISPO; return; }
    if (evenements.length === 0) { div.innerHTML = vide("Aucun évènement à venir."); return; }


    const mesInscriptions = (await getJSON("/mes-inscriptions")) || [];
    const idsInscrits = mesInscriptions.map(ev => ev.ID);

  
    const places = await Promise.all(
        evenements.map(ev => getJSON(`/evenements/${ev.ID}/places`))
    );

    div.innerHTML = evenements.map((ev, i) => {
        const inscrits = places[i] ? places[i].inscrits : 0;
        const restantes = ev.capacite_max - inscrits;

        let bouton = `<button onclick="inscrireEvenement(${ev.ID})" class="btn btn-primary btn-sm">S'inscrire</button>`;
        if (idsInscrits.includes(ev.ID)) {
            bouton = `<span class="badge bg-success">Inscrit ✓</span>`;
        } else if (restantes <= 0) {
            bouton = `<span class="badge bg-danger">Complet</span>`;
        }

        return `
        <div class="card mb-3">
            <div class="card-body">
                <h5 class="card-title">${esc(ev.titre)}</h5>
                <p class="card-text">${esc(ev.description)}</p>
                <p class="card-text mb-1">📅 ${dateHeureFr(ev.date_heure_debut)} (${ev.duree_minutes} min)</p>
                <p class="card-text">Places restantes : ${Math.max(restantes, 0)} / ${ev.capacite_max}</p>
                ${bouton}
            </div>
        </div>`;
    }).join("");
}
async function inscrireEvenement(id) {
    const reponse = await envoyer("/inscriptions", "POST", { evenement_id: id });
    if (reponse.ok) {
        alert("Inscription enregistrée");
    } else {
        await afficherResultat(reponse);
    }
    chargerEvenements();
}


// presta & forma

let toutesLesPrestations = [];

async function chargerPrestations() {
    const div = document.getElementById("liste-prestations");
    const prestations = await getJSON("/prestations");
    if (!prestations) {
        div.innerHTML = INDISPO;
        toutesLesPrestations = [];
        return;
    }
    toutesLesPrestations = prestations;
    remplirFiltrePrestations();
    afficherPrestations();
}


function remplirFiltrePrestations() {
    const select = document.getElementById("filtre-prestations");
    const valeurActuelle = select.value;
    const types = [...new Set(toutesLesPrestations.map(p => p.type_offre).filter(t => t))];

  
    while (select.options.length > 1) select.remove(1);
    types.forEach(t => {
        const option = document.createElement("option");
        option.value = t;
        option.textContent = t;
        select.appendChild(option);
    });
    select.value = types.includes(valeurActuelle) ? valeurActuelle : "";
}

function afficherPrestations() {
    const div = document.getElementById("liste-prestations");
    const filtre = document.getElementById("filtre-prestations").value;
    const liste = toutesLesPrestations.filter(p => filtre === "" || p.type_offre === filtre);

    if (liste.length === 0) {
        div.innerHTML = vide("Aucune offre pour l'instant.");
        return;
    }

    div.innerHTML = liste.map(p => {
        const prix = p.tarif > 0 ? p.tarif + " €" : "Gratuit";
        const capacite = p.capacite_max > 0 ? `<p class="card-text mb-1">👥 ${p.capacite_max} places</p>` : "";
        return `
        <div class="card mb-3">
            <div class="card-body">
                <h5 class="card-title">${esc(p.nom)} <span class="badge bg-secondary">${esc(p.type_offre)}</span></h5>
                <p class="card-text">${esc(p.description)}</p>
                ${capacite}
                <p class="card-text"><strong>${prix}</strong></p>
                <button onclick="reserverPrestation(${p.ID})" class="btn btn-primary btn-sm">Réserver</button>
            </div>
        </div>`;
    }).join("");
}

document.getElementById("filtre-prestations").addEventListener("change", afficherPrestations);
//route paimeent pas encore faite 
function reserverPrestation(id) {
    payer("/paiement/session", { type: "prestation", id: id });
}


// projet = route pas encore fait 

let tousLesProjets = [];
let idProjetEnModification = null;

async function chargerProjets() {
    const div = document.getElementById("liste-projets");
    const projets = await getJSON("/projets");
    if (!projets) { div.innerHTML = INDISPO; return; }

    tousLesProjets = projets;
    if (projets.length === 0) { div.innerHTML = vide("Aucun projet pour l'instant."); return; }

    div.innerHTML = projets.map(p => {
        const badge = p.mis_en_avant ? `<span class="badge bg-warning text-dark">Mis en avant</span>` : "";
        const avancement = Number(p.avancement) || 0;
        return `
        <div class="card mb-3">
            <div class="card-body">
                <h5 class="card-title">${esc(p.titre)} ${badge}</h5>
                <p class="card-text">${esc(p.description)}</p>
                <div class="progress mb-2">
                    <div class="progress-bar" style="width: ${avancement}%">${avancement} %</div>
                </div>
                <button onclick="preparerModificationProjet(${p.ID})" class="btn btn-warning btn-sm">Modifier</button>
            </div>
        </div>`;
    }).join("");
}

function preparerModificationProjet(id) {
    const projet = tousLesProjets.find(p => p.ID === id);
    if (!projet) return;
    idProjetEnModification = id;
    document.getElementById("projet-titre").value = projet.titre;
    document.getElementById("projet-description").value = projet.description;
    document.getElementById("projet-avancement").value = projet.avancement;
    document.getElementById("projet-avant").checked = projet.mis_en_avant;
    document.getElementById("btn-projet").textContent = "Modifier";
    document.getElementById("btn-annuler-projet").classList.remove("d-none");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function reinitialiserFormProjet() {
    idProjetEnModification = null;
    document.getElementById("form-projet").reset();
    document.getElementById("btn-projet").textContent = "Créer";
    document.getElementById("btn-annuler-projet").classList.add("d-none");
}

document.getElementById("btn-annuler-projet").addEventListener("click", reinitialiserFormProjet);

document.getElementById("form-projet").addEventListener("submit", async function (e) {
    e.preventDefault();
    const projet = {
        titre: document.getElementById("projet-titre").value,
        description: document.getElementById("projet-description").value,
        avancement: parseInt(document.getElementById("projet-avancement").value),
        mis_en_avant: document.getElementById("projet-avant").checked
    };

    let reponse;
    if (idProjetEnModification === null) {
        reponse = await envoyer("/projets", "POST", projet);
    } else {
        reponse = await envoyer(`/projets/${idProjetEnModification}`, "PUT", projet);
    }

    await afficherResultat(reponse);
    if (reponse.ok) reinitialiserFormProjet();
    chargerProjets();
});


// depot conteneur 


const COULEURS_STATUT = {
    EN_ATTENTE: "bg-secondary",
    VALIDE: "bg-success",
    REFUSE: "bg-danger",
    RESERVE: "bg-warning text-dark",
    RECUPERE: "bg-info text-dark"
};

const TEXTES_STATUT = {
    EN_ATTENTE: "En attente de validation par un administrateur.",
    VALIDE: "Validé : vous pouvez déposer l'objet dans le conteneur.",
    REFUSE: "Dépôt refusé.",
    RESERVE: "Un professionnel va récupérer l'objet.",
    RECUPERE: "Objet récupéré par un professionnel ✓"
};

async function chargerConteneurs() {
    const div = document.getElementById("liste-conteneur");
    const depots = await getJSON("/depotmesconteneurs");
    if (!depots) { div.innerHTML = INDISPO; return; }
    if (depots.length === 0) { div.innerHTML = vide("Aucun dépôt pour le moment."); return; }

    div.innerHTML = depots.map(d => {
        let actions = "";
        if (d.statut === "VALIDE") {
            actions = `
                <img id="codebarres-${d.ID}" class="d-block mb-2" style="max-width:250px" alt="Code-barres">
                <button onclick="telechargerPDF(${d.ID})" class="btn btn-primary btn-sm">Justificatif PDF</button>`;
        } else if (d.statut === "EN_ATTENTE") {
            actions = `<button onclick="annulerDepot(${d.ID})" class="btn btn-outline-danger btn-sm">Annuler la demande</button>`;
        }

        let codes = "";
        if (d.code_barres) {
            codes = `
                <p class="card-text mb-1">Code-barres : <strong>${esc(d.code_barres)}</strong></p>
                <p class="card-text">Code d'ouverture : <strong>${esc(d.code_ouverture)}</strong></p>`;
        }

        return `
        <div class="card mb-3">
            <div class="card-body">
                <h5 class="card-title">${esc(d.titre)} <span class="badge ${COULEURS_STATUT[d.statut] || "bg-secondary"}">${esc(d.statut)}</span></h5>
                <p class="card-text">${esc(d.description)}</p>
                <p class="card-text text-muted">${TEXTES_STATUT[d.statut] || ""}</p>
                ${codes}
                ${actions}
            </div>
        </div>`;
    }).join("");

    depots.filter(d => d.statut === "VALIDE").forEach(d => chargerImageCodeBarres(d.ID));
}

async function chargerImageCodeBarres(id) {
    const reponse = await fetch(`/conteneur/${id}/codebarres`, {
        headers: { "Authorization": "Bearer " + token }
    });
    if (!reponse.ok) return;
    const blob = await reponse.blob();
    const img = document.getElementById("codebarres-" + id);
    if (img) img.src = URL.createObjectURL(blob);
}

function telechargerPDF(id) {
    telechargerFichier(`/conteneur/${id}/pdf`, "justificatif-" + id + ".pdf");
}

async function annulerDepot(id) {
    if (!confirm("Annuler cette demande de dépôt ?")) return;
    const reponse = await envoyer(`/depotconteneurs/${id}`, "DELETE");
    if (!reponse.ok) await afficherResultat(reponse);
    chargerConteneurs();
    chargerAnnoncesPourSelect();
}

async function chargerAnnoncesPourSelect() {
    const select = document.getElementById("conteneur-annonce");
    select.innerHTML = `<option value="">Choisir une annonce validée</option>`;

    const annonces = await getJSON("/mesannonces");
    if (!annonces) return;
    const depots = (await getJSON("/depotmesconteneurs")) || [];
    const dejaDeposees = depots.filter(d => d.statut !== "REFUSE").map(d => d.annonce_id);

    annonces
        .filter(a => a.statut === "VALIDE" && !dejaDeposees.includes(a.ID))
        .forEach(a => {
            select.innerHTML += `<option value="${a.ID}">${esc(a.titre)}</option>`;
        });
}

document.getElementById("form-conteneur").addEventListener("submit", async function (e) {
    e.preventDefault();
    const id = Number(document.getElementById("conteneur-annonce").value);
    if (!id) {
        alert("Choisissez une annonce");
        return;
    }
    const reponse = await envoyer("/depotconteneurs", "POST", { annonce_id: id });

    if (reponse.ok) {
        alert("Demande de dépôt envoyée. Elle doit être validée par un administrateur.");
        document.getElementById("form-conteneur").reset();
    } else {
        await afficherResultat(reponse);
    }
    chargerConteneurs();
    chargerAnnoncesPourSelect();
});


// demandes de recup

async function chargerDemandes() {
    const div = document.getElementById("liste-demandes");
    const demandes = await getJSON("/mes-demandes-recuperation");
    if (!demandes) { div.innerHTML = INDISPO; return; }
    if (demandes.length === 0) { div.innerHTML = vide("Aucune demande pour l'instant."); return; }

    div.innerHTML = demandes.map(d => {
        let contenu = "";
        if (d.statut === "EN_ATTENTE") {
            contenu = `
                <button onclick="repondreDemande(${d.ID}, 'ACCEPTEE')" class="btn btn-success btn-sm">Accepter</button>
                <button onclick="repondreDemande(${d.ID}, 'REFUSEE')" class="btn btn-outline-danger btn-sm">Refuser</button>`;
        } else if (d.statut === "ACCEPTEE") {
            contenu = `<p class="text-success mb-0">Acceptée, en attente de récupération.</p>`;
        } else if (d.statut === "TERMINEE") {
            contenu = `<p class="text-success mb-0">Objet récupéré ✓</p>`;
        } else if (d.statut === "REFUSEE") {
            contenu = `<p class="text-danger mb-0">Demande refusée.</p>`;
        }

        return `
        <div class="card mb-3">
            <div class="card-body">
                <h5 class="card-title">${esc(d.titre || "Objet n°" + d.conteneur_id)}</h5>
                <p class="card-text mb-1">Demandé par : ${esc(d.professionnel || "un professionnel")}</p>
                <p class="card-text">Statut : ${esc(d.statut)}</p>
                ${contenu}
            </div>
        </div>`;
    }).join("");
}

async function repondreDemande(id, statut) {
    const texte = statut === "ACCEPTEE" ? "Accepter cette demande ?" : "Refuser cette demande ?";
    if (!confirm(texte)) return;
    const reponse = await envoyer(`/demandes-recuperation/${id}`, "PUT", { statut: statut });
    await afficherResultat(reponse);
    chargerDemandes();
    chargerConteneurs();
}


// forum back pas encore fait 

let idSujetOuvert = null;

async function chargerSujets() {
    const div = document.getElementById("liste-sujets");
    const sujets = await getJSON("/forum/sujets");
    if (!sujets) { div.innerHTML = INDISPO; return; }
    if (sujets.length === 0) { div.innerHTML = vide("Aucun sujet pour l'instant. Lancez la discussion !"); return; }

    div.innerHTML = sujets.map(s => `
        <div class="card mb-2 sujet-forum" onclick="ouvrirSujet(${s.ID})">
            <div class="card-body py-2">
                <h5 class="card-title mb-1">${esc(s.titre)}</h5>
                <small class="text-muted">${esc(s.auteur || "")} ${dateFr(s.CreatedAt)}</small>
            </div>
        </div>`).join("");
}

async function ouvrirSujet(id) {
    idSujetOuvert = id;
    document.getElementById("forum-liste").classList.add("d-none");
    document.getElementById("forum-sujet").classList.remove("d-none");

    const sujet = await getJSON(`/forum/sujets/${id}`);
    document.getElementById("sujet-affiche-titre").textContent = sujet ? sujet.titre : "";
    chargerMessages();
}

async function chargerMessages() {
    const div = document.getElementById("liste-messages");
    const messages = await getJSON(`/forum/sujets/${idSujetOuvert}/messages`);
    if (!messages) { div.innerHTML = INDISPO; return; }
    if (messages.length === 0) { div.innerHTML = vide("Aucun message."); return; }

    div.innerHTML = messages.map(m => `
        <div class="card mb-2">
            <div class="card-body py-2">
                <small class="text-muted">${esc(m.auteur || "")} ${dateFr(m.CreatedAt)}</small>
                <p class="card-text mb-0">${esc(m.contenu)}</p>
            </div>
        </div>`).join("");
}

function fermerSujet() {
    idSujetOuvert = null;
    document.getElementById("forum-sujet").classList.add("d-none");
    document.getElementById("forum-liste").classList.remove("d-none");
}

document.getElementById("btn-retour-forum").addEventListener("click", () => {
    fermerSujet();
    chargerSujets();
});

document.getElementById("form-sujet").addEventListener("submit", async function (e) {
    e.preventDefault();
    const sujet = {
        titre: document.getElementById("sujet-titre").value,
        contenu: document.getElementById("sujet-contenu").value
    };
    const reponse = await envoyer("/forum/sujets", "POST", sujet);
    if (reponse.ok) {
        document.getElementById("form-sujet").reset();
    } else {
        await afficherResultat(reponse);
    }
    chargerSujets();
});

document.getElementById("form-message").addEventListener("submit", async function (e) {
    e.preventDefault();
    const contenu = document.getElementById("message-contenu").value;
    const reponse = await envoyer(`/forum/sujets/${idSujetOuvert}/messages`, "POST", { contenu: contenu });
    if (reponse.ok) {
        document.getElementById("form-message").reset();
    } else {
        await afficherResultat(reponse);
    }
    chargerMessages();
});


// actu route pas encore faite 

async function chargerActualites() {
    const div = document.getElementById("liste-actualites");
    const actus = await getJSON("/actualites");
    if (!actus) { div.innerHTML = INDISPO; return; }
    if (actus.length === 0) { div.innerHTML = vide("Aucune actualité."); return; }

    div.innerHTML = actus.map(a => `
        <div class="card mb-3">
            <div class="card-body">
                <h5 class="card-title">${esc(a.titre)}</h5>
                <small class="text-muted">${dateFr(a.CreatedAt)}</small>
                <p class="card-text mt-2">${esc(a.contenu)}</p>
            </div>
        </div>`).join("");
}


// abonnement route pas encore faite 
async function chargerAbonnement() {
    const div = document.getElementById("mon-abonnement");
    const abo = await getJSON("/abonnement");
    if (!abo || !abo.formule) { div.innerHTML = INDISPO; return; }

    let resilier = "";
    let dates = "";
    if (abo.formule !== "GRATUIT") {
        resilier = `<button onclick="resilierAbonnement()" class="btn btn-outline-danger btn-sm">Résilier</button>`;
        dates = `
            <p class="card-text mb-1">Début : ${dateFr(abo.date_debut)}</p>
            <p class="card-text">Renouvellement : ${dateFr(abo.date_fin)}</p>`;
    }
    div.innerHTML = `
    <div class="card" style="max-width:500px">
        <div class="card-body">
            <h5 class="card-title">Formule actuelle : ${esc(abo.formule)}</h5>
            ${dates}
            ${resilier}
        </div>
    </div>`;
}

async function choisirFormule(formule) {
    const reponse = await envoyer("/abonnement", "POST", { formule: formule });

    
    if (reponse.ok) {
        const data = await reponse.json().catch(() => ({}));
        if (data.url) {
            window.location.href = data.url;
            return;
        }
        alert("Abonnement mis à jour");
    } else {
        await afficherResultat(reponse);
    }
    chargerAbonnement();
}

async function resilierAbonnement() {
    if (!confirm("Voulez-vous vraiment résilier votre abonnement ?")) return;
    const reponse = await envoyer("/abonnement", "DELETE");
    await afficherResultat(reponse);
    chargerAbonnement();
}


// factures routes pas encore faite 

async function chargerFactures() {
    const tbody = document.getElementById("tableau-factures");
    const factures = await getJSON("/factures");
    if (!factures) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-muted">Fonctionnalité bientôt disponible.</td></tr>`;
        return;
    }
    if (factures.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-muted">Aucune facture pour l'instant.</td></tr>`;
        return;
    }

    tbody.innerHTML = factures.map(f => `
        <tr>
            <td>${f.ID}</td>
            <td>${dateFr(f.CreatedAt)}</td>
            <td>${esc(f.description)}</td>
            <td>${f.montant} €</td>
            <td><button onclick="telechargerFacture(${f.ID})" class="btn btn-primary btn-sm">Télécharger</button></td>
        </tr>`).join("");
}

function telechargerFacture(id) {
    telechargerFichier(`/factures/${id}/pdf`, "facture-" + id + ".pdf");
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




