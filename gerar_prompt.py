from pathlib import Path

# Ajuste para sua pasta raiz do site
project_dir = Path(r"C:\Users\JULIO\Desktop\site\V1.4")
output_file = project_dir / "site.md"

file_types = {
    ".html": "html",
    ".css": "css",
    ".js": "javascript",
}

markdown_output = []

# Agora busca recursivamente todos os arquivos na pasta e subpastas
for file_path in sorted(project_dir.rglob("*")):
    if file_path.suffix in file_types:
        lang = file_types[file_path.suffix]
        code = file_path.read_text(encoding="utf-8", errors="ignore")
        # Colocar o caminho relativo para facilitar identificação
        relative_path = file_path.relative_to(project_dir)
        section = f"## {relative_path}\n```{lang}\n{code}\n```\n"
        markdown_output.append(section)

output_file.write_text("\n\n".join(markdown_output), encoding="utf-8")
print(f">>> Prompt gerado com sucesso: {output_file}")
