$('#parar-de-seguir').on('click', pararDeSeguir);
$('#seguir').on('click', seguir);
$('#editar-usuario').on('submit', editar);
$('#atualizar-senha').on('submit', atualizarSenha);
$('#deletar-usuario').on('click', deletarUsuario);

function pararDeSeguir() {
    const usuarioId = $(this).data('usuario-id');
    $(this).prop('disabled', true);

    $.ajax({
        url: `/usuarios/${usuarioId}/parar-de-seguir`,
        method: "POST"
    }).done(function() {
        window.location = `/usuarios/${usuarioId}`;
    }).fail(function() {
        Swal.fire("Ops...", "Erro ao parar de seguir o usuário!", "error");
        $('#parar-de-seguir').prop('disabled', false);
    });
}

function seguir() {
    const usuarioId = $(this).data('usuario-id');
    $(this).prop('disabled', true);

    $.ajax({
        url: `/usuarios/${usuarioId}/seguir`,
        method: "POST"
    }).done(function() {
        window.location = `/usuarios/${usuarioId}`;
    }).fail(function() {
        Swal.fire("Ops...", "Erro ao seguir o usuário!", "error");
        $('#seguir').prop('disabled', false);
    });
}

function editar(evento) {
    evento.preventDefault();

    $.ajax({
        url: "/editar-usuario",
        method: "PUT",
        data: {
            nome: $('#nome').val(),
            email: $('#email').val(),
            nick: $('#nick').val(),
        }
    }).done(function() {
        Swal.fire("Sucesso!", "Usuário atualizado com sucesso!", "success")
            .then(function() {
                window.location = "/perfil";
            });
    }).fail(function() {
        Swal.fire("Ops...", "Erro ao atualizar o usuário!", "error");
    });
}

function atualizarSenha(evento) {
    evento.preventDefault();

    if ($('#nova-senha').val() != $('#confirmar-senha').val()) {
        Swal.fire("Ops...", "As senhas não coincidem!", "warning");
        return;
    }

    $.ajax({
        url: "/atualizar-senha",
        method: "POST",
        data: {
            atual: $('#senha-atual').val(),
            nova: $('#nova-senha').val()
        }
    }).done(function() {
        Swal.fire("Sucesso!", "A senha foi atualizada com sucesso!", "success")
            .then(function() {
                window.location = "/perfil";
            })
    }).fail(function() {
        Swal.fire("Ops...", "Erro ao atualizar a senha!", "error");
    });
}

function deletarUsuario() {
    Swal.fire({
        title: "Atenção!",
        text: "Tem certeza que deseja apagar a sua conta? Essa é uma ação irreversível!",
        showCancelButton: true,
        cancelButtonText: "Cancelar",
        icon: "warning"
    }).then(function(confirmacao) {
        if (confirmacao.value) {
            $.ajax({
                url: "/deletar-usuario",
                method: "DELETE"
            }).done(function() {
                Swal.fire("Sucesso!", "Seu usuário foi excluído com sucesso!", "success")
                    .then(function() {
                        window.location = "/logout";
                    })
            }).fail(function() {
                Swal.fire("Ops...", "Ocorreu um erro ao excluir o seu usuário!", "error");
            });
        }
    })
}