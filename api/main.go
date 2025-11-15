package main

import (
	"fmt"
	"net/http"
)

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "MiniDocs API is running")
	})
	fmt.Println("API listening on :8080")
	fmt.Println("Shayanny here! :)")
	http.ListenAndServe(":8080", nil)
}
