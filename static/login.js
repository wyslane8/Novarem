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

        if (data.role === "particulier") {
            window.location.href = "/static/particulier.html";
        } else {
            window.location.href = "/static/admin.html";
        }
    } else {
        document.getElementById("login-statut").textContent = "id correctes"
    }

});