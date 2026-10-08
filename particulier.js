let tousLesObjets = [];
const token = localStorage.getItem("token");
if (!token) {
    window.location.href = "/";
}

function afficherSection(nom) {
    document.querySelectorAll("main section").forEach(s => s.classList.add("d-none"));
    document.getElementById("section-" + nom).classList.remove("d-none")
}


document.querySelectorAll(".nav-link").forEach(bouton => {
    bouton.addEventListener("click", () => {
        afficherSection(bouton.dataset.section);

    });
});


document.getElementById("btn-logout").addEventListener("click", () => {
    localStorage.removeItem("token")
    window.location.href = "/";
});

afficherSection("accueil");


async function chargerDepots() {
    //envoi uen requete GET a l'API grâce a "fetch"
    const reponse = await fetch("/mesannonces", {
        headers: {"Authorization" : "Bearer " + localStorage.getItem("token")}
    });
    //transforme la reponse en objet js
    const depots = await reponse.json()
    if (depots.length === 0) {
        const tbody = document.getElementById("tableau-depots");
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Aucun dépôt pour l'instant</td></tr>`;
        return
    } else {
        //recupere l'element HTML avec l'id c'est donc tbdoy
        const tbody = document.getElementById("tableau-depots");
        //tableau vide car on va le remplir apres 
        tbody.innerHTML = "";
        // ici pour chaque user reçu, on construit une ligne de tableau 
        depots.forEach(d => {
            const ligne = `
    <tr>
        <td>${d.titre}</td>
        <td>${d.description}</td>
        <td>${d.type_annonce}</td>
        <td>${d.prix_vente}</td>
        <td>${d.statut}</td>
        <td>
            <button onclick="supprimerDepots(${d.ID})" class="btn btn-danger btn-sm">Supprimer</button>
        </td>
    </tr>
    `;
            tbody.innerHTML += ligne;
        })
    }
}
chargerDepots();

document.getElementById("form-depot").addEventListener("submit", async function (e) {
    e.preventDefault();
    const nouveuDepot = {
        titre: document.getElementById("depot-titre").value,
        description: document.getElementById("depot-description").value,
        type_annonce: document.getElementById("depot-type").value,
        prix_vente: parseFloat(document.getElementById("depot-prix").value),
        statut: "DEPOSE"
    };
    await fetch("/annonces", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem("token")
        },
        body: JSON.stringify(nouveuDepot)
    });


    document.getElementById("form-depot").reset();
    chargerDepots();
    chargerCatalogue();

});

async function supprimerDepots(id) {
    const token = localStorage.getItem("token");
    await fetch(`/annonces/${id}`, {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + token }
    });
    chargerDepots();
    chargerCatalogue();
}

async function chargerProfil() {
    const reponse = await fetch("/profil", {
        headers: { "Authorization": "Bearer " + localStorage.getItem("token") }
    });
    if (reponse.status == 401) {
        localStorage.removeItem("token");
        window.location.href = "/";
        return;
    }
    const profil = await reponse.json();
    document.getElementById("profil-nom").value = profil.nom;
    document.getElementById("accueil-nom").textContent = profil.nom;
    document.getElementById("profil-email").value = profil.email;
    document.getElementById("profil-mdp").value = ""
    document.getElementById("profil-affiche-nom").textContent = profil.nom;
    document.getElementById("profil-affiche-email").textContent = profil.email;
    document.getElementById("profil-affiche-role").textContent = profil.role;
    const date = new Date(profil.CreatedAt);
    document.getElementById("profil-affiche-date").textContent = date.toLocaleDateString("fr-FR")


}
chargerProfil();

document.getElementById("form-profil").addEventListener("submit", async function (e) {
    e.preventDefault();
    const nouveauProfil = {
        nom: document.getElementById("profil-nom").value,
        email: document.getElementById("profil-email").value,
        mot_de_passe: document.getElementById("profil-mdp").value,
    };
    const token = localStorage.getItem("token");
    await fetch("/profil", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify(nouveauProfil)
    });


    document.getElementById("form-profil").reset();
});

async function chargerCatalogue() {
    const reponse = await fetch("/annonces");
    tousLesObjets = await reponse.json()
    tousLesObjets = tousLesObjets.filter(c => c.statut === "VALIDE")
    afficherCatalogue(tousLesObjets)
}
chargerCatalogue();

function afficherCatalogue(liste) {
    const tbody = document.getElementById("tableau-catalogue");
    tbody.innerHTML = "";
    // ici pour chaque user reçu, on construit une ligne de tableau 
    liste.forEach(c => {
        const ligne = `
    <tr>
        <td>${c.titre}</td>
        <td>${c.description}</td>
        <td>${c.type_annonce}</td>
        <td>${c.prix_vente}</td>
    </tr>
    `;
        tbody.innerHTML += ligne;
    })
}

document.getElementById("recherche-catalogue").addEventListener("input", function () {
    const text = this.value.toLowerCase();
    const resultat = tousLesObjets.filter(c => c.titre.toLowerCase().includes(text));
    afficherCatalogue(resultat);

});

document.getElementById("filtre-categorie").addEventListener("change", function () {
    const categorie = this.value;
    let resultat;
    if (categorie === "") {
        resultat = tousLesObjets;
    } else {
        resultat = tousLesObjets.filter(c => c.type_annonce === categorie);
    }
    afficherCatalogue(resultat);

});

async function chargerConseils() {
    const reponse = await fetch("/conseils");
    const conseils = await reponse.json();
    const div = document.getElementById("liste-conseils");
    div.innerHTML = "";

    if (conseils.length === 0) {
        div.innerHTML = `<p class="text-muted">Aucun conseil pour le moment.</p>`;
        return;
    }

    conseils.forEach(c => {
        const bloc = `
        <div class="card mb-3">
            <div class="card-body">
                <h5 class="card-title">${c.titre}</h5>
                <p class="card-text">${c.contenu}</p>
            </div>
        </div>
        `;
        div.innerHTML += bloc;
    });
}
chargerConseils();

async function chargerScore() {
    const reponse = await fetch("/score", {
        headers: { "Authorization": "Bearer " + localStorage.getItem("token") }
    })
    const data = await reponse.json();
    const pourcentage = (data.score / 100) * 100;
    document.getElementById("score-valeur").textContent = data.score;
    document.getElementById("score-barre").style.width = pourcentage + "%";


}
chargerScore();

const etapesTuto = [
    { titre: "Bienvenue ! ", texte: "Découvrez UpcycleConnect." },
    { titre: "Vos dépôts ! ", texte: " Déposez vos objets dans l'onglet dépôt." },
    { titre: "Vos dépôts ! ", texte: " Déposez vos objets dans l'onglet dépôt." },
];
let etapeActuelle = 0;

function afficherEtape() {
    const tuto = etapesTuto[etapeActuelle];
    document.getElementById("tuto-titre").textContent = tuto.titre;
    document.getElementById("tuto-texte").textContent = tuto.texte;

}

document.getElementById("tuto-suivant").addEventListener("click", async function (e) {
    e.preventDefault();
    etapeActuelle++;
    if (etapeActuelle >= etapesTuto.length) {
        document.getElementById("tuto-overlay").classList.add("d-none")
        return;
    }
    afficherEtape();
});

function functionPremierLogin() {
    if (localStorage.getItem("tutoVu") == null) {
        document.getElementById("tuto-overlay").classList.remove("d-none");
        afficherEtape();
        localStorage.setItem("tutoVu", "oui")
    }
}
functionPremierLogin();

async function chargerApercuDepots() {
    const reponse = await fetch("/mesannonces", {
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("token")
        }
    });

    const apercu = await reponse.json();
    const div = document.getElementById("accueil-depots");
    div.innerHTML = "";

    if (apercu.length === 0) {
        div.innerHTML = `<p class="text-muted">Aucun dépôt pour l'instant.</p>`;
        return;
    }

    const troiderniers = apercu.slice(0, 3)

    troiderniers.forEach(a => {
        const bloc = `
        <div class="card mb-3">
            <div class="card-body">
                <h5 class="card-title">${a.titre}</h5>
                <p class="card-text">${a.statut}</p>
            </div>
        </div>
        `;
        div.innerHTML += bloc;
    });
}
chargerApercuDepots();

async function chargerEvenementsDispo() {
    const token = localStorage.getItem("token");
    // on charge les événements ET mes inscriptions en même temps
    const [repEvents, repInscrits] = await Promise.all([
        fetch("/evenements"),
        fetch("/mes-inscriptions", { headers: { "Authorization": "Bearer " + token } })
    ]);
    const events = await repEvents.json();
    const inscrits = await repInscrits.json();
    // la liste des ID d'événements où je suis déjà inscrite
    const idsInscrits = inscrits.map(e => e.ID);

    const div = document.getElementById("liste-evenements-dispo");
    div.innerHTML = "";

    if (events.length === 0) {
        div.innerHTML = `<p class="text-muted">Aucun évènement pour le moment.</p>`;
        return;
    }
    for (const e of events) {
    const dejaInscrit = idsInscrits.includes(e.ID);

    // on demande combien de personnes sont inscrites à cet événement
    const repPlaces = await fetch(`/evenements/${e.ID}/places`);
    const dataPlaces = await repPlaces.json();
    const placesRestantes = e.capacite_max - dataPlaces.inscrits;  // une simple soustraction

    const bouton = dejaInscrit
        ? `<button class="btn btn-secondary btn-sm" disabled>Déjà inscrit ✓</button>`
        : `<button onclick="sInscrireEvenement(${e.ID})" class="btn btn-primary btn-sm">S'inscrire</button>`;

    const date = new Date(e.date_heure_debut).toLocaleString("fr-FR", {
        dateStyle: "long", timeStyle: "short"
    });

    const bloc = `
    <div class="card mb-3">
        <div class="card-body">
            <h5 class="card-title">${e.titre}</h5>
            <p class="card-text">${e.description}</p>
            <p class="card-text text-muted mb-1">📅 ${date}</p>
            <p class="card-text text-muted mb-1">⏱️ Durée : ${e.duree_minutes} min</p>
            <p class="card-text text-muted mb-3">👥 ${placesRestantes} places restantes</p>
            ${bouton}
        </div>
    </div>
    `;
    div.innerHTML += bloc;
}
}
chargerEvenementsDispo();

async function sInscrireEvenement(id) {
    const token = localStorage.getItem("token");
    const reponse = await fetch("/inscriptions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ evenement_id: id })
    });
    if(reponse.ok){
        alert("Inscription réussie");
    }else{
        const data = await reponse.json();
        alert(data.erreur);
    }
     chargerMonPlanning();
     chargerEvenementsDispo();
}

async function chargerMonPlanning() {
    const reponse = await fetch("/mes-inscriptions", {
        headers: { "Authorization": "Bearer " + localStorage.getItem("token") }
    });
    const events = await reponse.json();
    const div = document.getElementById("accueil-planning");
    div.innerHTML = "";

    if (events.length === 0) {
        div.innerHTML = `<p class="text-muted">vous n'êtes inscrit à aucun évènement</p>`;
        return;
    }

    events.forEach(e => {
        const date = new Date(e.date_heure_debut).toLocaleString("fr-FR", {
            dateStyle: "long", timeStyle: "short"
        });
        const bloc = `
        <div class="card mb-3">
            <div class="card-body">
                <h5 class="card-title">${e.titre}</h5>
                <p class="card-text text-muted mb-1"> ${date}</p>
                <p class="card-text text-muted mb-0"> ${e.duree_minutes} min ·  ${e.capacite_max} places</p>
            </div>
        </div>
        `;
        div.innerHTML += bloc;
    });
}
chargerMonPlanning();


async function chargerConteneur() {
    //envoi uen requete GET a l'API grâce a "fetch"
    const reponse = await fetch("/depotmesconteneurs", {
        headers: {"Authorization" : "Bearer " + localStorage.getItem("token")}
    });
    //transforme la reponse en objet js
    const conteneur = await reponse.json()
    const div = document.getElementById("liste-conteneur");
    if (conteneur.length === 0) {
        div.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Aucun depot de conteneur pour l'instant</td></tr>`;
        return
    } 
    conteneur.forEach(c => {
        // les codes + le bouton PDF n'apparaissent QUE si le dépôt est validé
        let codes = "";
        if (c.statut === "VALIDE") {
            codes = `
                <p class="card-text">🔑 Code d'ouverture : ${c.code_ouverture}</p>
                <p class="card-text">📦 Code-barres : ${c.code_barres}</p>
                <button onclick="telechargerPDF(${c.ID})" class="btn btn-primary btn-sm">Télécharger le justificatif</button>
            `;
        }

        const bloc = `
        <div class="card mb-3">
            <div class="card-body">
                <h5 class="card-title">${c.titre}</h5>
                <p class="card-text">${c.description}</p>
                <p class="card-text">Statut : ${c.statut}</p>
                ${codes}
                <button onclick="supprimerDepotsConteneur(${c.ID})" class="btn btn-danger btn-sm">Supprimer</button>
            </div>
        </div>
        `;
        div.innerHTML += bloc;
    });
    
}
chargerConteneur();

document.getElementById("form-conteneur").addEventListener("submit", async function (e) {
    e.preventDefault();
    const nouveuConteneur = {
        annonce_id: parseInt(document.getElementById("conteneur-annonce").value)
    };
    await fetch("/depotconteneurs", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem("token")
        },
        body: JSON.stringify(nouveuConteneur)
    });


    document.getElementById("form-conteneur").reset();

    chargerConteneur();

});

async function telechargerPDF(id) {
    const token = localStorage.getItem("token");
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

async function supprimerDepotsConteneur(id) {
    const token = localStorage.getItem("token");
    await fetch(`/depotconteneurs/${id}`, {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + token }
    });
    chargerConteneur();
}

async function chargerAnnoncesPourSelect() {
    const reponse = await fetch("/mesannonces", {
        headers: { "Authorization": "Bearer " + localStorage.getItem("token") }
    });
    const annonces = await reponse.json();
    const annoncesValidees = annonces.filter( a => a.statut === "VALIDE")
    const select = document.getElementById("conteneur-annonce");
    select.innerHTML = "";

    annoncesValidees.forEach(a => {
        const option = `<option value="${a.ID}">${a.titre}</option>`;
        select.innerHTML += option;
    })
}
chargerAnnoncesPourSelect();

