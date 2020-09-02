package modelos

import (
	"errors"
	"strings"
	"time"
)

// Publicacao representa uma publicação feita por um usuário
type Publicacao struct {
	ID        uint64    `json:"id,omitempty"`
	Titulo    string    `json:"titulo,omitempty"`
	Conteudo  string    `json:"conteudo,omitempty"`
	AutorID   uint64    `json:"autorId,omitempty"`
	AutorNick string    `json:"autorNick,omitempty"`
	Curtidas  uint64    `json:"curtidas"`
	CriadaEm  time.Time `json:"criadaEm,omitempty"`
}

// Preparar vai chamar os métodos para validar e formatar a publicação recebida
func (publicacao *Publicacao) Preparar() error {
	if erro := publicacao.validar(); erro != nil {
		return erro
	}

	publicacao.formatar()
	return nil
}

func (publicacao *Publicacao) validar() error {
	if publicacao.Titulo == "" {
		return errors.New("O título é obrigatório e não pode estar em branco")
	}

	if publicacao.Conteudo == "" {
		return errors.New("O conteúdo é obrigatório e não pode estar em branco")
	}

	return nil
}

func (publicacao *Publicacao) formatar() {
	publicacao.Titulo = strings.TrimSpace(publicacao.Titulo)
	publicacao.Conteudo = strings.TrimSpace(publicacao.Conteudo)
}
