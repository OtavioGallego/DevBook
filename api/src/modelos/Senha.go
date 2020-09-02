package modelos

// Senha representa o formato da requisição de alteração de senha
type Senha struct {
	Nova  string `json:"nova"`
	Atual string `json:"atual"`
}
