package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"

	"math/rand"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jung-kurt/gofpdf"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// variable globale qui va contenir la connexion à la base
var db *gorm.DB

func main() {
	godotenv.Load("variables.env")
	cleSecrete = []byte(os.Getenv("JWT_SECRET"))
	if len(cleSecrete) < 16 {
		log.Fatal("JWT_SECRET manquant ou trop court")
	}
	var err error
	//gorm.Open... = ouvre ou crée un fichier novarem.db qui sera la BDD, gestion des erreurs
	db, err = gorm.Open(sqlite.Open("novarem.db"), &gorm.Config{})
	if err != nil {
		panic("Impossible de se connecter à la BDD")
	}

	//si la utilisateur n'existe pas dans novarem.db elle crée automatiquement une table correspondante
	db.AutoMigrate(&Utilisateur{})
	db.AutoMigrate(&CategoriePrestation{})
	db.AutoMigrate(&Prestation{})
	db.AutoMigrate(&Evenement{})
	db.AutoMigrate(&Annonce{})
	db.AutoMigrate(&Conseil{})
	db.AutoMigrate(&Inscription{})
	db.AutoMigrate(&DepotConteneur{})

	fmt.Println("BDD table Utilisateur créée avec succès")

	//créer le serveur Gin:
	r := gin.Default()

	//dis a gin tous les fichiers du dossier courant ./ sont accessible via static donc ça permet a index de charger app via script . L'autre c'est lorsque quon va a la racine du site / on tombe sur index.html
	r.Static("/static", "./static")
	r.StaticFile("/", "./static/index.html")

	//quand q

	r.GET("/utilisateurs", authAdmin(), getUtilisateurs)
	r.POST("/utilisateurs", authAdmin(), creerUtilisateur)
	r.PUT("/utilisateurs/:id", authAdmin(), modifierUtilisateur)
	r.DELETE("/utilisateurs/:id", authAdmin(), supprimerUtilisateur)
	r.POST("/login", login)
	r.POST("/register", register)

	r.GET("/categoriePresta", getCategories)
	r.POST("/categoriePresta", authAdmin(), creerCategorie)
	r.PUT("/categoriePresta/:id", authAdmin(), modifierCategorie)
	r.DELETE("/categoriePresta/:id", authAdmin(), supprimerCategorie)

	r.GET("/prestations", getPrestation)
	r.POST("/prestations", authAdmin(), creerPrestation)
	r.PUT("/prestations/:id", authAdmin(), modifierPrestation)
	r.DELETE("/prestations/:id", authAdmin(), supprimerPrestation)

	r.GET("/evenements", getEvenement)
	r.POST("/evenements", authAdmin(), creerEvenement)
	r.PUT("/evenements/:id", authAdmin(), modifierEvenement)
	r.DELETE("/evenements/:id", authAdmin(), supprimerEvenement)
	r.GET("/evenements/:id/places", getPlacesEvenement)

	r.GET("/catalogue", getCatalogue)
	r.GET("/annonces", authAdmin(), getAnnonce)
	r.GET("/mesannonces", authConnecte(), getMesAnnonces)
	r.POST("/annonces", authConnecte(), creerAnnonce)
	r.PUT("/annonces/:id", authAdmin(), modifierAnnonce)
	r.DELETE("/annonces/:id", authConnecte(), supprimerAnnonce)

	r.GET("/profil", authConnecte(), getProfile)
	r.PUT("/profil", authConnecte(), modifierProfil)
	r.GET("/score", authConnecte(), getScore)

	r.GET("/conseils", getConseils)
	r.POST("/conseils", authAdmin(), creerConseil)
	r.DELETE("/conseils/:id", authAdmin(), supprimerConseil)

	r.POST("/inscriptions", authConnecte(), sInscrire)
	r.GET("/mes-inscriptions", authConnecte(), getMesInscriptions)

	r.GET("/depotconteneurs", authAdmin(), getConteneur)
	r.GET("/depotmesconteneurs", authConnecte(), getmesConteneur)
	r.POST("/depotconteneurs", authConnecte(), creerConteneur)
	r.PUT("/depotconteneurs/:id", authAdmin(), modifierConteneur)
	r.DELETE("/depotconteneurs/:id", authConnecte(), supprimerConteneur)

	r.GET("/conteneur/:id/pdf", authConnecte(), genererPDFConteneur)

	r.Run(":8080")
}

func getUtilisateurs(c *gin.Context) {
	var utilisateurs []Utilisateur
	db.Find(&utilisateurs)
	for i := range utilisateurs {
		utilisateurs[i].MotDePasse = ""
	}
	c.JSON(http.StatusOK, utilisateurs)
}

func creerUtilisateur(c *gin.Context) {
	var nouvel Utilisateur
	//prend le JSOn envoyé par le front et le transofme en struct Utilisateurs
	if err := c.ShouldBindJSON(&nouvel); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erreur": "données incorrects"})
		return
	}

	//transorme le mdp  en hash
	hash, err := bcrypt.GenerateFromPassword([]byte(nouvel.MotDePasse), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erreur": "erreur de hachage"})
		return
	}

	//on remplace le mdp en clair par le mdp hashé
	nouvel.MotDePasse = string(hash)

	//insere le user dans la BDD si ok code 201
	if err := db.Create(&nouvel).Error; err != nil {
		c.JSON(http.StatusConflict, gin.H{"erreur": "cet email est déjà utilisé"})
		return
	}
	nouvel.MotDePasse = ""
	c.JSON(http.StatusCreated, nouvel)
}

func modifierUtilisateur(c *gin.Context) {
	//recupere l'id present dans l'URL
	id := c.Param("id")

	var utilisateur Utilisateur
	//cherche le user qui correspond à l'id si rien trouuvé = erreur et on renvoit 404
	if err := db.First(&utilisateur, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"erreur": "utilisateur introuvable"})
		return
	}
	ancienMotDePAsse := utilisateur.MotDePasse

	if err := c.ShouldBindJSON(&utilisateur); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erreur": "données incorrectes"})
		return
	}

	if utilisateur.MotDePasse == "" {
		utilisateur.MotDePasse = ancienMotDePAsse
	} else {
		hash, err := bcrypt.GenerateFromPassword([]byte(utilisateur.MotDePasse), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"erreur": "erreur de hachage"})
			return
		}
		utilisateur.MotDePasse = string(hash)
	}

	//ici on chareg d'abord l'utilisateur existsnat et apres on applique les nouvelles donned grace shouldbindjson
	db.Save(&utilisateur)
	utilisateur.MotDePasse = ""
	c.JSON(http.StatusOK, utilisateur)
}

func supprimerUtilisateur(c *gin.Context) {
	id := c.Param("id")

	if err := db.Delete(&Utilisateur{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erreur": "suppression impossible"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "utilisateur supprimé"})
}

type RegisterInput struct {
	Nom        string `json:"nom"`
	Email      string `json:"email"`
	MotDePasse string `json:"mot_de_passe"`
}

func register(c *gin.Context) {
	var in RegisterInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erreur": "données incoreectes"})
		return
	}
	if in.Nom == "" || in.Email == "" || len(in.MotDePasse) < 8 {
		c.JSON(http.StatusBadRequest, gin.H{"erreur": "nom, email et mot de passe requis "})
		return
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(in.MotDePasse), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erreur": "erreur de hachage"})
		return
	}
	u := Utilisateur{Nom: in.Nom, Email: in.Email, MotDePasse: string(hash), Role: "particulier"}
	if err := db.Create(&u).Error; err != nil {
		c.JSON(http.StatusConflict, gin.H{"erreur": "cet email est déjà utilisé"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "compte créé"})
}

// clé du serveur , utilisée pour signer et verifier les token, pour l'instant je l'ai mise ici mais je devrais la mettre dans une variable d'envionnement
var cleSecrete []byte

type idenfiants struct {
	Email      string `json:"email"`
	MotDePasse string `json:"mot_de_passe"`
}

func login(c *gin.Context) {
	var creds idenfiants
	if err := c.ShouldBindJSON(&creds); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erreur": "données incorrectes"})
		return
	}
	var utilisateur Utilisateur
	//cherche le user par email. Le ? evite une injection SQL donc la valeru est sécurisé
	if err := db.Where("email =?", creds.Email).First(&utilisateur).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"erreur": "identifiants incorrects"})
		return
	}

	//compare le mot de passe envoyé avc celui qui est hashé
	if err := bcrypt.CompareHashAndPassword([]byte(utilisateur.MotDePasse), []byte(creds.MotDePasse)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"erreur": "identifiants incorrects"})
		return
	}

	//creer un token contenant l'id, le role du user
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id":   utilisateur.ID,
		"role": utilisateur.Role,
		"exp":  time.Now().Add(24 * time.Hour).Unix(),
	})

	//signe le token avec la clé secrete poru que personne ne puisse le modif/supp
	tokenSigne, err := token.SignedString(cleSecrete)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erreur": "erreur lors de la génération du token"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"token": tokenSigne,
		"role":  utilisateur.Role,
	})
}

func authAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		//récupère l'en tete ou le front doit envoyer le token
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"erreur": "token manquant"})
			c.Abort()
			return
		}

		// enleve le mot bearer pour garder que le token
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		//verification du token par rapport à la clé
		token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
			return cleSecrete, nil
		})
		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"erreur": "token invalide"})
			c.Abort()
			return
		}

		claims := token.Claims.(jwt.MapClaims)
		//meme si le token est valide on veirfie que le token appartient bien à l'admin
		if claims["role"] != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"erreur": "accès réservé aux admins"})
			c.Abort()
			return
		}

		c.Next()
	}
}

func authConnecte() gin.HandlerFunc {
	return func(c *gin.Context) {
		//récupère l'en tete ou le front doit envoyer le token
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"erreur": "token manquant"})
			c.Abort()
			return
		}

		// enleve le mot bearer pour garder que le token
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		//verification du token par rapport à la clé
		token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
			return cleSecrete, nil
		})
		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"erreur": "token invalide"})
			c.Abort()
			return
		}

		claims := token.Claims.(jwt.MapClaims)
		id := claims["id"]
		var utilisateur Utilisateur
		if err := db.First(&utilisateur, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"erreur": " utilisateur introuvables"})
			c.Abort()
			return
		}

		if !utilisateur.Actif {
			c.JSON(http.StatusForbidden, gin.H{"erreur": "compte désactivé"})
			c.Abort()
			return
		}

		c.Set("userID", claims["id"])
		c.Set("role", claims["role"])

		c.Next()
	}
}

func getCategories(c *gin.Context) {
	var categoriePresta []CategoriePrestation
	db.Find(&categoriePresta)
	c.JSON(http.StatusOK, categoriePresta)
}

func creerCategorie(c *gin.Context) {
	var nouvel CategoriePrestation
	if err := c.ShouldBindJSON(&nouvel); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erreur": " données incorrectes"})
		return
	}
	if err := db.Create(&nouvel).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erreur": "création impossible"})
		return
	}
	c.JSON(http.StatusCreated, nouvel)
}

func modifierCategorie(c *gin.Context) {
	id := c.Param("id")
	var categoriePresta CategoriePrestation
	if err := db.First(&categoriePresta, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"erreur": "catégories introuvables"})
		return
	}
	if err := c.ShouldBindJSON(&categoriePresta); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erreur": "données invalides"})
		return
	}
	db.Save(&categoriePresta)
	c.JSON(http.StatusOK, categoriePresta)
}

func supprimerCategorie(c *gin.Context) {
	id := c.Param("id")
	if err := db.Delete(&CategoriePrestation{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erreur": "suppression impossible"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "catégorie supprimée"})
}

func getCatalogue(c *gin.Context) {
	var annonces []Annonce
	db.Where("statut = ?", "VALIDE").Find(&annonces)
	c.JSON(http.StatusOK, annonces)
}

func getPrestation(c *gin.Context) {
	var prestation []Prestation
	db.Find(&prestation)
	c.JSON(http.StatusOK, prestation)
}

func creerPrestation(c *gin.Context) {
	var nouvel Prestation
	if err := c.ShouldBindJSON(&nouvel); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erreur": " données incorrectes"})
		return
	}
	if err := db.Create(&nouvel).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erreur": "création impossible"})
		return
	}
	c.JSON(http.StatusCreated, nouvel)
}

func modifierPrestation(c *gin.Context) {
	id := c.Param("id")
	var prestation Prestation
	if err := db.First(&prestation, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"erreur": "prestations introuvables"})
		return
	}
	if err := c.ShouldBindJSON(&prestation); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erreur": "données invalides"})
		return
	}
	db.Save(&prestation)
	c.JSON(http.StatusOK, prestation)
}

func supprimerPrestation(c *gin.Context) {
	id := c.Param("id")
	if err := db.Delete(&Prestation{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erreur": "suppression impossible"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "prestation supprimée"})
}

func getEvenement(c *gin.Context) {
	var evenement []Evenement
	db.Find(&evenement)
	c.JSON(http.StatusOK, evenement)
}

func getPlacesEvenement(c *gin.Context) {
	id := c.Param("id")
	var nombre int64
	db.Model(&Inscription{}).Where("evenement_id = ?", id).Count(&nombre)
	c.JSON(http.StatusOK, gin.H{"inscrits": nombre})
}

func creerEvenement(c *gin.Context) {
	var nouvel Evenement
	if err := c.ShouldBindJSON(&nouvel); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erreur": " données incorrectes"})
		return
	}
	if err := db.Create(&nouvel).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erreur": "création impossible"})
		return
	}
	c.JSON(http.StatusCreated, nouvel)
}

func modifierEvenement(c *gin.Context) {
	id := c.Param("id")
	var evenement Evenement
	if err := db.First(&evenement, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"erreur": "évènements introuvables"})
		return
	}
	if err := c.ShouldBindJSON(&evenement); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erreur": "données invalides"})
		return
	}
	db.Save(&evenement)
	c.JSON(http.StatusOK, evenement)
}

func supprimerEvenement(c *gin.Context) {
	id := c.Param("id")
	if err := db.Delete(&Evenement{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erreur": "suppression impossible"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "évènements supprimée"})
}

func getAnnonce(c *gin.Context) {
	var annonce []Annonce
	db.Find(&annonce)
	c.JSON(http.StatusOK, annonce)
}

func creerAnnonce(c *gin.Context) {
	var nouvel Annonce
	if err := c.ShouldBindJSON(&nouvel); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erreur": " données incorrectes"})
		return
	}

	userID, _ := c.Get("userID")
	nouvel.UtilisateurID = uint(userID.(float64))
	nouvel.ID = 0
	nouvel.Statut = "EN_ATTENTE"
	if err := db.Create(&nouvel).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erreur": "création impossible"})
		return
	}
	c.JSON(http.StatusCreated, nouvel)
}

func modifierAnnonce(c *gin.Context) {
	id := c.Param("id")
	var annonce Annonce
	if err := db.First(&annonce, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"erreur": "Annonces introuvables"})
		return
	}
	if err := c.ShouldBindJSON(&annonce); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erreur": "données invalides"})
		return
	}
	db.Save(&annonce)
	c.JSON(http.StatusOK, annonce)
}

func supprimerAnnonce(c *gin.Context) {
	userID, _ := c.Get("userID")
	role, _ := c.Get("role")
	id := c.Param("id")

	var annonce Annonce
	if err := db.First(&annonce, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"erreur": "annonce introuvable"})
		return
	}

	if role != "admin" && annonce.UtilisateurID != uint(userID.(float64)) {
		c.JSON(http.StatusForbidden, gin.H{"erreur": "vous ne pouvez supprimer que vos propres annonces"})
		return
	}

	if err := db.Delete(&Annonce{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erreur": "suppression impossible"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "annonce supprimée"})
}

func getMesAnnonces(c *gin.Context) {
	userID, _ := c.Get("userID")

	var annonces []Annonce
	db.Where("utilisateur_id = ?", uint(userID.(float64))).Find(&annonces)

	c.JSON(http.StatusOK, annonces)
}

func getProfile(c *gin.Context) {
	userID, _ := c.Get("userID")
	var utilisateur Utilisateur
	db.First(&utilisateur, uint(userID.(float64)))
	utilisateur.MotDePasse = ""
	c.JSON(http.StatusOK, utilisateur)
}

type ProfilInput struct {
	Nom        string `json:"nom"`
	Email      string `json:"email"`
	MotDePasse string `json:"mot_de_passe"`
}

func modifierProfil(c *gin.Context) {
	userID, _ := c.Get("userID")
	var utilisateur Utilisateur
	if err := db.First(&utilisateur, uint(userID.(float64))).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"erreur": "utilisateur introuvable"})
		return
	}

	var in ProfilInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erreur": "données invalides"})
		return
	}

	if in.Nom != "" {
		utilisateur.Nom = in.Nom
	}
	if in.Email != "" {
		utilisateur.Email = in.Email
	}
	if in.MotDePasse != "" {
		if len(in.MotDePasse) < 8 {
			c.JSON(http.StatusBadRequest, gin.H{"erreur": "mot de passe trop court"})
			return
		}
		hash, err := bcrypt.GenerateFromPassword([]byte(in.MotDePasse), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"erreur": "erreur de hachage"})
			return
		}
		utilisateur.MotDePasse = string(hash)
	}

	if err := db.Save(&utilisateur).Error; err != nil {
		c.JSON(http.StatusConflict, gin.H{"erreur": "email déjà utilisé"})
		return
	}
	utilisateur.MotDePasse = ""
	c.JSON(http.StatusOK, utilisateur)
}

func getScore(c *gin.Context) {
	userID, _ := c.Get("userID")
	var nombre int64
	db.Model(&Annonce{}).Where("utilisateur_id = ?", uint(userID.(float64))).Count(&nombre)

	score := nombre * 10
	c.JSON(http.StatusOK, gin.H{"score": score})

}

func getConseils(c *gin.Context) {
	var conseil []Conseil
	db.Find(&conseil)
	c.JSON(http.StatusOK, conseil)
}

func creerConseil(c *gin.Context) {
	var nouvel Conseil
	if err := c.ShouldBindJSON(&nouvel); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erreur": " données incorrectes"})
		return
	}
	if err := db.Create(&nouvel).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erreur": "création impossible"})
		return
	}
	c.JSON(http.StatusCreated, nouvel)
}

func supprimerConseil(c *gin.Context) {
	id := c.Param("id")
	if err := db.Delete(&Conseil{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erreur": "suppression impossible"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "évènements supprimée"})
}

func sInscrire(c *gin.Context) {
	userID, _ := c.Get("userID")

	var inscription Inscription
	if err := c.ShouldBindJSON(&inscription); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erreur": "données incorrectes"})
		return
	}

	inscription.UtilisateurID = uint(userID.(float64))
	var existante Inscription
	erreur := db.Where("utilisateur_id = ? AND evenement_id = ?", inscription.UtilisateurID, inscription.EvenementID).First(&existante).Error
	if erreur == nil {
		c.JSON(http.StatusConflict, gin.H{"erreur": "vous êtes déjà inscrit à cet événement"})
		return
	}
	var evenement Evenement
	if err := db.First(&evenement, inscription.EvenementID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"erreur": "événement introuvable"})
		return
	}
	var nb int64
	db.Model(&Inscription{}).Where("evenement_id = ?", inscription.EvenementID).Count(&nb)
	if int(nb) >= evenement.CapaciteMax {
		c.JSON(http.StatusConflict, gin.H{"erreur": "événement complet"})
		return
	}
	inscription.ID = 0

	if err := db.Create(&inscription).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erreur": "inscription impossible"})
		return
	}
	c.JSON(http.StatusCreated, inscription)
}

func getMesInscriptions(c *gin.Context) {
	userID, _ := c.Get("userID")

	var inscriptions []Inscription
	db.Where("utilisateur_id = ?", uint(userID.(float64))).Find(&inscriptions)

	var evenementIDs []uint
	for _, i := range inscriptions {
		evenementIDs = append(evenementIDs, i.EvenementID)
	}

	var evenements []Evenement
	db.Where("id IN ?", evenementIDs).Find(&evenements)

	c.JSON(http.StatusOK, evenements)
}

func getConteneur(c *gin.Context) {
	var conteneur []DepotConteneur
	db.Find(&conteneur)
	c.JSON(http.StatusOK, conteneur)
}

func getmesConteneur(c *gin.Context) {
	userID, _ := c.Get("userID")

	var conteneur []DepotConteneur
	db.Where("utilisateur_id = ?", uint(userID.(float64))).Find(&conteneur)

	c.JSON(http.StatusOK, conteneur)
}

func creerConteneur(c *gin.Context) {
	var nouvel DepotConteneur
	if err := c.ShouldBindJSON(&nouvel); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erreur": "données incorrectes"})
		return
	}

	userID, _ := c.Get("userID")
	nouvel.ID = 0
	nouvel.UtilisateurID = uint(userID.(float64))
	nouvel.Statut = "EN_ATTENTE"

	var annonce Annonce
	if err := db.First(&annonce, nouvel.AnnonceID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"erreur": "annonce introuvable"})
		return
	}
	if annonce.UtilisateurID != nouvel.UtilisateurID || annonce.Statut != "VALIDE" {
		c.JSON(http.StatusForbidden, gin.H{"erreur": "annonce non valide ou qui ne vous appartient pas"})
		return
	}
	nouvel.Titre = annonce.Titre
	nouvel.Description = annonce.Description

	if err := db.Create(&nouvel).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erreur": "création impossible"})
		return
	}
	c.JSON(http.StatusCreated, nouvel)
}

func modifierConteneur(c *gin.Context) {
	id := c.Param("id")
	var conteneur DepotConteneur
	if err := db.First(&conteneur, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"erreur": "Conteneur introuvables"})
		return
	}
	conteneur.Statut = "VALIDE"
	conteneur.CodeOuverture = fmt.Sprintf("%d", rand.Intn(900000)+100000)
	conteneur.CodeBarres = fmt.Sprintf("UPC-%d", conteneur.ID)

	db.Save(&conteneur)
	c.JSON(http.StatusOK, conteneur)
}

func supprimerConteneur(c *gin.Context) {
	userID, _ := c.Get("userID")
	role, _ := c.Get("role")
	id := c.Param("id")

	var conteneur DepotConteneur
	if err := db.First(&conteneur, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"erreur": "conteneur introuvable"})
		return
	}

	if role != "admin" && conteneur.UtilisateurID != uint(userID.(float64)) {
		c.JSON(http.StatusForbidden, gin.H{"erreur": "vous ne pouvez supprimer que vos propres conteneurs"})
		return
	}

	if err := db.Delete(&DepotConteneur{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erreur": "suppression impossible"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "conteneur supprimée"})
}

func genererPDFConteneur(c *gin.Context) {
	id := c.Param("id")
	var conteneur DepotConteneur
	if err := db.First(&conteneur, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"erreur": "conteneur introuvable"})
		return
	}

	userID, _ := c.Get("userID")
	role, _ := c.Get("role")
	if role != "admin" && conteneur.UtilisateurID != uint(userID.(float64)) {
		c.JSON(http.StatusForbidden, gin.H{"erreur": "accès refusé"})
		return
	}
	if conteneur.Statut != "VALIDE" {
		c.JSON(http.StatusForbidden, gin.H{"erreur": "dépôt non validé"})
		return
	}

	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()
	pdf.SetFont("Arial", "B", 16)
	pdf.Cell(40, 10, "Justificatif de depot - UpcycleConnect")
	pdf.Ln(20)

	pdf.SetFont("Arial", "", 12)
	pdf.Cell(40, 10, "Titre : "+conteneur.Titre)
	pdf.Ln(10)
	pdf.Cell(40, 10, "Description : "+conteneur.Description)
	pdf.Ln(10)
	pdf.Cell(40, 10, "Statut : "+conteneur.Statut)
	pdf.Ln(10)
	pdf.Cell(40, 10, "Code d'ouverture : "+conteneur.CodeOuverture)
	pdf.Ln(10)
	pdf.Cell(40, 10, "Code-barres : "+conteneur.CodeBarres)

	c.Header("Content-Type", "application/pdf")
	pdf.Output(c.Writer)
}
