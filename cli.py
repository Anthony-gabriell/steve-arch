"""
Interface de linha de comando do Steve Arch.
Gerencia o loop de interação e comandos especiais.
"""

import sys
from typing import Optional
from rich.console import Console
from rich.panel import Panel
from rich.text import Text
from app.core.SteveArchAgent import SteveArchAgent

# Constantes de configuração da CLI
APP_NAME = "Steve Arch"
APP_VERSION = "v1.0"
COMMANDS = {
    "/reset":       "Limpa o histórico e inicia nova sessão",
    "/session":     "Mostra o ID da sessão atual",
    "/ajuda":       "Lista os comandos disponíveis",
    "/sair":        "Encerra o Steve Arch",
}


def print_welcome(console: Console) -> None:
    """Exibe o painel inicial com informações do sistema."""
    welcome_text = Text()
    welcome_text.append("Arquiteto de Soluções.\n", style="italic cyan")
    welcome_text.append("Escale com inteligência.\n\n", style="bold white")
    welcome_text.append("Comandos disponíveis:\n", style="bold yellow")

    for cmd, desc in COMMANDS.items():
        welcome_text.append(f"  {cmd}", style="bold white")
        welcome_text.append(f" - {desc}\n", style="dim")

    console.print(
        Panel(
            welcome_text,
            title=f"[bold cyan]{APP_NAME} {APP_VERSION}[/bold cyan]",
            subtitle="[dim]Descreva sua solução. O Steve te ajuda a cuidar do resto.[/dim]",
            border_style="cyan",
            expand=False
        )
    )


def handle_command(command: str, agent: SteveArchAgent, console: Console) -> bool:
    """Processa comandos especiais. Retorna False para encerrar o loop."""
    cmd = command.lower().strip()

    if cmd == "/reset":
        agent.reset()
        console.print("[bold green]✓[/bold green] Sessão reiniciada. Histórico limpo.")
        return True

    elif cmd == "/session":
        console.print(f"[bold cyan]Sessão atual:[/bold cyan] [white]{agent.get_session_id()}[/white]")
        return True

    elif cmd == "/ajuda":
        console.print("\n[bold yellow]Comandos disponíveis:[/bold yellow]")
        for c, desc in COMMANDS.items():
            console.print(f"  [bold white]{c}[/bold white]: {desc}")
        console.print()
        return True

    elif cmd == "/sair":
        console.print("[cyan]Encerrando Steve Arch... Até logo.[/cyan]")
        return False

    else:
        console.print(f"[bold red]Erro:[/bold red] Comando '{cmd}' não reconhecido. Digite [bold]/ajuda[/bold].")
        return True


def run() -> None:
    """Inicia o loop principal de interação com o Steve Arch."""
    console = Console()

    try:
        with console.status("[bold cyan]Inicializando Steve Arch..."):
            agent = SteveArchAgent()
    except Exception as e:
        console.print(f"[bold red]Erro fatal ao iniciar:[/bold red] {e}")
        sys.exit(1)

    print_welcome(console)

    while True:
        try:
            user_input = console.input("[bold cyan]Você > [/bold cyan]").strip()

            if not user_input:
                continue

            if user_input.startswith("/"):
                should_continue = handle_command(user_input, agent, console)
                if not should_continue:
                    break
                continue

            console.print("\n[bold cyan]Steve >[/bold cyan] ", end="")
            agent.chat_stream(user_input)
            console.print()

        except KeyboardInterrupt:
            console.print("\n[yellow]Use '/sair' para encerrar corretamente.[/yellow]")
            continue
        except Exception as e:
            console.print(f"[bold red]Erro:[/bold red] {e}")
            continue


if __name__ == "__main__":
    run()