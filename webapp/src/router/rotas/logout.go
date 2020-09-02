package rotas

import (
	"net/http"
	"webapp/src/controllers"
)

var rotaLogout = Rota{
	URI:                "/logout",
	Metodo:             http.MethodGet,
	Funcao:             controllers.FazerLogout,
	RequerAutenticacao: true,
}
