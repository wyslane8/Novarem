//fonction qui attend une reponse du serveur avant de continuer 
async function chargerUtilisateurs() {
    //envoi uen requete GET a l'API grâce a "fetch"
    const reponse = await fetch("/utilisateurs");
    //transforme la reponse en objet js
    const utilisateurs = await reponse.json()
    //recupere l'element HTML avec l'id c'est donc tbdoy
    const tbody = document.getElementById("tableau-utilisateurs");
    //tableau vide car on va le remplir apres 
    tbody.innerHTML = "";
    // ici pour chaque user reçu, on construit une ligne de tableau 
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
    })

}
chargerUtilisateurs();

document.getElementById("form-user").addEventListener("submit", async function (e) {
    e.preventDefault();
    const nouvelUser = {
        nom: document.getElementById("input-nom").value,
        email: document.getElementById("input-email").value,
        mot_de_passe: document.getElementById("input-mdp").value,
        role: document.getElementById("input-role").value,
    };

    if (idEnModification === null) {
        await fetch("/utilisateurs", {
            method: "POST",
            headers: { "Content-type": "application/json" },
            body: JSON.stringify(nouvelUser)
        });
    } else {
        const token = localStorage.getItem("token");
        await fetch(`/utilisateurs/${idEnModification}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
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
        headers: { "Authorization": "Bearer " + token }
    });
    chargerUtilisateurs();
}

document.getElementById("form-login").addEventListener("submit", async function (e) {
    e.preventDefault();
    const identifiants = {
        email: document.getElementById("login-email").value,
        mot_de_passe: document.getElementById("login-mdp").value
    };

    const reponse = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(identifiants)
    });

    const data = await reponse.json();
    //vaut true si le code est etre 200 et 299
    if (reponse.ok) {
        //sauveragrde le token reçu
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        
        if(data.role === "particulier"){
            window.location.href= "/static/particulier.html"
        }
    } else {
        document.getElementById("login-statut").textContent = "Erreur"
    }
});

let idEnModification = null;

function preparerModification(id, nom, email, role) {
    idEnModification = id;
    document.getElementById("input-nom").value = nom;
    document.getElementById("input-email").value = email;
    document.getElementById("input-role").value = role;
    document.getElementById("input-mdp").value = "";
}

async function chargerCategories() {
    //envoi uen requete GET a l'API grâce a "fetch"
    const reponse = await fetch("/categoriePresta");
    //transforme la reponse en objet js
    const categorie = await reponse.json()
    //recupere l'element HTML avec l'id c'est donc tbdoy
    const tbody = document.getElementById("tableau-categories");
    //tableau vide car on va le remplir apres 
    tbody.innerHTML = "";
    // ici pour chaque user reçu, on construit une ligne de tableau 
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
    })

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
        headers: { "Authorization": "Bearer " + token }
    });
    chargerCategories();
}

document.getElementById("form-categorie").addEventListener("submit", async function (e) {
    e.preventDefault();
    const nouvelCat = {
        nom: document.getElementById("cat-nom").value,
        description: document.getElementById("cat-description").value,
    };
    if (idCatEnModification === null) {
        await fetch("/categoriePresta", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nouvelCat)
        });
    } else {
        const token = localStorage.getItem("token");
        await fetch(`/categoriePresta/${idCatEnModification}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify(nouvelCat)
        })
        idCatEnModification = null;
    }
    document.getElementById("form-categorie").reset();
    chargerCategories();
});




async function chargerPrestation() {
    //envoi uen requete GET a l'API grâce a "fetch"
    const reponse = await fetch("/prestations");
    //transforme la reponse en objet js
    const prestation = await reponse.json()
    //recupere l'element HTML avec l'id c'est donc tbdoy
    const tbody = document.getElementById("tableau-prestation");
    //tableau vide car on va le remplir apres 
    tbody.innerHTML = "";
    // ici pour chaque user reçu, on construit une ligne de tableau 
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
    })

}
chargerPrestation();

let idPrestaEnModification = null;
function preparerModificationPresta(id, nom, description,typeOffre,tarif,capaciteMax) {
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
        capacite_max: parseInt(document.getElementById("presta-CapaciteMax").value),
    };
    if (idPrestaEnModification === null) {
        await fetch("/prestations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nouvelPresta)
        });
    } else {
        const token = localStorage.getItem("token");
        await fetch(`/prestations/${idPrestaEnModification}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify(nouvelPresta)
        })
        idPrestaEnModification = null;
    }
    document.getElementById("form-prestation").reset();
    chargerPrestation();
});





async function chargerEvenements() {
    //envoi uen requete GET a l'API grâce a "fetch"
    const reponse = await fetch("/evenements");
    //transforme la reponse en objet js
    const evenements = await reponse.json()
    //recupere l'element HTML avec l'id c'est donc tbdoy
    const tbody = document.getElementById("tableau-evenements");
    //tableau vide car on va le remplir apres 
    tbody.innerHTML = "";
    // ici pour chaque user reçu, on construit une ligne de tableau 
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
    })

}
chargerEvenements();

let idEventsEnModification = null;
function preparerModificationEvents(id, titre, description,date_heure_debut,duree_minutes,capacite_max) {
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
        duree_minutes: parseFloat(document.getElementById("events_duree").value),
        capacite_max: parseInt(document.getElementById("events_capacite_max").value),
    };
    if (idEventsEnModification === null) {
        await fetch("/evenements", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nouvelEvents)
        });
    } else {
        const token = localStorage.getItem("token");
        await fetch(`/evenements/${idEventsEnModification}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify(nouvelEvents)
        })
        idEventsEnModification = null;
    }
    document.getElementById("form-evenement").reset();
    chargerEvenements();
});