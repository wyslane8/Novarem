package main

import "gorm.io/gorm"

//gorm.model = raccouri qui ajoute 4 champs invisible (id, created at, updatedAt deletedat) comment on sait quelle ssont les champs en question?
//`json:"-"` le - renvoie a gin de ne jamais renvoyer ce champ dans une réponse JSON c'est pour des raisons de sécurité, on veut pas que le mdp parte dans une reponse API par erreur

type Utilisateur struct {
	gorm.Model
	Nom        string `json:"nom"`
	Email      string `json:"email" gorm:"unique"`
	MotDePasse string `json:"mot_de_passe"`
	Role       string `json:"role"`
}
