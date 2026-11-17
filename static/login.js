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
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);

        const pages = {
            particulier: "/static/particulier.html",
            professionnel: "/static/professionnel.html",
            salarie: "/static/salarie.html",
            admin: "/static/admin.html"
        };

        window.location.href = pages[data.role] || "/static/index.html";
    } else {
        document.getElementById("login-statut").textContent =
            data.erreur || "Identifiants incorrects";
    }

});