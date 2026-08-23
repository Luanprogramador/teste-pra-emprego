# Taskflow — Backend local

Passos para executar o servidor localmente (Node.js requerido):

1. Abra um terminal na pasta do projeto (`teste empregp`).
2. Instale dependências:

```bash
npm install
```

3. Inicie o servidor:

```bash
npm start
```

O servidor roda por padrão em `http://localhost:3000` e serve o arquivo `taskflow.html` e a API REST em `/api/*`.

Usar o botão "Sincronizar com servidor" em `taskflow.html` envia tarefas locais para o servidor e atualiza a lista com os dados do banco.
