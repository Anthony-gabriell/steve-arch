"""
Interface de linha de comando estilizada para o Albert IA.
Gerencia o loop de interação e comandos especiais.
"""

import sys
from typing import Optional
from rich.console import Console
from rich.panel import Panel
from rich.text import Text
from app.core.agent import AlbertAgent

# Constantes de configuração da CLI
APP_NAME = "Albert I.A"
APP_VERSION = "v0.1"
COMMANDS = {
    "/reset": "Limpa o histórico e inicia nova sessão",
    "/session": "Mostra o ID da sessão atual",
    "/ajuda": "Lista os comandos disponíveis",
    "/sair": "Encerra o Albert",
}


# Função: exibir boas vindas
def print_welcome(console: Console) -> None:
    # Exibe o painel inicial com informações do sistema.
    welcome_text = Text()
    welcome_text.append(f"Seu Agente de Física Teórica está online.\n", style="italic cyan")
    welcome_text.append("\nComandos disponíveis:\n", style="bold yellow")

    for cmd, desc in COMMANDS.items():
        welcome_text.append(f"  {cmd}", style="bold white")
        welcome_text.append(f" - {desc}\n", style="dim")

    console.print(
        Panel(
            welcome_text,
            title=f"[bold blue]{APP_NAME} {APP_VERSION}[/bold blue]",
            subtitle="[dim]Ready for theoretical inquiries[/dim]",
            border_style="blue",
            expand=False
        )
    )


# Função: processar comandos especiais
def handle_command(command: str, agent: AlbertAgent, console: Console) -> bool:
    cmd = command.lower().strip()

    if cmd == "/reset":
        agent.reset()
        console.print("[bold green]✓[/bold green] Memória de curto prazo limpa. Nova sessão iniciada.")
        return True

    elif cmd == "/session":
        console.print(f"[bold blue]ID da Sessão Atual:[/bold blue] [cyan]{agent.get_session_id()}[/cyan]")
        return True

    elif cmd == "/ajuda":
        console.print("\n[bold yellow]Comandos Disponíveis:[/bold yellow]")
        for c, desc in COMMANDS.items():
            console.print(f"  [bold white]{c}[/bold white]: {desc}")
        console.print()
        return True

    elif cmd == "/sair":
        console.print("[yellow]Encerrando conexões... Até logo, amigo.[/yellow]")
        return False

    else:
        console.print(f"[bold red]Erro:[/bold red] Comando '{cmd}' não reconhecido. Digite [bold]/ajuda[/bold].")
        return True


# Função principal: loop da CLI
def run() -> None:
    # Inicia o loop principal de interação.
    console = Console()

    try:
        # Inicializa o agente (carrega chaves, prompts e disco)
        with console.status("[bold blue]Inicializando sistemas do Albert..."):
            agent = AlbertAgent()
    except Exception as e:
        console.print(f"[bold red]Erro Fatal ao iniciar Agente:[/bold red] {e}")
        sys.exit(1)

    print_welcome(console)

    while True:
        try:
            # Lê o input do usuário com estilo
            user_input = console.input("[bold cyan]Você > [/bold cyan]").strip()

            if not user_input:
                continue

            # Verifica se é um comando especial
            if user_input.startswith("/"):
                should_continue = handle_command(user_input, agent, console)
                if not should_continue:
                    break
                continue

            # Chama o agente e inicia o streaming da resposta
            # Nota: O rótulo "Albert:" é impresso aqui, os tokens saem dentro do chat_stream
            console.print("\n[bold green]Albert:[/bold green]", end="")
            agent.chat_stream(user_input)

            # Garante que a próxima linha comece limpa após o streaming
            console.print()

        except KeyboardInterrupt:
            console.print("\n[yellow]Interrupção detectada. Use '/sair' para encerrar corretamente.[/yellow]")
            continue
        except Exception as e:
            console.print(f"[bold red]Erro na interação:[/bold red] {e}")
            continue


if __name__ == "__main__":
    run()