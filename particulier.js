
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
});

async function supprimerDepots(id) {
    const token = localStorage.getItem("token");
    await fetch(`/annonces/${id}`, {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + token }
    });
    chargerDepots();
}