package main

import (
	"fmt"
	"net/http"

	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// variable globale qui va contenir la connexion à la base
var db *gorm.DB

func main() {
	var err error
	//gorm.Open... = ouvre ou crée un fichier novarem.db qui sera la BDD, gestion des erreurs
	db, err = gorm.Open(sqlite.Open("novarem.db"), &gorm.Config{})
	if err != nil {
		panic("Impossible de se connecter à la BDD")
	}

	//si la utilisateur n'existe pas dans novarem.db elle crée automatiquement une table correspondante
	db.AutoMigrate(&Utilisateur{})

	fmt.Println("BDD table Utilisateur créée avec succès")

	//créer le serveur Gin
	r := gin.Default()

	//quand qn appelles /utilisateurs on execute la fonction getUtilisateurs qui recupere tous les user de la base (db.find) et les renvoie avce un code 200 (http.StatusOK)
	r.GET("/utilisateurs", getUtilisateurs)
	r.POST("/utilisateurs", creerUtilisateur)
	r.PUT("/utilisateurs/:id", modifierUtilisateur)
	r.DELETE("/utilisateurs/:id", authAdmin(), supprimerUtilisateur)
	r.POST("/login", login)
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
	//prend le JSOn envoyé par le front et le transofme en struct Utilisateurs , gerer les erreur erreur 400
	if err := c.ShouldBindJSON(&nouvel); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erreur": "données incorrects"})
		return
	}

	//transorme le mdp en clair en un hash illisible
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
	if err := c.ShouldBindJSON(&utilisateur); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erreur": "données incorrectes"})
		return
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

// clé du serveur , utilisée pour signer et verifier les token, pour l'instant je l'ai mise ici mais je devrais la mettre dans une variable d'envionnement
var cleSecrete = []byte("change-moi-en-vrai-secret")

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
	})

	//signe le token avec la clé secrete poru que personne ne puisse le modif/supp
	tokenSigne, err := token.SignedString(cleSecrete)
	if err != nil {
		fmt.Println("ERREUR JWR:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"erreur": "erreur lors de la génération du token"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"token": tokenSigne})
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
