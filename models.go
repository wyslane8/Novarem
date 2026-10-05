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

type CategoriePrestation struct {
	gorm.Model
	Nom         string `json:"nom"`
	Description string `json:"description"`
}

type Prestation struct {
	gorm.Model
	Nom         string  `json:"nom"`
	Description string  `json:"description"`
	TypeOffre   string  `json:"type_offre"`
	Tarif       float64 `json:"tarif"`
	CapaciteMax int     `json:"capacite_max"`
}

type Evenement struct {
	gorm.Model
	Titre          string `json:"titre"`
	Description    string `json:"description"`
	DateHeureDebut string `json:"date_heure_debut"`
	DureeMinutes   int    `json:"duree_minutes"`
	CapaciteMax    int    `json:"capacite_max"`
}

type Annonce struct {
	gorm.Model
	Titre           string  `json:"titre"`
	Description     string  `json:"description"`
	DatePublication string  `json:"date_publication"`
	TypeAnnonce     string  `json:"type_annonce"`
	PrixVente       float64 `json:"prix_vente"`
	Statut          string  `json:"statut"`
	UtilisateurID   uint    `json:"utilisateur_id"`
}

type Conseil struct {
	gorm.Model
	Titre   string `json:"titre"`
	Contenu string `json:"contenu"`
}
