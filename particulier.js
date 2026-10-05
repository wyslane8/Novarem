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
    const reponse = await fetch("/annonces");
    //transforme la reponse en objet js
    const depots = await reponse.json()
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
    await fetch("/annonces",{
        method : "POST",
        headers : {
            "Content-Type" : "application/json",
            "Authorization" : "Bearer " + localStorage.getItem("token")
        },
        body : JSON.stringify(nouveuDepot)
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
    })
    const profil = await reponse.json();
    document.getElementById("profil-nom").value = profil.nom;
    document.getElementById("profil-email").value = profil.email;
    document.getElementById("profil-mdp").value = ""

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
        body : JSON.stringify(nouveauProfil)
    });

   
    document.getElementById("form-profil").reset();
});

async function chargerCatalogue(){
    const reponse = await fetch("/annonces");
    tousLesObjets = await reponse.json()
    tousLesObjets = tousLesObjets.filter(c =>c.statut === "VALIDE")
    afficherCatalogue(tousLesObjets)
}
chargerCatalogue();

function afficherCatalogue(liste) {
    const tbody = document.getElementById("tableau-catalogue");
    tbody.innerHTML ="";
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

document.getElementById("recherche-catalogue").addEventListener("input",function(){
    const text = this.value.toLowerCase();
    const resultat = tousLesObjets.filter(c => c.titre.toLowerCase().includes(text));
    afficherCatalogue(resultat);

});

document.getElementById("filtre-categorie").addEventListener("change",function(){
    const categorie = this.value;
    let resultat ;
    if(categorie === "" ){
        resultat = tousLesObjets;
    }else{
        resultat = tousLesObjets.filter(c => c.type_annonce === categorie);
    }
    afficherCatalogue(resultat);

});


async function chargerScore() {
    const reponse = await fetch("/score", {
        headers: { "Authorization": "Bearer " + localStorage.getItem("token") }
    })
    const data = await reponse.json();
    document.getElementById("score-valeur").textContent = data.score;


}
chargerScore();

const etapesTuto = [
    {titre: "Bienvenue ! ", texte : "Découvrez UpcycleConnect."},
    {titre: "Vos dépôts ! ", texte : " Déposez vos objets dans l'onglet dépôt."},
    {titre: "Vos dépôts ! ", texte : " Déposez vos objets dans l'onglet dépôt."},
];
let etapeActuelle = 0;

function afficherEtape(){
    const tuto = etapesTuto[etapeActuelle];
    document.getElementById("tuto-titre").textContent = tuto.titre;
    document.getElementById("tuto-texte").textContent = tuto.texte;

}

document.getElementById("tuto-suivant").addEventListener("click", async function (e) {
    e.preventDefault();
    etapeActuelle++;
    if(etapeActuelle >= etapesTuto.length){
        document.getElementById("tuto-overlay").classList.add("d-none")
        return;
    }
    afficherEtape();
});

function functionPremierLogin (){
    if(localStorage.getItem("tutoVu") == null){
        document.getElementById("tuto-overlay").classList.remove("d-none");
        afficherEtape();
        localStorage.setItem("tutoVu","oui")
    }
}
functionPremierLogin();
