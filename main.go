package main

import (
	"fmt"
	"net/http"
)

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, "Novarem APi is running")
	})
	fmt.Println("Serveur lancé sur localhost")
	http.ListenAndServe(":8080", nil)
}
