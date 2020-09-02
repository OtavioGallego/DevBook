package utils

import (
	"html/template"
	"net/http"
)

var templates *template.Template

// CarregarTemplates insere os templates html na variável templates
func CarregarTemplates() {
	templates = template.Must(template.ParseGlob("views/*.html"))
	templates = template.Must(templates.ParseGlob("views/templates/*.html"))
}

// ExecutarTemplate renderiza uma página html na tela
func ExecutarTemplate(w http.ResponseWriter, template string, dados interface{}) {
	templates.ExecuteTemplate(w, template, dados)
}
